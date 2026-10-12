/**
 * Ein Produktbild ersetzen: Datei hochladen, an `product.image` hängen,
 * Alt-Text setzen. Hotspot/Crop werden zurückgesetzt (zentrierter Zuschnitt).
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/set-product-image.mjs <productId> <datei.jpg> "<alt-text>"
 *
 * Verlauf:
 *   2026-10-12  product-epeautre-sesame, Bild vom Betreiber (Sesamlaib), ersetzt 066
 *   2026-10-12  product-croissant → 182, product-pain-chocolat → 197 (mehrere Stück im Bild, Wunsch Betreiber)
 */
import { createReadStream } from 'node:fs'
import { basename } from 'node:path'
import { createClient } from '@sanity/client'

const token = process.env.SANITY_WRITE_TOKEN
const [id, file, alt] = process.argv.slice(2)
if (!token || !id || !file || !alt) {
  console.error('✗ Usage : node set-product-image.mjs <productId> <fichier> "<alt>" (SANITY_WRITE_TOKEN requis)')
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

if (!(await client.fetch('defined(*[_id == $id][0]._id)', { id }))) {
  console.error(`✗ Produit introuvable : ${id}`)
  process.exit(1)
}

const asset = await client.assets.upload('image', createReadStream(file), { filename: basename(file) })

await client
  .patch(id)
  .set({ image: { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt } })
  .commit()

console.log(await client.fetch('*[_id == $id][0]{name, "img": image.asset->originalFilename, "size": image.asset->metadata.dimensions{width, height}}', { id }))
