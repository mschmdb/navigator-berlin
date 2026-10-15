---
title: 'L6: Nachbar- und ähnliche Kieze mit Score'
type: 'feature'
created: '2026-10-14'
status: 'done'
route: 'dispatch'
baseline_commit: '10b0af077d2f420ccbe537132497e95c8b6ad536'
review_loop_iteration: 0
context:
  - '{project-root}/docs/process/planning-artifacts/epic-landing-enhance.md'
  - '{project-root}/docs/process/implementation-artifacts/landing-investigation-l2-l6.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Kiez-Seiten zeigen ganz unten drei alphabetisch gewählte Kieze aus demselben Bezirk, ohne Score. Wer einen Kiez vergleicht oder weiterschauen will, findet keinen sinnvollen nächsten Klick.

**Approach:** Zwei kurze Listen ersetzen die Geschwister: „Angrenzende Kieze“ (räumlich benachbart, auch über Bezirksgrenzen) und „Ähnliche Kieze“ (ähnliches Profil der Score-Dimensionen). Jeder Eintrag zeigt Name, Bezirk und Kiez-Score und verlinkt die Kiez-Seite.

**Entscheidungen (Empfehlung, Freigabe Matze 14.10. für den Epic):**
- Nachbarschaft zur Build-Zeit aus den LOR-Polygonen: zwei Kieze sind Nachbarn, wenn sich ihre Grenzen berühren (gemeinsame Stützpunkte nach Rundung oder Schnitt mit kleinem Puffer). Alle Nachbarn, sortiert nach Score absteigend, ohne Score am Ende.
- Ähnlichkeit: euklidischer Abstand der fünf Score-Dimensionen; die 3 ähnlichsten Kieze außer dem eigenen und seinen Nachbarn. Ohne Score-Daten (Build ohne DB) entfällt die Liste.
- Platz: direkt nach den Kennzahl-Kacheln (L4, `key-figure-tiles.svelte`), vor `kiez-details.svelte`.
- Die bisherige Geschwister-Liste entfällt (Testids `kiez-siblings-list`/`kiez-sibling-link` wandern auf die Nachbar-Liste).

## Boundaries & Constraints

**Always:** Slugs über `buildKiezSlugs` (Dubletten). Nachbarschaft als reine, getestete Funktion; Ergebnis im Build berechnen, nicht pro Request. DE/EN. Liste als `<ul>` mit sprechenden Links („Schillerpromenade, Neukölln, Kiez-Score 52“).

**Never:** Keine Wahl-Ähnlichkeit (`/api/wahl/similar-kieze`) verwenden, keine Wertung „besser/schlechter als“. Keine Änderung an Hero, Kacheln, `/explore`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Innenstadt | `reuterstrasse` | Nachbarn inkl. Kieze in Friedrichshain-Kreuzberg, nach Score sortiert | N/A |
| Stadtrand | Kiez an der Landesgrenze | nur Berliner Nachbarn | N/A |
| Ohne DB | keine Scores | Nachbarn nach Name, keine Ähnlichkeits-Liste | N/A |
| Dublette | `heerstrasse-spandau` | eigene Nachbarn, nicht die von Heerstraße (Charlottenburg-Wilmersdorf) | N/A |
| Ähnlichkeit | Nachbar wäre ähnlichster | erscheint nur in „Angrenzend“, nicht doppelt | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/kiez/[slug]/+page.server.ts` `tryLoadBezirkContext` (L2, liefert `outline` und `siblings` über `buildKiezContext` in `src/lib/data/bezirk-kieze-view.ts`) -- `siblings` durch Nachbarn/Ähnliche ersetzen; LOR-Lesemuster wiederverwenden.
- `src/lib/data/get-kieze-in-bezirk.ts` (`buildKiezeWithGeometry`, L5) und `src/lib/data/internal/kiez-slug.ts` (`buildKiezSlugs`).
- `@turf/intersect`, `@turf/bbox` installiert; `@turf/boolean-touches` nicht. Gemeinsame Stützpunkte (Koordinaten auf 6 Nachkommastellen gerundet) zuerst prüfen; Test über echte LOR-Daten (Paritätstest wie `get-kieze-in-bezirk.parity.test.ts`).
- Scores: `kiez_score` (DB) wie Kiez-Seite (`tryLoadKiezScore`), alle Kieze auf einmal laden.
- `src/lib/components/atlas/kiez-siblings-list.svelte` (37) -- zu `kiez-neighbors.svelte` ausbauen oder ersetzen.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/data/kiez-neighbors.test.ts`, `kiez-neighbors.ts` -- Red/Green: Nachbarschaft (Fixture + echte Daten), Symmetrie, Dublette, Ähnlichkeit, Ausschluss der Nachbarn.
- [x] Kiez-Server-Load -- Nachbarn + Ähnliche; Cache auf Modulebene, damit 143 Prerenders nicht 143-mal rechnen.
- [x] Komponente + Test -- zwei Listen, Score, sprechende Links, DE/EN, ohne DB.
- [x] Kiez-Seite einbinden, alte Geschwister entfernen.
- [x] `messages/de.json`, `messages/en.json`.
- [x] E2E: `/kiez/reuterstrasse` zeigt mindestens 3 Nachbarn mit Links.

