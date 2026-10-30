// What the functions need from Sanity, in one request to the same public CDN
// the site reads (published documents only, cached up to ~60 s).

import { WEEKDAYS, weekdayOf } from './common.js'

export type CatalogProduct = {
  _id: string
  name: string
  price: number
  priceUnit: string | null
  portionGrams: number | null
  isActive: boolean | null
  orderInForm: boolean | null
  availability: string | null
  isSeasonal: boolean | null
  seasonStart: string | null
  seasonEnd: string | null
}

export type Vacation = {
  isActive: boolean
  startDate: string | null
  endDate: string | null
  messageFr: string | null
}

export type Catalog = {
  /** Every product, also inactive ones (order lines are checked against all names). */
  products: CatalogProduct[]
  leadDays: number
  /** French weekdays the bakery sells on, or null when the schedule is empty. */
  openWeekdays: Set<string> | null
  vacation: Vacation | null
}

const SANITY_PROJECT = process.env.VITE_SANITY_PROJECT_ID || '5f1udd5l'
const SANITY_DATASET = process.env.VITE_SANITY_DATASET || 'production'

const QUERY = `{
  "products": *[_type == "product"]{_id, name, price, priceUnit, portionGrams, isActive, orderInForm, availability, isSeasonal, seasonStart, seasonEnd},
  "leadDays": *[_type == "siteSettings"][0].orderLeadDays,
  "schedule": *[_type == "schedule"]{day, isOpen, "slots": count(slots)},
  "vacation": *[_type == "vacationBanner"][0]{isActive, startDate, endDate, messageFr}
}`

export const CATALOG_URL =
  `https://${SANITY_PROJECT}.apicdn.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}` +
  `?query=${encodeURIComponent(QUERY)}`

const DAY_FR: Record<string, string> = {
  sunday: 'dimanche',
  monday: 'lundi',
  tuesday: 'mardi',
  wednesday: 'mercredi',
  thursday: 'jeudi',
  friday: 'vendredi',
  saturday: 'samedi',
}

const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

/** The catalog, or null when Sanity is unreachable. */
export async function fetchCatalog(): Promise<Catalog | null> {
  try {
    const res = await fetch(CATALOG_URL, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { result } = (await res.json()) as {
      result?: { products?: unknown; leadDays?: unknown; schedule?: unknown; vacation?: unknown }
    }
    if (!result || !Array.isArray(result.products)) throw new Error('unexpected response')

    const products = (result.products as CatalogProduct[]).filter(
      (p) => p && typeof p._id === 'string' && typeof p.name === 'string'
    )
    const lead = result.leadDays
    const schedule = Array.isArray(result.schedule)
      ? (result.schedule as { day?: string; isOpen?: boolean; slots?: number }[])
      : []
    const open = schedule
      .filter((s) => s.isOpen && (s.slots ?? 0) > 0 && s.day && DAY_FR[s.day])
      .map((s) => DAY_FR[s.day!])
    const v = result.vacation as Partial<Vacation> | null | undefined

    return {
      products,
      // Same default as the form (`orderLeadDays || 2`).
      leadDays: typeof lead === 'number' && lead > 0 ? Math.floor(lead) : 2,
      openWeekdays: open.length > 0 ? new Set(open) : null,
      vacation: v
        ? {
            isActive: v.isActive === true,
            startDate: isDate(v.startDate) ? v.startDate : null,
            endDate: isDate(v.endDate) ? v.endDate : null,
            messageFr: typeof v.messageFr === 'string' ? v.messageFr : null,
          }
        : null,
    }
  } catch (e) {
    console.error('[catalog] Sanity unavailable', e)
    return null
  }
}

/** Products a customer can put in an order or a subscription (same rule as the form, minus the season). */
export const isOffered = (p: CatalogProduct) => p.isActive === true && p.orderInForm !== false

/**
 * Whether the bakery makes this product for a pickup on `date`: offered,
 * in season on that day, and Saturday-only products only on Saturdays.
 */
export function availableOn(p: CatalogProduct, date: string): boolean {
  if (!isOffered(p)) return false
  if (p.isSeasonal && (p.seasonStart || p.seasonEnd)) {
    if (isDate(p.seasonStart) && date < p.seasonStart) return false
    if (isDate(p.seasonEnd) && date > p.seasonEnd) return false
  }
  if (p.availability === 'saturday' && weekdayOf(date) !== 'samedi') return false
  return true
}

/**
 * Whether the vacation banner closes the bakery on `date`. Only an active
 * banner counts. Without dates it closes every day while it stays active.
 */
export function closedForVacation(v: Vacation | null, date: string): boolean {
  if (!v || !v.isActive) return false
  if (!v.startDate && !v.endDate) return true
  if (v.startDate && date < v.startDate) return false
  if (v.endDate && date > v.endDate) return false
  return true
}

export function isSalesDay(catalog: Catalog, weekday: string): boolean {
  return WEEKDAYS.includes(weekday) && (!catalog.openWeekdays || catalog.openWeekdays.has(weekday))
}
