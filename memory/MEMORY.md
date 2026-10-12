# bonpain-v2 — Langzeitgedächtnis

Details und Links stehen in [PROJECT.md](../PROJECT.md). Hier nur Stand, Entscheidungen, Offenes, Stolpersteine.

## Nächste Session: hier starten (Stand 2026-10-12)
**Fotos und Produktangaben sind eingebaut und live auf bonpainv2.vercel.app. Es wartet die Durchsicht durch Benjamin** (Namen, Preise). Mails/Nachrichten an Benjamin entwirft Claude, verschickt werden sie vom Betreiber (Französisch, kurz, kein Roboterton).

**Produkte (Sanity)**
- Quelle der Angaben: Benjamins picdrop-Kommentare. **Produktname + Gewicht stehen im Namensfeld `author`, Zutaten im Text** (beide lesen). Zuordnung aller 137 Bilder: [MAILS-benjamin-produkte.md](MAILS-benjamin-produkte.md) → „Antworten Benjamin".
- Galerie-Export: `/Volumes/EXTREME_SSD/BONPAIN_2-0/GALLRY` (2400x1600 JPEG, Dateinummer = CR3-Nummer).
- Eingespielt mit `studio/scripts/apply-photoshoot-2026-10.mjs` (Bild, Alt-Text, Beschreibung = Zutaten + Gewicht, neue Produkte). Einzelbild tauschen: `studio/scripts/set-product-image.mjs <id> <datei> "<alt>"` (Verlauf im Kopf des Skripts).
- Bilder: alle aus dem Shooting außer Pizza (Unsplash z11dSXXlt8c, Hotspot links), Panettone (Bild vom Betreiber) und Épeautre sésame (Bild vom Betreiber). Croissant = 182, Pain au chocolat = 197, Tarte = 091 mit Crop links 13 %. Keine KI-Bilder mehr.
- Neu angelegt: Rustik aux lin et tournesol (35), Pain blanc à la coupe (78), bestellbar, Preis vorläufig 6 €. Thekenware (`orderInForm: false`): Tartelette, Feuilleté aux pommes (2,75 € laut Schild), Torsade à la crème, Cookie, Gaufre, Bun, Petit pain aux graines de courge. **Preis 0 = unbekannt → Karte zeigt „Prix en magasin"**; Thekenware fehlt absichtlich in der Wochenübersicht und im Formular.
- Nach Augenschein benannt, von Benjamin zu prüfen: Tartelette, Torsade, Gaufre, Petit pain courge. Bilder 063–068 (Kastenlaib, bemehlt) sind keinem Produkt zugeordnet.
- Reihenfolge (sortOrder, Zehnerschritte): schöne runde Brote zuerst, Baguette ans Ende der Brote, dann Tarte und Kleingebäck, Pizza, Panettone.

**Seite**
- Produktkarten: Fotos per CSS 8 % gezoomt (`IMG_ZOOM` in Products.tsx, gegen Papierränder); Saison-Badge mittig, kräftig rot; nicht verfügbare Produkte nicht verblasst.
- About: zwei große Bilder (Benjamin am Ofen 156 / am Leinentuch 070), Schlusszitat, 4er-Serie in Arbeitsreihenfolge (`src/assets/fournil/`: 180 → 121 → 017 → 069 Nadia), darunter Button „Suivez-nous sur Facebook". Betreiber will hier wenige, gute Bilder ohne Doppelungen. Hero unverändert (Betreiber zufrieden).
- Facebook: `siteSettings.facebookUrl` = https://www.facebook.com/p/Bonpainfaitmain-61586966453974/ → Icon im Footer, Hinweis unter den Öffnungszeiten, Button im About (alles nur, wenn URL gesetzt).

