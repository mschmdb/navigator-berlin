# Story 16.2: Live-DWD-Hitzewarn-Banner

Status: ready-for-dev

> **Anker:** ADR-009 (Remote Functions statt ad-hoc fetch), ADR-012 (TDD-Mandat), FR15 + UX-DR6 (`epics-kuehle-orte.md`). Baut auf Story 16.1 (Landing-Page-Gerüst, Route `/kuehle-orte`).
> **Owner-Haltung (NFR8):** Angebot, kein Behörden-Ersatz. Das Banner spiegelt die amtliche DWD-Warnlage, ersetzt sie nicht. Quelle immer sichtbar genannt.
> **Abhängigkeit:** Story 16.1 liefert die Route + `+page.svelte`, in die das Banner oben einhängt. Ist 16.1 noch nicht gelandet, wird die Komponente standalone gebaut und getestet, das Einhängen erfolgt in derselben PR sobald die Route existiert.

## Story

As a Besucher der Kühle-Orte-Landing-Page,
I want sehen, ob für Berlin gerade eine DWD-Hitzewarnung gilt,
so that ich die Dringlichkeit einschätze und das Angebot im richtigen Kontext lese.

## Kontext: Warum dieser Change

Die Landing Page (Story 16.1) zeigt kühle Orte unabhängig vom Wetter. Ein Live-Banner verankert das Angebot im aktuellen Hitze-Kontext: Bei amtlicher Warnung wird die Seite dringlicher, bei Normallage bleibt sie ruhig. Die Daten kommen live vom Deutschen Wetterdienst (DWD), nicht aus der Build-Pipeline, denn eine Warnlage ändert sich stündlich.

Anders als die Karten-Layer (Build-Zeit, gehasht, MANIFEST) ist dies ein **Laufzeit-Abruf**. Muster dafür existiert: `src/lib/data/geocode.remote.ts` (Remote-Query) + `src/lib/server/geocode.ts` (Proxy mit Timeout, Cache, stiller Fehlerbehandlung). Wir spiegeln dieses Muster für die DWD-Warnlage statt eine neue Fetch-Infrastruktur zu erfinden.

**Datenquelle (verifiziert 2026-06-30):** DWD GeoServer WFS, `https://maps.dwd.de/geoserver/dwd/ows`, `typeName=dwd:Warnungen_Gemeinden`, `outputFormat=application/json` (GeoJSON FeatureCollection). Hitze-Filter über `EC_II`: `247` = starke Hitze (starke Wärmebelastung), `248` = extreme Hitze (extreme Wärmebelastung). Berlin-Auswahl über das `NAME`-Feld der Gemeinde-Features. Lizenz: GeoNutzV / DWD, Quellenangabe „Deutscher Wetterdienst" Pflicht.

## Acceptance Criteria

1. **AC-1 (Warnung aktiv → Banner):**
   **Given** eine aktive DWD-Hitzewarnung für Berlin (`EC_II` 247 oder 248)
   **When** die Landing Page lädt und die Warnlage abruft
   **Then** zeigt ein Banner die Warnstufe als Text (z. B. „Starke Hitze" / „Extreme Hitze"), eine Kurzinfo (Headline/Zeitraum) und die Quellenangabe „Deutscher Wetterdienst (DWD)"

2. **AC-2 (keine Warnung → ausgeblendet, kein Layout-Sprung):**
   **Given** keine aktive Hitzewarnung für Berlin
   **When** die Seite lädt
   **Then** rendert das Banner nichts (kein reservierter Leerraum, kein Layout-Shift/CLS), die Seite steht ohne Lücke

3. **AC-3 (Abruf-Fehler → stille Degradation):**
   **Given** die DWD-Quelle ist nicht erreichbar, antwortet langsam (Timeout) oder liefert unparsbare Daten
   **When** der Abruf fehlschlägt
   **Then** degradiert die Seite still: kein Crash, kein SSR-Fehler, kein Banner, die restliche Landing Page rendert vollständig; der Fehlerpfad ist getestet

4. **AC-4 (TDD, ADR-012):**
   **Given** das TDD-Mandat
   **When** Parse-/Mapping-/Komponenten-Tests laufen
   **Then** sind abgedeckt: Berlin-Filter, `EC_II`-→-Stufe-Mapping (247/248), Mehrfach-Warnungen (höchste Stufe gewinnt), leere FeatureCollection → `null`, HTTP-Fehler → `null`, Timeout → `null`, unparsbarer Body → `null`, conditional Render (Banner an/aus), Stufen-Label-Text
   **And** `pnpm test:unit` 100 % grün

