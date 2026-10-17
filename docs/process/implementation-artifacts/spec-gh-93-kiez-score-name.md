# GH-93: Score heißt überall Kiez-Score

Status: in-review. Spec-Checkpoint übersprungen, Issue #93 (und #101) gelten als abgenommene Spec (Matze, 17.10.2026).

## Ziel

Ein Name für den Score: „Kiez-Score“ (EN „Kiez score“). Die Ranking-Seite zieht von `/umwelt-infrastruktur-score` nach `/kiez-score`, die alte URL leitet per 301 um (DE und `/en`).

## Akzeptanzkriterien

1. Keine Nennung von „Umwelt- & Infrastruktur-Score“, „Environment & infrastructure score“, „Bezirks-Score“ oder „Kiez-Score: Gesamt“ in `messages/` und `src/` (Guard-Test `src/lib/seo/score-name.test.ts`).
2. Route `/kiez-score` existiert, `/umwelt-infrastruktur-score` und `/en/umwelt-infrastruktur-score` leiten per 301 um, `/wo-lebt-es-sich-gut` direkt ohne Kette.
3. Interne Links, Footer, Drawer, Sitemap, llms-Ausgaben, JSON-LD, OG-Bild und Methodik-H1 nutzen den neuen Namen und Pfad.
4. OG-Bilder und llms-Ausgaben zeigen Bundle-Namen ohne Buchstaben-Präfix („Umwelt“ statt „C: Umwelt“).
5. #101: `methodik_editorial_p3` beschreibt den Ist-Zustand (Ranking für Kieze und Bezirke als Vergleich).

## Nicht im Umfang

Layout, weitere Textkürzungen, DB-Spaltennamen (`bezirk_score` bleibt technischer Bezeichner).
