/**
 * Fehlende Brote anlegen (Oktober 2026).
 *
 * v1 führt Cramique und Épeautre sésame, v2 hatte sie noch nicht. Dazu das
 * Brot mit Trockenfrüchten und Nüssen, das Benjamin am 10.10.2026 in der
 * Galerie beschrieben hat (Bild 133). Der Betreiber will die vollständige
 * Liste. Preis vorläufig 6 € (Vorgabe Betreiber), bis Benjamin die echten
 * Preise nennt; der Name „Pain aux fruits secs" ist ebenfalls vorläufig.
 * sortOrder passt in die Zehnerschritte aus set-product-order-2026-10.mjs:
 * Fruits secs nach Pain aux noix (40), Épeautre sésame nach Épeautre (70),
 * Cramique nach der Baguette (80), vor der Tarte (90).
 *
 * createIfNotExists: ein zweiter Lauf ändert nichts, auch nicht an Werten,
 * die inzwischen im Studio angepasst wurden.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/add-products-2026-10.mjs
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
  perspective: 'published',
})

const base = {
  _type: 'product',
  category: 'bread',
  availability: 'all',
  isActive: true,
  orderInForm: true,
  isSeasonal: false,
  hasModal: false,
}

const DOCS = [
  {
    ...base,
    _id: 'product-pain-fruits-secs',
    name: 'Pain aux fruits secs',
    slug: { _type: 'slug', current: 'pain-aux-fruits-secs' },
    description: 'Froment demi-complet au levain, noisettes, raisins secs, noix de cajou et graines de courge',
    price: 6,
    sortOrder: 45,
  },
  {
    ...base,
    _id: 'product-epeautre-sesame',
    name: 'Épeautre sésame',
    slug: { _type: 'slug', current: 'epeautre-sesame' },
    price: 6,
    sortOrder: 75,
  },
  {
    ...base,
    _id: 'product-cramique',
    name: 'Cramique',
    slug: { _type: 'slug', current: 'cramique' },
    description: 'Pain brioché belge aux raisins secs, idéal au petit déjeuner et au goûter',
    price: 6,
    sortOrder: 85,
  },
]

const query = '*[_type == "product" && isActive == true] | order(sortOrder asc){sortOrder, name, price}'

const tx = client.transaction()
DOCS.forEach((d) => tx.createIfNotExists(d))
await tx.commit()

console.log('Produits actifs :')
;(await client.fetch(query)).forEach((p) => console.log(`  ${p.sortOrder}\t${p.price.toFixed(2)} €\t${p.name}`))