5. **AC-5 (WCAG + Quellen-Transparenz):**
   **Given** Barrierefreiheit (NFR1) und Haltung (NFR8)
   **When** das Banner sichtbar ist
   **Then** trägt es eine Text-Alternative (Warnstufe als Text, nicht nur Farbe), ein `@lucide/svelte`-Icon mit `aria-hidden`, eine Live-Region (`role="status"`, `aria-live="polite"`), ausreichenden Kontrast, und die DWD-Quelle ist verlinkt; DE-only, kein i18n-Key, keine em-dashes

## Tasks / Subtasks

- [ ] **Task 1: DWD-Warnlage-Parser + Proxy (Server-Lib)** (AC: #1, #3, #4)
  - [ ] 1.1 (RED) `src/lib/server/dwd-warnings.test.ts`: Fixture-getriebene Tests gegen eine gespeicherte DWD-WFS-GeoJSON (Berlin starke Hitze, Berlin extreme Hitze, Berlin keine Hitze, leere FeatureCollection, anderer Bezirk ohne Berlin-Match). Erwartung: typed `HeatWarning | null`. Plus: HTTP-non-200 → `null`, Timeout (AbortController) → `null`, unparsbarer Body → `null`.
  - [ ] 1.2 (GREEN) `src/lib/server/dwd-warnings.ts`: `fetchBerlinHeatWarning(): Promise<HeatWarning | null>`. WFS-URL bauen (`maps.dwd.de`, `typeName=dwd:Warnungen_Gemeinden`, `outputFormat=application/json`, `CQL_FILTER=EC_II IN(247,248)`), `fetch` mit `AbortController`-Timeout (5000 ms, Konstante analog `geocode.ts`), Berlin-Feature per `NAME` filtern, `EC_II`-→-Stufe mappen (247 = `'stark'`, 248 = `'extrem'`), bei mehreren Warnungen höchste Stufe wählen, Headline/Zeitraum/Quelle extrahieren. `try/catch` um den gesamten Pfad, jeder Fehler → `null` (nie throw). Optionaler kurzer In-Memory-Cache (TTL ~10 min, `LRUCache` analog `geocode.ts`), damit Reloads die DWD-Quelle nicht hämmern.
  - [ ] 1.3 (GREEN) Pure Mapping-Helfer `EC_II → HeatLevel` und `HeatLevel → Label` als testbare Funktionen, kein `any`, Datei < 200 Zeilen.

- [ ] **Task 2: Remote-Query-Boundary** (AC: #1, #3, #4)
  - [ ] 2.1 (RED) Test, dass die Remote-Query `getBerlinHeatWarning` ein `HeatWarning | null` zurückgibt und Fehler nicht propagiert (degradiert zu `null`).
  - [ ] 2.2 (GREEN) `src/lib/data/dwd-warnung.remote.ts`: `export const getBerlinHeatWarning = query(async (): Promise<HeatWarning | null> => fetchBerlinHeatWarning());` (ADR-009-Muster, analog `geocode.remote.ts`, keine Eingabe-Args, daher Schema optional/leer).
  - [ ] 2.3 Typen `HeatWarning`, `HeatLevel` in `src/lib/data/types.ts` (oder co-located `dwd-warnung.types.ts`) ergänzen, exportiert über `$lib/data`.

- [ ] **Task 3: Banner-Komponente** (AC: #1, #2, #5, #4)
  - [ ] 3.1 (RED) `src/lib/components/kuehle-orte/dwd-hitzewarn-banner.svelte.test.ts` (Muster: `vitest-browser-svelte` + `vitest/browser`, analog `data-stand-banner.svelte.test.ts`): Render mit `warning=stark` → Stufentext „Starke Hitze" + DWD-Quelle sichtbar; `warning=extrem` → „Extreme Hitze"; `warning=null` → Komponente rendert leer (kein DOM-Knoten, kein reservierter Platzhalter); `role="status"` + `aria-live="polite"` gesetzt; Icon `aria-hidden`.
  - [ ] 3.2 (GREEN) `dwd-hitzewarn-banner.svelte` (Svelte 5 Runes, `@lucide/svelte` `TriangleAlert`): Props `{ warning: HeatWarning | null }`. `{#if warning}` umschließt das gesamte Banner → kein Layout-Sprung bei Normallage. Stufe als Text + Farbe (Design-Tokens, `bg-state-warning`/`bg-state-danger` o. ä.), Kurzinfo, „Deutscher Wetterdienst (DWD)" als verlinkte Quelle. Datei < 200 Zeilen, DE-only, keine em-dashes.

- [ ] **Task 4: Einbau in die Landing Page** (AC: #1, #2, #3)
  - [ ] 4.1 In `src/routes/(with-header)/kuehle-orte/+page.svelte` (Story 16.1) oben die Warnlage abrufen (`await getBerlinHeatWarning()`, ADR-010 experimental-async) und `<DwdHitzewarnBanner {warning} />` als erstes Seitenelement rendern.
  - [ ] 4.2 Sicherstellen: Schlägt der Abruf fehl, ist `warning === null`, das Banner rendert nichts, die Seite bleibt intakt (AC-3 End-to-End).

- [ ] **Task 5: Abschluss** (AC: #4, #5)
  - [ ] 5.1 `pnpm test:unit -- --run` grün, `pnpm check` 0 Errors.
  - [ ] 5.2 Quellen-Transparenz-Abschnitt (Story 16.4) um „DWD-Hitzewarnung" + Lizenz-Hinweis ergänzen, falls bereits vorhanden; sonst hier nur Quellenangabe im Banner.

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-30)

- **Keine `/kuehle-orte`-Route vorhanden** (`find src/routes -path '*kuehle*'` leer). Diese Story setzt Story 16.1 voraus oder hängt das Banner in derselben PR ein, in der 16.1 die Route schafft.
- **Laufzeit-Fetch-Muster existiert:** `src/lib/server/geocode.ts` (Timeout via `TIMEOUT_MS = 5000`, `LRUCache` TTL, `mapToSuggestion`, `try/catch`-Degradation) + Boundary `src/lib/data/geocode.remote.ts` (`query(...)` aus `$app/server`, ADR-009). Exakt das Muster, das hier gespiegelt wird, keine neue Infrastruktur.
- **Banner-Komponenten-Muster:** `src/lib/components/atlas/inspector-panel/data-stand-banner.svelte` (Svelte 5 Runes, `@lucide/svelte` `Info`-Icon `aria-hidden`, Design-Tokens `text-ink-subtle`, `bg-state-warning/15`, `data-testid`). Test `data-stand-banner.svelte.test.ts` nutzt `vitest-browser-svelte` `render` + `vitest/browser` `page.getByTestId` → Vorlage für `dwd-hitzewarn-banner.svelte.test.ts`.
- **DWD-Schnittstelle live recherchiert 2026-06-30:**
  - Primär: GeoServer WFS `https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=dwd:Warnungen_Gemeinden&outputFormat=application/json`. GeoJSON-FeatureCollection, `properties` u. a. `NAME`, `EC_II`, `HEADLINE`, `DESCRIPTION`, `ONSET`/`EXPIRES`, `EVENT`, `SEVERITY`. Hitze-Codes `EC_II` 247 (starke Hitze) / 248 (extreme Hitze). CQL-Filter `EC_II IN(247,248)` möglich.
  - Alternative (Fallback-Option, falls WFS instabil): `https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json`, JSONP `warnWetter.loadWarnings({...})`, keyed nach Warncell-ID, Felder `start/end/type/level/event/headline/description/state/regionName`. Nachteil: JSONP-Unwrap nötig, Hitze nur saisonal befüllt. Entscheidung: WFS-GeoJSON, weil sauberes JSON ohne JSONP-Entpacken und expliziter `EC_II`-Hitze-Code.
  - Berlin-Selektion: `NAME`-Match auf das Berliner Gemeinde-Feature. Warncell-ID für „Stadt Berlin" (häufig zitiert: `105113000`) im Dev live verifizieren, nicht blind hartkodieren.
- **Allowlist:** `scripts/lib/allowlist.ts` ist die **Build-Zeit**-Allowlist (`opendata.dwd.de` bereits enthalten). Dieser Abruf läuft zur **Laufzeit** (Server-Endpoint/Remote, analog `nominatim.openstreetmap.org` in `geocode.ts`, das ebenfalls nicht auf der Build-Allowlist steht). Daher **keine Allowlist-Änderung nötig**. `maps.dwd.de` ist der Laufzeit-Host.

### Design-Entscheidung: Laufzeit-Proxy + Remote-Query, kein Build-Layer

Eine Warnlage ist flüchtig, kein gehashter Datensatz. Sie gehört nicht in `fetch-static.ts`/MANIFEST, sondern hinter eine Remote-Query mit serverseitigem Proxy (ADR-009). Der Server fängt jeden Fehler ab und liefert `null`, damit die stille Degradation (AC-3) am Boundary garantiert ist und der Client nur „Warnung ja/nein" kennt. Kurzer In-Memory-Cache (~10 min, DWD aktualisiert höchstens alle 10 min) schont die DWD-Quelle.

**Kein Layout-Sprung (AC-2):** Das gesamte Banner steht in `{#if warning}`. Bei Normallage existiert kein DOM-Knoten und kein reservierter Höhen-Platzhalter, also kein CLS. Das ist die einfachste robuste Lösung gegen Layout-Shift, kein `visibility:hidden` mit fixer Höhe.

**Stufen-Mapping:** `EC_II` 247 → `'stark'` („Starke Hitze"), 248 → `'extrem'` („Extreme Hitze"). Bei mehreren aktiven Warnungen für Berlin gewinnt die höhere Stufe. Visuell: `stark` = Warn-Token (gelb/orange), `extrem` = Danger-Token (rot), jeweils mit Text-Label, nie nur Farbe (UX-DR3-Geist, WCAG).

### Was nicht brechen darf

- **Landing Page muss ohne DWD rendern.** Fällt `maps.dwd.de` aus, ist `warning === null`, Banner weg, Rest der Seite vollständig. Kein SSR-Crash, kein unhandled rejection.
- **Kein Layout-Shift bei Normallage.** Keine reservierte Banner-Höhe, kein leeres Wrapper-Element mit Padding.
- **Keine Build-Pipeline berührt.** `fetch-static.ts`, `sources.ts`, MANIFEST, `build-kuehle-orte.ts` bleiben unangetastet. Reiner Laufzeit-Pfad.
- **Bestehendes Geocode-Muster nicht verändern.** Neue Lib daneben, kein Eingriff in `geocode.ts`/`rate-limit.ts`.
- **Quellenangabe nie weglassen.** GeoNutzV/DWD verlangt Attribution „Deutscher Wetterdienst" sobald Daten gezeigt werden.

## References

- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md] (Story 16.2, Zeilen 307-325; FR15 Zeile 33; UX-DR6 Zeile 67; NFR1/NFR9 Zeilen 42, 50)
- [Source: src/lib/server/geocode.ts] (Laufzeit-Proxy: `TIMEOUT_MS`, `LRUCache`, `try/catch`-Degradation, `buildUrl`, Muster für `dwd-warnings.ts`)
- [Source: src/lib/data/geocode.remote.ts] (`query(...)` aus `$app/server`, ADR-009-Boundary, Muster für `dwd-warnung.remote.ts`)
- [Source: src/lib/components/atlas/inspector-panel/data-stand-banner.svelte] (Svelte-5-Banner, `@lucide/svelte` `Info` `aria-hidden`, Design-Tokens, Muster für `dwd-hitzewarn-banner.svelte`)
- [Source: src/lib/components/atlas/inspector-panel/data-stand-banner.svelte.test.ts] (`vitest-browser-svelte` `render` + `vitest/browser` `page.getByTestId`, Test-Muster)
- [Source: src/routes/api/geocode/+server.ts] (Endpoint-Variante mit `error`/`timeout`/`upstream_error`-Mapping, falls Endpoint statt Remote gewählt wird)
- [Source: scripts/lib/allowlist.ts] (Build-Zeit-Allowlist, NICHT für Laufzeit-Fetch zuständig, keine Änderung nötig)
- [Source: docs/adr/ADR-009-remote-functions.md] (Remote-Functions-Mandat)
- [Source: docs/adr/ADR-012-tdd-mandate.md] (TDD-Mandat)
- DWD GeoServer WFS: `https://maps.dwd.de/geoserver/dwd/ows` `typeName=dwd:Warnungen_Gemeinden` `outputFormat=application/json`, `EC_II` 247/248 (recherchiert 2026-06-30, hitzewarnungen.de/einbindung_homepage.jsp)
- DWD Warnapp-JSON (Fallback): `https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json` (JSONP `warnWetter.loadWarnings`)

## Dev Agent Record

### Agent Model Used

_(vom Dev-Agent auszufüllen)_

### Completion Notes List

_(vom Dev-Agent auszufüllen)_

### File List

**Erwartet neu:**
- `src/lib/server/dwd-warnings.ts` (+ `dwd-warnings.test.ts`)
- `src/lib/data/dwd-warnung.remote.ts` (+ Test)
- `src/lib/components/kuehle-orte/dwd-hitzewarn-banner.svelte` (+ `.svelte.test.ts`)
- `src/lib/server/__fixtures__/dwd-warnungen-*.json` (WFS-GeoJSON-Fixtures: stark, extrem, leer, anderer Bezirk)

**Erwartet geändert:**
- `src/lib/data/types.ts` (Typen `HeatWarning`, `HeatLevel`)
- `src/routes/(with-header)/kuehle-orte/+page.svelte` (Banner-Einbau, Story 16.1)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (16-2 Status)

### Debug Log References

_(vom Dev-Agent auszufüllen)_

## Change Log

- 2026-06-30: Story 16.2 erstellt (ready-for-dev). Live-DWD-Hitzewarn-Banner für die Kühle-Orte-Landing-Page. Laufzeit-Proxy (`maps.dwd.de` WFS, `EC_II` 247/248) + Remote-Query + conditional Banner ohne Layout-Sprung, stille Degradation bei Fehler. TDD. DWD-Schnittstelle live recherchiert.