**Acceptance Criteria:**
- Given `/kiez/reuterstrasse`, when man zu „Angrenzende Kieze“ kommt, then stehen dort alle angrenzenden Kieze mit Score, auch aus dem Nachbarbezirk.

## Implementation Notes

- Nachbarschaft über gemeinsame Grenzlänge (Segment-auf-Grenze, Toleranz 1e-6°, Schwelle 1 m; 10 m hätte 3 echte kurze Kanten verloren). 384 Nachbarpaare, identisch mit dem Stützpunkt-Ansatz, robust gegen T-Stöße und Eckkontakte. `reuterstrasse`: alt-treptow, neukoellner-mitte-zentrum, rixdorf, schillerpromenade, suedliche-luisenstadt, tempelhofer-vorstadt.
- Ähnlichkeit: euklidischer Abstand über die fünf Composite-Dimensionen, 3 nächste ohne Nachbarn; lokal haben alle 143 Kieze vollständige Dimensionen (Prod ungeprüft).
- `src/lib/server/kiez-neighbors-index.ts`: Index einmal pro Prozess, Fehler werden nicht gecacht; Test mit gemockter DB.
- Entfernt: `kiez-siblings-list.svelte`, `pickSiblings`, `kiez_siblings_heading`. Testids `kiez-siblings-list`/`kiez-sibling-link` hängen jetzt an der Nachbarliste.
- Verifikation: Unit 3.170 grün, `pnpm check` 0, Build mit DB, E2E 76/76.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, Edge, VerifGap | Fehlgeschlagener Index/Score-Load bleibt für den ganzen Build gecacht | medium | patch |
| VerifGap, Blind | `kiez-neighbors-index.ts` ohne Test (Mapping, Fehlerpfad, Cache) | medium | patch |
| Blind, Edge | Nachbarschaft nur über ≥ 2 gleiche Stützpunkte: T-Stöße fehlen, Eckkontakte falsch positiv; AC „alle angrenzenden“ | medium | patch (Kantenlänge, Vollständigkeitstest) |
| Blind, Edge | Leerer Wrapper mit `py-8` | low | patch |
| Blind | Score-Label ohne „von 100“ | low | patch |
| Blind | Alte Testids ohne Erklärung | low | patch (Kommentar) |
| Blind, VerifGap | E2E ohne Score, Nachbarbezirk, „Ähnliche Kieze“ | medium | patch |
| Blind | Ähnlichkeitsliste fehlt bei einer null-Dimension | maybe-false | Anzahl betroffener Kieze wird gezählt |
| Blind, Edge | Bezirksname leer bei unbekanntem BEZ-Code, Features ohne BEZ | low | reject: alle 143 Features haben gültigen BEZ (Index-Test über echte Daten) |
| Edge | Doppelte Slugs überschreiben sich | low | reject: `buildKiezSlugs` disambiguiert, Daten ohne Kollision |
| Edge | NaN-Composite | low | reject: Composite in der DB numerisch |
| Edge | Nachbarliste ungedeckelt | low | reject: Spec verlangt alle Nachbarn |
| Blind | LOR-Laden dreifach, `buildKiezContext` berechnet ungenutzte Liste | low | reject: nur Prerender-Kosten |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/data src/lib/components/atlas` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat, Preview 4173, Playwright mit temporärer Config -- expected: grün
