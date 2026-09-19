---
title: 'Portal-Skeleton /berlin-wahlen'
type: 'feature'
created: '2026-09-19'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '07ac9298cc08508559c1f54af9c8a027e38b1eee'
context:
  - '{project-root}/_bmad-output/specs/spec-berlin-wahlen/ux-blueprint.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Das Portal /berlin-wahlen existiert nicht; die Story-2-APIs haben kein UI. Es braucht das Gerüst, in das die Kapitel-Stories 4-8 einziehen: Scroll-Seite, Kapitel-Nav, seitenweiter Zustand, SEO, Methodik-Fuß.

**Approach:** Neue prerenderte Route nach dem /hitze-Muster plus Komponenten-Ordner `src/lib/components/wahl-portal/`. Sticky-Kapitel-Nav mit Scroll-Spy, Steuerleiste Reihe/Jahr/Ebene mit URL-Sync (`?reihe=&jahr=&ebene=`), Kapitel als Platzhalter-Sections mit Takeaway-Slot, Datenstand-Streifen und Quellen/Methodik-Akkordeon. Feature-Flag `wahlPortal`: Route rendert immer, aber `noindex` + keine Sitemap/llms-Einträge solange aus. Die ux-blueprint.md (Companion, im `context:`) ist bindend.

## Boundaries & Constraints

**Always:**
- Kapitel-Reihenfolge, Interaktions-Prinzipien und A11y-Pflichten exakt nach ux-blueprint.md; Kapitel 2-8 rendern als Platzhalter-Section mit Überschrift + Takeaway-Slot + `data-testid`.
- Ein seitenweiter Zustand Reihe/Jahr/Ebene (Context-API, MUST-Regel 16, kein Modul-Scope-`$state`); URL-Sync nach dem updates-Seiten-Muster (zwei `$effect`s, `goto` mit `replaceState/keepFocus/noScroll`, No-Op-Guard, Bootstrap-Guard); Parser/Serializer als pure Utility mit Unit-Test; ungültige Params fallen still auf Defaults (jüngste AGH-Reihe, Ebene kiez).
- Jahr-Auswahl zeigt Wiederholungswahlen als eigene Chips mit Flag (Daten aus `/api/wahl/list`).
- Steuer-Toggles nach dem `inspector-level-toggle`-Muster (`role="radiogroup"`, Arrow/Home/End); Sticky-Nav `top-[var(--header-height,72px)]`, Scroll-Spy per IntersectionObserver, aktives Kapitel `aria-current="true"`; `prefers-reduced-motion` respektieren (kein smooth-scroll).
- SEO komplett: SeoHead (canonical strippt Query automatisch), `noindex={!featureFlags.wahlPortal}`, JSON-LD DataCatalog + BreadcrumbList, OG `/og/page/berlin-wahlen.png` (PAGE_TARGETS), Sitemap- und llms-Eintrag NUR bei Flag an (beide gemeinsam, sonst bricht `llms-sitemap-consistency.test.ts`); Sitemap-Bestandslücke `/methodik/wahldaten` mit schließen.
- `prerender = true` mit DB-los-Leerzustand (Muster wahl-Index); Kapitel-Daten laden client-seitig über die Story-2-APIs.
- lint:wahl erfassst alle Portal-Dateien: `SCAN_DIRS` um `src/lib/components/wahl-portal` und `src/routes/(with-header)/berlin-wahlen` erweitern, Pattern dort alle `.svelte`/`.ts`; Datenstand-Streifen und Fußnote nutzen `editorial-disclaimer`-Muster.
- TDD (ADR-012): URL-State-Utility, State-Context und Nav-Logik test-first; Browser-Tests (`.svelte.test.ts`) für Steuerleiste + Kapitel-Nav; Dateien unter 500 Zeilen; kein Push/Deploy (Freeze).

