/**
 * Migration ponctuelle — hygiène du contenu (juillet 2026).
 *
 *   1. Normaliser les heures des créneaux : « 8:00 » → « 08:00 »
 *      (vendredi/samedi étaient saisis sans zéro initial, mercredi avec —
 *      l'affichage du site les normalise déjà, ceci aligne la donnée).
 *   2. Ajouter un texte alternatif (image.alt) aux photos produits qui
 *      n'en ont pas — utilisé par Google et les lecteurs d'écran.
 *      Ne touche jamais un alt existant.
 *
 * Usage :
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/fix-slots-and-alt-texts.mjs
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

// — Textes alternatifs par nom de produit (uniquement si alt absent) —
const ALT_TEXTS = {
  'Pain au petit épeautre': 'Pain au petit épeautre au levain',
  'Baguette': 'Baguette tradition croustillante',
  'Pain bûcheron': 'Pain bûcheron rustique',
  'Croissant': 'Croissant artisanal doré',
  'Pain au chocolat': 'Pain au chocolat feuilleté',
  'Pain gris au levain': 'Pain gris au levain à la mie moelleuse',
  'Pain aux noix': 'Pain aux noix au levain',
  'Bases de pizza': 'Bases de pizza artisanales',
  'Tarte du jour': 'Tarte artisanale du jour',
}

const pad = (t) => (/^\d:\d\d$/.test(t) ? `0${t}` : t)

async function run() {
  // 1. Créneaux horaires
  const schedules = await client.fetch(
    '*[_type == "schedule" && defined(slots)]{ _id, day, slots }'
  )
  for (const doc of schedules) {
    const fixed = doc.slots.map((s) => ({ ...s, open: pad(s.open), close: pad(s.close) }))
    const changed = JSON.stringify(fixed) !== JSON.stringify(doc.slots)
    if (!changed) continue
    await client.patch(doc._id).set({ slots: fixed }).commit()
    console.log(`✓ ${doc.day}: créneaux normalisés`)
  }

  // 2. Textes alternatifs manquants
  const products = await client.fetch(
    '*[_type == "product" && defined(image.asset) && !defined(image.alt)]{ _id, name }'
  )
  for (const p of products) {
    const alt = ALT_TEXTS[p.name]
    if (!alt) {
      console.log(`⚠ pas de texte alternatif défini pour « ${p.name} » — ignoré`)
      continue
    }
    await client.patch(p._id).set({ 'image.alt': alt }).commit()
    console.log(`✓ ${p.name}: alt = « ${alt} »`)
  }

  console.log('Terminé.')
}

run().catch((e) => {
  console.error('✗ Échec de la migration', e)
  process.exit(1)
})
