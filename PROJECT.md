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
Email:     Resend (Absenderdomain bonpainfaitmain.be, Versand über AWS eu-west-1)
Domain:    bonpainfaitmain.be (TODO)
Analytics: Vercel Analytics (via inject() in main.tsx)
Fonts:     selbst gehostet, src/fonts/ (WOFF2, OFL), Aliase in tailwind.config.js
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

## 📮 Bestellweg (Stand 2026-10-05)

Nach den Fehlern auf v1 (05.10.2026: Bestätigungen kamen nicht an, Protokoll im Web-Verzeichnis, keine Tippfehler-Erkennung, kein Missbrauchsschutz) abgesichert. Ablauf in [api/order.ts](api/order.ts):

1. Prüfen: Feldformate, Produktnamen gegen Sanity (öffentliches CDN; ohne Sanity nur Zeichensatz), Wochentag passt zum Datum, Abholdatum frühestens heute (Belgien) + `orderLeadDays` (sonst `too_soon`; ohne Sanity keine Prüfung), E-Mail-Domain existiert (DNS: MX/A/AAAA; nur ein sicheres „gibt es nicht" lehnt ab). Keine Links in Name/Vorname/Remarques. Total wird serverseitig aus den Zeilen gerechnet.
2. Limits (Redis, Keys gehasht, ohne Redis offen): 6/h je IP, 5/Tag je Adresse, 40 Bestellungen/Tag gesamt (Resend Free = 100 Mails/Tag, 2 pro Bestellung).
3. Bäcker-Mail **zuerst**. Scheitert sie → 502, Bestellung wird aus Redis wieder entfernt, keine Bestätigung an den Kunden.
4. Dann Bestätigung. Scheitert sie → 200 mit `confirmation: 'failed'`, das Formular sagt das dem Kunden und nennt die Telefonnummer.
5. Fehlt die Resend-Konfiguration → 503 (früher: stilles 200).

Antwortcodes für das Formular: `invalid`+`field`, `links`, `email_domain`+`domain`, `too_soon`+`leadDays`, `products_changed` (409), `rate_limited`/`daily_limit` (429), `delivery_failed` (502), `not_configured` (503).

**Zustellung nach dem Versand:** [api/resend-webhook.ts](api/resend-webhook.ts) meldet Benjamin per Mail, wenn eine Bestätigung bounced, als Spam markiert, gesperrt oder fehlgeschlagen ist (Mails sind mit `kind=order|confirmation|notice` getaggt; nur `confirmation` löst eine Meldung aus → keine Schleife). **Einrichtung steht aus**, siehe Offen.

**Preview-Deployments** teilen sich Env-Vars und Redis mit Production. Deshalb: Redis-Keys mit Präfix `preview:`, Betreff mit `[TEST] `, Bäcker-Mail an `ORDER_TO_EMAIL_PREVIEW` oder (falls nicht gesetzt) an die Adresse der Testbestellung selbst. Eine Preview-Bestellung erreicht Benjamin also nie.

**Logs:** nur Metadaten (Datum, Zeilen, Summe). Die ganze Bestellung wird nur geloggt, wenn sie sonst verloren wäre (Bäcker-Mail gescheitert, Konfiguration fehlt). Vercel Hobby hält Runtime-Logs 1 Stunde.

**Env-Vars:** `RESEND_API_KEY`, `ORDER_TO_EMAIL`, `ORDER_FROM_EMAIL` (alle `sensitive`, Werte über die API nicht lesbar), `KV_*` (Upstash-Integration), `RESEND_WEBHOOK_SECRET`, `SUBSCRIPTION_SECRET` (Abo-Links), optional `ORDER_TO_EMAIL_PREVIEW`, `SITE_URL`. Empfohlen: `CRON_SECRET` (sonst ist `/api/keepalive` öffentlich aufrufbar).

**Lokal testen:** `RESEND_BASE_URL` lenkt das Resend-SDK auf einen Mock-Server, `KV_REST_API_URL` den Upstash-Client; die Funktion mit `npx esbuild api/order.ts --bundle --platform=node --format=cjs` bündeln und den Handler direkt aufrufen. So am 2026-10-05 mit 26 Fällen geprüft (Harness lag im Scratchpad, nicht im Repo). Achtung: der Upstash-Client bündelt Befehle automatisch (`POST …/pipeline` mit Liste von Befehlen) und erwartet Strings base64-kodiert (außer `"OK"`); ein Mock muss beides können.

## 🔁 Commandes régulières (Abo, seit 2026-10-12)

Kunde hakt im Formular „Répéter cette commande chaque semaine“ an. Die Bestellung selbst ist normal; ab der Folgewoche wiederholt sie sich jeden gleichen Wochentag, bis der Kunde oder Benjamin sie beendet. Rechtlich: CGV Art. 8, Datenschutz (Speicherung bis 60 Tage nach Ende).

- **Code:** gemeinsamer Servercode in [server/](server/) (Vercel macht jede Datei in `api/` zu einer Funktion; Imports mit `.js`-Endung, Paket ist ESM). [api/order.ts](api/order.ts) legt das Abo an, [api/subscription.ts](api/subscription.ts) verwaltet es, [api/daily.ts](api/daily.ts) ist der Cron, Seite [src/components/Subscription.tsx](src/components/Subscription.tsx) unter `/abonnement`.
- **Daten (Redis):** `sub:{id}` (JSON: Kunde, Wochentag, Produkt-IDs + Mengen, ausgesetzte Termine, Zustimmungstext + Zeitpunkt), `subs:active` (Set), `final:{datum}` (Endliste verschickt), `vacnotice:{hash}` (wer über eine Schließung informiert ist). Preise, Saison, Verkaufstage und Urlaub kommen immer frisch aus Sanity.
- **Links:** `/abonnement#{id}.{token}` (Kunde) und `#b.{id}.{token}` (Benjamin, steht in seiner Tagesliste). Token = HMAC aus `SUBSCRIPTION_SECRET` (Vercel, Production + Preview, `sensitive`). Nichts Geheimes in Redis; **Secret ändern macht alle verschickten Links ungültig.** Änderungen nur per POST (Mail-Scanner öffnen Links).
- **Fristen:** Änderungen gelten für Termine ab heute + `orderLeadDays`; nähere Termine sind gesperrt („Commande transmise“). Beendet der Kunde ein Abo, nachdem die Endliste eines Termins raus ist, bleibt dieser Termin bestehen (Mail sagt das, Absage per Telefon nach Art. 7).
- **Tagesliste:** Jede Bestellung schickt wie bisher die komplette Liste des Tages, jetzt inkl. fälliger Abos („Commande régulière“, Link „gérer / arrêter“, nicht lieferbare Produkte rot). **Cron `/api/daily` 23:00 UTC** (Hobby: irgendwann in der Stunde = nach Mitternacht in Belgien) schickt für jeden gerade geschlossenen Verkaufstag die **Liste définitive** in denselben Gmail-Verlauf, auch wenn nur Abos anstehen. `/api/keepalive` (05:00 UTC) holt Verpasstes nach (Marker verhindert Doppelversand). Kein Sanity → kein Versand, Nachholen um 05:00.
- **Urlaub:** Urlaubsbanner aktiv + Daten → Abo-Termine im Zeitraum fallen aus (auch ohne „Désactiver les commandes“). Ohne Daten: ausgesetzt, solange der Banner aktiv ist. Jeder betroffene Kunde bekommt einmal pro Schließung eine Mail mit ausfallenden Terminen und Wiederbeginn (max. 30 pro Lauf, Rest am nächsten Lauf).
- **Grenzen:** ein aktives Abo je Adresse und Wochentag, max. 150 aktive Abos, Samstagsprodukte nur im Samstags-Abo, Thekenware nie. Verwaltung: 60 Aufrufe/h je IP, 10 Änderungen/Tag je Abo.
- **Mails:** `kind=subscription` (Änderung, Ende, Urlaub) → Bounce-Meldung an Benjamin über den Webhook.
- **Preview:** `/api/daily?date=YYYY-MM-DD` schickt die Endliste dieses Tages sofort (nur Preview, an die Testadresse). Lokaler Harness: 30 Fälle mit Fake-Uhr (2026-10-12, Scratchpad).

## 🚚 Domain-Umzug bonpainfaitmain.be → Vercel

Heute (2026-10-05, per `dig`): Zone bei Infomaniak (`nsany1/2.infomaniak.com`), Website = v1 auf Infomaniak (A `185.125.27.25`, AAAA `2001:1600:0:aaaa::80:15`, Apache).

**Ändern** (Werte aus Vercel → Settings → Domains übernehmen, Doku-Beispiel: A `76.76.21.21`, CNAME `cname.vercel-dns-0.com`):
- `@` A → Vercel-Wert
- `@` **AAAA löschen** (sonst landen IPv6-Besucher weiter auf Infomaniak), außer Vercel zeigt selbst einen AAAA-Wert an
- `www` A und AAAA löschen, dann `www` CNAME → Vercel-Wert (in Vercel als Redirect auf die Apex-Domain)
- TTL ist bereits 300 s, ein Rollback greift also schnell

**Unverändert lassen** (Mail bleibt bei Infomaniak, Resend sendet weiter):
- MX `@` → `mta-gw.infomaniak.ch` (5)
- TXT `@` → `v=spf1 include:spf.infomaniak.ch -all`
- TXT `20250714._domainkey` (DKIM Infomaniak)
- TXT `_dmarc` → `v=DMARC1; p=reject;`
- TXT `resend._domainkey` (DKIM Resend)
- MX `send` → `feedback-smtp.eu-west-1.amazonses.com` (10), TXT `send` → `v=spf1 include:amazonses.com ~all` (Return-Path von Resend)
- CNAME `autodiscover`, `autoconfig` → `infomaniak.com.`

Keine CAA-Records → Vercel kann das Zertifikat ausstellen.

Optional: `_dmarc` um `rua=mailto:…` ergänzen, damit Berichte über abgelehnte Mails ankommen (heute gibt es keine).

**Nach dem Umzug:** Resend-Webhook auf `https://bonpainfaitmain.be/api/resend-webhook` umstellen; Testbestellung; prüfen, dass die Abo-Links in den Mails auf die neue Domain zeigen (`VERCEL_PROJECT_PRODUCTION_URL`, notfalls Env-Var `SITE_URL` setzen; vorher verschickte Links auf bonpainv2.vercel.app funktionieren weiter); [src/lib/orderApi.ts](src/lib/orderApi.ts) postet von bonpainfaitmain.be weiter cross-origin an bonpainv2.vercel.app (funktioniert, CORS ist freigegeben) und kann danach auf `/api/order` vereinfacht werden.

**Aufräumen bei Infomaniak** (vorerst nicht: v1 bleibt als Backup, Entscheidung 2026-10-29; später jeweils nach Freigabe):
- Gerätepasswort „Site web bonpainfaitmain.be" am Postfach `info@` löschen (v1-SMTP)
- `/private/bonpainfaitmain.be/` (enthält `mail-config.php` mit Passwort, `contact_log.txt` und `orders.log` mit allen Bestellern seit 2025-08, `rate-limit.json`) — Aufbewahrungsfrist entscheidet der Betreiber
- `/sites/bonpainfaitmain.be` (v1-Build inkl. `send.php`)

## 🔜 Offen

**Vor dem Domain-Anschluss:**
- **Bestellweg-Absicherung (2026-10-05)** auf Branch `claude/bestellweg-absichern`, lokal und im Preview geprüft. Mailtest über Preview an mail-tester.com am 2026-10-05: **10/10**, `From: orders@bonpainfaitmain.be`, SPF pass (envelope-from `…@send.bonpainfaitmain.be`, AWS eu-west-1), DKIM pass (`d=bonpainfaitmain.be`, `s=resend`), DMARC pass (`p=reject`). Am 2026-10-05 nach `main` gemergt (`9b05260`) und live auf bonpainv2.vercel.app.
- ✅ **Resend-Webhook aktiv** (2026-10-05, Konto intuitivmedia, Free-Tarif, `RESEND_WEBHOOK_SECRET` gesetzt, mit `bounced@resend.dev` live geprüft). Testbestellungen (`[TEST]`-Betreff) lösen nie eine Meldung an die Bäckerei aus. Einrichtung zum Nachschlagen (Resend → Webhooks): URL `https://bonpainv2.vercel.app/api/resend-webhook` (nach dem Umzug die echte Domain), Events `email.bounced`, `email.complained`, `email.failed`, `email.suppressed`; Signing Secret als `RESEND_WEBHOOK_SECRET` in Vercel (Production). Ohne Secret antwortet der Endpunkt 503 und tut nichts.
- ✅ **`CRON_SECRET`** am 2026-10-05 gesetzt (Production + Development) und neu deployt; `/api/keepalive` antwortet von außen mit 401.
- ✅ Resend-Tarif: **Free** (Settings → Usage, 2026-10-05). Der Code rechnet mit Free (100/Tag, 3.000/Monat, Resend-Doku 2026-10-05); v1 hatte max. 15 Bestellungen/Tag ≈ 30 Mails.
- ✅ **Funktionsregion `fra1` (2026-10-09).** Die Upstash-Instanz liegt in AWS eu-central-1 (Frankfurt): aus einer `fra1`-Funktion löst der Host auf fünf eu-central-1-Adressen auf, `PING` braucht 2,5 ms. Die Funktionen liefen bis dahin in `iad1` (USA), jeder Redis-Aufruf ging also über den Atlantik. Jetzt `"regions": ["fra1"]` in `vercel.json`; Datenschutzseite nennt Frankfurt für Vercel-Funktion und Upstash. Die Region ist über die Vercel-API nicht lesbar (Store-Abfrage 404, Env-Vars `sensitive`); gemessen wurde über einen temporären, schlüsselgeschützten Endpunkt auf einem Preview-Branch (gelöscht).
- ✅ **Schriften selbst gehostet (2026-10-05)**, Branch `claude/fonts-selbst-hosten` (setzt auf `claude/bestellweg-absichern` auf). Cormorant Garamond und DM Sans liegen als WOFF2 (Latin) in [src/fonts/](src/fonts/), keine Anfrage mehr an fonts.googleapis.com/gstatic.com; Google-Fonts-Satz aus der Datenschutzseite gestrichen (Gmail bleibt).
- **Datenschutzseite und Impressum** am 2026-10-05 überarbeitet (Hoster, Auftragsverarbeiter, Aufbewahrung, Beschwerderecht). Rechtstext am 2026-10-29 vom Betreiber freigegeben.
- ✅ **Neue Accueil-Texte im Dataset (2026-09-05).** `studio/scripts/update-textes-accueil-2026.mjs` ausgeführt: `heroSubtitle`, `productsSubtitle`, `saturdayNotice`, `orderNotice` in `siteContent` überschrieben. Per GROQ gegen `production` und auf https://bonpainv2.vercel.app verifiziert. Die Werbeaussage „fermentation longue de 24 heures" ist damit aus dem Dataset verschwunden (dataset-weite GROQ-Suche nach „24 heures": 0 Treffer). Verbleibende „24 heures"-Stelle im Code ist die Stornofrist in [CGV.tsx](src/components/legal/CGV.tsx) — juristisch, keine Produktaussage, bleibt.
- ✅ Resend läuft. Testbestellung am 2026-08-24 gegen die Production-Function: HTTP 200, Bäcker- und Kundenmail rausgegangen.
- ✅ **Upstash Redis repariert (2026-08-24).** Die alte Instanz `bonpain-orders` war „Archived due to inactivity" — der Host löste nicht mehr auf, dadurch kein Tagesdigest und kein wirksames Rate-Limit. Behoben: tote Instanz vom Projekt getrennt (ihre 5 verwalteten Env-Vars sind damit weg), aktive Instanz `upstash-kv-cinereous-helmet` mit Prefix `KV` verbunden → `KV_REST_API_URL` / `KV_REST_API_TOKEN` stimmen wieder. Verifiziert: `/api/keepalive` schreibt und liest, Testbestellungen laufen ohne Redis-Fehler durch.
- **Damit es nicht wieder passiert:** täglicher Cron `/api/keepalive` (05:00 UTC, `vercel.json`) hält die Free-Instanz aktiv. Wenn der Ping scheitert, steht das laut in den Runtime-Logs.
- Sender-Domain in Resend verifiziert (DNS bei Registrar) — sollte mit dem funktionierenden Versand erledigt sein, beim Domainwechsel gegenprüfen.
- Vier Produkte ohne Foto (Épeautre sans sésame, Pain au seigle, Le Rustik, Le Fagnard) — zeigen bis dahin das lokale Ersatzbild. Alt-Texte fehlen dort ebenfalls.
- ~~Panettone-Saison abgelaufen~~ → am 2026-08-24 auf Ostern 2027 gesetzt (12.03.–29.03.2027, `studio/scripts/set-panettone-season-2027.mjs`). Karte zeigt jetzt „Disponible dès le 12 mars".
- ~~`siteSettings.partnerStores` enthielt Platzhalter~~ → am 2026-08-24 mit `studio/scripts/fix-partner-stores.mjs` auf die echten Partner korrigiert (Quelle: bonpainfaitmain.be).
- Zwei Produkte der alten Site fehlen im Dataset: **Épeautre sésame** und **Cramique** (Cramique mit fertigem Beschreibungstext auf der alten Site). Preise unbekannt → beim Bäcker erfragen, dann anlegen.
- ✅ **Studio deployt (2026-10-12)**, inkl. `partnerStore.salesDays` und Beschreibung bis 320 Zeichen. Vorher fehlte der CLI-Login mit dem richtigen Konto (`npx sanity login`).


| Wer | Was |
|---|---|
| Bäcker | Site reviewen, Studio testen (Preis korrigieren, eigenes Foto austauschen) |
| Du | **Domain `bonpainfaitmain.be` auf Vercel anschließen** — siehe Abschnitt „Domain-Umzug" (welche Records sich ändern, welche Mail-Records bleiben müssen) |
| Du | Alte hardcoded Site auf `bonpainfaitmain.be` parallel abschalten / DNS umlegen |

## ⚠️ Wichtige Hinweise

- **Kein Token im Frontend-Bundle.** Vite inlinet alle `VITE_*`-Vars in das öffentliche JS — Token mit Schreibrechten dürfen NIE als `VITE_*` gesetzt werden. Read-Zugriff geht token-frei über das Sanity-CDN.
- **[src/lib/sanity.ts](src/lib/sanity.ts) liest bewusst kein Token** (seit 2026-10-05; vorher wurde `VITE_SANITY_TOKEN` gelesen und wäre im Bundle gelandet). Alles läuft token-frei über das CDN.
- **Sanity Free-Plan kennt nur Administrator + Viewer.** Editor-Rolle erfordert Paid-Plan. Bäcker hat aktuell Administrator — Risiko gering, da er nur den Studio-Link nutzt und nie zu sanity.io/manage geht.
- **Studio v3.99 ist „Partially compatible" mit dem neuen Sanity-Dashboard.** Funktional kein Problem; Upgrade auf v5 später möglich, aktuell unnötig.
- **Vercel Free Plan hat kein „Only Preview Deployments"-Setting.** Auth ist entweder ganz aus oder Standard Protection (was die `*.vercel.app`-URL schützt). Aktuell: ganz aus, weil Site öffentlich sein soll.
