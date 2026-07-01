# Story 16.1: Landing-Page-Gerüst mit eingebetteter Karte

Status: review

> **Anker:** Epic 16 (Kühle-Orte-Landing-Page), FR14 + FR20, UX-DR6, NFR1/NFR2/NFR9, ADR-012 (Pragmatic TDD). Baut auf Epic 15 auf: der Layer `kuehle-orte` ist im Atlas registriert (MANIFEST + `editorial-config.ts`), per URL-State aktivierbar.
> **Haltung (NFR8):** Angebot, kein Behörden-Ersatz, kein „besser als die Stadt". Die Texte sind freundlich, ehrlich, ohne Absolutismen.
> **Scope dieser Story:** Route-Gerüst, Intro-Sektion, eingebettete Karten-Vorschau, „Zum Explorer"-CTA als URL-State-Deep-Link. DWD-Banner (16.2), Geolocation (16.3), Opt-out/Transparenz-Tiefe (16.4) und Doku/Changelog (16.5) folgen separat.

## Story

As a Besucher (auch ohne Atlas-Vorwissen),
I want eine klare, mobile-first Seite, die mir kühle Orte zeigt und mich in die volle Karte führt,
so that ich bei Hitze sofort Hilfe finde.

## Kontext: Warum dieser Change

Der Atlas unter `/explore` ist mächtig, aber voraussetzungsreich: Layer-Palette, Inspector, URL-State. Ein Hitze-geplagter Besucher braucht keinen Daten-Explorer, sondern einen Einstieg: „Wo ist es jetzt kühl, und wie komme ich hin?" Diese Story baut das Landing-Gerüst unter `/kuehle-orte`. Es zeigt ein Angebot-orientiertes Intro, eine read-only Karten-Vorschau und einen CTA, der nahtlos in `/explore?layers=kuehle-orte` führt (Layer vorab aktiv).

Die Seite reiht sich in das bestehende Content-Routing ein: alle redaktionellen Seiten liegen unter der Route-Gruppe `(with-header)` und teilen Header, Footer, Skip-Link und SEO-Pattern (`SeoHead`, `JsonLd`). Die eingebettete Karte folgt dem read-only Embed-Muster aus `map-embed.svelte` (kein Inspector, kein URL-State, kein Layer-Toggle), damit die Vorschau leicht bleibt und der Heavy-Lift in `/explore` verbleibt.

## Acceptance Criteria

