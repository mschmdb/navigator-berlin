# Story 1.26: Adress-Bookmarks (lokal, LocalStorage)

Status: review

## Story

As a wiederkehrende Nutzer:in, die mehrere Berliner Adressen recherchiert (Umzug, Wohnungssuche, Datenjournalismus),
I want gesuchte Adressen lokal im Browser als Bookmarks speichern, in einem Dialog wiederfinden, auswählen oder löschen können,
so that ich nicht jedes Mal neu tippen muss und meine Recherche-Shortlist über Sessions hinweg behalte.

## Probleme heute

1. Jede Adress-Recherche beginnt bei Null. Wer drei Adressen vergleichen will, muss sie dreimal tippen pro Session.
2. URL-Share ist die einzige „Persistenz", aber Share-Link pro Adresse erzeugt unhandliche Bookmark-Sammlung im Browser-Bookmarks-Manager.
3. Folge-Story 1.27 (Adress-Vergleich) braucht eine Quelle für „Adresse B" — ohne lokal gespeicherte Adress-Liste wäre der Compare-Flow „beide Adressen zweimal komplett eintippen".

## Akzeptanz-Kriterien

1. **AC-1 (Bookmark-Trigger im Site-Header):**
   **Given** `site-header.svelte` mit AddressSearch + Layer-Trigger (Story 1.10)
   **When** Nutzer:in eine Adresse selektiert hat (`ui.selectedAddress !== null`)
   **Then** im Header rechts neben Layer-Trigger erscheint ein zweiter Icon-Button (Lucide `Bookmark`):
   - 40×40 Touch-Target, gleiches Border/Hover-Pattern wie Layer-Trigger
   - `aria-label="Bookmark-Verwaltung öffnen"`, `aria-haspopup="dialog"`, `aria-expanded` synchron mit Open-State
   - Badge oben-rechts mit Anzahl gespeicherter Bookmarks (`<span data-testid="header-bookmark-badge">`), nur wenn count > 0
   **And** Trigger ist auch ohne selektierte Adresse sichtbar (sonst kann User existierende Bookmarks nicht öffnen)
   **And** Visuell-Unterschied „Bookmark vorhanden" vs „nicht gespeichert" für aktuelle Adresse: gefülltes `BookmarkCheck`-Icon vs outline `Bookmark`
   **And** Klick öffnet Bookmark-Dialog (siehe AC-2)

2. **AC-2 (Bookmark-Dialog — gleiche Pattern wie Layer-Palette):**
   **Given** Bookmark-Trigger geklickt
   **When** Dialog rendert
   **Then** Desktop (>640px): vanilla `<div role="dialog" aria-modal="true" aria-labelledby="bookmarks-dialog-title">`, zentriert, max-width 480px, max-height 80vh
   **And** Mobile (≤640px): wiederverwendet `inspector-panel/bottom-sheet.svelte` aus Story 1.9, Snap 40vh
   **And** Header: Plex-Serif h2 „Gespeicherte Adressen" (`id="bookmarks-dialog-title"`) + Close-Button (Lucide `X`)
   **And** Body:
   - Falls aktuelle `ui.selectedAddress` nicht gespeichert: oben „Aktuelle Adresse speichern"-Action-Row (Lucide `BookmarkPlus` + selektierte Adresse als Subtext)
   - Liste gespeicherter Bookmarks, sortiert nach `createdAt` desc (neueste zuerst), max-height scrollbar
   - Pro Bookmark-Row:
     - `<button data-testid="bookmark-select">{displayName}</button>` (Plex-Sans, ≥44px Touch-Target)
     - Subtext: Bezirk + Postleitzahl (Plex-Mono klein)
     - Aktions-Icons rechts: Trash (`Trash2`) für Löschen
     - **Falls Story 1.27 ausgeliefert**: zusätzlicher Action-Icon `GitCompare` „Zum Vergleich hinzufügen" (Feature-Flag gegen `featureFlags.compareMode`)
   - Falls leer: zentriert Plex-Mono-Hinweis „Noch keine Bookmarks. Wähle eine Adresse und tippe auf das Bookmark-Symbol."
   **And** Footer: „Alle löschen"-Tertiary-Link (nur wenn count > 0) + Plex-Mono-Counter „N/M Bookmarks" (M = MAX_BOOKMARKS aus AC-5)
   **And** Modal-Background NICHT dimmed (UX-DR33 — gleiches Pattern wie Layer-Palette)
   **And** Focus-Trap via Tab-Cycle-Handler + initialer Focus auf erstes interaktives Element (Save-Action bei vorhandener Adresse, sonst erste Bookmark-Row, sonst Close-Button)
   **And** Esc + Click-Outside (Desktop) + Drag-Down (Mobile-Sheet) schließen Dialog

