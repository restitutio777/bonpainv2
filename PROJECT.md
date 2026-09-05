# Bon Pain Fait Main — Projekt-Referenz

Bäckerei-Website für Benjamin Ramakers, Waimes (Belgien). Vite + React + TypeScript Frontend mit Sanity CMS, gehostet auf Vercel.

## 🌐 Live-URLs

| | URL |
|---|---|
| Site (Bäcker-Preview) | https://bonpainv2.vercel.app |
| Studio (CMS für Bäcker) | https://bonpainfaitmain.sanity.studio |
| Künftige Production-Domain | https://bonpainfaitmain.be _(noch nicht angeschlossen)_ |
| GitHub-Repo | https://github.com/restitutio777/bonpainv2 |

## 🛠️ Admin-Dashboards

| | URL |
|---|---|
| Vercel Project | https://vercel.com/bolteds-projects/bonpainv2 |
| Vercel Logs (Bestellungen) | https://vercel.com/bolteds-projects/bonpainv2/logs |
| Vercel Analytics | https://vercel.com/bolteds-projects/bonpainv2/analytics |
| Sanity Project Manage | https://www.sanity.io/manage/project/5f1udd5l |
| Sanity Members | https://www.sanity.io/manage/project/5f1udd5l/members |
| Sanity API/Tokens/CORS | https://www.sanity.io/manage/project/5f1udd5l/api |

## 🔑 IDs

| | Wert |
|---|---|
| Sanity Project ID | `5f1udd5l` |
| Sanity Organization ID | `ovS9cwHZj` |
| Sanity Dataset | `production` |
| Vercel Project ID | `prj_9E1lvKIQQWGIzz5MszUSOhdJbWD4` |
| Vercel Team Slug | `bolteds-projects` |

## 👤 Kunde

- **Bäcker:** Benjamin Ramakers — `bonpain.artisan@gmail.com` — +32 493 21 09 25
- **Adresse:** Rue de la Roer 19, 4950 Waimes, Belgique
- **VAT:** BE 0564.844.064
- **Rolle in Sanity:** Administrator (Free-Plan hat keine granulareren Rollen)

## 💻 Lokale Struktur

```
.
├── api/order.ts          Vercel Serverless Function — Resend an Bäcker + Bestätigung an Kunde
├── src/                  Frontend (Vite + React + TS + Tailwind)
├── studio/               Sanity Studio v3 (deploy via npx sanity deploy)
├── public/               robots.txt, sitemap.xml, PWA-Icons
├── vercel.json           SPA-Routing + Cache-Header + API
└── .claude/launch.json   Vite-Dev-Server-Config (gitignored)
```

**Dev-Befehle:**
- Frontend: `npm run dev` → http://localhost:5173
- Studio: `cd studio && npm run dev` → http://localhost:3333
- Build/Test: `npm run typecheck && npm run build`
- Studio-Deploy: `cd studio && npx sanity deploy` (Hostname ist gepinnt: `bonpainfaitmain`)

## 🏗️ Stack

```
Frontend:  Vite 5 + React 18 + TypeScript + Tailwind 3
CMS:       Sanity v3 (gehostet, Free-Plan)
Hosting:   Vercel (Hobby Free)
Email:     Resend (Code wired — Env-Vars noch in Vercel zu setzen)
Domain:    bonpainfaitmain.be (TODO)
Analytics: Vercel Analytics (via inject() in main.tsx)
PWA:       vite-plugin-pwa
SEO:       JSON-LD Bakery + sitemap + robots
Deploy:    GitHub-Push → main → Vercel auto-deploy
```

## ✅ Erledigt

- Frontend live, öffentlich, Vercel-Auth deaktiviert (Hobby-Plan)
- Studio live + Schema-Manifest deployed
- Bild-Optimierung über Sanity-CDN (`auto=format` mit kontextspezifischen Größen)
- Vercel Analytics aktiv
- Order-Endpoint Stub `/api/order` loggt nach Vercel Logs
- SEO: JSON-LD `Bakery`-Schema, robots.txt, sitemap.xml, OG-Tags
- CORS für `bonpainfaitmain.be`, `www.bonpainfaitmain.be`, `*.vercel.app`, localhost
- Sicherheit: Editor-Token (`seed`) revoked, kein Token im Bundle
- Bäcker als Administrator eingeladen (Magic-Link-Email)
- Pain au petit épeautre published (€6 Default, AI-Bild generiert, Modal-Story mit Futur-Envi-Partnerschaft)
- Repo gepusht, Auto-Deploy aktiv

## 🔜 Offen