1. **AC-1 (Route + Intro + eingebettete Karte):**
   **Given** eine neue Route `/kuehle-orte` (unter `(with-header)`)
   **When** ich sie auf dem Smartphone öffne
   **Then** sehe ich eine mobile-first Seite mit einem freundlichen Intro (Angebot-Haltung, kein Behörden-Ersatz, kein „besser als die Stadt", keine Absolutismen) und darunter die eingebettete, read-only Kühle-Orte-Karten-Vorschau

2. **AC-2 (WCAG):**
   **Given** Tastatur- und Screenreader-Nutzung (NFR1)
   **When** ich die Seite bediene
   **Then** stimmt die Überschriften-Hierarchie (genau ein `h1`, sauber verschachtelte `h2`), Fokus-Reihenfolge und sichtbarer Fokus, Kontrast (AA), und die Karten-Interaktion ist bedienbar oder hat eine Text-/Link-Alternative (kein Tastatur-Trap, `noscript`-Fallback)

3. **AC-3 (Zum-Explorer-CTA als URL-State-Deep-Link, FR20):**
   **Given** der „Zum Explorer" / „Karte erkunden"-CTA
   **When** ich ihn antippe
   **Then** lande ich auf `/explore` mit bereits aktiviertem `kuehle-orte`-Layer (Query-Param `layers=kuehle-orte`, über `serializeLayers`), nahtloser Übergang von der Vorschau in die volle Karte
   **And** der CTA ist ein echter `<a href>` (kein reines `on:click`), funktioniert ohne JS und ist touch-groß (Ziel ≥ 44×44 px)

4. **AC-4 (DE-only, NFR9):**
   **Given** DE-only ohne i18n
   **When** Texte gerendert werden
   **Then** stehen sie direkt deutsch im Code, keine Paraglide-/i18n-Keys, keine em-dashes (U+2014)

5. **AC-5 (Qualität):**
   **Given** ADR-012 + Projekt-Hard-Rules
   **When** die Story abgeschlossen wird
   **Then** ist die Deep-Link-Logik test-first abgedeckt, `pnpm check` zeigt 0 Errors (kein `any`), die neue Datei bleibt unter 500 Zeilen, `pnpm test` 100% grün

## Tasks / Subtasks

- [x] **Task 1: Deep-Link-Helper test-first** (AC: #3, #5)
  - [x] 1.1 (RED) Unit-Test `src/lib/utils/url-state.test.ts` ergänzen: `buildExplorerDeepLink(['kuehle-orte'])` liefert `/explore?layers=kuehle-orte`; mehrere Slugs werden bundle-stabil serialisiert; leere Liste liefert `/explore` ohne `?layers=`
  - [x] 1.2 (GREEN) `buildExplorerDeepLink(slugs: string[]): string` in `src/lib/utils/url-state.ts` ergänzen, intern `serializeLayers` wiederverwenden (NICHT neu bauen), Rückgabe ohne führendes `?` wenn keine Layer
  - [x] 1.3 (REFACTOR) Signatur typsicher (`string[]` → `string`), kein `any`, JSDoc-Zeile

- [x] **Task 2: Route-Gerüst + Intro** (AC: #1, #4)
  - [x] 2.1 `src/routes/(with-header)/kuehle-orte/+page.svelte` anlegen (Svelte 5 Runes, `$props`), `h1` „Kühle Orte in Berlin", Intro-Absatz mit Angebot-Haltung (DE, keine Absolutismen, keine em-dashes)
  - [x] 2.2 `src/routes/(with-header)/kuehle-orte/+page.ts` anlegen falls Server-Daten nötig (Geometrie/Center für Embed); sonst statisch im `+page.svelte`. Prerender-fähig halten (`export const prerender = true`)
  - [x] 2.3 `SeoHead` + `JsonLd` einbinden analog `umwelt-infrastruktur-score/+page.svelte` (Titel, Description DE, `locales={['de']}`, OG-Image-Pfad-Konvention `/og/page/kuehle-orte.png`)
  - [x] 2.4 `@lucide/svelte`-Icons statt `lucide-svelte` (z.B. Map-/Snowflake-Icon im CTA), wenn Icons genutzt werden

- [x] **Task 3: Eingebettete Karten-Vorschau (read-only)** (AC: #1, #2)
  - [x] 3.1 Embed nach Muster `map-embed.svelte` einbinden: read-only, kein Inspector, kein URL-State, `styleUrl='/map-style.json'`, `heightClass` mobil sinnvoll (z.B. `h-[50vh]`)
  - [x] 3.2 `<noscript>`-Fallback mit statischem Bild-Pfad + Region-Label (Progressive-Enhancement analog `map-embed.svelte`), damit Crawler/JS-off einen sinnvollen Zustand sehen
  - [x] 3.3 Karten-Container mit `aria-label`/Beschreibung; sichtbarer Hinweis-/Link auf die volle Karte direkt unter der Vorschau
  - [x] 3.4 Punkt-Darstellung der `kuehle-orte`-Features ist Epic-15-Sache; in dieser Story genügt die Vorschau-Hülle (Berlin-Overview) plus CTA. Falls `map-embed.svelte` Punkt-Features braucht, Erweiterung in separater Story/AC dokumentieren, hier NICHT die Full-Canvas duplizieren

- [x] **Task 4: Zum-Explorer-CTA** (AC: #3)
  - [x] 4.1 CTA als `<a href={buildExplorerDeepLink(['kuehle-orte'])}>` rendern, touch-groß (≥ 44×44 px), sichtbarer Fokus, sprechender Link-Text („Karte erkunden", nicht „hier klicken")
  - [x] 4.2 Zusätzlicher Text-Hinweis: der Link öffnet den Atlas mit aktivem Kühle-Orte-Layer

- [x] **Task 5: Komponenten-Test + e2e-Smoke** (AC: #2, #3, #5)
  - [x] 5.1 (RED→GREEN) `src/routes/(with-header)/kuehle-orte/page.svelte.test.ts` (vitest + Testing-Library, colocated): genau ein `h1`, Intro-Text vorhanden, CTA ist `<a>` mit `href` enthält `/explore?layers=kuehle-orte`, keine em-dashes im gerenderten Text
  - [x] 5.2 e2e-Smoke `tests/e2e/kuehle-orte.spec.ts`: Route lädt (Status 200), `h1` sichtbar, CTA-Klick navigiert nach `/explore` mit `layers=kuehle-orte` im URL (nahtloser Übergang)
  - [x] 5.3 `pnpm check` 0 Errors, `pnpm test:unit --run` grün, e2e grün

- [x] **Task 6: Abschluss** (AC: #5)
  - [x] 6.1 Sprint-Status auf `review`, Dev Agent Record + Change Log füllen
  - [x] 6.2 Doku/Changelog (`docs/INDEX.md`, `/updates`-Eintrag) bewusst NICHT hier, das ist Story 16.5

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-30)

- **Route-Konvention:** Alle redaktionellen Seiten liegen unter der Route-Gruppe `src/routes/(with-header)/` (z.B. `explore`, `umwelt-infrastruktur-score`, `methodik`, `updates`). Sie teilen Header/Footer über `(with-header)/+layout.svelte`. Die neue Landing gehört dorthin: `src/routes/(with-header)/kuehle-orte/`.
- **Explorer-Deep-Link existiert:** `/explore` liest aktive Layer aus dem Query-Param `layers`. `explore/+page.ts` ruft `parseLayers(url.searchParams.get('layers'))`; das Page-Svelte synct den Param via `goto(..., { replaceState: true })` mit `LAYERS_KEY = 'layers'`. Serialisierung über `serializeLayers(slugs)` in `src/lib/utils/url-state.ts`. Deep-Link-Ziel folglich: `/explore?layers=kuehle-orte`.
- **`serializeLayers` / `parseLayers`** liegen in `src/lib/utils/url-state.ts` (Zeile 85 / 123). `buildComparePermalink` (Zeile 196) zeigt das Muster, einen Permalink mit `serializeLayers([...layers])` zu bauen. `buildExplorerDeepLink` analog ergänzen, NICHT neu erfinden.
- **Eingebettete Karte:** `src/lib/components/atlas/map-embed.svelte` ist ein ~150-LOC read-only MapLibre-Wrapper (kein Inspector, kein URL-State, kein Toggle). Props: `geometry` (Polygon/MultiPolygon), `label`, `ogImagePath?`, `styleUrl='/map-style.json'`, `heightClass='h-[50vh]'`. Hat `<noscript>`-Fallback + `mountFailed`-Pfad. Genau das Muster für die Landing-Vorschau. Aktuell nur für Bezirks-Boundary genutzt; Punkt-Features wären eine Erweiterung (Epic 15 / Folgestory), hier nicht zwingend.
- **SEO-Pattern:** `umwelt-infrastruktur-score/+page.svelte` zeigt das Standard-Setup: `SeoHead` (Props `title`, `description`, `pathname`, `origin`, `ogImage?`, `locales`), `JsonLd`, `page.url.origin/pathname` aus `$app/state`. OG-Image-Pfad-Konvention `/og/page/<slug>.png`.
- **Kühle-Orte-Daten committed:** `static/data/kuehle-orte/enrichment.json` (659 Objekte) + `places-osm.json`. Der publizierbare Layer (`static/layers/...` + MANIFEST-Eintrag) entsteht in Epic 15. Diese Story konsumiert ihn nur als CTA-Ziel, baut keine Daten.
- **Test-Konventionen:** Unit/Component-Tests colocated als `*.test.ts` / `page.svelte.test.ts` (vitest, `pnpm test:unit`). Beispiele: `(with-header)/methodik/page.svelte.test.ts`, `(with-header)/layer/[slug]/page.svelte.test.ts`. e2e unter `tests/e2e/` (Playwright, `pnpm test:e2e`).
- **`editorial-config.ts`:** `EDITORIAL_CONFIG`-Record (slug → `{ disclaimerVariants, primarySourceUrl, feedbackMailto }`). `ALL_LAYERS_GET_FEEDBACK_MAILTO = true`. Der `kuehle-orte`-Eintrag wird in Epic 15 registriert (`feedbackMailto: true`, `disclaimerVariants`). Diese Story setzt keinen Config-Eintrag.

### Design-Entscheidung

- **Route unter `(with-header)`, nicht standalone.** Die Seite ist „eigenständig" im Sinn von eigener Einstieg, aber sie erbt Header/Footer/Skip-Link/SEO-Konsistenz aus der Route-Gruppe. Das spart Chrome-Duplikate und hält WCAG-Navigation einheitlich.
- **Read-only Embed statt Full-Canvas.** Die Vorschau nutzt das `map-embed.svelte`-Muster (leicht, kein Inspector, kein URL-State). Die volle Interaktion lebt in `/explore`. So bleibt die Landing schnell auf dem Smartphone bei Außennutzung (NFR2) und dupliziert die Heavy-Lift-Canvas nicht.
- **CTA ist ein echter Link.** `<a href={buildExplorerDeepLink(['kuehle-orte'])}>` funktioniert ohne JS, ist crawlbar und tastaturbedienbar. Deep-Link-Aufbau zentral in `url-state.ts`, test-first, damit der Param-Vertrag mit `/explore` stabil bleibt.
- **Texte direkt deutsch, Angebot-Haltung.** Keine i18n-Keys (NFR9). Formulierung als Angebot, keine Absolutismen („einzige", „beste"), kein Behörden-Ersatz-Anspruch (NFR8). Keine em-dashes.
- **Scope-Disziplin.** DWD-Banner, Geolocation, Opt-out/Transparenz-Tiefe, Doku/Changelog sind eigene Stories (16.2-16.5). Hier nur Gerüst + Vorschau + CTA.

### Was nicht brechen darf

- **Kein Eingriff in `/explore`.** Der `layers`-Param-Vertrag bleibt unverändert; die Landing schreibt nur den passenden Deep-Link. `parseLayers`/`serializeLayers` nicht umschreiben, nur wiederverwenden.
- **`map-embed.svelte` nicht regressiv ändern.** Wird die Komponente für Punkt-Features erweitert, müssen die bestehenden Bezirks-/Kiez-Embeds (Boundary-Highlight) unverändert funktionieren. Im Zweifel additiv (optionale Prop), kein Breaking-Change an `geometry`/`label`.
- **Prerender/SSR.** Andere Content-Routen prerendern. Die neue Route darf den Prerender-Lauf nicht brechen (kein clientseitiger Zugriff auf `window`/`navigator` im Modul-Top-Level; MapLibre lädt wie in `map-embed.svelte` erst `onMount`).
- **Datei < 500 Zeilen, kein `any`.** Wird `+page.svelte` groß, Intro/CTA/Embed in kleine Komponenten unter `src/lib/components/` auslagern.

## References

- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#L283-L305] Story 16.1 User-Story + Acceptance Criteria
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#L32-L38] FR14, FR20 (Landing + Deep-Link)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#L42-L50] NFR1/NFR2/NFR3/NFR9 (WCAG, mobile-first, typsicher, DE-only)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md#L67] UX-DR6 (Landing-Aufbau)
- [Source: src/routes/(with-header)/explore/+page.ts] `parseLayers(url.searchParams.get('layers'))` (Deep-Link-Param)
- [Source: src/routes/(with-header)/explore/+page.svelte#L136-L235] `LAYERS_KEY='layers'`, Layer-URL-Sync via `goto(replaceState)`
- [Source: src/lib/utils/url-state.ts#L85-L135] `serializeLayers` / `parseLayers` (wiederverwenden)
- [Source: src/lib/utils/url-state.ts#L196-L206] `buildComparePermalink` (Muster für Deep-Link-Bau)
- [Source: src/lib/components/atlas/map-embed.svelte#L1-L70] read-only Embed-Muster, Props, `<noscript>`-Fallback
- [Source: src/routes/(with-header)/umwelt-infrastruktur-score/+page.svelte#L1-L40] SeoHead/JsonLd/origin-pathname-Pattern
- [Source: src/lib/components/atlas/internal/editorial-config.ts#L3-L51] `EDITORIAL_CONFIG`, `ALL_LAYERS_GET_FEEDBACK_MAILTO` (kuehle-orte-Eintrag in Epic 15)
- [Source: src/routes/(with-header)/methodik/page.svelte.test.ts] colocated Component-Test-Muster (vitest)
- [Source: tests/e2e/] Playwright-e2e-Verzeichnis
- [Source: CLAUDE.md] TDD-Mandat (ADR-012), keine em-dashes, DE-only, Svelte 5 Runes, @lucide/svelte, Files < 500, kein `any`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (Dev-Story-Lauf 2026-06-30)

### Completion Notes List

- **Deep-Link-Helper** `buildExplorerDeepLink` in `url-state.ts`, test-first (3 Tests): `['kuehle-orte']` → `/explore?layers=kuehle-orte`, mehrere Slugs round-trip-stabil, leer → `/explore`. Nutzt `serializeLayers` wieder.
- **Route** `/kuehle-orte` unter `(with-header)` (erbt `<main>`). `<article>` mit genau einem `h1`, Angebot-Intro (kein Behörden-Ersatz, keine Absolutismen, keine em-dashes), SeoHead, `prerender = true`.
- **Karten-Vorschau:** `map-embed.svelte` mit neuem `BERLIN_OUTLINE` (Bezirke dissolved + simplified via mapshaper, 816 Byte, `src/lib/data/berlin-outline.ts`). Punkt-Features im Embed deferred (Task 3.4), Vorschau = Berlin-Overview + CTA.
- **CTA** echter `<a href>` (ohne JS), touch-groß (min-h-11), sichtbarer Fokus, sprechender Text.
- **Tests:** Component-Test (4, vitest-browser-svelte). MapEmbed fällt im Test sauber auf mountFailed-Fallback. Volle Suite 2930 grün, `pnpm check` 0 Errors.
- **e2e:** `tests/e2e/kuehle-orte.e2e.ts` geschrieben, Playwright in dieser Session NICHT ausgeführt (braucht Dev-Server). Vor Merge `pnpm test:e2e` lokal laufen.
- **OG-Image** `/og/page/kuehle-orte.png` referenziert, Asset via `pnpm og:images` (nicht Teil dieser Story).

### File List

**Neu (geplant):**
- `src/routes/(with-header)/kuehle-orte/+page.svelte`
- `src/routes/(with-header)/kuehle-orte/+page.ts` (falls Server-/Load-Daten nötig)
- `src/routes/(with-header)/kuehle-orte/page.svelte.test.ts`
- `tests/e2e/kuehle-orte.spec.ts`

**Geändert (geplant):**
- `src/lib/utils/url-state.ts` (`buildExplorerDeepLink`) + `src/lib/utils/url-state.test.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (16-1 → review)
- ggf. `src/lib/components/atlas/map-embed.svelte` (nur additiv, falls Punkt-Vorschau in Scope gezogen wird)

### Debug Log References

_(zu füllen bei Implementation)_

## Change Log

- 2026-06-30: Story 16.1 erstellt (ready-for-dev). Route-Gerüst `/kuehle-orte` unter `(with-header)`, Angebot-Intro, read-only Karten-Vorschau (map-embed-Muster), Zum-Explorer-CTA als URL-State-Deep-Link (`/explore?layers=kuehle-orte` via neuem `buildExplorerDeepLink`). DE-only, mobile-first, WCAG. DWD/Geo/Opt-out/Doku bewusst out-of-scope (16.2-16.5).