**Never:**
- Keine Karten, Charts oder echten Kapitel-Inhalte (Stories 4-8); keine Einstiegs-Verlinkung von Home/Footer/Inspector (Story 11); keine Detailseiten-Migration (Story 10).
- Kein `error(404)` am Flag; keine Änderung bestehender Routen außer den genannten SEO-Registrierungen.
- Kein localStorage/Cookies für den Zustand (MUST-Regel 10, URL-State only).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kaltstart | `/berlin-wahlen` ohne Params | Default-Zustand: jüngste AGH-Reihe, Ebene kiez, kein Query-Müll in der URL | N/A |
| Deep-Link | `?reihe=btw&jahr=2021&ebene=bezirk` | Zustand exakt hergestellt, Nav + Steuerleiste spiegeln ihn | ungültige Werte → Defaults, Params werden bereinigt |
| Reihen-Wechsel | Klick BVV | Jahr-Chips wechseln auf BVV-Jahre; ungültiges gewähltes Jahr springt auf jüngstes der Reihe | N/A |
| Scroll | Nutzer scrollt zu Kapitel 5 | Nav markiert Kapitel 5 (`aria-current`), URL bleibt unverändert | N/A |
| DB-los / API leer | Build ohne DATABASE_URL | Seite prerendert mit Leerzustand-Hinweis, keine 5xx, Steuerleiste disabled | N/A |
| Flag aus | `wahlPortal: false` | Route erreichbar, `noindex`, kein Sitemap/llms-Eintrag | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/hitze/+page.svelte:113-125` -- SEO-Block-Vorlage (SeoHead+JsonLd+OG-Pfad) und Section-Bauform; Portal-Route analog unter `(with-header)/berlin-wahlen/`.
- `src/routes/(with-header)/wahl/+page.server.ts:5,34` -- prerender=true mit DB-los-Leerzustand.
- `src/lib/data/feature-flags.ts:5-16` -- Flag `wahlPortal: false` ergänzen (Start-Zustand bis UX-Review).
- `src/routes/(with-header)/updates/+page.svelte:23-45` -- bidirektionaler URL-Sync (zwei `$effect`s + Guards); `src/lib/utils/url-state.ts` -- Ort/Konvention für Parser (`parsePortalState`, `serializePortalState`) + Test.
- `src/lib/components/atlas/inspector-panel/inspector-level-toggle.svelte:4-59` -- Radiogroup-Toggle-Vorlage für Reihe/Ebene; Jahr-Chips analog.
- `src/routes/(with-header)/methodik/+page.svelte:150-166` -- TOC/Section-Markup-Vorlage; Scroll-Spy neu per IntersectionObserver (Setup/Teardown-Muster: `home-featured-score.svelte:73`).
- `src/lib/components/atlas/site-header.svelte:85-86` -- `--header-height`-Var für die zweite Sticky-Ebene (Vorbild `bookmark-dialog.svelte:219`).
- `src/routes/(with-header)/umwelt-infrastruktur-score/+page.svelte:92-113` -- bits-ui-Accordion-Vorlage fürs Quellen/Methodik-Akkordeon (Inhalte: Quelle+Lizenz aus `/api/wahl/list`, Links /methodik/wahldaten + /lizenzen).
- `src/lib/components/atlas/editorial-disclaimer.svelte:4-48` + `internal/editorial-types.ts` -- neue Variante für die Portal-Fußnote; Datenstand-Streifen als eigene kleine Portal-Komponente (nicht der LayerHit-gebundene data-stand-banner).
- `src/lib/seo/sitemap-builder.ts:104-132,169-177` + `llms-builder.ts:42-107` + `llms-sitemap-consistency.test.ts:65-67` -- Registrierung flag-abhängig, `/methodik/wahldaten` ergänzen; `sitemap-builder.test.ts:129-172` mitziehen.
- `scripts/generate-og-images.ts:52-138` -- PAGE_TARGETS-Eintrag `berlin-wahlen`.
- `scripts/lint-wahl-editorial.ts:7-16` -- SCAN_DIRS-Erweiterung mit Verzeichnis-eigenem Pattern.
- `src/lib/components/home/home-wahl-teaser.svelte` -- NICHT anfassen (Story 11); `bottom-sheet.svelte` nur referenzieren, mobile Steuerleiste ist v1 eine sticky Bottom-Leiste ohne Sheet.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/utils/wahl-portal-url-state.ts` + `.test.ts` -- Parser/Serializer für reihe/jahr/ebene zuerst (rot), inkl. Ungültig-auf-Default-Fällen
- [x] `src/lib/state/wahl-portal-context.svelte.ts` + Test -- Context-API-Zustand (Reihe/Jahr/Ebene, verfügbare Wahlen aus /api/wahl/list, abgeleitete Jahr-Chips mit Wiederholungs-Flag)
- [x] `src/lib/components/wahl-portal/` -- `portal-steuerleiste.svelte` (+ `.svelte.test.ts`), `kapitel-nav.svelte` (+ Test: aria-current, Links), `kapitel-section.svelte` (Wrapper mit Überschrift/Takeaway-Slot), `portal-datenstand.svelte`, `portal-quellen.svelte`
- [x] `src/routes/(with-header)/berlin-wahlen/+page.svelte` + `+page.server.ts` -- Route mit allen 9 Kapiteln (2-8 als Platzhalter), SEO-Block, Flag-noindex, prerender
- [x] `src/lib/data/feature-flags.ts` -- `wahlPortal: false`
- [x] `src/lib/seo/sitemap-builder.ts` + `llms-builder.ts` + Tests -- flag-abhängige Registrierung + `/methodik/wahldaten`-Lücke
- [x] `scripts/generate-og-images.ts` -- PAGE_TARGETS `berlin-wahlen`; OG einmal generieren
- [x] `scripts/lint-wahl-editorial.ts` -- Portal-SCAN_DIRs; `pnpm lint:wahl` läuft grün über die neuen Dateien