**Vor dem Domain-Anschluss:**
- ✅ **Neue Accueil-Texte im Dataset (2026-09-05).** `studio/scripts/update-textes-accueil-2026.mjs` ausgeführt: `heroSubtitle`, `productsSubtitle`, `saturdayNotice`, `orderNotice` in `siteContent` überschrieben. Per GROQ gegen `production` und auf https://bonpainv2.vercel.app verifiziert. Die Werbeaussage „fermentation longue de 24 heures" ist damit aus dem Dataset verschwunden (dataset-weite GROQ-Suche nach „24 heures": 0 Treffer). Verbleibende „24 heures"-Stelle im Code ist die Stornofrist in [CGV.tsx](src/components/legal/CGV.tsx) — juristisch, keine Produktaussage, bleibt.
- ✅ Resend läuft. Testbestellung am 2026-08-24 gegen die Production-Function: HTTP 200, Bäcker- und Kundenmail rausgegangen.
- ✅ **Upstash Redis repariert (2026-08-24).** Die alte Instanz `bonpain-orders` war „Archived due to inactivity" — der Host löste nicht mehr auf, dadurch kein Tagesdigest und kein wirksames Rate-Limit. Behoben: tote Instanz vom Projekt getrennt (ihre 5 verwalteten Env-Vars sind damit weg), aktive Instanz `upstash-kv-cinereous-helmet` mit Prefix `KV` verbunden → `KV_REST_API_URL` / `KV_REST_API_TOKEN` stimmen wieder. Verifiziert: `/api/keepalive` schreibt und liest, Testbestellungen laufen ohne Redis-Fehler durch.
- **Damit es nicht wieder passiert:** täglicher Cron `/api/keepalive` (05:00 UTC, `vercel.json`) hält die Free-Instanz aktiv. Wenn der Ping scheitert, steht das laut in den Runtime-Logs.
- Sender-Domain in Resend verifiziert (DNS bei Registrar) — sollte mit dem funktionierenden Versand erledigt sein, beim Domainwechsel gegenprüfen.
- Vier Produkte ohne Foto (Épeautre sans sésame, Pain au seigle, Le Rustik, Le Fagnard) — zeigen bis dahin das lokale Ersatzbild. Alt-Texte fehlen dort ebenfalls.
- ~~Panettone-Saison abgelaufen~~ → am 2026-08-24 auf Ostern 2027 gesetzt (12.03.–29.03.2027, `studio/scripts/set-panettone-season-2027.mjs`). Karte zeigt jetzt „Disponible dès le 12 mars".
- ~~`siteSettings.partnerStores` enthielt Platzhalter~~ → am 2026-08-24 mit `studio/scripts/fix-partner-stores.mjs` auf die echten Partner korrigiert (Quelle: bonpainfaitmain.be).
- Zwei Produkte der alten Site fehlen im Dataset: **Épeautre sésame** und **Cramique** (Cramique mit fertigem Beschreibungstext auf der alten Site). Preise unbekannt → beim Bäcker erfragen, dann anlegen.
- **Studio-Deploy steht aus:** `partnerStore.salesDays` ist neu im Schema. Der lokal eingeloggte Sanity-CLI-Account hat keine Rechte an Projekt 5f1udd5l (`Forbidden … sanity.project.read`). Vor dem Deploy: `cd studio && npx sanity login` mit dem Account der Org `ovS9cwHZj`, dann `npx sanity deploy`. Die Website selbst zeigt die Verkaufstage bereits — nur im Studio ist das Feld bis dahin unsichtbar.


| Wer | Was |
|---|---|
| Bäcker | Site reviewen, Studio testen (Preis korrigieren, eigenes Foto austauschen) |
| Du | **Resend Env-Vars in Vercel setzen** — `RESEND_API_KEY` (von resend.com/api-keys), `ORDER_TO_EMAIL=bonpain.artisan@gmail.com`, `ORDER_FROM_EMAIL=orders@bonpainfaitmain.be`. Solange `RESEND_API_KEY` fehlt, loggt der Handler nur und das Formular bleibt funktional — aber Bestellungen erreichen Benjamin nicht. Sender-Domain muss in Resend verifiziert sein (DNS-Records bei Registrar) — danach kann jede `@bonpainfaitmain.be`-Adresse als Absender dienen. |
| Du | **Domain `bonpainfaitmain.be` auf Vercel anschließen** — Settings → Domains → Add → DNS-Records (A für root, CNAME für www) bei Registrar setzen |
| Du | Alte hardcoded Site auf `bonpainfaitmain.be` parallel abschalten / DNS umlegen |

## ⚠️ Wichtige Hinweise

- **Kein Token im Frontend-Bundle.** Vite inlinet alle `VITE_*`-Vars in das öffentliche JS — Token mit Schreibrechten dürfen NIE als `VITE_*` gesetzt werden. Read-Zugriff geht token-frei über das Sanity-CDN.
- **`useCdn: !token` in [src/lib/sanity.ts](src/lib/sanity.ts).** Solange kein Token gesetzt ist, läuft alles über CDN — schneller, gratis, sicher.
- **Sanity Free-Plan kennt nur Administrator + Viewer.** Editor-Rolle erfordert Paid-Plan. Bäcker hat aktuell Administrator — Risiko gering, da er nur den Studio-Link nutzt und nie zu sanity.io/manage geht.
- **Studio v3.99 ist „Partially compatible" mit dem neuen Sanity-Dashboard.** Funktional kein Problem; Upgrade auf v5 später möglich, aktuell unnötig.
- **Vercel Free Plan hat kein „Only Preview Deployments"-Setting.** Auth ist entweder ganz aus oder Standard Protection (was die `*.vercel.app`-URL schützt). Aktuell: ganz aus, weil Site öffentlich sein soll.
