# bonpain-v2 — Langzeitgedächtnis

Details und Links stehen in [PROJECT.md](../PROJECT.md). Hier nur Stand, Entscheidungen, Offenes, Stolpersteine.

## Projektziel
Neue Website der Bäckerei Bon Pain Fait Main (Benjamin Ramakers, Waimes/Sourbrodt): Vite + React, Sanity (Projekt `5f1udd5l`, Dataset `production`), Vercel-Projekt `bonpainv2` (Team `bolteds-projects`), Bestellformular → `api/order.ts` → Resend + Upstash Redis. Soll in ein bis zwei Monaten die Live-Seite bonpainfaitmain.be (v1, Repo `bonpain-v1`, PHP bei Infomaniak) ablösen.

## Aktueller Stand (2026-10-05)
- Live auf bonpainfaitmain.be ist **v1** (Infomaniak, Apache). v2 läuft nur auf https://bonpainv2.vercel.app (Push auf `main` = Production-Deploy dort).
- Bestellweg nach den v1-Vorfällen vom 05.10.2026 geprüft und abgesichert, **seit 2026-10-05 in `main` und live auf bonpainv2.vercel.app** (Merge `9b05260`). Befund und Verhalten: PROJECT.md → „Bestellweg". Lokal 27 Fälle gegen Mock-Resend/Mock-Upstash grün, Formular im Browser geprüft.
- Mail-DNS für Resend steht in der Infomaniak-Zone (`resend._domainkey`, `send` MX/SPF, AWS eu-west-1). DMARC `p=reject`, kein `rua`.
- Mailtest 2026-10-05 über Preview an mail-tester.com: 10/10, Absender `orders@bonpainfaitmain.be`, SPF/DKIM (`s=resend`)/DMARC pass.
- `CRON_SECRET` gesetzt und deployt (2026-10-05), `/api/keepalive` → 401 von außen.
- Resend-Konto: Team **intuitivmedia**, Tarif **Free**, Domain bonpainfaitmain.be verifiziert. Webhook am 2026-10-05 angelegt (`3d90ed39-9e8e-44ed-9c8f-af370b456d2c`): `https://bonpainv2.vercel.app/api/resend-webhook`, Events bounced/complained/failed/suppressed. `RESEND_WEBHOOK_SECRET` in Vercel (Production). Live geprüft: Testbestellung über Preview an `bounced@resend.dev` → zwei `email.bounced` an Production zugestellt, Signatur ok, 204 (Test → keine Meldung an Benjamin). Der Meldungsversand an Benjamin selbst ist nur lokal mit Mock geprüft.
- Datenschutzseite/Impressum nennen jetzt Vercel, Resend, Upstash, Google (nur Gmail), Sanity; Freigabe durch Betreiber steht aus.
- Schriften selbst gehostet (seit 2026-10-05 in `main`). Keine Requests mehr an Google, alle 11 genutzten Schnitte pixelidentisch zu vorher (Canvas-Vergleich). Details: CLAUDE.md → „Schriften".
- Alle Arbeitsbranches (`claude/bestellweg-absichern`, `claude/fonts-selbst-hosten`) sind in `main`.

## Entscheidungen (mit Grund)
- **Bäcker-Mail vor Kundenbestätigung, nacheinander.** Vorher parallel: bei gescheiterter Bäcker-Mail bekam der Kunde trotzdem „bien reçu". Kosten: ~0,3 s mehr.
- **Gescheiterte Bäcker-Mail → Bestellung per `LREM` aus Redis entfernen.** Sonst steht sie nach dem Wiederholen doppelt im Tagesdigest.
- **Keine Erfolgsmeldung ohne echte Zustellung an Resend.** Fehlende Konfiguration = 503, gescheiterte Bestätigung wird dem Kunden angezeigt. Lehre aus v1 (`mail()` lieferte `true`, Mails kamen nicht an).
- **Produktnamen werden serverseitig gegen Sanity geprüft, Preise nicht.** Der Kunde kann die Seite mit einem alten Preis offen haben; ein Preisabgleich würde echte Bestellungen ablehnen. Namen reichen, um Freitext/Links in der Bestätigung zu verhindern. Total wird aus den Zeilen gerechnet.
- **Schriften: dieselben Bytes wie von Google, aus `src/fonts/` statt `public/`.** Pixelidentisch statt „fast gleich" (eine statische Kursiv-Instanz wäre 15 KB kleiner gewesen, driftete aber 0,3 px pro Zeile). `src/` → Vite hasht, `/assets/` ist in `vercel.json` immutable, Workbox precacht. Preload nur für die zwei aufrechten Dateien (above the fold).
- **Limits fail-open.** Ein Redis-Ausfall darf keine Bestellung kosten; die Payload-Prüfungen greifen trotzdem.
- **Preview isoliert** (`preview:`-Präfix, `[TEST]`, Bäcker-Mail an Testadresse), weil Preview und Production dieselben Env-Vars und denselben Redis-Store haben.
- **Bounce-Meldung per Resend-Webhook statt Dashboard-Kontrolle**, weil niemand ins Dashboard schaut. Nur `kind=confirmation` löst eine Mail aus (keine Schleifen).
- Tippfehler-Hinweis im Formular ist nur ein Vorschlag; abgelehnt wird nur eine Domain, die es per DNS sicher nicht gibt.

