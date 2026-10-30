// Shared helpers for the functions in api/. Vercel turns every file in api/
// into a function, so shared code lives here and is imported with a `.js`
// suffix (the package is ESM; Node needs the extension at runtime).

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { Redis } from '@upstash/redis'
import { Resend } from 'resend'

// Preview deployments share the production env vars and Redis store. Keep
// their data out of the real lists and their mail away from the bakery.
export const IS_PRODUCTION = process.env.VERCEL_ENV === 'production'
export const KEY_PREFIX = IS_PRODUCTION ? '' : 'preview:'
export const SUBJECT_PREFIX = IS_PRODUCTION ? '' : '[TEST] '

export const BAKERY_PHONE = '+32 493 21 09 25'
export const BAKERY_ADDRESS = 'Rue de la Roer 19, 4950 Waimes'

export const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

// The form submits the weekday lowercased ("mercredi"); the emails read
// better capitalized, and the transform is deterministic so the digest
// subject stays constant per pickup day (Gmail threading depends on that).
export const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export const formatPrice = (n: number) => `€${n.toFixed(2).replace('.', ',')}`

/** Bread sold by the kilo is weighed at pickup, so such a total is approximate. */
export const formatTotal = (n: number, byWeight: boolean, inStore = false) => {
  if (inStore && n === 0) return 'prix en magasin'
  const base = `${formatPrice(n)}${byWeight ? ' environ (pains au kilo pesés au retrait)' : ''}`
  return inStore ? `${base} + articles au prix du magasin` : base
}

export const hasByWeightLine = (items: string) => /\(\d+ g\) — €/.test(items)

export const hasInStoreLine = (items: string) => items.includes(' — prix en magasin')

/** YYYY-MM-DD → DD/MM/YYYY (French convention, subjects and bodies). */
export const formatPickupDate = (iso: string): string => {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

/** "vendredi 23/10" — weekday and short date for running text. */
export const formatDayShort = (iso: string): string => `${weekdayOf(iso)} ${formatPickupDate(iso).slice(0, 5)}`

/** Today's date in Belgium, YYYY-MM-DD. All order dates are Belgian dates. */
export function todayBrussels(now: Date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Brussels',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** French weekday of a YYYY-MM-DD date ("vendredi"). */
export function weekdayOf(iso: string): string {
  return WEEKDAYS[new Date(`${iso}T00:00:00Z`).getUTCDay()]
}

/** Earliest pickup date the form offers: today in Belgium plus the lead time. */
export function earliestPickup(leadDays: number, now: Date = new Date()): string {
  return addDays(todayBrussels(now), leadDays)
}

/** Short, non-reversible key part for rate limits (no raw IPs or addresses in Redis). */
export const hashed = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 32)

export function redisFromEnv(): Redis | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  return url && token ? new Redis({ url, token }) : null
}

export type MailConfig = { resend: Resend; toEmail: string; fromEmail: string }

/** A bare address shows as "orders" in the inbox; give it the bakery's name. */
export const senderWithName = (address: string) =>
  address.includes('<') ? address : `Bon Pain Fait Main <${address}>`

export function mailFromEnv(): MailConfig | null {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.ORDER_TO_EMAIL
  const fromEmail = process.env.ORDER_FROM_EMAIL
  if (!apiKey || !toEmail || !fromEmail) return null
  return { resend: new Resend(apiKey), toEmail, fromEmail: senderWithName(fromEmail) }
}

/**
 * Where mail for the bakery goes. Preview deployments never mail the bakery:
 * ORDER_TO_EMAIL_PREVIEW, or the given fallback (the test order's own address).
 */
export function bakeryInbox(mail: MailConfig, previewFallback: string): string {
  return IS_PRODUCTION ? mail.toEmail : process.env.ORDER_TO_EMAIL_PREVIEW || previewFallback
}

type Mail = Parameters<Resend['emails']['send']>[0]

/** Resend v6 resolves with { data, error } and only rejects on network failures — check both. Returns the error, or null. */
export async function send(resend: Resend, mail: Mail): Promise<unknown> {
  try {
    const { error } = await resend.emails.send(mail)
    return error ?? null
  } catch (e) {
    return e ?? 'unknown error'
  }
}

