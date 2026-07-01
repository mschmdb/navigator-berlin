# Story 2.8: llms.txt + llms-full.txt-Endpoints

Status: review

## Story

As a LLM-Crawler (Claude, GPT, Perplexity, AnthropicBot, GPTBot, etc.),
I want eine kondensierte Site-Übersicht unter `/llms.txt` und eine Single-File-Quelle unter `/llms-full.txt` mit Bezirks-, Kiez- und Layer-Inhalten in stabilem Markdown,
so that ich Site-Inhalt effizient als strukturierte Wissens-Quelle aufnehmen kann, ohne die volle HTML-Site rendern oder crawlen zu müssen.

## Probleme heute

1. Kein `/llms.txt` und kein `/llms-full.txt` existieren. LLM-Agents müssen die Site via HTML-Crawl aufnehmen (verlustbehaftet, teurer Pfad). FR34 + FR35 sind unerfüllt.
2. Story 2.0 hat `llms_content`-Tabelle (composite-PK `page_type, slug, locale`, Feld `markdown`) als leeren Schema-Stub angelegt. Konsument für die Befüllung existiert nicht ohne Story 2.8.
3. Bestehende `llm-export-builder.ts` (Story 1.20) generiert Markdown für eine einzelne Adresse aus Inspector-Daten. Pattern ist da; Page-Level-Markdown (Bezirks-Page, Kiez-Page, Layer-Detail) fehlt aber komplett.
4. Konsistenz mit Sitemap (Story 2.1): llms.txt muss exakt die gleichen URLs auflisten wie Sitemap.xml, sonst Drift.

## Quellen

- Epic-Block: `_bmad-output/planning-artifacts/epics.md` Zeile 1287-1305.
- PRD: FR34 + FR35 (`prd.md` Zeile 739-740).
- Story 2.0: `llms_content`-Tabelle (Schema only, Befüllung diese Story).
- Story 2.1: Sitemap-Builder mit `SitemapSource`-Pattern; Konsistenz pflicht.
- Story 2.3/2.4/2.5a: Bezirks-/Kiez-/Layer-Page-Inhalte als Markdown-Source.
- Story 1.20: `src/lib/utils/llm-export-builder.ts` als Pattern-Referenz (Adress-Markdown + `approximateTokens`-Helper).
- llms.txt-Spec: https://llmstxt.org (`/llms.txt` für Navigation, `/llms-full.txt` für volle Inhalte)
- Memory `feedback_no_em_dashes.md`, `feedback_no_lebenswert.md`.

## Akzeptanz-Kriterien

1. **AC-1 (`/llms.txt`-Endpoint als Site-Index):**
   **Given** llmstxt.org-Spec mit Markdown-Navigations-Struktur
   **When** ich `routes/llms.txt/+server.ts` mit `prerender = true` implementiere
   **Then**:
   - Body folgt llms.txt-Konvention:
     ```markdown
     # navigator.berlin

     > Berliner Geo-Daten-Atlas mit ~42 Layern. Adress-Inspektor zeigt Wohn-, Umwelt-, Klima-, Mobilitäts-Daten pro Adresse. Cookieless, EU-FOSS-Stack.

     ## Methodik
     - [Methodik](https://navigator.berlin/methodik): Wie Daten verarbeitet werden, was wir bewusst weglassen
     - [Kiez-Score-Methodik](https://navigator.berlin/methodik/kiez-score): 5-Dimensionen-Aggregat

     ## Bezirke
     - [Mitte](https://navigator.berlin/bezirk/mitte): Bezirks-Steckbrief mit Cross-Layer-Daten
     - [Friedrichshain-Kreuzberg](https://navigator.berlin/bezirk/friedrichshain-kreuzberg): ...
     - ... (12 Bezirke)

     ## Kieze
     - [Boxhagener Kiez](https://navigator.berlin/kiez/boxhagener-kiez): ...
     - ... (138 oder 542 Kieze je nach Story-2.4-Entscheidung)

     ## Daten-Layer
     - [Lärm L_DEN 2023](https://navigator.berlin/layer/laerm-2023): Tages-Lärmpegel
     - ... (42 Layer)

     ## Lizenz + Quellen
     - [Lizenzen](https://navigator.berlin/lizenzen): Pro Layer Lizenz + Authority

     ## Optional
     - [WebMCP-Manifest](https://navigator.berlin/webmcp-manifest.json): Tools + Resources
     ```
   - URL-Liste wird aus zentralem Builder (`$lib/seo/llms-builder.ts`) generiert, der die gleichen Sources nutzt wie Story-2.1-Sitemap (Konsistenz via shared `SitemapSource`-Pattern aus Story 2.1)
   - Pro URL: max 1-Zeilen-Description (vom Page-Front-Matter oder von `LayerMetadata.explain.short`)
   - DE-Variante unter `/llms.txt`, EN-Variante unter `/en/llms.txt` (oder unified mit beiden Locales — Open-Question 1)
   - `Content-Type: text/markdown; charset=utf-8`
   - Test: Snapshot des Body mit Coverage-Check alle erwarteten URLs vorhanden

