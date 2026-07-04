import type { ScheduleDay } from '../types'

// The studio stores English day values (see studio/schemas/schedule.ts).
export const DAY_LABELS_FR: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
}

export function dayLabelFr(day: string): string {
  return DAY_LABELS_FR[day] || day
}

// JS Date.getUTCDay() index per stored day value (sunday = 0).
const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

export function dayIndex(day: string): number | undefined {
  return DAY_INDEX[day]
}

function parseTime(t: string): { h: number; m: number } | null {
  const m = t.trim().match(/^(\d{1,2})[:hH](\d{2})?$/)
  if (!m) return null
  return { h: parseInt(m[1], 10), m: m[2] ? parseInt(m[2], 10) : 0 }
}

/**
 * Normalize studio time strings for display ("08:00" and "8:00" → "8h00").
 * 'short' drops zero minutes: "8h", "13h30".
 */
export function formatTimeFr(t: string, style: 'long' | 'short' = 'long'): string {
  const p = parseTime(t)
  if (!p) return t
  if (style === 'short' && p.m === 0) return `${p.h}h`
  return `${p.h}h${String(p.m).padStart(2, '0')}`
}

/** Days the bakery is open, with at least one time slot. */
export function openDays(schedule: ScheduleDay[]): ScheduleDay[] {
  return schedule.filter((s) => s.isOpen && s.slots && s.slots.length > 0)
}

export function isViennoiserieDay(s: ScheduleDay): boolean {
  return !!s.note && /viennoiserie/i.test(s.note)
}
