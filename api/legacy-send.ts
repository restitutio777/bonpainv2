// Answers the order form of the old site (v1) after the domain switch.
//
// v1 is a single-page app that posted orders to /send.php (PHP on the old
// host). A v1 tab or installed app that was opened before the switch keeps
// running from memory and still posts there, now to this deployment. Without
// this route Vercel answers 405 and v1 shows "Erreur: HTTP error! status: 405.
// Veuillez contacter directement au +32 …", which sends customers to the phone.
//
// v1 shows `message` from a 200 JSON response in its error box
// (bonpain-v1 src/services/contactService.ts), so this tells the customer to
// reopen the page. The order is not forwarded: v1 products and fields do not
// match the new order model, and a half-converted order is worse than none.
//
// Routed via the /send.php rewrite in vercel.json.

type Req = { method?: string }
type Res = {
  setHeader: (name: string, value: string) => void
  status: (code: number) => { json: (data: unknown) => void; end: () => void }
}

const MESSAGE =
  "Notre site vient d'être mis à jour et votre commande n'a pas été envoyée. " +
  'Fermez cette page (ou l’application), rouvrez-la et refaites votre commande. Merci !'

export default function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.setHeader('Location', '/')
    return res.status(302).end()
  }
  // No personal data in the log: only that an old client is still around.
  console.warn('[legacy-send] order from a v1 page that was open before the switch')
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ success: false, message: MESSAGE })
}
