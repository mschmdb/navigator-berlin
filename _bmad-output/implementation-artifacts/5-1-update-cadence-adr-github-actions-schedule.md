# Story 5.1: Update-Cadence-ADR-016 + GitHub-Actions-Schedule-Workflows pro Datenquelle

Status: ready-for-dev

<!-- Created 2026-05-16 via create-story workflow. Validation per checklist.md optional vor dev-story. -->

## Story

As a Solo-Maintainer,
I want eine codifizierte Update-Cadence pro Datenquelle als `ADR-016-update-cadence.md` + GitHub-Actions-Schedule-Cron-Workflows mit Auto-PR-Erstellung bei Daten-Diff + Diff-Threshold-Gating (>20% Feature-Loss blockt Auto-Merge) + automatischem `pnpm data:aggregate`-Folge-Step + Snapshot-Tests gegen Score-Plausibilität (kein >10%-Sprung pro Bezirk),
so that Site-Daten nicht ungemerkt veralten, Refresh-Verantwortung als Maintainer-Routine-Last verschwindet, große Daten-Drift früh erkannt wird, und Postgres-Aggregate (Story 2.0) konsistent zur Static-GeoJSON-Source-of-Truth gehalten werden.

## Phase-Kontext + Scope-Anpassung

**Hand-off von vorhergehenden Stories:**

- **Story 2.0:** `pnpm data:fetch` + `pnpm data:aggregate` als CLI-Scripts existieren, Drizzle-Schema bereitliegend
- **Story 4.1:** Hetzner CPX22 + Coolify-Webhook für Production-Deploy-Trigger
- **Story 4.3:** GitHub-Actions-CI mit 13 Quality-Gates + Postgres-Service-Container
- **Story 4.4:** ADR-Verzeichnis-Konvention (ADR-013/014/015 fix), 5 Disaster-Recovery-Runbooks. ADR-016 wird in dieser Story 5.1 ergänzt (NICHT in 4.4-Scope)
- **`scripts/lib/sources.ts`:** 42 aktive Layer + 4 DWD-Klima-Stationen als Source-of-Truth-Liste

**Phase-1-Pragmatik:**

Nicht alle 9 Cadence-Buckets brauchen Phase-1-Workflow-Implementation. **Critical Phase 1:**

- Daily (Stolpersteine via Overpass)
- Monthly (ÖPNV-Stops + Netze)
- Manual-Trigger für annuals/quadrennials/quinquennials (Cron-Schedule definiert, aber `workflow_dispatch`-Override für Solo-Maintainer-Bedarf)

**Phase-1-NICHT-Pflicht:**

- Vollautomatische Auto-Merge-Pipeline für annuals (User reviewt PR manuell)
- Plausibilitäts-Snapshot-Tests (kann Story 5.5-Backup-Drill nutzen für Production-Validation)

**Memory-Marker:** `feedback_no_em_dashes`, `project_server_purchase_sequencing` (Coolify-Webhook-Trigger für Auto-Deploy nach Daten-Refresh), `project_i18n_phase_1_de_only` (ADR-016 nur DE).

## Acceptance Criteria

**AC-1 (ADR-016 Update-Cadence neu):**

**Given** 42 aktive Datenquellen aus `scripts/lib/sources.ts` + 4 DWD-Klima-Stationen + Aggregat-Pipeline aus Story 2.0
**When** ich `docs/adr/ADR-016-update-cadence.md` neu anlege
**Then** ADR enthält:
  - **Frontmatter:** `status: Accepted`, `date: 2026-05-16`, `deciders: solo-maintainer`
  - **Context:** Solo-Maintainer-Realität, manuelle Refresh-Aufgabe als Bottleneck, FR40-Provenance-Pflicht (`sourceUpdatedAt` pro Layer in MANIFEST), Risiko verworfener Daten ohne Detection
  - **Decision:** Cadence-Matrix pro Datenquelle + GitHub-Actions-Schedule-Cron + Auto-PR mit Diff-Threshold + post-refresh `data:aggregate` + Coolify-Deploy-Webhook
  - **Cadence-Matrix (Tabelle):**

