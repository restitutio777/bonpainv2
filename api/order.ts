// Vercel Serverless Function — receives orders from the OrderForm.
//
// Flow per request:
//   1. Check the payload: field formats, product names against Sanity, and
//      that the customer's email domain exists. Apply the abuse limits.
//   2. Store the order in Upstash Redis under `orders:{pickupDateISO}` and
//      read back ALL orders for that pickup day.
//   3. Send Benjamin a DIGEST email with aggregate counts + per-customer
//      list — subject is constant per pickup day so Gmail threads them.
//   4. Only once Benjamin's email is accepted, send the customer a
//      confirmation.
//
// The response always says what actually happened, because the form shows
// it to the customer: an order Benjamin did not receive is an error, and a
// confirmation that could not be sent is reported as such. (The old PHP site
// derived "sent" from the return value of mail() and told every customer a
// confirmation was on its way while many never got one.)
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY         — from https://resend.com/api-keys
//   ORDER_TO_EMAIL         — Benjamin's inbox, e.g. bonpain.artisan@gmail.com
//   ORDER_FROM_EMAIL       — verified Resend sender, e.g. orders@bonpainfaitmain.be
//   ORDER_TO_EMAIL_PREVIEW — optional: where preview deployments send the
//                            bakery mail (default: the test order's own address)
//   KV_REST_API_URL        — auto-injected by Vercel/Upstash integration
//   KV_REST_API_TOKEN      — auto-injected by Vercel/Upstash integration
//
// Degradation:
//   - No Resend keys → 503, the form tells the customer to phone.
//   - No Redis → single-order email to Benjamin instead of the digest, and
//     no rate limits (the payload checks still apply).

import { createHash } from 'node:crypto'
import { Resolver } from 'node:dns/promises'
import { Resend } from 'resend'
import { Redis } from '@upstash/redis'

type OrderPayload = {
  customer: { nom: string; prenom: string; email: string; tel?: string }
  pickup: { jour: string; date: string } // date is YYYY-MM-DD from <input type="date">
  remarques?: string
  items: string // "2x Pain Gris levain — €7,80\n1x Baguette tradition — €2,50"
  total: number
}

type StoredOrder = OrderPayload & { receivedAt: string }

// Preview deployments share the production env vars and Redis store. Keep
// their orders out of the real day lists and their mail away from the bakery.
const IS_PRODUCTION = process.env.VERCEL_ENV === 'production'
const KEY_PREFIX = IS_PRODUCTION ? '' : 'preview:'
const SUBJECT_PREFIX = IS_PRODUCTION ? '' : '[TEST] '

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

// The form submits the weekday lowercased ("mercredi"); the emails read
// better capitalized, and the transform is deterministic so the digest
// subject stays constant per pickup day (Gmail threading depends on that).
const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

const formatPrice = (n: number) => `€${n.toFixed(2).replace('.', ',')}`

const formatPickupDate = (iso: string): string => {
  // YYYY-MM-DD → DD/MM/YYYY (display in subject + body, French convention)
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

const parseOrderItems = (items: string): Array<{ qty: number; name: string }> => {
  // Lines from OrderForm look like: "2x Pain Gris levain — €7,80"
  // We only need qty + name for the per-day aggregate.
  return items
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(\d+)x\s+(.+?)\s+—\s+€/)
      if (!m) return null
      return { qty: parseInt(m[1], 10), name: m[2].trim() }
    })
    .filter((x): x is { qty: number; name: string } => x !== null)
}

