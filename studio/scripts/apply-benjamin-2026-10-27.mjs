/**
 * Antworten Benjamin 27.10.2026 auf die Rückfragen zu den Zutaten:
 *   - Tartelette heißt « Tartelette aux noix » (noix ou noisettes, noix de
 *     cajou, graines de tournesol, graines de courge, beurre, œuf).
 *   - Bun: beurre, lait, levure, curcuma.
 * Name und Kurzbeschreibung angleichen; `_id` und Slug bleiben. Allergene
 * setzt apply-allergenes-2026-10.mjs.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-benjamin-2026-10-27.mjs
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-benjamin-2026-10-27.mjs --apply
 */
import { createClient } from '@sanity/client'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) {
  console.error('✗ SANITY_WRITE_TOKEN manquant.')
  process.exit(1)
}
const apply = process.argv.includes('--apply')

const client = createClient({
  projectId: '5f1udd5l',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
  perspective: 'raw',
})

const PATCHES = {
  'product-tartelette': {
    name: 'Tartelette aux noix',
    description:
      'Petite tarte individuelle préparée maison, garnie de noix ou de noisettes, de noix de cajou, de graines de tournesol et de graines de courge.',
  },
  'product-bun': {
    description: 'Petit pain burger au sésame, au beurre et au lait, doré au curcuma.',
  },
}

const run = async () => {
  const ids = Object.keys(PATCHES)
  const existing = await client.fetch(`*[_id in $ids]{_id, name, description}`, {
    ids: [...ids, ...ids.map((id) => `drafts.${id}`)],
  })
  const byId = new Map(existing.map((d) => [d._id, d]))

  let tx = client.transaction()
  for (const id of ids) {
    const doc = byId.get(id)
    if (!doc) {
      console.warn(`⚠ introuvable: ${id}`)
      continue
    }
    console.log(`${doc.name}\n   avant : ${doc.description}\n   après : ${JSON.stringify(PATCHES[id])}\n`)
    tx = tx.patch(id, (p) => p.set(PATCHES[id]))
    if (byId.has(`drafts.${id}`)) tx = tx.patch(`drafts.${id}`, (p) => p.set(PATCHES[id]))
  }

  if (!apply) {
    console.log('(Probelauf) Mit --apply schreiben.')
    return
  }
  await tx.commit()
  console.log('✓ geschrieben.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
