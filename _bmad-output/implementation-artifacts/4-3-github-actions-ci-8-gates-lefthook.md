# Story 4.3: GitHub-Actions-CI mit 13 Gates + Lefthook + Coolify-Deploy-Webhook

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a Code-Author und Solo-Maintainer,
I want eine GitHub-Actions-CI-Pipeline mit 13 aktiven Quality-Gates (Lint, Typecheck, Unit-Tests + Coverage, Drizzle-Migrate, data:aggregate, Build, E2E + axe-core, Lighthouse, Bundle-Size, US-Domain-Allowlist, Cookie-Leak, Compile-A11y-Warnings, ein Coolify-Deploy-Webhook auf Main) plus Lefthook-Pre-Commit-Hooks für Lint/Format/Typecheck/CSP-Diff-Awareness,
so that PR-Builds und Main-Pushes vor Drift bei Performance/A11y/Bundle-Size/Cookies/US-Drittanbietern geschützt sind, lokale Commits triviale Fehler abfangen bevor sie CI auslösen, und Production-Deploys ausschließlich nach grünem Main-Build via Coolify-Webhook erfolgen.

## Phase-Kontext + Scope-Anpassung

**Story-Titel-Korrektur:** Epic-Titel sagt „8 Gates", konkrete Pipeline-Spec hat 14 numerierte Steps + Compiler-A11y-Warning-Direktive. Effektiv 13 echte **Quality-Gates** (Schritt 1 `checkout`, Schritt 2 `services` sind Setup, kein Gate). Story-Titel hier: 13 Gates.

**Phase-1-Adjustments (User-Lock 2026-05-16 — Memory `project_i18n_phase_1_de_only`):**

- **Gate 14 (i18n-coverage-check):** DEFERRED zu Future-Epic „i18n-Phase-3-EN-Coverage". Phase 1 ist DE-only, kein `en.json`-Bundle existiert nach Story 3.1. Gate 14 wird in 4.3 als **kommentierter Stub** mit Klar-Comment „aktiviert in Phase 3" implementiert.
- **Coverage-Threshold (Gate 5):** Epic sagt `≥80%`. ADR-012 sagt „Daten-Transform ≥80%, kritische Pfade ≥90%, UI-Smoke E2E für Top-3-Journeys". Pragmatic-Default: Pipeline-Threshold 80% global, mit Mehr-Threshold-Konfig per Pfad in `vitest.config.ts` falls nötig.
- **E2E-Gate (Gate 9):** In CI läuft mit `NAVIGATOR_PHASE=hard` (alle Routes erreichbar) — Production-Coming-Soon-Mode (Story 4.1) wird in CI nicht reproduziert, damit Atlas-E2Es testbar bleiben.

**Sequence-Hand-offs:**

- **Story 2.0 (Postgres-Foundation):** `pnpm db:migrate` + `pnpm data:aggregate` existieren. Schema läuft gegen Postgres-Service-Container.
- **Story 3.1 (Paraglide-Reduce):** `messages/de.json` only. Cookie-Leak-Gate (#13) verifiziert keinen `PARAGLIDE_LOCALE`-Cookie mehr.
- **Story 4.1 (Production-Setup):** Coolify-Webhook-URL aus Story 4.1 für Deploy-Workflow.
- **Story 4.2 (Security-Hardening):** keine direkten CI-Auswirkungen, aber CSP-Build-Output von 4.2 wird in Bundle-Size-Gate berücksichtigt.

**Memory-Marker:** `feedback_no_em_dashes`, `project_i18n_phase_1_de_only`, `project_server_purchase_sequencing` (Coolify-Webhook-Hand-off).

## Acceptance Criteria

**AC-1 (`.github/workflows/ci.yml` mit 13 Gates):**

**Given** das GitHub-Repository
**When** ich `.github/workflows/ci.yml` neu anlege
**Then** Workflow läuft auf `pull_request` + `push` zu `main` mit folgender Pipeline:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  quality-gates:
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: navigator_ci
          POSTGRES_USER: app
          POSTGRES_PASSWORD: ci-only-ephemeral
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U app -d navigator_ci"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgres://app:ci-only-ephemeral@127.0.0.1:5432/navigator_ci
      NAVIGATOR_PHASE: hard
      ORIGIN: http://localhost:4173
      NOMINATIM_ENDPOINT: https://nominatim.openstreetmap.org
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 10 }

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Gate 1 — Lint (ESLint + Prettier)
        run: pnpm lint

      - name: Gate 2 — Typecheck (svelte-check strict)
        run: pnpm check

      - name: Gate 3 — Unit-Tests + Coverage ≥80%
        run: pnpm test:unit -- --run --coverage

      - name: Gate 4 — Drizzle-Migrate gegen CI-Postgres
        run: pnpm db:migrate

      - name: Gate 5 — data:aggregate (fetch + aggregate)
        run: |
          pnpm data:fetch
          pnpm data:aggregate

      - name: Gate 6 — Build (production)
        run: pnpm build

      - name: Gate 7 — E2E + axe-core (Playwright)
        run: |
          pnpm exec playwright install --with-deps chromium
          pnpm test:e2e

      - name: Gate 8 — Lighthouse-CI
        run: pnpm exec lhci autorun --config=lighthouserc.cjs

      - name: Gate 9 — Bundle-Size-Check (size-limit)
        run: pnpm exec size-limit

      - name: Gate 10 — US-Domain-Allowlist-Check
        run: pnpm exec tsx scripts/check-us-domains.ts

      - name: Gate 11 — Cookie-Leak-Check
        run: pnpm exec tsx scripts/check-cookie-leak.ts

      - name: Gate 12 — Compile-A11y-Warnings (svelte-check + eslint-plugin-svelte)
        run: pnpm exec eslint --max-warnings 0 'src/**/*.{ts,svelte}'

      # Gate 13 — i18n-coverage-check (DEFERRED Phase 3)
      # - name: Gate 13 — i18n-coverage-check
      #   run: pnpm exec tsx scripts/check-i18n-coverage.ts
      #   # Aktiviert in Future-Epic „i18n-Phase-3-EN-Coverage" (Stories 3.2-3.5).
      #   # Phase 1: DE-only per User-Lock 2026-05-16.