function buildBakerDigest(orders: StoredOrder[], pickup: { jour: string; date: string }) {
  const dateFr = formatPickupDate(pickup.date)
  // Constant subject per pickup day so Gmail threads all digests together.
  const subject = `${SUBJECT_PREFIX}${capitalize(pickup.jour)} ${dateFr} — Commandes`

  // Aggregate item totals across all orders for this pickup day.
  const totals = new Map<string, number>()
  let grandTotal = 0
  for (const o of orders) {
    grandTotal += o.total || 0
    for (const item of parseOrderItems(o.items)) {
      totals.set(item.name, (totals.get(item.name) || 0) + item.qty)
    }
  }
  const sortedTotals = [...totals.entries()].sort((a, b) => b[1] - a[1])

  // Sort orders by received time (oldest first) for stable display.
  const sortedOrders = [...orders].sort((a, b) =>
    (a.receivedAt || '').localeCompare(b.receivedAt || '')
  )

  // Build plain-text version
  const textLines = [
    `═══════════════════════════════════════════════════════`,
    `  ✓ LISTE À JOUR — toutes les commandes pour ce jour`,
    `    sont dans CE message.`,
    `    Les messages précédents de ce fil sont obsolètes.`,
    `═══════════════════════════════════════════════════════`,
    ``,
    `${pickup.jour.toUpperCase()} ${dateFr} — ${orders.length} commande${orders.length > 1 ? 's' : ''}`,
    ``,
    `À PRÉPARER :`,
    ...sortedTotals.map(([name, qty]) => `  ${String(qty).padStart(3)}×  ${name}`),
    ``,
    `RETRAITS :`,
    ...sortedOrders.map((o) => {
      const items = parseOrderItems(o.items)
        .map((i) => `${i.qty}× ${i.name}`)
        .join(', ')
      const contact = o.customer.tel ? `${o.customer.email} · ${o.customer.tel}` : o.customer.email
      return `  • ${o.customer.nom}, ${o.customer.prenom}  —  ${items}  —  ${formatPrice(o.total)}\n    ${contact}${o.remarques ? `\n    Remarque: ${o.remarques}` : ''}`
    }),
    ``,
    `Total caisse : ${formatPrice(grandTotal)}`,
  ]
  const text = textLines.join('\n')

  // Build HTML version
  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; color: #2D1F14; max-width: 640px; line-height: 1.5;">
      <div style="background: #F0E8DD; border-radius: 8px; padding: 14px 18px; margin: 0 0 24px;">
        <div style="font-weight: 600; color: #2D1F14; font-size: 14px; margin-bottom: 4px;">
          ✓ Liste à jour — toutes les commandes pour ce jour sont dans ce message.
        </div>
        <div style="color: #6E4D32; font-size: 13px;">
          Les messages précédents de ce fil sont des versions antérieures (obsolètes).
        </div>
      </div>
      <h2 style="margin: 0 0 8px; font-size: 20px; color: #2D1F14;">
        ${escapeHtml(capitalize(pickup.jour))} ${escapeHtml(dateFr)}
      </h2>
      <p style="margin: 0 0 24px; color: #6E4D32;">
        ${orders.length} commande${orders.length > 1 ? 's' : ''}
      </p>

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
        ${sortedOrders
          .map((o) => {
            const items = parseOrderItems(o.items)
              .map((i) => `${i.qty}× ${escapeHtml(i.name)}`)
              .join(', ')
            const contactLine = o.customer.tel
              ? `<a href="mailto:${encodeURIComponent(o.customer.email)}" style="color: #6E4D32;">${escapeHtml(o.customer.email)}</a> · <a href="tel:${escapeHtml(o.customer.tel.replace(/\s/g, ''))}" style="color: #6E4D32;">${escapeHtml(o.customer.tel)}</a>`
              : `<a href="mailto:${encodeURIComponent(o.customer.email)}" style="color: #6E4D32;">${escapeHtml(o.customer.email)}</a>`
            return `
              <tr style="border-top: 1px solid #F5EDE3;">
                <td style="padding: 12px 0; vertical-align: top;">
                  <div style="font-weight: 600;">${escapeHtml(o.customer.nom)}, ${escapeHtml(o.customer.prenom)}</div>
                  <div style="color: #8B7A6B; font-size: 13px; margin-top: 2px;">${contactLine}</div>
                  <div style="margin-top: 6px;">${items}</div>
                  ${o.remarques ? `<div style="color: #6E4D32; font-style: italic; font-size: 13px; margin-top: 4px;">Remarque : ${escapeHtml(o.remarques)}</div>` : ''}
                </td>
                <td style="padding: 12px 0; text-align: right; vertical-align: top; white-space: nowrap; font-weight: 600;">
                  ${escapeHtml(formatPrice(o.total))}
                </td>
              </tr>`
          })
          .join('')}
      </table>

      <p style="margin: 24px 0 0; padding-top: 16px; border-top: 2px solid #2D1F14; font-weight: 600; text-align: right;">
        Total caisse : ${escapeHtml(formatPrice(grandTotal))}
      </p>
    </div>
  `

  return { subject, text, html }
}

// Fallback if Redis is unreachable: send a single-order summary so the
// order isn't lost. Same shape as old per-order email.
function buildBakerSingleOrder(order: OrderPayload) {
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

function buildCustomerConfirmation(order: OrderPayload) {
  const { customer, pickup, items, total } = order
  const dateFr = formatPickupDate(pickup.date)
  // The pickup day in the subject also identifies the order in a bounce
  // notice (see api/resend-webhook.ts), which only carries the subject.
  const subject = `${SUBJECT_PREFIX}Votre commande chez Bon Pain Fait Main — retrait ${capitalize(pickup.jour)} ${dateFr}`

  const text = [
    `Bonjour ${customer.prenom},`,
    ``,
    `Merci, on a bien reçu votre commande. Cet e-mail est votre confirmation.`,
    ``,
    `Retrait : ${capitalize(pickup.jour)} ${dateFr}`,
    `Adresse : Rue de la Roer 19, 4950 Waimes`,
    ``,
    `Votre commande :`,
    items,
    ``,
    `Total : ${formatPrice(total)}`,
    ``,
    `Pour modifier ou annuler, répondez simplement à cet email ou appelez le +32 493 21 09 25.`,
    ``,
    `À bientôt au fournil,`,
    `Benjamin & Nadia`,
  ].join('\n')

  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; color: #2D1F14; max-width: 560px; line-height: 1.6;">
      <p>Bonjour ${escapeHtml(customer.prenom)},</p>
      <p>Merci, on a bien reçu votre commande. Cet e-mail est votre confirmation.</p>
      <p>
        <strong>Retrait</strong><br>
        ${escapeHtml(capitalize(pickup.jour))} ${escapeHtml(dateFr)}<br>
        <span style="color: #6E4D32;">Rue de la Roer 19, 4950 Waimes</span>
      </p>
      <p><strong>Votre commande</strong></p>
      <ul style="padding-left: 1.2em;">${items
        .split('\n')
        .map((l) => `<li style="margin: 4px 0;">${escapeHtml(l)}</li>`)
        .join('')}</ul>
      <p><strong>Total : ${escapeHtml(formatPrice(total))}</strong></p>
      <p style="color: #6E4D32;">
        Pour modifier ou annuler, répondez simplement à cet email
        ou appelez le <a href="tel:+32493210925">+32 493 21 09 25</a>.
      </p>
      <p>À bientôt au fournil,<br>Benjamin &amp; Nadia</p>
    </div>
  `

  return { subject, text, html }
}

