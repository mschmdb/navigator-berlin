---
title: 'Bestandsmiete: Flächenfarben als harte Klassen'
type: 'feature'
created: '2026-10-14'
status: 'done'
baseline_commit: '71fa1934778fffb0b95728f1fbd000826adb4192'
route: 'dispatch'
review_loop_iteration: 1
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Flächenfarben des Layers `zensus-bestandsmiete-2022` unterscheiden sich kaum (Matze, Browser-Sicht 14.10.2026). Der lineare Verlauf über fünf eng beieinanderliegende Strukturell-Töne (`#797D88` bis `#2A3F7C`) bei 0,55 Deckkraft erzeugt Mischtöne, die Legende zeigt nur einen Verlaufsbalken ohne Werte.

**Approach:** Wie die am besten lesbaren Layer im Atlas (MSS „Soziale Lage“, Kiez-Score): fünf harte Klassen auf den Quintil-Grenzen `MIETE_STOPS`, Legende mit fünf Farbfeldern und €-Grenzen statt Verlaufsbalken, Deckkraft 0,7 (wie die höchste MSS-Stufe). Farbfamilie bleibt Strukturell-Indigo (ADR-015, ADR-019), neue Töne nur über `buildScaleFamily` mit der 3:1-Kontrastregel.

**Entscheidung Matze 14.10. (Palette C):** Eigene Indigo-Variante für diesen Layer, `buildScaleFamily('#DDE1ED', '#1A2A5E', '#ECEAE0')` → `#797d88 #60687e #475374 #303f69 #1a2a5e`. Mehr Spreizung als die globale Strukturell-Skala (bis `#2A3F7C`), weniger dunkel als die Variante bis `#121E4A`.

**Entscheidung Matze 14.10. (Kombinierbarkeit):** Layer lassen sich kombinieren; die neuen Flächenfarben müssen in Kombination funktionieren. Liegt Bestandsmiete als Fläche unten, bleiben Größen-Symbole anderer Layer (v. a. Indigo-Symbole in `scaleStrukturell5` von Bodenrichtwerte, Einwohnerdichte) und Overlays (Milieuschutz-Kontur, Kaltluft) auf allen fünf Klassen klar erkennbar. Fällt ein Symbol auf der dunkelsten Klasse unter 3:1 Kontrast, bekommt es einen hellen Rand; Farbe und Größe der Symbole ändern sich nicht.

**Entscheidung Matze 14.10. (Symbolrand):** Der Sprite-Rand aller Größen-Symbole wird von `#ECEAE0` auf `#FFFFFF` umgestellt. Grund: Dunkle Symbole (Grün, Lila, Braun, Rosé, Rot) erreichen auf Miete-Klasse 2 mit cremefarbenem Rand nur ~2,7:1; mit weißem Rand gilt max(Füllung, Rand) ≥ 3:1 auf allen fünf Klassen (Rand weiß: 2,69 / 3,24 / 3,93 / 4,78 / 5,88).

## Boundaries & Constraints

**Always:** `step`-Ausdruck mit den Grenzen `MIETE_STOPS[1..4]`; Planungsräume mit `miete: null` bleiben transparent. Legende `kind: 'categorical'` mit fünf Einträgen „5,1-6,9 €/m²“ usw. bzw. bestehenden `mieteStopLabel`-Texten, DE und EN. Hellste Stufe erfüllt 3:1 gegen `#ECEAE0` (`check-scale-contrast.ts`). Vorher-Nachher-Screenshots (gleicher Ausschnitt) in den Implementation Notes.

**Never:** Keine Änderung an `bodenrichtwerte`, `einwohner-dichte-2024` oder anderen Strukturell-Layern, keine Änderung der globalen `scaleStrukturell*`-Tokens. Keine Änderung von Farbe oder Größe der Symbole (`choropleth-dots.ts`) und von `MIETE_STOPS`; erlaubt ist nur der weiße Sprite-Rand nach der Symbolrand-Entscheidung. Kein Farbwechsel weg von Indigo.

</frozen-after-approval>

## Code Map

