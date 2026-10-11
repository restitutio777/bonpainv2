/**
 * Tarte du jour: Bild 091 statt 089 (Vorgabe Betreiber 2026-10-11: Produkt
 * mittig). In 089 füllt die Tarte 82 % der Bildbreite und lässt sich im
 * 4:3-Ausschnitt mit 8 % Zoom nicht mit Rand zentrieren. 091 zeigt dieselbe
 * Tarte kleiner; der Crop links (13 %) legt ihre Mitte (x ≈ 0,565) in die
 * Bildmitte.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/set-tarte-image-2026-10.mjs
 */
import { createReadStream } from 'node:fs'
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

const filename = 'BON_PAIN_FAIT_MAIN_091.jpg'
const asset = await client.assets.upload(
  'image',
  createReadStream(`/Volumes/EXTREME_SSD/BONPAIN_2-0/GALLRY/${filename}`),
  { filename }
)

await client
  .patch('product-tarte')
  .set({
    image: {
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id },
      crop: { _type: 'sanity.imageCrop', top: 0, bottom: 0, left: 0.13, right: 0 },
      hotspot: { _type: 'sanity.imageHotspot', x: 0.565, y: 0.505, width: 0.62, height: 0.62 },
      alt: 'Tarte couverte dorée, saupoudrée de sucre',
    },
  })
  .commit()

console.log(await client.fetch('*[_id == "product-tarte"][0]{name, "img": image.asset->originalFilename, "crop": image.crop}'))
