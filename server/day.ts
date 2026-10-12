// The bakery's list for one pickup day: one-off orders from the form plus the
// regular orders due that day, and the email that carries it.
//
// The subject is constant per pickup day, so Gmail threads every update and
// the last message in the thread is always the current list. The cron sends
// a final version once the day can no longer be ordered for.

import type { Redis } from '@upstash/redis'
import {
  KEY_PREFIX,
  SUBJECT_PREFIX,
  addDays,
  capitalize,
  escapeHtml,
  formatPickupDate,
  formatPrice,
  linkSecretConfigured,
  manageUrl,
} from './common.js'
import type { Catalog } from './catalog.js'
import { activeSubs, isDue, itemsOn, type Customer, type PricedItem } from './subscriptions.js'

export type OrderPayload = {
  customer: Customer
  pickup: { jour: string; date: string } // date is YYYY-MM-DD
  remarques?: string
  items: string // "2x Pain Gris levain — €7,80\n1x Baguette tradition — €2,50"
  total: number
}

export type StoredOrder = OrderPayload & {
  receivedAt: string
  /** Set when this order started a regular order. */
  subscriptionId?: string
}

export type DayEntry = {
  kind: 'order' | 'subscription'
  customer: Customer
  remarques?: string
  items: PricedItem[]
  /** Products of a regular order not made that day (season, Saturday only, removed). */
  unavailable: string[]
  /** Null when prices could not be read (Sanity down). */
  total: number | null
  receivedAt: string
  subscriptionId?: string
  /** Bakery link to the regular order (end it). */
  bakeryUrl?: string
}

const ordersKey = (date: string) => `${KEY_PREFIX}orders:${date}`

/** Set once the final list for `date` went out (server/daily.ts). */
export const finalListKey = (date: string) => `${KEY_PREFIX}final:${date}`

export async function finalListSent(redis: Redis, date: string): Promise<boolean> {
  return (await redis.get(finalListKey(date))) === 'sent'
}

/** "2x Pain Gris levain — €7,80" lines → items. */
export function parseOrderItems(items: string): PricedItem[] {
  return items
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): PricedItem | null => {
      const m = line.match(/^(\d+)x\s+(.+?)\s+—\s+€(\d+,\d{2})$/)
      if (!m) return null
      return { qty: parseInt(m[1], 10), name: m[2].trim(), amount: parseFloat(m[3].replace(',', '.')) }
    })
    .filter((x): x is PricedItem => x !== null)
}

function parseStored(v: unknown): StoredOrder | null {
  try {
    return (typeof v === 'string' ? JSON.parse(v) : v) as StoredOrder
  } catch {
    return null
  }
}

/**
 * Stores a one-off order under its pickup day and returns a way to take it
 * back out if the bakery's email then fails — otherwise the customer's retry
 * would list it twice.
 */
export async function storeOrder(redis: Redis, order: StoredOrder): Promise<() => Promise<void>> {
  const key = ordersKey(order.pickup.date)
  const entry = JSON.stringify(order)
  await redis.lpush(key, entry)
  // 60 days past the last write: long enough for any post-mortem ("I never
  // ordered that"), short enough to keep storage tiny.
  await redis.expire(key, 60 * 24 * 3600)
  return async () => {
    try {
      await redis.lrem(key, 1, entry)
    } catch (e) {
      console.error('[day] could not remove the undelivered order from Redis', e)
    }
  }
}

/** Every order for `date`: one-off orders, then the regular orders due that day. */
export async function dayEntries(redis: Redis, date: string, catalog: Catalog | null): Promise<DayEntry[]> {
  const raw = await redis.lrange(ordersKey(date), 0, -1)
  const links = linkSecretConfigured()
  const entries: DayEntry[] = raw
    .map(parseStored)
    .filter((o): o is StoredOrder => o !== null)
    .map((o) => ({
      kind: 'order' as const,
      customer: o.customer,
      remarques: o.remarques,
      items: parseOrderItems(o.items),
      unavailable: [],
      total: o.total,
      receivedAt: o.receivedAt,
      subscriptionId: o.subscriptionId,
      bakeryUrl: o.subscriptionId && links ? manageUrl('bakery', o.subscriptionId) : undefined,
    }))
    .sort((a, b) => (a.receivedAt || '').localeCompare(b.receivedAt || ''))

  const subs = (await activeSubs(redis))
    .filter((s) => isDue(s, date, catalog))
    .sort((a, b) => `${a.customer.nom} ${a.customer.prenom}`.localeCompare(`${b.customer.nom} ${b.customer.prenom}`))
  for (const s of subs) {
    const { items, unavailable, total } = itemsOn(s, date, catalog)
    entries.push({
      kind: 'subscription',
      customer: s.customer,
      remarques: s.remarques,
      items,
      unavailable,
      total,
      receivedAt: s.createdAt,
      subscriptionId: s.id,
      bakeryUrl: links ? manageUrl('bakery', s.id) : undefined,
    })
  }
  return entries
}

// ── Bakery email ────────────────────────────────────────────────────────

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