```

**And** PR-Status-Check meldet pro Gate `success`/`failure` separat (kein Single-Job-Collapse)
**And** Job-Timeout 30 Min (Build-Zeit-Budget NFR-IL5 für Routes + Lighthouse-Multi-URL-Audit)
**And** Postgres-Service-Container ist `health-status=healthy` bevor Gate 4 startet (Default-Behavior via `options`-Block)

**AC-2 (Lefthook Pre-Commit-Hooks):**

**Given** Lefthook bereits in `devDependencies` (Version `^2.1.6`)
**When** ich `lefthook.yml` in Repo-Root anlege
**Then** Konfiguration:

```yaml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: '*.{ts,svelte,js,cjs,mjs}'
      run: pnpm exec eslint {staged_files}
    format:
      glob: '*.{ts,svelte,js,cjs,mjs,json,md,yml,yaml}'
      run: pnpm exec prettier --check {staged_files}
    typecheck:
      glob: '*.{ts,svelte}'
      run: pnpm check

pre-push:
  parallel: false
  commands:
    test-unit:
      run: pnpm test:unit -- --run --reporter=dot
```

**And** `package.json` `scripts.prepare` erweitert: `lefthook install && svelte-kit sync || echo ''`
**And** `pnpm install` triggert `lefthook install` automatisch (post-install-Hook)
**And** Pre-Commit-Lokal blockt Commits bei Lint/Format/Type-Errors
**And** Pre-Push blockt Push bei failing Unit-Tests (kein langer E2E im Pre-Push)

**AC-3 (`lighthouserc.cjs` mit 4 Schwellen):**

**Given** SvelteKit-Build-Output `build/`-Dir + Top-Routes-Liste
**When** ich `lighthouserc.cjs` in Repo-Root anlege

```js
module.exports = {
  ci: {
    collect: {
      staticDistDir: './build',
      url: [
        'http://localhost/',
        'http://localhost/methodik',
        'http://localhost/methodik/kiez-score',
        'http://localhost/lizenzen',
        'http://localhost/layer/kitas-2024'
      ],
      numberOfRuns: 1
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }]
      }
    }
  }
};
```

**Then** Lighthouse-CI startet eigenen Static-Server gegen `build/` (kein separater `pnpm preview`-Step nötig)
**And** Schwellen NFR-P7/P8/A3 erfüllt: Performance ≥0.90, A11y ≥0.95, SEO ≥0.95, Best Practices ≥0.95
**And** Multi-Route-Audit (5 Top-Routes: `/`, `/methodik`, `/methodik/kiez-score`, `/lizenzen`, `/layer/kitas-2024`)
**And** Build-Time-Budget für Lighthouse ~5min (5 Routes × 1 Run)
**And** Route-Liste editierbar wenn weitere Top-Routes in späteren Stories live gehen (Story 2.3/2.4/2.9b)

**AC-4 (`.size-limit.json` Bundle-Size-Budget — NFR-P5):**

**Given** Vite-`manualChunks` aus `vite.config.ts` Zeilen 25–44 (Maplibre/LayerChart/Turf in eigene Async-Chunks)
**When** ich `.size-limit.json` in Repo-Root anlege

```json
[
  {
    "name": "Initial JS (Critical Path)",
    "path": "build/_app/immutable/entry/*.js",
    "limit": "200 KB",
    "gzip": true
  },
  {
    "name": "MapLibre Chunk (lazy)",
    "path": "build/_app/immutable/chunks/maplibre-*.js",
    "limit": "350 KB",
    "gzip": true
  },
  {
    "name": "LayerChart Chunk (lazy)",
    "path": "build/_app/immutable/chunks/layerchart-*.js",
    "limit": "120 KB",
    "gzip": true
  },
  {
    "name": "Turf Chunk (lazy)",
    "path": "build/_app/immutable/chunks/turf-*.js",
    "limit": "80 KB",
    "gzip": true
  }
]
```

**Then** Gate 9 schlägt fehl bei Überschreitung
**And** Initial-JS-Hard-Limit 200 KB gzipped (NFR-P5)
**And** Lazy-Chunks haben großzügigere Limits (nicht im Critical-Path, durch Vite-`manualChunks` von Hauptchunk getrennt)
**And** `package.json` Script `"size": "size-limit"` für lokales Run

**AC-5 (`scripts/check-us-domains.ts` US-Domain-Allowlist — NFR-S7):**

**Given** Build-Output `build/`-Dir + Source-Code-Tree `src/` + Static-Files `static/`
**When** ich `scripts/check-us-domains.ts` neu schreibe
**Then** Script:
  - Scannt rekursiv `build/`, `src/`, `static/`, `scripts/` für alle `https?://[^"'\s]+`-Matches
  - Extrahiert Domain-Hosts
  - Vergleicht gegen **Allowlist:**
    ```ts
    const ALLOWED_HOSTS = [
      'navigator.berlin', 'www.navigator.berlin',
      'tiles.openfreemap.org',
      'fbinter.stadt-berlin.de',
      'daten.odis-berlin.de', 'daten.berlin.de',
      'overpass-api.de',
      'opendata.dwd.de',
      'nominatim.openstreetmap.org',
      'openstreetmap.org', 'www.openstreetmap.org',
      'creativecommons.org', 'opendatacommons.org',
      'gdi.berlin.de',
      'inlang.com',           // ADR-005 Reference
      'github.com',            // README/ADR-Links
      'svelte.dev', 'svelte.app',
      'openfontlicense.org',
      'openfreemap.org', 'openmaptiles.org',
      'localhost', '127.0.0.1'
    ];
    ```
  - Whitelist-Patterns (Regex) für `*.berlin.de`, `*.odis-berlin.de`, `*.stadt-berlin.de`
  - **US-Blocklist-Hint:** explizite Liste von US-Hosts die NIEMALS auftauchen dürfen (`*.cloudflare.com`, `*.amazonaws.com`, `*.googleapis.com`, `*.googletagmanager.com`, `*.plausible.io` — Plausible wäre EU-konform aber Anti-Tracking-Linie sagt Nein)
  - Exit 1 mit verbosem Report bei Violation (gefundene-URL + File-Path + Line)
  - Exit 0 bei sauberem Output mit Summary `OK: N URLs in M Files, X allowed hosts`
