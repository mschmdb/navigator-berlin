---
title: 'L4: Kennzahl-Kacheln mit Berlin-Vergleich und Karten-Link'
type: 'feature'
created: '2026-10-14'
status: 'done'
route: 'dispatch'
baseline_commit: '334364a631edb1eac94e027fb32e8df78408f185'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epic-landing-enhance.md'
  - '{project-root}/_bmad-output/implementation-artifacts/landing-investigation-l2-l6.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Kennzahlen auf Kiez- und Bezirksseiten stecken in einer engen Steckbrief-Tabelle mit eingeklappten Details und ohne Berlin-Vergleich. Niemand sieht auf einen Blick, ob ein Kiez teurer, lauter oder grüner ist als Berlin, und keine Zahl führt zur passenden Karte.

**Approach:** Unter dem Hero (L2/L5) stehen sechs offene Kacheln mit je einem Wert, dem Berlin-Wert und einem Link auf die Karte mit diesem Layer und Ortsfokus. Daten DB-frei aus `static/layer-aggregates/layer-aggregates.json`. Die Steckbrief-Tabelle bleibt eingeklappt darunter.

**Entscheidungen (Empfehlung, Freigabe Matze 14.10. für den Epic):**
- Sechs Kacheln, Reihenfolge: Bestandsmiete (`zensus-bestandsmiete-2022`, €/m², weighted-mean), Altbau-Anteil (`zensus-altbau-anteil-2022`, %), Lärm (`laerm-2023`, überwiegende Lärmstufe der Planungsräume; geändert 14.10. im Review, siehe Spec Change Log), Grünflächen (`gruenanlagen`, Flächenanteil %), Hitze (`klima-pet-2022`, Median-PET in °C), Milieuschutz (`milieuschutz-erhaltungsmiete`, Flächenanteil %).
- Jede Kachel: Titel, Wert groß, „Berlin: {Wert}“ klein, Link „Auf der Karte“ → `/explore?kiez=<slug>&layers=<layer>` bzw. `?bezirk=` (lokalisiert).
- Neutrale Darstellung: keine Gut/Schlecht-Farben, keine Pfeile in Rot/Grün. Optional ein neutraler Hinweis „höher/niedriger als Berlin“ als Text.
- Fehlt ein Wert (Aggregat null, zu wenige Wohnungen), zeigt die Kachel „keine Angabe“ und behält den Karten-Link.
- Gilt für Kiez- und Bezirksseiten (Aggregat `kiez[slug]` bzw. `bezirk[slug]`).

## Boundaries & Constraints

**Always:** Werte über bestehende Formatter (Inspector `value-formatters.ts`, `formatKm2`-Stil), DE/EN. Kacheln als Liste (`<ul>`), Kachel-Titel als Überschrift oder `dt`, Link mit sprechendem Namen („Lärm in Reuterstraße auf der Karte“). Prerender, DB-frei. Mobil zweispaltig, Desktop dreispaltig.

**Never:** Keine neuen Datenquellen, keine Mietwerte als Bewertung. Keine Änderung an Hero (L2/L5), `/explore`, Title/Meta.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kiez | `/kiez/reuterstrasse` | 6 Kacheln mit Kiez- und Berlin-Wert, Links `?kiez=reuterstrasse&layers=…` | N/A |
| Bezirk | `/bezirk/pankow` | 6 Kacheln mit Bezirkswerten, Links `?bezirk=pankow&layers=…` | N/A |
| Fehlender Wert | Aggregat für Slug fehlt/null | „keine Angabe“, Link bleibt | N/A |
| Dublette | `heerstrasse-spandau` | Lookup mit Fallback wie `regionComposite` (`name` → `name-bezirk`) | N/A |
| EN | `/en/kiez/…` | EN-Texte, Dezimalformat EN, Links mit `/en` | N/A |

</frozen-after-approval>

## Code Map

