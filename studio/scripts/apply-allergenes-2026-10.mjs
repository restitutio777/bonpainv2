/**
 * Allergen-Zeile je Produkt (Feld `allergens`), angezeigt klein unter der
 * Beschreibung. Quelle: Matrice allergènes (19.10.2026, aus Benjamins
 * Rezepturen) + bestätigte Annahmen des Betreibers (26.10.2026):
 *   - Rosinen gelten als sulfitiert → « sulfites (raisins secs) ».
 *     Korrigiert 27.10.2026 (Mail Benjamin + Etiketten): Sultaninen M&C
 *     « NATURAL », ohne Sulfit-Angabe; Panettone mit hausgemachten
 *     kandierten Orangen → Cramique und Panettone ohne Sulfite. Rustik aux
 *     graines laut Benjamin nur Weizenmehl T80 bio + Sonnenblume/Lein.
 *   - Im Zweifel deklarieren (Entscheidung Betreiber 27.10.2026): Schokolade
 *     → Spuren Soja/Schalenfrüchte, Tarte/Tartelette je nach Füllung, Bun
 *     evtl. mit Milch/Ei, Pain aux fruits Sulfite der Trockenfrüchte.
 *     Beantwortet von Benjamin 27.10.2026: Pain aux fruits = noisettes, noix
 *     de cajou, raisins secs (M&C NATURAL), graines de courge → keine
 *     Sulfite. Bun = beurre, lait, levure, curcuma → lait, keine Eier.
 *     Tartelette aux noix = noix ou noisettes, cajou, tournesol, courge,
 *     beurre, œuf. Tarte du jour weiter offen.
 *   - Viennoiseries/Tartes/Gaufre: gluten, lait, œufs.
 *   - Cookie: zusätzlich arachides.
 *   - Épeautre-sésame: Sesam ist drin (Name + Rezeptur).
 *
 * WICHTIG: Arbeitsstand, noch nicht von Benjamin final freigegeben. Nur
 * deklarationspflichtige EU-Allergene; Samen (tournesol, lin, courge),
 * Kurkuma und Honig sind keine.
 *
 * Schreibt auf die gelesene Revision und, falls vorhanden, auf den Entwurf,
 * damit ein späteres « Publier » im Studio die Angabe nicht zurückdreht.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-allergenes-2026-10.mjs           # nur anzeigen
 *   SANITY_WRITE_TOKEN=xxxxx node studio/scripts/apply-allergenes-2026-10.mjs --apply   # schreiben
 */
import { createClient } from '@sanity/client'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) {
  console.error('✗ SANITY_WRITE_TOKEN manquant.')
  process.exit(1)
}
const apply = process.argv.includes('--apply')

const client = createClient({
  projectId: '5f1udd5l',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
  perspective: 'raw',
})

// _id → Wert des Feldes `allergens` (ohne das Label « Allergènes : », das die
// Seite davor setzt). Trennzeichen « · » zwischen Allergenen, Komma innerhalb
// der Klammer (betroffene Getreide/Zutaten).
const ALLERGENS = {
  // Brote (aus der Matrix)
  'product-pain-gris': 'gluten (froment, seigle)',
  'product-pain-seigle': 'gluten (seigle, froment)',
  'product-rustik': 'gluten (froment, engrain)',
  // Spuren laut Etikett der Leinsamen (Panemex): gluten, soja, sésame,
  // moutarde; Gluten ist ohnehin drin.
  'product-rustik-lin-tournesol':
    'gluten (froment) · traces possibles : soja, sésame, moutarde',
  'product-pain-noix': 'gluten (froment, seigle) · fruits à coque (noix)',
  'product-pain-fruits-secs':
    'gluten (froment, engrain) · fruits à coque (noisettes, noix de cajou)',
  'product-fagnard': 'gluten (froment, seigle)',
  'd0c43f74-48f6-4946-b19b-75f6e2fccb6f': 'gluten (petit épeautre)',
  'product-epeautre': 'gluten (épeautre, froment)',
  'product-epeautre-sesame': 'gluten (épeautre, froment) · sésame',
  'product-pain-blanc-coupe': 'gluten (froment, seigle)',
  'product-baguette': 'gluten (froment)',
  'product-cramique': 'gluten (froment) · œufs · lait',
  // Tartes
  'product-tarte':
    'gluten (froment) · lait · œufs · selon la garniture : fruits à coque, céleri, moutarde',
  'product-tartelette':
    'gluten (froment) · lait · œufs · fruits à coque (noix, noisettes, noix de cajou)',
  // Viennoiseries
  'product-croissant': 'gluten (froment) · lait · œufs',
  'product-pain-chocolat':
    'gluten (froment) · lait · œufs · traces possibles : soja, fruits à coque',
  'product-feuillete-pommes': 'gluten (froment) · lait · œufs',
  'product-torsade-creme': 'gluten (froment) · lait · œufs · traces possibles : soja, fruits à coque',
  // Spécialités / Theke
  'product-cookie':
    'gluten (froment, avoine) · arachides · lait · œufs · traces possibles : soja, fruits à coque',
  'product-gaufre': 'gluten (froment) · lait · œufs',
  'product-bun': 'gluten (froment) · lait · sésame',
  'product-petit-pain-courge': 'gluten (froment)',
  'product-pizza': 'gluten (froment) · lait',
  'product-panettone': 'gluten (froment) · lait · œufs',
}

const run = async () => {
  const ids = Object.keys(ALLERGENS)
  // Auch Entwürfe mitnehmen.
  const draftIds = ids.map((id) => `drafts.${id}`)
  const existing = await client.fetch(
    `*[_id in $ids]{_id, name, allergens}`,
    { ids: [...ids, ...draftIds] },
  )
  const byId = new Map(existing.map((d) => [d._id, d]))

  let tx = client.transaction()
  let count = 0
  for (const id of ids) {
    const value = ALLERGENS[id]
    const doc = byId.get(id)
    if (!doc) {
      console.warn(`⚠ introuvable: ${id}`)
      continue
    }
    const before = doc.allergens ?? '—'
    console.log(`${doc.name}\n   avant : ${before}\n   après : ${value}\n`)
    tx = tx.patch(id, (p) => p.set({ allergens: value }))
    count++
    if (byId.has(`drafts.${id}`)) {
      tx = tx.patch(`drafts.${id}`, (p) => p.set({ allergens: value }))
    }
  }

  if (!apply) {
    console.log(`\n(Probelauf) ${count} Produkte. Mit --apply schreiben.`)
    return
  }
  await tx.commit()
  console.log(`\n✓ ${count} Produkte aktualisiert.`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
