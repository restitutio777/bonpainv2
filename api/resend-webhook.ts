// Resend webhook — tells Benjamin when an order confirmation did not reach
// the customer.
//
// Resend accepting a mail (what api/order.ts checks) is not the same as the
// mail arriving: a mistyped but existing address, a full mailbox or a spam
// filter only show up later, as an event. Without this endpoint those events
// sit in the Resend dashboard and nobody looks. With it, Benjamin gets a
// short notice and can phone the customer.
//
// Setup (Resend dashboard → Webhooks → Add endpoint):
//   URL     https://<production domain>/api/resend-webhook
//   Events  email.bounced, email.complained, email.failed, email.suppressed
//   Then copy the signing secret into the Vercel env var RESEND_WEBHOOK_SECRET.
//
// Only mails tagged kind=confirmation (set in api/order.ts) trigger a notice,
// so a notice that bounces itself can never start a loop.

import { Resend } from 'resend'
import type { WebhookEventPayload } from 'resend'

const IS_PRODUCTION = process.env.VERCEL_ENV === 'production'

type EmailEventData = {
  to: string[]
  subject: string
  tags?: Record<string, string>
  bounce?: { message: string; type: string }
  failed?: { reason: string }
  suppressed?: { message: string }
}

const NOTIFY = new Set(['email.bounced', 'email.complained', 'email.failed', 'email.suppressed'])

function reasonOf(type: string, data: EmailEventData): string {
  if (type === 'email.bounced') return data.bounce?.message || 'adresse refusée par le serveur du destinataire'
  if (type === 'email.failed') return data.failed?.reason || "échec de l'envoi"
  if (type === 'email.suppressed')
    return data.suppressed?.message || "adresse bloquée après un refus précédent, l'e-mail n'a pas été envoyé"
  return ''
}

function buildNotice(type: string, data: EmailEventData) {
  const to = data.to.join(', ')
  if (type === 'email.complained') {
    return {
      subject: `⚠ Confirmation signalée comme spam — ${to}`,
      text: [
        `Le destinataire ${to} a signalé l'e-mail de confirmation comme spam.`,
        ``,
        `Objet : ${data.subject}`,
        ``,
        `Si ce n'est pas un client connu, quelqu'un a peut-être passé une commande avec son adresse.`,
        `Vérifiez la commande dans la liste du jour de retrait avant de la préparer.`,
        ``,
        `(Message automatique du site bonpainfaitmain.be)`,
      ].join('\n'),
    }
  }
  return {
    subject: `⚠ Confirmation non délivrée — ${to}`,
    text: [
      `L'e-mail de confirmation envoyé à ${to} n'est pas arrivé.`,
      ``,
      `Objet : ${data.subject}`,
      `Raison : ${reasonOf(type, data)}`,
      ``,
      `La commande est bien dans la liste du jour de retrait, mais le client n'a pas reçu de confirmation`,
      `(souvent une faute de frappe dans l'adresse). Si un numéro de téléphone figure dans la liste,`,
      `appelez-le pour confirmer.`,
      ``,
      `(Message automatique du site bonpainfaitmain.be)`,
    ].join('\n'),
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return new Response(null, { status: 405 })

    const secret = process.env.RESEND_WEBHOOK_SECRET
    const apiKey = process.env.RESEND_API_KEY
    if (!secret || !apiKey) {
      console.error('[resend-webhook] RESEND_WEBHOOK_SECRET or RESEND_API_KEY missing')
      return new Response(null, { status: 503 })
    }

    const resend = new Resend(apiKey)
    // The signature covers the exact bytes, so verify the raw body.
    const payload = await request.text()
    let event: WebhookEventPayload
    try {
      event = resend.webhooks.verify({
        payload,
        headers: {
          id: request.headers.get('svix-id') ?? '',
          timestamp: request.headers.get('svix-timestamp') ?? '',
          signature: request.headers.get('svix-signature') ?? '',
        },
        webhookSecret: secret,
      })
    } catch {
      console.warn('[resend-webhook] signature check failed')
      return new Response(null, { status: 401 })
    }

    if (!NOTIFY.has(event.type)) return new Response(null, { status: 204 })

    const data = event.data as EmailEventData
    const kind = data.tags?.kind ?? 'unknown'
    console.warn('[resend-webhook]', event.type, `kind=${kind}`)

    // Baker mails and the notices themselves: logged above, never mailed about.
    if (kind !== 'confirmation') return new Response(null, { status: 204 })

    // Test orders from preview deployments ("[TEST] " subject, see
    // api/order.ts) report to the same production webhook. Their notices
    // must not reach the bakery either.
    const isTest = data.subject.startsWith('[TEST] ')
    const from = process.env.ORDER_FROM_EMAIL
    const to = IS_PRODUCTION && !isTest ? process.env.ORDER_TO_EMAIL : process.env.ORDER_TO_EMAIL_PREVIEW
    if (!from || !to) {
      console.warn(`[resend-webhook] no notice sent (${isTest ? 'test order' : 'no sender/recipient'})`)
      return new Response(null, { status: 204 })
    }

    const notice = buildNotice(event.type, data)
    try {
      const { error } = await resend.emails.send({
        from,
        to: [to],
        subject: notice.subject,
        text: notice.text,
        tags: [{ name: 'kind', value: 'notice' }],
      })
      if (error) throw error
    } catch (e) {
      // 5xx makes Resend retry the delivery later.
      console.error('[resend-webhook] notice failed', e)
      return new Response(null, { status: 500 })
    }

    return new Response(null, { status: 200 })
  },
}
