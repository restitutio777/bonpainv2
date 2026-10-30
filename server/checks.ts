// Input checks for the public endpoints. The confirmation goes to whatever
// address the payload carries, so everything that ends up in a mail is
// checked: names, the pickup day, the item lines, remarks. No links anywhere.

import { Resolver } from 'node:dns/promises'
import { WEEKDAYS } from './common.js'
import type { OrderPayload } from './day.js'

export const MAX = {
  name: 80,
  email: 160,
  tel: 40,
  remarques: 1000,
  items: 4000,
  lines: 30,
  qty: 20, // same cap as the form's +/- buttons
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)
const NAME = /^[\p{L}\p{M}][\p{L}\p{M}'’ .-]*$/u
// "site.com" — a dot glued between word characters reads as a domain.
const DOMAIN_LIKE = /[\p{L}\d-]\.\p{L}{2,}/u
export const LINK = /https?:\/\/|www\./i
const TEL = /^[0-9+()./\s-]*$/
// "1x Pain aux fruits — au poids (€15,90/kg)": amount unknown until weighed.
const ITEM_LINE = /^(\d{1,2})x (.{1,80}?) — (?:€(\d{1,4},\d{2})|au poids \(€\d{1,4},\d{2}\/kg\))$/
// Used only while Sanity is unreachable: product names have no dots,
// slashes, colons or @, so nothing in a line can become a link.
export const ITEM_NAME_FALLBACK = /^[\p{L}\p{M}0-9'’ (),-]+$/u

export type Rejection = { status: number; body: Record<string, unknown> }
export type ItemLine = { qty: number; name: string; amount: number }

export const invalid = (field: string): Rejection => ({ status: 400, body: { error: 'invalid', field } })
const hasLink = (field: string): Rejection => ({ status: 400, body: { error: 'links', field } })

export const isRejection = (x: unknown): x is Rejection =>
  typeof x === 'object' && x !== null && 'status' in x && 'body' in x

function checkName(v: unknown, field: string): Rejection | string {
  if (typeof v !== 'string' || !v.trim() || v.length > MAX.name) return invalid(field)
  const s = v.trim()
  if (LINK.test(s) || DOMAIN_LIKE.test(s) || s.includes('@')) return hasLink(field)
  return NAME.test(s) ? s : invalid(field)
}

function checkOptional(v: unknown, max: number, field: string): Rejection | string | undefined {
  if (v === undefined || v === null || v === '') return undefined
  if (typeof v !== 'string' || v.length > max) return invalid(field)
  return v.trim() || undefined
}

/** Free-text remark: optional, bounded, no links. */
export function checkRemarques(v: unknown): Rejection | string | undefined {
  const r = checkOptional(v, MAX.remarques, 'remarques')
  if (isRejection(r)) return r
  if (r && LINK.test(r)) return hasLink('remarques')
  return r
}

/** Returns a cleaned order (trimmed fields, total recomputed from the lines) or a rejection. */
export function checkPayload(
  raw: unknown
): { order: OrderPayload; lines: ItemLine[]; subscribe: boolean } | Rejection {
  const o = raw as (Partial<OrderPayload> & { subscribe?: unknown }) | null
  if (!o || typeof o !== 'object' || !o.customer || !o.pickup) return invalid('payload')
  const c = o.customer

  const nom = checkName(c.nom, 'nom')
  if (isRejection(nom)) return nom
  const prenom = checkName(c.prenom, 'prenom')
  if (isRejection(prenom)) return prenom

  if (typeof c.email !== 'string' || c.email.length > MAX.email) return invalid('email')
  const email = c.email.trim()
  if (!isEmail(email)) return invalid('email')

  const tel = checkOptional(c.tel, MAX.tel, 'tel')
  if (isRejection(tel)) return tel
  if (tel && !TEL.test(tel)) return invalid('tel')

  const remarques = checkRemarques(o.remarques)
  if (isRejection(remarques)) return remarques

  const jour = typeof o.pickup.jour === 'string' ? o.pickup.jour.toLowerCase() : ''
  const date = typeof o.pickup.date === 'string' ? o.pickup.date : ''
  if (!WEEKDAYS.includes(jour)) return invalid('jour')
  const day = new Date(`${date}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(day.getTime())) return invalid('date')
  if (day.toISOString().slice(0, 10) !== date) return invalid('date') // 2026-02-31 etc.
  if (WEEKDAYS[day.getUTCDay()] !== jour) return invalid('date')
  if (day.getTime() < Date.now() - 2 * 24 * 3600 * 1000) return invalid('date')

  if (typeof o.items !== 'string' || o.items.length > MAX.items) return invalid('items')
  const rawLines = o.items.split('\n').map((l) => l.trim()).filter(Boolean)
  if (rawLines.length === 0 || rawLines.length > MAX.lines) return invalid('items')
  const lines: ItemLine[] = []
  for (const line of rawLines) {
    const m = line.match(ITEM_LINE)
    if (!m) return invalid('items')
    const qty = parseInt(m[1], 10)
    if (qty < 1 || qty > MAX.qty) return invalid('items')
    lines.push({ qty, name: m[2], amount: m[3] ? parseFloat(m[3].replace(',', '.')) : 0 })
  }

  const total = Math.round(lines.reduce((sum, l) => sum + l.amount, 0) * 100) / 100

  if (o.subscribe !== undefined && typeof o.subscribe !== 'boolean') return invalid('subscribe')

  return {
    order: {
      customer: { nom, prenom, email, ...(tel ? { tel } : {}) },
      pickup: { jour, date },
      ...(remarques ? { remarques } : {}),
      items: rawLines.join('\n'),
      total,
    },
    lines,
    subscribe: o.subscribe === true,
  }
}

const DNS_NO_SUCH = new Set(['ENOTFOUND', 'ENODATA'])

/**
 * False only when DNS says for certain that the domain cannot receive mail
 * ("gmail.col"). A resolver hiccup must not cost an order.
 */
export async function mailDomainExists(domain: string): Promise<boolean> {
  const resolver = new Resolver({ timeout: 2500, tries: 2 })
  const results = await Promise.allSettled([
    resolver.resolveMx(domain),
    resolver.resolve4(domain),
    resolver.resolve6(domain),
  ])
  const definitelyMissing = results.every((r) =>
    r.status === 'fulfilled'
      ? r.value.length === 0
      : DNS_NO_SUCH.has((r.reason as NodeJS.ErrnoException)?.code ?? '')
  )
  return !definitelyMissing
}
