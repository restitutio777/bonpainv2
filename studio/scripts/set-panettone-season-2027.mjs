/**
 * Panettone — Saison auf Ostern 2027 gesetzt (August 2026).
 *
 * Die Saison 2026 (20.03. – 06.04.) war abgelaufen, die Produktkarte stand
 * seither dauerhaft auf « Saison terminée ». Neue Daten spiegeln das Fenster
 * von 2026 relativ zu Ostern: Start 16 Tage vor Ostersonntag, Ende am Tag
 * danach. Ostern 2027 = 28. März → 12.03.2027 bis 29.03.2027.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/set-panettone-season-2027.mjs
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

const doc = await client.fetch('*[_type == "product" && name == "Panettone"][0]{_id, seasonStart, seasonEnd, badge}')
if (!doc) {
  console.error('✗ Panettone introuvable')
  process.exit(1)
}
console.log('Avant :', JSON.stringify(doc))

await client
  .patch(doc._id)
  .set({ seasonStart: '2027-03-12', seasonEnd: '2027-03-29', badge: 'Édition Pâques' })
  .commit()

console.log('Après :', JSON.stringify(
  await client.fetch('*[_id == $id][0]{seasonStart, seasonEnd, badge}', { id: doc._id })
))
