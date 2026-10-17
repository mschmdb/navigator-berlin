---
title: 'GH-87 Redesign 2: Typografie ohne Serif, Mono nur für Zahlen'
type: 'refactor'
created: '2026-10-17'
status: 'done'
baseline_commit: 'c7a69f1ceefe293a35f4e5e12450df5fc74ba0f2'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/src/app.css'
  - '{project-root}/docs/process/implementation-artifacts/spec-gh-86-redesign-fundament.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** navigator mischt Plex Serif (399× in 102 Dateien), Plex Mono als Label-Schrift (424×) und Versalien-Labels (140×). Dazu kommen Eyebrows, Meta-Strings mit `·` und „→“ an Links. Die Design-Prüfung vom 17.10.2026 wertet das als generischen Look (Leitlinie 29), schmidbauer.dev nutzt nur Sans und Mono.

**Approach:** Plex Sans trägt alle Texte, die Hierarchie entsteht über das Gewicht (Überschriften 600/700). Mono bleibt nur für Zahlen, Messwerte und Code. Versalien, Eyebrows, `·`-Meta und „→“ an Links fallen weg. Ein Guard-Test hält das fest.

**Entschieden (Matze, 17.10.2026; Issue #87 mit Kommentar ist die abgenommene Spec, Spec-Checkpoint übersprungen):**
- Akzent Indigo, nur Light Mode. Mockup `design-proposals/` ist abgenommen: H1/H2 Sans 700, H3 600, Buttons Satzschreibung Sans 500, große Score-Zahl Sans 700 mit `tabular-nums`, Mono nur für kleine Zahlen in Tabellen und Legenden.
- Gilt für alle Seiten inkl. Footer, Drawer und 404.
- Footer-Gruppenköpfe: Sans 12 px (`text-dense-label`), 600, normale Schreibung.
- Wahlportal-H1 „Abgeordnetenhauswahl 2026, Zweitstimme“.
- `CLAUDE.md` und `AGENTS.md` empfehlen `·` nicht mehr als Em-Dash-Ersatz.

## Boundaries & Constraints

**Always:**
- `font-serif` verschwindet aus `src/**/*.svelte`. Serif-`@font-face` und `--font-serif` fliegen aus `app.css`, Serif-Preload aus `app.html`.
- `font-mono` nur an Elementen mit Zahl, Messwert, Datum, Rang oder Code. Diese Elemente tragen zusätzlich `tabular-nums`.
- Eyebrows: rein dekorative Zeilen über Überschriften entfallen. Trägt eine Zeile Information oder einen Link (Kiez-Hero → Bezirk), bleibt sie als Sans-Zeile in Satzschreibung.
- `·` als Trenner in sichtbaren Meta-Strings (DE und EN) wird Komma, Doppelpunkt oder zwei Zeilen. „→“ an Link- und Buttontexten entfällt.
- Tests, die alte Strings oder Klassen prüfen, ziehen mit.

**Never:**
- Keine Layout-Umbauten (Karten, Reihenfolge): #88, #90.
- Keine Textkürzungen, kein „X, kein Y“-Abbau: #92.
- Keine Score-Umbenennung: #93.
- OG-Bilder (`src/lib/server/og/`, `og-card-renderer.ts`), Print-CSS, `<title>`/Meta-Description und MapLibre-Beschriftung bleiben unverändert. Serif-Fontdateien in `static/fonts/` bleiben (OG nutzt sie).
- „→“ mit Fluss-Bedeutung bleibt: Sankey `{von} → {nach}`, Formeln wie „0 m → 100“, Sortierrichtung als Pfeil nur, wenn es keine Wortalternative gibt.
- Keine repo-weite Klassen-Sortierung außerhalb angefasster Dateien.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Guard Serif | `font-serif` in `src/**/*.svelte` | Guard schlägt fehl mit Datei:Zeile | Tests und OG ausgenommen |
| Guard Versalien | Klasse `uppercase` in `.svelte` | Guard schlägt fehl | keine Ausnahme |
| Guard Mono | `font-mono` ohne `tabular-nums` | Guard schlägt fehl | `<code>`, `<pre>`, WebMCP-Diagnose ausgenommen |
| Guard Pfeil | „→“ in `messages/*.json` | Guard schlägt fehl | Whitelist der Schlüssel mit Fluss-Bedeutung |
| Guard Mittelpunkt | `·` in `messages/*.json` | Guard schlägt fehl | Whitelist: Seitentitel, OG-Alt, Print-Footer, Aria-Labels ohne sichtbaren Text |

</frozen-after-approval>

## Code Map

- `src/app.css:35-60, 107, 277` -- Serif-`@font-face`, `--font-serif` und `@theme`-Mapping entfernen.
- `src/app.html:21` -- Serif-Preload entfernen.
- Eyebrows: `home/home-finder-teaser.svelte:26`, `home-hitze-teaser.svelte:24`, `home-kaelte-teaser.svelte:24`, `kiez-hero.svelte:98-106` (Link bleibt als Sans-Zeile), `bezirk-hero.svelte:60`, `compare-panel/compare-panel.svelte:76`, `routes/(with-header)/{kaelte,berlin-wahlen,hitze}/+page.svelte` (Zeile mit `uppercase`), Methodik-Wahldaten, Layer-Seite („C: UMWELT“, `layer/[slug]/+page.svelte:177`), Header-Wortmarke („Beta“ als Wort hinter der Marke).
- Footer: `shell/meta-footer.svelte:82`, `shell/mobile-meta-drawer.svelte:78`.
- Mono-Schwerpunkt Wahlportal: `src/lib/components/wahl-portal/*` (Buttons, Hinweise, Legenden in Mono ohne Zahl).
- `messages/de.json`, `messages/en.json` -- 74 `·` und 16 „→“; Schlüssel siehe Guard-Whitelist im Test.
- Muster aus #86 wiederverwenden: Guard-Stil wie `src/lib/design/token-guards.test.ts`.
- Nicht anfassen: `src/lib/server/og/`, `src/lib/utils/og-card-renderer.ts`, `static/fonts/`, Lizenz-Snapshot zu Plex Serif.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/design/typography-guards.test.ts` -- NEU, zuerst rot: Serif, Versalien, Mono ohne Zahl, „→“ und `·` in Messages nach Matrix -- schützt die Typo dauerhaft.
- [ ] `src/app.css`, `src/app.html` -- Serif entfernen; Überschriften-Basis Sans -- eine Familie.
- [ ] Alle `.svelte` mit `font-serif` -- Sans, Überschriften `font-semibold`/`font-bold` -- Hierarchie über Gewicht.
- [ ] Alle `.svelte` mit `font-mono`/`uppercase`/`tracking-*` an Labels -- Sans, Satzschreibung; Zahlen behalten Mono plus `tabular-nums`.
- [ ] Eyebrow-Stellen aus der Code Map -- streichen oder als Sans-Zeile -- Leitlinie 29.
- [ ] `messages/de.json`, `messages/en.json` -- `·`- und „→“-Strings umschreiben -- Leitlinie 29.
- [ ] `CLAUDE.md`, `AGENTS.md` -- Mittelpunkt-Empfehlung streichen.
- [ ] Bestehende Tests mit alten Strings/Klassen anpassen.

**Acceptance Criteria:**
- Given der Guard, when `pnpm test:unit --run` läuft, then findet er 0 Verstöße.
- Given Start, Explore mit Inspector, Kiez, Layer, Hitze, Wahlen, Methodik (DE/EN, 1440/390), when Screenshots vorher/nachher verglichen werden, then sind alle Überschriften Sans, Labels und Buttons in Satzschreibung, Mono nur an Zahlen; Layout unverändert.
- Given `pnpm check`, then 0 Fehler.

## Implementation Notes
- Serif: 399 Stellen in 99 Dateien per Skript migriert. Überschriften ohne Gewicht bekamen h1/großes h2 `font-bold`, sonst `font-semibold`. Kursiv entfiel mit der Serif (Plex Sans ist nur aufrecht geladen).
- Mono: 421 Stellen geprüft, 56 an Zahlen, Datum, Rang behalten (mit `tabular-nums`), Rest Sans. Versalien und `tracking-wide*` an Labels entfernt.
- Eyebrows gestrichen: Startseite (Hero, Finder-, Hitze-, Kälte-Teaser), Bezirk-Hero, /hitze, /kaelte, /berlin-wahlen, Layer-Seite (Bundle-Label). Kiez-Hero „Kiez in {Bezirk}“ und Vergleich-Label bleiben als Sans-Zeile, weil sie Information bzw. einen Link tragen. „Beta“ steht als Wort hinter der Wortmarke.
- `·`: Breadcrumbs nutzen `/`, Datenzeilen Komma, Bezeichnung plus Teil Doppelpunkt („Kiez-Score: Gesamt“, „Methodik: Wahldaten“), Lizenz und Prüfdatum stehen als eigene Zeile. Seitentitel (`*_meta_title`, `wahl-meta.ts`), OG und Druck-Fußzeile bleiben unverändert. TS-Formatter für sichtbare Zeilen (value-formatters, address-subline, poi-summary, authorities) ziehen mit; llms/Feeds/JSON-LD bleiben.
- „→“ an Link-/Buttontexten und ArrowRight-Icons an CTAs entfernt; Fluss-Pfeile (Sankey, Pipeline, Formeln, Menüpfade) bleiben.
- Screenshots vorher (Stand main, aus #86-Lauf) und nachher unter `/tmp/gh-87/`. Methodik-Vorher fehlt, Explore mobil konnte das Skript die Suche nicht öffnen.

## Review Triage Log

Review-Layer liefen über Codex (`gpt-6.1-sol`, read-only), weil der Fork keine Subagenten starten darf.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | Blind + Edge | Große Score-Zahl uneinheitlich (Startseite Mono 600, Ring Sans 600 ohne tnum) | medium | `home-featured-score.svelte:130`, `kiez-score-ring.svelte:131` | patch: beide Sans 700 + `tabular-nums` |
| 2 | Blind | Score-Pills verloren Mono (JS-Strings) | low | `score-ranking-table.svelte:171,184` | patch: `font-mono` zurück |
| 3 | Blind + Edge | h3/h4 ohne Gewicht nach Versalien-Abbau | medium | 8 Überschriften, u. a. `wahl-section.svelte:262` | patch: `font-semibold` |
| 4 | Blind + Edge | CTAs ohne Sans 500 | low | `home-hero.svelte`, Teaser, Header, Hitze, Kälte | patch: `font-medium` |
| 5 | Blind | Vergleich-Eyebrow bleibt | false | Label benennt den Panel-Inhalt, Spec erlaubt informative Zeilen als Sans | reject |
| 6 | Blind | Mittelpunkt im OSM-Authority-Suffix | medium | `authorities.ts:176` | patch: Suffix ohne Punkt, Komma beim Zusammensetzen |
| 7 | Blind | `<title>` geändert entgegen Spec | medium | `wahl-meta.ts`, `*_meta_title` | patch: zurückgesetzt; H1 nutzt eigene Komposition mit Komma |
| 8 | Blind + Edge | Mono-Guard prüft nur `tabular-nums`, nicht den Inhalt | low | Zeilen-Scan | reject: Fix bräuchte Template-Parser |
| 9 | Blind + Edge | Uppercase-Guard übersieht `sm:uppercase` | low | Regex | patch: `:` als Präfix |
| 10 | Blind | Visuelle Prüfung nicht dokumentiert | low | Notes leer | patch: Notes ergänzt |
| 11 | Edge | Wahlportal-H1 nicht „Abgeordnetenhauswahl 2026, Zweitstimme“ | false | Gemeint ist die Ergebnisseite; `wahlTitel` joint mit Komma | reject |
| 12 | Gap | A–Z/Z–A-Label nach Klick ungetestet | low | Sortierung läuft über URL-State | reject: Test bräuchte `$app/state`-Mock, Logik unverändert |
| 13 | Gap | Krankenhaus-Kontext ohne Test | low | `layer-hit-display.ts:184` | patch: Test ergänzt |
