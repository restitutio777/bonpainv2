/**
 * Bestelltitel — doppeltes « commande » entfernen (Oktober 2026).
 *
 * OrderForm.tsx setzt orderTitle und orderTitleAccent hintereinander. In Sanity
 * stand orderTitle = « Passez votre commande » und orderTitleAccent =
 * « commande », die Seite zeigte also « Passez votre commande commande ».
 * orderTitle wird auf « Passez votre » gekürzt; das Akzentwort bleibt.
 *
 * Das Skript ändert nur, wenn beide Felder noch genau so stehen, und nur auf
 * der gelesenen Revision.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/fix-order-title.mjs
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

const QUERY = '*[_id == "siteContent"][0]{_id, _rev, orderTitle, orderTitleAccent}'

const doc = await client.fetch(QUERY)
if (!doc) {
  console.error('✗ siteContent introuvable')
  process.exit(1)
}
console.log('Avant :', JSON.stringify(doc))

if (doc.orderTitle !== 'Passez votre commande' || doc.orderTitleAccent !== 'commande') {
  console.log('Rien à faire : les champs ne sont plus dans l’état attendu.')
  process.exit(0)
}

await client.patch(doc._id).ifRevisionId(doc._rev).set({ orderTitle: 'Passez votre' }).commit()

console.log('Après :', JSON.stringify(await client.fetch(QUERY)))
