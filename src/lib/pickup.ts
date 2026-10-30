import type { SanityProduct, ScheduleDay, VacationBanner } from '../types'
import { dayIndex, formatTimeFr, openDays } from './schedule'

// Pickup dates the order form offers. Mirrors the server (server/common.ts,
// server/catalog.ts): lead time counted from today in Brussels, open weekdays
// from the studio schedule, dated holidays closed.

export interface PickupDate {
  /** YYYY-MM-DD */
  date: string
  /** "mercredi", the value /api/order expects as `jour`. */
  jour: string
  weekdayShort: string
  dayNumber: number
  monthShort: string
  /** "8h — 12h et 13h — 15h", empty when the schedule has no slots. */
  hours: string
}

const FALLBACK_WEEKDAYS = [3, 5, 6]

export function todayBrussels(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(now)
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('fr-BE', { ...opts, timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))

/** "mercredi 4 novembre" */
export function formatDateFr(iso: string): string {
  return fmt(iso, { weekday: 'long', day: 'numeric', month: 'long' })
}

function closedForVacation(v: VacationBanner | null, date: string): boolean {
  // Only a dated holiday removes days; an undated banner is handled by
  // `disableOrdering` in the form.
  if (!v?.isActive || (!v.startDate && !v.endDate)) return false
  if (v.startDate && date < v.startDate) return false
  if (v.endDate && date > v.endDate) return false
  return true
}

/** Open pickup dates from the earliest allowed day, `days` calendar days ahead. */
export function upcomingPickupDates(
  schedule: ScheduleDay[],
  leadDays: number,
  vacation: VacationBanner | null,
  days: number,
  now: Date = new Date()
): PickupDate[] {
  const open = new Map<number, ScheduleDay | null>()
  for (const s of openDays(schedule)) {
    const i = dayIndex(s.day)
    if (i !== undefined) open.set(i, s)
  }
  if (open.size === 0) FALLBACK_WEEKDAYS.forEach((i) => open.set(i, null))

  const first = addDays(todayBrussels(now), leadDays)
  const out: PickupDate[] = []
  for (let n = 0; n < days; n++) {
    const date = addDays(first, n)
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
    if (!open.has(weekday) || closedForVacation(vacation, date)) continue
    const s = open.get(weekday)
    out.push({
      date,
      jour: fmt(date, { weekday: 'long' }).toLowerCase(),
      weekdayShort: fmt(date, { weekday: 'short' }),
      dayNumber: Number(date.slice(8, 10)),
      monthShort: fmt(date, { month: 'short' }),
      hours: (s?.slots || [])
        .map((slot) => `${formatTimeFr(slot.open, 'short')} — ${formatTimeFr(slot.close, 'short')}`)
        .join(' et '),
    })
  }
  return out
}

/**
 * Why a product is not made for a pickup on `date`, or null when it is.
 * Same rule as availableOn() in server/catalog.ts.
 */
export function unavailableReason(p: SanityProduct, date: string): string | null {
  if (p.isSeasonal && (p.seasonStart || p.seasonEnd)) {
    if (p.seasonStart && date < p.seasonStart) {
      const d = fmt(p.seasonStart, { day: 'numeric', month: 'long' })
      return `dès le ${d.replace(/^1 /, '1er ')}`
    }
    if (p.seasonEnd && date > p.seasonEnd) return 'saison terminée'
  }
  if (p.availability === 'saturday' && new Date(`${date}T00:00:00Z`).getUTCDay() !== 6) return 'le samedi uniquement'
  return null
}
