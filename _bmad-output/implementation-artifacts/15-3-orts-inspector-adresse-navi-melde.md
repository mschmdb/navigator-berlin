# Story 15.3: Orts-Inspector mit Adresse, Navigation und Melde-Link

Status: ready-for-dev

> **Anker:** Epic 15 (Kühle Orte im Atlas), FR2/FR3/FR4/FR13, UX-DR1/UX-DR2. ADR-012 (Pragmatic TDD), NFR1 (WCAG), NFR3 (typsicher, <500 Zeilen), NFR9 (DE-only).
> **Reuse-Mandat:** Kein neuer Tooltip-Stack. Der `kuehle-orte`-Hit läuft durch das bestehende `layer-hit-row.svelte` und wird über den vorhandenen `customComponent`-Mechanismus (Vorbild `MauerSektorenDetail`) um Adresse, Navi-Buttons und Melde-Link erweitert.
> **Abhängigkeit:** Story 15.1 liefert die Navi-Properties (`navi_google`, `navi_apple`) und die Tooltip-Felder (`name`, `typ`, `address`, `id`) am Feature. Story 15.2 setzt `feedbackMailto`/Melde-Mechanik auf. Diese Story konsumiert beides und rendert es barrierefrei.

## Story

As a hitzegeplagter Nutzer,
I want pro kühlem Ort die genaue, kopierbare Adresse, je einen Google- und Apple-Navi-Link und einen Melde-Link,
so that ich sofort hinfinde und einen Fehler im Eintrag melden kann.

## Kontext: Warum dieser Change

Der `kuehle-orte`-Layer (Story 15.0/15.1) bringt POI-Features mit Name, Typ, verifizierter Adresse, vorgerechneten Navi-Deep-Links und einer stabilen `id` (`node/123`, `way/456`). Der Atlas-Inspector rendert Layer-Treffer schon generisch über `layer-hit-row.svelte` plus die Display-Mapper `layer-hit-display.ts` (Inspector-Chip/Kontext) und `value-formatters.ts` (LLM-Export-Text). POIs wie `kultur-kino` oder `schwimmbaeder` zeigen dort bereits Name plus Kontextzeile.

Für einen kühlen Ort fehlen drei Dinge: eine **kopierbare** Adresse, zwei **touch-große, tastaturbedienbare** Navi-Buttons und ein **vorbefüllter Melde-Mailto** mit Ortsname und `id`. Statt eines neuen Tooltips erweitert diese Story den etablierten `customComponent`-Slot in `layer-hit-row.svelte` (heute nur `MauerSektorenDetail`) um eine `KuehlerOrtDetail`-Komponente. Der Mailto-Builder `buildErrorReportMailto` existiert bereits und bekommt zwei optionale Felder (`placeName`, `placeId`).

## Acceptance Criteria

1. **AC-1 (Name, Typ, kopierbare Adresse):**
   **Given** ein ausgewählter kühler Ort im Inspector
   **When** der Layer-Hit gerendert wird
   **Then** zeigt die Titelzeile Name und Typ (Typ-Label, Icon über vorhandenes `pin-icon-mapping` wenn vorhanden), darunter die verifizierte Adresse mit einem „Adresse kopieren"-Button (Clipboard), beide tastaturbedienbar und mit Screenreader-Label
   **And** ohne Adresse erscheint kein leerer Copy-Button, sondern ein dezenter Hinweis „Adresse nicht hinterlegt"

2. **AC-2 (Navi-Deep-Links Google + Apple):**
   **Given** die Navi-Properties aus Story 15.1 (`navi_google`, `navi_apple`)
   **When** ich die Aktions-Buttons sehe
   **Then** öffnen „Google Maps" und „Apple Maps" je den korrekten Routing-Deep-Link in einem neuen Tab (`rel="noopener noreferrer"`), als Links mit mindestens 44×44px Touch-Fläche, sichtbarem Fokus-Ring und sprechendem `aria-label` (Ortsname enthalten)
   **And** fehlt ein Deep-Link, wird der jeweilige Button nicht gerendert (kein toter Link)

