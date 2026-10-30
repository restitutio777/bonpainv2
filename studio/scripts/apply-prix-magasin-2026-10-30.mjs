/**
 * Entscheidung Betreiber 30.10.2026: Was keinen klaren Preis hat, zeigt
 * « Prix en magasin » (Preis 0) und ist trotzdem bestellbar. So weiß Benjamin,
 * was zu backen ist; Preis und Zahlung im Geschäft.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-prix-magasin-2026-10-30.mjs
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-prix-magasin-2026-10-30.mjs --apply
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
  'product-tarte': { price: 0 },
  'product-tartelette': { orderInForm: true },
  'product-torsade-creme': { orderInForm: true },
  'product-gaufre': { orderInForm: true },
  'product-bun': { orderInForm: true },
  'product-petit-pain-courge': { orderInForm: true },
}

const run = async () => {
  const ids = Object.keys(PATCHES)
  const existing = await client.fetch(`*[_id in $ids]{_id, name, price, orderInForm}`, {
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
    console.log(`${doc.name} (${doc.price} €, form ${doc.orderInForm}) → ${JSON.stringify(PATCHES[id])}`)
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