function entryNote(e: DayEntry, jour: string, date: string): string | null {
  if (e.kind === 'subscription') return `Commande régulière (chaque ${jour})`
  if (e.subscriptionId) {
    return `Nouvelle commande régulière : chaque ${jour}, dès le ${formatPickupDate(addDays(date, 7))}`
  }
  return null
}

export function buildBakerDigest(
  entries: DayEntry[],
  pickup: { jour: string; date: string },
  opts: { final: boolean }
) {
  const { jour, date } = pickup
  const dateFr = formatPickupDate(date)
  const subject = `${SUBJECT_PREFIX}${capitalize(jour)} ${dateFr} — Commandes`

  const totals = new Map<string, number>()
  let grandTotal = 0
  let pricesMissing = false
  for (const e of entries) {
    if (e.total === null) pricesMissing = true
    grandTotal += e.total ?? 0
    for (const i of e.items) totals.set(i.name, (totals.get(i.name) || 0) + i.qty)
  }
  const sortedTotals = [...totals.entries()].sort((a, b) => b[1] - a[1])
  const regular = entries.filter((e) => e.kind === 'subscription').length
  const countLine = `${plural(entries.length, 'commande')}${regular ? ` (dont ${regular} régulière${regular > 1 ? 's' : ''})` : ''}`
  const amount = (e: DayEntry) => (e.total === null ? 'prix ?' : formatPrice(e.total))
  const itemsText = (e: DayEntry) => e.items.map((i) => `${i.qty}× ${i.name}`).join(', ') || '—'
  const caisse = `${formatPrice(grandTotal)}${pricesMissing ? ' (sans les commandes régulières : prix momentanément indisponibles)' : ''}`

  const banner = opts.final
    ? {
        text: [
          `  ✓ LISTE DÉFINITIVE — les commandes pour ce jour sont closes.`,
          `    Cette liste ne changera plus.`,
        ],
        html: [
          '✓ Liste définitive — les commandes pour ce jour sont closes.',
          'Cette liste ne changera plus. Les commandes régulières y sont comprises.',
        ],
      }
    : {
        text: [
          `  ✓ LISTE À JOUR — toutes les commandes pour ce jour`,
          `    sont dans CE message.`,
          `    Les messages précédents de ce fil sont obsolètes.`,
        ],
        html: [
          '✓ Liste à jour — toutes les commandes pour ce jour sont dans ce message.',
          'Les messages précédents de ce fil sont des versions antérieures (obsolètes).',
        ],
      }

  const text = [
    `═══════════════════════════════════════════════════════`,
    ...banner.text,
    `═══════════════════════════════════════════════════════`,
    ``,
    `${jour.toUpperCase()} ${dateFr} — ${countLine}`,
    ``,
    `À PRÉPARER :`,
    ...sortedTotals.map(([name, qty]) => `  ${String(qty).padStart(3)}×  ${name}`),
    ``,
    `RETRAITS :`,
    ...entries.map((e) => {
      const contact = e.customer.tel ? `${e.customer.email} · ${e.customer.tel}` : e.customer.email
      const note = entryNote(e, jour, date)
      return [
        `  • ${e.customer.nom}, ${e.customer.prenom}  —  ${itemsText(e)}  —  ${amount(e)}`,
        `    ${contact}`,
        note ? `    ${note}${e.bakeryUrl ? ` · gérer / arrêter : ${e.bakeryUrl}` : ''}` : null,
        e.unavailable.length ? `    Pas préparé ce jour (indisponible) : ${e.unavailable.join(', ')}` : null,
        e.remarques ? `    Remarque: ${e.remarques}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    }),
    ``,
    `Total caisse : ${caisse}`,
  ].join('\n')

  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; color: #2D1F14; max-width: 640px; line-height: 1.5;">
      <div style="background: ${opts.final ? '#E4EDDF' : '#F0E8DD'}; border-radius: 8px; padding: 14px 18px; margin: 0 0 24px;">
        <div style="font-weight: 600; color: #2D1F14; font-size: 14px; margin-bottom: 4px;">${escapeHtml(banner.html[0])}</div>
        <div style="color: #6E4D32; font-size: 13px;">${escapeHtml(banner.html[1])}</div>
      </div>
      <h2 style="margin: 0 0 8px; font-size: 20px; color: #2D1F14;">
        ${escapeHtml(capitalize(jour))} ${escapeHtml(dateFr)}
      </h2>
      <p style="margin: 0 0 24px; color: #6E4D32;">${escapeHtml(countLine)}</p>

      <h3 style="margin: 24px 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #A67C52;">
        À préparer
      </h3>
      <table style="border-collapse: collapse; margin: 0 0 24px;">
        ${sortedTotals
          .map(
            ([name, qty]) => `
          <tr>
            <td style="padding: 4px 16px 4px 0; font-weight: 600; text-align: right; min-width: 40px;">${qty}×</td>
            <td style="padding: 4px 0;">${escapeHtml(name)}</td>
          </tr>`
          )
          .join('')}
      </table>

      <h3 style="margin: 24px 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #A67C52;">
        Retraits
      </h3>
      <table style="border-collapse: collapse; width: 100%;">
        ${entries
          .map((e) => {
            const items = e.items.map((i) => `${i.qty}× ${escapeHtml(i.name)}`).join(', ') || '—'
            const mail = `<a href="mailto:${encodeURIComponent(e.customer.email)}" style="color: #6E4D32;">${escapeHtml(e.customer.email)}</a>`
            const contactLine = e.customer.tel
              ? `${mail} · <a href="tel:${escapeHtml(e.customer.tel.replace(/\s/g, ''))}" style="color: #6E4D32;">${escapeHtml(e.customer.tel)}</a>`
              : mail
            const note = entryNote(e, jour, date)
            return `
              <tr style="border-top: 1px solid #F5EDE3;">
                <td style="padding: 12px 0; vertical-align: top;">
                  <div style="font-weight: 600;">${escapeHtml(e.customer.nom)}, ${escapeHtml(e.customer.prenom)}</div>
                  <div style="color: #8B7A6B; font-size: 13px; margin-top: 2px;">${contactLine}</div>
                  ${
                    note
                      ? `<div style="margin-top: 6px; font-size: 13px;"><span style="background: #F0E8DD; color: #6E4D32; border-radius: 4px; padding: 1px 6px;">${escapeHtml(note)}</span>${
                          e.bakeryUrl
                            ? ` <a href="${escapeHtml(e.bakeryUrl)}" style="color: #A67C52; font-size: 12px;">gérer / arrêter</a>`
                            : ''
                        }</div>`
                      : ''
                  }
                  <div style="margin-top: 6px;">${items}</div>
                  ${
                    e.unavailable.length
                      ? `<div style="color: #B22222; font-size: 13px; margin-top: 4px;">Pas préparé ce jour (indisponible) : ${escapeHtml(e.unavailable.join(', '))}</div>`
                      : ''
                  }
                  ${e.remarques ? `<div style="color: #6E4D32; font-style: italic; font-size: 13px; margin-top: 4px;">Remarque : ${escapeHtml(e.remarques)}</div>` : ''}
                </td>
                <td style="padding: 12px 0; text-align: right; vertical-align: top; white-space: nowrap; font-weight: 600;">
                  ${escapeHtml(amount(e))}
                </td>
              </tr>`
          })
          .join('')}
      </table>

      <p style="margin: 24px 0 0; padding-top: 16px; border-top: 2px solid #2D1F14; font-weight: 600; text-align: right;">
        Total caisse : ${escapeHtml(caisse)}
      </p>
    </div>
  `

  return { subject, text, html }
}

/**
 * Fallback if Redis is unreachable: a single-order summary so the order isn't
 * lost. Same shape as the old per-order email.
 */
export function buildBakerSingleOrder(order: OrderPayload) {
  const { customer, pickup, remarques, items, total } = order
  const dateFr = formatPickupDate(pickup.date)
  const subject = `${SUBJECT_PREFIX}Nouvelle commande — ${customer.prenom} ${customer.nom} — retrait ${capitalize(pickup.jour)} ${dateFr}`

  const text = [
    `Nouvelle commande reçue.`,
    ``,
    `Client : ${customer.prenom} ${customer.nom}`,
    `Email  : ${customer.email}`,
    customer.tel ? `Tél    : ${customer.tel}` : null,
    ``,
    `Retrait : ${capitalize(pickup.jour)} ${dateFr}`,
    ``,
    `Commande :`,
    items,
    ``,
    `Total : ${formatPrice(total)}`,
    remarques ? `\nRemarques : ${remarques}` : null,
    ``,
    `⚠ Cette commande a été envoyée individuellement (le récapitulatif du jour était momentanément indisponible).`,
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; color: #2D1F14; max-width: 560px;">
      <p>Nouvelle commande reçue.</p>
      <p>
        <strong>Client</strong><br>
        ${escapeHtml(customer.prenom)} ${escapeHtml(customer.nom)}<br>
        <a href="mailto:${encodeURIComponent(customer.email)}">${escapeHtml(customer.email)}</a>
        ${customer.tel ? `<br><a href="tel:${escapeHtml(customer.tel.replace(/\s/g, ''))}">${escapeHtml(customer.tel)}</a>` : ''}
      </p>
      <p><strong>Retrait</strong><br>${escapeHtml(capitalize(pickup.jour))} ${escapeHtml(dateFr)}</p>
      <p><strong>Commande</strong></p>
      <ul style="padding-left: 1.2em;">${items
        .split('\n')
        .map((l) => `<li style="margin: 4px 0;">${escapeHtml(l)}</li>`)
        .join('')}</ul>
      <p><strong>Total : ${escapeHtml(formatPrice(total))}</strong></p>
      ${remarques ? `<p><strong>Remarques</strong><br>${escapeHtml(remarques)}</p>` : ''}
      <p style="color: #8B6340; font-size: 12px; margin-top: 24px;">
        ⚠ Cette commande a été envoyée individuellement (le récapitulatif du jour était momentanément indisponible).
      </p>
    </div>
  `

  return { subject, text, html }
}