**Acceptance Criteria:**
- Given ein Deep-Link mit gültigen Params, when die Seite lädt, then zeigen Steuerleiste und Nav exakt diesen Zustand, und Zustands-Änderungen schreiben die URL per replaceState ohne History-Spam.
- Given Flag aus, when Sitemap und llms.txt gebaut werden, then fehlt `/berlin-wahlen` in beiden und der Konsistenz-Test bleibt grün; die Seite trägt `noindex`.
- Given `pnpm vitest run` (server + client-Projekt für `.svelte.test.ts`), `pnpm check`, `pnpm lint:wahl`, then alles grün / 0 Errors.
- Given Axe auf `/berlin-wahlen` (Muster `a11y.e2e.ts`), then 0 Violations.

## Implementation Notes

Umgesetzt wie im Code Map beschrieben, plus eine Lücke aus dem Code-Map-Bullet zu `editorial-disclaimer.svelte` nachgezogen, die in der ersten Implementierungs-Runde übersehen wurde: neue `DisclaimerVariant` `wahl-portal-footnote` in `internal/editorial-types.ts` + Text in `editorial-disclaimer.svelte`, gerendert direkt unter dem Datenstand-Streifen im Kopf-Kapitel.

Entwurfsentscheidungen (nicht im Code Map vorgegeben, hier begründet):

