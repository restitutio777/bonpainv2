# Scratchpad (laufende Aufgabe)

## Abo-Funktion (2026-10-12)
Auftrag Betreiber: komplett umsetzen, wasserdicht, deployen. Urlaub setzt Abos automatisch aus, Abonnenten per Mail informieren, keine Zusatzkosten.

Plan:
- Gemeinsamer Servercode in `server/` (Vercel: Hilfsdateien außerhalb `api/`), Imports mit `.js`.
- Redis: `sub:{id}` (JSON), `subs:active` (Set), `final:{date}` (Marker Endliste), `vacnotice:{key}` (Set benachrichtigter Abos). Alles mit KEY_PREFIX.
- Links: HMAC(SUBSCRIPTION_SECRET, c:/b:+id) → nichts Geheimes in Redis. Env-Var neu (prod+preview+dev).
- Erstbestellung = normale Bestellung (mit `subscriptionId`), Abo startet eine Woche später.
- Endliste per Cron `/api/daily` 23:00 UTC (= nach Mitternacht Brüssel) für Tage [heute+1 .. heute+lead-1], nur Verkaufstage, Marker gegen Doppelversand; Keepalive 05:00 UTC holt Verpasstes nach.
- Urlaub: Banner aktiv → Termine im Zeitraum fallen aus; Mail an betroffene Abonnenten einmal pro Urlaub (max. 30 pro Lauf).
- Verwaltung `/abonnement#id.token` (Kunde) bzw. `#b.id.token` (Benjamin), Aktionen nur per POST (Mail-Scanner klicken Links).
- Rechtstexte: CGV Art. 8 neu, Datenschutz ergänzt. Studio: Hinweis im Urlaubsbanner.

Stand:
- Server fertig: server/{common,catalog,subscriptions,day,mails,checks,daily}.ts, api/{order,subscription,daily}.ts, keepalive holt nach, Webhook kennt kind=subscription, Cron 23:00 UTC in vercel.json.
- Lokaler Harness (Scratchpad, Mock-Upstash inkl. /pipeline, Mock-Resend, Sanity-Stub, Fake-Uhr): 30/30 grün.
- Offen: Frontend (Formular, /abonnement), CGV Art. 8, Datenschutz, Studio-Hinweis, Env SUBSCRIPTION_SECRET, Preview-Test, Deploy.
