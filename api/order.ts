// Vercel Serverless Function — receives orders from the OrderForm and
// sends two emails via Resend: one to Benjamin (the baker) and a
// confirmation to the customer.
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY    — from https://resend.com/api-keys
//   ORDER_TO_EMAIL    — Benjamin's inbox, e.g. bonpain.artisan@gmail.com
//   ORDER_FROM_EMAIL  — verified Resend sender, e.g. orders@bonpainfaitmain.be
//
// If RESEND_API_KEY is unset (preview / local), the handler logs the order
// and returns 200 so the form still works — without silently losing data in
// production, the key must be set.

import { Resend } from 'resend'

type OrderPayload = {
  customer: { nom: string; prenom: string; email: string; tel?: string }
  pickup: { jour: string; date: string }
  remarques?: string
  items: string
  total: number
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

const formatPrice = (n: number) => `€${n.toFixed(2).replace('.', ',')}`

const formatItemsHtml = (items: string) =>
  items
    .split('\n')
    .map((line) => `<li style="margin: 4px 0;">${escapeHtml(line)}</li>`)
    .join('')

function bakerEmail(order: OrderPayload) {
  const { customer, pickup, remarques, items, total } = order
  const subject = `Nouvelle commande — ${customer.prenom} ${customer.nom} — retrait ${pickup.jour} ${pickup.date}`

  const text = [
    `Nouvelle commande reçue.`,
    ``,
    `Client : ${customer.prenom} ${customer.nom}`,
    `Email  : ${customer.email}`,
    customer.tel ? `Tél    : ${customer.tel}` : null,
    ``,
    `Retrait : ${pickup.jour} ${pickup.date}`,
    ``,
    `Commande :`,
    items,
    ``,
    `Total : ${formatPrice(total)}`,
    remarques ? `\nRemarques : ${remarques}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; color: #2D1F14; max-width: 560px;">
      <p>Nouvelle commande reçue.</p>
      <p>
        <strong>Client</strong><br>
        ${escapeHtml(customer.prenom)} ${escapeHtml(customer.nom)}<br>
        <a href="mailto:${encodeURIComponent(customer.email)}">${escapeHtml(customer.email)}</a>
        ${customer.tel ? `<br><a href="tel:${escapeHtml(customer.tel.replace(/\s/g, ''))}">${escapeHtml(customer.tel)}</a>` : ''}
      </p>
      <p><strong>Retrait</strong><br>${escapeHtml(pickup.jour)} ${escapeHtml(pickup.date)}</p>
      <p><strong>Commande</strong></p>
      <ul style="padding-left: 1.2em;">${formatItemsHtml(items)}</ul>
      <p><strong>Total : ${escapeHtml(formatPrice(total))}</strong></p>
      ${remarques ? `<p><strong>Remarques</strong><br>${escapeHtml(remarques)}</p>` : ''}
    </div>
  `

  return { subject, text, html }
}

function customerEmail(order: OrderPayload) {
  const { customer, pickup, items, total } = order
  const subject = `Votre commande chez Bon Pain Fait Main`

  const text = [
    `Bonjour ${customer.prenom},`,
    ``,
    `Merci, on a bien reçu votre commande.`,
    ``,
    `Retrait : ${pickup.jour} ${pickup.date}`,
    `Adresse : Rue de la Roer 19, 4950 Waimes`,
    ``,
    `Votre commande :`,
    items,
    ``,
    `Total : ${formatPrice(total)}`,
    ``,
    `Pour modifier ou annuler, répondez simplement à cet email ou appelez le +32 493 21 09 25.`,
    ``,
    `À bientôt au fournil,`,
    `Benjamin & Nadia`,
  ].join('\n')

  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; color: #2D1F14; max-width: 560px; line-height: 1.6;">
      <p>Bonjour ${escapeHtml(customer.prenom)},</p>
      <p>Merci, on a bien reçu votre commande.</p>
      <p>
        <strong>Retrait</strong><br>
        ${escapeHtml(pickup.jour)} ${escapeHtml(pickup.date)}<br>
        <span style="color: #6E4D32;">Rue de la Roer 19, 4950 Waimes</span>
      </p>
      <p><strong>Votre commande</strong></p>
      <ul style="padding-left: 1.2em;">${formatItemsHtml(items)}</ul>
      <p><strong>Total : ${escapeHtml(formatPrice(total))}</strong></p>
      <p style="color: #6E4D32;">
        Pour modifier ou annuler, répondez simplement à cet email
        ou appelez le <a href="tel:+32493210925">+32 493 21 09 25</a>.
      </p>
      <p>À bientôt au fournil,<br>Benjamin &amp; Nadia</p>
    </div>
  `

  return { subject, text, html }
}

export default async function handler(req: { method?: string; body: unknown }, res: {
  status: (code: number) => { json: (data: unknown) => void; end: () => void }
}) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const order = req.body as OrderPayload

  if (!order?.customer?.email || !order?.items || !order?.pickup?.jour) {
    return res.status(400).json({ error: 'Invalid order payload' })
  }

  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.ORDER_TO_EMAIL
  const fromEmail = process.env.ORDER_FROM_EMAIL

  // Always log — Vercel logs are the safety net if email delivery fails.
  console.log('[order]', JSON.stringify(order))

  if (!apiKey || !toEmail || !fromEmail) {
    console.warn('[order] Resend env vars missing — order logged but no email sent')
    return res.status(200).json({ ok: true, delivery: 'logged' })
  }

  const resend = new Resend(apiKey)
  const baker = bakerEmail(order)
  const customer = customerEmail(order)

  const [bakerRes, customerRes] = await Promise.allSettled([
    resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: order.customer.email,
      subject: baker.subject,
      text: baker.text,
      html: baker.html,
    }),
    resend.emails.send({
      from: fromEmail,
      to: [order.customer.email],
      replyTo: toEmail,
      subject: customer.subject,
      text: customer.text,
      html: customer.html,
    }),
  ])

  if (bakerRes.status === 'rejected') {
    console.error('[order] baker email failed', bakerRes.reason)
    return res.status(500).json({ error: 'Email delivery failed' })
  }

  if (customerRes.status === 'rejected') {
    console.warn('[order] customer confirmation failed', customerRes.reason)
  }

  return res.status(200).json({ ok: true })
}