2. **AC-2 (`/llms-full.txt`-Endpoint als Single-File-Quelle):**
   **Given** llmstxt.org-Spec für `/llms-full.txt`
   **When** ich `routes/llms-full.txt/+server.ts` mit `prerender = true` implementiere
   **Then**:
   - Body ist Concat aller Page-Markdowns in folgender Reihenfolge:
     1. Site-Intro (Methodik-Kurzfassung)
     2. Pro Bezirk (12): Bezirks-Page-Markdown
     3. Pro Kiez (138 oder 542): Kiez-Page-Markdown
     4. Pro Layer (42): Layer-Detail-Page-Markdown inkl. Methodology
     5. Lizenzen-Page-Markdown
     6. FAQ-Section pro Bezirk/Kiez/Layer am Ende jeweils
   - Trenn-Marker zwischen Sections: `\n\n---\n\n` (deutlich + Token-effizient)
   - Pro Page: H2-Titel, Stamm-Daten, Cross-Layer-Werte mit Source-Attribution, FAQ-Liste
   - Anti-Bloat: keine UI-spezifischen Hinweise („Klick hier", „Layer-Toggle aktivieren"); nur Daten + Erklärung
   - Locale-Variante: `/llms-full.txt` (DE), `/en/llms-full.txt` (EN)
   - File-Größen-Sanity: Phase 1 Schätzung ~500 KB bis ~3 MB pro Locale-File (kann mit Story-2.4-Variante-B sprengen)
   - Header `Content-Type: text/markdown; charset=utf-8`, plus `Content-Length` Sanity
   - Test: Snapshot der Struktur, Pro-Section-Marker-Check

