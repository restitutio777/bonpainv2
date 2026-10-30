// Regular orders ("commandes régulières"): a customer's order repeated every
// week on the same day until the customer or the bakery ends it.
//
// Storage (Upstash Redis, KEY_PREFIX for previews):
//   sub:{id}      JSON Subscription. No expiry while active; 60 days after it ends.
//   subs:active   set of active ids. A few dozen at most, so reading all of
//                 them for every day list is cheap.
//
// A subscription only stores what the customer chose (product ids and
// quantities). Prices, availability, the sales days and closures come from
// Sanity at the time a day list is made, so the list always matches the shop.

import { randomBytes } from 'node:crypto'
import type { Redis } from '@upstash/redis'
import { KEY_PREFIX, addDays, weekdayOf } from './common.js'
import { availableOn, closedForVacation, isSalesDay, type Catalog } from './catalog.js'

export type Customer = { nom: string; prenom: string; email: string; tel?: string }
export type SubItem = { id: string; name: string; qty: number }

export type Subscription = {
  id: string
  customer: Customer
  /** French weekday, lowercase ("vendredi"). */
  weekday: string
  items: SubItem[]
  remarques?: string
  /** First date the subscription itself produces an order (the first order is a normal one). */
  startDate: string
  /** Dates the customer will not come. */
  skipDates: string[]
  status: 'active' | 'ended'
  createdAt: string
  updatedAt?: string
  endedAt?: string
  endedBy?: 'customer' | 'bakery'
  /** The checkbox text the customer agreed to, and when. */
  consent: { at: string; text: string }
}

export const SUB_LIMITS = {
  maxActive: 150,
  /** How far ahead a customer can mark weeks off. */
  horizonDays: 120,
  maxItems: 30,
  maxQty: 20,
}

const ENDED_TTL = 60 * 24 * 3600
const subKey = (id: string) => `${KEY_PREFIX}sub:${id}`
const activeKey = () => `${KEY_PREFIX}subs:active`

export const newSubId = () => randomBytes(9).toString('base64url')

function parse(raw: unknown): Subscription | null {
  if (!raw) return null
  try {
    const s = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Subscription
    return s && typeof s.id === 'string' && Array.isArray(s.items) ? { ...s, skipDates: s.skipDates ?? [] } : null
  } catch {
    return null
  }
}

export async function loadSub(redis: Redis, id: string): Promise<Subscription | null> {
  return parse(await redis.get(subKey(id)))
}

export async function saveSub(redis: Redis, sub: Subscription): Promise<void> {
  const value = JSON.stringify(sub)
  if (sub.status === 'active') {
    await redis.set(subKey(sub.id), value)
    await redis.sadd(activeKey(), sub.id)
  } else {
    await redis.set(subKey(sub.id), value, { ex: ENDED_TTL })
    await redis.srem(activeKey(), sub.id)
  }
}

/** Only for rolling back a subscription whose first order never reached the bakery. */
export async function deleteSub(redis: Redis, id: string): Promise<void> {
  await redis.srem(activeKey(), id)
  await redis.del(subKey(id))
}

export async function activeSubs(redis: Redis): Promise<Subscription[]> {
  const ids = await redis.smembers(activeKey())
  if (ids.length === 0) return []
  const raws = await redis.mget<unknown[]>(...ids.map(subKey))
  return raws.map(parse).filter((s): s is Subscription => s !== null && s.status === 'active')
}

export function endSub(sub: Subscription, by: 'customer' | 'bakery'): Subscription {
  return { ...sub, status: 'ended', endedAt: new Date().toISOString(), endedBy: by }
}

/** Dates on the subscription's weekday from `from` (inclusive, not before its start), `count` of them. */
export function nextDates(sub: Subscription, from: string, count: number): string[] {
  let d = from > sub.startDate ? from : sub.startDate
  for (let i = 0; i < 7 && weekdayOf(d) !== sub.weekday; i++) d = addDays(d, 1)
  const dates: string[] = []
  for (let i = 0; i < count; i++) dates.push(addDays(d, 7 * i))
  return dates
}

export type DateState = 'planned' | 'skipped' | 'vacation' | 'no-sales-day' | 'nothing-available'

/** What happens to the subscription on one of its dates. */
export function dateState(sub: Subscription, date: string, catalog: Catalog): DateState {
  if (!isSalesDay(catalog, sub.weekday)) return 'no-sales-day'
  if (closedForVacation(catalog.vacation, date)) return 'vacation'
  if (sub.skipDates.includes(date)) return 'skipped'
  const byId = new Map(catalog.products.map((p) => [p._id, p]))
  const anything = sub.items.some((i) => {
    const p = byId.get(i.id)
    return p ? availableOn(p, date) : false
  })
  return anything ? 'planned' : 'nothing-available'
}

/**
 * Whether the subscription produces an order on `date`. Without the catalog
 * (Sanity down) closures are unknown: the order stays in the list rather
 * than silently disappearing.
 */
export function isDue(sub: Subscription, date: string, catalog: Catalog | null): boolean {
  if (sub.status !== 'active' || date < sub.startDate || weekdayOf(date) !== sub.weekday) return false
  if (!catalog) return !sub.skipDates.includes(date)
  return dateState(sub, date, catalog) === 'planned'
}

export type PricedItem = { qty: number; name: string; amount: number | null; byWeight?: boolean }

/** The subscription's lines for `date` at today's prices, and what is not made that day. */
export function itemsOn(
  sub: Subscription,
  date: string,
  catalog: Catalog | null
): { items: PricedItem[]; unavailable: string[]; total: number | null } {
  if (!catalog) {
    return { items: sub.items.map((i) => ({ qty: i.qty, name: i.name, amount: null })), unavailable: [], total: null }
  }
  const byId = new Map(catalog.products.map((p) => [p._id, p]))
  const items: PricedItem[] = []
  const unavailable: string[] = []
  for (const i of sub.items) {
    const p = byId.get(i.id)
    if (p && availableOn(p, date)) {
      if (p.priceUnit === 'kg') items.push({ qty: i.qty, name: p.name, amount: 0, byWeight: true })
      else items.push({ qty: i.qty, name: p.name, amount: Math.round(p.price * i.qty * 100) / 100 })
    } else {
      unavailable.push(p?.name ?? i.name)
    }
  }
  const total = Math.round(items.reduce((s, i) => s + (i.amount ?? 0), 0) * 100) / 100
  return { items, unavailable, total }
}
