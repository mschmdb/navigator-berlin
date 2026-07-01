# Story 16.4: Opt-out-Mail für Institutionen und Quellen-Transparenz

Status: ready-for-dev

> **Anker:** Epic 16 (Kühle-Orte-Landing-Page), FR17 (Mail-Opt-out für Institutionen), UX-DR6 (Landing-Aufbau: ... Transparenz/Quellen, Opt-out-Mail), NFR8 (Haltung: Angebot, keine Absolutismen, Quellen transparent), NFR9 (DE-only), ADR-012 (TDD).
> **Abhängigkeit:** Story 16.1 (Landing-Gerüst) hat die Route `/kuehle-orte` angelegt. Diese Story setzt den Transparenz-Abschnitt + Opt-out-Mail ans Seitenende dieser Route. Falls 16.1 noch nicht gelandet ist, im Dev-Story-Workflow vor Implementation klären.
> **Reuse statt Neubau:** Mailto-Aufbau folgt dem bestehenden `buildErrorReportMailto` (`src/lib/utils/contact.ts`), Link-Optik dem `error-feedback-mailto.svelte`. Quellen-Naming folgt `home-data-sources.ts` und `/lizenzen`.

## Story

As a Institution oder transparenter Anbieter,
I want einen einfachen Austragungs-Weg und offen genannte Quellen,
so that das Angebot fair und nachvollziehbar bleibt.

## Kontext: Warum dieser Change

Die Kühle-Orte-Daten stammen aus OpenStreetMap (ODbL) plus einer redaktionellen Anreicherung (`enrichment.json`, 659 Objekte). Eine Institution kann gelistet sein, ohne das zu wollen. FR17 fordert einen niedrigschwelligen Austragungs-Weg per Mail. Parallel verlangt NFR8 eine ehrliche Haltung: navigator.berlin liefert ein Angebot, keinen Stadt-Ersatz, keine Bestenliste. Der Transparenz-Abschnitt nennt die drei Quellen-Stränge (OSM/ODbL, redaktionelle Anreicherung, DWD-Hitzewarnung) und die Angebot-Haltung am Seitenende. Beides nutzt vorhandene Mechanik wieder: der Mailto-Builder spiegelt `buildErrorReportMailto`, die Link-Optik den bestehenden Feedback-Link.

## Acceptance Criteria

1. **AC-1 (Opt-out-Mail-Entwurf):**
   **Given** eine Institution, die nicht gelistet sein will
   **When** sie den Opt-out-Mail-Link am Seitenende nutzt
   **Then** öffnet der Standard-Mail-Client einen vorbereiteten Entwurf an `hey@navigator.berlin` mit Betreff „Austragung kühler Ort" und vorstrukturiertem Body (Platz für Name, Adresse, Begründung), `mailto:` URL-encoded
   **And** der Link ist barrierefrei (Touch-Größe, `aria-label`, Fokus sichtbar, Text-Alternative zum Icon)

