// Emails to customers: order confirmation and everything about regular orders.
// Plain words, the pickup day in every subject (a bounce notice only carries
// the subject, see api/resend-webhook.ts), and the personal link wherever the
// customer might want to act.

import {
  BAKERY_ADDRESS,
  BAKERY_PHONE,
  SUBJECT_PREFIX,
  capitalize,
  escapeHtml,
  formatDayShort,
  formatPickupDate,
  formatTotal,
  hasByWeightLine,
  hasInStoreLine,
  siteUrl,
} from './common.js'
import type { OrderPayload } from './day.js'
import type { Subscription } from './subscriptions.js'
import type { Vacation } from './catalog.js'

type Mail = { subject: string; text: string; html: string }

const SIGNATURE_TEXT = (jour: string) => [`À ${jour},`, `Benjamin & Nadia`]
const SIGNATURE_HTML = (jour: string) => `<p>À ${escapeHtml(jour)},<br>Benjamin &amp; Nadia</p>`
const WRAP = (inner: string) =>
  `<div style="font-family: -apple-system, system-ui, sans-serif; color: #2D1F14; max-width: 560px; line-height: 1.6;">${inner}</div>`
const BUTTON = (url: string, label: string) =>
  `<p><a href="${escapeHtml(url)}" style="display: inline-block; background: #A67C52; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 600;">${escapeHtml(label)}</a></p>`
const MUTED = (s: string) => `<p style="color: #6E4D32; font-size: 14px;">${s}</p>`
const PHONE_HTML = `<a href="tel:+32493210925">${BAKERY_PHONE}</a>`

const itemsList = (sub: Subscription) => sub.items.map((i) => `${i.qty}× ${i.name}`)

export type RegularInfo = { firstDate: string; url: string; leadDays: number }

export function buildCustomerConfirmation(order: OrderPayload, regular?: RegularInfo): Mail {
  const { customer, pickup, items, total } = order
  const dateFr = formatPickupDate(pickup.date)
  const subject = `${SUBJECT_PREFIX}Votre commande chez Bon Pain Fait Main — retrait ${capitalize(pickup.jour)} ${dateFr}`
  const cgv = `${siteUrl()}/cgv`

  const regularText = regular
    ? [
        ``,
        `COMMANDE RÉGULIÈRE`,
        `Cette commande sera préparée chaque ${pickup.jour}, jusqu'à ce que vous l'arrêtiez.`,
        `Prochain retrait : ${formatDayShort(regular.firstDate)}.`,
        `Vous pouvez à tout moment changer les quantités, sauter une semaine ou arrêter,`,
        `au plus tard ${regular.leadDays} jours avant le retrait, avec votre lien personnel :`,
        regular.url,
        `Gardez cet e-mail : ce lien est votre accès. Pendant les congés de la boulangerie,`,
        `votre commande est suspendue automatiquement et nous vous prévenons par e-mail.`,
        `Conditions : ${cgv} (article 8).`,
      ]
    : []

  const text = [
    `Bonjour ${customer.prenom},`,
    ``,
    `Merci, on a bien reçu votre commande. Cet e-mail est votre confirmation.`,
    ``,
    `Retrait : ${capitalize(pickup.jour)} ${dateFr}`,
    `Adresse : ${BAKERY_ADDRESS}`,
    ``,
    `Votre commande :`,
    items,
    ``,
    `Total : ${formatTotal(total, hasByWeightLine(items), hasInStoreLine(items))}`,
    ...regularText,
    ``,
    `Pour modifier ou annuler, répondez simplement à cet email ou appelez le ${BAKERY_PHONE}.`,
    ``,
    ...SIGNATURE_TEXT(pickup.jour),
  ].join('\n')

  const regularHtml = regular
    ? `
      <div style="background: #F0E8DD; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Commande régulière</strong></p>
        <p style="margin: 0 0 8px;">Cette commande sera préparée <strong>chaque ${escapeHtml(pickup.jour)}</strong>, jusqu'à ce que vous l'arrêtiez. Prochain retrait : ${escapeHtml(formatDayShort(regular.firstDate))}.</p>
        <p style="margin: 0 0 8px;">Vous pouvez à tout moment changer les quantités, sauter une semaine ou arrêter, au plus tard ${regular.leadDays} jours avant le retrait.</p>
        ${BUTTON(regular.url, 'Gérer ma commande régulière')}
        <p style="margin: 0; color: #6E4D32; font-size: 13px;">Gardez cet e-mail : ce lien est votre accès. Pendant les congés de la boulangerie, votre commande est suspendue automatiquement et nous vous prévenons par e-mail. <a href="${escapeHtml(cgv)}" style="color: #6E4D32;">Conditions (article 8)</a></p>
      </div>`
    : ''

  const html = WRAP(`
      <p>Bonjour ${escapeHtml(customer.prenom)},</p>
      <p>Merci, on a bien reçu votre commande. Cet e-mail est votre confirmation.</p>
      <p>
        <strong>Retrait</strong><br>
        ${escapeHtml(capitalize(pickup.jour))} ${escapeHtml(dateFr)}<br>
        <span style="color: #6E4D32;">${escapeHtml(BAKERY_ADDRESS)}</span>
      </p>
      <p><strong>Votre commande</strong></p>
      <ul style="padding-left: 1.2em;">${items
        .split('\n')
        .map((l) => `<li style="margin: 4px 0;">${escapeHtml(l)}</li>`)
        .join('')}</ul>
      <p><strong>Total : ${escapeHtml(formatTotal(total, hasByWeightLine(items), hasInStoreLine(items)))}</strong></p>
      ${regularHtml}
      ${MUTED(`Pour modifier ou annuler, répondez simplement à cet email ou appelez le ${PHONE_HTML}.`)}
      ${SIGNATURE_HTML(pickup.jour)}
  `)

  return { subject, text, html }
}