| Cadence-Bucket | Layer / Datenquelle | Refresh-Cron | Begründung |
|----------------|---------------------|--------------|------------|
| **daily** (03:00 UTC) | `stolpersteine` (Overpass) | `0 3 * * *` | OSM-Community-Edits laufend, Personen-Hintergrund-Updates |
| **monthly** (1. d. Monats, 03:00 UTC) | `ubahn-stationen`, `sbahn-stationen`, `tram-haltestellen`, `bus-haltestellen`, `ubahn-netz`, `tram-netz`, `sbahn-netz` (ODIS) | `0 3 1 * *` | BVG-/VBB-Tarif-Anpassungen, Stop-Verschiebungen |
| **quarterly** (1. Tag Quartal, 03:00 UTC) | `denkmal-2024` (FIS-Broker) | `0 3 1 1,4,7,10 *` | Senatsdenkmalamt Eintrags-Updates |
| **annually-Q1** (15. Februar) | DWD-Klima-Stations (`dahlem`/`buch`/`tempelhof`/`brandenburg`), `klima-pet-2022`, `klima-kaltlufteinwirkbereich-2022`, `klima-leitbahnkorridor-2022`, `bioklima-2023` | `0 3 15 2 *` | DWD-CDC-Annual-Release Februar |
| **annually-Q2** (15. Mai) | `kitas-2024`, `schulen-2024`, `einschulbereiche-2024`, `sportanlagen-2024` | `0 3 15 5 *` | Schulamt-Jahres-Update |
| **annually-Q3** (15. September) | `gruenanlagen`, `spielplaetze`, `schwimmbaeder`, `trinkbrunnen`, `radverkehrsnetz-2025`, `fahrradstrassen-2024`, `milieuschutz-erhaltungsmiete`, `milieuschutz-staedtebau` | `0 3 15 9 *` | StEP-Mobilität + Bezirks-Verwaltungs-Updates |
| **biennial** (Q1 ungerade Jahre) | `bodenrichtwerte` (BRW), `mss-gesamtindex-2025` | `0 3 1 3 */2` (effektiv 2-Jahres-Trigger) | Berliner Gutachterausschuss + Senatsverwaltung Stichtag |
| **quadrennial** (Q1 alle 4 Jahre) | `wohnlagen-2024` (Mietspiegel-Wohnlagen) | manueller Trigger (Cron deckt nicht 4-Jahres-Rhythmus elegant ab) | gesetzlicher Mietspiegel-Zyklus |
| **quinquennial** (Q1 alle 5 Jahre) | `laerm-2023`, `luft-2023`, `gruenversorgung-2023`, `umweltgerechtigkeit-2023` | manueller Trigger | EU-Lärmrichtlinie 5-Jahres-Zyklus + Luft-Modelling |
| **ad-hoc** (manueller Trigger) | `bezirke`, `ortsteile`, `plz`, `lor-bezirksregion`, `lor-planungsraum`, `krankenhaeuser-plan`, `krankenhaeuser-weitere` | `workflow_dispatch` only | Bezirks-Reform / Krankenhausplan-Revision selten |

  - **Consequences:**
    - Positive: Daten-Aktualität automatisiert, Maintainer-Last reduziert, FR40-Provenance konsistent
    - Negative: GH-Actions-Minuten-Verbrauch (Free-Tier 2.000 min/Monat reicht), zusätzliche PR-Review-Last (geschätzt 5-10 Auto-PRs/Monat)
    - Operational: Coolify-Webhook-Trigger nach erfolgreichem Auto-Merge, `data:aggregate`-Re-Run post-fetch, Snapshot-Test-Stability
  - **Alternatives:**
    - **Alle Refreshes manuell** (verworfen): Solo-Maintainer-Bottleneck
    - **Single-Workflow-täglich für alle Quellen** (verworfen): unnötiger Traffic gegen FIS-Broker/ODIS, Rate-Limit-Risiko
    - **External-Cron-Service (z.B. cron-job.org)** (verworfen): US-Anbieter, kein Repo-State-Sync
  - **References:** Story 5.1 (Implementation), `scripts/lib/sources.ts` (Source-Liste), Story 2.0 (Aggregat-Pipeline), Story 4.3 (CI-Gates), ADR-013 (Postgres-Hybrid)

**AC-2 (`.github/workflows/data-refresh-daily.yml` Daily-Workflow):**

**Given** Stolpersteine via Overpass täglich
**When** ich Daily-Workflow implementiere
**Then** Workflow-Datei:

