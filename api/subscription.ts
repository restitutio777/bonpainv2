// Manage a regular order from the personal link (/abonnement#…).
//
// POST { action, ref, … }  — never GET: mail scanners open links in emails,
// and opening the page must not change anything.
//   get     customer or bakery: the regular order and its next dates
//   update  customer: items, weeks off, remark (only dates still open for orders)
//   end     customer or bakery: stop it for good; the customer gets an email
//
// `ref` is "id.token" (customer) or "b.id.token" (bakery), signed with
// SUBSCRIPTION_SECRET (server/common.ts). A wrong ref looks like a missing one.

import {
  KEY_PREFIX,
  addDays,
  applyCors,
  bakeryInbox,
  clientIp,
  earliestPickup,
  hashed,
  mailFromEnv,
  manageUrl,
  overLimit,
  redisFromEnv,
  send,
  todayBrussels,
  verifyRef,
  weekdayOf,
  type LinkRole,
  type Req,
  type Res,
} from '../server/common.js'
import { fetchCatalog, isOffered, type Catalog } from '../server/catalog.js'
import { checkRemarques, isRejection } from '../server/checks.js'
import { finalListSent } from '../server/day.js'
import { buildSubChanged, buildSubEnded } from '../server/mails.js'
import {
  SUB_LIMITS,
  dateState,
  endSub,
  isDue,
  loadSub,
  nextDates,
  saveSub,
  type DateState,
  type SubItem,
  type Subscription,
} from '../server/subscriptions.js'

const LIMITS = {
  perIpPerHour: 60,
  changesPerDay: 10,
}

const DATES_SHOWN = 10

export type SubView = {
  role: LinkRole
  status: Subscription['status']
  weekday: string
  customer: Subscription['customer']
  items: { id: string; name: string; qty: number; offered: boolean }[]
  remarques: string
  firstOrderDate: string
  dates: { date: string; state: DateState; locked: boolean }[]
  leadDays: number
  earliest: string
  endedAt?: string
  endedBy?: Subscription['endedBy']
}

function view(sub: Subscription, role: LinkRole, catalog: Catalog): SubView {
  const today = todayBrussels()
  const earliest = earliestPickup(catalog.leadDays)
  const byId = new Map(catalog.products.map((p) => [p._id, p]))
  return {
    role,
    status: sub.status,
    weekday: sub.weekday,
    customer: sub.customer,
    items: sub.items.map((i) => {
      const p = byId.get(i.id)
      return { id: i.id, name: p?.name ?? i.name, qty: i.qty, offered: !!p && isOffered(p) }
    }),
    remarques: sub.remarques ?? '',
    firstOrderDate: addDays(sub.startDate, -7),
    dates:
      sub.status === 'active'
        ? nextDates(sub, today, DATES_SHOWN).map((date) => ({
            date,
            state: dateState(sub, date, catalog),
            locked: date < earliest,
          }))
        : [],
    leadDays: catalog.leadDays,
    earliest,
    endedAt: sub.endedAt,
    endedBy: sub.endedBy,
  }
}

const fail = (res: Res, status: number, error: string, extra: Record<string, unknown> = {}) =>
  res.status(status).json({ error, ...extra })

/** Validates the customer's edit. Returns the updated subscription or an error code. */
function applyUpdate(
  sub: Subscription,
  body: { items?: unknown; skipDates?: unknown; remarques?: unknown },
  catalog: Catalog
): Subscription | { error: string; field?: string } {
  const today = todayBrussels()
  const earliest = earliestPickup(catalog.leadDays)

  // Items: offered products only, each once, 1–20 each.
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > SUB_LIMITS.maxItems) {
    return { error: 'invalid', field: 'items' }
  }
  const byId = new Map(catalog.products.map((p) => [p._id, p]))
  const items: SubItem[] = []
  for (const raw of body.items as { id?: unknown; qty?: unknown }[]) {
    const p = typeof raw?.id === 'string' ? byId.get(raw.id) : undefined
    const qty = raw?.qty
    if (!p || !isOffered(p)) return { error: 'products_changed' }
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > SUB_LIMITS.maxQty) {
      return { error: 'invalid', field: 'items' }
    }
    if (p.availability === 'saturday' && sub.weekday !== 'samedi') return { error: 'invalid', field: 'items' }
    if (items.some((i) => i.id === p._id)) return { error: 'invalid', field: 'items' }
    items.push({ id: p._id, name: p.name, qty })
  }

  // Weeks off: only dates still open for orders can change; closed ones keep their state.
  if (!Array.isArray(body.skipDates) || body.skipDates.length > 60) return { error: 'invalid', field: 'skipDates' }
  const horizon = addDays(today, SUB_LIMITS.horizonDays)
  const requested = new Set<string>()
  for (const d of body.skipDates) {
    if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d) || weekdayOf(d) !== sub.weekday) {
      return { error: 'invalid', field: 'skipDates' }
    }
    if (d >= earliest && d >= sub.startDate && d <= horizon) requested.add(d)
  }
  const kept = sub.skipDates.filter((d) => d >= today && d < earliest)
  const skipDates = [...new Set([...kept, ...requested])].sort()

  const remarques = checkRemarques(body.remarques)
  if (isRejection(remarques)) return { error: 'invalid', field: 'remarques' }

  return {
    ...sub,
    items,
    skipDates,
    ...(remarques ? { remarques } : { remarques: undefined }),
    updatedAt: new Date().toISOString(),
  }
}