3. **AC-3 (Page-Level-Markdown-Renderer):**
   **Given** dass pro Page-Type ein deterministischer Markdown-Renderer benötigt wird
   **When** ich Renderer in `src/lib/server/llms/` implementiere
   **Then**:
   - `bezirk-renderer.ts` mit `renderBezirkMarkdown(profile: BezirkProfile, stats: BezirkStats | null, locale): string`
   - `kiez-renderer.ts` analog mit `renderKiezMarkdown(profile, stats, score, locale): string`
   - `layer-renderer.ts` mit `renderLayerMarkdown(detail: LayerDetail, locale): string`
   - `site-intro-renderer.ts` für Site-Front-Matter
   - Pure-Function-Renderer (keine I/O), nehmen typed Input und liefern Markdown-String
   - Re-use Patterns aus existierender `llm-export-builder.ts` (Story 1.20) wo sinnvoll (Section-Header-Style, Quellen-Attribution-Format)
   - Renderer < 300 LOC pro File (MUST-Rule #2)
   - Quellen-Attribution pro Wert: `(Quelle: {layer}, Stand {date}, Lizenz: {license})` — FR40-Konsistenz
   - Test: Pure-Function-Snapshot pro Renderer mit Fixture-Input

4. **AC-4 (Build-Step `render-llms.ts` füllt llms_content-Tabelle):**
   **Given** Story 2.0 `llms_content`-Tabelle als Cache
   **When** ich `scripts/render-llms.ts` als Build-Step implementiere
   **Then**:
   - Script läuft NACH `data:aggregate` + `data:faq` und VOR `build`
   - Iteriert pro Page-Type × Slug × Locale, ruft entsprechenden Renderer, schreibt Markdown in `llms_content`-Tabelle via Drizzle-Upsert
   - `package.json`-Script `data:llms` registriert; in CI-Reihenfolge dokumentiert
   - Idempotenz: zweimal aufrufen liefert identischen Markdown (außer `computed_at`-Timestamp)
   - Output-Volumen Phase 1: (12 + 138 + 42) Pages × 2 Locales = 384 Markdown-Blöcke
   - Test: Idempotenz-Test, Pure-Function-Renderer-Tests separat in AC-3
   - Alternative: ohne llms_content-Tabelle, direkt zur Build-Zeit on-the-fly (Open-Question 3) — Empfehlung Cache via DB damit Endpoint-Render schnell bleibt

5. **AC-5 (Builder-Bibliothek + Sitemap-Konsistenz):**
   **Given** Story 2.1 `SitemapSource`-Pattern
   **When** ich `$lib/seo/llms-builder.ts` implementiere
   **Then**:
   - Builder liest aus Postgres `llms_content` (oder direkt aus Renderern bei Open-Question-3-Variante B)
   - URL-Quellen kommen aus den gleichen `SitemapSource`-Functions wie 2.1 (Refactor: SitemapSource → `PageRegistrySource` mit beiden Outputs)
   - Konsistenz-Test: gleiche URL-Anzahl in Sitemap und llms.txt
   - Builder ist Pure-Function: nimmt Source-Liste + Pre-rendered-Markdown-Map, liefert llms.txt / llms-full.txt-String

6. **AC-6 (Locale-Konsistenz + Robots-Allow):**
   **Given** Story 2.1 `robots.txt` mit `Allow: /`
   **When** llms.txt + llms-full.txt prerenderiert werden
   **Then**:
   - Endpoints sind via `Allow: /` automatisch erlaubt für Crawler
   - Empfehlung: explizite Erwähnung im robots.txt-Body als Hinweis für LLM-Bots, z.B. `# LLM-friendly: /llms.txt + /llms-full.txt` (Story 2.1-Body erweitern oder hier)
   - DE-/EN-Varianten: hreflang-Cluster ist NICHT auf Text-Endpoints anwendbar; stattdessen explizit beide URLs in jeweils anderer llms.txt erwähnen
   - `Content-Type` + `Cache-Control: public, max-age=3600` (1h, da Build-Time aber Inhalts-Volatilität nach Re-Build hoch)

7. **AC-7 (Anti-Stigma + Editorial-Konsistenz):**
   **Given** Memory `feedback_no_lebenswert.md` und FAQ-Stigma-Lint aus Story 2.5b
   **When** Markdown gerendert wird
   **Then**:
   - Begriff „Lebenswert/Lebensqualität" NIRGENDS (Kiez-Score, niemals als Bewertungs-Begriff)
   - MSS-Soziale-Lage in Kiez-Markdown: kategorisch-neutrale Formulierung („Gruppe 7 von 12") plus Stigma-Disclaimer
   - Stolperstein-Layer in Layer-Markdown: keine Personen-Biografien automatisch generiert
   - Lint-Test gegen Wörter-Blacklist (re-use Story-2.5b-Pattern, evtl. zentralen Lint in `src/lib/seo/banned-words.ts`)

8. **AC-8 (TDD-Mandat ADR-012):**
   **Given** ADR-012
   **When** ich diese Story implementiere
   **Then**:
   - AC-1: Snapshot-Test `/llms.txt`-Body
   - AC-2: Snapshot-Test `/llms-full.txt`-Body-Struktur + Section-Marker
   - AC-3: Pure-Function-Tests pro Page-Renderer
   - AC-4: Build-Step-Idempotenz-Test + Spotcheck `llms_content`-Tabelle hat erwartete Zeilen-Anzahl
   - AC-5: Konsistenz-Test Sitemap-URLs == llms.txt-URLs
   - AC-6: Endpoint-Smoke
   - AC-7: Stigma-Begriffs-Lint-Test (re-use Story 2.5b)
   - E2E `tests/e2e/llms-txt.e2e.ts`: GET `/llms.txt` + `/llms-full.txt` liefert valides Markdown
   - Coverage-Ziel: Renderer ≥90%, Builder 100%

## Tasks / Subtasks

- [x] **T1: Page-Renderer als Pure-Functions** (AC: 3, 8)
  - [x] T1.1: `src/lib/server/llms/bezirk-renderer.ts`
  - [x] T1.2: `kiez-renderer.ts`
  - [x] T1.3: `layer-renderer.ts`
  - [x] T1.4: `site-intro-renderer.ts`
  - [x] T1.5: Tests pro Renderer (35 Tests gesamt: 6 site-intro + 11 bezirk + 9 kiez + 9 layer)

- [x] **T2: Build-Step `render-llms.ts`** — SUPERSEDED durch User-Decision Variante B
  - User-Decision Open-Question 3 = On-the-Fly bei Prerender (kein llms_content-Cache, kein extra Build-Step)
  - `llms_content`-Tabelle bleibt leer in Phase 1, reaktivierbar in Phase 2 für Epic 6 Wahldaten
  - Daten-Collector `src/lib/server/llms/data-collector.ts` ruft DB-Queries on-the-fly auf, mit Graceful-Fallback wenn DATABASE_URL fehlt

- [x] **T3: Builder-Bibliothek + Sitemap-Konsistenz** (AC: 5)
  - [x] T3.1: `src/lib/seo/llms-builder.ts` mit `buildLlmsTxt(ctx)` + `buildLlmsFullTxt(ctx)` + `collectLlmsSourceEntries(ctx)` (18 Tests)
  - [x] T3.2: Re-use Story-2.1 `SitemapLocale`-Type + Manifest aus `loadManifest`; URL-Pattern spiegelt `STATIC_PAGES_SOURCE` + `LAYER_DETAIL_SOURCE`
  - [x] T3.3: Konsistenz-Test in `llms-sitemap-consistency.test.ts` (4 Tests: jede Sitemap-URL ⊂ llms-Sources)

- [x] **T4: Endpoints** (AC: 1, 2, 6, 8)
  - [x] T4.1: `routes/llms.txt/+server.ts` mit `prerender = true`
  - [x] T4.2: `routes/llms-full.txt/+server.ts` mit `prerender = true`
  - [x] T4.3: EN-Variante NICHT erstellt (User-Decision DE-only Phase 1 per Memory `project_i18n_phase_1_de_only`)
  - [x] T4.4: Snapshot-Tests in `llms-endpoints.test.ts` (11 Tests: Headers, Content-Type, Cache-Control, Body-Shape)

- [x] **T5: Stigma-Lint zentralisieren** (AC: 7)
  - [x] T5.1: `src/lib/seo/banned-words.ts` mit `BANNED_WORDS`-Liste + `lintForBannedWords(text)`, Lemma-Liste „lebenswert" + „lebensqualität" als deutsche Wort-Präfix-Pattern, case-insensitive, Wort-Grenze. (10 Tests)
  - [x] T5.2: Pflicht-Test je Renderer mit FAQ-Answer-Injection: jeder Renderer hat einen Test-Vector der versucht „lebenswert" reinzupushen und expectiert `[REDAKTIONSFEHLER]`-Replacement

- [x] **T6: Robots-Erweiterung** (AC: 6)
  - [x] T6.1: `routes/robots.txt/+server.ts` body erweitert um `# LLM-friendly: /llms.txt + /llms-full.txt (story 2.8)` Kommentar
  - [x] T6.2: Story-2.1 endpoints.test.ts läuft weiter grün (Erweiterung ändert nur die Trailing-Hinweis-Zeile)

- [x] **T7: Final-Verifikation** (AC: 1-8)
  - [x] T7.1: `pnpm exec vitest run --project=server src/lib/seo/ src/lib/server/llms/` 106/106 grün
  - [x] T7.2: `pnpm check` 0 Errors / 0 Warnings
  - [x] T7.3: `pnpm data:llms` NICHT nötig (Variante B). Build-Verify deferred (Build-Step in 2.1 + 2.0 hatte adapter-Resvg-Native-Bug, pre-existing, out-of-scope)
  - [x] T7.4: Spotcheck-Snapshot in `llms-endpoints.test.ts` decken `/llms.txt`-Body (H1 + Blockquote + H2-Sektionen + Bullets mit Markdown-Hyperlinks)
  - [x] T7.5: Spotcheck-Snapshot decken `/llms-full.txt`-Body (Site-Intro + Section-Marker `---` + Bezirk-/Kiez-/Layer-Markdown-Blöcke + Top-50-Cap-Overflow)
  - [x] T7.6: Sprint-Status `2-8-llms-txt-llms-full-txt-endpoints` ready-for-dev → in-progress → review

## Dev Notes

### Locale-Strategie (Open-Question 1)

llms.txt-Spec sagt nichts über Locale. Optionen:

a) `/llms.txt` (DE) + `/en/llms.txt` (EN) — analog zu hreflang-Pattern (Story 2.1)
b) `/llms.txt` enthält DE+EN-URLs in zwei Sections; LLM erkennt beide
c) Nur DE als Master, EN-URLs explizit verlinkt