```yaml
name: Data Refresh — Daily (Stolpersteine via Overpass)
on:
  schedule:
    - cron: '0 3 * * *'  # 03:00 UTC daily
  workflow_dispatch:

jobs:
  refresh:
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    permissions:
      contents: write
      pull-requests: write
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: navigator_ci
          POSTGRES_USER: app
          POSTGRES_PASSWORD: ci-only-ephemeral
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U app -d navigator_ci"
          --health-interval 10s
    env:
      DATABASE_URL: postgres://app:ci-only-ephemeral@127.0.0.1:5432/navigator_ci
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

      - name: Fetch Stolpersteine-only
        run: pnpm data:fetch -- --only stolpersteine

      - name: Compute diff vs main
        id: diff
        run: |
          git diff --stat static/layers/ > /tmp/diff.txt
          cat /tmp/diff.txt
          FEATURE_LOSS=$(pnpm exec tsx scripts/compute-feature-diff.ts stolpersteine || echo 0)
          echo "feature_loss=$FEATURE_LOSS" >> $GITHUB_OUTPUT

      - name: Run aggregate-pipeline
        run: |
          pnpm db:migrate
          pnpm data:aggregate

      - name: Snapshot-Test plausibility
        run: pnpm test:unit -- scripts/snapshot

      - name: Open PR with refresh
        id: create_pr
        uses: peter-evans/create-pull-request@v7
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'data(stolpersteine): refresh ${{ github.run_id }}'
          title: 'data: stolpersteine refresh ${{ github.run_id }}'
          body: |
            Auto-Refresh via GitHub-Actions-Schedule.

            Source: OSM Overpass API
            Feature-Diff: ${{ steps.diff.outputs.feature_loss }}% Feature-Loss

            Folge-Aggregate: data:aggregate erfolgreich, Snapshot-Tests grün.
          branch: 'data/auto-refresh-stolpersteine-${{ github.run_id }}'
          labels: ${{ steps.diff.outputs.feature_loss > 20 && 'data-refresh:requires-review' || 'data-refresh:auto' }}
```

**And** Workflow läuft täglich 03:00 UTC, Manual-Trigger via `workflow_dispatch`
**And** Auto-PR-Erstellung via `peter-evans/create-pull-request@v7` (EU-FOSS, MIT-License, GitHub-Marketplace-trusted)
**And** Diff-Threshold-Gate >20% Feature-Loss → Label `data-refresh:requires-review`, sonst `data-refresh:auto`
**And** Branch-Naming `data/auto-refresh-{slug}-{run_id}` für Konflikt-Freiheit

**AC-3 (`.github/workflows/data-refresh-monthly.yml` Monthly-Workflow):**

**Given** ÖPNV-Stops + Netze monatlich
**When** ich Monthly-Workflow implementiere
**Then** Workflow analog zu Daily, aber:
  - Cron: `0 3 1 * *` (1. d. Monats)
  - `pnpm data:fetch -- --only ubahn-stationen,sbahn-stationen,tram-haltestellen,bus-haltestellen,ubahn-netz,tram-netz,sbahn-netz` (7 Slugs)
  - Post-Fetch zusätzlich `pnpm data:oepnv-index` (Build-Output-Reuse aus Story 1.19 + 1.13)
  - PR-Title: `data(oepnv): monthly refresh {run_id}`
  - Selber Diff-Threshold-Gate

**AC-4 (`.github/workflows/data-refresh-quarterly.yml` Quarterly-Workflow):**

**Given** Denkmal-2024 vierteljährlich
**When** ich Quarterly-Workflow implementiere
**Then** Workflow analog zu Daily, aber:
  - Cron: `0 3 1 1,4,7,10 *` (1. Tag Q1/Q2/Q3/Q4)
  - `pnpm data:fetch -- --only denkmal-2024`
  - Threshold-Override: Denkmal-2024 hat Mapshaper-Sliver-Loss-Issue (Memory `project_simplify_keep_shapes` + Story 1.25), Feature-Count-Diff alleine ist nicht aussagekräftig → Threshold auf 30% Erhöhen ODER Custom-Diff-Logic mit Source-Feature-Count-Pre-Simplify

**AC-5 (`.github/workflows/data-refresh-annually-q1.yml` Annually-Q1-Workflow — DWD-Klima):**

**Given** DWD-Klima-Stations + Klima-Modelling jährlich Februar
**When** ich Annually-Q1-Workflow implementiere
**Then** Workflow:
  - Cron: `0 3 15 2 *` (15. Februar)
  - Fetch-Slugs: DWD-Stations (`dahlem`/`buch`/`tempelhof`/`brandenburg`) + Klima-Layer (`klima-pet-2022`, `klima-kaltlufteinwirkbereich-2022`, `klima-leitbahnkorridor-2022`, `bioklima-2023`)
  - DWD-Klima ist Build-Time-Generation-heavy (DWD-CDC-Parse), Timeout auf 60min erweitern
  - Klima-Modelling-Layer haben 5-Jahres-Updates aber DWD-Klima-Pipeline läuft jährlich gegen aktuellste DWD-CDC-Releases
  - PR-Title: `data(klima): annual refresh {year}`