2. **AC-2 (Quellen-Transparenz):**
   **Given** der Transparenz-Abschnitt am Seitenende
   **When** ich ans Seitenende scrolle
   **Then** sind die drei Quellen-Stränge klar genannt: OpenStreetMap (Lizenz ODbL 1.0, „© OpenStreetMap-Contributors"), redaktionelle Anreicherung (geprüfte Eignung/Adresse/Score, Datenstand), Deutscher Wetterdienst (Hitzewarnung)
   **And** ein Verweis auf `/lizenzen` für die vollständige Lizenz-Übersicht

3. **AC-3 (Angebot-Haltung, keine Absolutismen):**
   **Given** NFR8
   **When** der Haltungs-Text gerendert wird
   **Then** formuliert er das Angebot (Hilfe bei Hitze), grenzt sich ab (kein Behörden-Ersatz, kein „besser als die Stadt"), nennt die Daten-Grenzen ehrlich (kann Lücken haben, lebt von Korrekturen)
   **And** keine Absolutismen („einzige", „vollständig", „garantiert", „beste") und keine em-dashes (U+2014)

4. **AC-4 (DE-only):**
   **Given** NFR9
   **When** Texte gerendert werden
   **Then** stehen sie direkt deutsch im Code, ohne i18n-Keys (kein Paraglide-Aufruf)

5. **AC-5 (TDD + Accessibility):**
   **Given** ADR-012 und WCAG (NFR1)
   **When** Tests laufen
   **Then** ist der Mailto-Builder (Betreff, Body-Struktur, Encoding) unit-getestet, der Transparenz-/Opt-out-Abschnitt smoke-getestet (Quellen-Namen, Opt-out-Link, `aria-label` vorhanden), kein Absolutismus-/em-dash-Leak in den getesteten Strings
   **And** `pnpm test` 100% grün, `pnpm check` 0 Errors

## Tasks / Subtasks

- [ ] **Task 1: Opt-out-Mailto-Builder (Util, test-first)** (AC: #1, #5)
  - [ ] 1.1 (RED) Test in `src/lib/utils/contact.test.ts` ergänzen: `buildOptOutMailto()` erzeugt `mailto:hey@navigator.berlin`, Betreff „Austragung kühler Ort", Body mit Name/Adresse/Begründung-Struktur, Subject + Body URL-encoded
  - [ ] 1.2 (GREEN) `buildOptOutMailto(ctx?: OptOutContext): string` in `src/lib/utils/contact.ts` ergänzen, `FEEDBACK_EMAIL` wiederverwenden, Encoding analog `buildErrorReportMailto`
  - [ ] 1.3 (RED) Test: kein em-dash (U+2014), kein Absolutismus-Token in Betreff/Body
- [ ] **Task 2: Transparenz-Content (DE-only, test-first)** (AC: #2, #3, #4, #5)
  - [ ] 2.1 (RED) Test in `src/lib/components/kuehle-orte/kuehle-orte-transparenz.test.ts`: drei Quellen-Stränge (OpenStreetMap/ODbL, redaktionelle Anreicherung, Deutscher Wetterdienst) im Content vorhanden, kein em-dash, kein Absolutismus-Token
  - [ ] 2.2 (GREEN) Content als typsicheres Modul `src/lib/components/kuehle-orte/transparenz-content.ts` (Quellen-Liste + Haltungs-Text), Naming an `home-data-sources.ts` angelehnt
- [ ] **Task 3: Transparenz-Abschnitt-Komponente** (AC: #1, #2, #3, #5)
  - [ ] 3.1 (RED) Smoke-Test `kuehle-orte-transparenz.svelte.test.ts`: rendert Quellen-Namen, `/lizenzen`-Link, Opt-out-Link mit `data-testid` + `aria-label`
  - [ ] 3.2 (GREEN) `src/lib/components/kuehle-orte/kuehle-orte-transparenz.svelte` (Svelte 5 Runes, `@lucide/svelte` `Mail`, < 200 LOC): rendert Haltungs-Text, Quellen-Liste, `/lizenzen`-Verweis, Opt-out-Link via `buildOptOutMailto`
  - [ ] 3.3 Heading-Hierarchie + Fokus-Styles WCAG-konform (Anlehnung `error-feedback-mailto.svelte`)
- [ ] **Task 4: Einbindung in die Landing-Route** (AC: #2, #3)
  - [ ] 4.1 (GREEN) Komponente ans Seitenende von `src/routes/(with-header)/kuehle-orte/+page.svelte` einhängen (unterhalb „in deiner Nähe", gemäß UX-DR6-Reihenfolge)
- [ ] **Task 5: Abschluss** (AC: #5)
  - [ ] 5.1 `pnpm test` grün, `pnpm check` 0 Errors, Dev Agent Record + Change Log gefüllt

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-30)

- **Mailto-Mechanik vorhanden:** `src/lib/utils/contact.ts` exportiert `FEEDBACK_EMAIL = 'hey@navigator.berlin'` und `buildErrorReportMailto(ctx)`. Subject + Body werden via `encodeURIComponent` gebaut, Zeilen aus einem `.filter(...)`-Array. Tests liegen in `src/lib/utils/contact.test.ts` (existiert). → `buildOptOutMailto` dort ergänzen, nicht neu erfinden.
- **Link-Optik vorhanden:** `src/lib/components/atlas/error-feedback-mailto.svelte` zeigt das Muster: `@lucide/svelte` `Mail`-Icon (`aria-hidden`), `aria-label`, `data-testid`, Accent-Underline-Link. Für den Opt-out-Link spiegeln.
- **Quellen-Naming vorhanden:** `src/lib/content/home-data-sources.ts` nennt „OpenStreetMap" / Lizenz „ODbL 1.0". `/lizenzen` (`src/routes/(with-header)/lizenzen/+page.svelte`, Zeile 431 ff.) formuliert die Namensnennung „© OpenStreetMap-Contributors" und Share-Alike. Text daran angleichen, nicht abweichen.
- **Daten-Stränge:** `static/data/kuehle-orte/enrichment.json` (redaktionelle Anreicherung, 659 Objekte) und `places-osm.json` (OSM-Geometrie). DWD-Hitzewarnung kommt aus Story 16.2. Diese drei sind die zu nennenden Quellen.
- **Landing-Route:** `/kuehle-orte` existiert noch NICHT (`src/routes/(with-header)/` enthält sie 2026-06-30 nicht). Story 16.1 legt sie an. Diese Story hängt sich ans Seitenende. Bei fehlender Route: 16.1 zuerst.
- **DisclaimerVariant-Typ:** `editorial-types.ts` kennt `'legal' | 'seasonal' | ...`. Für diese Story nicht relevant (kein Atlas-Layer-Eintrag), reiner Landing-Content.

### Design-Entscheidung

- **Opt-out als eigener Builder, nicht Reuse von `buildErrorReportMailto`:** Der Error-Report ist ortsbezogen (Lat/Lng, Layer-Kontext). Opt-out ist institutions-bezogen (Name, Adresse, Begründung). Eigener Betreff, eigener Body → `buildOptOutMailto`. Gemeinsam bleibt `FEEDBACK_EMAIL` und das Encoding-Muster.
- **Content getrennt von Markup:** Quellen-Liste + Haltungs-Text als typsicheres `.ts`-Modul (`transparenz-content.ts`), damit die Strings unit-testbar sind (Absolutismus-/em-dash-Check) ohne DOM. Die `.svelte`-Komponente konsumiert nur.
- **Keine neue Tooltip-/Inspector-Infrastruktur:** reiner Landing-Abschnitt, kein Atlas-Layer-Hit. Inspector-Reuse betrifft Epic 15, hier nicht.
- **Haltungs-Text:** Angebot-Frame statt Vergleichs-Frame. Beispiel-Linie ohne Absolutismus: „Wir sammeln öffentlich zugängliche kühle Orte und prüfen sie redaktionell. Die Liste kann Lücken haben und lebt von Korrekturen." Kein „besser als die Stadt", kein „vollständig", kein „garantiert".

### Was nicht brechen darf

- Kein Eingriff in `buildErrorReportMailto` oder die bestehenden Tests in `contact.test.ts` (nur additiv ergänzen).
- Kein Eingriff in Atlas-Layer, `editorial-config.ts`, Inspector-Panel. Reiner Landing-Zusatz.
- `error-feedback-mailto.svelte` bleibt unverändert (Vorbild, nicht Ziel).
- Keine i18n-Keys einführen (NFR9). Paraglide bleibt für dieses Feature ungenutzt.
- Keine em-dashes (U+2014) in den neuen Strings; Forbidden-Token-Konvention (CLAUDE.md).

## References

- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#story-164] (User-Story + ACs, Zeilen 347-361)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#requirements] FR17 (Zeile 88), NFR8 (Zeile 49), NFR9 (Zeile 50), UX-DR6 (Zeile 67)
- [Source: src/lib/utils/contact.ts] `FEEDBACK_EMAIL`, `buildErrorReportMailto` (Zeile 1-27), Builder-Muster
- [Source: src/lib/utils/contact.test.ts] vorhandene Tests, hier `buildOptOutMailto` ergänzen
- [Source: src/lib/components/atlas/error-feedback-mailto.svelte] (Zeile 1-31), Link-/Icon-/aria-Muster
- [Source: src/lib/content/home-data-sources.ts] (Zeile 27-30), „OpenStreetMap" / „ODbL 1.0"
- [Source: src/routes/(with-header)/lizenzen/+page.svelte] (Zeile 431-439), „© OpenStreetMap-Contributors"
- [Source: static/data/kuehle-orte/enrichment.json], redaktionelle Anreicherung (Quellen-Strang 2)
- [Source: docs/adr/ADR-012-tdd-mandate.md], TDD-Scope
- [Source: _bmad-output/implementation-artifacts/14-0-kriminalitaetsatlas-layer-foundation.md], Story-Format-Vorbild

## Dev Agent Record

### Agent Model Used

_(beim Dev-Run ausfüllen)_

### Completion Notes List

_(beim Dev-Run ausfüllen)_

### File List

_(beim Dev-Run ausfüllen; erwartet)_

**Neu:**
- `src/lib/components/kuehle-orte/transparenz-content.ts` (+ `kuehle-orte-transparenz.test.ts`)
- `src/lib/components/kuehle-orte/kuehle-orte-transparenz.svelte` (+ `.svelte.test.ts`)

**Geändert:**
- `src/lib/utils/contact.ts` (+ `buildOptOutMailto`)
- `src/lib/utils/contact.test.ts` (+ Opt-out-Tests)
- `src/routes/(with-header)/kuehle-orte/+page.svelte` (Abschnitt eingehängt)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (16-4 → review)

### Debug Log References

_(beim Dev-Run ausfüllen)_

## Change Log

- 2026-06-30: Story 16.4 erstellt (ready-for-dev). Opt-out-Mailto-Builder (Reuse `contact.ts`) + Transparenz-Abschnitt (OSM/ODbL, redaktionelle Anreicherung, DWD) + Angebot-Haltung ohne Absolutismen, DE-only, TDD.