const sameContent = (a: Subscription, b: Subscription) =>
  JSON.stringify([a.items, a.skipDates, a.remarques ?? '']) === JSON.stringify([b.items, b.skipDates, b.remarques ?? ''])

export default async function handler(req: Req, res: Res) {
  applyCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).end()

  const body = (req.body ?? {}) as { action?: unknown; ref?: unknown; items?: unknown; skipDates?: unknown; remarques?: unknown }
  const redis = redisFromEnv()
  if (!redis) return fail(res, 503, 'unavailable')

  if (await overLimit(redis, `${KEY_PREFIX}ratelimit:subip:${hashed(clientIp(req))}`, LIMITS.perIpPerHour, 3600)) {
    return fail(res, 429, 'rate_limited')
  }

  const who = verifyRef(body.ref)
  if (!who) return fail(res, 404, 'not_found')

  const [sub, catalog] = await Promise.all([loadSub(redis, who.id), fetchCatalog()])
  if (!sub) return fail(res, 404, 'not_found')
  // Dates, closures and products all come from Sanity: without it, change nothing.
  if (!catalog) return fail(res, 503, 'unavailable')

  const action = body.action
  if (action === 'get') return res.status(200).json(view(sub, who.role, catalog))

  const mail = mailFromEnv()
  if (!mail) return fail(res, 503, 'unavailable')

  if (action === 'update') {
    if (who.role !== 'customer') return fail(res, 403, 'forbidden')
    if (sub.status !== 'active') return fail(res, 409, 'ended', { view: view(sub, who.role, catalog) })
    const updated = applyUpdate(sub, body, catalog)
    if ('error' in updated) return fail(res, updated.error === 'products_changed' ? 409 : 400, updated.error, updated.field ? { field: updated.field } : {})
    if (sameContent(sub, updated)) return res.status(200).json({ ...view(sub, who.role, catalog), mail: 'none' })
    if (await overLimit(redis, `${KEY_PREFIX}ratelimit:subchange:${sub.id}`, LIMITS.changesPerDay, 24 * 3600)) {
      return fail(res, 429, 'rate_limited')
    }
    await saveSub(redis, updated)
    console.log('[subscription] updated', sub.id)

    const today = todayBrussels()
    const next = nextDates(updated, today, 30).find((d) => isDue(updated, d, catalog)) ?? null
    const changed = buildSubChanged(updated, next, manageUrl('customer', sub.id))
    const failure = await send(mail.resend, {
      from: mail.fromEmail,
      to: [updated.customer.email],
      replyTo: bakeryInbox(mail, updated.customer.email),
      subject: changed.subject,
      text: changed.text,
      html: changed.html,
      tags: [{ name: 'kind', value: 'subscription' }],
    })
    if (failure) console.warn('[subscription] change mail failed', failure)
    return res.status(200).json({ ...view(updated, who.role, catalog), mail: failure ? 'failed' : 'sent' })
  }

  if (action === 'end') {
    if (sub.status !== 'active') return res.status(200).json({ ...view(sub, who.role, catalog), mail: 'none' })
    const today = todayBrussels()
    const earliest = earliestPickup(catalog.leadDays)
    // Dates already closed whose final list the bakery has: they still happen.
    const closed = nextDates(sub, today, 2).filter((d) => d < earliest && isDue(sub, d, catalog))
    const stillPlanned: string[] = []
    for (const d of closed) if (await finalListSent(redis, d)) stillPlanned.push(d)

    const ended = endSub(sub, who.role === 'bakery' ? 'bakery' : 'customer')
    await saveSub(redis, ended)
    console.log('[subscription] ended', sub.id, ended.endedBy)

    const notice = buildSubEnded(ended, ended.endedBy!, stillPlanned)
    const failure = await send(mail.resend, {
      from: mail.fromEmail,
      to: [ended.customer.email],
      replyTo: bakeryInbox(mail, ended.customer.email),
      subject: notice.subject,
      text: notice.text,
      html: notice.html,
      tags: [{ name: 'kind', value: 'subscription' }],
    })
    if (failure) console.warn('[subscription] end mail failed', failure)
    return res.status(200).json({ ...view(ended, who.role, catalog), stillPlanned, mail: failure ? 'failed' : 'sent' })
  }

  return fail(res, 400, 'invalid', { field: 'action' })
}

