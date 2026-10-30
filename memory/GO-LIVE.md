# Go-live bonpainfaitmain.be → v2 (Ablaufplan, Stand 2026-10-29)

Für eine lokale Session. Dienste-Einstellungen macht Claude im Browser (Betreiber ist dort eingeloggt), der Betreiber kümmert sich nicht darum. Claude gibt keine Passwörter oder Kartendaten ein; ist ein Login abgelaufen, meldet sich der Betreiber neu an. Jede Änderung an DNS/Diensten kurz ansagen, bevor sie geklickt wird.

## Vorbedingungen
- [x] Vercel-Team `bolteds-projects` auf Pro (aktiv seit 2026-10-29, Billing-Seite; `get_team` zeigt den Plan nicht).
- [x] Rechtstexte, Allergene freigegeben (2026-10-29).
- [x] Preise/Gewichte von Benjamin: eingespielt 2026-10-30, Rest „Prix en magasin“.
- [x] Benjamins Durchsicht der Produktseite (2026-10-30): „vraiment bien“, Korrekturen umgesetzt.
- [ ] Benjamins Testbestellung + Freigabe: Nachricht (deutsch) am 2026-10-30 raus, Antwort abwarten. **Blockiert Schritt 4 ff.**
- [x] Studio-Login + Deploy durch Betreiber (2026-10-30).
- [x] Testbestellungs-Mails: Betreiber hat sie nicht geprüft → in Schritt 8 mit der echten Testbestellung prüfen.
- [x] Weiterleitungen alte v1-URLs (`/impressum.html`, `/datenschutz.html`, `/agb.html`) in `vercel.json` (`fa1b21b`).

