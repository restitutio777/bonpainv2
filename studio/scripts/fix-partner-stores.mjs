/**
 * Migration ponctuelle — points de vente partenaires (août 2026).
 *
 * `siteSettings.partnerStores` contenait des noms génériques hérités du
 * peuplement initial (« Epicerie du Village », « Bio-Laden Eifel »,
 * « Ferme-Fromagerie ») qui écrasaient les vrais partenaires sur le site.
 * Les valeurs ci-dessous sont celles publiées par la boulangerie elle-même
 * sur bonpainfaitmain.be (section « Nos épiceries partenaires »).
 *
 * Ajoute aussi les jours de vente (nouveau champ salesDays).
 *
 * Usage :
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/fix-partner-stores.mjs
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
})

const STORES = [
  { _key: 'ps1', _type: 'partnerStore', name: "L'Épicerie am Eck", city: 'Heppenbach', salesDays: 'Mercredi' },
  { _key: 'ps2', _type: 'partnerStore', name: 'Naturkostladen — Daniel Offermann', city: 'Bütgenbach', salesDays: 'Mercredi' },
  { _key: 'ps3', _type: 'partnerStore', name: "L'Épicerie des Champs", city: 'Rue Neuve 29, 4960 Malmedy', salesDays: 'Ven, Sam, Dim' },
]

const before = await client.getDocument('siteSettings')
console.log('Avant :', JSON.stringify(before?.partnerStores, null, 1))

await client.patch('siteSettings').set({ partnerStores: STORES }).commit()

const after = await client.getDocument('siteSettings')
console.log('Après :', JSON.stringify(after?.partnerStores, null, 1))
console.log('✓ partnerStores mis à jour')