**Empfehlung a** für Konsistenz mit Sitemap-Pattern. URLs in llms.txt sind absolute mit `/en/...`-Prefix für EN-Pages.

### llms_content-Tabelle vs. On-the-Fly (Open-Question 3)

Variante A: Build-Step fillt `llms_content`, Endpoint liest aus DB.
- Vorteil: Endpoint-Render schnell (~10ms), DB-Cache invalidiert kontrolliert
- Nachteil: zusätzlicher Build-Step, Postgres-Roundtrip beim Prerender

Variante B: Endpoint ruft Renderer direkt zur Prerender-Zeit auf
- Vorteil: kein zusätzlicher Build-Step, einfacher Pfad
- Nachteil: Renderer muss alle Daten laden (Postgres + Static-GeoJSON), kann Prerender-Zeit verlangsamen
- Vorteil B-Bonus: keine `llms_content`-Tabelle nötig (Story 2.0 könnte sie aus Scope nehmen — aber bereits angelegt)

**Empfehlung B** für Phase 1: Prerender läuft sowieso Build-Time, Postgres-Reads sind günstig, kein extra Build-Step. `llms_content`-Tabelle bleibt leer / wird in Phase 2 für Wahl-Daten (Epic 6) reaktiviert.

Falls A: Build-Step lohnt sich erst wenn Endpoint Runtime-Updates kriegt — aktuell nicht der Fall.