**AC-6 (`.github/workflows/data-refresh-annually-q2.yml` Annually-Q2-Workflow — Bildung+Sport):**

**Given** Kitas/Schulen/Sportanlagen jährlich Mai (Schulamt-Update-Pattern)
**When** ich Annually-Q2-Workflow implementiere
**Then** analog zu Annually-Q1, aber:
  - Cron: `0 3 15 5 *` (15. Mai)
  - Fetch-Slugs: `kitas-2024`, `schulen-2024`, `einschulbereiche-2024`, `sportanlagen-2024`
  - Filename-Suffix-Handling: Quellen mit Jahres-Suffix (`-2024`) ggf. erst nach Jahres-Suffix-Update-Routine (Open-Q4)
  - PR-Title: `data(bildung-sport): annual refresh {year}`

**AC-7 (`.github/workflows/data-refresh-annually-q3.yml` Annually-Q3-Workflow — Mobilität+Grün+Milieuschutz):**

**Given** mehrere Layer jährlich September
**When** ich Annually-Q3-Workflow implementiere
**Then**:
  - Cron: `0 3 15 9 *` (15. September)
  - Fetch-Slugs: `gruenanlagen`, `spielplaetze`, `schwimmbaeder`, `trinkbrunnen`, `radverkehrsnetz-2025`, `fahrradstrassen-2024`, `milieuschutz-erhaltungsmiete`, `milieuschutz-staedtebau` (8 Slugs)
  - PR-Title: `data(mobilität-gruen-milieuschutz): annual refresh {year}`

**AC-8 (`.github/workflows/data-refresh-manual.yml` Manual-Trigger-Workflow — BRW/MSS/Mietspiegel/Lärm-Pakete):**

**Given** biennial/quadrennial/quinquennial Cadence-Buckets (selten, manuell)
**When** ich Manual-Workflow implementiere
**Then**:
  - Trigger: `workflow_dispatch` only mit Input-Parameter `bucket` (Enum: `biennial`, `quadrennial`, `quinquennial`, `ad-hoc`)
  - Pro Bucket: Fetch-Slugs-Liste hardcoded (Cadence-Matrix-Mapping aus ADR-016)
  - User-startet manuell via GitHub-UI „Run workflow" oder `gh workflow run data-refresh-manual.yml -f bucket=biennial`
  - Auto-PR analog zu anderen Workflows

**AC-9 (Diff-Compute-Script `scripts/compute-feature-diff.ts`):**

**Given** Diff-Threshold-Gating (>20% Feature-Loss) braucht Feature-Count-Vergleich
**When** ich `scripts/compute-feature-diff.ts` neu schreibe
**Then** Script:
  - Liest `static/layers/MANIFEST.json` (pre-fetch-State) + neu-fetched-MANIFEST (post-fetch)
  - Pro Layer-Slug: vergleicht `featureCount`-Wert
  - Berechnet Prozent-Loss: `(old - new) / old * 100`
  - Args: `pnpm exec tsx scripts/compute-feature-diff.ts <slug>` → gibt nur diesen Slug zurück
  - Exit-Output: numerischer Prozent-Wert (für GH-Actions `echo "feature_loss=$X" >> $GITHUB_OUTPUT`)
  - Test-Coverage: `scripts/compute-feature-diff.test.ts` (3 Cases: kein Diff → 0%, 50%-Loss → 50, kein Slug-Match → -1)
  - Edge-Case: neue Layer (kein Pre-State) → 0% (kein Loss)

**AC-10 (Snapshot-Test-Suite `scripts/snapshot/`):**

**Given** Aggregat-Pipeline (Story 2.0) produziert Score-Werte pro Bezirk + Kiez
**When** ich Snapshot-Tests implementiere
**Then**:
  - `scripts/snapshot/bezirk-scores.snapshot.json` (Initial-Baseline, committed) mit Map `{ bezirkSlug → score }`
  - `scripts/snapshot/snapshot-test.ts` (Vitest-Server-Test): liest Production-Postgres-Werte nach `data:aggregate`, vergleicht mit Snapshot-File, failt bei >10%-Sprung pro Bezirk
  - Snapshot-Update-Pfad: `pnpm snapshot:update` re-baselined die Snapshots (manueller Trigger nach Begründung)
  - Workflow-Step `pnpm test:unit -- scripts/snapshot` failed → PR-Label `data-refresh:requires-review` + Block-Auto-Merge

