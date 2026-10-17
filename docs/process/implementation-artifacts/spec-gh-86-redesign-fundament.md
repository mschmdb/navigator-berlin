---
title: 'GH-86 Redesign 1: Fundament (Dichte-Skala, Fokus, Tokens, Klickziele)'
type: 'refactor'
created: '2026-10-17'
status: 'in-review'
baseline_commit: '094d7010086624128ead48febe995e2998a71516'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/src/app.css'
  - '{project-root}/src/lib/components/atlas/internal/colors.ts'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Design-Prüfung vom 17.10.2026 (Issue #56, Epic #85) zählt 126 freie Schriftgrößen von 8 bis 11 px in 45 Dateien, 137× `leading-relaxed` (1,63), drei Fokus-Stile nebeneinander, rohe Hex-Farben in Komponenten und viele Klickziele unter 24 px. Leitlinien 7, 8, 14 und 23 sind damit verletzt, und jede weitere Redesign-Story müsste auf Rohwerten aufbauen.

**Approach:** `src/app.css` bekommt die fehlenden Tokens (Dichte-Skala, Zeilenabstände, Zielgröße), alle Komponenten ziehen auf diese Tokens um. Ein Guard-Test verhindert, dass Rohwerte zurückkommen. Das Aussehen ändert sich nur dort, wo Werte unter der neuen Untergrenze lagen.

**Entschieden (Matze, 17.10.2026):** Akzent Indigo, nur Light Mode. Kleine Schrift bleibt erlaubt, Untergrenze 11 px. Der Inspector muss nicht per Escape schließen. Token-Namen kompatibel zu schmidbauer.dev, weil #66 sie später ins CI-Paket hebt.

**Entschieden (Freigabe Matze 17.10.2026, Empfehlungen übernommen):**
- Klickziele wachsen sichtbar über Padding und `min-h-(--target-min)` bei Toolbar, Toggles, Buttons, Summary und Block-Links. Nur Icons in dichten Zeilen bekommen eine unsichtbare 24-px-Trefferfläche per `::after`.
- Wärme-Orte nutzen überall `#B5390A` (Pin-Farbe), Token `--umwelt-waerme-orte`.

## Boundaries & Constraints

**Always:**
- Neue Tokens in `:root` und gemappt in `@theme inline`, damit Tailwind-Utilities entstehen (`text-dense-meta` usw.).
- Dichte-Skala: `--text-dense-meta: 0.6875rem` (11 px), `--text-dense-label: 0.75rem` (12 px), `--text-dense-value: 0.8125rem` (13 px).
- Zeilenabstand: `--leading-body: 1.45` (Name wie schmidbauer.dev), `--leading-dense: 1.35`.
- Zielgröße: `--target-min: 24px`.
- Migrationsregel Schrift: 8, 9, 10 px → `text-dense-meta`. 11 px → `text-dense-meta` bei Quellen, Stand, Achsen; `text-dense-label` bei Labels, Badges, Zeilenköpfen. Nichts unter 11 px. Die Kiez-Score-Ring-Labels (8 px) dürfen nicht mehr abschneiden.
- Migrationsregel Zeilenabstand: `leading-relaxed` an Fließtext → `leading-(--leading-body)`, in dichten Werkzeugflächen → `leading-(--leading-dense)`.
- Fokus: Einziger sichtbarer Fokus ist die globale Regel in `app.css` (2 px, `--focus`, Offset 2 px). Ihr Selektor deckt zusätzlich `summary, input, select, textarea` ab. Komponenten-Overrides (`focus-visible:outline-accent` 17×, `focus-visible:ring-accent` 5×, `outline-rule-strong` 2×) entfallen. Die 4 Stellen mit `focus:` werden `focus-visible:` oder entfallen.
- Farben: Komponenten nutzen nur Tokens. MapLibre-Stile lesen Werte aus `colors.ts`, das gegen `app.css` geprüft wird.
- Klickziele: jedes Block-Ziel mindestens 24 px hoch und breit. Links im Fließtext sind ausgenommen (WCAG 2.2 SC 2.5.8).

**Never:**
- Keine Hover-Tokens (`accent-strong`, `fg-muted`, `bg-muted`): das macht #95 parallel.
- Kein Wechsel von Serif oder Mono, keine Eyebrows, kein `·`: das macht #87.
- Kein Umbau von Layout oder Karten-Struktur: das machen #88 und #90.
- Keine Änderung an OG-Bildern (`src/lib/server/og/`), Print-CSS und MapLibre-Kartenbeschriftung.
- Kein Dark Mode.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Guard Schrift | Datei unter `src/` enthält `text-[10px]` | Guard-Test schlägt fehl und nennt Datei und Zeile | Testdateien und OG-Templates ausgenommen |
| Guard Fokus | Klasse `focus:ring-2` in `.svelte` | Guard-Test schlägt fehl | `focus-visible:` und `focus-within:` erlaubt |
| Guard Hex | `text-[#0277BD]` in `.svelte` | Guard-Test schlägt fehl | Kommentare und `var(--x, #fallback)` erlaubt |
| Token-Parität | Wert in `colors.ts` weicht von `app.css` ab | Paritätstest schlägt fehl | nur Schlüssel mit CSS-Gegenstück |
| Ring-Label | Kiez-Score-Ring, Label „Grün & Hitze“ | Label vollständig lesbar, ≥ 11 px | Kürzung nur per Legende, nicht per Clipping |

</frozen-after-approval>

## Code Map

- `src/app.css:110-117, 190-195, 220-270, 313-316` -- Lese-Skala, Radius, `@theme inline`, globale Fokus-Regel. Hier kommen Dichte-Skala, Leading, `--target-min`, `--umwelt-kuehle-orte`, `--umwelt-waerme-orte` dazu. `--spacing-6` ist schon 1.5rem, `min-h-6` ergibt 24 px.
- `src/lib/components/atlas/internal/colors.ts` -- JS-Spiegel der Tokens für MapLibre. Bestehende Werte wiederverwenden, nicht duplizieren.
- Schrift, Schwerpunkte: `inspector-panel/wahl-section.svelte` (14), `inspector-panel/kuehle-orte-card.svelte` (9), `map-legend.svelte` (8), `kiez-finder-panel.svelte` (6), `map-hover-tooltip.svelte` (5), `inspector-panel/kiez-score-dimension-row.svelte` (5), `charts/kiez-score-ring.svelte:106` (8 px), `charts/distance-ring.svelte:78` (9 px), `climate-long-view.svelte:278` (`font-size="10"`). Rest: 36 Dateien mit 1 bis 4 Vorkommen, per `grep -rnE 'text-\[(8|9|10|11)px\]' src`.
- Rohfarben: `kuehle-orte-card.svelte:127,208`, `hitze-trinkbrunnen-toggle.svelte:51`, `waerme-orte-card.svelte:110`, `routes/(with-header)/hitze/+page.svelte:202`, `routes/(with-header)/kuehle-orte/+page.svelte:33`, `map-embed.svelte:41,45`, `wahl-bezirk-choropleth.svelte:65,101`, `wahl-stimmbezirk-choropleth.svelte` (`#CCCCCC`, `#141414`), `kiez-finder-panel.svelte:297`, `wahl-portal/small-multiples.svelte:253`, `charts/kiez-score-ring.svelte:69` (Fallback `#ddd`), `score-ranking-table.svelte:452-461` (Fallback `#ecead0` ist ein Tippfehler von `#eceae0`).
- Kontrast: `#0277BD` erreicht 3,98:1 auf `--bg`. Für Icons reicht das (3:1), für den Text-Badge in `kuehle-orte-card.svelte:208` nicht. Badge-Text braucht eine dunklere Stufe (≥ 4,5:1).
- Fokus `focus:`: `kaelte/warme-orte-naehe.svelte:151`, `atlas/briefwahl-marker.svelte:50`, `atlas/climate-sparkline.svelte:223`, `atlas/climate-long-view.svelte:213`.
- Klickziele unter 24 px (gemessen 17.10.): `kiez-finder-panel.svelte:458-466` (Schließen, ~18 px), `:551` (Partei-Toggles ~20 px), `:586` (Reset), `map-legend.svelte:113,125,143`, Inspector-Toolbar (21 px), `inspector-panel/kiez-score-dimension-row.svelte` (20 px), „Quelle & Details“ (17 px), `breadcrumb.svelte` (20 px), Summary „Verteilung & Zahlen“ in `kiez-details.svelte` (17 px), `editorial-disclaimer.svelte` „Quelle ansehen“ (19 px), Wahlportal `karten-steuerung.svelte` Jahr-Buttons (23 px), `meta-footer.svelte` und `mobile-meta-drawer.svelte` (Social-Icons 16 px, „English“ 17 px, Drawer-Schließen 28 px ok), `routes/+error.svelte` und `(with-header)/+error.svelte` (Buttons 20 px), `hitze/+page.svelte:185` (Methodik-Link 20 px).
- Nicht anfassen: `src/lib/server/og/page-card-template.ts`, Print-Block in `app.css:325ff.`

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/design/token-guards.test.ts` -- NEU, zuerst rot: liest `src/**/*.svelte` und prüft Schriftgrößen, `focus:` und Roh-Hex nach der Matrix; dazu Parität `colors.ts` gegen `app.css` -- schützt das Fundament dauerhaft.
- [x] `src/app.css` -- Tokens ergänzen, `@theme inline` mappen, Fokus-Selektor erweitern -- eine Quelle für alle Werte.
- [x] `src/lib/components/atlas/internal/colors.ts` -- Wärme-/Kühle-Orte und Badge-Stufe angleichen -- Parität.
- [x] 45 Dateien mit freien Schriftgrößen -- auf Dichte-Skala nach Migrationsregel -- Untergrenze 11 px.
- [x] Dateien mit `leading-relaxed` -- auf `--leading-body` oder `--leading-dense` -- Leitlinie 14.
- [x] Fokus-Overrides und `focus:` -- entfernen bzw. umstellen -- ein Fokus-Stil.
- [x] Rohfarben -- auf Tokens bzw. `COLORS` -- Leitlinie 7.
- [x] Klickziele aus der Code Map -- Padding/min-h, Icons per ::after -- WCAG 2.2 SC 2.5.8.
- [x] `src/lib/components/atlas/charts/kiez-score-ring.svelte` -- Labels ≥ 11 px ohne Clipping; Component-Test ergänzen.

**Acceptance Criteria:**
- Given der Guard-Test, when `pnpm test:unit --run` läuft, then findet er 0 Schriftgrößen unter 11 px, 0 `focus:` und 0 Roh-Hex in Komponenten.
- Given die Startseite, /explore mit Inspector, /kiez/suedliche-luisenstadt, /hitze und /berlin-wahlen, when ein Playwright-Lauf alle Block-Ziele misst, then ist keines unter 24 × 24 px.
- Given Tab-Navigation auf denselben Seiten, when ein Element Fokus bekommt, then zeigt es den 2-px-Ring in `--focus`, auch an `summary` und Formularfeldern.
- Given der Badge in `kuehle-orte-card`, when Kontrast gegen seinen Hintergrund gemessen wird, then liegt er ≥ 4,5:1.
- Given Screenshots vorher und nachher (Desktop 1440, Mobil 390, DE und EN) der fünf Seiten, when Matze sie vergleicht, then ändern sich nur Schriftgröße, Zeilenabstand, Fokus und Zielgrößen; Layout und Farben bleiben sonst gleich. Abnahme durch Matze ist Gate vor dem Merge.
- Given axe-core auf denselben Seiten, then 0 Verstöße.

## Implementation Notes

- Effektive Review-Basis nach dem Rebase: `2b18dc44578fcc7ee570c9602e217283ad62a954` (`origin/fix/95-farb-tokens`); `baseline_commit` zeigt auf den Stand vor dem Rebase.
- Basis: Branch auf `origin/fix/95-farb-tokens` (PR #113) rebased, weil #95 parallel `--accent-strong` und `--bg-muted` einführt und Klassen sortiert. `distance-ring` nutzt deshalb `var(--bg-muted)` aus #95.
- Schrift: 126 Vorkommen in 46 Dateien migriert. 8 bis 10 px und nicht-interaktive 11 px → `text-dense-meta` (11 px). 11 px an Buttons, Links mit Hover und Tabellenköpfen → `text-dense-label` (12 px). SVG-Achse in `climate-long-view` von 10 auf 11.
- `leading-relaxed` (137×, 41 Dateien) → `leading-body`. Alle Stellen sind Fließtext; `--leading-dense` ist definiert und gemappt, aber noch ungenutzt (für #88).
- `.prose` folgt `--leading-body` (Update-Einträge lagen bei 1,78).
- Fokus: 31 Klassenzeilen ohne Override; `focus-visible:outline-focus` (gleiche Farbe wie global) blieb an Button, Skip-Link, Suche, Karten-Controls und Sankey-Bändern. Die Überschrift in `warme-orte-naehe` (tabindex -1, programmatischer Fokus) trägt `outline-none` statt `focus:outline-none`.
- Hex: MapLibre-Werte kommen aus `COLORS` (neu `ink`, `noData`). Kühle-Orte-Badge-Text nutzt `--umwelt-kuehle-orte-ink` (#01579b, ≥ 4,5:1 auf dem 12-%-Tint, im Guard geprüft). Wärme-Orte-Icon jetzt `#B5390A` wie der Pin.
- Ring: Bogen-Labels entfernt, Legende unter dem Ring (12 px, Wert in Mono, `aria-hidden`, weil die sr-only-Tabelle die Daten schon trägt).
- Klickziele: `min-h-(--target-min)` plus `inline-flex items-center` an 40+ Elementen. Icon-Buttons in dichten Zeilen und Social-Icons: `-m-1 inline-flex size-(--target-min)`; die negative Margin hält das Layout, die Trefferfläche ist messbar 24 px (statt `::after`, das `getBoundingClientRect` nicht misst). Footer-Links ohne `gap-2`, dafür 24 px hoch.
- Neue Tests: `src/lib/design/token-guards.test.ts` (Guard, Tokens, Parität, Kontrast), `kiez-score-ring.svelte.test.ts` (Legende), `tests/e2e/target-size.e2e.ts` (5 Seiten × Desktop/Mobil), `tests/e2e/focus-ring.e2e.ts`.
- `winner-map.svelte.test.ts` (Adress-Hinweis) ist flaky: scheitert gelegentlich unter Last, 3 von 3 Einzelläufen grün; der Diff ändert dort nur `leading-relaxed`.
- `pnpm lint`: Prettier grün. ESLint meldet 301 bestehende Fehler (u. a. `no-navigation-without-resolve`), keiner aus diesem Diff.

## Spec Change Log

## Review Triage Log

Review-Layer liefen über Codex (`gpt-6.1-sol`, read-only), weil der Fork keine Subagenten starten darf.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | Blind + Edge | Legenden-Icons: `-m-1` bei `gap-0.5` überlappt Trefferflächen um 6 px | medium | 3 × 24 px mit −4 px Rand und 2 px Abstand überlappen rechnerisch | patch: `gap-2` |
| 2 | Blind | Distanz-Ring: 11-px-Wert passt nicht in 32 px Innendurchmesser | medium | „1.2 km“ ≈ 40 px bei Mono 11 px | patch: Ring 56 px, Radius 22 |
| 3 | Blind | Ring-Legende ordnet Dimensionen nur über Reihenfolge zu, Farben = Stufe | low | Reihenfolge Legende = außen nach innen, Zuordnung nicht beschriftet | defer an #88 |
| 4 | Blind | Finder-Slider 17,6 px hoch | medium | `.finder-range { height: 1.1rem }` | patch: `height: var(--target-min)` |
| 5 | Blind | `inspector-card`-Toggle ohne Mindesthöhe | low | `text-xs` + 16-px-Chevron ≈ 17 px | patch: `min-h-(--target-min)` |
| 6 | Blind + Edge | Legenden-`summary` unter 24 px | medium | keine Mindesthöhe, nur Text-Zeilenhöhe | patch |
| 7 | Blind | Ring-Test prüft Computed-Size ohne app.css | low | Client-Tests laden app.css nicht, Browser-Default 16 px besteht | patch: Klassenprüfung ergänzt |
| 8 | Blind + Gap | Fokus-e2e deckt Finder nicht ab | medium | Gap-Layer belegt: keine Finder-Fokusprüfung | patch: Finder-Fall |
| 9 | Blind + Gap | Klickziel-e2e misst nur Startzustand, Finder fehlt | medium | Gap-Layer belegt | patch: `/explore?finder=1` |
| 10 | Blind | Hex-Guard überspringt ganze Zeile bei `href="#"` | low | Filter wirkt zeilenweise | patch: Fragmente entfernen, Regressionstest |

## Design Notes

Guard statt Lint-Regel: Tailwind-Klassen stehen in Strings, ESLint sieht sie nicht zuverlässig. Ein Vitest-Scan über `src/**/*.svelte` ist billig und liefert Datei und Zeile. Ausnahmen stehen als kurze Allowlist im Test, mit Grund.

`--leading-body` und `--text-*` heißen wie auf schmidbauer.dev. Die Dichte-Skala ist navigator-eigen und bleibt bei #66 im Projekt.

## Verification

**Commands:**
- `pnpm test:unit --run` -- expected: grün, Guard-Test inklusive.
- `pnpm check` -- expected: 0 Fehler.
- `pnpm lint` -- expected: grün.
- `pnpm test:e2e` -- expected: grün, inklusive neuer Klickziel-Messung.

**Manual checks:**
- Screenshots vorher/nachher nach `/tmp/gh-86/` (nicht ins Repo), Desktop und Mobil, DE und EN, für die fünf Seiten aus den AC.