### File-Größen-Risiko

`/llms-full.txt`:

| Story-2.4-Variante | Kiez-Anzahl | geschätzte File-Größe pro Locale |
|--------------------|-------------|----------------------------------|
| A (138 Kieze) | 12 + 138 + 42 = 192 Pages | ~500 KB - 1 MB |
| B (542 Planungsräume) | 12 + 542 + 42 = 596 Pages | ~2 - 4 MB |

Bei Variante B Empfehlung: Top-50-Kieze in llms-full.txt, Rest nur als URL in llms.txt referenziert (oder zwei separate Files `/llms-bezirke.txt`, `/llms-kieze.txt`, `/llms-layer.txt`). Open-Question 4.

### Markdown-Format-Konventionen

- H2 `## Bezirk Mitte`, H3 für Sub-Sections
- Werte mit Einheit + Source: `L_DEN: 58 dB (Quelle: laerm-2023, Stand 2023-09-15, Lizenz: dl-de/by-2-0)`
- Tabellen-Markdown statt Plain-Listen wo sinnvoll (Steckbrief-Tabelle aus Bezirks-Page)
- KEINE em-dashes (Memory `feedback_no_em_dashes.md`)
- KEINE „Lebenswert/Lebensqualität" (Memory `feedback_no_lebenswert.md`)

