# Plan: Pain bûcheron entfernen (v1 + v2) und Fotoauswahl in Bridge

Vom Betreiber am 2026-10-09 freigegeben. Ausführung in der nächsten Session.

## Stand 2026-10-09 (hier weitermachen)

**Teil A erledigt und live (2026-10-09):**
- v2: `product-bucheron` in Sanity `isActive: false` (Skript ausgeführt), bonpainv2.vercel.app zeigt Bûcheron nirgends mehr.
- v1: Commit `44fd7ee` per FTPS deployt, Haupt-Chunk `index-C0PXtxsJ.js` live byte-identisch, Bestellformular ohne Bûcheron.

Offen: **Teil B** (Sicherung, Vorschauen, Sichtung, Sterne, Tabelle), danach Teil C erst nach Durchsicht durch den Betreiber.

Voraussetzungen für Teil B: lokale Session (keine Cloud-Session), SSD `EXTREME_SSD` angeschlossen, Bridge 2026 mit dem Ordner `BONPAIN_2-0` offen.

## Context

Zwei getrennte Aufträge:

1. **Pain bûcheron** wird nicht mehr gebacken und soll aus beiden Seiten verschwinden (v1 = live auf bonpainfaitmain.be, v2 = bonpainv2.vercel.app), danach deployen.
2. **Fotoshooting vom 09.10.2026**: 220 CR3 in `/Volumes/EXTREME_SSD/BONPAIN_2-0` (in Bridge 2026 geöffnet). Pro Sorte das beste Bild auswählen und in Bridge mit Sternen markieren, zusätzlich Mood-Kandidaten. Der Betreiber sieht sich die Auswahl an, erst danach werden Bilder in die Seite eingebaut. Die Produktfotos sind die letzte offene Voraussetzung für den Go-live von v2.

Befund aus der Erkundung:
- Alle 220 Sidecars haben `xmp:Rating="0"`, also noch keine eigene Bewertung. Alle haben ACR-Einstellungen, 61 zusätzlich `.acr`-Maskendateien (001-058, 114, 176, 189).
- Dateinummern laufen rückwärts zur Aufnahmezeit: 220 = 07:50, 001 = 09:20. Grob drei Blöcke: 121-220 (07:50-08:25), 069-120 (08:32-08:52), 001-068 (09:05-09:20).
- In Sanity fehlen Fotos bei Épeautre (sans sésame), Seigle, Rustik, Fagnard. Alle anderen Produktbilder sind KI-generiert (1408x768 PNG). Cramique existiert in Sanity noch nicht.
- Werkzeuge vorhanden: `exiftool`, `sips`, `cwebp`, `lftp`. Kein ImageMagick, kein PIL. `SANITY_WRITE_TOKEN` steht in `bonpain-v2/.env`, `FTP_PROD_PASS` in `Wertekreis-app/.env`.

## Teil A: Pain bûcheron entfernen

Vorab in beiden Repos: `git status`, `git pull`.

### A1. v2 (Sanity + Code)
- **Sanity:** `product-bucheron` auf `isActive: false` setzen (nicht löschen, damit es umkehrbar bleibt). Die Produktliste, das Bestellformular und die Brotliste in `Schedule.tsx` filtern alle über `isActive == true` ([src/lib/queries.ts](src/lib/queries.ts)). Wirkt sofort, ohne Deploy.
  - Umsetzung als kleines Skript nach dem Muster von [studio/scripts/set-panettone-season-2027.mjs](studio/scripts/set-panettone-season-2027.mjs): `studio/scripts/deactivate-bucheron.mjs`, Vorher/Nachher ausgeben, Token aus `.env`.
  - `api/order.ts` prüft Namen gegen alle Produkte (auch inaktive). Wer die Seite noch offen hat und Bûcheron bestellt, wird also nicht abgelehnt; der Bäcker sieht die Bestellung und kann reagieren. So gewollt, nichts ändern.
- **Code:** `'Pain bûcheron'` aus `FALLBACK_BREADS` in [src/components/Schedule.tsx:16](src/components/Schedule.tsx:16) streichen.
- **Doku:** Zeile in [docs/fotoleitfaden.html:338](docs/fotoleitfaden.html:338) entfernen. `studio/scripts/fix-slots-and-alt-texts.mjs` bleibt unverändert (historisches Migrationsskript).
- `npm ci`, `npm run build`, lokal prüfen, commit, push auf `main` (= Production-Deploy auf Vercel).

### A2. v1 (Repo `../bonpain-v1`, live)
- [src/utils/constants.ts](../bonpain-v1/src/utils/constants.ts): Eintrag `bucheron` aus `BREAD_TYPES` (Z. 31) und `'Pain bûcheron'` aus den drei `SALE_DAYS.*.breads` (Z. 70, 75, 80).
- [public/send.php:213](../bonpain-v1/public/send.php:213): Mapping `'bucheron'` **bleibt stehen**. Grund: Fehlt das Mapping, verschwindet der Posten wortlos aus der Mail, falls jemand mit noch offener Seite bestellt. Fällt mit dem Domain-Umzug ohnehin weg.
- JSON-LD in `index.html` enthält Bûcheron nicht, keine Änderung.
- Build und Deploy nach v1-Memory: `npx vite build`, dann `lftp` FTPS
  `mirror -R --no-perms --exclude-glob contact_log.txt --exclude-glob *.log --exclude-glob *_log.txt dist /sites/bonpainfaitmain.be` (kein `--delete`, `/private/` nicht anfassen). Passwort wird nur als Umgebungsvariable aus `Wertekreis-app/.env` gelesen, nie ausgegeben.
