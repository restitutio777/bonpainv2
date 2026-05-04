// Vercel Serverless Function — receives orders from the OrderForm.
// TODO: wire Resend (https://resend.com) to email Benjamin when an order arrives.
//
// Expected env vars (set in Vercel project settings → Environment Variables):
//   RESEND_API_KEY      — from resend.com/api-keys
//   ORDER_TO_EMAIL      — bonpain.artisan@gmail.com
//   ORDER_FROM_EMAIL    — orders@bonpainfaitmain.be (must be verified in Resend)
//
// Once those are set, replace the console.log block below with:
//   import { Resend } from 'resend'
//   const resend = new Resend(process.env.RESEND_API_KEY!)
//   await resend.emails.send({ ... })

type OrderPayload = {
  customer: { nom: string; prenom: string; email: string; tel?: string }
  pickup: { jour: string; date: string }
  remarques?: string
  items: string
  total: number
}

export default async function handler(req: { method?: string; body: unknown }, res: {
  status: (code: number) => { json: (data: unknown) => void; end: () => void }
}) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const order = req.body as OrderPayload

  if (!order?.customer?.email || !order?.items) {
    return res.status(400).json({ error: 'Invalid order payload' })
  }

  // Visible in Vercel → Project → Logs
  console.log('[order]', JSON.stringify(order))

  return res.status(200).json({ ok: true })
}
