# bonpain-v2

Zuerst [memory/MEMORY.md](memory/MEMORY.md) lesen (Stand, Entscheidungen, Offenes), Details in [PROJECT.md](PROJECT.md).

## Schriften

Selbst gehostet in [src/fonts/](src/fonts/) (`@font-face` in `fonts.css`, importiert in `main.tsx`), WOFF2, Subset Latin, SIL OFL 1.1 (`OFL-*.txt` daneben). Nichts wird von Google geladen.

| Font | Alias (Tailwind) | Fallback | Einsatz | Schnitte |
|---|---|---|---|---|
| Cormorant Garamond | `font-display` | Georgia, serif | Überschriften, Hero, Preise, Zitat | 300–700, kursiv 400 |
| DM Sans | `font-body` (Body-Default in `index.css`) | -apple-system, sans-serif | Fließtext, Navigation, Buttons, Formular | 400–700, kursiv 400 |

- Im Markup nur die Aliase verwenden, nie den Fontnamen.
- Neuer Schnitt (z. B. DM Sans 300) → `@font-face` in `fonts.css` anpassen bzw. Datei ergänzen. Sonst nimmt der Browser still den nächstliegenden Schnitt oder verdickt künstlich.
- Zeichen außerhalb von Latin (z. B. `→`, `ā`) fallen auf Georgia bzw. den Systemfont zurück.

<!-- cloud-local-sync -->
## Bilder (Ladezeit ist dem Betreiber wichtig)

Sanity optimiert Bilder erst bei der Auslieferung, und nur, wenn die URL es verlangt (Breite, `auto=format` für AVIF/WebP, Qualität; 1 Jahr Cache). Eine nackte `asset->url` liefert das Original in voller Größe. Deshalb gilt für jedes Bild, heute und bei allen künftigen:

- **Sanity-Bilder** nur über `urlFor(...)` oder `sanitySrcSet(...)` aus [src/lib/sanity.ts](src/lib/sanity.ts), immer mit `srcSet` + `sizes` passend zur tatsächlichen Spaltenbreite, `width`/`height`, `decoding="async"`.
- **Unterhalb des ersten Bildschirms** `loading="lazy"`. Nur das Hero-Bild lädt sofort (`fetchpriority="high"`).
- **Lokale Fotos** liegen in [src/assets/](src/assets/) (Vite hasht sie, `/assets/` ist `immutable`), als WebP in 800 und 1200 px: `cwebp -q 80 -resize 800 0 in.jpg -o name-800.webp`. In `public/` bleiben nur Logo, Icons und das `og:image`.
- **Upload nach Sanity:** JPEG, sRGB, lange Kante ca. 2400 px. Größer bringt nichts, die Seite fordert höchstens 2400 px (Hero) bzw. 1000 px (Produktkarte) an.
- **Service Worker** precacht nur die App-Hülle, keine Fotos ([vite.config.ts](vite.config.ts)).
- Nach Änderungen an Bildern prüfen: welche Datei der Browser bei Handy- und Desktopbreite wirklich lädt (`img.currentSrc`), nicht nur, ob das Bild erscheint.

## Cloud ↔ Local: immer überall up to date

Der Betreiber arbeitet in diesem und anderen Projekten mal lokal, mal als Cloud-Session (Claude Code on the web). Beide Seiten sollen immer denselben Stand haben:

- Am Session-Start `git pull` — auf dem neuesten Stand beginnen.
- Am Ende jeder Arbeitsphase / vor Sessionende alles committen und pushen. Nichts Wichtiges nur uncommitted lokal liegen lassen.
- Cloud-Sessions sehen NUR den Git-Stand: keine uncommitteten Änderungen, NICHT das lokale Auto-Memory unter `~/.claude/`. Was die andere Seite wissen muss, gehört committet in versionierte Dateien (CLAUDE.md, ggf. `memory/`, Docs, Code).
