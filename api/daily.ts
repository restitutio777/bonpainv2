// Daily cron (vercel.json, 23:00 UTC = just after midnight in Belgium):
// final lists for the pickup days that just closed, and vacation notices for
// regular orders. The work itself is in server/daily.ts; api/keepalive.ts
// repeats it at 05:00 UTC to catch up.
//
// Preview deployments have no cron and no CRON_SECRET. There, `?date=` sends
// the final list for that day straight away (to the test addresses), for
// testing.

import { IS_PRODUCTION, KEY_PREFIX, clientIp, cronAuthorized, hashed, overLimit, redisFromEnv, type Req, type Res } from '../server/common.js'
import { runDaily } from '../server/daily.js'

export default async function handler(req: Req, res: Res) {
  if (!cronAuthorized(req)) return res.status(401).end()

  const q = req.query?.date
  const onlyDate = !IS_PRODUCTION && typeof q === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : undefined
  if (!IS_PRODUCTION) {
    const redis = redisFromEnv()
    if (redis && (await overLimit(redis, `${KEY_PREFIX}ratelimit:daily:${hashed(clientIp(req))}`, 10, 3600))) {
      return res.status(429).end()
    }
  }

  const report = await runDaily({ onlyDate })
  console.log('[daily]', JSON.stringify(report))
  return res.status(report.error ? 500 : 200).json(report)
}
