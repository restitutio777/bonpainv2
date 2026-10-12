// Vercel Serverless Function — receives orders from the OrderForm.
//
// Flow per request:
//   1. Check the payload: field formats, product names and the order lead
//      time against Sanity, and that the customer's email domain exists.
//      Apply the abuse limits.
//   2. With "subscribe": create the regular order (server/subscriptions.ts).
//      This first order is a normal one; the regular order starts a week later.
//   3. Store the order in Upstash Redis under `orders:{pickupDateISO}` and
//      read back ALL orders for that pickup day, regular orders included.
//   4. Send Benjamin a DIGEST email with aggregate counts + per-customer
//      list — subject is constant per pickup day so Gmail threads them.
//   5. Only once Benjamin's email is accepted, send the customer a
//      confirmation (with the personal link for a regular order).
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
//   SUBSCRIPTION_SECRET    — signs the links to manage regular orders
//   KV_REST_API_URL        — auto-injected by Vercel/Upstash integration
//   KV_REST_API_TOKEN      — auto-injected by Vercel/Upstash integration
//
// Degradation:
//   - No Resend keys → 503, the form tells the customer to phone.
//   - No Redis → single-order email to Benjamin instead of the digest, and
//     no rate limits (the payload checks still apply). Regular orders need
//     Redis, Sanity and the secret: without them → 503, nothing is sent.

import {
  addDays,
  applyCors,
  bakeryInbox,
  clientIp,
  earliestPickup,
  hashed,
  KEY_PREFIX,
  linkSecretConfigured,
  mailFromEnv,
  manageUrl,
  overLimit,
  redisFromEnv,
  send,
  type Req,
  type Res,
} from '../server/common.js'
import { fetchCatalog, isOffered, isSalesDay } from '../server/catalog.js'
import { ITEM_NAME_FALLBACK, checkPayload, isRejection, mailDomainExists } from '../server/checks.js'
import { buildBakerDigest, buildBakerSingleOrder, dayEntries, storeOrder } from '../server/day.js'
import { buildCustomerConfirmation } from '../server/mails.js'
import {
  SUB_LIMITS,
  activeSubs,
  deleteSub,
  newSubId,
  saveSub,
  type SubItem,
  type Subscription,
} from '../server/subscriptions.js'

const LIMITS = {
  perIpPerHour: 6,
  perAddressPerDay: 5,
  // Resend Free sends 100 mails a day and every order costs two. The old
  // site's busiest day had 15 orders. Past this, the form asks people to
  // phone instead of failing later on the mail quota.
  perDay: 40,
}

