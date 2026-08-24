// Daily cron ping — keeps the Upstash Redis database from being archived.
//
// Upstash archives free-tier databases after a stretch of inactivity. That is
// exactly what happened to the previous instance: the host stopped resolving
// (ENOTFOUND), the daily digest silently degraded to one email per order, and
// nobody noticed because orders still went through. A once-a-day write keeps
// the database counted as active.
//
// Scheduled in vercel.json (crons). Vercel Hobby runs daily crons.

import { Redis } from '@upstash/redis'

type Req = { headers?: Record<string, string | string[] | undefined> }
type Res = {
  status: (code: number) => { json: (data: unknown) => void; end: () => void }
}

export default async function handler(req: Req, res: Res) {
  // Vercel sends CRON_SECRET as a bearer token when the env var is set.
  const secret = process.env.CRON_SECRET
  if (secret && req.headers?.authorization !== `Bearer ${secret}`) {
    return res.status(401).end()
  }

  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    console.error('[keepalive] Redis env vars missing')
    return res.status(500).json({ ok: false, reason: 'no-redis-env' })
  }

  try {
    const redis = new Redis({ url, token })
    const stamp = new Date().toISOString()
    await redis.set('keepalive:last', stamp)
    const readBack = await redis.get<string>('keepalive:last')
    console.log('[keepalive] ok', readBack)
    return res.status(200).json({ ok: true, at: readBack })
  } catch (e) {
    // Loud on purpose: if this starts failing, the digest is next.
    console.error('[keepalive] Redis ping failed', e)
    return res.status(500).json({ ok: false })
  }
}
