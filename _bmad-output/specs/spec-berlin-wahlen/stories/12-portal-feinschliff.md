---
title: 'Portal-Feinschliff: Karten-Sitz, Sankey-Kapitel, Erklär-Subtexte'
type: 'feature'
created: '2026-09-20'
status: 'draft'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/specs/spec-berlin-wahlen/ux-blueprint.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem (Matze 20.09. 15:41):** Drei Bedien-Lücken im Portal. (1) In den Kapiteln Wechsel und Trends sitzt die Karte nicht ordentlich im Canvas und lässt sich zu weit verschieben: Berlin kann fast aus dem Sichtfenster gepannt werden. (2) Der Sankey „Wahljahre im Übergang" fehlt im Kapitel-Menü, er versteckt sich als Unterabschnitt im Trends-Kapitel. (3) Die Kapitel starten ohne Erklärung: Überschrift, dann direkt Grafik; ein kurzer Erklär-Subtext fehlt überall.

**Approach:** (1) Wechsel- und Trends-Karte nach dem initialen `fitBounds` auf die Layer-Bbox festzurren: `maxBounds` = gepufferte Fit-Bbox, `minZoom` = Fit-Zoom, damit die Stadt nie den Canvas verlässt und der Erst-Eindruck sauber gerahmt ist. (2) Der Sankey wird ein eigenes Kapitel „Übergänge" (eigene `KapitelSection` + Nav-Eintrag zwischen Trends und Extreme, eigenes Kontext-Badge wie das Trends-Badge ohne Ebenen-Angabe). (3) Jedes Kapitel bekommt 1-2 Sätze neutralen Erklär-Subtext direkt unter der Überschrift.

## Boundaries & Constraints

