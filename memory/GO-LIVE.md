# Go-live bonpainfaitmain.be → v2 (Ablaufplan, Stand 2026-10-29)

Für eine lokale Session. Dienste-Einstellungen macht Claude im Browser (Betreiber ist dort eingeloggt), der Betreiber kümmert sich nicht darum. Claude gibt keine Passwörter oder Kartendaten ein; ist ein Login abgelaufen, meldet sich der Betreiber neu an. Jede Änderung an DNS/Diensten kurz ansagen, bevor sie geklickt wird.

## Vorbedingungen
- [x] Vercel-Team `bolteds-projects` auf Pro (aktiv seit 2026-10-29, Billing-Seite; `get_team` zeigt den Plan nicht).
- [x] Rechtstexte, Allergene freigegeben (2026-10-29).
- [ ] Preise/Gewichte von Benjamin (Nachricht am 2026-10-29 entworfen). **Betreiber 2026-10-29: abwarten, nicht mit 6 € live.** Stand Sanity 29.10.: unverändert seit 27.10. **Blockiert Schritt 4 ff.**
- [x] Testbestellungs-Mails: Betreiber hat sie nicht geprüft → in Schritt 8 mit der echten Testbestellung prüfen.
- [x] Weiterleitungen alte v1-URLs (`/impressum.html`, `/datenschutz.html`, `/agb.html`) in `vercel.json` (`fa1b21b`).

## Ablauf
1. **[erledigt 2026-10-29] Vercel prüfen:** Pro aktiv, Prod `e1d737b` READY, Node 24, Budget 25 $ / Pause aus gesetzt. Original: Plan Pro, letztes Production-Deployment READY. Spend Management: Benachrichtigung auf ca. 25 $ (Standard 200 $), keine automatische Pause.
2. **[Entwurf fertig: MAILS-benjamin-produkte.md → „Nachricht Umstellung“, `[jour]` einsetzen] Benjamin vorab informieren** (Nachricht entwerfen, Betreiber schickt): Umstellungstag; Bestellungen, die vorher über die alte Seite kamen, stehen nicht in der neuen Tagesliste (er hat sie als Einzelmails); eine Testbestellung „TEST" kommt, bitte ignorieren; kurze Vorstellung der Abo-Funktion (kennt er noch nicht) und der nächtlichen „Liste définitive". Zeitpunkt: möglichst direkt nach Bestellschluss eines Verkaufstags.
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