**And** Script ist test-coverage (`scripts/check-us-domains.test.ts`) mit 3 Cases: clean-build → exit 0, blocklist-hit → exit 1, unknown-host → exit 1 mit Report
**And** Test als Vitest-Server-Project (Node-Env)
**And** `package.json` Script `"check:us-domains": "tsx scripts/check-us-domains.ts"`

**AC-6 (`scripts/check-cookie-leak.ts` Cookie-Leak-Detection — NFR-PR1, MUST-Rule #10):**

**Given** SvelteKit-Production-Build via `pnpm preview` ODER Static-Files-Server
**When** ich `scripts/check-cookie-leak.ts` neu schreibe
**Then** Script:
  - Startet `pnpm preview` als Child-Process (oder static-server gegen `build/`)
  - Wartet bis Port 4173 healthy (`fetch('http://localhost:4173/healthz')` 200)
  - Probt 5–10 Routes via `fetch()`: `/`, `/methodik`, `/lizenzen`, `/layer/kitas-2024`, `/api/healthz`
  - Inspect Response-Headers für **`Set-Cookie`-Header** (case-insensitive)
  - Exit 1 mit Report bei Cookie-Set: `❌ Set-Cookie detected on /methodik: PARAGLIDE_LOCALE=...`
  - Exit 0 bei keinem Set-Cookie auf allen Routes
  - Cleanup: Child-Process `kill()` am Ende
**And** Script ist test-coverage (`scripts/check-cookie-leak.test.ts`) mit Mock-Server: 2 Cases (kein Cookie → exit 0, fake-Set-Cookie → exit 1)
**And** `package.json` Script `"check:cookie-leak": "tsx scripts/check-cookie-leak.ts"`
**And** Dependent auf Story 3.1 (Paraglide-Reduce) — wenn 3.1 NICHT done, Gate failt durch `PARAGLIDE_LOCALE`-Cookie

**AC-7 (`.github/workflows/deploy.yml` Coolify-Webhook auf Main):**

**Given** Coolify-Webhook-URL aus Story 4.1 + Coolify-Auth-Token
**When** ich `.github/workflows/deploy.yml` neu anlege

```yaml
name: Deploy
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    steps:
      - name: Trigger Coolify-Webhook
        run: |
          curl -fsSL -X POST \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_WEBHOOK_TOKEN }}" \
            "${{ secrets.COOLIFY_WEBHOOK_URL }}"
```

**Then** Deploy läuft NUR nach erfolgreichem CI-Workflow auf Main (`conclusion == 'success'`)
**And** Coolify-Webhook-Token + URL als GitHub-Repo-Secrets:
  - `COOLIFY_WEBHOOK_TOKEN`
  - `COOLIFY_WEBHOOK_URL`
**And** Curl-Fail (Non-2xx-Response) führt zu Workflow-Failure
**And** Deploy-Workflow läuft NUR auf Main-Branch (`branches: [main]`)
**And** PR-Builds triggern NICHT Deploy
**And** Setup-Steps für Secrets dokumentiert in `docs/runbooks/server-bootstrap.md` (Hand-off zu Story 4.1-Output)

**AC-8 (Compile-A11y-Warnings als ESLint-Errors — UX-DR-A11y):**

**Given** ESLint-Config mit `eslint-plugin-svelte`
**When** ich Existenz von A11y-Rules in `eslint.config.js` prüfe
**Then** ESLint-Config enthält folgende Rules als `error`-Level (nicht `warn`):
  - `svelte/a11y-click-events-have-key-events`
  - `svelte/a11y-no-static-element-interactions`
  - `svelte/a11y-missing-attribute`
  - `svelte/a11y-label-has-associated-control`
  - `svelte/a11y-img-redundant-alt`
  - `svelte/a11y-no-noninteractive-element-interactions`
  - `svelte/a11y-no-redundant-roles`
**And** Gate 12 (`pnpm exec eslint --max-warnings 0`) failt bei jeder A11y-Violation
**And** Bestehende `eslint.config.js` wird editiert (NICHT überschrieben), bestehende Rules bleiben

**AC-9 (Test-Run für CI-Scripts):**

**Given** `scripts/check-us-domains.ts` + `scripts/check-cookie-leak.ts`
**When** ich Test-Coverage verifiziere
**Then** Vitest-Tests laufen in `pnpm test:unit`-Server-Project (Node-Env)
**And** `scripts/check-us-domains.test.ts` (3 Cases) + `scripts/check-cookie-leak.test.ts` (2 Cases)
**And** Coverage-Goal: 80% für CI-Scripts (Pragmatic-TDD pro ADR-012)

**AC-10 (CI-Smoke-Verifikation):**

**Given** Workflow-File `ci.yml` per AC-1
**When** ich Test-PR (z.B. trivialer Typo-Fix in README) öffne
**Then** Alle 12 aktiven Gates laufen durch (Gate 13 i18n-coverage bleibt kommentiert)
**And** PR-UI zeigt 12 separate Check-Status (`success`)
**And** Trigger-Test: ich pushe absichtlich Code mit Lint-Error → CI failt bei Gate 1 sofort
**And** Trigger-Test: ich pushe absichtlich Code mit `eval()`-Call → CI failt bei Gate 12 (A11y-Warnings sind hier nicht direkt aktiviert, aber `no-eval`-Default-Rule ist ESLint-Recommended)
**And** Verifikation-Doku in `docs/runbooks/ci-troubleshooting.md` neu

**AC-11 (Cache-Strategy + Build-Performance):**

**Given** GitHub-Actions-Caching für `pnpm install` + Playwright-Browsers
**When** ich Cache-Strategie verifiziere
**Then** `actions/setup-node@v4` mit `cache: pnpm` cached `~/.local/share/pnpm/store`
**And** Playwright-Browsers cached via `actions/cache@v4` (Cache-Key based on `pnpm-lock.yaml`-Hash)
**And** Postgres-Service-Container hat keinen Cache (ephemeral, fresh pro Run)
**And** Build-Output `build/`-Dir wird via `actions/upload-artifact@v4` (optional) für Inspect-Bedarf zwischen Gates verfügbar gemacht — falls Build sequenziell genug ist, Step-Output reicht
**And** Total-Build-Zeit-Ziel <15min für PR-Build (Solo-Maintainer-Iteration-Speed)

## Tasks / Subtasks

- [ ] **Task 1: `.github/workflows/ci.yml` Setup (AC: #1, #11)**
  - [ ] `.github/workflows/`-Folder anlegen
  - [ ] `ci.yml` schreiben (Code-Snippet AC-1)
  - [ ] Postgres-Service-Container + Health-Check
  - [ ] Cache-Strategie (pnpm + Playwright)
  - [ ] Push auf neuen Feature-Branch + Test-PR
  - [ ] Verify alle 12 Gates laufen

- [ ] **Task 2: `lefthook.yml` Pre-Commit + Pre-Push (AC: #2)**
  - [ ] `lefthook.yml` schreiben (Code-Snippet AC-2)
  - [ ] `package.json` `scripts.prepare`: `lefthook install && svelte-kit sync || echo ''`
  - [ ] `pnpm install` → verifizieren `.git/hooks/pre-commit` existiert
  - [ ] Lokal-Test: commit mit Lint-Error → blockt
  - [ ] Lokal-Test: push mit failing test → blockt

- [ ] **Task 3: `lighthouserc.cjs` Lighthouse-CI (AC: #3)**
  - [ ] `lighthouserc.cjs` schreiben (Code-Snippet AC-3)
  - [ ] Lokal-Test: `pnpm exec lhci autorun --config=lighthouserc.cjs`
  - [ ] Verify 4 Schwellen-Errors bei künstlich-eingebauter Regression
  - [ ] Falls bestehende Routes Lighthouse-Schwellen nicht erreichen: temporäre Allow-Liste für noch-nicht-tunable Pages mit `// TODO: post-2.x raise`-Kommentar

- [ ] **Task 4: `.size-limit.json` Bundle-Budget (AC: #4)**
  - [ ] `.size-limit.json` schreiben (Code-Snippet AC-4)
  - [ ] `package.json` Script `"size": "size-limit"`
  - [ ] Lokal-Test: `pnpm build && pnpm size`
  - [ ] Verify 200 KB Initial-JS-Threshold erreichbar — falls aktueller Build-Output >200KB, Vite-`manualChunks` weiter splitten oder Initial-Entry pruning

- [ ] **Task 5: `scripts/check-us-domains.ts` (AC: #5, #9)**
  - [ ] Script schreiben mit ALLOWED_HOSTS-Allowlist
  - [ ] Recursive-Scan-Logic über `build/`, `src/`, `static/`, `scripts/`
  - [ ] Regex-Match auf `https?://...`
  - [ ] Domain-Extraktion + Vergleich gegen Allowlist
  - [ ] Verbose-Report bei Violation
  - [ ] Test `scripts/check-us-domains.test.ts` (3 Cases)
  - [ ] `package.json` Script `"check:us-domains": "tsx scripts/check-us-domains.ts"`

- [ ] **Task 6: `scripts/check-cookie-leak.ts` (AC: #6, #9)**
  - [ ] Script schreiben
  - [ ] `child_process.spawn('pnpm', ['preview'])`
  - [ ] Wait-for-port via fetch-poll auf `/healthz`
  - [ ] 5–10 Routes probeen + Response-Header-Check
  - [ ] Cleanup im finally-Block
  - [ ] Test `scripts/check-cookie-leak.test.ts` (2 Cases, Mock-Server)
  - [ ] `package.json` Script `"check:cookie-leak": "tsx scripts/check-cookie-leak.ts"`

- [ ] **Task 7: ESLint-A11y-Rules Hardening (AC: #8)**
  - [ ] `eslint.config.js` editieren: 7 A11y-Rules auf `error`-Level
  - [ ] Lokal-Test: `pnpm exec eslint --max-warnings 0 'src/**/*.{ts,svelte}'`
  - [ ] Falls bestehende Files A11y-Violations zeigen: in 4.3-Scope behoben (mind. die offensichtlichen) ODER als Phase-3-Punch-List dokumentiert in `docs/runbooks/ci-troubleshooting.md`

- [ ] **Task 8: `.github/workflows/deploy.yml` Coolify-Webhook (AC: #7)**
  - [ ] Workflow-File schreiben
  - [ ] GitHub-Repo-Secrets erfassen: `COOLIFY_WEBHOOK_TOKEN`, `COOLIFY_WEBHOOK_URL` (Owner-Action)
  - [ ] Coolify-UI: Webhook-URL + Token aus Story 4.1 abrufen, in `docs/runbooks/server-bootstrap.md` dokumentieren
  - [ ] Test: Merge auf Main → Deploy-Workflow läuft → Coolify-Deploy-Re-Build

- [ ] **Task 9: CI-Smoke-Test + Verifikation (AC: #10)**
  - [ ] Test-PR mit triviale-Änderung öffnen
  - [ ] Alle 12 Gates verifizieren
  - [ ] Negativ-Tests: künstliche Lint/Type/Test/Build-Errors injecten, verifizieren Gates greifen
  - [ ] Ergebnisse in `docs/runbooks/ci-troubleshooting.md` festhalten

- [ ] **Task 10: Documentation (AC: #10)**
  - [ ] `docs/runbooks/ci-troubleshooting.md` (neu): Häufige Gate-Failures + Fixes (Coverage-Drop, Bundle-Bloat, Lighthouse-Schwellen)
  - [ ] `README.md` erweitern: Section „CI/CD" mit Verweis auf Workflows + Lefthook-Setup
  - [ ] Hand-off zu Story 4.1: Coolify-Webhook-Secret-Setup-Steps in `server-bootstrap.md` ergänzen

- [ ] **Task 11: Commit-Strategie**
  - [ ] Commits getrennt:
    1. `chore(ci): github-actions workflow with 12 quality gates (story 4.3 a)`
    2. `chore(ci): lefthook pre-commit + pre-push hooks (story 4.3 b)`
    3. `chore(ci): lighthouse + size-limit + us-domain + cookie-leak checks (story 4.3 c)`
    4. `chore(ci): coolify deploy-webhook on main + eslint a11y hardening (story 4.3 d)`
  - [ ] Alle Commits ohne em-dashes

## Dev Notes

### Aktueller CI-Stand (vor Story 4.3)

- **`.github/`-Folder:** existiert nicht
- **`lefthook.yml`:** existiert nicht (lefthook-Dep nur in package.json)
- **`lighthouserc.cjs`:** existiert nicht (`@lhci/cli` in devDeps)
- **`.size-limit.json`:** existiert nicht (size-limit in devDeps)
- **`scripts/check-*.ts`:** keine vorhanden
- **`pnpm test:e2e`:** existiert (`playwright install && playwright test`)
- **`pnpm test:unit`:** existiert (vitest)
- **Vite-`manualChunks`:** definiert für maplibre/layerchart/turf (vite.config.ts Zeilen 25–44)
- **Postgres-Foundation:** Story 2.0 in `review`, `db:migrate` + `data:aggregate` + Aggregat-Schema existieren

### Pipeline-Design-Decisions

**Decision-1: Single-Job vs Multi-Job-Workflow**

Pipeline läuft als **Single-Job** mit allen 12 Gates seriell. Pro/Contra:

- **Pro:** Postgres-Service-Container kann von allen Gates konsumiert werden (`db:migrate` + `aggregate` + e2e). Build-Output `build/`-Dir lebt durch alle Gates ohne Artifact-Upload.
- **Contra:** Längere Total-Pipeline-Zeit (~15min sequenziell). Multi-Job parallel würde aber Postgres-Setup pro Job duplizieren (cost > saving).

**Empfehlung:** Single-Job. Bei späterer Performance-Optimierung (Phase-3): in 2 Jobs splitten (`prep + quality-gates`).

**Decision-2: `pnpm test:e2e` in CI vs eigenes Step**

Story `package.json` `test:e2e` macht `playwright install && playwright test`. In CI ist Playwright-Install separat (mit `--with-deps chromium` für nur Chromium statt allen Browsers, schneller).

**Empfehlung:** Eigenes Step `pnpm exec playwright install --with-deps chromium` + `pnpm test:e2e` getrennt. Spart 5–10min Install-Zeit.

**Decision-3: Lighthouse-CI Server-Mode vs Static-Dist**

`lighthouserc.cjs` mit `staticDistDir: './build'` startet LH-internen Static-Server. Vorteil: kein `pnpm preview` parallel nötig. Nachteil: Server-Side-Routing (SvelteKit-Adapter-Node) wird nicht getestet — nur statischer Output.

**Empfehlung:** Static-Dist für Phase 1 (Lighthouse misst Client-Performance, nicht SSR). Falls SSR-Performance-Audit nötig (NFR-P4 TTFB): `pnpm preview` als Background-Step + LH gegen `localhost:4173`. Phase-3-Erweiterung.

### Coverage-Threshold-Detail

ADR-012 Pragmatic-TDD: 80% Daten-Transform, 90% kritische Pfade, UI-Smoke E2E für Top-3.

Vitest-Coverage-Config (in `vite.config.ts` `test`-Section ODER `vitest.config.ts`):

```ts
test: {
  coverage: {
    provider: 'v8',
    thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    exclude: ['scripts/**', 'tests/e2e/**', '**/*.test.ts', '**/*.spec.ts']
  }
}
```

Falls Coverage <80% blockiert CI-Gate. Bei mehr Tests in späteren Stories Auto-Erhöhung. ADR-012 erlaubt zudem path-spezifische Thresholds — optional.

### Memory-Bezug

- **`feedback_no_em_dashes`:** Commit-Messages und Doku-Strings ohne em-dashes (`,` oder `:` oder `·`)
- **`project_i18n_phase_1_de_only`:** Gate 13 i18n-coverage DEFERRED, kommentiert in `ci.yml`
- **`project_server_purchase_sequencing`:** Coolify-Webhook-URL aus 4.1, Deploy-Workflow nur Main + nur nach grünem CI

### Architektur-Constraints

**MUST-Rule-Mapping:**

- **Rule #10 (Cookieless):** Gate 11 (Cookie-Leak-Check) enforced. Hand-off zu Story 3.1.
- **Rule #11 (Kein US-Drittanbieter):** Gate 10 (US-Domain-Allowlist-Check) enforced.
- **Rule #14 (i18n-First):** DEFERRED in Phase 1, Gate 13 inaktiv.

**NFR-Mapping:**

- **NFR-M3 (Typecheck):** Gate 2
- **NFR-M4 (Lint/Format):** Gate 1
- **NFR-M5 (Unit-Test-Coverage):** Gate 3
- **NFR-M6 (Reproducible Build):** Gate 6 + 11 (Cache-Strategie)
- **NFR-A1 (axe-core 0 Violations):** Gate 7
- **NFR-A3 (Lighthouse-A11y ≥95):** Gate 8
- **NFR-P5 (Initial-JS ≤200KB):** Gate 9
- **NFR-P7/P8 (Lighthouse-Performance/SEO):** Gate 8
- **NFR-PR1 (Set-Cookie absent):** Gate 11
- **NFR-S7 (US-Drittanbieter):** Gate 10
- **NFR-IL5 (Build <15min):** AC-11 Cache-Strategie

### Test-Strategie (ADR-012)

Story 4.3 ist **Infra-YAML + 2 CI-Scripts**. ADR-012 Exceptions: Infra-YAML, CI-Scripts mit Test-First (AC-9 erzwingt Vitest-Coverage für 2 Scripts).

- **Vitest:** `scripts/check-us-domains.test.ts` (3 Cases) + `scripts/check-cookie-leak.test.ts` (2 Cases)
- **Smoke:** Test-PR mit Trivial-Change + Negativ-Tests
- **Infra-YAML:** keine direkten Tests, nur durch CI-Trigger validiert

### Previous Story Intelligence

**Story 4.1 (Production-Setup, ready-for-dev):** Coolify-Webhook-URL kommt aus 4.1-Output. Falls 4.1 nicht done bei 4.3-Implementation: AC-7 (Deploy-Workflow) PARALYSIERT bis 4.1 done. Empfehlung: Deploy-Workflow als letzten Task implementieren, nach 4.1 verfügbar.

**Story 4.2 (Security-Hardening, ready-for-dev):** Verifiziert Security-Header in Production. CI-Gate 11 (Cookie-Leak) ist Counterpart zu 4.2-AC-10-Smoke. 4.3-Gate testet auf Build-Output, 4.2 testet Production-Server.

**Story 3.1 (Paraglide-Reduce, ready-for-dev):** Gate 11 (Cookie-Leak) ist abhängig. Wenn 3.1 done, Gate 11 grün. Wenn 3.1 nicht done, Gate 11 failt → 3.1 muss done bevor 4.3 erste-erfolgreiche-CI-Run hat.

### File-List nach Story-Completion (erwartet)

**Modified:**

- `package.json` (scripts: `size`, `check:us-domains`, `check:cookie-leak`, `prepare` erweitert)
- `eslint.config.js` (7 A11y-Rules auf error)
- `vitest.config.ts` ODER `vite.config.ts` (Coverage-Thresholds)
- `README.md` (CI/CD-Section)

**New:**

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `lefthook.yml`
- `lighthouserc.cjs`
- `.size-limit.json`
- `scripts/check-us-domains.ts`
- `scripts/check-us-domains.test.ts`
- `scripts/check-cookie-leak.ts`
- `scripts/check-cookie-leak.test.ts`
- `docs/runbooks/ci-troubleshooting.md`

### Project Structure Notes

`.github/workflows/`-Folder ist GitHub-Convention, kein Architecture-Doku-Konflikt.
`scripts/check-*.ts` co-located mit anderen `scripts/`-Files.
`lighthouserc.cjs` Repo-Root convention für LH-CI.
`.size-limit.json` Repo-Root convention.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 4.3` Zeilen 1962–2003] — Story-Definition
- [Source: `_bmad-output/planning-artifacts/architecture.md` Zeilen 1077–1084] — Pattern-Enforcement-Gates
- [Source: `_bmad-output/planning-artifacts/prd.md` NFR-M3 bis NFR-M6, NFR-A1/A3, NFR-P5/P7/P8, NFR-PR1, NFR-S7, NFR-IL5] — Quality-NFRs
- [Source: `docs/adr/ADR-012-tdd-mandate.md`] — Pragmatic-TDD, Coverage-Pfade
- [Source: `CLAUDE.md`] — Output-Konventionen, Files <500
- [Source: `package.json`] — devDeps: size-limit, lefthook, @lhci/cli, @axe-core/playwright
- [Source: `vite.config.ts` Zeilen 25–44] — manualChunks
- [Source: `scripts/aggregate-data.ts`] — Story 2.0 Pipeline-Konsument
- [Source: GitHub-Actions Services-Container Docs https://docs.github.com/en/actions/using-containerized-services]
- [Source: Lefthook https://lefthook.dev]
- [Source: Lighthouse-CI https://github.com/GoogleChrome/lighthouse-ci]
- [Source: size-limit https://github.com/ai/size-limit]
- [Source: Memory `feedback_no_em_dashes`]
- [Source: Memory `project_i18n_phase_1_de_only`]
- [Source: Memory `project_server_purchase_sequencing`]

## Open Questions / Pre-Dev-Clarifications

1. **Coverage-Threshold 80% sofort oder schrittweise?** Aktueller Code-Coverage-Stand ist nicht gemessen (kein `--coverage` in `pnpm test:unit`-Standard-Run). Falls aktuell <80%: temporär auf gemessenen Wert (z.B. 65%) setzen + Punch-List in `ci-troubleshooting.md`. Empfehlung: **schrittweise**, Gate-Threshold = Aktueller-Wert minus 5% (no-regression), Erhöhung in Folge-Stories.

2. **E2E in CI mit NAVIGATOR_PHASE=hard oder gestaffelt?** CI-Job-Env setzt `NAVIGATOR_PHASE=hard` damit Atlas-Routes testbar. Production-Coming-Soon-State NICHT in CI reproduziert. Falls Coming-Soon-Tests nötig (z.B. 503-Guard-Tests): separates Job mit `NAVIGATOR_PHASE=coming-soon`. Empfehlung: **erst hard-only** in 4.3, Coming-Soon-Tests in Phase-2-Story.

3. **Lighthouse-Routes-Liste editierbar via separate Datei?** Aktuell hardcoded in `lighthouserc.cjs`. Falls 5 weitere Routes in Stories 2.3/2.4/2.9b live gehen: Manuel-Update. Alternative: `lighthouserc.cjs` liest aus `sitemap.xml` zur Laufzeit (Komplexität-Bleed). Empfehlung: **hardcoded, manuell-update** als Phase-1-Minimum.

4. **Coolify-Deploy-Webhook via `workflow_run` oder direkter Trigger im `ci.yml`?** Variante A (gewählt): separater Workflow `deploy.yml` mit `workflow_run`-Trigger nach erfolgreichem CI. Variante B: Deploy-Step direkt im `ci.yml`-Workflow mit `if: github.ref == 'refs/heads/main'`. Variante A ist klarer (Separation-of-Concerns + Deploy-Audit-Trail). Empfehlung: **Variante A**.

5. **us-domain-allowlist: Build-Output-Scan oder Source-Scan?** Build-Output (`build/`) zeigt finale Bundle-URLs, Source-Scan (`src/`, `static/`) zeigt Editorial-Intent. Empfehlung: **beides**. Source-Scan fängt Dev-Drift (z.B. neue Google-Fonts-Import), Build-Scan fängt Final-Output-Drift (z.B. transitive Dep mit US-CDN-Reference). Performance-Cost minimal.

## Dev Agent Record

### Agent Model Used

_(wird vom dev-agent ausgefüllt)_

### Debug Log References

### Completion Notes List

### File List

_(wird vom dev-agent ausgefüllt)_