/** After the customer changed items, weeks off or the remark. */
export function buildSubChanged(sub: Subscription, next: string | null, url: string): Mail {
  const subject = `${SUBJECT_PREFIX}Votre commande régulière du ${sub.weekday} est modifiée`
  const skips = sub.skipDates.filter((d) => !next || d >= next).map(formatDayShort)
  const text = [
    `Bonjour ${sub.customer.prenom},`,
    ``,
    `Votre commande régulière est enregistrée telle que vous l'avez modifiée :`,
    ``,
    `Chaque ${sub.weekday} :`,
    ...itemsList(sub).map((l) => `  ${l}`),
    sub.remarques ? `Remarque : ${sub.remarques}` : null,
    skips.length ? `Pas de retrait : ${skips.join(', ')}` : null,
    next ? `Prochain retrait : ${formatDayShort(next)}` : null,
    ``,
    `Gérer votre commande régulière : ${url}`,
    ``,
    ...SIGNATURE_TEXT(sub.weekday),
  ]
    .filter((l) => l !== null)
    .join('\n')

  const html = WRAP(`
      <p>Bonjour ${escapeHtml(sub.customer.prenom)},</p>
      <p>Votre commande régulière est enregistrée telle que vous l'avez modifiée.</p>
      <p><strong>Chaque ${escapeHtml(sub.weekday)}</strong></p>
      <ul style="padding-left: 1.2em;">${itemsList(sub)
        .map((l) => `<li style="margin: 4px 0;">${escapeHtml(l)}</li>`)
        .join('')}</ul>
      ${sub.remarques ? `<p>Remarque : ${escapeHtml(sub.remarques)}</p>` : ''}
      ${skips.length ? `<p>Pas de retrait : ${escapeHtml(skips.join(', '))}</p>` : ''}
      ${next ? `<p>Prochain retrait : <strong>${escapeHtml(formatDayShort(next))}</strong></p>` : ''}
      ${BUTTON(url, 'Gérer ma commande régulière')}
      ${SIGNATURE_HTML(sub.weekday)}
  `)
  return { subject, text, html }
}

/**
 * The regular order has ended. `stillPlanned` are dates whose list the bakery
 * already has (past the order deadline): they still happen unless cancelled
 * by phone, as for any order (CGV art. 7).
 */
