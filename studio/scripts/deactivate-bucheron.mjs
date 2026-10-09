/**
 * Pain bûcheron — aus dem Sortiment genommen (Oktober 2026).
 *
 * Der Bäcker backt das Brot nicht mehr. Das Produkt wird nur ausgeblendet
 * (isActive: false), nicht gelöscht: PRODUCTS_QUERY filtert darauf, Karte,
 * Bestellformular und Brotliste verschwinden damit sofort, und das Brot lässt
 * sich im Studio mit einem Haken wieder einblenden.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/deactivate-bucheron.mjs
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
})

const doc = await client.fetch('*[_id == "product-bucheron"][0]{_id, name, isActive}')
if (!doc) {
  console.error('✗ product-bucheron introuvable')
  process.exit(1)
}
console.log('Avant :', JSON.stringify(doc))

await client.patch(doc._id).set({ isActive: false }).commit()

console.log('Après :', JSON.stringify(
  await client.fetch('*[_id == $id][0]{_id, name, isActive}', { id: doc._id })
))
