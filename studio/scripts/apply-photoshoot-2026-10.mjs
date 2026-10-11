/**
 * Echte Produktfotos aus dem Shooting vom 09.10.2026 und Benjamins Angaben
 * aus der picdrop-Galerie (10./11.10.2026) einspielen.
 *
 * - Lädt je Produkt ein Bild aus dem ACR-Export (2400x1600 JPEG) hoch.
 *   Sanity erkennt identische Dateien am Hash, ein zweiter Lauf lädt nichts
 *   doppelt hoch.
 * - Bestehende Produkte: Bild, Alt-Text und Beschreibung (Benjamins Zutaten,
 *   Gewicht soweit genannt) werden gesetzt; „Pain aux fruits secs" heißt
 *   jetzt wie bei Benjamin „Pain aux fruits".
 * - Neue Produkte aus der Galerie. Zwei Brote sind bestellbar (Preis
 *   vorläufig 6 €, Vorgabe Betreiber). Das Kleingebäck ist nur Theke
 *   (orderInForm: false); ohne bekannten Preis steht price 0, die Karte zeigt
 *   dann „Prix en magasin". Feuilleté aux pommes: 2,75 € laut Schild (Bild 077).
 * - Zuordnung Bild → Produkt: memory/MAILS-benjamin-produkte.md.
 *
 * Usage (SSD EXTREME_SSD muss angeschlossen sein):
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-photoshoot-2026-10.mjs
 */
import { createReadStream } from 'node:fs'
import { createClient } from '@sanity/client'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) {
  console.error('✗ SANITY_WRITE_TOKEN manquant.')
  process.exit(1)
}

const DIR = '/Volumes/EXTREME_SSD/BONPAIN_2-0/GALLRY'

const client = createClient({
  projectId: '5f1udd5l',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
  perspective: 'published',
})

// Bestehende Produkte: _id → Foto, Alt-Text, Beschreibung (undefined = bleibt).
const EXISTING = [
  { _id: 'product-pain-gris', photo: '144', alt: 'Pain gris au levain, croûte incisée en losanges et en stries', description: '600 g · Froment demi-complet, levain de seigle, sel' },
  { _id: 'product-pain-seigle', photo: '031', alt: 'Pain au seigle rond, croûte farinée et craquelée', description: '600 g · Seigle, levain, miel, sel' },
  { _id: 'product-rustik', photo: '057', alt: 'Le Rustik, pain rond à la croûte rustique éclatée', description: '800 g · Froment demi-complet, levain, sel' },
  { _id: 'product-pain-noix', photo: '149', alt: 'Pain aux noix rond, fariné, incisé en feuille', description: '600 g · Froment, levain de seigle, noix, sel' },
  { _id: 'product-pain-fruits-secs', photo: '132', name: 'Pain aux fruits', alt: 'Pain aux fruits entamé, mie garnie de noisettes et raisins secs', description: 'Froment demi-complet, levain, noisettes, raisins secs, noix de cajou, graines de courge' },
  { _id: 'product-fagnard', photo: '137', alt: 'Le Fagnard, pain moulé couvert de graines de tournesol', description: '600 g · Froment demi-complet, levain de seigle, graines de tournesol, sel' },
  { _id: 'd0c43f74-48f6-4946-b19b-75f6e2fccb6f', photo: '129', alt: 'Pain au petit épeautre moulé, croûte dorée', description: '600 g · Petit épeautre (engrain), levain, sel' },
  { _id: 'product-epeautre', photo: '161', alt: "Pain d'épeautre moulé, croûte éclatée", description: '600 g · Épeautre, levain, sel' },
  { _id: 'product-epeautre-sesame', photo: '066', alt: "Pain d'épeautre au sésame, moulé et fariné", description: 'Épeautre, levain, sésame' },
  { _id: 'product-baguette', photo: '075', alt: 'Baguettes dorées sur la grille, à la sortie du four' },
  { _id: 'product-cramique', photo: '095', alt: 'Cramique aux raisins dans sa barquette en bois' },
  { _id: 'product-tarte', photo: '089', alt: 'Tarte couverte dorée, saupoudrée de sucre' },
  { _id: 'product-croissant', photo: '189', alt: 'Croissant pur beurre, feuilletage en spirale' },
  { _id: 'product-pain-chocolat', photo: '186', alt: 'Pain au chocolat, feuilletage doré et chocolat visible' },
]

