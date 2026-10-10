/**
 * Reihenfolge der Produktkarten (Oktober 2026, Wunsch des Betreibers).
 *
 * Die Karte beginnt mit den Broten, die auf den neuen Fotos am besten
 * aussehen (runde Laibe zuerst), Baguette steht am Ende der Brote, danach
 * Tarte, Viennoiserie und Spezialitäten. PRODUCTS_QUERY sortiert nach
 * sortOrder; die Werte haben Zehnerabstände, damit ein neues Produkt
 * (Cramique, Épeautre sésame) dazwischen passt, ohne alle anderen umzuschreiben.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/set-product-order-2026-10.mjs
 */
import { createClient } from '@sanity/client'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) {
  console.error('✗ SANITY_WRITE_TOKEN manquant.')
  process.exit(1)
}

const client = createClient({
  projectId: '5f1udd5l',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
  // Mit Token sähe die Abfrage sonst auch Entwürfe (z. B. den leeren
  // „Pain au seigle"-Entwurf), die auf der Seite nicht erscheinen.
  perspective: 'published',
})

const ORDER = [
  'product-pain-gris',
  'product-pain-seigle',
  'product-rustik',
  'product-pain-noix',
  'product-fagnard',
  'd0c43f74-48f6-4946-b19b-75f6e2fccb6f', // Pain au petit épeautre
  'product-epeautre',
  'product-baguette',
  'product-tarte',
  'product-croissant',
  'product-pain-chocolat',
  'product-pizza',
  'product-panettone',
]

const query = '*[_type == "product" && isActive == true] | order(sortOrder asc){_id, name, sortOrder}'
const before = await client.fetch(query)
console.log('Avant :')
before.forEach((p) => console.log(`  ${p.sortOrder}\t${p.name}`))

const missing = before.filter((p) => !ORDER.includes(p._id))
if (missing.length) {
  console.error('✗ Produits actifs sans place dans ORDER :', missing.map((p) => p.name).join(', '))
  process.exit(1)
}

const tx = client.transaction()
ORDER.forEach((id, i) => tx.patch(id, (p) => p.set({ sortOrder: (i + 1) * 10 })))
await tx.commit()

console.log('Après :')
;(await client.fetch(query)).forEach((p) => console.log(`  ${p.sortOrder}\t${p.name}`))