export function buildSubEnded(sub: Subscription, by: 'customer' | 'bakery', stillPlanned: string[]): Mail {
  const subject = `${SUBJECT_PREFIX}Votre commande régulière du ${sub.weekday} est arrêtée`
  const planned = stillPlanned.map(formatDayShort).join(', ')
  const first =
    by === 'customer'
      ? `Vous avez arrêté votre commande régulière du ${sub.weekday}. Elle ne sera plus préparée.`
      : `La boulangerie a mis fin à votre commande régulière du ${sub.weekday}. Elle ne sera plus préparée.`
  const plannedLine =
    by === 'customer' && planned
      ? `La commande du ${planned} était déjà transmise à la boulangerie et reste prévue. Pour l'annuler, appelez-nous au ${BAKERY_PHONE}.`
      : null
  const text = [
    `Bonjour ${sub.customer.prenom},`,
    ``,
    first,
    plannedLine,
    ``,
    `Vous pouvez à tout moment passer une nouvelle commande sur ${siteUrl()}.`,
    `Une question ? Répondez à cet e-mail ou appelez le ${BAKERY_PHONE}.`,
    ``,
    `Benjamin & Nadia`,
  ]
    .filter((l) => l !== null)
    .join('\n')

  const html = WRAP(`
      <p>Bonjour ${escapeHtml(sub.customer.prenom)},</p>
      <p>${escapeHtml(first)}</p>
      ${plannedLine ? `<p><strong>${escapeHtml(plannedLine)}</strong></p>` : ''}
      ${MUTED(`Vous pouvez à tout moment passer une nouvelle commande sur <a href="${escapeHtml(siteUrl())}" style="color: #6E4D32;">notre site</a>. Une question ? Répondez à cet e-mail ou appelez le ${PHONE_HTML}.`)}
      <p>Benjamin &amp; Nadia</p>
  `)
  return { subject, text, html }
}

/** Sent once per closure to every regular order it affects. */
export function buildVacationNotice(
  sub: Subscription,
  vacation: Vacation,
  dates: string[],
  resume: string | null,
  url: string
): Mail {
  const subject = `${SUBJECT_PREFIX}Congés : votre commande régulière du ${sub.weekday} est suspendue`
  const period =
    vacation.startDate && vacation.endDate
      ? `du ${formatPickupDate(vacation.startDate)} au ${formatPickupDate(vacation.endDate)}`
      : vacation.endDate
        ? `jusqu'au ${formatPickupDate(vacation.endDate)}`
        : vacation.startDate
          ? `à partir du ${formatPickupDate(vacation.startDate)}`
          : null
  const closed = period ? `La boulangerie est fermée ${period}.` : `La boulangerie ferme pour congés.`
  const message = vacation.messageFr ? `« ${vacation.messageFr} »` : null
  const skipped = dates.length
    ? `Votre commande régulière n'est donc pas préparée le ${dates.map(formatDayShort).join(', ')}.`
    : `Votre commande régulière du ${sub.weekday} est suspendue pendant la fermeture.`
  const resumeLine = resume
    ? `Elle reprend automatiquement le ${formatDayShort(resume)}. Vous n'avez rien à faire.`
    : `Elle reprend automatiquement après la fermeture. Vous n'avez rien à faire.`

  const text = [
    `Bonjour ${sub.customer.prenom},`,
    ``,
    closed,
    message,
    ``,
    skipped,
    resumeLine,
    ``,
    `Gérer votre commande régulière : ${url}`,
    ``,
    `Benjamin & Nadia`,
  ]
    .filter((l) => l !== null)
    .join('\n')

  const html = WRAP(`
      <p>Bonjour ${escapeHtml(sub.customer.prenom)},</p>
      <p><strong>${escapeHtml(closed)}</strong></p>
      ${message ? `<p style="color: #6E4D32;">${escapeHtml(message)}</p>` : ''}
      <p>${escapeHtml(skipped)}<br>${escapeHtml(resumeLine)}</p>
      ${BUTTON(url, 'Gérer ma commande régulière')}
      <p>Benjamin &amp; Nadia</p>
  `)
  return { subject, text, html }
}