**Always:**
- Karten-Sitz: Änderung NUR in `internal/wechsel-kapitel-maplibre.svelte.ts` und `internal/trends-kapitel-maplibre.svelte.ts`. Nach dem bestehenden `fitBounds(fitTo, ...)`: `maxBounds` auf die Fit-Bbox plus kleinem Puffer (~10-15% je Achse) setzen und `minZoom` auf den nach dem Fit erreichten Zoom (`getZoom()`), damit weder Weg-Pannen noch Heraus-Zoomen die Stadt aus dem Canvas schiebt. Gemeinsame pure Helper-Funktion (z. B. `internal/map-fit-constraints.ts`: `paddedMaxBounds(bbox)`) statt Copy-Paste in beide Controller; unit-testbar (reine Bbox-Arithmetik). Das Interface `MapLibreMapLike` beider Controller darf um `setMaxBounds`/`setMinZoom`/`getZoom` wachsen; die Fake-Map-Test-Utility zieht mit.
- `winner-map-maplibre.svelte.ts` bleibt UNANGETASTET (Adress-Suche/flyTo brauchen den größeren Spielraum; Matze hat nur Wechsel/Trends genannt).
- Sankey-Kapitel: neues Kapitel `{ id: 'uebergaenge', label: 'Übergänge' }` zwischen Trends und Extreme in `+page.svelte` (NAV_CHAPTERS + `KapitelSection` mit Titel „Wahljahre im Übergang", Testid `wahl-portal-chapter-uebergaenge`); `<SankeyWahljahre/>` zieht aus `trends-kapitel.svelte` (Einbettungs-Block Z. ~376 entfernen, Import raus) in die neue Section; `showCoverageHinweis` entfällt als Sonderfall (Sankey rendert eigenständig, Default `true` greift; prüfe, ob das Trends-Kapitel seine eigene Coverage-Fußnote behält, keine Doppel-Anzeige innerhalb EINES Kapitels). Kontext-Badge fürs neue Kapitel wie das Trends-Badge (Reihe · „alle Wahljahre", OHNE Ebenen-Angabe, der Sankey hat den eigenen Toggle).
- Die `sankey-wahljahre-context-probe` und alle `sankey-*`-Testids bleiben unverändert; E2E-/a11y-Stellen, die den Sankey über `wahl-portal-chapter-trends` scopen (Hover-Smoke, Axe-Scan, Trends-Fixture-Test), ziehen auf das neue Kapitel-Testid um. `trends-kapitel.svelte.test.ts`-Assertions auf Sankey-Testids entfallen dort bzw. wandern in einen Section-Test.
- Erklär-Subtexte: `kapitel-section.svelte` bekommt ein optionales `subtext`-Prop (string; rendert als `<p>` zwischen Überschrift und Inhalt, Testid `${testid}-subtext`, ruhige Typo analog Kontext-Badge/Prosa-Stil). Jedes Kapitel inkl. Karte, Wechsel, Trends, Übergänge, Extreme und Methodik bekommt 1-2 Sätze; auch der Überblick-Header darf einen bekommen, wenn er nicht redundant zur bestehenden `pageDescription` ist. Inhalte: was zeigt das Kapitel, wie liest man es; neutral, `lint:wahl`-konform (keine „Hochburg"/„Wählerwanderung"), keine Absolutismen, kein Prozess-Sprech, keine em-dashes.
- Planungs-Hygiene (Teil dieser Story, kein Code): `stories.yaml` Story 10 („Dein Kiez, Zwilling und Wahl-x-Layer") als gestrichen markieren (`status`-/Kommentar-Konvention der Datei folgen, nicht löschen); Kontraste bleibt nur in `deferred-work.md`.

**Never:**
- Kein Umbau der Karten-Interaktion selbst (Hover, Klick, Animation), keine Controller-Konsolidierung (bleibt deferred), kein Anfassen von `winner-map`-Dateien.
- Keine neuen Datenpfade/APIs; Subtexte sind statische Strings in `+page.svelte`.
- URL-Kontrakt, Reihen-Leiste, Karten-Steuerung, Badges (Story 10) unverändert; Sankey-Verhalten (Story 11) unverändert, nur der Einbau-Ort wechselt.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Karten-Rahmen | Wechsel-/Trends-Karte initial geladen | Berlin füllt den Canvas (Fit-Bbox + Padding), kein Verschnitt | N/A |
| Pan-Grenze | Nutzer pannt/zoomt in Wechsel/Trends | Stadt bleibt im Sichtfenster (maxBounds = gepufferte Fit-Bbox, minZoom = Fit-Zoom) | N/A |
| Ebenen-/Reihen-Wechsel | Layer-Bbox ändert sich (falls neuer fitBounds-Lauf) | Grenzen ziehen mit dem neuen Fit nach | N/A |
| Nav-Eintrag | Klick auf „Übergänge" im Kapitel-Menü | Scrollt zum Sankey-Kapitel, Scroll-Spy markiert es | N/A |
| Deep-Link | `#uebergaenge`-Anker | Landet unter dem Sticky-Stapel korrekt (scroll-mt der Section greift) | N/A |
| Subtexte | Jedes Kapitel | 1-2 Sätze unter der Überschrift, vor dem Inhalt; auch in Lade-/Leer-Zuständen sichtbar | N/A |
| Bestands-E2E | Trends-Kapitel ohne Sankey | Trends-Tests (Karte/Volatilität) grün; Sankey-Tests laufen im neuen Kapitel | N/A |

</frozen-after-approval>

## Code Map

- `internal/wechsel-kapitel-maplibre.svelte.ts` (Z. 95-97 Init, Z. 130 fitBounds) + `internal/trends-kapitel-maplibre.svelte.ts` (Z. 142-144, Z. 180) -- nach `fitBounds`: `setMaxBounds(paddedMaxBounds(fitTo))` + `setMinZoom(getZoom())`; `MapLibreMapLike` + `fake-maplibre-test-util.ts` erweitern.
- NEU `internal/map-fit-constraints.ts` + Test -- reine Bbox-Puffer-Arithmetik.
- `src/routes/(with-header)/berlin-wahlen/+page.svelte` -- NAV_CHAPTERS (Z. ~155-190), neue Section `uebergaenge` mit Badge, Subtext-Strings aller Kapitel.
- `src/lib/components/wahl-portal/kapitel-section.svelte` (32 Z.) + Test -- optionales `subtext`-Prop.
- `src/lib/components/wahl-portal/trends-kapitel.svelte` (Z. 48 Import, Z. ~376 Einbettung) + `trends-kapitel.svelte.test.ts` -- Sankey-Auszug.
- `tests/e2e/berlin-wahlen.e2e.ts` (Sankey-Hover-Smoke, Trends-Fixture-Test) + `tests/e2e/a11y.e2e.ts` (Sankey-Axe-Scan) -- Kapitel-Scope umziehen; neuer kurzer Test: Nav-Eintrag „Übergänge" scrollt zum Kapitel.
- `docs/wahldaten-methodik.md` -- nur falls Kapitel-Struktur dort erwähnt ist (prüfen, sonst unberührt).
- `_bmad-output/specs/spec-berlin-wahlen/stories.yaml` -- Story 10 als gestrichen markieren.

## Tasks & Acceptance

**Execution (TDD: pro Task erst failing Test, dann Implementation):**
- [ ] `internal/map-fit-constraints.ts` + Test -- Puffer-Arithmetik; Controller-Tests: nach Fit werden `setMaxBounds`/`setMinZoom` mit den erwarteten Werten gerufen (Fake-Map).
- [ ] Wechsel-/Trends-Controller -- Constraints nach `fitBounds` setzen.
- [ ] `kapitel-section.svelte` + Test -- `subtext`-Prop.
- [ ] `+page.svelte` -- neues Kapitel „Übergänge" (Nav + Section + Badge + Sankey-Einbau), Subtexte aller Kapitel; `trends-kapitel.svelte` verliert die Einbettung.
- [ ] Tests/E2E -- Kapitel-Scopes umziehen, neuer Nav-Test „Übergänge", `lint:wahl` für die Subtexte.
- [ ] `stories.yaml` -- Story 10 gestrichen markieren.

**Acceptance Criteria:**
- Given die Wechsel- oder Trends-Karte, when der Nutzer maximal pannt oder herauszoomt, then bleibt Berlin vollständig oder nahezu vollständig im Canvas; der initiale Rahmen zeigt die Stadt ohne Verschnitt.
- Given das Kapitel-Menü, then existiert der Eintrag „Übergänge", Klick und `#uebergaenge`-Anker landen auf dem Sankey-Kapitel unter dem Sticky-Stapel; das Trends-Kapitel enthält keinen Sankey mehr.
- Given ein beliebiges Kapitel, then steht unter der Überschrift ein 1-2-sätziger, `lint:wahl`-konformer Erklär-Subtext.
- Given die Bestands-Suiten, then bleiben Unit, check, lint:wahl und das E2E-Trio grün (bis auf die 2 bekannten vorbestehenden a11y-Fails).

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

Die Karten-Constraints koppeln bewusst an die Fit-Bbox statt an eine feste Berlin-Box: dieselbe generische `BERLIN_MAX_BOUNDS`-Box erlaubt heute ~40% Leerlauf um die Stadt, was sich in den kleinen Kapitel-Canvases als „Karte verrutscht" anfühlt. Die Winner-Map behält den größeren Spielraum wegen Adress-Suche/flyTo. „Übergänge" als eigenes Kapitel entlastet zugleich das überladene Trends-Kapitel (Karte + Volatilität + Sankey).

## Verification

**Commands:**
- `pnpm vitest run --project server` / `--project client` -- expected: grün
- `pnpm check` -- expected: 0 Errors
- `pnpm lint:wahl` + `pnpm exec eslint <geänderte Dateien>` -- expected: 0 Verstöße (bekanntes `no-unused-svelte-ignore`-Detail ausgenommen)
- E2E: `pnpm exec vite build`, Ports räumen, `pnpm preview --port 4173`, temp Playwright-Config, `playwright test tests/e2e/berlin-wahlen.e2e.ts tests/e2e/berlin-wahlen-partei.e2e.ts tests/e2e/a11y.e2e.ts` -- expected: grün bis auf die 2 bekannten vorbestehenden Fails