// What the customer ticks in the form (src/components/OrderForm.tsx). Stored
// with the regular order as the record of what was agreed.
const CONSENT_TEXT =
  "Répéter cette commande chaque semaine, le même jour, jusqu'à ce que je l'arrête (CGV, article 8)."

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
  const { order, lines, subscribe } = checked

  // Metadata only. The full order goes to the log solely when it would
  // otherwise be lost (below); everything else is in Redis and the mails.
  console.log(
    '[order] received',
    JSON.stringify({ pickup: order.pickup.date, lines: lines.length, total: order.total, subscribe })
  )

  const mail = mailFromEnv()
  if (!mail) {
    console.error('[order] Resend env vars missing — order NOT delivered:', JSON.stringify(order))
    return res.status(503).json({ error: 'not_configured' })
  }

  const redis = redisFromEnv()

  if (redis && (await overLimit(redis, `${KEY_PREFIX}ratelimit:ip:${hashed(clientIp(req))}`, LIMITS.perIpPerHour, 3600))) {
    console.warn('[order] rate limited (ip)')
    return res.status(429).json({ error: 'rate_limited' })
  }

  const domain = order.customer.email.split('@')[1].toLowerCase()
  const [domainOk, catalog] = await Promise.all([mailDomainExists(domain), fetchCatalog()])
  if (!domainOk) {
    return res.status(400).json({ error: 'email_domain', domain })
  }
  if (catalog && order.pickup.date < earliestPickup(catalog.leadDays)) {
    return res.status(400).json({ error: 'too_soon', leadDays: catalog.leadDays })
  }
  const names = catalog ? new Set(catalog.products.map((p) => p.name)) : null
  for (const line of lines) {
    if (names ? !names.has(line.name) : !ITEM_NAME_FALLBACK.test(line.name)) {
      // A product renamed in the studio while the customer had the page open.
      return res.status(409).json({ error: 'products_changed' })
    }
  }

  // Regular order: everything checked before anything is stored or sent.
  let subItems: SubItem[] | null = null
  if (subscribe) {
    if (!redis || !catalog || !linkSecretConfigured()) {
      console.error('[order] regular order impossible: Redis, Sanity or SUBSCRIPTION_SECRET missing')
      return res.status(503).json({ error: 'subscription_unavailable' })
    }
    if (!isSalesDay(catalog, order.pickup.jour)) return res.status(400).json({ error: 'invalid', field: 'jour' })
    const offered = new Map(catalog.products.filter(isOffered).map((p) => [p.name, p]))
    subItems = []
    for (const line of lines) {
      const p = offered.get(line.name)
      if (!p) return res.status(409).json({ error: 'products_changed' })
      // Would never be made on that weekday: say so now, not every week.
      if (p.availability === 'saturday' && order.pickup.jour !== 'samedi') {
        return res.status(400).json({ error: 'saturday_only', product: p.name })
      }
      subItems.push({ id: p._id, name: p.name, qty: line.qty })
    }
    let existing: Subscription[]
    try {
      existing = await activeSubs(redis)
    } catch (e) {
      console.error('[order] could not read regular orders', e)
      return res.status(503).json({ error: 'subscription_unavailable' })
    }
    const email = order.customer.email.toLowerCase()
    if (existing.some((s) => s.customer.email.toLowerCase() === email && s.weekday === order.pickup.jour)) {
      return res.status(409).json({ error: 'subscription_exists', jour: order.pickup.jour })
    }
    if (existing.length >= SUB_LIMITS.maxActive) {
      console.error('[order] regular order limit reached')
      return res.status(503).json({ error: 'subscription_full' })
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

  let sub: Subscription | null = null
  if (subItems && redis) {
    const now = new Date().toISOString()
    sub = {
      id: newSubId(),
      customer: order.customer,
      weekday: order.pickup.jour,
      items: subItems,
      ...(order.remarques ? { remarques: order.remarques } : {}),
      startDate: addDays(order.pickup.date, 7),
      skipDates: [],
      status: 'active',
      createdAt: now,
      consent: { at: now, text: CONSENT_TEXT },
    }
    try {
      await saveSub(redis, sub)
    } catch (e) {
      console.error('[order] could not store the regular order', e)
      return res.status(503).json({ error: 'subscription_unavailable' })
    }
  }
  const rollbackSub = async () => {
    if (sub && redis) await deleteSub(redis, sub.id).catch((e) => console.error('[order] rollback failed', e))
  }

  // The day's digest. If Redis isn't available, fall back to a single-order
  // email so the order isn't lost.
  let bakerEmail: { subject: string; text: string; html: string }
  let unstore: (() => Promise<void>) | null = null
  if (redis) {
    try {
      unstore = await storeOrder(redis, {
        ...order,
        receivedAt: new Date().toISOString(),
        ...(sub ? { subscriptionId: sub.id } : {}),
      })
      const entries = await dayEntries(redis, order.pickup.date, catalog)
      bakerEmail = entries.length
        ? buildBakerDigest(entries, order.pickup, { final: false })
        : buildBakerSingleOrder(order)
    } catch (e) {
      console.error('[order] Redis failed, falling back to single-order email', e)
      bakerEmail = buildBakerSingleOrder(order)
    }
  } else {
    console.warn('[order] Redis env vars missing, falling back to single-order email')
    bakerEmail = buildBakerSingleOrder(order)
  }

  const bakerTo = bakeryInbox(mail, order.customer.email)

  // Benjamin first: the customer is only confirmed once the bakery has the order.
  const bakerFailure = await send(mail.resend, {
    from: mail.fromEmail,
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
    await rollbackSub()
    return res.status(502).json({ error: 'delivery_failed' })
  }

  const customerUrl = sub ? manageUrl('customer', sub.id) : undefined
  const customerMail = buildCustomerConfirmation(
    order,
    sub && customerUrl && catalog ? { firstDate: sub.startDate, url: customerUrl, leadDays: catalog.leadDays } : undefined
  )
  const customerFailure = await send(mail.resend, {
    from: mail.fromEmail,
    to: [order.customer.email],
    replyTo: bakerTo,
    subject: customerMail.subject,
    text: customerMail.text,
    html: customerMail.html,
    tags: [{ name: 'kind', value: 'confirmation' }],
  })

  // The form shows the link as well: without the confirmation it is the
  // customer's only way to manage the regular order.
  const regular = sub && customerUrl ? { manageUrl: customerUrl, firstDate: sub.startDate } : {}

  if (customerFailure) {
    console.warn('[order] customer confirmation failed', customerFailure)
    return res.status(200).json({ ok: true, confirmation: 'failed', ...regular })
  }

  return res.status(200).json({ ok: true, confirmation: 'sent', ...regular })
}
