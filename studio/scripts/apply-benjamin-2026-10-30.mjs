/**
 * Mail Benjamin 30.10.2026: Preise, Gewichte, neuer Name.
 *   - Pain aux fruits und Pain à la coupe werden pro Kilo verkauft (`priceUnit`),
 *     online bestellt in Portionen von 500 g (`portionGrams`).
 *   - Torsade à la crème heißt wortgetreu « Rose aux chocolat crème »; `_id` und Slug bleiben,
 *     Allergene wie Pain au chocolat (Spuren aus der Schokolade).
 * Nicht in seiner Liste und deshalb unverändert: Pain fagnard, Pain d’épeautre.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-benjamin-2026-10-30.mjs
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-benjamin-2026-10-30.mjs --apply
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

const NBSP = ' '

const PATCHES = {
  'product-pain-gris': { price: 3.9 },
  'product-rustik': { price: 5.6 },
  'product-epeautre-sesame': { price: 6.3 },
  'd0c43f74-48f6-4946-b19b-75f6e2fccb6f': { price: 7.6 },
  'product-pain-seigle': { price: 5.6 },
  'product-pain-fruits-secs': { price: 15.9, priceUnit: 'kg', portionGrams: 500 },
  'product-pain-blanc-coupe': { price: 7.3, priceUnit: 'kg', portionGrams: 500 },
  'product-pain-noix': { price: 7.3 },
  'product-cramique': { price: 7.6 },
  'product-rustik-lin-tournesol': { price: 6.25 },
  'product-baguette': { price: 2.5 },
  'product-torsade-creme': {
    name: 'Rose aux chocolat crème',
    description:
      'Viennoiserie moelleuse roulée en rose, garnie de chocolat et d’une crème douce. Parfaite avec un café.',
    allergens: 'gluten (froment) · lait · œufs · traces possibles : soja, fruits à coque',
    'image.alt': 'Rose au chocolat garnie de crème',
  },
}

// Gewicht am Ende der Beschreibung, wie bei den übrigen Broten.
const WEIGHTS = {
  'product-rustik': '600',
  'product-epeautre-sesame': '600',
  'product-rustik-lin-tournesol': '600',
  'product-cramique': '400',
}

const withWeight = (description, grams) => {
  const bare = description.replace(/\s*\d+[\s ]g\.?$/, '').replace(/\.?$/, '')
  return `${bare}. ${grams}${NBSP}g.`
}

const run = async () => {
  const ids = Object.keys(PATCHES)
  const existing = await client.fetch(`*[_id in $ids]{_id, name, price, priceUnit, description, allergens}`, {
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
    const set = { ...PATCHES[id] }
    if (WEIGHTS[id]) set.description = withWeight(doc.description, WEIGHTS[id])
    console.log(`${doc.name} (${doc.price} €)\n   après : ${JSON.stringify(set)}\n`)
    tx = tx.patch(id, (p) => p.set(set))
    if (byId.has(`drafts.${id}`)) tx = tx.patch(`drafts.${id}`, (p) => p.set(set))
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