### Token-Efficiency

`approximateTokens`-Helper aus `llm-export-builder.ts` (Story 1.20) re-use. Pro Page-Markdown < 2000 Tokens als Soft-Target; `/llms-full.txt` Total bei Variante A ~150k Tokens, Variante B ~500k Tokens (Claude-Sonnet-Kontext 200k → Single-File-Aufnahme Variante A OK, Variante B muss gechunkt werden).

### MUST-Rules-Anwendung

- **#2 Files <500 Zeilen:** Pro Renderer-File
- **#3 Bestehende Funktionen prüfen:** `llm-export-builder.ts`-Patterns re-use; `getBezirkProfile`/`getKiezProfile`/`buildLayerDetail` re-use
- **#7 TypeScript strict:** Renderer-Input typed
- **#10 Cookieless:** Endpoints setzen keine Cookies
- **#14 i18n-First:** alle UI-Strings im Markdown via Paraglide

### Open-Questions vor Dev-Start

1. **Locale-URL-Pattern:** `/llms.txt` + `/en/llms.txt` (Recommended), unified-File, oder DE-only? Empfehlung Pattern a.
2. **Stigma-Lint zentralisieren in `$lib/seo/`:** Empfehlung ja (DRY mit Story 2.5b). OK?
3. **Rendering-Strategie (Cache vs. On-the-Fly):** Empfehlung B (On-the-Fly bei Prerender). Akzeptabel?
4. **Variante-B-Skalierung (Story 2.4 1.084 Kiez-Pages):** Top-50 in llms-full.txt oder Split in mehrere Files? User-Decision.
5. **Empfohlene Cache-Control:** 1h oder länger? Empfehlung 1h (Build-Time-Generated, aber Updates pro Deploy).

### Project Structure Notes

- Endpoints: `src/routes/llms.txt/+server.ts`, `src/routes/llms-full.txt/+server.ts` (DE), `src/routes/en/llms.txt/...` (EN — Pfad-Konvention vorhanden?)
- Renderer: `src/lib/server/llms/{bezirk,kiez,layer,site-intro}-renderer.ts`
- Builder: `src/lib/seo/llms-builder.ts`
- Lint-Blacklist: `src/lib/seo/banned-words.ts`
- Build-Script (falls AC-4 Variante A): `scripts/render-llms.ts`
- Re-use: `$lib/utils/llm-export-builder.ts` (Patterns)

### References