/**
 * Stores the order and returns every order for that pickup day, plus a way
 * to take this one back out if Benjamin's email then fails — otherwise the
 * customer's retry would list it twice in the next digest.
 */
async function storeAndFetchDay(
  redis: Redis,
  order: OrderPayload
): Promise<{ orders: StoredOrder[]; unstore: () => Promise<void> } | null> {
  const key = `${KEY_PREFIX}orders:${order.pickup.date}`
  const entry = JSON.stringify({ ...order, receivedAt: new Date().toISOString() } satisfies StoredOrder)
  try {
    await redis.lpush(key, entry)
    // Keep the key for 60 days past last write — long enough for any
    // post-mortem (claim "I never ordered that"), short enough to keep
    // storage tiny.
    await redis.expire(key, 60 * 24 * 3600)
    const raw = await redis.lrange(key, 0, -1)
    return {
      orders: raw.map((v) => (typeof v === 'string' ? JSON.parse(v) : (v as StoredOrder))),
      unstore: async () => {
        try {
          await redis.lrem(key, 1, entry)
        } catch (e) {
          console.error('[order] could not remove the undelivered order from Redis', e)
        }
      },
    }
  } catch (e) {
    console.error('[order] Redis lpush/lrange failed', e)
    return null
  }
}

// ── Checks ──────────────────────────────────────────────────────────────
// The endpoint is public and the confirmation goes to whatever address the
// payload carries, so everything that ends up in that mail is checked: the
// first name, the pickup day and the item lines. No links anywhere.

const MAX = {
  name: 80,
  email: 160,
  tel: 40,
  remarques: 1000,
  items: 4000,
  lines: 30,
  qty: 20, // same cap as the form's +/- buttons
}

