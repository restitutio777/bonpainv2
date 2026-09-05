/**
 * Migration ponctuelle — textes d'accueil relus par la boulangerie (2026).
 *
 *   La boulangerie a réécrit son texte de présentation. Les phrases sont
 *   réparties dans les emplacements du site qui leur correspondent :
 *
 *     heroSubtitle     → levain, farines, fermentation longue
 *     productsSubtitle → pains sur commande + assortiment du jour
 *     saturdayNotice   → viennoiseries faites maison
 *     orderNotice      → réserver de préférence 2 jours à l'avance
 *
 *   Deux points à noter :
 *   - la mention « fermentation longue de 24 heures » disparaît : le nouveau
 *     texte parle seulement de « fermentation longue ».
 *   - le délai passe de « comptez 2 jours » à « de préférence 2 jours à
 *     l'avance » (conseil, pas obligation). Le délai lui-même reste dans
 *     siteSettings.orderLeadDays et n'est pas touché ici.
 *
 *   Ne touche PAS à « Notre histoire » (aboutText) ni aux titres.
 *
 * Usage :
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/update-textes-accueil-2026.mjs
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

const FIELDS = {
  heroSubtitle:
    'Levain naturel cultivé sur place, farines soigneusement sélectionnées et fermentation longue : ici, nous prenons le temps de faire du bon pain, tout simplement.',
  productsSubtitle:
    'Pains sur commande et assortiment du jour, préparés avec soin en petite production. Choisissez vos pains, nous les préparons pour le jour de votre retrait.',
  saturdayNotice:
    'Le samedi, nous ajoutons un petit choix de viennoiseries faites maison — croissants et pains au chocolat sur commande.',
  orderNotice:
    "Pour les commandes, nous vous conseillons de réserver de préférence 2 jours à l'avance afin de nous permettre de préparer chaque pain dans les meilleures conditions.",
}

async function run() {
  const before = await client.fetch(
    '*[_type == "siteContent"][0]{heroSubtitle, productsSubtitle, saturdayNotice, orderNotice}'
  )
  await client.patch('siteContent').set(FIELDS).commit()
  for (const key of Object.keys(FIELDS)) {
    console.log(`✓ ${key}`)
    console.log(`   avant : ${before?.[key] ?? '(vide)'}`)
    console.log(`   après : ${FIELDS[key]}`)
  }
  console.log('Terminé.')
}

run().catch((err) => {
  console.error('✗ Échec :', err.message)
  process.exit(1)
})
