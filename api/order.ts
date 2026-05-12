// Vercel Serverless Function — receives orders from the OrderForm.
//
// Flow per request:
//   1. Store the order in Upstash Redis under `orders:{pickupDateISO}`.
//   2. Read ALL orders for that pickup day from Redis.
//   3. Send Benjamin a DIGEST email with aggregate counts + per-customer
//      list — subject is constant per pickup day so Gmail threads them.
//   4. Send the customer an immediate confirmation.
//
// Result for Benjamin: one Gmail thread per pickup day, where the most
// recent message is always the current state. No fragmented per-order
// inbox. Customer confirmation is unchanged.
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY     — from https://resend.com/api-keys
//   ORDER_TO_EMAIL     — Benjamin's inbox, e.g. bonpain.artisan@gmail.com
//   ORDER_FROM_EMAIL   — verified Resend sender, e.g. orders@bonpainfaitmain.be
//   KV_REST_API_URL    — auto-injected by Vercel/Upstash integration
//   KV_REST_API_TOKEN  — auto-injected by Vercel/Upstash integration
//
// Graceful degradation:
//   - No Resend keys → log order, return 200 (form keeps working).
//   - No Redis keys → log error, fall back to a single-order email
//     to Benjamin so the order isn't silently lost.

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

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

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
  const subject = `${pickup.jour} ${dateFr} — Commandes`

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
        ${escapeHtml(pickup.jour)} ${escapeHtml(dateFr)}
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
  const subject = `Nouvelle commande — ${customer.prenom} ${customer.nom} — retrait ${pickup.jour} ${dateFr}`

  const text = [
    `Nouvelle commande reçue.`,
    ``,
    `Client : ${customer.prenom} ${customer.nom}`,
    `Email  : ${customer.email}`,
    customer.tel ? `Tél    : ${customer.tel}` : null,
    ``,
    `Retrait : ${pickup.jour} ${dateFr}`,
    ``,
    `Commande :`,
    items,
    ``,
    `Total : ${formatPrice(total)}`,
    remarques ? `\nRemarques : ${remarques}` : null,
    ``,
    `⚠ Cette commande arrive einzeln (Redis-Digest war nicht erreichbar).`,
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
      <p><strong>Retrait</strong><br>${escapeHtml(pickup.jour)} ${escapeHtml(dateFr)}</p>
      <p><strong>Commande</strong></p>
      <ul style="padding-left: 1.2em;">${items
        .split('\n')
        .map((l) => `<li style="margin: 4px 0;">${escapeHtml(l)}</li>`)
        .join('')}</ul>
      <p><strong>Total : ${escapeHtml(formatPrice(total))}</strong></p>
      ${remarques ? `<p><strong>Remarques</strong><br>${escapeHtml(remarques)}</p>` : ''}
      <p style="color: #8B6340; font-size: 12px; margin-top: 24px;">
        ⚠ Diese Bestellung wurde einzeln verschickt (Tagesübersicht war kurz nicht erreichbar).
      </p>
    </div>
  `

  return { subject, text, html }
}

function buildCustomerConfirmation(order: OrderPayload) {
  const { customer, pickup, items, total } = order
  const dateFr = formatPickupDate(pickup.date)
  const subject = `Votre commande chez Bon Pain Fait Main`

  const text = [
    `Bonjour ${customer.prenom},`,
    ``,
    `Merci, on a bien reçu votre commande.`,
    ``,
    `Retrait : ${pickup.jour} ${dateFr}`,
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
      <p>Merci, on a bien reçu votre commande.</p>
      <p>
        <strong>Retrait</strong><br>
        ${escapeHtml(pickup.jour)} ${escapeHtml(dateFr)}<br>
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

async function fetchAllOrdersForDay(
  redis: Redis,
  order: OrderPayload
): Promise<StoredOrder[] | null> {
  const key = `orders:${order.pickup.date}`
  const record: StoredOrder = { ...order, receivedAt: new Date().toISOString() }
  try {
    await redis.lpush(key, JSON.stringify(record))
    // Keep the key for 60 days past last write — long enough for any
    // post-mortem (claim "I never ordered that"), short enough to keep
    // storage tiny.
    await redis.expire(key, 60 * 24 * 3600)
    const raw = await redis.lrange(key, 0, -1)
    return raw.map((v) => (typeof v === 'string' ? JSON.parse(v) : (v as StoredOrder)))
  } catch (e) {
    console.error('[order] Redis lpush/lrange failed', e)
    return null
  }
}

export default async function handler(req: { method?: string; body: unknown }, res: {
  status: (code: number) => { json: (data: unknown) => void; end: () => void }
}) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const order = req.body as OrderPayload

  if (!order?.customer?.email || !order?.items || !order?.pickup?.jour || !order?.pickup?.date) {
    return res.status(400).json({ error: 'Invalid order payload' })
  }

  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.ORDER_TO_EMAIL
  const fromEmail = process.env.ORDER_FROM_EMAIL

  // Always log — Vercel logs are the last-resort safety net.
  console.log('[order]', JSON.stringify(order))

  if (!apiKey || !toEmail || !fromEmail) {
    console.warn('[order] Resend env vars missing — order logged but no email sent')
    return res.status(200).json({ ok: true, delivery: 'logged' })
  }

  const resend = new Resend(apiKey)

  // Try to build the daily digest. If Redis isn't available, fall back to a
  // single-order email so the order isn't lost.
  let bakerEmail: { subject: string; text: string; html: string }
  const kvUrl = process.env.KV_REST_API_URL
  const kvToken = process.env.KV_REST_API_TOKEN

  if (kvUrl && kvToken) {
    const redis = new Redis({ url: kvUrl, token: kvToken })
    const allOrders = await fetchAllOrdersForDay(redis, order)
    if (allOrders && allOrders.length > 0) {
      bakerEmail = buildBakerDigest(allOrders, order.pickup)
    } else {
      console.warn('[order] Redis returned no orders, falling back to single-order email')
      bakerEmail = buildBakerSingleOrder(order)
    }
  } else {
    console.warn('[order] Redis env vars missing, falling back to single-order email')
    bakerEmail = buildBakerSingleOrder(order)
  }

  const customerMail = buildCustomerConfirmation(order)

  const [bakerRes, customerRes] = await Promise.allSettled([
    resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: order.customer.email,
      subject: bakerEmail.subject,
      text: bakerEmail.text,
      html: bakerEmail.html,
    }),
    resend.emails.send({
      from: fromEmail,
      to: [order.customer.email],
      replyTo: toEmail,
      subject: customerMail.subject,
      text: customerMail.text,
      html: customerMail.html,
    }),
  ])

  if (bakerRes.status === 'rejected') {
    console.error('[order] baker email failed', bakerRes.reason)
    return res.status(500).json({ error: 'Email delivery failed' })
  }

  if (customerRes.status === 'rejected') {
    console.warn('[order] customer confirmation failed', customerRes.reason)
  }

  return res.status(200).json({ ok: true })
}
