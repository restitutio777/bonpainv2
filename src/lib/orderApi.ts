// The order API is a Vercel serverless function. Since the go-live
// (2026-10-30) bonpainfaitmain.be is served by Vercel too, so it posts
// same-origin. On any other host (e.g. a copy on classic Apache hosting) a
// relative /api/order would hit the SPA fallback: the POST returns index.html
// with 200 and the order is silently lost. Post to Vercel directly there.
const VERCEL_API = 'https://bonpainv2.vercel.app/api'
const VERCEL_HOSTS = new Set(['bonpainfaitmain.be', 'www.bonpainfaitmain.be', 'localhost', '127.0.0.1'])

function apiEndpoint(name: 'order' | 'subscription'): string {
  const host = window.location.hostname
  const hasLocalApi = host.endsWith('.vercel.app') || VERCEL_HOSTS.has(host)
  return hasLocalApi ? `/api/${name}` : `${VERCEL_API}/${name}`
}

export const orderEndpoint = () => apiEndpoint('order')
export const subscriptionEndpoint = () => apiEndpoint('subscription')
