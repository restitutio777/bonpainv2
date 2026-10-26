# Allergen-PDF (`public/allergenes.pdf`)

Markengerechte, brillenfrei lesbare Allergenliste der Bäckerei Bon Pain Fait Main,
zum Ausdrucken (Bäckerei, Partnerläden) und als dezenter Download im Footer der
Website (Spalte „Légal").

## Neu erzeugen

```bash
bash scripts/allergenes/render.sh
```

Das baut aus `build-pdf.mjs` die eigenständige HTML-Datei `allergenes.html`
(Fonts und Logo als data-URI eingebettet) und druckt sie mit Chrome headless als
A4 ohne Ränder nach `public/allergenes.pdf`.

- Google Chrome muss installiert sein.
- `allergenes.html` ist ein Build-Artefakt (nicht im Git).
- `public/allergenes.pdf` ist das versionierte Ergebnis.

## Inhalt pflegen

Die Produktdaten (Name, Gruppe, Allergene) stehen fest in `build-pdf.mjs` unter
`GROUPS`. Die Allergen-Strings sind **wortgleich** zum Feld `allergens` je Produkt
in Sanity (Projekt `5f1udd5l`, Dataset `production`) und damit identisch zur
Anzeige auf der Website. Quelle und Herleitung:
`studio/scripts/apply-allergenes-2026-10.mjs` und `matrice_allergenes_boulangerie.pdf`.

Ändern sich Werte, **beide** Stellen nachziehen (Sanity-Feld und `GROUPS` hier),
sonst driften Website und PDF auseinander. `DATE_LABEL` im Skript ist der sichtbare
Versionsstand.

## Rechtlicher Rahmen

Arbeitsstand, noch nicht final von Benjamin freigegeben — das Dokument weist sich
selbst als „en cours de validation" aus, ohne Zertifizierungsaussage. Nur die 14
deklarationspflichtigen EU-Allergene (VO (EU) 1169/2011); Samen, Kurkuma und Honig
sind keine Allergene und stehen nicht drin.