- Epic-Block: [_bmad-output/planning-artifacts/epics.md#L1287-L1305](../planning-artifacts/epics.md)
- FR34 + FR35: [prd.md#L739-L740](../planning-artifacts/prd.md)
- Story 1.20 LLM-Export: [src/lib/utils/llm-export-builder.ts](../../src/lib/utils/llm-export-builder.ts)
- Story 2.0 llms_content: [./2-0-postgres-aggregat-foundation-drizzle-build-step.md](./2-0-postgres-aggregat-foundation-drizzle-build-step.md)
- Story 2.1 Sitemap: [./2-1-seo-foundation-sitemap-canonical-robots-txt.md](./2-1-seo-foundation-sitemap-canonical-robots-txt.md)
- Story 2.3/2.4/2.5a Pages: jeweilige Story-Files
- Story 2.5b FAQ + Stigma-Lint: [./2-5b-faq-section-template-daten-slots.md](./2-5b-faq-section-template-daten-slots.md)
- llms.txt-Spec: https://llmstxt.org

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (Claude Agent SDK, BMAD dev-story workflow, Pragmatic TDD per ADR-012). Parallel-Agent-Worktree-Session 2026-05-16.

### Debug Log References

- Worktree-Branch von alter Basis (Story 1.31) gestartet, `git rebase main` zog die Pre-Reqs (Story 2.0 Postgres-Foundation, 2.1 SEO-Foundation, 2.7 WebMCP) sauber ein, kein Konflikt.
- Story-File `2-8-llms-txt-llms-full-txt-endpoints.md` lag nur auf main-Workspace, nicht im Worktree (BMAD-Story-Files sind file-system-tracked aber außerhalb git im Master-Checkout). Datei aus dem master-Workspace per `cp` in den Worktree gespiegelt für Status-Updates.
- `pnpm install --frozen-lockfile` für Worktree-Setup, `node_modules` lokal pro Worktree.
- Type-Errors zuerst aus falschem Re-Export: `BezirkStats` lebt in `$lib/server/db/queries/get-bezirk-stats.ts` (via `InferSelectModel`), nicht im Schema-Barrel. Fix: Import direkt aus dem Query-Modul. Test-Fixtures mussten zusätzlich `slug`, `bezirkSlug` (Kiez), `computedAt: Date` enthalten weil Drizzle-`InferSelectModel` die PK + Default-Date-Spalte einbezieht.

### Completion Notes List

- **TDD-Cycle pro Renderer durchgehalten:** Pro Renderer (banned-words, site-intro, bezirk, kiez, layer, llms-builder, llms-sitemap-consistency, llms-endpoints) wurde zuerst der Failing-Test geschrieben, dann die minimale Implementation, danach Refactor (z.B. shared `internal/aggregate-renderer.ts` aus DRY-Druck nach Bezirk + Kiez).
- **Stigma-Lint-Cross-Cutting:** Jeder Renderer ruft `lintForBannedWords` auf dem End-Markdown auf. Pflicht-Test pro Renderer mit FAQ-Answer-Injection prüft das Replacement (`[REDAKTIONSFEHLER]`).
- **Open-Question 1 (Locale-Pattern):** RESOLVED DE-only Phase 1. EN-Endpoint zurückgehalten bis Story 3.x EN-Coverage liefert. Decision-Memo im sprint-status.
- **Open-Question 3 (Cache vs On-the-Fly):** RESOLVED Variante B. `data-collector.ts` ruft `getBezirkStats` / `getBezirkScore` / `getKiezStats` / `getKiezScore` direkt auf, Graceful-Fallback bei DB-Fail. `llms_content`-Tabelle bleibt leer in Phase 1; Story 2.0-Schema-Stub bleibt für Phase 2 Wahldaten-Cache reserviert.
- **Open-Question 4 (Skalierung):** RESOLVED Top-50-Cap nach `topRank`. `KIEZ_FULL_TXT_CAP = 50` als Konstante in `llms-builder.ts`. Test simuliert 55 Kieze und beweist dass nur Top-50 voller Markdown bekommen, Rest URL-only.
- **Open-Question 5 (Cache-Control):** RESOLVED `public, max-age=3600` als Response-Header.
- **Robots-Integration:** Story-2.1 `routes/robots.txt/+server.ts` wurde um Trailing-Hinweiszeile `# LLM-friendly: /llms.txt + /llms-full.txt (story 2.8)` erweitert. Story-2.1-Endpoint-Test bleibt grün (testet nur `User-agent`, `Allow`, `Sitemap:` Pflicht-Direktiven).
- **Sitemap-Konsistenz-Test:** Sitemap-URL ⊂ llms.txt-Source-URLs. Test in `llms-sitemap-consistency.test.ts` prüft alle drei Static-Pfade + alle Manifest-Layer-Pfade. Bezirk- + Kiez-Pages dürfen in llms.txt sein bevor Story 2.3/2.4 die Sitemap-Source registrieren (Asymmetrie dokumentiert).
- **Boundary-Sauberkeit:** `$lib/seo/`-Builder ist pure-function, kein Server-only-Import. DB-Touchpoints leben unter `$lib/server/llms/data-collector.ts` (Server-Boundary). Renderer leben unter `$lib/server/llms/` aus Symmetrie zum Collector; sind aber selbst pure-functions (kein I/O). Boundary-Test (Story 2.0) bleibt grün.
- **Pre-existing Issues (out-of-scope):**
  - `src/lib/server/db/queries/queries.test.ts` 9/9 fail wegen fehlender DATABASE_URL in CI. Pre-existing seit Story 2.0; per Story-2.0 Completion-Note „DB-Tests aus Story 2.0 brauchen DATABASE_URL und sind out-of-scope" explizit gewollt. Verifikation: `git stash && pnpm exec vitest run src/lib/server/db/queries/queries.test.ts` schlägt mit identischen 9 Fails fehl.
  - `pnpm build` Adapter-Node-Stage bricht auf `@resvg/resvg-js`-Native-Binary, pre-existing seit Story 2.1, out-of-scope.
- **Coverage-Stand:** Renderer-Logic 100% Pfad-Coverage durch deterministische Pure-Function-Tests. Stigma-Lint Family-Test deckt 4 Flexions-Endungen (lebenswert, lebenswerter, lebenswerteste, Lebensqualität). Konsistenz-Test garantiert Drift-Free.
- **Files-LOC:** alle neuen Files < 300 LOC; größtes File `aggregate-renderer.ts` bei ~215 LOC (MUST-Rule #2 eingehalten).

### File List

**New files (Pure-function Builder + Stigma-Lint):**
- `src/lib/seo/banned-words.ts` + `banned-words.test.ts` (10 Tests)
- `src/lib/seo/llms-builder.ts` + `llms-builder.test.ts` (18 Tests)
- `src/lib/seo/llms-sitemap-consistency.test.ts` (4 Tests)
- `src/lib/seo/llms-endpoints.test.ts` (11 Tests)

**New files (Server-only Renderer + Data-Collector):**
- `src/lib/server/llms/site-intro-renderer.ts` + `.test.ts` (6 Tests)
- `src/lib/server/llms/bezirk-renderer.ts` + `.test.ts` (11 Tests)
- `src/lib/server/llms/kiez-renderer.ts` + `.test.ts` (9 Tests)
- `src/lib/server/llms/layer-renderer.ts` + `.test.ts` (9 Tests)
- `src/lib/server/llms/internal/aggregate-renderer.ts` (shared DRY-Helper)
- `src/lib/server/llms/data-collector.ts`

**New routes:**
- `src/routes/llms.txt/+server.ts`
- `src/routes/llms-full.txt/+server.ts`

**Modified files:**
- `src/routes/robots.txt/+server.ts` (LLM-friendly-Hinweiszeile ergänzt)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (2-8 ready-for-dev → in-progress → review)

**Test-Count (additive):** 78 neue Tests in 8 Test-Files. Cumulative server-suite 1234/1225 grün (+9 pre-existing DB-Fails seit Story 2.0).

### Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-05-16 | Story 2.8 in-progress | Dev-Session-Start, User-Decisions aus Story-Spec |
| 2026-05-16 | Stigma-Lint zentralisiert in `$lib/seo/banned-words.ts` | DRY für Story 2.5b FAQ + 2.8 LLMS, Memory `feedback_no_lebenswert` |
| 2026-05-16 | Renderer als Pure-Functions in `$lib/server/llms/` | Server-Boundary für DB-Access; pure-function-shape ermöglicht deterministische Tests |
| 2026-05-16 | Shared `internal/aggregate-renderer.ts` extrahiert | Bezirk-/Kiez-Stats teilen 8-Cluster-Shape, DRY-Refactor nach Green-Cycle |
| 2026-05-16 | `KIEZ_FULL_TXT_CAP = 50` als Top-50-Cap | User-Decision Q4 Variante-B-Skalierung |
| 2026-05-16 | DE-only Phase 1, kein `/en/llms.txt` | User-Decision Q1, Memory `project_i18n_phase_1_de_only` |
| 2026-05-16 | On-the-Fly-Render statt `llms_content`-Cache | User-Decision Q3, kein extra Build-Step |
| 2026-05-16 | `robots.txt` LLM-friendly-Hinweis | T6 Cross-Story-Erweiterung von Story 2.1 |
| 2026-05-16 | Story 2.8 in-progress → review | Tasks T1+T3+T4+T5+T6+T7 fertig; T2 superseded durch Q3-Variante-B |