- `src/lib/components/atlas/internal/layer-style-builder.ts:847-875` -- Paint `choropleth-miete`: `interpolate` → `step`, Deckkraft 0,55 → 0,7. Vorbild `step`: Kiez-Score-Profile im selben Switch.
- `layer-style-builder.ts:219-230` (`LEGEND_BY_PROFILE['choropleth-miete']`) -- `kind: 'gradient'` → `'categorical'`, Farben wie Paint; `:542-546` Label-Mapping (`mieteStopLabel`) bleibt.
- `src/lib/components/atlas/internal/colors.ts` -- neue Tokens `scaleMiete1..5` (Werte aus der Entscheidung) neben den Strukturell-Tokens; prüfen, ob `choropleth-family.ts` `SCALE_TOKEN_VALUES` und `app.css:201-217` die Tokens spiegeln müssen (Legende rendert Inline-Farben).
- `scripts/lib/check-scale-contrast.ts` `buildScaleFamily` -- Herkunft der Töne; Golden-Test, der `buildScaleFamily('#DDE1ED', '#1A2A5E', BACKGROUND_TOKEN)` gegen `scaleMiete1..5` prüft (Muster `scripts/generate-dimension-ramps.test.ts`).
- `src/lib/components/atlas/internal/choropleth-dots.ts` -- Symbole anderer Layer nutzen `imageColor` (`scaleStrukturell5` `#2A3F7C` bei Bodenrichtwerte/Einwohnerdichte/Miete); Sprite-Rendering in `pin-sprite-renderer.ts`. Kontrast `#2A3F7C` gegen `#1a2a5e` (bei 0,7 Deckkraft über `#ECEAE0` gemischt) rechnen; nur bei < 3:1 heller Rand im Sprite.
- `layer-style-cascade.ts` / `layer-visibility.ts` `capPolygonSlugs` -- Zwei-Karten-Regel; Overlays Milieuschutz/Kaltluft außerhalb des Limits.
- Tests: `layer-style-builder.test.ts:341-351` pinnt `interpolate` + Stops → auf `step` umschreiben (Grenzen = `MIETE_STOPS[1..4]`, Klassen-Farben); `:494-500` Legenden-Labels bleiben; `dimension-ramps.test.ts:82-86` (Strukturell-Tokens) darf sich nicht ändern.

## Tasks & Acceptance

**Execution:**
- [x] `layer-style-builder.test.ts` -- Test: `step` mit Grenzen `MIETE_STOPS[1..4]`, 5 Farben, null → Deckkraft 0, sonst 0,7; Legende categorical mit 5 Farben = Paint-Farben -- Red.
- [x] `colors.ts`, `layer-style-builder.ts`, Golden-Test -- Umsetzung mit Palette C.
- [x] Screenshots vorher/nachher, gleicher Ausschnitt, in Implementation Notes.

**Acceptance Criteria:**
- Given der Layer allein aktiv, when die Karte rendert, then haben Planungsräume genau fünf Flächenfarben ohne Zwischentöne, und die Legende zeigt fünf Farbfelder mit €-Grenzen.
- Given Bestandsmiete als zweite Rolle, when zwei Layer aktiv sind, then bleiben die Größen-Symbole unverändert.
- Given Bodenrichtwerte oder Einwohnerdichte, when sie aktiv sind, then sehen sie aus wie vorher.
- Given Bestandsmiete als Fläche und Bodenrichtwerte bzw. Einwohnerdichte als Symbole, when beide aktiv sind, then sind die Symbole auf allen fünf Klassen erkennbar (Screenshot + Kontrastrechnung Symbolfarbe gegen dunkelste Klasse).
- Given Bestandsmiete plus Overlay Milieuschutz oder Kaltluft, when beide aktiv sind, then bleibt das Overlay sichtbar (Screenshot).

## Implementation Notes

- Tokens `scaleMiete1..5` in `colors.ts`; Paint `step` auf `MIETE_STOPS[1..4]`, Deckkraft 0,7; Legende `categorical`. Golden- und Kontrasttest in `scripts/miete-scale.test.ts`.
- Kontrast Symbolfüllung `#2A3F7C` gegen Fläche (0,7 über `#ECEAE0`): 3,7 / 3,1 / 2,5 / 2,1 / 1,7. Klassen 3 bis 5 liegen unter 3:1. `buildScoreDotSvg` zeichnet bereits einen hellen Rand `#ECEAE0` (4,5:1 und mehr gegen die dunklen Klassen), daher keine Code-Änderung an Symbolen.
- Screenshots nach der Änderung: `/tmp/shots/miete-after.png`, `miete-brw-after.png`, `miete-kaltluft-after.png`. Vorher-Screenshots fehlen (Dev-Server lief schon mit neuem Code).