3. **AC-3 (Melde-Link mit Ortsname und id):**
   **Given** `feedbackMailto` für `kuehle-orte` (Story 15.2)
   **When** ich „stimmt nicht / gibt's nicht mehr" wähle
   **Then** öffnet ein vorbefüllter Mail-Entwurf an `FEEDBACK_EMAIL`, dessen Betreff den Ortsnamen und dessen Body Ortsname plus `id` (und Layer-Slug, Adresse, Lat/Lng) enthält, alles URL-encoded

4. **AC-4 (Reuse, WCAG, <500 Zeilen):**
   **Given** die bestehenden Inspector-Panel-Komponenten
   **When** der Ort gerendert wird
   **Then** läuft alles über `layer-hit-row.svelte` plus eine neue `KuehlerOrtDetail`-Komponente am vorhandenen `customComponent`-Slot, kein neuer Tooltip-Stack, jede berührte/neue Datei bleibt unter 500 Zeilen, kein `any`, DE-only
   **And** TDD: Reader-Logik, Mailto-Erweiterung und Komponenten-Rendering sind test-first abgedeckt, `pnpm test:unit` grün

## Tasks / Subtasks

- [ ] **Task 1: Typsicherer Wert-Reader für kühle Orte** (AC: #1, #2, #3, #4)
  - [ ] 1.1 (RED) `src/lib/components/atlas/inspector-panel/internal/kuehler-ort-display.test.ts`: aus `unknown`-Value werden `name`, `typ`, `address`, `googleHref`, `appleHref`, `id` extrahiert; fehlende Felder → `undefined` (kein Crash); Nicht-Objekt/`null` → leere Shape
  - [ ] 1.2 (GREEN) `src/lib/components/atlas/inspector-panel/internal/kuehler-ort-display.ts`: reine Funktion `getKuehlerOrtDisplay(value: unknown): KuehlerOrtDisplay` (Pattern wie `firstString`/`pickProp` in `layer-hit-display.ts`, kein `any`)
- [ ] **Task 2: Inspector-Display-Mapping für `kuehle-orte`** (AC: #1)
  - [ ] 2.1 (RED) `layer-hit-display.test.ts`: `getLayerHitDisplay('kuehle-orte', value)` liefert Name als `fallbackText` und Adresse als `context` (POI-Muster wie `poiSchwimmbad`)
  - [ ] 2.2 (GREEN) `case 'kuehle-orte'` in `src/lib/components/atlas/inspector-panel/internal/layer-hit-display.ts` ergänzen
  - [ ] 2.3 (RED) `value-formatters.test.ts`: `formatLayerValue('kuehle-orte', value)` liefert `Name · Adresse`-Text (LLM-Export-Pfad, Muster `formatOsmPoi`)
  - [ ] 2.4 (GREEN) `case 'kuehle-orte'` in `src/lib/components/atlas/inspector-panel/internal/value-formatters.ts` ergänzen
- [ ] **Task 3: Melde-Mailto um Ortsname und id erweitern** (AC: #3)
  - [ ] 3.1 (RED) `src/lib/utils/contact.test.ts`: bei gesetztem `placeName`/`placeId` enthält Subject den Ortsnamen, Body „Ort: {name}" und „ID: {id}"; ohne die Felder bleibt das bisherige Verhalten unverändert
  - [ ] 3.2 (GREEN) `ErrorReportContext` in `src/lib/utils/contact.ts` um optionale `placeName?`/`placeId?` erweitern, Subject/Body-Zeilen ergänzen (bestehende Reihenfolge erhalten)
- [ ] **Task 4: `KuehlerOrtDetail`-Komponente** (AC: #1, #2, #3, #4)
  - [ ] 4.1 (RED) `src/lib/components/atlas/kuehler-ort-detail.svelte.test.ts`: rendert Adresse + „Adresse kopieren"-Button (ruft `navigator.clipboard.writeText`), zwei Navi-Links mit korrektem `href`/`aria-label`/`target=_blank`/`rel`, Melde-Link via `ErrorFeedbackMailto`; fehlende Felder → kein toter Button/Link
  - [ ] 4.2 (GREEN) `src/lib/components/atlas/kuehler-ort-detail.svelte`: Svelte-5-Runes, `@lucide/svelte` (`Copy`, `Check`, `Navigation`/`MapPin`, `Mail`), Props `{ value: unknown; lat?: number; lng?: number; fetchedAt?: string }`, nutzt `getKuehlerOrtDisplay`; Clipboard-Pattern aus `share-sheet.svelte` (`navigator.clipboard.writeText`, Guard `typeof navigator === 'undefined'`); Navi-Links min. 44px Touch, sichtbarer Fokus-Ring, `aria-label` mit Ortsname; Melde-Link über `ErrorFeedbackMailto` mit `placeName`/`placeId`
- [ ] **Task 5: Verdrahtung am `customComponent`-Slot** (AC: #4)
  - [ ] 5.1 (GREEN) `src/lib/components/atlas/internal/editorial-types.ts`: `EditorialCustomComponent` um `'KuehlerOrtDetail'` erweitern
  - [ ] 5.2 (RED) `src/lib/components/atlas/internal/editorial-config.test.ts`: `getEditorialConfig('kuehle-orte')` liefert `feedbackMailto: true`, `customComponent: 'KuehlerOrtDetail'`, gesetzte `primarySourceUrl`
  - [ ] 5.3 (GREEN) `kuehle-orte`-Eintrag in `src/lib/components/atlas/internal/editorial-config.ts` ergänzen
  - [ ] 5.4 (RED) `layer-hit-row.svelte.test.ts`: bei `hit.layer === 'kuehle-orte'` und `rowState === 'with-value'` wird `KuehlerOrtDetail` (mit `value`/`lat`/`lng`) gerendert, `MauerSektorenDetail` nicht
  - [ ] 5.5 (GREEN) `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte`: `showMauerDetail`-Muster verallgemeinern, `KuehlerOrtDetail` importieren und konditional rendern (`value={hit.value}`, `lat`, `lng`, `fetchedAt={hit.updatedAt}`)
- [ ] **Task 6: Abschluss** (AC: #4)
  - [ ] 6.1 `pnpm test:unit -- --run` grün, `pnpm check` 0 Errors
  - [ ] 6.2 Sichtprüfung Tastatur-Tab-Reihenfolge und Fokus-Ring auf den drei Aktionen (Copy, 2× Navi, Melde)
  - [ ] 6.3 Zeilen-Check: `layer-hit-row.svelte` und `kuehler-ort-detail.svelte` unter 500 Zeilen

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-30)

- **`layer-hit-row.svelte`** (255 Zeilen) rendert generisch jeden Hit: Titelzeile = `layerName`, Wert über `getLayerHitDisplay(hit.layer, hit.value)` (`display.chip` oder `display.fallbackText`), Kontextzeile `display.context`, dazu Toggle-Button, „Mehr Details", `DataStandBanner`, `EditorialDisclaimer` und am Ende der **`customComponent`-Slot**: `showMauerDetail = editorial?.customComponent === 'MauerSektorenDetail' && rowState === 'with-value'` → `<MauerSektorenDetail fetchedAt={hit.updatedAt} />` (Zeilen 97-99, 252-254). Props enthalten bereits `lat`/`lng` (Zeilen 16-26), durchgereicht aus `layer-level-card.svelte` (Zeile 54).
- **`layer-hit-display.ts`** (357 Zeilen): POI-Mapper liefern `fallback(name, context)`; Vorbild `poiSchwimmbad` (Zeilen 164-169) = Name als `fallbackText`, Kategorie als `context`. Switch ab Zeile 269; `default` (Zeile 351) dumpt nur primitive Werte.
- **`value-formatters.ts`** (462 Zeilen): paralleler Text-Pfad für LLM-Export; `formatOsmPoi` (Zeilen 135-143) baut `Name · Straße Hnr`. Kultur-POIs hängen ab Zeile 450 an `formatOsmPoi`. Default dumpt `safeString`.
- **`contact.ts`** (`src/lib/utils/`): `FEEDBACK_EMAIL = 'hey@navigator.berlin'`; `buildErrorReportMailto(ctx)` baut Subject `Fehler im Eintrag: {layerName}` und Body mit `Layer`, optional `Adresse` (`displayName`), `Lat,Lng`, `Datenstand`, `Quelle`, dann `Beschreibung:`. Kein Feld für Ortsname/`id`. `contact.test.ts` deckt Subject/Body/Encoding ab.
- **`error-feedback-mailto.svelte`**: dünner Wrapper um `buildErrorReportMailto`, Props `{ layerSlug, layerName, displayName?, lat?, lng?, sourceUrl?, fetchedAt? }`, `@lucide/svelte` `Mail`, Link „Fehler im Eintrag?". Direkt als Melde-Link wiederverwendbar.
- **Clipboard-Pattern**: `share-sheet.svelte` (Zeilen 83-100) nutzt `navigator.clipboard.writeText` mit Guard `typeof navigator === 'undefined' || !navigator.clipboard`. Kein zentraler Copy-Helper, Pattern wird übernommen.
- **`editorial-config.ts`** / **`editorial-types.ts`**: `EditorialConfig { slug, disclaimerVariants, primarySourceUrl?, customComponent?, feedbackMailto, neverMachineTranslate? }`; `EditorialCustomComponent = 'MauerSektorenDetail'` (einziger Wert). `getEditorialConfig(slug)` liefert Eintrag oder `undefined`. `ALL_LAYERS_GET_FEEDBACK_MAILTO = true`. Noch **kein** `kuehle-orte`-Eintrag.
- **`pin-icon-mapping.ts`**: `getPinIcon(slug)` / `hasPinIcon(slug)` plus `PIN_ICON_MAP`. Liefert Kartenpin-SVG je Layer-Slug, optional für das Typ-Icon im Inspector nutzbar (Reuse statt neuer Icon-Tabelle).
- **`LayerHit`** (`src/lib/data/types.ts`, Zeilen 17-24): `{ layer, value: unknown, source, updatedAt, license, reason? }`. Der kühle Ort steckt komplett in `value` (Properties aus dem `kuehle-orte`-GeoJSON).
- **Kein `kuehle-orte`** in `src`/`scripts` vorhanden (grep leer am 2026-06-30): diese Story ist das erste Inspector-Rendering des Layers.

### Design-Entscheidung: customComponent-Slot statt neuer Tooltip

Der `customComponent`-Mechanismus existiert genau für solche Layer-spezifischen Detail-Blöcke (heute Mauer-Sektoren). Wir verallgemeinern den hartkodierten `showMauerDetail`-Zweig minimal und hängen `KuehlerOrtDetail` an. Vorteile: kein zweiter Render-Pfad, `layer-hit-row.svelte` bleibt die einzige Hit-Komponente, Titelzeile/Chip/Kontext laufen weiter über die generischen Mapper. Name und Adresse kommen so doppelt zum Tragen: als Chip/Kontext (generisch, auch für LLM-Export) und im Detail-Block (kopierbar plus Aktionen).

Die Navi-Deep-Links werden **nicht** hier gebaut, sondern in Story 15.1 am Feature angehängt (`navi_google`, `navi_apple`). `KuehlerOrtDetail` liest sie nur. `getKuehlerOrtDisplay` kapselt das `unknown`-Parsing typsicher an einer Stelle, damit Komponente und Tests nicht je einzeln in `value` greifen.

Der Melde-Link nutzt `ErrorFeedbackMailto` plus die um `placeName`/`placeId` erweiterte `buildErrorReportMailto`. So bleibt eine Mailto-Quelle für den ganzen Atlas, und der kühle Ort bekommt Ortsname im Betreff und `id` im Body.

### Was nicht brechen darf

- **Bestehende POI/Editorial-Layer unverändert.** Alle Änderungen an `layer-hit-display.ts`/`value-formatters.ts` sind additive `case`-Zweige; der erweiterte `customComponent`-Zweig darf den `MauerSektorenDetail`-Pfad nicht verändern.
- **`buildErrorReportMailto` rückwärtskompatibel.** Ohne `placeName`/`placeId` identischer Output wie heute (bestehende `contact.test.ts`-Cases bleiben grün).
- **WCAG (NFR1/UX-DR2):** Navi und Copy sind echte `<a>`/`<button>` mit `aria-label`, Touch ≥44px, sichtbarem Fokus-Ring; keine reinen Icon-Buttons ohne Textalternative; Copy-Feedback nicht nur farblich.
- **Keine em-dashes** in Strings/Comments/Commit; **DE-only**, keine i18n-Keys; **kein `any`**; **Dateien <500 Zeilen** (besonders `layer-hit-row.svelte`, heute 255).

## References

- [Source: src/lib/components/atlas/inspector-panel/layer-hit-row.svelte] (customComponent-Slot Zeilen 97-99, 252-254; Props lat/lng Zeilen 16-26)
- [Source: src/lib/components/atlas/inspector-panel/internal/layer-hit-display.ts] (POI-Mapper `poiSchwimmbad` 164-169, Switch ab 269, default 351)
- [Source: src/lib/components/atlas/inspector-panel/internal/value-formatters.ts] (`formatOsmPoi` 135-143, Kultur-POI-Zweig ab 450, Switch ab 342)
- [Source: src/lib/utils/contact.ts] (`buildErrorReportMailto`, `ErrorReportContext`, `FEEDBACK_EMAIL`)
- [Source: src/lib/utils/contact.test.ts] (bestehende Subject/Body/Encoding-Cases)
- [Source: src/lib/components/atlas/error-feedback-mailto.svelte] (Melde-Link-Wrapper)
- [Source: src/lib/components/atlas/inspector-panel/share-sheet.svelte] (Clipboard-Pattern Zeilen 83-100)
- [Source: src/lib/components/atlas/internal/editorial-config.ts] (Config-Tabelle, `getEditorialConfig`)
- [Source: src/lib/components/atlas/internal/editorial-types.ts] (`EditorialCustomComponent`, `EditorialConfig`)
- [Source: src/lib/components/atlas/mauer-sektoren-detail.svelte] (customComponent-Vorbild)
- [Source: src/lib/components/atlas/internal/pin-icon-mapping.ts] (`getPinIcon`/`hasPinIcon` für Typ-Icon)
- [Source: src/lib/data/types.ts] (`LayerHit` 17-24)
- [Source: src/lib/components/atlas/inspector-panel/layer-level-card.svelte] (lat/lng-Durchreichung Zeile 54)
- [Source: _bmad-output/planning-artifacts/epics-kuehle-orte.md] (Story 15.3 Zeilen 165-187, FR2/3/4/13, UX-DR1/2)
- [Source: CLAUDE.md] (TDD-Mandat ADR-012, keine em-dashes, <500 Zeilen)

## Dev Agent Record

### Agent Model Used

_tbd_

### Completion Notes List

_tbd_

### File List

**Neu (geplant):**
- `src/lib/components/atlas/inspector-panel/internal/kuehler-ort-display.ts` (+ `.test.ts`)
- `src/lib/components/atlas/kuehler-ort-detail.svelte` (+ `.svelte.test.ts`)

**Geändert (geplant):**
- `src/lib/components/atlas/inspector-panel/internal/layer-hit-display.ts` (+ `.test.ts`)
- `src/lib/components/atlas/inspector-panel/internal/value-formatters.ts` (+ `.test.ts`)
- `src/lib/utils/contact.ts` (+ `.test.ts`)
- `src/lib/components/atlas/inspector-panel/layer-hit-row.svelte` (+ `.svelte.test.ts`)
- `src/lib/components/atlas/internal/editorial-types.ts`
- `src/lib/components/atlas/internal/editorial-config.ts` (+ `.test.ts`)

### Debug Log References

_tbd_

## Change Log

- 2026-06-30: Story 15.3 erstellt (ready-for-dev). Inspector-Reuse über customComponent-Slot: Name/Typ + kopierbare Adresse, Google/Apple-Navi-Buttons, Melde-Link mit Ortsname/id. Test-first für Reader, Mailto-Erweiterung und Komponente.