## Offene Aufgaben
- **Go-live erst, wenn die Produktfotos fertig sind** (Entscheidung Betreiber 2026-10-05): dann Domain-Umzug nach Checkliste in PROJECT.md und danach Webhook-URL in Resend auf `https://bonpainfaitmain.be/api/resend-webhook` ändern.
- Upstash-Region klären, ggf. Funktionsregion nach EU (`vercel.json` `regions`) und Datenschutztext anpassen.
- Sanity `siteContent.orderTitle` = „Passez votre commande" + `orderTitleAccent` = „commande" → Seite zeigt „commande commande". `orderTitle` auf „Passez votre" setzen (Sanity-Schreibzugriff, vorher fragen).
- [docs/fotoleitfaden.html](../docs/fotoleitfaden.html) lädt noch Google Fonts (nicht Teil der Website, aber wer sie öffnet, schickt seine IP an Google).
- Cramique und Épeautre sésame fehlen in Sanity (v1 hat beide) — Preise beim Bäcker erfragen.
- Domain-Umzug nach Checkliste in PROJECT.md; danach Infomaniak aufräumen (Gerätepasswort, `/private/bonpainfaitmain.be/`, alte Site) — jeweils nach Freigabe.
- v1-Entscheidungen beim Betreiber: Aufbewahrung des alten Bestellprotokolls (Vorschlag 90 Tage), Netlify-Angabe in v1 `public/datenschutz.html` korrigieren?
- Baker-Seite (Studio): Fotos für Épeautre sans sésame, Seigle, Rustik, Fagnard.

## Stolpersteine
- Vor Rückfragen an den Betreiber zu Vercel: Env-Vars/Deployments selbst per Vercel-MCP prüfen (`filter_project_envs`, `list_deployments`). Er will nicht nach Dingen gefragt werden, die dort schon stehen.
- Neue Env-Vars wirken erst nach einem neuen Deployment (Redeploy).
- Vercel-Env-Vars sind `sensitive`: Werte über API/MCP nicht lesbar, nur Namen und Ziele. Absenderadresse lässt sich nur per Mail-Header belegen.
- Vercel Hobby: Runtime-Logs 1 Stunde. Wer Fehler nachweisen will, muss innerhalb der Stunde schauen.
- Upstash Free archiviert bei Inaktivität → täglicher Cron `/api/keepalive` (05:00 UTC).
- `npm ci` vor lokalen Tests: Root-`node_modules` fehlt in frischen Checkouts.
- `src/components/Products.tsx` kann eine lokale, uncommittete Fototest-Änderung (`imgTestOverrides`) tragen — nie mitcommitten (gitignored Datei, Vercel deployt `main` automatisch). Sicherung (Patch, `imgTestOverrides.ts`, Testbilder) seit 2026-10-05 in `~/Desktop/Sanity-Websites/_backup-bonpain-v2-fototest-2026-10-05/` (LIESMICH.txt erklärt das Zurückspielen; nur lokal, nicht in Cloud-Sessions).
- In zsh splittet `for q in "A b"; set -- $q` nicht an Leerzeichen → bei dig-Schleifen `for t n in …` nutzen.
- Rechtstexte (Datenschutz, Impressum, CGV) nur mit Freigabe des Betreibers live schalten.
- `className="not-italic italic"` auf den Akzentwörtern der Überschriften: in Tailwind 3 gewinnt `not-italic` (steht später im CSS), die Wörter sind also nicht kursiv. Kursiv sind nur „sur commande" (Schedule), das Schlusszitat (About) und „(infos)" im Formular.
