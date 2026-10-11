/**
 * Neues Bild für den Panettone (Vorgabe Betreiber 2026-10-11): ersetzt
 * „pannetone-benjamin.jpg" (584x384, zu klein für die Produktkarte).
 * Bild vom Betreiber geliefert, 1870x1200; Quelle und Lizenz liegen beim
 * Betreiber. Der Panettone steht links-mittig, der zentrale 4:3-Zuschnitt
 * zeigt ihn vollständig, daher kein Hotspot.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/set-panettone-image-2026-10.mjs <pfad/zur/datei.jpg>
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

const asset = await client.assets.upload('image', createReadStream(file), { filename: 'panettone.jpg' })

await client
  .patch('product-panettone')
  .set({
    image: {
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id },
      alt: 'Panettone dans son moule en papier, tranches aux raisins et écorces confites en arrière-plan',
    },
  })
  .commit()

console.log(await client.fetch('*[_id == "product-panettone"][0]{name, "img": image.asset->originalFilename, "size": image.asset->metadata.dimensions}'))
