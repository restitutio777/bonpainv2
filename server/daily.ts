// Once a day, just after midnight in Belgium (api/daily.ts, cron 23:00 UTC,
// Vercel Hobby fires within that hour):
//
//   1. Final list for each pickup day that has just closed for orders. Until
//      now the bakery only got a list when a new order came in, so a day with
//      only regular orders would never be announced.
//   2. Vacation notices: when the vacation banner is active, every regular
//      order it suspends gets one email, once per closure.
//
// Both steps are idempotent (Redis markers), so api/keepalive.ts runs them
// again at 05:00 UTC to catch up on a failed or skipped night.

import type { Redis } from '@upstash/redis'
import {
  KEY_PREFIX,
  addDays,
  bakeryInbox,
  hashed,
  linkSecretConfigured,
  mailFromEnv,
  manageUrl,
  redisFromEnv,
  send,
  todayBrussels,
  weekdayOf,
  type MailConfig,
} from './common.js'
import { closedForVacation, fetchCatalog, isSalesDay, type Catalog } from './catalog.js'
import { buildBakerDigest, dayEntries, finalListKey } from './day.js'
import { buildVacationNotice } from './mails.js'
import { activeSubs, nextDates, type Subscription } from './subscriptions.js'

// Resend Free sends 100 mails a day; orders can use up to 80 of them.
const MAX_NOTICES_PER_RUN = 30
const MARKER_TTL = 30 * 24 * 3600

export type FinalListStatus = 'sent' | 'empty' | 'already-sent' | 'no-sales-day' | 'failed'
export type DailyReport = {
  today?: string
  finalLists: { date: string; status: FinalListStatus; orders?: number }[]
  notices: { sent: number; failed: number; pending: number }
  error?: string
}

/** Pickup days that can no longer be ordered for, from tomorrow on (today when orders close the day before). */
export function closedDates(today: string, leadDays: number): string[] {
  if (leadDays <= 1) return [today]
  const dates: string[] = []
  for (let i = 1; i < leadDays; i++) dates.push(addDays(today, i))
  return dates
}

async function finalList(
  redis: Redis,
  mail: MailConfig,
  catalog: Catalog,
  date: string,
  force: boolean
): Promise<{ status: FinalListStatus; orders?: number }> {
  const weekday = weekdayOf(date)
  const marker = finalListKey(date)
  if (!force && !isSalesDay(catalog, weekday)) return { status: 'no-sales-day' }
  if (!force && (await redis.get(marker))) return { status: 'already-sent' }

  const entries = await dayEntries(redis, date, catalog)
  if (entries.length === 0) {
    await redis.set(marker, 'empty', { ex: MARKER_TTL })
    return { status: 'empty' }
  }

  const digest = buildBakerDigest(entries, { jour: weekday, date }, { final: true })
  const failure = await send(mail.resend, {
    from: mail.fromEmail,
    to: [bakeryInbox(mail, entries[0].customer.email)],
    subject: digest.subject,
    text: digest.text,
    html: digest.html,
    tags: [{ name: 'kind', value: 'order' }],
  })
  if (failure) {
    console.error('[daily] final list not sent', date, failure)
    return { status: 'failed', orders: entries.length }
  }
  await redis.set(marker, 'sent', { ex: MARKER_TTL })
  return { status: 'sent', orders: entries.length }
}

/** Dates the closure takes from this regular order (from today on), and when it resumes. */
export function vacationImpact(
  sub: Subscription,
  catalog: Catalog,
  today: string
): { affected: boolean; dates: string[]; resume: string | null } {
  const v = catalog.vacation
  if (!v || !v.isActive || !isSalesDay(catalog, sub.weekday)) return { affected: false, dates: [], resume: null }
  if (!v.endDate) {
    // Open-ended closure: every date is off while the banner stays active.
    return { affected: true, dates: [], resume: null }
  }
  if (v.endDate < today) return { affected: false, dates: [], resume: null }
  const from = v.startDate && v.startDate > today ? v.startDate : today
  const dates = nextDates(sub, from, 60).filter(
    (d) => d <= v.endDate! && closedForVacation(v, d) && !sub.skipDates.includes(d)
  )
  const resume = nextDates(sub, addDays(v.endDate, 1), 26).find((d) => !sub.skipDates.includes(d)) ?? null
  return { affected: dates.length > 0, dates, resume }
}

async function vacationNotices(
  redis: Redis,
  mail: MailConfig,
  catalog: Catalog,
  today: string
): Promise<DailyReport['notices']> {
  const result = { sent: 0, failed: 0, pending: 0 }
  const v = catalog.vacation
  if (!v || !v.isActive || (v.endDate && v.endDate < today)) return result
  if (!linkSecretConfigured()) {
    console.error('[daily] SUBSCRIPTION_SECRET missing, vacation notices not sent')
    return result
  }

  // One notice per closure: the dates identify it (the message alone when there are none).
  const key = `${KEY_PREFIX}vacnotice:${hashed(v.startDate || v.endDate ? `${v.startDate}|${v.endDate}` : `msg|${v.messageFr}`)}`
  const subs = await activeSubs(redis)
  for (const sub of subs) {
    const impact = vacationImpact(sub, catalog, today)
    if (!impact.affected) continue
    if (await redis.sismember(key, sub.id)) continue
    if (result.sent + result.failed >= MAX_NOTICES_PER_RUN) {
      result.pending++
      continue
    }
    const notice = buildVacationNotice(sub, v, impact.dates, impact.resume, manageUrl('customer', sub.id))
    const failure = await send(mail.resend, {
      from: mail.fromEmail,
      to: [sub.customer.email],
      replyTo: bakeryInbox(mail, sub.customer.email),
      subject: notice.subject,
      text: notice.text,
      html: notice.html,
      tags: [{ name: 'kind', value: 'subscription' }],
    })
    if (failure) {
      console.error('[daily] vacation notice failed', sub.id, failure)
      result.failed++
      continue
    }
    await redis.sadd(key, sub.id)
    await redis.expire(key, 400 * 24 * 3600)
    result.sent++
  }
  return result
}

export async function runDaily(opts: { onlyDate?: string } = {}): Promise<DailyReport> {
  const report: DailyReport = { finalLists: [], notices: { sent: 0, failed: 0, pending: 0 } }
  const redis = redisFromEnv()
  const mail = mailFromEnv()
  if (!redis || !mail) return { ...report, error: 'not_configured' }

  // Without Sanity there are no closures or prices: better to wait for the
  // 05:00 catch-up than to send a wrong final list.
  const catalog = await fetchCatalog()
  if (!catalog) return { ...report, error: 'catalog_unavailable' }

  const today = todayBrussels()
  report.today = today
  const dates = opts.onlyDate ? [opts.onlyDate] : closedDates(today, catalog.leadDays)
  for (const date of dates) {
    try {
      report.finalLists.push({ date, ...(await finalList(redis, mail, catalog, date, !!opts.onlyDate)) })
    } catch (e) {
      console.error('[daily] final list error', date, e)
      report.finalLists.push({ date, status: 'failed' })
    }
  }
  try {
    report.notices = await vacationNotices(redis, mail, catalog, today)
  } catch (e) {
    console.error('[daily] vacation notices error', e)
    report.error = 'notices_failed'
  }
  if (report.finalLists.some((f) => f.status === 'failed')) report.error = report.error ?? 'final_list_failed'
  return report
}
