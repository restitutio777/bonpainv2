// The order API is a Vercel serverless function. The static build is also
// uploaded to classic Apache hosting (bonpainfaitmain.be), where a relative
// /api/order hits the SPA fallback: the POST returns index.html with 200 and
// the order is silently lost. Post to the Vercel deployment directly unless
// the site is already running on it.
const VERCEL_ORDER_ENDPOINT = 'https://bonpainv2.vercel.app/api/order'

export function orderEndpoint(): string {
  const host = window.location.hostname
  const hasLocalApi =
    host.endsWith('.vercel.app') || host === 'localhost' || host === '127.0.0.1'
  return hasLocalApi ? '/api/order' : VERCEL_ORDER_ENDPOINT
}
