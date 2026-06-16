/**
 * Migration ponctuelle — demandes du boulanger (juin 2026).
 *
 *   1. Panettone : désactiver la commande (orderInForm = false).
 *      La carte garde sa photo, mais plus de bouton « + » ni de ligne
 *      dans le formulaire de commande.
 *   2. Créer 4 pains : Pain au seigle, Épeautre (sans sésame),
 *      Le Rustik, Le Fagnard. Sans photo — le boulanger ajoute la photo
 *      dans le Studio ensuite.
 *
 * Les horaires (mercredi / vendredi) ont déjà été corrigés dans le Studio.
 *
 * Usage :
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-baker-updates.mjs
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

// — Prix des 4 nouveaux pains (à confirmer par le boulanger) —
const NEW_BREADS = [
  { id: 'product-pain-seigle',   name: 'Pain au seigle',        price: null, sortOrder: 5.6 },
  { id: 'product-epeautre',      name: 'Épeautre (sans sésame)', price: null, sortOrder: 4.5 },
  { id: 'product-rustik',        name: 'Le Rustik',             price: null, sortOrder: 5.7 },
  { id: 'product-fagnard',       name: 'Le Fagnard',            price: null, sortOrder: 5.8 },
]

function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function run() {
  // 1. Panettone — couper la commande, garder la fiche/photo.
  await client.patch('product-panettone').set({ orderInForm: false }).commit()
  console.log('✓ Panettone : orderInForm = false')

  // 2. Créer les 4 pains (createOrReplace = idempotent).
  for (const b of NEW_BREADS) {
    if (b.price == null || Number.isNaN(b.price)) {
      throw new Error(`Prix manquant pour « ${b.name} » — renseigne NEW_BREADS avant de lancer.`)
    }
    await client.createOrReplace({
      _id: b.id,
      _type: 'product',
      name: b.name,
      slug: { _type: 'slug', current: slugify(b.name) },
      category: 'bread',
      price: b.price,
      availability: 'all',
      isActive: true,
      orderInForm: true,
      isSeasonal: false,
      hasModal: false,
      sortOrder: b.sortOrder,
    })
    console.log(`✓ Pain créé : ${b.name} — ${b.price.toFixed(2)} €`)
  }

  console.log('\nTerminé. Ajoute les photos des 4 pains dans le Studio.')
}

run().catch((err) => {
  console.error('✗ Échec :', err.message)
  process.exit(1)
})
