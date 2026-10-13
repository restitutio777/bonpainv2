/**
 * Beschreibungstexte von Benjamin (13.10.2026) für die elf Sauerteigbrote.
 *
 * - `description`: sein Text, dahinter das Gewicht, wo es bekannt ist (stand
 *   bisher vorn in der Beschreibung und fehlt in seinen Texten).
 * - `name`: seine Schreibweise (Abos und Bestellungen hängen an der `_id`).
 * - `badge` « Best-seller » bei Pain gris und Épeautre-sésame (so von ihm
 *   markiert).
 * - Pain fagnard kam zweimal; es gilt die zweite, letzte Fassung.
 *
 * Geschrieben wird nur auf der gelesenen Revision. Existiert zu einem Produkt
 * ein Entwurf, bekommt er dieselben Werte, damit ein späteres « Publier » im
 * Studio die Texte nicht zurückdreht.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-descriptions-2026-10.mjs           # nur anzeigen
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-descriptions-2026-10.mjs --apply   # schreiben
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

const MAX = 320

const UPDATES = [
  {
    id: 'product-pain-gris',
    name: 'Pain gris au levain',
    weight: '600 g',
    badge: 'Best-seller',
    text: 'Farines bio de froment semi-complète et de seigle, levain naturel de seigle et sel. Des farines locales moulues sur meule. Un pain riche en fibres, au goût rustique et authentique, pour un bon équilibre nutritionnel.',
  },
  {
    id: 'product-pain-noix',
    name: 'Pain aux noix',
    weight: '600 g',
    text: 'Élaboré avec notre pâte grise au levain et des noix de Koki, issues d’un petit producteur français. Les noix apportent de bonnes graisses, des fibres et des minéraux. Un pain gourmand et nutritif.',
  },
  {
    id: 'product-fagnard',
    name: 'Pain fagnard',
    weight: '600 g',
    text: 'Élaboré avec notre pâte grise au levain et généreusement garni de graines de tournesol. Riches en fibres, en protéines végétales et en bonnes graisses, ces graines apportent une touche croquante et gourmande à ce pain rustique et savoureux.',
  },
  {
    id: 'product-rustik',
    name: 'Le Rustik',
    weight: '800 g',
    text: 'Farine bio de froment semi-complète, enrichie de 10 % de farine d’engrain, levain de blé et sel. Un pain au goût authentique, qui associe les fibres du froment semi-complet aux qualités nutritionnelles de l’engrain.',
  },
  {
    id: 'product-rustik-lin-tournesol',
    name: 'Rustik aux graines',
    text: 'Élaboré avec notre pâte Rustik, enrichie de graines de tournesol et de lin. Ces graines apportent fibres, protéines végétales et bonnes graisses, pour un pain savoureux et équilibré.',
  },
  {
    id: 'product-pain-fruits-secs',
    name: 'Pain aux fruits',
    text: 'Élaboré avec notre pâte Rustik, des fruits secs, des noisettes, des raisins, des noix de cajou et des graines de courge. Une recette gourmande qui apporte fibres, minéraux, protéines végétales et bonnes graisses.',
  },
  {
    id: 'product-epeautre-sesame',
    name: 'Épeautre-sésame',
    badge: 'Best-seller',
    text: 'Farine bio de grand épeautre grise, levain naturel de blé, sel et graines de sésame. L’épeautre apporte des protéines et des minéraux. Le sésame complète ce pain savoureux, inspiré de mes racines dans l’Allier, terre de mon enfance.',
  },
  {
    id: 'product-epeautre',
    name: 'Pain d’épeautre',
    weight: '600 g',
    text: 'Farine bio de grand épeautre grise, levain naturel de blé et sel. Une recette authentique au goût de céréale prononcé. L’épeautre apporte des protéines, des fibres et des minéraux, pour un pain nourrissant et savoureux. Une farine venue de l’Allier, terre de mon enfance.',
  },
  {
    id: 'product-pain-seigle',
    name: 'Pain au seigle',
    weight: '600 g',
    text: 'Farine bio de seigle semi-complète, levain de blé, miel et sel. Le seigle est naturellement riche en fibres, qui contribuent à la satiété et au bon fonctionnement digestif. Un pain au caractère affirmé et aux saveurs rustiques.',
  },
  {
    id: 'd0c43f74-48f6-4946-b19b-75f6e2fccb6f',
    name: 'Pain au petit épeautre (engrain)',
    weight: '600 g',
    text: 'Farine bio de petit épeautre, levain naturel de petit épeautre, miel et sel. Cette céréale ancienne apporte des protéines, des fibres et des minéraux. Son goût délicat et légèrement noisetté en fait un pain authentique et savoureux.',
  },
  {
    id: 'product-pain-blanc-coupe',
    name: 'Pain à la coupe',
    text: 'Farine blanche bio de froment, levain de seigle, levure et sel. Grâce à une fermentation longue de 24 heures, ce pain développe des arômes riches et une mie agréable. Une recette traditionnelle pour accompagner tous vos repas.',
  },
]

const ids = UPDATES.flatMap((u) => [u.id, `drafts.${u.id}`])
const docs = await client.fetch('*[_id in $ids]{_id, _rev, name, description, badge}', { ids })
const byId = new Map(docs.map((d) => [d._id, d]))

const tx = client.transaction()
let changes = 0

for (const u of UPDATES) {
  // Geschütztes Leerzeichen, damit « 600 » und « g » nicht getrennt umbrechen.
  const description = u.weight ? `${u.text} ${u.weight.replace(' ', '\u00a0')}.` : u.text
  if (description.length > MAX) {
    console.error(`✗ ${u.id} : ${description.length} caractères (max. ${MAX})`)
    process.exit(1)
  }
  if (!byId.has(u.id)) {
    console.error(`✗ Produit introuvable : ${u.id}`)
    process.exit(1)
  }
  const set = { name: u.name, description, ...(u.badge ? { badge: u.badge } : {}) }

  for (const id of [u.id, `drafts.${u.id}`]) {
    const doc = byId.get(id)
    if (!doc) continue
    const diff = Object.entries(set).filter(([k, v]) => doc[k] !== v)
    if (diff.length === 0) continue
    changes++
    console.log(`\n${id}`)
    for (const [k, v] of diff) console.log(`  ${k}: ${JSON.stringify(doc[k] ?? null)}\n    → ${JSON.stringify(v)}`)
    tx.patch(id, (p) => p.set(Object.fromEntries(diff)).ifRevisionId(doc._rev))
  }
}

if (changes === 0) {
  console.log('✓ Rien à faire, tout est déjà en place.')
} else if (!apply) {
  console.log(`\n${changes} document(s) à modifier. Relancer avec --apply pour écrire.`)
} else {
  await tx.commit()
  console.log(`\n✓ ${changes} document(s) modifié(s).`)
}