- `static/layer-aggregates/layer-aggregates.json` -- `aggregates[slug].{kiez,bezirk,berlin}`; Typen `src/lib/data/layer-aggregates-types.ts`, Loader `src/lib/data/get-layer-aggregates.ts` (`loadLayerAggregates`, im Server per fs lesen wie `meta-sources.ts` aus L3).
- `src/lib/components/atlas/inspector-panel/internal/value-formatters.ts`, `weighted-mean-context.ts` -- Formatierung €/m², %, °C wiederverwenden.
- `src/lib/components/atlas/kiez-hero.svelte` / `kiez-details.svelte` (L2) und `bezirk-details.svelte` (L5) -- Steckbrief bleibt, Kacheln davor einfügen.
- `src/lib/utils/url-state.ts` `buildRegionFocusHref(kind, slug, layers)` + `localizedHref`.
- Neu `src/lib/data/region-key-figures.ts` (rein, getestet): baut die 6 Kacheln aus Aggregaten; neue Komponente `key-figure-tiles.svelte` + Test.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/data/region-key-figures.test.ts`, `region-key-figures.ts` -- Red/Green: alle Aggregat-Typen der 6 Layer, fehlender Wert, Dubletten-Fallback, Lärm-Anteil der lautesten Klassen.
- [x] Server-Loads Kiez/Bezirk -- Kacheldaten in Page-Daten.
- [x] `key-figure-tiles.svelte` + Test -- Werte, Berlin-Wert, Links DE/EN, „keine Angabe“, sprechende Link-Namen.
- [x] Kiez-/Bezirksseite -- Kacheln einbinden.
- [x] `messages/de.json`, `messages/en.json`.
- [x] E2E: eine Kachel-Link-Navigation landet auf `/explore` mit Ortskarte und aktivem Layer.

**Acceptance Criteria:**
- Given `/kiez/reuterstrasse`, when man die Kacheln liest, then nennt jede Kachel einen Wert und den Berlin-Wert, ohne Wertung durch Farbe.
- Given die Kachel „Altbau-Anteil“, when man den Link anklickt, then zeigt `/explore` den Kiez mit dem Altbau-Layer.

## Implementation Notes

- Neu: `src/lib/data/region-key-figures.ts` (`buildKeyFigures`), `key-figure-tiles.svelte` (`<ul>`, h3, Wert-Element `key-figure-value`), `readLayerAggregatesFile` in `meta-sources.ts` (Promise-Cache, Pfad-Parameter für Tests).
- Formatierung über `formatLayerValue` (Miete, Altbau, Hitze) und `formatPercent` (Grün, Milieuschutz); Hitze zeigt dadurch „(gefühlt 14 Uhr)“ und bricht in schmalen Kacheln um.
- Lärm zeigt die überwiegende Stufe (siehe Spec Change Log); Notiz „Umweltatlas 2023“.
- Bezirk: Kacheln nach der Kiez-Liste (L5), vor den Details.
- Beobachtet, nicht Teil der Story: Kiez-Prosa schreibt „Reuterstrasse“ statt „Reuterstraße“.
- Verifikation: Unit 3.145 grün, `pnpm check` 0 (Typfehler im Test nachträglich behoben), Build mit DB, E2E 71/71.

## Spec Change Log

- 14.10., Review: Die frozen-Entscheidung „Lärm = Flächenanteil der beiden lautesten Klassen“ passt nicht zu den Daten (`laerm-2023` ist eine Verteilung über Planungsräume mit gering/mittel/hoch, kein Flächenanteil). Unter Matzes stehender Freigabe für den Epic geändert auf: Kachel zeigt die überwiegende Lärmstufe (`dominant`), Berlin ebenso, ohne Wertung; fehlende Daten → „keine Angabe“. Vermeidet eine falsch beschriftete Zahl („0 %“ für 64 von 143 Kiezen). KEEP: übrige fünf Kacheln, Links, neutrale Darstellung.

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, Edge, Orchestrator | Lärm: Daten sind Anteil der Planungsräume, nicht Fläche; nur gering/mittel/hoch; leere Klassen → „0 %“ | medium | intent_gap, unter stehender Freigabe entschieden (Spec Change Log) → patch |
| Edge | `aggregates: null` passiert Guard; fehlende Map wirft | low | patch (direkte Korrektur) |
| Blind, Edge | Aggregat-Datei ~310× gelesen/geparst | low | patch (Modul-Cache) |
| Blind | Eigene Formatierung statt `formatPercent`/`formatLayerValue` | medium | patch |
| Blind | Notizen ohne Quelle/Jahr, EN-Titel Milieuschutz | low | patch |
| VerifGap, Blind | E2E-Werte passen schon über „Berlin: …“, Dublette, Bezirks-Reihenfolge | medium | patch |
| Blind | `meta-sources.test.ts` liest echte Datei, null-Pfad fehlt | low | patch (null-Pfad); echte Datei ist im Repo versioniert |
| Edge | `name-bezirk`-Fallback in Prod nie erreicht | low | reject: spiegelt `regionComposite`, harmlos |
| Blind | Link-Name „… Auf der Karte“ mit Großbuchstaben | low | reject: sichtbarer Text im Namen enthalten (2.5.3 erfüllt) |
| Blind | Bezirk: Kacheln nach der Kiez-Liste statt direkt unter dem Hero | low | reject: L5 legt „Kiez-Liste direkt darunter“ fest; Kacheln folgen auf die Liste (bewusst) |
| Blind | Kein Text „höher/niedriger als Berlin“ | low | reject: in der Spec optional |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/data src/lib/components/atlas` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat, Preview 4173, Playwright mit temporärer Config -- expected: grün