const LIMITS = {
  perIpPerHour: 6,
  perAddressPerDay: 5,
  // Resend Free sends 100 mails a day and every order costs two. The old
  // site's busiest day had 15 orders. Past this, the form asks people to
  // phone instead of failing later on the mail quota.
  perDay: 40,
}

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)
const NAME = /^[\p{L}\p{M}][\p{L}\p{M}'’ .-]*$/u
// "site.com" — a dot glued between word characters reads as a domain.
const DOMAIN_LIKE = /[\p{L}\d-]\.\p{L}{2,}/u
const LINK = /https?:\/\/|www\./i
const TEL = /^[0-9+()./\s-]*$/
const ITEM_LINE = /^(\d{1,2})x (.{1,80}?) — €(\d{1,4},\d{2})$/
// Used only while Sanity is unreachable: product names have no dots,
// slashes, colons or @, so nothing in a line can become a link.
const ITEM_NAME_FALLBACK = /^[\p{L}\p{M}0-9'’ (),-]+$/u

type Rejection = { status: number; body: Record<string, unknown> }
type ItemLine = { qty: number; name: string; amount: number }

const invalid = (field: string): Rejection => ({ status: 400, body: { error: 'invalid', field } })
const hasLink = (field: string): Rejection => ({ status: 400, body: { error: 'links', field } })

const isRejection = (x: unknown): x is Rejection =>
  typeof x === 'object' && x !== null && 'status' in x && 'body' in x

function checkName(v: unknown, field: string): Rejection | string {
  if (typeof v !== 'string' || !v.trim() || v.length > MAX.name) return invalid(field)
  const s = v.trim()
  if (LINK.test(s) || DOMAIN_LIKE.test(s) || s.includes('@')) return hasLink(field)
  return NAME.test(s) ? s : invalid(field)
}

function checkOptional(v: unknown, max: number, field: string): Rejection | string | undefined {
  if (v === undefined || v === null || v === '') return undefined
  if (typeof v !== 'string' || v.length > max) return invalid(field)
  return v.trim() || undefined
}

/** Returns a cleaned order (trimmed fields, total recomputed from the lines) or a rejection. */
function checkPayload(raw: unknown): { order: OrderPayload; lines: ItemLine[] } | Rejection {
  const o = raw as Partial<OrderPayload> | null
  if (!o || typeof o !== 'object' || !o.customer || !o.pickup) return invalid('payload')
  const c = o.customer

  const nom = checkName(c.nom, 'nom')
  if (isRejection(nom)) return nom
  const prenom = checkName(c.prenom, 'prenom')
  if (isRejection(prenom)) return prenom

  if (typeof c.email !== 'string' || c.email.length > MAX.email) return invalid('email')
  const email = c.email.trim()
  if (!isEmail(email)) return invalid('email')

  const tel = checkOptional(c.tel, MAX.tel, 'tel')
  if (isRejection(tel)) return tel
  if (tel && !TEL.test(tel)) return invalid('tel')

  const remarques = checkOptional(o.remarques, MAX.remarques, 'remarques')
  if (isRejection(remarques)) return remarques
  if (remarques && LINK.test(remarques)) return hasLink('remarques')

  const jour = typeof o.pickup.jour === 'string' ? o.pickup.jour.toLowerCase() : ''
  const date = typeof o.pickup.date === 'string' ? o.pickup.date : ''
  if (!WEEKDAYS.includes(jour)) return invalid('jour')
  const day = new Date(`${date}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(day.getTime())) return invalid('date')
  if (day.toISOString().slice(0, 10) !== date) return invalid('date') // 2026-02-31 etc.
  if (WEEKDAYS[day.getUTCDay()] !== jour) return invalid('date')
  if (day.getTime() < Date.now() - 2 * 24 * 3600 * 1000) return invalid('date')

  if (typeof o.items !== 'string' || o.items.length > MAX.items) return invalid('items')
  const rawLines = o.items.split('\n').map((l) => l.trim()).filter(Boolean)
  if (rawLines.length === 0 || rawLines.length > MAX.lines) return invalid('items')
  const lines: ItemLine[] = []
  for (const line of rawLines) {
    const m = line.match(ITEM_LINE)
    if (!m) return invalid('items')
    const qty = parseInt(m[1], 10)
    if (qty < 1 || qty > MAX.qty) return invalid('items')
    lines.push({ qty, name: m[2], amount: parseFloat(m[3].replace(',', '.')) })
  }

  const total = Math.round(lines.reduce((sum, l) => sum + l.amount, 0) * 100) / 100

  return {
    order: {
      customer: { nom, prenom, email, ...(tel ? { tel } : {}) },
      pickup: { jour, date },
      ...(remarques ? { remarques } : {}),
      items: rawLines.join('\n'),
      total,
    },
    lines,
  }
}

const SANITY_PROJECT = process.env.VITE_SANITY_PROJECT_ID || '5f1udd5l'
const SANITY_DATASET = process.env.VITE_SANITY_DATASET || 'production'
const PRODUCT_NAMES_URL =
  `https://${SANITY_PROJECT}.apicdn.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}` +
  `?query=${encodeURIComponent('*[_type == "product"].name')}`

/** Product names as the form shows them (same public CDN), or null when Sanity is unreachable. */
async function productNames(): Promise<Set<string> | null> {
  try {
    const res = await fetch(PRODUCT_NAMES_URL, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { result } = (await res.json()) as { result?: unknown }
    if (!Array.isArray(result)) throw new Error('unexpected response')
    return new Set(result.filter((n): n is string => typeof n === 'string'))
  } catch (e) {
    console.error('[order] product list unavailable, checking the item format only', e)
    return null
  }
}

const DNS_NO_SUCH = new Set(['ENOTFOUND', 'ENODATA'])

/**
 * False only when DNS says for certain that the domain cannot receive mail
 * ("gmail.col"). A resolver hiccup must not cost an order.
 */
async function mailDomainExists(domain: string): Promise<boolean> {
  const resolver = new Resolver({ timeout: 2500, tries: 2 })
  const results = await Promise.allSettled([
    resolver.resolveMx(domain),
    resolver.resolve4(domain),
    resolver.resolve6(domain),
  ])
  const definitelyMissing = results.every((r) =>
    r.status === 'fulfilled'
      ? r.value.length === 0
      : DNS_NO_SUCH.has((r.reason as NodeJS.ErrnoException)?.code ?? '')
  )
  return !definitelyMissing
}

const hashed = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 32)

/** Counts this request; true when over `max`. Fails open. */
async function overLimit(redis: Redis, key: string, max: number, ttlSeconds: number): Promise<boolean> {
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, ttlSeconds)
    return count > max
  } catch (e) {
    console.error('[order] rate limit check failed', e)
    return false
  }
}

function clientIp(req: Req): string {
  const fwd = req.headers?.['x-forwarded-for']
  const raw = Array.isArray(fwd) ? fwd[0] : fwd
  return (typeof raw === 'string' ? raw.split(',')[0].trim() : '') || 'unknown'
}

// ── HTTP ────────────────────────────────────────────────────────────────

// The static build may also be served from the bakery's own domain while it
// is hosted elsewhere; the form there posts cross-origin to this function.
const ALLOWED_ORIGINS = new Set([
  'https://bonpainfaitmain.be',
  'https://www.bonpainfaitmain.be',
])

type Req = {
  method?: string
  body: unknown
  headers?: Record<string, string | string[] | undefined>
}
type Res = {
  status: (code: number) => { json: (data: unknown) => void; end: () => void }
  setHeader: (key: string, value: string) => void
}

function applyCors(req: Req, res: Res) {
  const origin = typeof req.headers?.origin === 'string' ? req.headers.origin : ''
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Max-Age', '86400')
  }
}

type Mail = Parameters<Resend['emails']['send']>[0]

/** Resend v6 resolves with { data, error } and only rejects on network failures — check both. */
async function send(resend: Resend, mail: Mail): Promise<unknown> {
  try {
    const { error } = await resend.emails.send(mail)
    return error
  } catch (e) {
    return e ?? 'unknown error'
  }
}

export default async function handler(req: Req, res: Res) {
  applyCors(req, res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const checked = checkPayload(req.body)
  if (isRejection(checked)) {
    return res.status(checked.status).json(checked.body)
  }
  const { order, lines } = checked

  // Metadata only. The full order goes to the log solely when it would
  // otherwise be lost (below); everything else is in Redis and the mails.
  console.log('[order] received', JSON.stringify({ pickup: order.pickup.date, lines: lines.length, total: order.total }))

  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.ORDER_TO_EMAIL
  const fromEmail = process.env.ORDER_FROM_EMAIL

  if (!apiKey || !toEmail || !fromEmail) {
    console.error('[order] Resend env vars missing — order NOT delivered:', JSON.stringify(order))
    return res.status(503).json({ error: 'not_configured' })
  }

  const kvUrl = process.env.KV_REST_API_URL
  const kvToken = process.env.KV_REST_API_TOKEN
  const redis = kvUrl && kvToken ? new Redis({ url: kvUrl, token: kvToken }) : null

  if (redis && (await overLimit(redis, `${KEY_PREFIX}ratelimit:ip:${hashed(clientIp(req))}`, LIMITS.perIpPerHour, 3600))) {
    console.warn('[order] rate limited (ip)')
    return res.status(429).json({ error: 'rate_limited' })
  }

  const domain = order.customer.email.split('@')[1].toLowerCase()
  const [domainOk, names] = await Promise.all([mailDomainExists(domain), productNames()])
  if (!domainOk) {
    return res.status(400).json({ error: 'email_domain', domain })
  }
  for (const line of lines) {
    if (names ? !names.has(line.name) : !ITEM_NAME_FALLBACK.test(line.name)) {
      // A product renamed in the studio while the customer had the page open.
      return res.status(409).json({ error: 'products_changed' })
    }
  }

  if (redis) {
    const address = order.customer.email.toLowerCase()
    if (await overLimit(redis, `${KEY_PREFIX}ratelimit:email:${hashed(address)}`, LIMITS.perAddressPerDay, 24 * 3600)) {
      console.warn('[order] rate limited (address)')
      return res.status(429).json({ error: 'rate_limited' })
    }
    const today = new Date().toISOString().slice(0, 10)
    if (await overLimit(redis, `${KEY_PREFIX}ratelimit:day:${today}`, LIMITS.perDay, 2 * 24 * 3600)) {
      console.error('[order] daily order limit reached')
      return res.status(429).json({ error: 'daily_limit' })
    }
  }

  // Try to build the daily digest. If Redis isn't available, fall back to a
  // single-order email so the order isn't lost.
  let bakerEmail: { subject: string; text: string; html: string }
  let unstore: (() => Promise<void>) | null = null

  if (redis) {
    const day = await storeAndFetchDay(redis, order)
    if (day && day.orders.length > 0) {
      bakerEmail = buildBakerDigest(day.orders, order.pickup)
      unstore = day.unstore
    } else {
      console.warn('[order] Redis returned no orders, falling back to single-order email')
      bakerEmail = buildBakerSingleOrder(order)
    }
  } else {
    console.warn('[order] Redis env vars missing, falling back to single-order email')
    bakerEmail = buildBakerSingleOrder(order)
  }

  // Preview deployments never mail the bakery: their orders go to
  // ORDER_TO_EMAIL_PREVIEW, or back to the address the test order names.
  const bakerTo = IS_PRODUCTION ? toEmail : process.env.ORDER_TO_EMAIL_PREVIEW || order.customer.email

  const resend = new Resend(apiKey)

  // Benjamin first: the customer is only confirmed once the bakery has the order.
  const bakerFailure = await send(resend, {
    from: fromEmail,
    to: [bakerTo],
    replyTo: order.customer.email,
    subject: bakerEmail.subject,
    text: bakerEmail.text,
    html: bakerEmail.html,
    tags: [{ name: 'kind', value: 'order' }],
  })

  if (bakerFailure) {
    console.error('[order] baker email failed', bakerFailure)
    console.error('[order] order NOT delivered:', JSON.stringify(order))
    await unstore?.()
    return res.status(502).json({ error: 'delivery_failed' })
  }

  const customerMail = buildCustomerConfirmation(order)
  const customerFailure = await send(resend, {
    from: fromEmail,
    to: [order.customer.email],
    replyTo: bakerTo,
    subject: customerMail.subject,
    text: customerMail.text,
    html: customerMail.html,
    tags: [{ name: 'kind', value: 'confirmation' }],
  })

  if (customerFailure) {
    console.warn('[order] customer confirmation failed', customerFailure)
    return res.status(200).json({ ok: true, confirmation: 'failed' })
  }

  return res.status(200).json({ ok: true, confirmation: 'sent' })
}