**AC-11 (Lefthook-Pre-Commit MANIFEST-Update-Check):**

**Given** Manuelle Daten-Pushs (Bypass Auto-Refresh) brauchen MANIFEST-Konsistenz
**When** ich `lefthook.yml` (aus Story 4.3) erweitere
**Then**:

```yaml
pre-commit:
  parallel: true
  commands:
    # ... existing lint/format/typecheck commands ...
    manifest-check:
      glob: 'static/layers/*.geojson'
      run: pnpm exec tsx scripts/check-manifest-consistency.ts {staged_files}
```

**And** `scripts/check-manifest-consistency.ts`: prüft dass jeder gestaged GeoJSON-File einen MANIFEST-Eintrag mit matching SHA-256-Hash hat
**And** Falls Diff: Hook failt mit Message „MANIFEST.json nicht aktualisiert nach Daten-Push. Run `pnpm data:fetch -- --only {slug}` und committe MANIFEST mit."

**AC-12 (Coolify-Deploy-Webhook nach Auto-Merge):**

**Given** Story 4.3 `deploy.yml` triggert Coolify-Webhook nach grünem CI auf Main
**When** ich Auto-Merge-Workflow analyse
**Then** Bestehender `deploy.yml`-Workflow läuft automatisch nach Auto-Merge auf Main (CI grün → Coolify-Webhook)
**And** Keine Erweiterung der `deploy.yml` nötig
**And** Auto-Refresh-PR muss CI-Gates (Story 4.3, 13 Gates) bestehen — Auto-Merge erst nach allen Gates grün
**And** GitHub-Repo-Setting: Auto-Merge enabled für PRs mit Label `data-refresh:auto`, NICHT für Label `data-refresh:requires-review`

**AC-13 (Smoke-Test-Suite + Doku):**

**Given** alle 8 Workflows implementiert
**When** ich Manual-Smoke-Test ausführe
**Then**:
  - `gh workflow run data-refresh-daily.yml` lokal triggern
  - Verify Workflow-Run im GitHub-UI grün
  - Verify Auto-PR erstellt mit korrekten Labels
  - Verify CI-Gates auf PR grün
  - Verify Auto-Merge bei Label `data-refresh:auto`
  - Verify Coolify-Webhook getriggert
**And** `docs/runbooks/data-refresh-troubleshooting.md` (NEU): häufige Failures + Fixes (Overpass-Rate-Limit, FIS-Broker-Outage, Postgres-Migration-Fail, Snapshot-Test-Drift)

## Tasks / Subtasks

