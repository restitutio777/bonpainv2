/**
 * Bild für „Bases de pizza": Unsplash-Foto statt des KI-Bilds (Vorgabe
 * Betreiber 2026-10-11, im Shooting gibt es kein Pizzafoto).
 *
 * Quelle: https://unsplash.com/photos/classic-pizza-on-table-z11dSXXlt8c
 * (Nadya Spetnitskaya, Unsplash-Lizenz: kommerziell frei, keine Nennung
 * nötig). Original 6016x4016, vor dem Upload auf 2400 px verkleinert.
 * Die Pizza liegt links im Bild; der Hotspot hält sie im 4:3-Zuschnitt der
 * Produktkarte vollständig sichtbar.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/set-pizza-image-2026-10.mjs <pfad/zur/datei.jpg>
 */
import { createReadStream } from 'node:fs'
import { createClient } from '@sanity/client'

const token = process.env.SANITY_WRITE_TOKEN
const file = process.argv[2]
if (!token || !file) {
  console.error('✗ SANITY_WRITE_TOKEN ou chemin du fichier manquant.')
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

const asset = await client.assets.upload('image', createReadStream(file), {
  filename: 'fond-de-pizza-unsplash-nadya-spetnitskaya.jpg',
  source: { name: 'unsplash', id: 'z11dSXXlt8c', url: 'https://unsplash.com/photos/classic-pizza-on-table-z11dSXXlt8c' },
  creditLine: 'Nadya Spetnitskaya / Unsplash',
})

await client
  .patch('product-pizza')
  .set({
    image: {
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id },
      hotspot: { _type: 'sanity.imageHotspot', x: 0.42, y: 0.45, width: 0.86, height: 0.62 },
      crop: { _type: 'sanity.imageCrop', top: 0, bottom: 0, left: 0, right: 0 },
      alt: 'Pizza margherita au basilic et tomates cerises sur papier cuisson',
    },
  })
  .commit()

console.log(await client.fetch('*[_id == "product-pizza"][0]{name, "img": image.asset->originalFilename, "hotspot": image.hotspot}'))
