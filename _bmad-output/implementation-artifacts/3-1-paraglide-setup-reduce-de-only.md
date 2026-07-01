# Story 3.1: Paraglide-Setup-Reduce auf DE-only (Phase 1)

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a Solo-Maintainer,
I want den aktuellen 8-Sprachen-Paraglide-Setup auf DE-only reduzieren ohne die Paraglide-Infrastruktur rauszubauen, alle Non-DE-Bundles löschen, den Cookieless-Linie konformen Locale-Strategy-Stack einsetzen und Paraglide neu kompilieren,
so that wir auf einem klaren, scope-konsistenten DE-only-Setup für Phase 1 aufsetzen, kein Tot-Code-Drift in `messages/`/`paraglide/` mehr existiert, das `PARAGLIDE_LOCALE`-Cookie nicht mehr gesetzt wird (ADR-004 MUST-Rule #10), und die EN-Reaktivierung in Phase 3 ohne Setup-from-scratch möglich bleibt.

## Phase-1-Kontext (User-Lock 2026-05-16)

EN-Coverage komplett verschoben in Future-Epic „i18n-Phase-3-EN-Coverage" (Stories 3.2–3.5 archiviert in `_bmad-output/planning-artifacts/epics.md` Zeilen 1707–1820). Phase 1 zeigt Site ausschließlich auf Deutsch. Begründung in `_bmad-output/planning-artifacts/epics.md#Epic-3` Zeilen 1658–1664: i18n-Phase-1-EN-Variante wurde auf ~3–4 Wochen Solo-Equivalent geschätzt; Personas alle DE-sprachig; Beratungs-Asset-Demand DE-Berlin-Kunden ≥95%; LLM-Discovery rangiert auch DE-Content für DACH-Antworten. Post-Hard-Launch-Reaktivierung (Phase 3, T+12w+) wenn Search-Console- oder LLM-Referrer-Daten EN-Demand zeigen.

**Konsequenz für FR-Map:** FR55a–FR55j und NFR-IL1–IL10 (`prd.md` Zeilen 770–779 + 884–892) sind für Phase 1 DEFERRED. Story 3.1 IGNORIERT diese FRs/NFRs und reduziert Infrastruktur auf DE-only. Memory-Marker: `feedback_no_lebenswert`, `project_paraglide_reroute`, `project_i18n_phase_1_de_only`.

## Acceptance Criteria

**AC-1 (Inlang-Settings auf DE-only):**

**Given** der bestehende Inlang-Setup in `project.inlang/settings.json` mit `baseLocale: "en"` und `locales: ["en","de","fr","es","it","pl","tr","ar"]`
**When** ich `settings.json` editiere
**Then** `baseLocale: "de"` UND `locales: ["de"]`
**And** Inlang-Plugins-Liste (`modules`) bleibt unverändert (`@inlang/plugin-message-format@4` + `@inlang/plugin-m-function-matcher@2`)
**And** `pathPattern: "./messages/{locale}.json"` bleibt unverändert

**AC-2 (Non-DE-Message-Bundles löschen):**

**Given** die existierenden Message-Bundles in `messages/{ar,en,es,fr,it,pl,tr,de}.json`
**When** ich `git rm messages/{ar,en,es,fr,it,pl,tr}.json` ausführe
**Then** keine toten Bundles im Repo
**And** `messages/de.json` bleibt als einziger Bundle erhalten (Stock-Inhalt `hello_world` reicht für Foundation, Phase-3-FR55g-Befüllung kein Scope dieser Story)
**And** Git-History bewahrt die gelöschten Bundles für Future-Epic „i18n-Phase-3-EN-Coverage"-Rebase (kein `--force`, keine History-Rewrite-Operationen)

**AC-3 (Paraglide-Compile-Output reduziert):**

**Given** der bestehende Paraglide-Compile-Output in `src/lib/paraglide/messages/` (aktuell `_index.js` + `hello_world.js`)
**When** ich `pnpm dev` (oder einen expliziten Compile-Trigger) laufen lasse, der via `paraglideVitePlugin` in `vite.config.ts` Auto-Recompile auslöst
**Then** `src/lib/paraglide/runtime.js` exportiert `locales = ["de"]` und `baseLocale = "de"`
**And** `src/lib/paraglide/messages/` enthält weiterhin nur `_index.js` + `hello_world.js` (Message-Funktion bleibt — Bundle-Count nicht Locale-Count)
**And** keine `urlPatterns`-Einträge mehr für `en|fr|es|it|pl|tr|ar` (siehe `src/lib/paraglide/runtime.js` Zeilen 62–94 aktuell)

**AC-4 (Cookieless-Strategy-Stack — ADR-004 MUST-Rule #10):**

**Given** der aktuelle Default-Strategy-Stack in `src/lib/paraglide/runtime.js` Zeilen 30–34: `["cookie", "globalVariable", "baseLocale"]` (gesetzt durch Paraglide-Default, nicht durch explizites Override)
**When** ich `project.inlang/settings.json` um den expliziten Paraglide-Strategy-Override erweitere (`"plugin.inlang.paraglideJs": { "strategy": ["baseLocale"] }`) ODER alternativ via `paraglideVitePlugin({ project, outdir, strategy: ["baseLocale"] })`-Argument in `vite.config.ts` Zeile 11
**Then** Compiled `runtime.js` `strategy`-Array enthält ausschließlich `"baseLocale"`
**And** `cookieName = "PARAGLIDE_LOCALE"`-Konstante wird durch Compile entweder entfernt ODER bleibt unbenutzt (TREE_SHAKE_COOKIE_STRATEGY_USED = false; siehe `runtime.js` Zeile 190)
**And** Manueller Verifikations-Test: `curl -I http://localhost:5173/` zeigt KEIN `Set-Cookie: PARAGLIDE_LOCALE=...`-Response-Header (Pflicht nach ADR-004 + MUST-Rule #10 in `architecture.md` Zeile 1062 + NFR-PR1)

**AC-5 (Hardcoded Locale-Type in `src/lib/data/types.ts` reduzieren):**

**Given** `src/lib/data/types.ts` Zeile 8: `export type Locale = 'de' | 'en' | 'tr' | 'uk' | 'ar' | 'es' | 'fr' | 'it';`
**When** ich den Type-Alias auf Phase-1-Scope reduziere
**Then** `export type Locale = 'de';`
**And** Konsumenten `src/lib/server/geocode.ts` Zeilen 84/101/138/152 + `src/lib/data/get-kiez-profile.ts` Zeile 13 + `src/lib/data/get-bezirk-profile.ts` Zeile 13 + `src/lib/data/get-layer-detail.ts` (über `buildLayerDetail`) bleiben kompilierbar (alle nutzen `lang: Locale = 'de'` als Default, Reduce ist kompatibel)
**And** `src/lib/server/db/queries/get-faq-qna.ts` Zeile 8 BEHÄLT eigenständigen `type Locale = 'de' | 'en'` (DB-Schema Phase-3-ready, FAQ-Tabelle locale-Enum bleibt für Future-Migration, siehe `src/lib/server/db/schema/faq-qna.ts` Zeile 9 Kommentar)
**And** `pnpm check` (svelte-check strict) bleibt grün

**AC-6 (Component-Usage-Audit — keine tot-References):**

**Given** der Paraglide-Verbrauch im aktuellen Code
**When** ich `grep -rn "from '\$lib/paraglide" src/` ausführe
**Then** die Treffer beschränken sich auf:
  - `src/hooks.ts` Zeile 2: `import { deLocalizeUrl } from '$lib/paraglide/runtime'` (Reroute-Hook, bleibt funktional)
  - `src/hooks.server.ts` Zeilen 2–3: `getTextDirection` + `paraglideMiddleware` (bleibt funktional, gibt mit `["baseLocale"]`-Strategy konstant `"de"` + `"ltr"` zurück)
  - `src/routes/+layout.svelte` Zeile 6: `locales, localizeHref` (Hidden-Crawler-Discovery-Loop in Zeilen 56–60 rendert mit `locales=["de"]` genau 1 Link — funktional ein No-Op aber kein Build-Fehler)
  - `src/routes/(with-header)/layer/[slug]/+page.ts` Zeile 4: `getLocale()` (gibt konstant `"de"` zurück nach Reduce — kein Refactor nötig)
**And** Keine Komponente importiert mehr eine gelöschte Locale-Konstante oder `m.*`-Funktion gegen nicht-existente Locale
**And** Keine `setLocale()`/`setLocale`-Call-Site existiert (`grep -rn "setLocale" src/` liefert 0 Treffer — kein Sprach-Switcher in Phase 1)

**AC-7 (Routing-Verhalten verifiziert — Memory `project_paraglide_reroute`):**

**Given** SvelteKit-Reroute-Hook `src/hooks.ts` mit `deLocalizeUrl(request.url).pathname`
**When** ich Routes ohne `[lang]`-Param aufrufe (`/`, `/methodik`, `/layer/<slug>`, `/lizenzen`)
**Then** alle Routes laden ohne 404 oder Locale-Mismatch-Errors
**And** `getLocale()` liefert konstant `"de"` ohne URL-Prefix-Logic
**And** Bei vorhandenem alten URL-Prefix (`/de/...` oder `/en/...`) testet die Reroute-Logik nach Reduce auf 1-Locale weiterhin korrekt (`/de/methodik` → `deLocalizeUrl` strippt zu `/methodik` ODER liefert 404, je nach Paraglide-2-Verhalten bei `urlPatterns`-Reduce; falls 404 → Smoke-Test dokumentiert, kein Redirect-Setup nötig in Phase 1)

**AC-8 (Vite-Plugin + Build-Step grün):**

**Given** der bestehende Paraglide-Vite-Plugin-Setup in `vite.config.ts` Zeile 11
**When** ich verifiziere dass `vite.config.ts` keine Multi-Locales-Hardcode-Liste enthält und Reroute-Hook korrekt für Single-Locale arbeitet
**Then** `pnpm build` bleibt grün ohne Locale-Ref-Errors
**And** `pnpm check` (svelte-check strict) bleibt grün
**And** `pnpm test:unit` bleibt grün
**And** Paraglide-Vite-Plugin bleibt installiert (keine `pnpm remove @inlang/paraglide-js`, Foundation für Phase 3)

**AC-9 (DE-Master-Strings-Audit — nicht-blocking für Phase 1):**

**Given** die DE-Master-Strings in `messages/de.json` (aktuell nur `{ "hello_world": "Hello, {name} from de!" }`)
**When** ich Existenz aller benötigten UI-Keys gegen Component-Usage prüfe (`grep -rn "import \* as m\|from '\$lib/paraglide/messages" src/`)
**Then** das aktuelle Resultat liefert 0 Treffer (keine Komponente nutzt aktuell Paraglide-Messages — alle Strings hardcoded DE)
**And** MUST-Rule #14 „i18n-First" (`architecture.md` Zeile 1066) wird für Phase 1 explizit DEFERRED (siehe Phase-1-Kontext oben) — Hardcoded-DE-Strings sind bewusste Phase-1-Realität
**And** Dieser Audit DOKUMENTIERT den Zustand für Phase-3-Migration (Story-Set 3.2–3.5 archiv), aber refactoriert KEINE Komponenten in dieser Story

**AC-10 (Future-EN-Reaktivierung dokumentiert):**

**Given** Future-EN-Reaktivierung in Phase 3
**When** ich `docs/i18n-reactivation.md` neu anlege
**Then** Dokument enthält schrittweise Anleitung:
  1. `project.inlang/settings.json` — `locales`-Array erweitern auf `["de", "en"]`, ggf. `baseLocale` beibehalten als `"de"`
  2. Paraglide-Recompile via `pnpm dev` oder explizitem CLI-Call
  3. `messages/en.json` neu anlegen (Git-History-Restore-Hinweis: `git checkout <pre-2026-05-16-commit-hash> -- messages/en.json` UND danach Phase-3-Coverage-Sprint)
  4. Translation-Workflow aufsetzen (Referenz auf archivierte Story 3.5 in `epics.md` Zeilen 1808–1827)
  5. hreflang-Cluster aktivieren (Referenz auf archivierte Story 3.3 + FR55e)
  6. LanguageSwitcher-Komponente bauen (Referenz auf archivierte Story 3.3 + FR55d)
  7. `src/lib/data/types.ts` `Locale`-Type wieder auf `'de' | 'en'` erweitern
  8. Strategy-Stack auf `["url", "baseLocale"]` ändern (URL-Prefix-Routing, weiterhin cookieless)
**And** Dokument verweist auf Future-Epic „i18n-Phase-3-EN-Coverage" in `epics.md` und auf User-Lock 2026-05-16

**AC-11 (ADR-005 aktualisieren):**

**Given** `docs/adr/ADR-005-i18n-paraglide.md` als Stub (Status `Proposed`, leerer Body)
**When** ich ADR-005 mit Phase-1-DE-only-Decision befülle
**Then** ADR enthält:
  - **Status:** `Accepted` mit `revised: 2026-05-16`
  - **Context:** ursprünglich 8-Sprachen-Architektur (FR55a–FR55j, NFR-IL1–IL10), reduziert auf DE-only per User-Lock 2026-05-16; Aufwand-Schätzung 3–4 Wochen Solo-Equivalent
  - **Decision:** Phase 1 = DE-only via Paraglide v2 + `["baseLocale"]`-Strategy + ohne URL-Prefix-Routing; Phase 3 = EN-Reaktivierung mit URL-Prefix
  - **Consequences:** positive (kürzere Time-to-Launch, kein Translation-Quality-Gate Phase 1), negative (FR55-Block deferred, ~1.600 prerendered Routes-Skalierung deferred); Operational (Cookie-Gate CI-Check NFR-PR1, MUST-Rule #14 deferred)
  - **References:** `epics.md#Epic-3`, `docs/i18n-reactivation.md`, ADR-004 (Cookieless), `prd.md` FR55-Block (deprecated für Phase 1)

**AC-12 (Smoke-Test für DE-only-State):**

**Given** der reduzierte Setup
**When** ich `tests/i18n-de-only.spec.ts` als Vitest-Server-Spec implementiere
**Then** Spec verifiziert per Import aus `$lib/paraglide/runtime`:
  - `locales` strict-equals `["de"]`
  - `baseLocale` strict-equals `"de"`
  - `getLocale()` returns `"de"` (server-context)
  - `strategy`-Array enthält ausschließlich `"baseLocale"` (keine `"cookie"`/`"url"`/`"globalVariable"`/`"localStorage"`/`"preferredLanguage"`)
**And** Spec läuft in `vitest`-Server-Project (siehe `vite.config.ts` Zeilen 56–68 — Node-Environment, kein Browser)
**And** `pnpm test:unit` bleibt grün

## Tasks / Subtasks

- [ ] **Task 1: Inlang-Settings reduzieren (AC: #1, #4)**
  - [ ] Edit `project.inlang/settings.json`: `baseLocale` → `"de"`, `locales` → `["de"]`
  - [ ] Add `paraglideVitePlugin`-Strategy-Override in `vite.config.ts` Zeile 11: `paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide', strategy: ['baseLocale'] })` (Strategy via Vite-Plugin-Argument ist robuster als settings.json-Property — siehe Paraglide-2-Docs)
  - [ ] Trigger Compile: `pnpm dev` startet, Vite-Plugin recompiled automatisch (oder kill+restart)

- [ ] **Task 2: Non-DE-Bundles entfernen (AC: #2)**
  - [ ] `git rm messages/ar.json messages/en.json messages/es.json messages/fr.json messages/it.json messages/pl.json messages/tr.json`
  - [ ] Verify `messages/de.json` bleibt erhalten
  - [ ] Verify Git-Status zeigt 7 Deletions

- [ ] **Task 3: Paraglide-Compile-Output verifizieren (AC: #3, #4)**
  - [ ] Inspect `src/lib/paraglide/runtime.js`:
    - `locales` = `["de"]`
    - `baseLocale` = `"de"`
    - `strategy` = `["baseLocale"]`
    - `urlPatterns` enthält nur de-Pattern oder ist leer (1-Locale baseLocale-only Routing)
    - `TREE_SHAKE_COOKIE_STRATEGY_USED` = `false`
  - [ ] Inspect `src/lib/paraglide/messages/`: nur `_index.js` + `hello_world.js`
  - [ ] Inspect `src/lib/paraglide/messages.js`: re-exportiert nur hello_world

- [ ] **Task 4: Cookie-Verifikation manuell (AC: #4)**
  - [ ] `pnpm dev` starten
  - [ ] `curl -I http://localhost:5173/` → Response-Headers prüfen
  - [ ] KEIN `Set-Cookie: PARAGLIDE_LOCALE=...` Header
  - [ ] Bei Fund: Strategy-Override prüfen, ggf. `settings.json` UND `vite.config.ts` setzen

- [ ] **Task 5: `Locale`-Type in `src/lib/data/types.ts` reduzieren (AC: #5)**
  - [ ] Edit Zeile 8: `export type Locale = 'de';`
  - [ ] `pnpm check` ausführen → kompiliert grün
  - [ ] Falls Type-Errors: Inspect `geocode.ts`/`get-kiez-profile.ts`/`get-bezirk-profile.ts` und narrow Default-Param-Values auf `'de'`

- [ ] **Task 6: Component-Usage-Audit (AC: #6, #9)**
  - [ ] `grep -rn "from '\$lib/paraglide" src/` → erwartete 4 Treffer (hooks.ts, hooks.server.ts, +layout.svelte, layer/[slug]/+page.ts)
  - [ ] `grep -rn "setLocale\|m\.[a-z]" src/` → 0 Treffer für `setLocale`, ggf. Treffer für `m.*`-Funktionsaufrufe (sollten 0 sein in Phase 1)
  - [ ] Falls Treffer: Dokumentation in Dev-Notes, kein Refactor (Phase-3-Scope)

- [ ] **Task 7: Routing-Smoke-Test (AC: #7)**
  - [ ] `pnpm dev` starten
  - [ ] Browser-Test `/`, `/methodik`, `/layer/kitas-2024`, `/lizenzen` → alle 200 OK
  - [ ] Verify `getLocale()` console.log gibt `"de"` zurück
  - [ ] Test `/de/methodik` und `/en/methodik` → Verhalten dokumentieren (404 oder Reroute)

- [ ] **Task 8: Vitest-Smoke-Spec schreiben (AC: #12)**
  - [ ] Create `tests/i18n-de-only.spec.ts`
  - [ ] Pattern: Server-Spec mit `import { locales, baseLocale, getLocale, strategy } from '$lib/paraglide/runtime'`
  - [ ] 4 Assertions: `locales`, `baseLocale`, `getLocale()`, `strategy`
  - [ ] `pnpm test:unit -- tests/i18n-de-only.spec.ts` → grün

- [ ] **Task 9: ADR-005 befüllen (AC: #11)**
  - [ ] Edit `docs/adr/ADR-005-i18n-paraglide.md`:
    - Frontmatter: `status: Accepted`, `revised: 2026-05-16`
    - Context-Section: 8-Sprachen-Original + User-Lock-Reduce
    - Decision-Section: DE-only Phase 1 + `["baseLocale"]`-Strategy
    - Consequences-Section: positive/negative/operational
    - References-Section: epics.md, i18n-reactivation.md, ADR-004, PRD-FR55-deprecated-Note

- [ ] **Task 10: i18n-Reactivation-Doc schreiben (AC: #10)**
  - [ ] Create `docs/i18n-reactivation.md`
  - [ ] 8-Schritte-Anleitung (siehe AC-10)
  - [ ] Verweise auf archivierte Stories 3.2–3.5 in epics.md Zeilen 1707–1827

- [ ] **Task 11: Build-/Test-Gates verifizieren (AC: #8)**
  - [ ] `pnpm check` → grün
  - [ ] `pnpm build` → grün
  - [ ] `pnpm test:unit` → grün
  - [ ] `pnpm lint` → grün
  - [ ] Optional: `pnpm test:e2e` smoke (Atlas-Render auf `/`, kein Sprach-Switcher-Bezug)

- [ ] **Task 12: Commit-Message (Convention)**
  - [ ] Single commit: `feat(i18n): paraglide-setup-reduce auf DE-only Phase 1 (story 3.1)`
  - [ ] Body: User-Lock 2026-05-16, ADR-005-Accepted, Cookie-Free-Strategy, 7 Locale-Bundles entfernt

## Dev Notes

### Aktueller Setup (vor Reduce)

- **`project.inlang/settings.json`:** `baseLocale: "en"`, 8 `locales`-Einträge (en/de/fr/es/it/pl/tr/ar), 2 Inlang-Plugins
- **`messages/`:** 8 Bundles, alle mit Stock-Inhalt `{ "$schema": "...", "hello_world": "Hello, {name} from <loc>!" }` (Hello-World-Stub, KEIN Production-Content)
- **`src/lib/paraglide/`:** Auto-generated von `paraglideVitePlugin`; `runtime.js` exportiert `locales=["en","de","fr","es","it","pl","tr","ar"]`, `baseLocale="en"`, `strategy=["cookie","globalVariable","baseLocale"]`, 8 URL-Patterns für `/de/...`/`/fr/...`/etc.
- **`messages/_index.js` + `hello_world.js`:** einzige kompilierte Message-Funktion (Stock-Demo, von Components nicht konsumiert)
- **Component-Verbrauch:** 4 Stellen — hooks.ts (reroute), hooks.server.ts (middleware), +layout.svelte (Hidden-Crawler-Loop), layer/[slug]/+page.ts (getLocale für buildLayerDetail)
- **`src/lib/data/types.ts` Zeile 8:** 8-Locale-Union-Type (Phase-1-Vorlage von alter PRD-Version)

### Architektur-Constraints

**MUST-Rule-Mapping (`architecture.md` Zeilen 1050–1073):**

- **Rule #10 (Cookieless):** Phase-1-Pflicht. `PARAGLIDE_LOCALE`-Cookie MUSS verschwinden. CI-Gate (Story 4.3) prüft Set-Cookie-Header-Absence in Production-Responses.
- **Rule #14 (i18n-First — keine hardcoded Strings):** Phase 1 DEFERRED (siehe Phase-1-Kontext oben). Hardcoded-DE-Strings sind bewusste Phase-1-Realität, Migration via Phase-3-Stories.

**Memory-Bezug:**

- **`project_paraglide_reroute`:** Routes ohne `[lang]`-Param anlegen, `getLocale()` statt `params.lang`. Bereits in Current-State eingehalten (SvelteKit-Routes haben kein `[lang]`-Segment). Reduce-Operation bricht diesen Memory NICHT.
- **`feedback_no_lebenswert`:** Während Reduce-Pass: keine Begriffs-Einführung relevant (kein UI-Content-Edit in dieser Story).
- **`project_i18n_phase_1_de_only`:** Konsistent mit User-Lock, dieser Story.

### Paraglide v2 Strategy-Stack — kritischer Punkt

Aktueller Default-Stack `["cookie", "globalVariable", "baseLocale"]` wird durch Paraglide gesetzt, wenn `strategy` nicht explizit definiert ist. Quelle: `@inlang/paraglide-js@^2.15.2` Defaults (siehe Paraglide-Docs https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy).

**Setzen-Pfade (2 Optionen):**

1. **Vite-Plugin-Argument (Recommended):** `paraglideVitePlugin({ project, outdir, strategy: ['baseLocale'] })` in `vite.config.ts`. Stable, typed, kein settings.json-Schema-Drift-Risiko.
2. **Inlang-settings.json:** `"plugin.inlang.paraglideJs": { "strategy": ["baseLocale"] }` — funktioniert in Paraglide 2, aber Schema-Property unter `inlang.com/schema/project-settings` weniger explizit dokumentiert. Fallback.

**Verifikation:** Nach Recompile MUSS `src/lib/paraglide/runtime.js` `strategy` als `["baseLocale"]` exportieren. Falls Stack weiterhin Cookie enthält → Recompile re-trigger, ggf. `pnpm prepare` + `pnpm dev`-Kaltstart.

### Type-Reduce in `src/lib/data/types.ts` — Risiko-Analyse

Aktuelle Konsumenten von `Locale`:

- `src/lib/server/geocode.ts` — `lang: Locale = 'de'` Default. Reduce auf `'de'`-only kompatibel (Default ist bereits 'de').
- `src/lib/data/get-kiez-profile.ts` Zeile 13 — `_lang: Locale` (Underscore-Prefix: unused). Reduce kompatibel.
- `src/lib/data/get-bezirk-profile.ts` Zeile 13 — gleiches Pattern.
- `src/lib/data/get-layer-detail.ts` (über `buildLayerDetail(slug, getLocale(), manifest)`) — nutzt `getLocale()` return-type. Nach Reduce ist `getLocale()` per Paraglide-Compile typed als `Locale = "de"`. `buildLayerDetail`-Signatur muss `Locale`-Type aus `data/types.ts` ODER `paraglide/runtime`-Type konsumieren. **Open Question:** welcher Type ist authoritativ?
- `src/lib/server/db/queries/get-faq-qna.ts` Zeile 8 — **eigener** `type Locale = 'de' | 'en'`. Phase-3-ready DB-Schema. NICHT von `data/types.ts` konsumiert (eigene lokale Definition). Bleibt unverändert.

**Empfehlung:** `data/types.ts` `Locale` auf `'de'` reduzieren. `get-faq-qna.ts` behält eigene `Locale` für DB-Tabellen-Phase-3-Foundation. Falls Type-Konflikte: `buildLayerDetail`-Signatur akzeptiert `string` und narrowt intern auf `'de'`, bis Phase-3-Type-Erweiterung greift.

### URL-Patterns nach Reduce

Aktueller `urlPatterns` in `runtime.js` Zeilen 62–94: 8 Einträge mit Localized-Variants `/de/:path(*)`, `/fr/:path(*)` etc., plus `en` als unlokalisiertes Pattern.

Nach Reduce auf 1 Locale + `["baseLocale"]`-Strategy: `urlPatterns` sollte entweder leer sein ODER nur ein de-Pattern enthalten, das auf `:protocol://:domain(.*)::port?/:path(.*)?` (unlokalisiert) mapped. Vite-Plugin-Recompile-Output verifizieren — falls `urlPatterns` 1 Eintrag mit `localized: [["de", "/:path(*)"]]` enthält, ist das korrekt.

**Risiko:** Existierende Bookmarks/Shares mit `/de/...`/`/en/...`-Prefix werden nach Reduce ggf. zu 404. Phase-1-Aktzeptanz: keine bekannten Bookmarks (Site nicht-published, Beta noch nicht aktiv). Phase-2-Hard-Launch hat keine Pre-Existing-URLs.

### Previous Story Intelligence

**Letzte abgeschlossene Story 1-31 (Atlas-UI/UX-Polish):** keine i18n-Berührungspunkte. Pattern-Konsistenz: explizite AC-Numbers, Tasks mit AC-Refs, Memory-Marker-Aufruf.

**Story 2-0 (Postgres-Aggregat-Foundation, status `review`):** parallel zu Epic 3, kein Konflikt. 2-0 introduced `src/lib/server/db/schema/faq-qna.ts` mit Locale-Enum `de | en` (Phase-3-ready) — Story 3.1 respektiert diese DB-Foundation und reduziert NUR den UI-Locale-Stack.

### TDD-Strategie (ADR-012 Pragmatic-TDD)

Story 3.1 ist **Setup/Config-Task** mit Smoke-Level-Test-Pflicht. AC-12 spezifiziert genau 1 Vitest-Spec (`tests/i18n-de-only.spec.ts`) als Foundation-Smoke. Test-First-Workflow:

1. **Red:** Spec schreiben gegen `import { locales, baseLocale, strategy } from '$lib/paraglide/runtime'`. Bei aktuellem Setup failt der Test (locales hat 8 Einträge, baseLocale="en", strategy enthält "cookie").
2. **Green:** `settings.json` + `vite.config.ts` editieren + recompile. Test grün.
3. **Refactor:** Type-Reduce in `data/types.ts`, Cleanup.

**Coverage-Ziel:** Smoke-Level reicht (Setup-Story, ADR-012 §3 Exceptions).

### File-List nach Story-Completion (erwartet)

**Modified:**

- `project.inlang/settings.json` (baseLocale, locales)
- `vite.config.ts` (paraglideVitePlugin strategy-arg)
- `src/lib/data/types.ts` (Locale-Type reduziert)
- `docs/adr/ADR-005-i18n-paraglide.md` (Status Accepted, Body befüllt)
- `src/lib/paraglide/runtime.js` (auto-regenerated)
- `src/lib/paraglide/server.js` (auto-regenerated)
- `src/lib/paraglide/registry.js` (auto-regenerated, falls Änderung)
- `src/lib/paraglide/messages.js` (auto-regenerated)
- `src/lib/paraglide/messages/_index.js` (auto-regenerated)

**Deleted:**

- `messages/en.json`
- `messages/ar.json`
- `messages/es.json`
- `messages/fr.json`
- `messages/it.json`
- `messages/pl.json`
- `messages/tr.json`

**New:**

- `docs/i18n-reactivation.md`
- `tests/i18n-de-only.spec.ts`

### Project Structure Notes

Alignment mit `architecture.md` Zeilen 217 + 1329 (`src/lib/i18n/` als geplanter Compiler-Output) vs. aktuell `src/lib/paraglide/`:

Architecture-Doku referenziert `src/lib/i18n/`, aktueller Setup nutzt `src/lib/paraglide/`. **Decision (für diese Story):** beibehalten als `src/lib/paraglide/` — Architecture-Doku-Path war Aspiration, aktueller Setup ist Source-of-Truth. Architecture-Doku-Sync wird in Phase 3 oder als Doc-Sync-Story aufgenommen. Nicht Scope von 3.1.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Epic-3` Zeilen 1658–1711] — Phase-1-Lock + Story-3.1-Definition
- [Source: `_bmad-output/planning-artifacts/architecture.md` Zeile 1062] — MUST-Rule #10 Cookieless
- [Source: `_bmad-output/planning-artifacts/architecture.md` Zeile 1066] — MUST-Rule #14 i18n-First (DEFERRED für Phase 1)
- [Source: `_bmad-output/planning-artifacts/prd.md` Zeilen 770–779 + 884–892] — FR55a–FR55j, NFR-IL1–IL10 (DEPRECATED für Phase 1)
- [Source: `docs/adr/ADR-004-cookieless.md`] — Cookieless-Architektur, Set-Cookie-Verbot
- [Source: `docs/adr/ADR-012-tdd-mandate.md`] — Pragmatic-TDD, Setup-Story-Exception
- [Source: `CLAUDE.md`] — Output-Konventionen (keine em-dashes), TDD-Mandat
- [Source: `project.inlang/settings.json`] — Aktueller Inlang-Setup
- [Source: `vite.config.ts` Zeile 11] — Paraglide-Vite-Plugin
- [Source: `src/lib/paraglide/runtime.js`] — Auto-generated Locale-Runtime
- [Source: Memory `project_paraglide_reroute`] — Routing-Pattern ohne `[lang]`-Param
- [Source: Memory `project_i18n_phase_1_de_only`] — Phase-1-DE-only-Lock
- [Source: Paraglide v2 Docs — Strategy](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy)

## Open Questions / Pre-Dev-Clarifications

1. **Strategy-Setzen-Pfad:** Vite-Plugin-Argument (Empfehlung) ODER `settings.json`-Property? Beide funktionieren in Paraglide v2, Vite-Plugin-Arg ist explizit + typed.
2. **`urlPatterns` nach Reduce:** Falls Compile-Output trotz 1-Locale weiterhin `urlPatterns` mit Pattern-Match enthält — akzeptabel oder über `routeStrategies: [{ match: '*', exclude: true }]` in vite.config explizit entfernen?
3. **`/de/...`-Bookmark-Verhalten:** 404 oder Server-Side-301-Redirect zu unlokalisierter URL? Phase-1-Empfehlung: 404 akzeptieren (keine bestehenden Shares).
4. **`messages/de.json`-Content:** Stock `hello_world` belassen ODER initial mit ~10 Foundation-Keys (Navigation, Footer, Skip-Link) befüllen als Vorbereitung auf MUST-Rule #14? Recommendation: Stock belassen, Foundation-Keys-Befüllung als Phase-3-Story (oder ad-hoc bei UI-Touchpoints).
5. **`src/lib/data/types.ts` `Locale`-Reduce-Strategy:** auf `'de'` reduzieren (strict Phase 1) ODER auf `'de' | 'en'` reduzieren (Phase-3-ready, kompatibel mit `get-faq-qna.ts`)? Recommendation: `'de'` (strict Phase 1, Type-Drift gegen DB-Schema akzeptabel da `get-faq-qna.ts` eigenen Locale-Type hat).

## Dev Agent Record

### Agent Model Used

_(wird vom dev-agent ausgefüllt)_

### Debug Log References

### Completion Notes List

### File List

_(wird vom dev-agent ausgefüllt)_