- [ ] **Task 1: ADR-016 Update-Cadence schreiben (AC: #1)**
  - [ ] `docs/adr/ADR-016-update-cadence.md` neu mit Cadence-Matrix
  - [ ] Pro Datenquelle Cadence-Bucket + Cron-Expression + Begründung
  - [ ] Konsequenzen + Alternatives + Cross-Refs

- [ ] **Task 2: Diff-Compute-Script (AC: #9)**
  - [ ] `scripts/compute-feature-diff.ts` mit MANIFEST-Diff-Logic
  - [ ] `scripts/compute-feature-diff.test.ts` (3 Cases)
  - [ ] `pnpm test:unit -- scripts/compute-feature-diff` grün

- [ ] **Task 3: Snapshot-Test-Foundation (AC: #10)**
  - [ ] `scripts/snapshot/bezirk-scores.snapshot.json` Initial-Baseline aus aktuellem Production-State
  - [ ] `scripts/snapshot/snapshot-test.ts` mit Plausibilitäts-Check
  - [ ] `scripts/snapshot/update.ts` als Re-Baseline-Helper
  - [ ] `package.json` Script `"snapshot:update": "tsx scripts/snapshot/update.ts"`

- [ ] **Task 4: Daily-Workflow (AC: #2)**
  - [ ] `.github/workflows/data-refresh-daily.yml` (Code-Snippet AC-2)
  - [ ] `peter-evans/create-pull-request@v7` als Dep verifizieren
  - [ ] GitHub-Repo-Settings: Permissions `contents: write` + `pull-requests: write` für workflows

- [ ] **Task 5: Monthly-Workflow (AC: #3)**
  - [ ] `.github/workflows/data-refresh-monthly.yml`
  - [ ] ÖPNV-Index-Re-Build-Step ergänzen

- [ ] **Task 6: Quarterly-Workflow (AC: #4)**
  - [ ] `.github/workflows/data-refresh-quarterly.yml`
  - [ ] Denkmal-2024-Threshold-Override (30% statt 20%)

- [ ] **Task 7: Annual-Workflows Q1+Q2+Q3 (AC: #5, #6, #7)**
  - [ ] `data-refresh-annually-q1.yml` (Klima, Februar)
  - [ ] `data-refresh-annually-q2.yml` (Bildung+Sport, Mai)
  - [ ] `data-refresh-annually-q3.yml` (Mobilität+Grün+Milieuschutz, September)
  - [ ] DWD-Klima-Workflow-Timeout 60min

- [ ] **Task 8: Manual-Trigger-Workflow (AC: #8)**
  - [ ] `.github/workflows/data-refresh-manual.yml` mit `workflow_dispatch`-Input `bucket`
  - [ ] Bucket-Mapping zu Slugs (biennial/quadrennial/quinquennial/ad-hoc)

- [ ] **Task 9: Lefthook-Pre-Commit MANIFEST-Check (AC: #11)**
  - [ ] `lefthook.yml` Erweiterung (manifest-check Command)
  - [ ] `scripts/check-manifest-consistency.ts` mit SHA-256-Verify
  - [ ] Lokal-Test: Daten-File ohne MANIFEST-Update committen → Hook failt

- [ ] **Task 10: Auto-Merge-Config + Doku (AC: #12, #13)**
  - [ ] GitHub-Repo-Setting: Auto-Merge enabled (User-Action via Repo-Settings)
  - [ ] Branch-Protection: Label `data-refresh:auto` triggert Auto-Merge nach CI
  - [ ] Label `data-refresh:requires-review` blockt Auto-Merge
  - [ ] `docs/runbooks/data-refresh-troubleshooting.md` neu

- [ ] **Task 11: Smoke-Test (AC: #13)**
  - [ ] `gh workflow run data-refresh-daily.yml` Manual-Trigger
  - [ ] Auto-PR-Erstellung verifizieren
  - [ ] CI-Gates grün
  - [ ] Auto-Merge bei `data-refresh:auto`-Label
  - [ ] Coolify-Webhook-Trigger verifizieren

- [ ] **Task 12: Commit-Strategie**
  - [ ] Commits:
    1. `docs(adr): ADR-016 update-cadence (story 5.1 a)`
    2. `chore(scripts): compute-feature-diff + snapshot-tests foundation (story 5.1 b)`
    3. `chore(ci): 6 data-refresh workflows (daily/monthly/quarterly/annual-q1q2q3) (story 5.1 c)`
    4. `chore(ci): data-refresh manual-trigger workflow + lefthook manifest-check (story 5.1 d)`
    5. `docs(runbooks): data-refresh troubleshooting (story 5.1 e)`
  - [ ] Alle Commits ohne em-dashes

## Dev Notes

### Aktueller Stand (vor Story 5.1)

- **`scripts/lib/sources.ts`:** 42 aktive Layer + 4 DWD-Stations
- **`scripts/fetch-static.ts`:** unterstützt `--only`-Filter für Selective-Fetch (vermutlich, basierend auf Code-Analyse Line 192-204)
- **`scripts/lib/fetchers/`:** 5 Fetcher-Module (odis/fis-broker/overpass/dwd-cdc/tippecanoe)
- **`scripts/aggregate-data.ts`:** Story 2.0 fertig, befüllt Postgres-Aggregat
- **`MANIFEST.json`:** Provenance-Source-of-Truth (sourceUrl, fetchedAt, sourceUpdatedAt, sha256, featureCount)
- **`.github/workflows/`:** Story 4.3 implementiert `ci.yml` + `deploy.yml`. 5.1 ergänzt 8 weitere Data-Refresh-Workflows
- **`lefthook.yml`:** Story 4.3 implementiert pre-commit + pre-push. 5.1 ergänzt manifest-check
- **`peter-evans/create-pull-request@v7`:** MIT-Lizenz, EU-FOSS-konform (GitHub-Marketplace-trusted)

### Cadence-Matrix-Begründungen (Editorial-Notes)

**Daily (Stolpersteine):** OSM-Community-Driven, kleine Inkremente, niedrig-Risk. Täglich ist konservativ aber kostengünstig (~1 min GH-Actions/Tag).

**Monthly (ÖPNV):** BVG-Tarif-Wechsel typ. quartalsweise, aber Stops können adhoc verschoben werden. Monthly hat Headroom.

**Quarterly (Denkmal-2024):** Senatsdenkmalamt-Pattern. Mapshaper-Simplify-Loss-Risk → Threshold höher.

**Annually-Q1 (Februar — DWD-Klima):** DWD-CDC publiziert Annual-Files typischerweise Januar/Februar. 15. Februar gibt Buffer.

**Annually-Q2 (Mai — Bildung+Sport):** Schulamt-Datenbasis-Update pro Schuljahr, üblicherweise Mai aktualisiert.

**Annually-Q3 (September — Mobilität+Grün+Milieuschutz):** Bezirks-Verwaltungs-Daten und StEP-Update. September passt zu „Berlin-Verwaltungs-Jahres-Routine".

**Biennial (BRW + MSS):** Berliner-Gutachterausschuss + Senatsverwaltung. Cron `0 3 1 3 */2` triggert effektiv alle 2 Jahre im März.

**Quadrennial (Mietspiegel):** Cron-Expression deckt 4-Jahres-Zyklus nicht elegant ab → manueller Trigger ist sauber.

**Quinquennial (Lärm + Luft + Gruenversorgung + Umweltgerechtigkeit):** EU-Lärmrichtlinie 5-Jahres-Zyklus. Manueller Trigger ist OK.

**Ad-hoc (LOR/Bezirke/PLZ/Krankenhäuser):** Reform-getriebene Updates, selten (~Jahrzehnt). Manueller Trigger.

### Memory-Bezug

- **`feedback_no_em_dashes`:** ADR-016-Text + PR-Body-Templates ohne em-dashes
- **`project_server_purchase_sequencing`:** Coolify-Webhook trigger Coolify-Deploy nach Auto-Merge (Story 4.3 deploy.yml-Foundation)
- **`project_i18n_phase_1_de_only`:** ADR-016 in DE, Cadence-Tabelle-Header DE
- **`project_simplify_keep_shapes`:** Denkmal-Threshold-Erhöhung (Story 1.25 Pattern)

### Architektur-Constraints

**MUST-Rule-Mapping:**

- **Rule #2 (Files <500 Zeilen):** Workflow-YAMLs typisch <100 Zeilen
- **Rule #11 (Kein US-Drittanbieter):** `peter-evans/create-pull-request` ist MIT-FOSS aus UK. GitHub-Actions selbst ist US-gehostet, aber für Build-Toolchain als unvermeidbar akzeptiert (PRD-NFR-S7-Scope-Klärung: Production-Network-Requests, NICHT Dev-/Build-Tools)
- **Rule #12 (Provenance):** MANIFEST.json bleibt Source-of-Truth, fetchedAt + sourceUpdatedAt nach Refresh aktualisiert

**FR/NFR-Mapping:**

- **FR40 (Provenance pro Layer-Wert):** Aktualisierungs-Kadenz codifiziert
- **NFR-R1 (99% Uptime):** Auto-Refresh-Pipeline schützt vor manuell-vergessenen Updates
- **NFR-M2 (Doku-Konsistenz):** ADR-016 als Source-of-Truth

### Test-Strategie (ADR-012)

Story 5.1 ist **Infra-YAML (8 Workflows) + 2 CI-Scripts**. ADR-012 Exception: Infra-YAML smoke-level, CI-Scripts mit Test-First.

- **Vitest:** `compute-feature-diff.test.ts` (3 Cases) + `snapshot-test.ts` (Plausibility-Check) + `check-manifest-consistency.test.ts`
- **Smoke:** Manual-Trigger eines Workflows + Verify-Auto-PR + Verify-Auto-Merge-Pfad

### Previous Story Intelligence

- **Story 4.3:** GitHub-Actions-Foundation. `deploy.yml`-Workflow-Run-Trigger-Pattern reused für Auto-Merge → Deploy
- **Story 4.4:** ADR-Konvention (ADR-NNN-kebab-slug.md, Frontmatter-Standard)
- **Story 2.0:** `data:fetch` + `data:aggregate`-Foundation
- **Story 1.25:** Mapshaper-Sliver-Loss-Issue für Denkmal-Threshold-Anpassung

### File-List nach Story-Completion (erwartet)

**Modified:**

- `lefthook.yml` (+ manifest-check command)
- `package.json` (+ `snapshot:update`-Script)
- `docs/adr/ADR-016-update-cadence.md` (NEU, gehört aber zu doc/adr/-Pfad)

**New:**

- `docs/adr/ADR-016-update-cadence.md`
- `docs/runbooks/data-refresh-troubleshooting.md`
- `.github/workflows/data-refresh-daily.yml`
- `.github/workflows/data-refresh-monthly.yml`
- `.github/workflows/data-refresh-quarterly.yml`
- `.github/workflows/data-refresh-annually-q1.yml`
- `.github/workflows/data-refresh-annually-q2.yml`
- `.github/workflows/data-refresh-annually-q3.yml`
- `.github/workflows/data-refresh-manual.yml`
- `scripts/compute-feature-diff.ts`
- `scripts/compute-feature-diff.test.ts`
- `scripts/check-manifest-consistency.ts`
- `scripts/check-manifest-consistency.test.ts`
- `scripts/snapshot/bezirk-scores.snapshot.json`
- `scripts/snapshot/snapshot-test.ts`
- `scripts/snapshot/update.ts`

### Project Structure Notes

`.github/workflows/`-Naming-Convention `data-refresh-<bucket>.yml`. Konsistent zu `ci.yml` + `deploy.yml` (Story 4.3).

`scripts/snapshot/` als Sub-Folder für Plausibility-Tests, getrennt von Build-Pipeline-Scripts.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story 5.1` Zeilen 2162–2185] — Story-Definition
- [Source: `scripts/lib/sources.ts`] — Datenquellen-Inventar
- [Source: `scripts/fetch-static.ts`] — Pipeline-Foundation
- [Source: Story 4.3 File] — `ci.yml` + `deploy.yml` Pattern
- [Source: Story 4.4 File] — ADR-Konvention
- [Source: Story 2.0 File] — `data:fetch` + `data:aggregate`
- [Source: Story 1.25 File] — Mapshaper-Sliver-Loss
- [Source: GitHub-Actions Schedule https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule]
- [Source: peter-evans/create-pull-request https://github.com/peter-evans/create-pull-request]
- [Source: Memory `feedback_no_em_dashes`]
- [Source: Memory `project_server_purchase_sequencing`]
- [Source: Memory `project_simplify_keep_shapes`]

## Open Questions / Pre-Dev-Clarifications

1. **GitHub-Actions-Minuten-Budget:** Free-Tier 2.000 min/Monat. 8 Workflows × Frequency = geschätzt ~150-300 min/Monat (Daily 1 min × 30 + Monthly 5 min × 1 + andere selten). **Empfehlung:** im Budget, kein GitHub-Pro nötig Phase 1.

2. **Auto-Merge nur für `data-refresh:auto`-Label oder zusätzliche Conditions?** Recommendation: nur Label + 13 CI-Gates grün. Falls Beratungs-Asset-Drift sicherheits-relevant: zusätzliche Manual-Approval-Pflicht für annuals/quadrennials/quinquennials. **Empfehlung:** dailies+monthlies+quarterlies Auto-Merge, annuals+manuelle PR-Review.

3. **Snapshot-Baseline-Initial-State:** initial committeter Snapshot reflektiert aktuellen Production-State. Bei jedem Aggregat-Schema-Change (Story 2.0-Folge-Stories) Snapshot-Re-Baseline. **Empfehlung:** `pnpm snapshot:update` als manueller Trigger, Snapshot in Git committed.

4. **Jahres-Suffix-Slugs (z.B. `kitas-2024`, `wohnlagen-2024`):** beim Annual-Refresh ggf. Slug-Rename auf neues Jahr (`kitas-2025`). Workflow-Cron würde alten Slug refreshen. **Empfehlung:** Jahres-Suffix als Convention beibehalten, Annual-Refresh-Workflow muss vor Jahres-Wechsel Source-Update-PR vorbereiten (Manual-Step). Alternative: Slug-Versioning entfernen → Phase-2-Refactor.

5. **Auto-PR vs Direct-Commit-to-Main:** Direct-Commit wäre schneller, aber Review-frei und Risiko-höher. **Empfehlung:** Auto-PR mit Label-basierter Auto-Merge ist Best-of-Both — Reviewable + Automated.

## Dev Agent Record

### Agent Model Used

_(wird vom dev-agent ausgefüllt)_

### Debug Log References

### Completion Notes List

### File List

_(wird vom dev-agent ausgefüllt)_