/**
 * Public address of this deployment, for links in emails. SITE_URL overrides
 * (set it during the domain move if the custom domain does not serve this
 * deployment yet).
 */
export function siteUrl(): string {
  const override = process.env.SITE_URL
  if (override) return override.replace(/\/$/, '')
  const host = IS_PRODUCTION
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL
  return host ? `https://${host}` : 'https://bonpainv2.vercel.app'
}

// ── Subscription links ──────────────────────────────────────────────────
// Links are derived from SUBSCRIPTION_SECRET instead of stored, so nothing in
// Redis lets anyone change a subscription, and every email can carry the
// link again. Rotating the secret invalidates all links already sent.

export type LinkRole = 'customer' | 'bakery'

export function linkSecretConfigured(): boolean {
  return !!process.env.SUBSCRIPTION_SECRET
}

function linkToken(role: LinkRole, id: string): string {
  const secret = process.env.SUBSCRIPTION_SECRET
  if (!secret) throw new Error('SUBSCRIPTION_SECRET missing')
  return createHmac('sha256', secret)
    .update(`${KEY_PREFIX}${role}:${id}`)
    .digest('base64url')
    .slice(0, 24)
}

/** Management page link. The token sits in the fragment, so it never reaches server logs or Referer headers. */
export function manageUrl(role: LinkRole, id: string): string {
  const ref = role === 'bakery' ? `b.${id}.${linkToken(role, id)}` : `${id}.${linkToken(role, id)}`
  return `${siteUrl()}/abonnement#${ref}`
}

/** Parses "id.token" / "b.id.token" and checks the token. */
export function verifyRef(ref: unknown): { role: LinkRole; id: string } | null {
  if (typeof ref !== 'string' || ref.length > 80 || !linkSecretConfigured()) return null
  const parts = ref.split('.')
  const [role, id, token]: [LinkRole, string | undefined, string | undefined] =
    parts.length === 3 && parts[0] === 'b' ? ['bakery', parts[1], parts[2]] : ['customer', parts[0], parts[1]]
  if (!id || !token || !/^[A-Za-z0-9_-]{8,32}$/.test(id) || parts.length > 3) return null
  const expected = Buffer.from(linkToken(role, id))
  const given = Buffer.from(token)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  return { role, id }
}

// ── HTTP ────────────────────────────────────────────────────────────────

export type Req = {
  method?: string
  body: unknown
  query?: Record<string, string | string[] | undefined>
  headers?: Record<string, string | string[] | undefined>
}
export type Res = {
  status: (code: number) => { json: (data: unknown) => void; end: () => void }
  setHeader: (key: string, value: string) => void
}

// The static build may also be served from the bakery's own domain while it
// is hosted elsewhere; the pages there post cross-origin to these functions.
const ALLOWED_ORIGINS = new Set(['https://bonpainfaitmain.be', 'https://www.bonpainfaitmain.be'])

export function applyCors(req: Req, res: Res) {
  const origin = typeof req.headers?.origin === 'string' ? req.headers.origin : ''
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Max-Age', '86400')
  }
}

export function clientIp(req: Req): string {
  const fwd = req.headers?.['x-forwarded-for']
  const raw = Array.isArray(fwd) ? fwd[0] : fwd
  return (typeof raw === 'string' ? raw.split(',')[0].trim() : '') || 'unknown'
}

/** Counts this request; true when over `max`. Fails open: a Redis hiccup must not cost an order. */
export async function overLimit(redis: Redis, key: string, max: number, ttlSeconds: number): Promise<boolean> {
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, ttlSeconds)
    return count > max
  } catch (e) {
    console.error('[limit] rate limit check failed', e)
    return false
  }
}

/** Vercel sends CRON_SECRET as a bearer token when the env var is set. */
export function cronAuthorized(req: Req): boolean {
  const secret = process.env.CRON_SECRET
  return !secret || req.headers?.authorization === `Bearer ${secret}`
}
