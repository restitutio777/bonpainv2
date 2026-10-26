/**
 * Baut das markengerechte Allergen-PDF der Bäckerei Bon Pain Fait Main.
 *
 * Quelle der Werte: Feld `allergens` je Produkt in Sanity (Projekt 5f1udd5l,
 * Dataset production) — identisch zur Map in
 * studio/scripts/apply-allergenes-2026-10.mjs und live auf der Website.
 * Hier sind die 25 aktiven Produkte fest hinterlegt (Name, Gruppe, Allergene),
 * damit das PDF ohne Sanity-Token reproduzierbar ist. Ändern sich die Werte,
 * hier UND im Sanity-Skript nachziehen.
 *
 * Ablauf: Fonts (WOFF2) und Logo werden als data-URI eingebettet, daraus
 * entsteht eine eigenständige HTML-Datei (scripts/allergenes/allergenes.html).
 * Das PDF rendert danach Chrome headless (siehe render.sh bzw. README).
 *
 *   node scripts/allergenes/build-pdf.mjs      # schreibt allergenes.html
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

// Versionsstand (sichtbar auf dem Dokument). Rezeptbasis: Matrix 19.10.2026;
// bestätigte Annahmen des Betreibers 26.10.2026.
const DATE_LABEL = '26 octobre 2026'
const RECIPE_BASIS = '19 octobre 2026'

// --- Produktdaten (Reihenfolge wie auf der Website, nach sortOrder) ----------
// allergens: wortgleich zu Sanity. « · » trennt Allergene, Klammer = Getreide/
// Zutaten. Nur deklarationspflichtige EU-Allergene; Samen, Kurkuma, Honig nicht.
const GROUPS = [
  {
    title: 'Pains au levain',
    items: [
      ['Pain gris au levain', 'gluten (froment, seigle)'],
      ['Pain au seigle', 'gluten (seigle, froment)'],
      ['Le Rustik', 'gluten (froment, engrain)'],
      ['Rustik aux graines', 'gluten (froment, engrain)'],
      ['Pain aux noix', 'gluten (froment, seigle) · fruits à coque (noix)'],
      [
        'Pain aux fruits',
        'gluten (froment, engrain) · fruits à coque (noisettes, noix de cajou) · sulfites (raisins secs)',
      ],
      ['Pain fagnard', 'gluten (froment, seigle)'],
      ['Pain au petit épeautre (engrain)', 'gluten (petit épeautre)'],
      ['Pain d’épeautre', 'gluten (épeautre, froment)'],
      ['Épeautre-sésame', 'gluten (épeautre, froment) · sésame'],
      ['Pain à la coupe', 'gluten (froment, seigle)'],
      ['Baguette', 'gluten (froment)'],
      ['Cramique', 'gluten (froment) · œufs · lait · sulfites (raisins secs)'],
      ['Bun', 'gluten (froment)'],
      ['Petit pain aux graines de courge', 'gluten (froment)'],
    ],
  },
  {
    title: 'Viennoiseries',
    items: [
      ['Croissant', 'gluten (froment) · lait · œufs'],
      ['Pain au chocolat', 'gluten (froment) · lait · œufs'],
      ['Feuilleté aux pommes', 'gluten (froment) · lait · œufs'],
      ['Torsade à la crème', 'gluten (froment) · lait · œufs'],
    ],
  },
  {
    title: 'Tartes',
    items: [
      ['Tarte du jour', 'gluten (froment) · lait · œufs'],
      ['Tartelette', 'gluten (froment) · lait · œufs'],
    ],
  },
  {
    title: 'Spécialités',
    items: [
      ['Cookie chocolat cacahuète salé', 'gluten (froment) · arachides · lait · œufs'],
      ['Gaufre', 'gluten (froment) · lait · œufs'],
      ['Bases de pizza', 'gluten (froment)'],
      ['Panettone', 'gluten (froment) · lait · œufs · sulfites (fruits secs)'],
    ],
  },
]

// --- Assets als data-URI -----------------------------------------------------
const b64 = (p) => readFileSync(p).toString('base64')
const font = (file) =>
  `data:font/woff2;base64,${b64(resolve(root, 'src/fonts', file))}`
const corNormal = font('cormorant-garamond-latin-wght-normal.woff2')
const corItalic = font('cormorant-garamond-latin-wght-italic.woff2')
const dmNormal = font('dm-sans-latin-wght-normal.woff2')
const logo = `data:image/png;base64,${b64(resolve(root, 'public/bonpainfaitmain-logo.png'))}`

// --- Allergene aufbereiten (Allergenname fett, Klammer gedämpft) -------------
const escape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function renderAllergens(str) {
  return str
    .split(' · ')
    .map((tok) => {
      const m = tok.match(/^(.*?)\s*(\(.*\))\s*$/)
      if (m) {
        return `<span class="al"><b>${escape(m[1])}</b> <span class="det">${escape(
          m[2],
        )}</span></span>`
      }
      return `<span class="al"><b>${escape(tok)}</b></span>`
    })
    .join('<span class="dot">·</span>')
}

function renderItem([name, allergens]) {
  return `<li class="item">
      <span class="pname">${escape(name)}</span>
      <span class="plist">${renderAllergens(allergens)}</span>
    </li>`
}

function renderGroup(g, modifier = '') {
  return `<section class="group ${modifier}">
    <h2 class="gtitle">${escape(g.title)}</h2>
    <ul class="items">
      ${g.items.map(renderItem).join('\n      ')}
    </ul>
  </section>`
}

const [pains, viennois, tartes, specialites] = GROUPS

const legend = `gluten · œufs · lait · fruits à coque · arachides · sésame · sulfites`

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Allergènes — Bon Pain Fait Main</title>
<style>
  @font-face{font-family:'Cormorant Garamond';font-style:normal;font-weight:300 700;font-display:swap;src:url(${corNormal}) format('woff2');}
  @font-face{font-family:'Cormorant Garamond';font-style:italic;font-weight:400;font-display:swap;src:url(${corItalic}) format('woff2');}
  @font-face{font-family:'DM Sans';font-style:normal;font-weight:400 700;font-display:swap;src:url(${dmNormal}) format('woff2');}

  :root{
    --ink:#2D1F14; --muted:#8B7A6B; --brown:#6E4D32; --accent:#A67C52;
    --cream:#FDF8F3; --sand:#F5EDE3; --line:#E8D9C8; --dark:#2D1F14;
  }
  @page{size:A4;margin:0;}
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{background:#d9cdbf;}
  body{font-family:'DM Sans',-apple-system,sans-serif;color:var(--ink);
    -webkit-font-smoothing:antialiased;line-height:1.5;}

  .page{
    position:relative;width:210mm;height:297mm;background:var(--cream);
    margin:0 auto;overflow:hidden;
    display:flex;flex-direction:column;
  }
  .page + .page{margin-top:8mm;}
  .pad{padding:0 18mm;}

  /* ---- Header band (page 1) ------------------------------------------- */
  .masthead{background:var(--dark);color:#F4E6D1;padding:11mm 18mm 10mm;
    text-align:center;position:relative;}
  .masthead::after{content:'';position:absolute;left:18mm;right:18mm;bottom:5.5mm;
    height:1px;background:rgba(201,152,94,.28);}
  .logo{height:21mm;width:auto;display:block;margin:0 auto 4mm;}
  .kicker{font-family:'DM Sans';font-size:9.5pt;letter-spacing:.42em;
    text-transform:uppercase;color:#C9985E;margin-bottom:2.5mm;
    padding-left:.42em;}
  .doc-title{font-family:'Cormorant Garamond';font-weight:500;font-size:30pt;
    line-height:1.05;letter-spacing:.01em;color:#F4E6D1;}
  .doc-sub{font-family:'Cormorant Garamond';font-style:italic;font-weight:400;
    font-size:15pt;color:#E0B888;margin-top:2mm;}

  /* ---- Intro + legend -------------------------------------------------- */
  .intro{margin:7mm 0 2mm;font-size:11.5pt;color:var(--brown);max-width:155mm;}
  .legend{margin:4mm 0 2mm;font-size:10.5pt;color:var(--muted);
    border-top:1px solid var(--line);border-bottom:1px solid var(--line);
    padding:2.6mm 0;}
  .legend b{color:var(--brown);font-weight:600;}

  /* ---- Groups ---------------------------------------------------------- */
  .body{flex:1;padding-top:6mm;padding-bottom:4mm;}
  .group{margin-bottom:7mm;break-inside:avoid;}
  .group:last-child{margin-bottom:0;}
  .gtitle{font-family:'Cormorant Garamond';font-weight:600;font-size:20pt;
    color:var(--accent);letter-spacing:.01em;margin-bottom:3mm;
    display:flex;align-items:center;gap:5mm;}
  .gtitle::after{content:'';flex:1;height:1px;background:var(--line);}

  .items{list-style:none;}
  /* Pains: zwei Spalten, damit die 15 Brote luftig auf eine Seite passen */
  .cols .items{column-count:2;column-gap:12mm;}
  .item{break-inside:avoid;padding:2.2mm 0;border-bottom:1px solid var(--sand);
    -webkit-column-break-inside:avoid;}
  .item:last-child{border-bottom:none;}
  .pname{display:block;font-family:'Cormorant Garamond';font-weight:600;
    font-size:14.5pt;line-height:1.12;color:var(--ink);}
  .plist{display:block;margin-top:.8mm;font-size:11pt;color:var(--brown);
    line-height:1.4;}
  .al b{font-weight:700;color:#5A3E27;}
  .al .det{color:#7D6B59;font-weight:400;}
  .dot{color:var(--accent);margin:0 2.2mm;font-weight:700;}

  /* page 2 groups full width, extra air */
  .wide .items{column-count:1;}
  .wide .item{padding:3.1mm 0;}

  /* ---- Footer / legal -------------------------------------------------- */
  .foot{margin-top:auto;background:var(--sand);padding:6mm 18mm 7mm;
    border-top:2px solid var(--accent);}
  .foot-grid{display:flex;justify-content:space-between;gap:12mm;
    align-items:flex-start;}
  .legal{font-size:9.5pt;color:var(--brown);line-height:1.5;max-width:120mm;}
  .legal strong{color:var(--ink);font-weight:700;}
  .contact{font-size:10pt;color:var(--ink);text-align:right;line-height:1.55;
    white-space:nowrap;}
  .contact .cn{font-family:'Cormorant Garamond';font-weight:600;font-size:15pt;
    display:block;margin-bottom:1mm;color:var(--ink);}
  .contact .cm{color:var(--muted);}
  .stamp{display:inline-block;margin-top:3mm;font-size:8.5pt;letter-spacing:.18em;
    text-transform:uppercase;color:var(--accent);border:1px solid var(--accent);
    border-radius:100px;padding:1.4mm 4mm;}
  .pagefoot{font-size:8.5pt;color:var(--muted);text-align:center;padding:4mm 0 0;}

  @media print{
    html,body{background:#fff;}
    .page{margin:0;box-shadow:none;}
    .page + .page{margin-top:0;page-break-before:always;}
    *{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  }
</style>
</head>
<body>

  <!-- ================= PAGE 1 ================= -->
  <div class="page">
    <header class="masthead">
      <img class="logo" src="${logo}" alt="Bon Pain Fait Main">
      <div class="kicker">Boulangerie artisanale</div>
      <h1 class="doc-title">Liste des allergènes</h1>
      <div class="doc-sub">nos pains &amp; viennoiseries</div>
    </header>

    <div class="pad">
      <p class="intro">Vous trouverez ci-dessous les allergènes à déclaration
        obligatoire présents dans nos produits, établis d’après nos recettes.
        Seuls les 14 allergènes réglementaires (UE n° 1169/2011) sont indiqués —
        les graines, le curcuma et le miel n’en font pas partie.</p>
      <p class="legend">Allergènes concernés dans notre gamme :
        <b>${legend}</b></p>
    </div>

    <div class="pad body">
      ${renderGroup(pains, 'cols')}
    </div>

    <div class="pagefoot pad">Bon Pain Fait Main · Liste des allergènes · 1 / 2</div>
  </div>

  <!-- ================= PAGE 2 ================= -->
  <div class="page">
    <div class="pad body" style="padding-top:13mm;">
      ${renderGroup(viennois, 'wide')}
      ${renderGroup(tartes, 'wide')}
      ${renderGroup(specialites, 'wide')}
    </div>

    <footer class="foot">
      <div class="foot-grid">
        <div class="legal">
          <strong>Document de travail, état du ${DATE_LABEL}.</strong>
          Informations établies d’après nos recettes (version du ${RECIPE_BASIS})
          et en cours de validation. Elles ne garantissent pas l’absence d’autres
          allergènes ni de contamination croisée (stockage, ustensiles, pétrin,
          plan de travail, four). <strong>En cas d’allergie, parlez-nous avant
          votre achat.</strong>
          <span class="stamp">En cours de validation</span>
        </div>
        <div class="contact">
          <span class="cn">Bon Pain Fait Main</span>
          Benjamin Ramakers<br>
          Rue de la Roer 19<br>
          4950 Waimes<br>
          <span class="cm">+32 493 21 09 25</span><br>
          <span class="cm">bonpainfaitmain.be</span>
        </div>
      </div>
    </footer>
  </div>

</body>
</html>`

const out = resolve(here, 'allergenes.html')
writeFileSync(out, html, 'utf8')
console.log('✓ HTML écrit :', out)