- Commit, push, v1-`memory/MEMORY.md` nachziehen (Live-Commit, Asset-Namen).

## Teil B: Fotoauswahl in Bridge markieren

Nur Sidecars werden angefasst, keine CR3, keine `.acr`.

1. **Sicherung:** alle 220 `.xmp` in den Scratchpad kopieren (dort stehen die ACR-Entwicklungen).
2. **Vorschauen:** eingebettete JPEGs per `exiftool -b -JpgFromRaw` in den Scratchpad extrahieren und mit `sips` auf ca. 1000 px verkleinern. Das sind Kamera-JPEGs ohne ACR-Entwicklung: ausreichend für Motiv, Schärfe, Ausschnitt, nicht für Farbe.
3. **Sichtung:** Übersichten als HTML-Kontaktbögen (je ca. 24 Bilder mit Dateinummer) im eingebauten Browser, dann Finalisten einzeln in voller Vorschaugröße auf Schärfe und Anschnitt prüfen.
4. **Auswahl:**
   - **5 Sterne = Produktbild**, genau eines je Sorte: Baguette, Pain gris, Pain aux noix, Épeautre sans sésame, Petit épeautre, Seigle, Rustik, Fagnard, Cramique (in der Schachtel), Tarte du jour (Apfel oder Waldbeeren, das stärkere; das andere 4 Sterne), Croissant, Pain au chocolat, Brötchen.
   - **4 Sterne = Mood-Kandidaten**, ca. 8 bis 12: Bäcker am Ofen, Nahaufnahmen Krume/Kruste, Atelier.
   - Kriterien Produktbild: scharf auf der Kruste, Brot vollständig im Bild, genug Rand für den 4:3-Beschnitt der Produktkarte ([src/components/Products.tsx:103](src/components/Products.tsx:103)), ruhiger Hintergrund.
5. **Markieren:** in den gewählten Sidecars `xmp:Rating="0"` durch `"5"` bzw. `"4"` ersetzen (gezielte Ersetzung nur dieses Attributs). Danach in Bridge prüfen, ob die Sterne erscheinen (Screenshot mit Filter). Falls Bridge den alten Cache zeigt: Ordner-Cache leeren lassen oder die Sterne per Tastenkürzel direkt in Bridge setzen.
6. **Übergabe:** Tabelle Dateinummer → vermutete Sorte → Begründung in einem Satz, dazu die Alternativen je Sorte.

**Unsicherheit:** Seigle, Rustik, Fagnard und die beiden Épeautre kann ich am Bild nicht sicher unterscheiden. Die Zuordnung in der Tabelle ist an diesen Stellen ein Vorschlag und wird als solcher gekennzeichnet; die Sorte bestätigt der Betreiber bei der Durchsicht.

## Teil C: Einbau in v2 (erst nach Durchsicht, eigener Schritt)

Skizze, damit die Auswahl schon darauf zielt:
- Betreiber exportiert die freigegebenen Bilder aus ACR/Bridge als JPEG (sRGB, lange Kante ca. 2400 px). Die ACR-Entwicklung samt Masken lässt sich nur dort rendern.
- Upload nach Sanity, Zuweisung an `product.image` mit Hotspot und französischem Alt-Text. Auslieferung bleibt Sanity-CDN (`auto=format`, 800x600), also keine Mehrlast gegenüber heute.
- Cramique als neues Produkt anlegen (Preis fehlt noch, beim Bäcker erfragen). Brötchen: klären, ob Produkt oder nur Mood.
- Mood-Bilder: zuerst die vorhandenen Plätze neu besetzen (Hero, drei Kapitelbilder in [src/components/About.tsx](src/components/About.tsx)). Eine Extra-Serie nur als schmaler Streifen mit 4 bis 6 Bildern unterhalb von About, `loading="lazy"`, feste Seitenverhältnisse, Sanity-CDN mit `srcset`. Liegt unterhalb des ersten Bildschirms und kostet beim Laden nichts.

## Verifikation

- **v2:** `https://bonpainv2.vercel.app` zeigt Bûcheron weder in Produktkarten noch im Bestellformular noch unter „Nos pains"; Sanity-Abfrage `*[_id=="product-bucheron"]{isActive}` liefert `false`; Vercel-Deployment grün.
- **v1:** nach dem Upload den Haupt-Chunk `assets/index-*.js` von bonpainfaitmain.be laden und prüfen, dass `Pain bûcheron` nicht mehr enthalten ist (Inhalt prüfen, nicht nur HTTP 200, wegen SPA-Fallback). Bestellformular im Browser öffnen, Liste kontrollieren. Keine Testbestellung über den Live-Endpunkt.
- **Bridge:** Anzahl Sidecars mit Rating 5 und 4 per `grep` zählen, gegen die Tabelle abgleichen, Screenshot aus Bridge mit Sternefilter. `diff` gegen die Sicherung zeigt ausschließlich geänderte `xmp:Rating`-Zeilen.

## Abschluss

`memory/MEMORY.md` in v2 aktualisieren (Bûcheron entfernt, Stand Fotoauswahl, offene Punkte Cramique-Preis und Brötchen), committen und pushen.