**Mit Benjamin besprochen bzw. vorbereitet (Entwürfe nur im Chat)**
- Bitte um Durchsicht + Preise selbst im Studio (https://bonpainfaitmain.sanity.studio, Login per Google nur, wenn seine Adresse unter Members steht – **nicht geprüft**; „Publier" nötig, sonst bleibt es Entwurf).
- Vorteile v2 vs. v1, ehrlich: v1 schickt pro Bestellung eine Textmail mit Wochentag ohne Datum, ohne Preise/Summen/Telefon; v2 schickt je Abholtag die komplette aktualisierte Liste (gleicher Betreff → ein Gmail-Verlauf, „À préparer", „Retraits", „Total caisse") und meldet nicht zugestellte Bestätigungen. Bestätigung-nur-nach-Bäcker-Mail, DNS-Prüfung der Maildomain und Limits hat **v1 seit 2026-10-05 auch**.
- Erweiterungsideen (nicht gebaut): **Abo/Dauerbestellung** (Favorit des Betreibers: Kunde legt einmal fest, gilt bis Widerruf, erscheint automatisch in der Tagesliste, Pause bei Urlaub; offen: was bei Nichtabholung), Endliste zum Bestellschluss (wegen langer Teigführung), Erinnerung an Kunden am Vortag (sprengt ggf. Resend Free 100/Tag). Leitlinie Betreiber: pragmatisch, nichts, wofür sie sich regelmäßig ins Studio einloggen müssen.

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
- **2026-10-09:** Funktionen laufen in `fra1` (Frankfurt), Upstash liegt in AWS eu-central-1 (gemessen, siehe PROJECT.md → „Funktionsregion"). Datenschutzseite nennt Frankfurt für Vercel-Funktion und Upstash. `siteContent.orderTitle` korrigiert (Skript `studio/scripts/fix-order-title.mjs`), Fotoleitfaden lädt nichts mehr von Google (Schriften eingebettet).
- **2026-10-09:** Bilder optimiert (Regeln: CLAUDE.md → „Bilder"). Produktkarten laden lazy mit `srcset` (400–1000 px), Hero als `<img>` mit `srcset` statt CSS-Hintergrund, die drei About-Fotos liegen neu kodiert in `src/assets/mood/` (800/1200 px, je 26–115 KB statt 138–188 KB), Precache 1164 → 521 KiB.
- **2026-10-09:** Pain bûcheron ist aus dem Sortiment und aus beiden Seiten entfernt (Sanity `product-bucheron` `isActive: false`; v1 live auf `44fd7ee`). Produktfotos sind aufgenommen (220 CR3, in ACR entwickelt), Auswahl in Bridge mit Sternen markiert (5 = Produkt, 4 = Mood, 3 = Alternative), Durchsicht durch Betreiber steht aus.

## Entscheidungen (mit Grund)
- **Bäcker-Mail vor Kundenbestätigung, nacheinander.** Vorher parallel: bei gescheiterter Bäcker-Mail bekam der Kunde trotzdem „bien reçu". Kosten: ~0,3 s mehr.
- **Gescheiterte Bäcker-Mail → Bestellung per `LREM` aus Redis entfernen.** Sonst steht sie nach dem Wiederholen doppelt im Tagesdigest.
- **Keine Erfolgsmeldung ohne echte Zustellung an Resend.** Fehlende Konfiguration = 503, gescheiterte Bestätigung wird dem Kunden angezeigt. Lehre aus v1 (`mail()` lieferte `true`, Mails kamen nicht an).
- **Produktnamen werden serverseitig gegen Sanity geprüft, Preise nicht.** Der Kunde kann die Seite mit einem alten Preis offen haben; ein Preisabgleich würde echte Bestellungen ablehnen. Namen reichen, um Freitext/Links in der Bestätigung zu verhindern. Total wird aus den Zeilen gerechnet.
- **Schriften: dieselben Bytes wie von Google, aus `src/fonts/` statt `public/`.** Pixelidentisch statt „fast gleich" (eine statische Kursiv-Instanz wäre 15 KB kleiner gewesen, driftete aber 0,3 px pro Zeile). `src/` → Vite hasht, `/assets/` ist in `vercel.json` immutable, Workbox precacht. Preload nur für die zwei aufrechten Dateien (above the fold).
- **Funktionsregion `fra1` statt `iad1`.** Upstash liegt in Frankfurt; aus den USA ging jeder Redis-Aufruf über den Atlantik, und die Bestelldaten verließen ohne Not die EU.
- **Limits fail-open.** Ein Redis-Ausfall darf keine Bestellung kosten; die Payload-Prüfungen greifen trotzdem.
- **Preview isoliert** (`preview:`-Präfix, `[TEST]`, Bäcker-Mail an Testadresse), weil Preview und Production dieselben Env-Vars und denselben Redis-Store haben.
- **Bounce-Meldung per Resend-Webhook statt Dashboard-Kontrolle**, weil niemand ins Dashboard schaut. Nur `kind=confirmation` löst eine Mail aus (keine Schleifen).
- Tippfehler-Hinweis im Formular ist nur ein Vorschlag; abgelehnt wird nur eine Domain, die es per DNS sicher nicht gibt.

## Offene Aufgaben
- **Go-live erst, wenn die Produktfotos fertig sind** (Entscheidung Betreiber 2026-10-05): dann Domain-Umzug nach Checkliste in PROJECT.md und danach Webhook-URL in Resend auf `https://bonpainfaitmain.be/api/resend-webhook` ändern.
- **Preise von Benjamin:** alle Produkte mit vorläufig 6 € (Pain aux fruits, Petit épeautre, Épeautre sésame, Cramique, Tarte, Rustik lin, Pain blanc) und Thekenware mit Preis 0. Gewicht fehlt bei Pain aux fruits, Rustik lin, Pain blanc. Benjamin trägt evtl. selbst ein (Cookie hat er am 2026-10-11 auf 2 € gesetzt).
- **Go-live-Entscheidung:** Fotos sind fertig; nach Benjamins Durchsicht Domain-Umzug.
- Domain-Umzug nach Checkliste in PROJECT.md; danach Infomaniak aufräumen (Gerätepasswort, `/private/bonpainfaitmain.be/`, alte Site) — jeweils nach Freigabe.
- v1-Entscheidungen beim Betreiber: Aufbewahrung des alten Bestellprotokolls (Vorschlag 90 Tage), Netlify-Angabe in v1 `public/datenschutz.html` korrigieren?
- Sanity-Entwürfe, die der Betreiber im Studio selbst verwerfen muss (Claude löscht nicht endgültig): (1) `drafts.0620e271-37a6-4460-9dbb-033622918a79` „Pain au seigle", leer, keine Referenzen, gehört nicht zu `product-pain-seigle`. (2) `drafts.siteSettings` vom 2026-05-07: enthält noch die Platzhalter-Partnerläden (Epicerie du Village, Bio-Laden Eifel, Ferme-Fromagerie). **Nicht veröffentlichen**, sonst überschreibt er die echten Partnerläden und löscht die Facebook-URL; im Studio „Änderungen verwerfen".
- Datenschutzseite: Sätze zu Frankfurt (Vercel, Upstash) am 2026-10-09 geändert, gehört zur ausstehenden Freigabe der Rechtstexte.
- Studio-Deploy für `partnerStore.salesDays` steht laut PROJECT.md noch aus (CLI-Login mit Account der Org `ovS9cwHZj`).

## Stolpersteine
- Vor Rückfragen an den Betreiber zu Vercel: Env-Vars/Deployments selbst per Vercel-MCP prüfen (`filter_project_envs`, `list_deployments`). Er will nicht nach Dingen gefragt werden, die dort schon stehen.
- Neue Env-Vars wirken erst nach einem neuen Deployment (Redeploy).
- Vercel-Env-Vars sind `sensitive`: Werte über API/MCP nicht lesbar, nur Namen und Ziele. Absenderadresse lässt sich nur per Mail-Header belegen.
- Vercel-Preview während des Builds antwortet mit **200** und einer „Deployment is building"-Seite: beim Warten den Inhalt prüfen, nicht den Statuscode. Zwei Pushes kurz hintereinander auf denselben Branch → das ältere Preview wird `CANCELED`.
- Vercel-MCP: Store-Details (`get_storage_stores_by_id`) und Integrationsliste liefern 404/403; die Upstash-Region ist nur per Messung aus einer Funktion zu ermitteln.
- Vercel Hobby: Runtime-Logs 1 Stunde. Wer Fehler nachweisen will, muss innerhalb der Stunde schauen.
- Upstash Free archiviert bei Inaktivität → täglicher Cron `/api/keepalive` (05:00 UTC).
- `npm ci` vor lokalen Tests: Root-`node_modules` fehlt in frischen Checkouts.
- In zsh splittet `for q in "A b"; set -- $q` nicht an Leerzeichen → bei dig-Schleifen `for t n in …` nutzen.
- Rechtstexte (Datenschutz, Impressum, CGV) nur mit Freigabe des Betreibers live schalten.
- `className="not-italic italic"` auf den Akzentwörtern der Überschriften: in Tailwind 3 gewinnt `not-italic` (steht später im CSS), die Wörter sind also nicht kursiv. Kursiv sind nur „sur commande" (Schedule), das Schlusszitat (About) und „(infos)" im Formular.
- Änderungen in Sanity erscheinen auf der Seite erst nach bis zu ~60 s: `apicdn` cacht jede Abfrage (`s-maxage=60`). Nicht vorher als Fehler werten.