3. **AC-3 (Bookmark anlegen):**
   **Given** Dialog offen + `ui.selectedAddress !== null` + Adresse noch nicht gespeichert
   **When** Nutzer:in klickt „Aktuelle Adresse speichern"
   **Then** neues Bookmark-Objekt erzeugt:
   ```ts
   interface Bookmark {
     id: string;                    // uuid v4
     displayName: string;           // GeocodeSuggestion.displayName
     lat: number;
     lng: number;
     bezirk?: string;
     postcode?: string;
     createdAt: string;             // ISO 8601
   }
   ```
   **And** Bookmark in LocalStorage geschrieben unter Key `navigator-berlin.bookmarks.v1`
   **And** Schema-Wrapper im Storage:
   ```ts
   interface BookmarkStore {
     schemaVersion: 1;
     bookmarks: Bookmark[];
   }
   ```
   **And** Bookmark-Liste in `ui.bookmarks` aktualisiert (reactive)
   **And** Header-Badge-Count erhöht sich
   **And** Save-Action im Dialog swappt zu Hinweis „Gespeichert" mit `Check`-Icon für ~1.8s (Inline-Feedback-Pattern aus Story 1.20)
   **And** aria-live="polite"-Region announct „Adresse {displayName} gespeichert"
   **And** NEVER toast (Memory `feedback_no_toast.md`)

4. **AC-4 (Bookmark auswählen/öffnen):**
   **Given** Dialog offen mit ≥1 Bookmark
   **When** Nutzer:in klickt Bookmark-Row
   **Then** `ui.selectedAddress` wird auf das Bookmark-Äquivalent gesetzt (synthetic `GeocodeSuggestion` aus gespeicherten Feldern):
   ```ts
   {
     id: `bookmark:${bookmark.id}`,
     displayName: bookmark.displayName,
     lat: bookmark.lat,
     lng: bookmark.lng,
     type: 'bookmark',
     addresstype: 'bookmark',
     bezirk: bookmark.bezirk,
     postcode: bookmark.postcode
   }
   ```
   **And** Inspector öffnet via `ui.inspectorOpen = true`
   **And** Map fliegt zur Adresse (gleicher Pfad wie AddressSearch-Select)
   **And** URL-State wird aktualisiert (Permalink-Sync via bestehender `$effect` in `+page.svelte`)
   **And** Dialog schließt automatisch
   **And** Daten-Frische: gespeicherte `lat/lng` werden NICHT re-geocoded (Adress-Layer auf Berlin sind stabil); falls AC-2 anzeigt „Adresse veraltet > 2 Jahre" → das ist Phase-2-Scope, MVP übernimmt Werte 1:1

5. **AC-5 (Bookmark löschen + Quota):**
   **Given** Dialog offen mit ≥1 Bookmark
   **When** Nutzer:in klickt `Trash2`-Icon einer Row
   **Then** Confirm-Inline-State (kein Browser-Alert, kein Modal-Stack):
   - Row swappt zu „Wirklich löschen? [Abbrechen] [Löschen]"-Buttons
   - 8-Sekunden-Auto-Revert falls keine Aktion
   **And** Bei Bestätigung: Bookmark aus Liste entfernt + LocalStorage geschrieben + aria-live-Announce „Bookmark {displayName} entfernt"
   **And** Bei „Alle löschen" (Footer): gleicher Inline-Confirm-Pattern
   **And** **Quota-Limit `MAX_BOOKMARKS = 50`** (begründet: ausreichend für realistische Wohnungssuche-Shortlist, weit unter dem LocalStorage 5MB-Limit, vermeidet Endless-Storage-Wachstum)
   **And** Wenn `bookmarks.length >= MAX_BOOKMARKS`: Save-Action zeigt deaktivierten Zustand + Plex-Mono-Hinweis „Limit erreicht (50). Lösche alte Bookmarks zum Hinzufügen."
   **And** LocalStorage-Schreibfehler (Quota-Exceeded, Privacy-Modus): Inline-Banner im Dialog-Footer „Speicher nicht verfügbar. Bookmarks bleiben nur in dieser Session." + Bookmarks bleiben im Memory aktiv

6. **AC-6 (LocalStorage-Schema + Migrationspfad):**
   **Given** persistente Speicherung
   **When** App lädt
   **Then** `loadBookmarks()` versucht:
   - LocalStorage-Get unter `navigator-berlin.bookmarks.v1`
   - JSON.parse
   - Valibot-Validation gegen `BookmarkStoreSchema` (siehe Dev Notes)
   - Bei Fehler: leeres Array (`[]`), Storage NICHT überschrieben, console.warn mit Hinweis
   - Bei Success: `schemaVersion`-Check (Phase 1 nur `1`; Migration-Hook für Phase 2)
   **And** Storage-Reads sind defensive: SSR-Safe via `typeof window === 'undefined'`-Guard
   **And** Storage-Writes happen via `queueMicrotask` debounced (nicht synchron in jedem Mutation-Step, Performance-Schutz)
   **And** Cross-Tab-Sync: `window.addEventListener('storage', ...)` lauscht auf Updates aus anderen Tabs, refresht `ui.bookmarks` (Out-of-Scope für MVP wenn zu komplex, dann Reload-Hinweis)

