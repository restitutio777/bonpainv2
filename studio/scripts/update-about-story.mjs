/**
 * Migration ponctuelle — « Notre histoire » (juillet 2026).
 *
 *   Remplace le texte de présentation (siteContent.aboutText) par le récit
 *   des fondateurs : de la Baraque Michel à Sourbrodt. Le texte fourni par
 *   la boulangerie a été relu et resserré (doublons supprimés, marqueurs de
 *   sources retirés) pour un rendu propre côté visiteurs.
 *
 *   Ne touche PAS au titre (« Benjamin & Nadia, à Sourbrodt »), à l'étiquette
 *   (« Notre histoire ») ni à la photo — seul aboutText est réécrit.
 *
 * Usage :
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/update-about-story.mjs
 *
 * Token : sanity.io/manage → projet 5f1udd5l → API → Tokens (rôle Editor).
 */
import { createClient } from '@sanity/client'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) {
  console.error('✗ SANITY_WRITE_TOKEN manquant. Exporte le token puis relance.')
  process.exit(1)
}

const client = createClient({
  projectId: '5f1udd5l',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

// — Le récit, un paragraphe par entrée (rendu en <p> côté site) —
const PARAGRAPHS = [
  "L'histoire de Bon Pain Fait Main, c'est avant tout une histoire de passion, de famille et d'amour du bon pain.",
  "Tout a commencé au cœur des Hautes Fagnes, à la Baraque Michel, où Benjamin Ramakers et Nadia Bodarwé ont choisi de faire vivre un métier qu'ils aiment profondément : celui de boulanger artisan. Chaque nuit, les premiers pains sortaient du four, façonnés à la main, élaborés avec des farines de qualité, du levain naturel et le temps qu'il faut pour révéler toutes leurs saveurs. Très vite, ils sont devenus une référence pour les habitants de la région, les randonneurs et les amoureux des bons produits.",
  "Au fil des années, malgré les défis rencontrés – la crise sanitaire, la hausse des coûts de production, l'accès parfois difficile à la Baraque Michel –, notre engagement est resté le même : proposer un pain authentique, fabriqué avec patience, savoir-faire et respect des matières premières.",
  "Une nouvelle étape s'est ouverte avec l'installation de notre atelier à Sourbrodt. Ce nouvel espace, plus adapté, nous permet de poursuivre notre développement tout en restant fidèles à ce qui fait notre identité : des fermentations lentes, des ingrédients soigneusement choisis et un pain entièrement façonné à la main.",
  "Aujourd'hui, Bon Pain Fait Main continue d'écrire son histoire, jour après jour. Derrière chaque pain se cachent des heures de travail, des gestes transmis avec exigence et l'envie de partager des produits sincères, généreux et savoureux.",
  "Parce que pour nous, le bon pain ne se fabrique pas seulement avec de la farine et de l'eau. Il se construit avec du temps, du cœur et la passion du métier.",
]

const aboutText = PARAGRAPHS.map((text, i) => ({
  _type: 'block',
  _key: `about-story-${i}`,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `about-story-${i}-0`, text, marks: [] }],
}))

async function run() {
  const before = await client.fetch(
    'count(*[_type == "siteContent"][0].aboutText)'
  )
  await client.patch('siteContent').set({ aboutText }).commit()
  console.log(`✓ « Notre histoire » mise à jour : ${before ?? 0} → ${aboutText.length} paragraphes`)
  console.log('Terminé.')
}

run().catch((err) => {
  console.error('✗ Échec :', err.message)
  process.exit(1)
})