- Screenshots (Orchestrator, 14.10., gleicher Ausschnitt 740×700, localhost:5180) in `screenshots/zensus-miete-farben/`: `before-miete.png` (vorher, Verlauf), `after-miete.png` (fünf Klassen), `after-miete-dichte.png` und `after-brw-miete.png` (Symbole auf allen Klassen mit hellem Rand erkennbar), `after-miete-milieu.png`, `after-miete-kaltluft.png` (Overlays sichtbar), `after-brw-only.png` (Bodenrichtwerte unverändert). Prototypen A/B zum Vergleich ebenda.
- Symbolrand nach Matze-Entscheidung auf `#FFFFFF` (`buildScoreDotSvg`, Pins unverändert): Rand gegen gemischte Klassen 1-5 = 2,69 / 3,24 / 3,93 / 4,78 / 5,88; zusammen mit der Füllung erfüllt jede Symbolfarbe aus `choropleth-dots.ts` auf allen Klassen 3:1 (`scripts/miete-scale.test.ts`). Werte gelten für einfarbigen Untergrund `#ECEAE0` (Annahme).
- Legende als Wertebereiche: „5,1-6,9 €/m²“ … „ab 8,6 €/m²“ (EN „5.1-6.9 €/m²“ … „8.6+ €/m²“).
- Abschluss 14.10.: Unit-Suite 5.442/5.443 (einziger Fehlschlag `winner-map.svelte.test.ts`, bekannt wackelig), `pnpm check` 0 Fehler; Screenshots `after-*.png` mit weißem Rand neu aufgenommen.
- `SCALE_TOKEN_VALUES`/`app.css` müssen die `scaleMiete*`-Tokens nicht spiegeln: nur die `strukturell`-Familie wird dort genutzt (Verification-Gap-Review).

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, Edge | Legende zeigt nur Untergrenzen, Einheit nur am ersten Eintrag; AC verlangt €-Grenzen | medium | patch |
| Blind, Edge | `range` toter Code bei categorical, veraltete Kommentare | low | patch |
| Blind | Kontrasttest nur für `scaleStrukturell5`-Symbole, nicht Last/Gut/Dimension-Ramps | medium | patch |
| Edge (Patch-Lauf) | Dunkle Symbole auf Klasse 2 nur ~2,7:1 trotz hellem Rand | medium | intent_gap → Matze: weißer Rand → patch |
| Blind | Rand bei kleinsten Symbolen (Faktor 0,3) nur ~0,45 px, auf Klasse 4/5 kaum erkennbar | maybe-false (medium) | defer |
| Edge | Nicht-numerisches `miete` wird als Klasse 1 gemalt | false: GeoJSON enthält nur Zahl oder null (Build-Script) | reject |
| Edge | 3:1-Test prüft Rohfarbe statt gemischter 0,7-Fläche | false: Hausregel `check-scale-contrast.ts` gilt für Tokens, gleich bei allen Familien | reject |
| Edge, VerifGap | Legendenfelder 0,65 vs. Karte 0,7 | low: bestehende Konvention aller kategorialen Legenden | reject |
| Edge | Rand-Aussage „4,5:1“ in Notes zu hoch | low | Notes korrigiert |
| Blind, Edge | Vorher-Screenshots und Kombinations-Screenshots fehlen | false: vom Orchestrator nachgeliefert, im Repo abgelegt | reject |
| Blind | Verification-Befehl filtert `scripts/miete-scale.test.ts` aus | low: Fix wäre Spec-Edit; Test läuft in der Abschlussprüfung explizit | reject |
| Blind | `mix()` rechnet gegen idealisierten Untergrund | low: als Annahme in Notes markiert | reject |
| Blind | Code-Map-Prüfpunkt `SCALE_TOKEN_VALUES` ohne Ergebnis | false: VerifGap belegt, nicht nötig; in Notes ergänzt | reject |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/components/atlas scripts/lib` -- expected: grün
- `pnpm check` -- expected: 0 Fehler

**Manual checks** (Dev-Server dieses Worktrees läuft auf `http://localhost:5180`; Port 5173 gehört einem anderen Server. Screenshots z. B. per Playwright aus `node_modules/playwright`, Kaltluft-Slug `klima-kaltlufteinwirkbereich-2022`):
- Screenshot `/explore?layers=zensus-bestandsmiete-2022` vorher/nachher sowie `bodenrichtwerte` unverändert.
