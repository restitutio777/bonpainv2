// Spots likely typos in the email domain ("gmail.col", "hotmial.com") so the
// form can ask "did you mean …?". Only a hint: the order is never blocked
// here. The server separately rejects domains that do not exist at all.
//
// The list covers the providers the bakery's customers use (Belgium, the
// German-speaking East Cantons, France). Close neighbours that are real
// domains (live.be / live.de) are both listed so neither triggers a hint.
const KNOWN_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.be', 'hotmail.fr', 'hotmail.de',
  'outlook.com', 'outlook.be', 'outlook.fr', 'outlook.de',
  'live.com', 'live.be', 'live.fr', 'live.de', 'msn.com',
  'yahoo.com', 'yahoo.fr', 'yahoo.de',
  'icloud.com', 'me.com',
  'skynet.be', 'telenet.be', 'proximus.be', 'scarlet.be', 'voo.be',
  'gmx.de', 'gmx.net', 'gmx.be', 'web.de', 't-online.de',
  'orange.fr', 'free.fr', 'laposte.net', 'sfr.fr', 'wanadoo.fr',
  'protonmail.com', 'proton.me',
]

/** Edit distance where swapping two neighbouring letters counts as one edit. */
function distance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[a.length][b.length]
}

/** The corrected address, or null when the domain looks fine. */
export function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf('@')
  if (at < 1) return null
  const local = email.slice(0, at).trim()
  const domain = email.slice(at + 1).trim().toLowerCase()
  if (!domain || KNOWN_DOMAINS.includes(domain)) return null

  const maxEdits = domain.length <= 7 ? 1 : 2
  let best: { domain: string; d: number } | null = null
  for (const known of KNOWN_DOMAINS) {
    const d = distance(domain, known)
    if (d <= maxEdits && (!best || d < best.d)) best = { domain: known, d }
  }
  return best ? `${local}@${best.domain}` : null
}