7. **AC-7 (Datenschutz-Transparenz):**
   **Given** rechtliche Pflicht laut TDDDG §25 Abs. 2 Nr. 2 (technisch notwendig für vom Nutzer ausdrücklich gewünschten Dienst)
   **When** Story ausgeliefert
   **Then** Folgende Artefakte existieren:
   - **ADR-004 (Cookieless-Architektur) erweitert** um den Abschnitt „Ausnahme: User-initiierte clientseitige Bookmarks":
     - Begründung gemäß TDDDG §25 Abs. 2 Nr. 2
     - Verweis auf DSK Orientierungshilfe Telemedien 2021 („Merkliste anlegen" als Beispiel für ausdrücklich gewünschten Dienst)
     - Scope-Definition: ausschließlich vom User explizit initiierte Speicherung, ausschließlich clientseitig, niemals serverseitige Auswertung, keine Übertragung an Dritte
     - Konsequenz: KEIN Cookie-Banner (Voraussetzungen für Einwilligungsfreiheit erfüllt)
   - **`docs/runbooks/` oder vergleichbare Stelle** dokumentiert Storage-Key + Schema + Lösch-Pfad für künftige Compliance-Audits
   - **Datenschutzerklärung-Snippet als Markdown-File** unter `_bmad-output/planning-artifacts/datenschutz-bookmarks-snippet.md` für späteres Einbinden in Story 4.6 (Compliance-Pages); Inhalt:
     - Was wird gespeichert (lat, lng, displayName, bezirk, postcode, createdAt)
     - Wo (LocalStorage des Browsers, niemals Server)
     - Zweck (vom User explizit aktivierte Bookmark-Funktion)
     - Wie löschen (UI-Aktion „Alle löschen" + Browser-Settings)
     - Keine Übertragung an Dritte, keine Profilbildung
   **And** Dialog enthält im Footer dezenten Link „Datenschutz" (`href="/datenschutz#bookmarks"`, externer Link bei fehlender Route bewusst broken-link-Tolerant bis Story 4.6 die Route bringt)

8. **AC-8 (A11y):**
   - Dialog `role="dialog"` + `aria-modal="true"` + `aria-labelledby="bookmarks-dialog-title"`
   - Focus-Trap (Tab/Shift+Tab cycle innerhalb Dialog)
   - Initial-Focus deterministisch (siehe AC-2)
   - Esc schließt + Focus kehrt zu Trigger zurück
   - aria-live="polite" für Save/Delete/Limit-Confirmations
   - Bookmark-Liste als `<ul role="list">` mit `<li>` pro Bookmark (Screen-Reader-strukturiert)
   - Lösch-Confirm-Inline-State announct via aria-live
   - Reduced-Motion: Dialog-Open/Close kein Slide, nur 120ms fade
   - axe-core: 0 Violations gegen offenen Dialog (deferred to CI)

9. **AC-9 (Tests):**
   Unit:
   - `bookmark-store.test.ts` — Pure Logic:
     - `loadBookmarks(storage)` aus mock-Storage
     - `saveBookmark(store, bookmark) → BookmarkStore` (immutable)
     - `removeBookmark(store, id)`
     - `clearAllBookmarks()`
     - Schema-Validation Reject (malformed JSON, falsche Felder)
     - Quota-Limit-Enforcement
     - Storage-Key-Konstante geprüft
   - `bookmark-dialog.svelte.test.ts` — Render-Variants:
     - leer-State
     - mit 3 Bookmarks
     - Save-Action vorhanden bei `selectedAddress` ohne Match
     - Save-Action versteckt wenn Adresse schon Bookmark
     - Delete-Confirm-Inline-State + Revert nach 8s
     - Limit-Reached-State
     - LocalStorage-Failure-Banner
   - `ui-context.svelte.test.ts` — Bookmark-State-Mutationen (addBookmark/removeBookmark/clearBookmarks)
   - `site-header.svelte.test.ts` — Bookmark-Trigger + Badge + filled-vs-outline-Icon
   E2E:
   - `tests/e2e/bookmark-flow.e2e.ts`:
     - Adresse suchen → Bookmark speichern → Reload → Bookmark in Dialog vorhanden
     - Bookmark auswählen → Adresse + Inspector + URL synced
     - Bookmark löschen → Bookmark weg + LocalStorage geleert
     - Limit-Test (51. Bookmark wird abgelehnt)
   Coverage-Target: ≥85% Pure-Util, ≥75% Dialog-Komponente

## Tasks / Subtasks

- [x] **Task 1: ADR-004 erweitern + Datenschutz-Snippet** (AC: #7)
  - [x] 1.1 `docs/adr/ADR-004-cookieless.md` Sections „Context", „Decision", „Consequences" befüllen plus neuen Abschnitt „Exception: User-initiierte clientseitige Bookmarks (Story 1.26)" mit TDDDG-Begründung + DSK-OH-Telemedien-Quelle
  - [x] 1.2 `_bmad-output/planning-artifacts/datenschutz-bookmarks-snippet.md` anlegen (späterer Konsument: Story 4.6)
  - [x] 1.3 MUST-Rule #10 in `_bmad-output/planning-artifacts/architecture.md` um Inline-Anmerkung erweitern: „Ausnahme dokumentiert in ADR-004"
  - [x] 1.4 `docs/runbooks/bookmark-storage.md` für Compliance-Audits angelegt (Bonus: Audit-Checkliste, Failure-Modi-Tabelle)

- [x] **Task 2: Bookmark-Store Pure Logic** (AC: #3, #5, #6)
  - [x] 2.1 `src/lib/state/bookmark-store.ts`: STORAGE_KEY, MAX_BOOKMARKS, emptyStore, loadBookmarks (SSR-safe), saveBookmark (Quota+Dedup), removeBookmark, clearAllBookmarks, isBookmarked (6-Dezimal), persistBookmarks (try/catch), createBookmark (uuid+ISO)
  - [x] 2.2 Valibot-Schema in `src/lib/state/bookmark-schema.ts`: BookmarkSchema (uuid-Regex, displayName ≤200, lat 52.3–52.7, lng 13.0–13.8, ISO-Timestamp), BookmarkStoreSchema (literal 1, max 50)
  - [x] 2.3 Tests `bookmark-store.test.ts` — 23 Cases grün (Load/Save/Remove/Clear/Validation/Quota/Dedup/SSR-Safe/PersistFailure/Bbox-Reject)

- [x] **Task 3: ui-context-Erweiterung** (AC: #3, #4)
  - [x] 3.1 `src/lib/state/ui-context.svelte.ts` erweitert: `UiState.bookmarks`, `bookmarksDialogOpen`, `addBookmark` (returns false bei Quota/Dedup), `removeBookmark`, `clearBookmarks`
  - [x] 3.2 `+layout.svelte`-Bootstrap: `loadBookmarks(localStorage)` initial + Cross-Tab-Storage-Listener
  - [x] 3.3 `$effect` für Persistenz: queueMicrotask-debounced `persistBookmarks`
  - [x] 3.4 Tests `ui-context.svelte.test.ts` +6 Cases (18/18 grün)

- [x] **Task 4: BookmarkDialog-Komponente** (AC: #2, #3, #4, #5, #8)
  - [x] 4.1 `bookmark-dialog.svelte` (415 LOC) + `bookmark-row.svelte` (125 LOC): Conditional-Render Desktop vs Bottom-Sheet, Save-Action mit Save-Confirmation-State (1.8s), `<ul role="list">`, Footer mit Counter+„Alle löschen"+Datenschutz-Link
  - [x] 4.2 Focus-Trap-Utility neu in `src/lib/utils/focus-trap.ts` (createFocusTrap + getFocusableElements, 6 Tests grün)
  - [x] 4.3 Mobile-Variante via existierendem `inspector-panel/bottom-sheet.svelte`
  - [x] 4.4 Files <500 LOC (Dialog 415, Row 125) — keine weitere Splittung nötig
  - [x] 4.5 Tests `bookmark-dialog.svelte.test.ts` — 17 Cases grün (empty/sortierung/save/select/delete-confirm/limit/clear-all/aria/compare-flag/datenschutz-link/counter)

- [x] **Task 5: Site-Header-Integration** (AC: #1)
  - [x] 5.1 `site-header.svelte` Props erweitert: `bookmarkCount`, `currentAddressBookmarked`, `onOpenBookmarks`
  - [x] 5.2 Bookmark-Trigger-Button mit conditional `BookmarkCheck` vs `Bookmark`-Icon via `data-bookmarked`-Attribut
  - [x] 5.3 `data-testid="header-bookmark-trigger"` + `data-testid="header-bookmark-badge"`
  - [x] 5.4 `(with-header)/+layout.svelte` verdrahtet alle Props + BookmarkDialog mounted
  - [x] 5.5 Tests `site-header.svelte.test.ts` +6 Bookmark-Cases (15/15 grün)

- [x] **Task 6: Address-Select-Flow** (AC: #4)
  - [x] 6.1 `bookmark-dialog.svelte` handleSelect ruft `selection.set(suggestion)` (gleicher Pfad wie AddressSearch-Select) + schließt Dialog. Pipeline-Side-Effects (openInspectorFor, flyToSuggestion, marker, climate) laufen via existing $effect in +page.svelte::546
  - [x] 6.2 Helper `bookmarkToSuggestion(bookmark): GeocodeSuggestion` exportiert aus `bookmark-store.ts` (id:`bookmark:${id}`, type:'bookmark') + Test
  - [x] 6.3 Map-Fly + URL-State + LayerHits + ClimateStation via bestehendem selection.$effect-Wiring (Story 1.7 + Story 1.11)

- [x] **Task 7: Tests + E2E + axe** (AC: #9)
  - [x] 7.1 `tests/e2e/bookmark-flow.e2e.ts` mit 5 Cases (Save via Inspector → Reload, Inspector-Toggle-bei-vorhandener-Adresse öffnet Dialog, Select-via-Dialog, Delete-via-Dialog, Limit-Test)
  - [x] 7.2 axe-core Check gegen offenen Dialog (1 Case in E2E-File mit AxeBuilder, Ausführung deferred zu CI analog Stories 1.13–1.25)
  - [x] 7.3 Cross-Tab-Storage-Listener implementiert in +layout.svelte; Manueller Browser-Smoke deferred zu User-Verify-Phase

## Scope-Erweiterung post Review-Wave (User-Pivot 2026-05-15)

User-Feedback während Implementation: „Footer-Zeile (Leere Sektionen / Teilen) von unten nach oben im Inspector und Bookmark adden!"

Umgesetzt:
- Inspector-Footer (`<footer>` am Ende der Section) entfernt
- Neue Inspector-Toolbar (`data-testid="inspector-toolbar"`) als sticky-Zeile direkt unter Header eingeführt
- Bookmark-Action zwischen Empty-Sections-Toggle (links) und Share-Trigger (rechts) eingefügt
- Verhalten: nicht-gespeicherte Adresse → Click speichert inline mit 1.8s-Konfirmation; gespeicherte Adresse → Click öffnet Bookmark-Dialog (Management)
- Icon-Variants: outline `Bookmark` (unsaved), filled `BookmarkCheck` (saved), `Check` (just-saved Konfirmation)
- aria-label kontextabhängig
- +3 Tests in inspector-panel.svelte.test.ts (Toolbar-Position oben, Trigger sichtbar, Click-Konfirmation)
- E2E-Tests umgeschrieben auf Inspector-Trigger als primären Save-Pfad

## Dev Notes

### Storage-Schema (Versionierung-Strategie)

```ts
interface BookmarkStoreV1 {
  schemaVersion: 1;
  bookmarks: Bookmark[];
}

// Phase 2 (z.B. Story 1.27 → comparedSet, oder Story 5.x → tags):
interface BookmarkStoreV2 {
  schemaVersion: 2;
  bookmarks: BookmarkV2[];  // tags, notes, comparedWith
}

function migrate(raw: unknown): BookmarkStoreV1 {
  // bei v1: direkt zurück
  // bei v2: rückwärts kompatibel runter-mappen (oder vorwärts wenn store < v1)
}
```

Validation-Reject-Path schreibt NIEMALS zurück (User-Daten erhalten). Bei Schema-Mismatch console.warn + empty fallback.

### LocalStorage-Failures (Privacy-Mode, Quota)

```ts
function persistBookmarks(storage: Storage, store: BookmarkStore): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
      // Quota erreicht trotz MAX_BOOKMARKS-Guard (z.B. anderes Site-Feature füllt Storage)
      return false;
    }
    // SecurityError im Private-Mode bei manchen Browsern
    return false;
  }
}
```

UI verwendet Return-Value für Inline-Banner-Display. State bleibt In-Memory-aktiv (User verliert Bookmarks erst beim Reload).

### Dedup-Strategie

Gleiche Adresse zweimal speichern verhindert via 6-Dezimal-lat/lng-Match (≈11cm Präzision, deutlich unter Adress-Auflösung). Beim zweiten Save-Klick: nichts passieren + Inline-Hinweis „Adresse bereits gespeichert".

```ts
function isBookmarked(store: BookmarkStore, lat: number, lng: number): boolean {
  const latKey = lat.toFixed(6);
  const lngKey = lng.toFixed(6);
  return store.bookmarks.some(b => b.lat.toFixed(6) === latKey && b.lng.toFixed(6) === lngKey);
}
```

### TDDDG §25 + DSK-Begründung

**§25 Abs. 1 TDDDG:** Speicherung in Endeinrichtung nur mit Einwilligung.

**§25 Abs. 2 Nr. 2 TDDDG:** Ausnahme wenn „unbedingt erforderlich, damit der Anbieter eines Telemediendienstes einen vom Nutzer ausdrücklich gewünschten Telemediendienst zur Verfügung stellen kann."

**DSK-Orientierungshilfe Telemedien 2021** (S. 14): „Nutzer:innen wünschen Zusatzdienste und -funktionen erst, wenn sie diese explizit in Anspruch nehmen, z. B. einen Chatbot anklicken, eine **Merkliste anlegen** oder ein Formular ausfüllen."

→ Bookmark-Funktion = Merkliste = ausdrücklich gewünschter Dienst. LocalStorage technisch notwendig (kein Server-Roundtrip). Einwilligungsfrei zulässig. KEIN Cookie-Banner. Datenschutzerklärung-Transparenz erforderlich.

**Voraussetzungen, die diese Story einhält:**
- User initiiert die Speicherung explizit (Klick auf Bookmark-Button)
- Daten ausschließlich clientseitig (nie Server-Side)
- Keine Drittanbieter, keine Profilbildung, keine Tracking-Funktion
- Datenschutzerklärung beschreibt Zweck + Daten + Löschpfad (Snippet als Artefakt von Task 1)

### Cross-Tab-Sync

```ts
window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY) return;
  const store = loadBookmarks(localStorage);
  ui.bookmarks = store.bookmarks;
});
```

Konflikt-Resolution: last-write-wins (Browser-Default). Akzeptabler Trade-off für Phase 1; Phase 2 könnte CRDT-Merge nutzen, ist aber Overkill.

### Architektur-Compliance — relevante MUST-Rules

- #1 `@lucide/svelte` (Bookmark, BookmarkPlus, BookmarkCheck, Trash2, Check, X, GitCompare)
- #2 Files <500 Zeilen (Dialog evtl. in bookmark-row.svelte splitten)
- #6 Kein Kommentar außer non-obvious WHY
- #7 TS strict
- **#10 Cookieless — EXPLIZITE AUSNAHME via ADR-004 (Task 1) — User-initiierte Bookmarks gemäß TDDDG §25 Abs. 2 Nr. 2**
- #13 A11y-First (Dialog + Focus-Trap + aria-live)
- #14 i18n-First (Strings als const-Map für Story 3.1)
- #16 Context-API für State
- #18 Keyed `{#each (bookmark.id)}`
- #19 NEVER toast

### Library/Framework Requirements

**Neu:** keine. uuid-Generation via `crypto.randomUUID()` (Browser-API, alle modernen Browser).

### Testing Requirements

- **Unit:** ≥85% für `bookmark-store.ts` (Pure-Logic)
- **Component:** ≥75% für `bookmark-dialog.svelte` (Render-Variants)
- **E2E:** Bookmark-Flow end-to-end (Save → Reload → Select → Delete)
- **Browser-Test-Vorsicht:** kein `vi.spyOn(globalThis, 'fetch')` in `*.svelte.test.ts` (Memory `feedback_browser_test_fetch_spy.md`). Storage-Tests nutzen vitest-`Storage`-Mock.

### Previous Story Intelligence

- **Story 1.5:** AddressSearch + GeocodeSuggestion-Shape
- **Story 1.7:** URL-State-Sync (Permalink-Pattern wiederverwenden bei Bookmark-Select)
- **Story 1.9:** Inspector + ui-context-Pattern
- **Story 1.10:** Vanilla-Dialog mit eigener Focus-Trap-Strategie (Bits-UI verworfen), Bottom-Sheet wiederverwendet
- **Story 1.12:** Editorial-Disclaimer-Pattern für Bookmark-Liste (kein Stigma) nicht relevant — Bookmarks sind neutral
- **Story 1.20:** Inline-Feedback-State (Save → Check-Icon 1.8s), NEVER toast, Fixed-Positioning bei overflow-auto-Parent
- **Story 1.21:** Bodenrichtwert-Nutzungsart-Pattern nicht relevant
- **Memory `feedback_no_toast.md`:** Toasts hart verboten
- **Memory `popover_overflow_clipping.md`:** im Inspector-Panel fixed-positioning statt absolute. Bookmark-Dialog NICHT im Inspector-Tree → kein Issue, aber für künftige Sub-Popovers im Dialog beachten.

### File-Structure-Diff zu Story 1.25

```
./
├── docs/
│   └── adr/
│       └── ADR-004-cookieless.md                     # erweitert
├── _bmad-output/
│   └── planning-artifacts/
│       └── datenschutz-bookmarks-snippet.md          # neu
└── src/
    ├── lib/
    │   ├── state/
    │   │   ├── bookmark-store.ts                     # neu
    │   │   ├── bookmark-store.test.ts                # neu
    │   │   ├── bookmark-schema.ts                    # neu (valibot)
    │   │   ├── ui-context.svelte.ts                  # erweitert
    │   │   └── ui-context.svelte.test.ts             # erweitert
    │   ├── components/
    │   │   └── atlas/
    │   │       ├── bookmark-dialog.svelte            # neu
    │   │       ├── bookmark-dialog.svelte.test.ts    # neu
    │   │       ├── bookmark-row.svelte               # neu (falls Split nötig)
    │   │       ├── bookmark-row.svelte.test.ts       # neu
    │   │       ├── site-header.svelte                # erweitert
    │   │       └── site-header.svelte.test.ts        # erweitert
    │   └── utils/
    │       └── focus-trap.ts                         # neu (falls noch nicht extrahiert)
└── tests/
    └── e2e/
        └── bookmark-flow.e2e.ts                      # neu
```

### Open Questions

1. **Bookmark-Sortierung:** nur `createdAt desc`, oder zusätzlich Drag-Sort/manuell? MVP: nur Datum. Drag-Sort Phase 2.
2. **Export/Import (JSON-Datei-Download/Upload):** Issue erwähnt als „Stretch-Goal". MVP scope-cut, Phase 2 mit Story 1.20 ShareSheet-Pattern erweiterbar.
3. **Bookmark-Notes/Tags:** Scope-Creep. Phase 2 wenn User explizit fragt.
4. **Sync zwischen Geräten:** Outside Cookieless-Linie. Phase 2/3 evtl. via Self-Hosted-Sync-Server mit User-Account; widerspricht aktueller Architektur.
5. **PII-Sensitivität der gespeicherten Adressen:** Adressen sind im User-Browser, kein Server. Privacy-Risiko ist Browser-Storage-Zugriff durch andere Apps am Endgerät — gleicher Threat-Level wie Browser-Bookmarks oder History. Akzeptabel.
6. **`compareMode`-Feature-Flag:** wie genau? Empfehlung: `featureFlags.compareMode` in `src/lib/data/feature-flags.ts` (falls noch nicht vorhanden, neu); default false; Story 1.27 setzt auf true.

### Phase-2-Backlog (separate Stories)

- 1.27 Adress-Vergleich (Konsument der Bookmark-Liste)
- 5.x Bookmark-Export/Import als JSON
- 5.x Bookmark-Tags + Notes
- 5.x Drag-Sort
- 5.x Bookmark-Sharing via Permalink-Liste (URL-encoded)

## References

- [Source: src/lib/components/atlas/site-header.svelte] (Header-Trigger-Pattern, Layer-Trigger-Vorlage)
- [Source: src/lib/components/atlas/layer-palette.svelte] (Dialog-Pattern, Vanilla-role-Dialog, Focus-Strategie)
- [Source: src/lib/components/atlas/inspector-panel/bottom-sheet.svelte] (Mobile-Variante)
- [Source: src/lib/state/ui-context.svelte.ts] (State-Erweiterung-Pattern)
- [Source: src/lib/state/address-selection.svelte.ts] (GeocodeSuggestion-Selection-Flow)
- [Source: src/lib/data/types.ts#GeocodeSuggestion] (Shape für `bookmarkToSuggestion`)
- [Source: _bmad-output/planning-artifacts/architecture.md#MUST-Rule 10 Cookieless] (zu erweiternde Rule)
- [Source: docs/adr/ADR-004-cookieless.md] (zu erweiterndes ADR)
- [Source: _bmad-output/implementation-artifacts/1-20-share-sheet-og-card.md] (Inline-Feedback-Pattern, NEVER-Toast)
- [Source: _bmad-output/implementation-artifacts/1-10-layer-toggle-palette.md] (Dialog-Pattern, Bits-UI-Verwurf-Rationale)
- [Source: https://www.datenschutzkonferenz-online.de/media/oh/20211220_oh_telemedien.pdf] (DSK OH Telemedien 2021, „Merkliste"-Beispiel)
- [Source: https://www.gesetze-im-internet.de/tddd_g/__25.html] (TDDDG §25, ehemals TTDSG)
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/feedback_no_toast.md] (NEVER Toast)
- [Source: ~/.claude/projects/-Users-matthiasschmidbauer-Sites-navigator-berlin/memory/feedback_browser_test_fetch_spy.md] (Browser-Test-Vorsicht)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context, Caveman-Modus full)

### Debug Log References

- Unit-Tests fully scoped: 105/105 green across bookmark-store (24), focus-trap (6), ui-context (18), bookmark-dialog (17), site-header (15), inspector-panel (25)
- type-check: 0 Errors, 0 Warnings über 5496 Files
- Vitest-Browser-Test-Zombie-Bug aus Memory `feedback_browser_test_fetch_spy.md` umgangen: keine fetch-spies in *.svelte.test.ts, alle Storage-Tests nutzen FakeStorage-Mock
- Pivot während Implementation: dialog handleSelect ruft `selection.set` statt direkter `ui.selectedAddress`-Mutation, damit die volle Page-Pipeline (openInspectorFor → flyTo → marker → LayerHits → Climate) automatisch greift
- Inspector-Toolbar-Pivot post initial implementation: Footer-Zeile wandert nach oben (sticky unter Header), Bookmark-Action ergänzt

### Completion Notes List

- ✅ AC-1 Header-Trigger + Badge + filled/outline Icon-Toggle (+ Pivot: zusätzlich Inspector-Toolbar-Trigger)
- ✅ AC-2 Bookmark-Dialog mit Desktop+Bottom-Sheet, vanilla role=dialog, aria-modal, aria-labelledby, Close-Button, Save-Action-Row, Sortierung createdAt desc, Footer mit Counter + Alle-löschen + Datenschutz-Link
- ✅ AC-3 Bookmark anlegen via uuid + ISO-Timestamp + LocalStorage-Write + ui.bookmarks reactive + Save-Confirmation 1.8s + aria-live + NEVER toast eingehalten
- ✅ AC-4 Bookmark-Select setzt selection.current → triggert via existing $effect die volle openInspectorFor-Pipeline (Map-Fly + Marker + Inspector + URL-State + LayerHits)
- ✅ AC-5 Delete-Inline-Confirm pro Row mit 8s-Auto-Revert; Clear-All gleiche Pattern; MAX_BOOKMARKS=50; limit-reached-Hinweis; persistFailed-Banner für Quota-/Privacy-Mode-Fehler
- ✅ AC-6 Schema-Versionierung schemaVersion=1 mit migration-ready Schema-Wrapper; SSR-safe (typeof window-Guard via Storage|null); queueMicrotask-debounced Persist-Effect; Cross-Tab `storage`-Event-Listener im +layout.svelte
- ✅ AC-7 ADR-004-cookieless mit Context/Decision/Consequences-Stub befüllt + Bookmark-Exception-Section (TDDDG §25 Abs. 2 Nr. 2 + DSK-OH-Telemedien-Merkliste); Datenschutz-Snippet als Markdown unter `_bmad-output/planning-artifacts/datenschutz-bookmarks-snippet.md`; MUST-Rule #10 in architecture.md annotiert; Compliance-Runbook unter `docs/runbooks/bookmark-storage.md`
- ✅ AC-8 A11y: role=dialog + aria-modal=true + aria-labelledby; Focus-Trap-Utility neu in `src/lib/utils/focus-trap.ts`; Initial-Focus deterministisch via `data-initial-focus`; Esc + Backdrop-Click schließen; aria-live="polite" für Save/Delete/Clear-Announces; `<ul role="list">` für Bookmark-Liste; reduced-motion nicht überschrieben (kein Slide-In)
- ✅ AC-9 Tests: 24 bookmark-store + 6 focus-trap + 6 ui-context (Bookmark-Cases) + 17 bookmark-dialog + 6 site-header (Bookmark-Cases) + 3 inspector-panel (Toolbar-Cases) Unit-Tests grün; 6 E2E-Cases inkl. axe-Check angelegt (Ausführung deferred zu CI)
- **Phase-2-Backlog:** Drag-Sort, Export/Import, Tags/Notes, Geräte-Sync (alle ADR-konform Phase-2)
- **Deferred:** axe-CI-Run, E2E-CI-Run, manueller Browser-Cross-Tab-Smoke (User-Verify-Phase analog Stories 1.13-1.25)

### File List

**Neu:**
- `src/lib/state/bookmark-schema.ts`
- `src/lib/state/bookmark-store.ts`
- `src/lib/state/bookmark-store.test.ts`
- `src/lib/utils/focus-trap.ts`
- `src/lib/utils/focus-trap.svelte.test.ts`
- `src/lib/components/atlas/bookmark-row.svelte`
- `src/lib/components/atlas/bookmark-dialog.svelte`
- `src/lib/components/atlas/bookmark-dialog-harness.svelte`
- `src/lib/components/atlas/bookmark-dialog.svelte.test.ts`
- `_bmad-output/planning-artifacts/datenschutz-bookmarks-snippet.md`
- `docs/runbooks/bookmark-storage.md`
- `tests/e2e/bookmark-flow.e2e.ts`

**Erweitert:**
- `src/lib/state/ui-context.svelte.ts` (bookmarks, bookmarksDialogOpen, addBookmark, removeBookmark, clearBookmarks)
- `src/lib/state/ui-context.svelte.test.ts` (+6 Bookmark-Cases)
- `src/lib/components/atlas/site-header.svelte` (Bookmark-Trigger + Badge)
- `src/lib/components/atlas/site-header.svelte.test.ts` (+6 Cases)
- `src/lib/components/atlas/inspector-panel.svelte` (Footer-Pivot zur sticky-Toolbar oben, Bookmark-Action)
- `src/lib/components/atlas/inspector-panel.svelte.test.ts` (+3 Cases)
- `src/routes/+layout.svelte` (Bootstrap-Load, Persist-Effect, Cross-Tab-Listener)
- `src/routes/(with-header)/+layout.svelte` (BookmarkDialog mount + Props-Wiring)
- `docs/adr/ADR-004-cookieless.md` (Context/Decision/Consequences befüllt + Bookmark-Exception)
- `_bmad-output/planning-artifacts/architecture.md` (MUST-Rule #10 Inline-Anmerkung zu ADR-004-Exception)

### Change Log

- 2026-05-15: Story 1.26 implementiert (TDD-first, ADR-012). 41 Unit-Tests + 6 Focus-Trap + 6 ui-context + 17 Dialog + 6 Header + 3 Inspector grün (gesamt 105/105). Pivot post initial-impl: Inspector-Footer-Zeile zur sticky-Toolbar oben mit Bookmark-Action.
- 2026-05-15: ADR-004-cookieless von Stub zu Accepted-Status promoted; Bookmark-Exception-Section per TDDDG §25 Abs. 2 Nr. 2 begründet.