## Ablauf
1. **[erledigt 2026-10-29] Vercel prüfen:** Pro aktiv, Prod `e1d737b` READY, Node 24, Budget 25 $ / Pause aus gesetzt. Original: Plan Pro, letztes Production-Deployment READY. Spend Management: Benachrichtigung auf ca. 25 $ (Standard 200 $), keine automatische Pause.
2. **[erledigt 2026-10-30 mit „Nachricht Freigabe + Testbestellung“ in MAILS-benjamin-produkte.md; Umstelltag selbst noch kurz ansagen] Benjamin vorab informieren** (Nachricht entwerfen, Betreiber schickt): Umstellungstag; Bestellungen, die vorher über die alte Seite kamen, stehen nicht in der neuen Tagesliste (er hat sie als Einzelmails); eine Testbestellung „TEST" kommt, bitte ignorieren; kurze Vorstellung der Abo-Funktion (kennt er noch nicht) und der nächtlichen „Liste définitive". Zeitpunkt: möglichst direkt nach Bestellschluss eines Verkaufstags.
3. **[erledigt 2026-10-29, beide `verified: true`, noch `misconfigured` bis DNS] Domain im Vercel-Projekt anlegen** (`prj_9E1lvKIQQWGIzz5MszUSOhdJbWD4`): `bonpainfaitmain.be` und `www.bonpainfaitmain.be` (www → 308 auf Apex). DNS-Sollwerte aus Vercel lesen (`get_domain_config`), nicht die Doku-Beispielwerte nehmen. **Stand 2026-10-29:** Apex A `216.150.1.1` und `216.150.16.1` (rank 1; rank 2 wäre `76.76.21.21`), kein AAAA; www CNAME `d472c357a95bd165.vercel-dns-017.com.` (rank 2 `cname.vercel-dns.com.`). Vor Schritt 4 nochmal lesen.
4. **Infomaniak DNS (Browser, Manager → Domain bonpainfaitmain.be → DNS-Zone):** vorher die ganze Zone als Screenshot/Text in den Scratchpad sichern. Dann:
   - `@` A `185.125.27.25` → Vercel-Wert
   - `@` AAAA `2001:1600:0:aaaa::80:15` löschen (außer Vercel nennt AAAA)
   - `www` A/AAAA löschen, `www` CNAME → Vercel-Wert
   - Alles Mail-Bezogene bleibt (Liste in PROJECT.md „Domain-Umzug"). TTL 300 s.
5. **Warten und prüfen:** `dig +short bonpainfaitmain.be A/AAAA`, `dig www…`, Vercel „Valid Configuration", Zertifikat ausgestellt, `curl -sI https://bonpainfaitmain.be` und `https://www…` (308), Weiterleitungen der drei alten URLs. Mail an info@ geht weiter (MX unverändert).
6. **Env:** `SITE_URL=https://bonpainfaitmain.be` (Production) setzen und neu deployen, damit Abo-Links und Mail-Links sicher auf die Domain zeigen. Danach READY abwarten (MCP `list_deployments`).
7. **Resend (Browser, Team intuitivmedia → Webhooks, `3d90ed39-9e8e-44ed-9c8f-af370b456d2c`):** URL auf `https://bonpainfaitmain.be/api/resend-webhook`, Events unverändert, Secret unverändert.
8. **Testbestellung über https://bonpainfaitmain.be** (erst wenn Schritt 6 READY): Name „TEST", Adresse des Betreibers, nächster gültiger Verkaufstag, 1 Baguette. Prüfen: Bäcker-Mail an Benjamin + Bestätigung kommen an, Links in der Mail zeigen auf die Domain, Runtime-Logs ohne Fehler. Benjamin ist vorgewarnt (Schritt 2); der Eintrag steht in seiner Tagesliste.
9. **Erste Nacht beobachten:** `/api/daily` 23:00 UTC (Pro: pünktlich), Runtime-Logs am Morgen, Benjamin fragen, ob Liste définitive ankam.

## Übergang für bestehende Kunden (geklärt und getestet 2026-10-29)
Kein hartes Neuladen nötig, und vom Server aus auch nicht erzwingbar. Getestet in Brave: v1 live über einen lokalen Proxy geladen, v1-SW aktiv, dann „DNS umgeschaltet“ (Proxy → v2-Preview).
- v1 hat nichts gecacht: der SW `/sw.js` reicht nur durch (kein Cache), das HTML kommt mit `no-store`. v1-Assets sind zwar 1 Jahr gecacht, haben aber gehashte Namen, die v2 nie anfordert.
- Erstes normales Öffnen nach der Umstellung: v2-HTML aus dem Netz, v2 registriert `/sw.js` (selber Pfad) → ersetzt den v1-SW sofort (skipWaiting/clientsClaim), Precache gefüllt, keine Fehler. Manifest-`id` ist in v1 und v2 `/` → installierte Android-Apps übernehmen Name/Icon von selbst; iOS behält das alte Icon (nur Optik).
- **Einziger echter Fall: eine v1-Seite, die schon vor der Umstellung offen war** (Tab im Hintergrund, App im Speicher). Sie zeigt alte Produkte und postet an `/send.php`. Vorher hätte v2 mit 405 geantwortet → v1 zeigt „Erreur … contactez au +32 493 21 09 25“ (Anruf bei Benjamin). Jetzt beantwortet `api/legacy-send.ts` (Rewrite in vercel.json) das mit 200-JSON, v1 zeigt: „Notre site vient d'être mis à jour … Fermez cette page (ou l’application), rouvrez-la et refaites votre commande.“ Die Bestellung wird nicht weitergeleitet. Log: `[legacy-send]` in den Runtime-Logs zeigt, wie oft das noch vorkommt.
- Wer nach der Umstellung noch eine alte DNS-Antwort hat (TTL 300 s, also Minuten), landet auf v1 bei Infomaniak und bestellt wie früher: Mail an Benjamin, nicht in der neuen Liste. Steht in der Umstellungsnachricht an Benjamin.
- Nach Schritt 5 prüfen: `curl -s -X POST -F a=b https://bonpainfaitmain.be/send.php` → JSON mit `success:false` und der Meldung.
- Kundentext (optional, Facebook): MAILS-benjamin-produkte.md → „Hinweis für Kunden“.

## Rückfall
Zone vor der Änderung (Infomaniak, Vue avancée, 2026-10-29): `@` A 185.125.27.25 / AAAA 2001:1600:0:aaaa::80:15 (TTL 300), MX 5 mta-gw.infomaniak.ch, TXT SPF infomaniak, autoconfig/autodiscover CNAME infomaniak.com, `send` MX/TXT amazonses (Resend), `www` A/AAAA wie Apex (TTL 300), `_dmarc` p=reject, `_domainkey` NS nsany1/2 (delegierte Unterzone mit resend-DKIM). Infomaniak führt Zonenversionen („Version actuelle“-Auswahl) → Rücksprung auch dort möglich. Im Editor nur die Zeilen `@`/`www` A/AAAA anfassen.
DNS zurück: `@` A `185.125.27.25`, AAAA `2001:1600:0:aaaa::80:15`, `www` wie in der gesicherten Zone. v1 bleibt bei Infomaniak liegen (Entscheidung 2026-10-29: Backup, nicht aufräumen).

## Danach (optional)
- `src/lib/orderApi.ts` auf relatives `/api/order` vereinfachen.
- Google Search Console: Property prüfen, Sitemap `https://bonpainfaitmain.be/sitemap.xml` einreichen (nur wenn Zugang besteht).
- Benjamins Studio-Zugang prüfen (Members in Sanity-Projekt `5f1udd5l`), damit er Preise/Urlaub selbst pflegen kann.
- Offene Inhalte: Benennung Gaufre, Torsade, Petit pain courge von Benjamin bestätigen; Tarte du jour (übliche Füllungen).

## Bekannt und unkritisch
- v1-Service-Worker ist reines Netzwerk-Passthrough (kein Cache), v2 liefert eigenes `/sw.js` am selben Pfad → ersetzt ihn beim nächsten Besuch.
- Ein noch offener v1-Tab postet an `/send.php`; v2 antwortet dort nicht mit JSON, v1 zeigt dann eine Fehlermeldung (keine still verlorene Bestellung).
