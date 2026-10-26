/**
 * Standard-Kurzbeschreibungen für Produkte, die bisher kein Beschreibungsfeld
 * hatten (Theke/Viennoiserie), damit die Karten nicht leer wirken. Neutral
 * gehalten, ohne erfundene Angaben (Gewicht, Nährwerte). Benjamin kann sie im
 * Studio jederzeit überschreiben.
 *
 * Schreibt auf die gelesene Revision und, falls vorhanden, auf den Entwurf.
 * Nur Produkte OHNE bestehende Beschreibung werden angefasst (bestehende Texte
 * bleiben unberührt).
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-descriptions-theke-2026-10.mjs
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-descriptions-theke-2026-10.mjs --apply
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

const DESCRIPTIONS = {
  'product-gaufre':
    'Gaufre artisanale, croustillante à l’extérieur et moelleuse à l’intérieur. À savourer nature ou légèrement sucrée.',
  'product-tartelette':
    'Petite tarte individuelle préparée maison, garnie selon les fruits et l’envie du jour.',
  'product-feuillete-pommes':
    'Pâte feuilletée dorée et croustillante, garnie de pommes fondantes. Une viennoiserie gourmande et réconfortante.',
  'product-torsade-creme':
    'Viennoiserie torsadée et moelleuse, garnie d’une crème douce. Parfaite avec un café.',
  'product-petit-pain-courge':
    'Petit pain individuel parsemé de graines de courge, à la mie tendre et à la croûte croustillante.',
}

const run = async () => {
  const ids = Object.keys(DESCRIPTIONS)
  const draftIds = ids.map((id) => `drafts.${id}`)
  const existing = await client.fetch(`*[_id in $ids]{_id, name, description}`, {
    ids: [...ids, ...draftIds],
  })
  const byId = new Map(existing.map((d) => [d._id, d]))

  let tx = client.transaction()
  let count = 0
  for (const id of ids) {
    const doc = byId.get(id)
    if (!doc) {
      console.warn(`⚠ introuvable: ${id}`)
      continue
    }
    if (doc.description && doc.description.trim()) {
      console.log(`↷ ${doc.name} a déjà une description — ignoré.`)
      continue
    }
    const value = DESCRIPTIONS[id]
    console.log(`${doc.name}\n   → ${value}\n`)
    tx = tx.patch(id, (p) => p.set({ description: value }))
    count++
    if (byId.has(`drafts.${id}`)) {
      tx = tx.patch(`drafts.${id}`, (p) => p.set({ description: value }))
    }
  }

  if (!apply) {
    console.log(`\n(Probelauf) ${count} Produkte. Mit --apply schreiben.`)
    return
  }
  if (count === 0) {
    console.log('\nNichts zu tun.')
    return
  }
  await tx.commit()
  console.log(`\n✓ ${count} Produkte aktualisiert.`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
