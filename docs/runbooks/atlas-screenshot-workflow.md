# Runbook: Atlas-Screenshot für die Landing aufnehmen (Story 2.12)

Hand-Capture-Pipeline. Story 2.6 deckt die OG-Card-Generation per Satori
ab; für Landing-Screenshots brauchen wir Vollbild-Karten-Aufnahmen die
Satori nicht liefert.

## Schritt-für-Schritt

1. Dev-Server starten: `pnpm dev`.
2. Browser auf `/explore` mit gewünschtem Setup öffnen:
   - Adresse vor-laden via `?address=lng,lat&q=…` damit Inspector da ist
   - Layer aktivieren via `?layers=slug-a,slug-b` falls Schichten gezeigt
     werden sollen
3. Viewport auf 1440×900 oder größer setzen (Browser-DevTools Device-
   Toolbar). Höher als 900 px Vertikal vermeidet Hero-Crop.
4. DPR (Device-Pixel-Ratio) auf 2 stellen für scharfe Schrift.
5. Capture mit Browser-eigenem Screenshot-Tool (Firefox Dev-Edition hat
   `Take Screenshot` via Toolbar; Chrome via DevTools → Cmd+Shift+P →
   „Capture full size screenshot").
6. Datei landet typischerweise als PNG.
7. Konvertieren:

   ```bash
   cwebp -q 82 in.png -o out.webp
   ```

   Qualität 82 ist guter Trade-off: Karten-Vektor-Linien bleiben scharf,
   Datei ~80% kleiner als PNG-Original.
8. `out.webp` nach `static/` legen (Filename z.B.
   `berlin-navigator-{thema}.webp`).
9. `src/lib/content/screenshot-manifest.ts` aktualisieren:
   ```ts
   heroHook: {
     key: 'heroHook',
     path: '/berlin-navigator-laermbelastung2.webp',
     alt: '... beschreibender Alt-Text ...',
     width: 1200,
     height: 630
   }
   ```
10. `pnpm test:unit -- src/lib/content/home-content.test.ts` muss grün
    laufen (File-Existenz-Test).

## Performance-Budget

- Hero-Above-Fold-Asset eager-loaded → Ziel < 500 KB. 1 MB+ ist Warnung.
- Below-Fold-Assets lazy-loaded (`loading="lazy"`) → bis 1 MB OK.
- Niemals raw-PNG/JPG ausliefern wenn webp-Variante existiert; alte
  Originals aus `static/` löschen (Repo-Größe).

## Original-Files

Aufnahme-Originale (PNG/JPG) NICHT ins Repo committen. Sie liegen lokal,
das `.webp` ist die Quelle-of-Truth. `.gitignore` filtert
`static/*.png.original` falls man Originale lokal ablegen will.