const base = {
  _type: 'product',
  availability: 'all',
  isActive: true,
  isSeasonal: false,
  hasModal: false,
}

const NEW = [
  { _id: 'product-rustik-lin-tournesol', name: 'Rustik aux lin et tournesol', category: 'bread', price: 6, orderInForm: true, sortOrder: 35, photo: '162', alt: 'Rustik aux lin et tournesol, pain ovale fariné à la croûte éclatée', description: 'Froment demi-complet, levain, graines de lin et de tournesol' },
  { _id: 'product-pain-blanc-coupe', name: 'Pain blanc à la coupe', category: 'bread', price: 6, orderInForm: true, sortOrder: 78, photo: '101', alt: 'Grand pain blanc plat incisé en losanges, vendu à la coupe', description: 'Froment blanc, levain, levure, sel' },
  { _id: 'product-tartelette', name: 'Tartelette', category: 'tart', price: 0, orderInForm: false, sortOrder: 92, photo: '086', alt: 'Tartelette dorée sur papier cuisson' },
  { _id: 'product-feuillete-pommes', name: 'Feuilleté aux pommes', category: 'viennoiserie', price: 2.75, orderInForm: false, sortOrder: 112, photo: '077', alt: 'Feuilletés aux pommes en vitrine, ardoise « Feuilleté aux pommes 2,75 € »' },
  { _id: 'product-torsade-creme', name: 'Torsade à la crème', category: 'viennoiserie', price: 0, orderInForm: false, sortOrder: 114, photo: '119', alt: 'Torsade feuilletée garnie de crème pâtissière' },
  { _id: 'product-cookie', name: 'Cookie chocolat cacahuète salé', category: 'specialty', price: 0, orderInForm: false, sortOrder: 115, photo: '083', alt: "Cookie au chocolat, cacahuètes salées et flocons d'avoine", description: "Froment, beurre, œuf, chocolat, cacahuètes salées, flocons d'avoine" },
  { _id: 'product-gaufre', name: 'Gaufre', category: 'specialty', price: 0, orderInForm: false, sortOrder: 116, photo: '104', alt: 'Gaufres dorées sur la grille' },
  { _id: 'product-bun', name: 'Bun', category: 'bread', price: 0, orderInForm: false, sortOrder: 117, photo: '207', alt: 'Buns au sésame alignés sur la plaque', description: 'Petit pain burger au sésame' },
  { _id: 'product-petit-pain-courge', name: 'Petit pain aux graines de courge', category: 'bread', price: 0, orderInForm: false, sortOrder: 118, photo: '209', alt: 'Petit pain rond garni de graines de courge' },
]

const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const assets = new Map()
async function upload(photo) {
  if (!assets.has(photo)) {
    const filename = `BON_PAIN_FAIT_MAIN_${photo}.jpg`
    const asset = await client.assets.upload('image', createReadStream(`${DIR}/${filename}`), { filename })
    assets.set(photo, asset._id)
    console.log(`  ↑ ${filename} → ${asset._id}`)
  }
  return assets.get(photo)
}

const image = async (photo, alt) => ({ _type: 'image', asset: { _type: 'reference', _ref: await upload(photo) }, alt })

// Erst alle Bilder hochladen, dann alles in einer Transaktion schreiben.
const patches = []
for (const p of [...EXISTING, ...NEW]) {
  const set = { image: await image(p.photo, p.alt) }
  if (p.description !== undefined) set.description = p.description
  if (p.name) set.name = p.name
  patches.push({ id: p._id, set })
}

const tx = client.transaction()
for (const p of NEW) {
  const { photo, alt, ...fields } = p
  tx.createIfNotExists({ ...base, ...fields, slug: { _type: 'slug', current: slug(p.name) } })
}
patches.forEach(({ id, set }) => tx.patch(id, (patch) => patch.set(set)))
await tx.commit()

const query = '*[_type == "product" && isActive == true] | order(sortOrder asc){sortOrder, name, price, orderInForm, "img": image.asset->originalFilename}'
console.log('Produits actifs :')
;(await client.fetch(query)).forEach((p) =>
  console.log(`  ${p.sortOrder}\t${p.price.toFixed(2)} €\t${p.orderInForm === false ? 'Theke ' : 'Bestell'}\t${p.img ?? '—'}\t${p.name}`)
)