- **`jahr`-URL-Semantik:** `jahrOverride: null` heißt „kein expliziter User-Pick", nicht „ältestes Jahr". Die Context-Schicht löst daraus live das jüngste Jahr der aktuellen Reihe auf (`currentJahr`). Das hält Kaltstart und Reihen-Wechsel frei von Default-Query-Müll, auch nachdem `/api/wahl/list` geladen hat.
- **Reihen-Wechsel-Validierung:** `setReihe` und `applyWahlList` prüfen beide, ob ein gesetzter `jahrOverride` zur (neuen oder gerade geladenen) Reihe passt, und setzen ihn sonst still auf `null` zurück (AC „ungültiges gewähltes Jahr springt auf jüngstes der Reihe").
- **`portal-steuerleiste` `disabled`-Prop:** explizit statt aus `jahrOptions.length === 0` lokal abgeleitet, damit die Seite volle Kontrolle behält (disabled nur wenn die komplette Wahl-Liste leer ist, nicht nur die aktuell gewählte Reihe).
- **`+page.server.ts` bleibt leer:** kein DB-Zugriff, `prerender = true` reicht. Die Steuerleiste und alle Kapitel-Substanz laden client-seitig über `/api/wahl/list` (Design Notes).
- **`nextRadioIndex`-Util:** Arrow/Home/End-Logik aus dem `inspector-level-toggle`-Muster in eine eigene pure Function extrahiert (`internal/radiogroup-keyboard.ts`), von allen drei Toggle-Gruppen der Steuerleiste geteilt statt dreifach kopiert.

Nach Review + Live-Test (Matze) neun Patches: jahreForReihe-Dedupe
(each_key_duplicate 2023), untrack() im URL-Pull-Effect (Klick-Revert-Loop),
Scroll-Spy auf Leselinien-Logik umgebaut + Klick-setzt-aktiv, „Kopf" →
„Überblick" (id ueberblick), steuerleisteDisabled vereinfacht, Keyboard-Guard
bei disabled, Flag-Assertions an echten Endpoint-Handlern, neutrale
Platzhalter-Texte, Ebene berlin entfernt, resolve()-Links in portal-quellen.
Neu: tests/e2e/berlin-wahlen.e2e.ts (URL-Sync + Nav-Klick, grün gegen Build).

## Spec Change Log

## Review Triage Log

| # | Quelle | Finding | Verdict | Evidenz / Route |
|---|--------|---------|---------|-----------------|
| 1 | Matze (live) | `each_key_duplicate` 2023: /api/wahl/list liefert pro Jahr zwei Stimmtyp-Rows, jahreForReihe dedupliziert nicht | high | Live reproduziert; rotem Test bestätigt. → **patch** (Dedupe + Test + E2E-Count) |
| 2 | edge + Matze (live) | Zwei-Effect-Feedback-Loop: URL-Pull-Effect liest Portal-State getrackt, jeder Klick wird mit alter URL revertiert | high | Svelte-Doku nennt exakt dieses Anti-Muster; per E2E belegt. → **patch** (untrack im Pull-Effect + E2E) |
| 3 | Matze (live) | Scroll-Spy markiert nach Nav-Klick falsches Kapitel (Band-Ansatz + kurze Platzhalter-Sections); „Kopf" ist internes Jargon im UI | high | Screenshot; Band-Logik ersetzt durch Leselinien-Logik + Klick-setzt-aktiv, „Kopf" → „Überblick". → **patch** (+ Component-Test) |
| 4 | edge + verification-gap | steuerleisteDisabled während `loading` faelschlich enabled | medium | Bedingung invertiert. → **patch** (`wahlen.length === 0`) |
| 5 | blind | Keyboard bewegt Fokus in disabled-Radiogroups | low | Inkonsistent zu aria-disabled. → **patch** (early return) |
| 6 | verification-gap | Flag-Verdrahtung an echten sitemap/llms-Handlern ungetestet | medium | Builder-Tests injizieren den Wert direkt. → **patch** (Assertions in endpoints-/llms-endpoints-Tests) |
| 7 | eigene Sichtung | Platzhalter-Takeaways nennen interne Story-Nummern im User-Text | low | → **patch** (neutrale Texte) |
| 8 | eigene Sichtung | Ebene `berlin` im URL-State ohne API-Gegenstück | low | series/winners kennen nur kiez/bezirk. → **patch** (EBENE_VALUES verkleinert) |
| 9 | blind + edge | `Dirent.parentPath` bricht auf Node < 20.12 | false | Node per .nvmrc auf 22 gepinnt (lokal v22.22.3), Docker Node 22. |
| 10 | blind | Roving-Tabindex: alle Jahr-Chips könnten tabindex=-1 bekommen | false | currentJahr liefert immer ein Jahr AUS den Optionen (Override validiert, sonst jüngstes); leere Optionen rendern die Gruppe nicht. |
| 11 | blind | aria-current="location" statt "true" | rejected | Frozen-Spec schreibt "true" vor; beide ARIA-konform. |
| 12 | edge | goto() ohne .catch bei schnellen Doppel-Klicks | low, rejected | Identisches Haus-Muster in explore (void goto); kein beobachteter Fehler. |
| 13 | edge (3 Findings) | chapters-Prop-Wechsel nach Mount / `__`-Delimiter-Kollision / API-Shape-Validierung in loadWahlList | low, rejected | Chapters sind statisch; Quell-Namen enthalten kein `__`; same-origin-API mit kontrolliertem Shape (Haus-Muster Cast). |
| 14 | blind | Editorial-Lint scannt Test-Probe-Datei | low, rejected | Lief grün (14 Dateien, 0 Verstöße); Probe-Inhalt ist harmlos deutsch. |
| 15 | blind + verification-gap | Scroll-Spy-IO-Logik, noindex-Wiring und lint-Script-Rekursion ohne Tests | medium (Coverage) | Klick-Pfad jetzt per Component- und E2E-Test gedeckt; Rest → **defer** |


## Design Notes

Flag-Verhalten ist bewusst neu festgelegt (im Repo existierte kein Muster für flag-gated Routen): Route rendert immer, Indexierung und Einträge hängen am Flag. So kann Matze das Portal auf Prod per Direkt-URL reviewen, bevor es sichtbar wird. Kapitel-Daten kommen client-seitig aus den gecachten Story-2-APIs; das prerenderte Shell trägt die statische Prosa, die Index-Substanz liegt auf den Detailseiten (Story 10).

## Verification

**Commands:**
- `pnpm vitest run --project server` und `pnpm vitest run --project client` -- expected: grün inkl. neuer Tests
- `pnpm check` -- expected: 0 Errors
- `pnpm lint:wahl` -- expected: 0 Verstöße in den Portal-Dateien
- `pnpm exec playwright test tests/e2e/a11y.e2e.ts` (falls lokal lauffähig) -- expected: 0 Violations für /berlin-wahlen; sonst manueller Axe-Check im Dev-Server

**Ergebnisse (lokal, 2026-09-19):**
- `pnpm vitest run --project server` -- 285 Dateien, 2634 Tests grün.
- `pnpm vitest run --project client` -- 95 Dateien, 816 Tests grün.
- `pnpm check` -- 6426 Dateien, 0 Errors, 0 Warnings.
- `pnpm lint:wahl` -- 14 Dateien gescannt, 0 Verstöße.
- `pnpm exec playwright test tests/e2e/a11y.e2e.ts -g "Berlin-Wahlen-Portal"` gegen einen echten `pnpm build`-Prerender + `vite preview` -- 1 passed, 0 axe-Violations.
- Manueller Dev-Server-Check: Kaltstart (kein Query), Deep-Link (`?reihe=btw&jahr=2021&ebene=bezirk`, Canonical strippt Query korrekt), Flag an/aus (noindex + Sitemap/llms-Eintrag korrekt togglen).
- **Kritischer Fund + Fix während der Verifikation:** Ein echter `pnpm build`-Lauf zeigte `[500] GET /berlin-wahlen` beim Prerender (`Error: Cannot access url.searchParams on a page with prerendering enabled`), obwohl `pnpm check`/Vitest/Dev-Server unauffällig waren -- Ursache war ein eager `page.url.searchParams`-Read auf Script-Top-Level (läuft während SSR/Prerender), nicht in den `$effect`s selbst. Fix: Context startet immer mit den URL-unabhängigen Defaults (`DEFAULT_REIHE`/`DEFAULT_EBENE`/`jahr: null`), der Deep-Link-Zustand zieht erst im ersten (client-only) Pull-`$effect` nach. Re-Build danach fehlerfrei, `berlin-wahlen.html` prerendert korrekt (verifiziert per Datei-Inhalt: Titel, `noindex`, alle 9 Kapitel, Footnote-Disclaimer, Default-Steuerleiste-State).
