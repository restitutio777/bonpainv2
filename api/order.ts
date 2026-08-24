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
  const subject = `${capitalize(pickup.jour)} ${dateFr} — Commandes`

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
  const subject = `Nouvelle commande — ${customer.prenom} ${customer.nom} — retrait ${capitalize(pickup.jour)} ${dateFr}`

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
  const subject = `Votre commande chez Bon Pain Fait Main`

  const text = [
    `Bonjour ${customer.prenom},`,
    ``,
    `Merci, on a bien reçu votre commande.`,
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
      <p>Merci, on a bien reçu votre commande.</p>
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

// The endpoint is public and sends mail to whatever address the payload
// carries, so it needs a floor under abuse: cap the payload, sanity-check the
// email, and rate-limit per IP. Without Redis the limiter degrades to
// allow-all — the payload caps still apply.
const MAX = {
  name: 80,
  email: 160,
  tel: 40,
  remarques: 1000,
  items: 4000,
  jour: 20,
}

const RATE_LIMIT_PER_HOUR = 6

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)

const tooLong = (v: unknown, max: number) => typeof v === 'string' && v.length > max

function clientIp(req: Req): string {
  const fwd = req.headers?.['x-forwarded-for']
  const raw = Array.isArray(fwd) ? fwd[0] : fwd
  return (typeof raw === 'string' ? raw.split(',')[0].trim() : '') || 'unknown'
}

/** Returns true when the request is over the limit. Fails open. */
async function isRateLimited(redis: Redis, ip: string): Promise<boolean> {
  const key = `ratelimit:order:${ip}`
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, 3600)
    return count > RATE_LIMIT_PER_HOUR
  } catch (e) {
    console.error('[order] rate limit check failed', e)
    return false
  }
}

// The static build is also served from classic hosting on the bakery's own
// domain; the form there posts cross-origin to this function.
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

export default async function handler(req: Req, res: Res) {
  applyCors(req, res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const order = req.body as OrderPayload

  if (!order?.customer?.email || !order?.items || !order?.pickup?.jour || !order?.pickup?.date) {
    return res.status(400).json({ error: 'Invalid order payload' })
  }

  if (
    !isEmail(order.customer.email) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(order.pickup.date) ||
    tooLong(order.customer.email, MAX.email) ||
    tooLong(order.customer.nom, MAX.name) ||
    tooLong(order.customer.prenom, MAX.name) ||
    tooLong(order.customer.tel, MAX.tel) ||
    tooLong(order.remarques, MAX.remarques) ||
    tooLong(order.items, MAX.items) ||
    tooLong(order.pickup.jour, MAX.jour) ||
    typeof order.total !== 'number' ||
    !Number.isFinite(order.total) ||
    order.total < 0
  ) {
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

    if (await isRateLimited(redis, clientIp(req))) {
      console.warn('[order] rate limited', clientIp(req))
      return res.status(429).json({ error: 'Too many orders, please try again later' })
    }

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

  // Resend v6 resolves with { data, error } and only rejects on network
  // failures — check both paths, or API errors slip through as 200.
  const bakerFailure =
    bakerRes.status === 'rejected' ? bakerRes.reason : bakerRes.value.error

  if (bakerFailure) {
    console.error('[order] baker email failed', bakerFailure)
    return res.status(500).json({ error: 'Email delivery failed' })
  }

  const customerFailure =
    customerRes.status === 'rejected' ? customerRes.reason : customerRes.value.error

  if (customerFailure) {
    console.warn('[order] customer confirmation failed', customerFailure)
  }

  return res.status(200).json({ ok: true })
}
