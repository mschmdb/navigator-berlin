# Story 5.8: Public-Update-Skill (Manual-Trigger Changelog-Draft-Generator)

Status: ready-for-dev

<!-- Created 2026-05-16 via bmad-create-story workflow (Mary, Business Analyst). Validation per checklist.md optional vor dev-story. -->

## Story

As a Solo-Maintainer / Site-Owner,
I want einen manuellen Claude-Code-Skill `/publish-update`, der aus einem Commit-Range Draft-Entries für `/updates` generiert ohne Internals (Env-Vars, Server-Pfade, interne Tools) zu leaken,
so that ich Changelog-Disziplin auf der `/updates`-Route halte, ohne manuelle Markdown-Datei-Disziplin gegenüber Story 2.13 zu pflegen, und vor jedem Public-Release ein Editorial-Gate steht.

## Probleme heute

1. Story 2.13 (review, merged) liefert die `/updates`-Pipeline (RSS + Atom + JSON-Feed + JSON-LD-`BlogPosting` + Sitemap), aber jeder Entry muss manuell als `_content/updates/YYYY-MM-DD-{slug}.md` mit Frontmatter und Body geschrieben werden. Memory `feedback_no_em_dashes`, `feedback_no_lebenswert` und der Maintainer-Runbook-Anti-Pattern-Block sind zusätzliche Stil-Disziplin pro Entry.
2. Solo-Maintainer-Realität (Cluster-A-Risiko, Knowledge-Decay-Argument aus Epic 7) sagt: manuelle Markdown-Disziplin driftet nach 6 Wochen. Wir haben 13 Stories Epic 2 + 10 Stories Epic 6 + Daten-Refresh-Cadence aus Story 5.1 vor uns, die alle `/updates`-würdig sind. Ohne Tooling-Hebel verfällt der Trail.
3. Auto-Doc-Skill aus Epic 7 Story 7.1 ist NICHT die Lösung: er ist intern-only (`docs/*.md`), darf auto-committen, kennt Secrets und Server-Internals. Public-Channel `/updates` braucht andere Trust-Boundary (anderer System-Prompt, Allowlist-Input, Editorial-Gate, kein Auto-Commit).
4. Brand-Risk-Asymmetrie: halluzinierter `docs/`-Eintrag = Maintainer-Ärger; halluzinierter `/updates/`-RSS-Item mit Server-Hostname oder Env-Var-Name im Body = öffentlicher Trust-Schaden + Compliance-Risk. Separation-of-Concerns erzwingt eigenen Skill.
5. Phase-1-DE-only-Lock (memory `project_i18n_phase_1_de_only`) verschiebt EN-Coverage in Phase 3, also Skill schreibt nur DE-Frontmatter-Felder. EN-Felder bleiben optional und werden vom Skill weggelassen (nicht leer-gestrichen, nicht halluziniert).

## Quellen

- Story 2.13 (review): `_bmad-output/implementation-artifacts/2-13-updates-route-rss-categories-jsonld.md` — Frontmatter-Schema-Source, 5-Category-Enum, Naming-Convention `YYYY-MM-DD-{slug}.md`, Maintainer-Runbook `docs/runbooks/add-update-entry.md`.
- Schema-Code: `src/lib/content/updates/frontmatter-schema.ts` — Valibot-Schema mit Pflicht-Feldern `title_de` (≤ 80), `summary_de` (≤ 160), `date` (`YYYY-MM-DD`), `category` (5er-Enum); Optional `tags` (max 8, lowercase-kebab-case), `lang`, `title_en`, `summary_en`.
- Story 5.1 (ready-for-dev): `_bmad-output/implementation-artifacts/5-1-update-cadence-adr-github-actions-schedule.md` — Update-Cadence-Buckets pro Datenquelle. 5.8 detektiert Auto-Refresh-PRs aus diesen Workflows als Kandidaten für `daten-update`-Category.
- ADR-012: `docs/adr/ADR-012-tdd-mandate.md` — Test-First-Pflicht für Business-Logic, Filter, Schema-Validation. Skill-Prompt-Engineering selbst bleibt Smoke-Level (kein Test pro Prompt-Variante).
- CLAUDE.md (Repo-Root + User-Global): no em-dashes (U+2014), `@lucide/svelte` (nicht lucide-svelte), Files < 500 LOC, kein Hardcoded ohne Rückfrage.
- Memory `feedback_no_em_dashes.md`: globaler em-dash-Bann; Skill-Output und Forbidden-Token-Lint enforcen.
- Memory `feedback_no_lebenswert.md`: Begriff „Lebenswert" NS-belastet, niemals in UI/Code/Doku; ersetzbar durch „Kiez-Score" / „Bezirks-Score" (siehe `project_kiez_score_naming`).
- Memory `feedback_no_toast.md`: Skill-Output verwendet inline-Feedback in Markdown-Body, nie Toast-Pattern-Referenzen.
- Memory `project_i18n_phase_1_de_only.md`: EN-Felder im Skill-Output Phase 1 weglassen.
- Memory `project_server_purchase_sequencing.md`: Coolify, Hetzner-Hostnames, CPX22 sind Internals → Forbidden-Tokens.
- Architecture MUST-Rules `_bmad-output/planning-artifacts/architecture.md#Enforcement-Guidelines`: #2 Files < 500 LOC, #6 keine WHAT-Comments, #7 TypeScript-strict, #14 i18n-First (nur falls Skill UI rendert — er rendert keine).
- Maintainer-Runbook `docs/runbooks/add-update-entry.md` Anti-Patterns: keine Personen-Biografien, keine Mietpreis-Werte (€/m²), kein Bezirks-Ranking-/Composite-Score-Trend in Body.
- Claude-Code-Skill-Konvention: SKILL.md im Skill-Root mit Frontmatter (`name`, `description`), Body als Anweisungs-Set für den Subagent. Slash-Invocation via `/publish-update`.
- Existierender Skill-Pattern als Referenz: `~/.claude/skills/codex-review/SKILL.md` (Frontmatter + Preflight + Context-Gathering + Subagent-Call).

## Phase-Kontext + Scope-Anpassung

**Hand-off von vorhergehenden Stories:**

- **Story 2.13 (review):** `/updates`-Route, Frontmatter-Schema, `parseFrontmatter()`-Valibot-Validator, Markdown-Sanitizer, Maintainer-Runbook, 5-Category-Enum sind alle vorhanden. Skill konsumiert Schema-Module direkt aus `src/lib/content/updates/`.
- **Story 5.1 (ready-for-dev):** Update-Cadence-Workflows erzeugen Auto-PRs mit Daten-Diff-Branches. Skill detektiert solche PRs/Branches als bevorzugte Kandidaten für `daten-update`-Entries (Heuristik via Branch-Naming-Pattern oder Commit-Subject-Prefix `data:`).
- **Epic 7 Story 7.1 (backlog):** NICHT abhängig. 5.8 läuft ohne Lefthook, ohne post-commit-Hook, ohne Auto-Commit. Manual-Trigger only.

**Phase-1-Pragmatik:**

- **Trigger-Modus: Manual only.** Phase-2-Auto-Hook (post-commit) ist NICHT-Goal dieser Story. Verschoben nach mind. 4-6 Wochen Skill-Stabilität.
- **DE-only Output.** EN-Frontmatter-Felder werden vom Skill weggelassen (Phase-3-EN-Coverage-Epic füllt sie später nach).
- **Editorial-Gate Hard-Lock.** Output landet ausschließlich in `_content/updates/_drafts/`. Kein Auto-Commit, kein Auto-PR. Owner reviewt manuell und verschiebt File per `git mv`.
- **One-Commit = One-Draft.** Skill aggregiert NICHT mehrere Commits in einen Entry. Wenn 7 Commits relevant sind, schreibt der Skill 7 Drafts. Owner merged oder verwirft manuell.

**Memory-Marker:** `feedback_no_em_dashes`, `feedback_no_lebenswert`, `feedback_no_toast`, `project_i18n_phase_1_de_only`, `project_server_purchase_sequencing`, `project_kiez_score_naming`.

## Acceptance Criteria

**AC-1 (Skill-Definition + SKILL.md):**

**Given** Claude-Code-Skill-Konvention (SKILL.md mit Frontmatter `name`, `description`)
**When** ich `.claude/skills/publish-update/SKILL.md` anlege
**Then** Datei enthält:
  - Frontmatter:
    ```yaml
    ---
    name: publish-update
    description: Manueller Changelog-Draft-Generator für /updates. Liest einen Commit-Range, klassifiziert relevante Commits, schreibt pro Commit eine Markdown-Draft-Datei nach _content/updates/_drafts/. Kein Auto-Commit, kein Auto-PR. Editorial-Gate beim Owner. Trigger via `/publish-update <commit-range>` oder `/publish-update --since=YYYY-MM-DD`.
    ---
    ```
  - Body-Sections:
    - **When to trigger** — explizit nur auf User-Invocation `/publish-update`. NICHT auto-trigger bei „lass uns einen Eintrag schreiben"-Konversation. Skill-Aufruf erfordert explizites Argument.
    - **Preflight checks** — Working-Tree clean (`git status --porcelain` leer), `_content/updates/_drafts/` existiert (sonst anlegen), Story-2.13-Schema-Module unter `src/lib/content/updates/` vorhanden (sonst bail).
    - **Argument parsing** — entweder Commit-Range (`HEAD~7..HEAD`, `<sha>..<sha>`), oder `--since=YYYY-MM-DD`, oder `--commit=<sha>` (Single-Commit). Default ohne Argument: letzte 24h (`--since=` heute minus 1 Tag).
    - **Allowlist-Filter** (siehe AC-3): Skill ignoriert Commits, deren Diff ausschließlich Files in der Denylist berührt.
    - **Per-Commit-Klassifizierungs-Schritt** — Subagent klassifiziert in 5-Category-Enum oder „skip".
    - **Draft-Generierung** — Skill schreibt `_content/updates/_drafts/{date}-{slug}.md` mit gültigem Frontmatter + Body.
    - **Forbidden-Token-Lint** (siehe AC-5): nach Body-Generierung läuft Lint, bei Verstoß wird Draft mit `_FAIL_`-Präfix geschrieben und Owner-Hinweis ausgegeben.
    - **Output-Report** — Skill berichtet pro Commit: Klassifizierung, Draft-Pfad ODER Skip-Grund.
  - Body-Sprache: deutsch (Konsistenz mit Project-Communication-Language), Code-Beispiele englisch.

**AC-2 (Argument-Parser + Commit-Range-Resolution):**

**Given** Skill braucht reproduzierbare Commit-Enumeration
**When** ich `scripts/publish-update/resolve-commit-range.ts` schreibe
**Then**:
  - Pure-Function `resolveCommitRange(args: string[]): { shas: string[]; mode: 'range' | 'since' | 'commit' | 'default' }`
  - Akzeptierte Patterns:
    - `<sha>..<sha>` → `git log --format=%H <sha>..<sha>` → SHAs als Array (neueste zuerst).
    - `--since=YYYY-MM-DD` → `git log --format=%H --since=<date>` → SHAs.
    - `--commit=<sha>` → `[sha]`.
    - kein Argument → Default `--since=` heute UTC minus 24h (UTC-Lock damit Tag-Wechsel deterministic, nicht lokalzeit-abhängig).
  - Validierung: SHAs existieren (`git cat-file -e <sha>` als Test), sonst klare Fehlermeldung.
  - Tests `resolve-commit-range.test.ts` mit Fixture-Repo (vitest-temp-Git-Init): Range, Since, Single, Default, Invalid-SHA.

**AC-3 (Allowlist-Filter pro Commit):**

**Given** Skill darf KEINE Internals-Diffs in Body schreiben
**When** ich `scripts/publish-update/filter-commit.ts` schreibe
**Then**:
  - Pure-Function `isPublicRelevant(sha: string): { relevant: boolean; reason: string; publicPaths: string[] }`
  - Algorithmus:
    1. `git show --name-only --format= <sha>` liefert geänderte Files.
    2. Filter gegen Allowlist:
       ```ts
       const ALLOWLIST_PATTERNS = [
         /^src\/routes\//,
         /^src\/lib\/components\//,
         /^src\/lib\/data\//,
         /^src\/lib\/seo\//,        // SEO-Generators sind Public-Surface
         /^src\/lib\/content\//,
         /^static\/layers\/MANIFEST\.json$/,
         /^_content\/updates\//,
         /^_content\/methodik\//,   // falls Methodik-Page eigenen Content hat
       ];
       ```
    3. Denylist-Override (immer ignoriert, auch wenn versehentlich in Allowlist):
       ```ts
       const DENYLIST_PATTERNS = [
         /^\.env/,
         /\.env\./,
         /^lefthook\.yml$/,
         /^coolify\.(yml|yaml|json)$/,
         /^docker-compose\.ya?ml$/,
         /^docs\/recovery\//,
         /^docs\/adr\/ADR-\d+/,     // ADRs sind intern, nicht /updates-würdig
         /^\.github\/workflows\//,
         /^scripts\/lib\/sources\.ts$/,  // Source-Liste ist intern; Daten-Refresh wird über MANIFEST detektiert
         /^_bmad-output\//,
         /^_bmad\//,
         /^\.claude\/skills\//,
       ];
       ```
    4. Commit ist relevant wenn mindestens 1 File Allowlist matcht UND kein File Denylist matcht.
    5. Sonderfall: Commit berührt sowohl Allowlist als auch Denylist → NICHT relevant (Mixed-Commit-Schutz). Owner muss aufsplitten.
    6. `reason` ist menschen-lesbar: `"alle Files denylist"`, `"mixed allowlist + denylist (Commit aufsplitten)"`, `"keine Allowlist-Match"`, `"allowlist-match: src/routes/(with-header)/updates/+page.svelte"`.
  - Tests `filter-commit.test.ts`:
    - Allowlist-only Commit → relevant.
    - Denylist-only Commit → NICHT relevant.
    - Mixed-Commit → NICHT relevant, reason erklärt Split-Pflicht.
    - Leerer Diff (Merge-Commit ohne Inhalt) → NICHT relevant.
    - `.env`-Add → NICHT relevant (auch wenn versehentlich allowlist matched).
    - `scripts/lib/sources.ts`-Edit → NICHT relevant.

**AC-4 (Subagent-Call mit System-Prompt-Lock):**

**Given** Skill nutzt Claude-CLI als Subagent für Klassifizierung + Body-Generierung
**When** ich `scripts/publish-update/invoke-classifier.ts` schreibe
**Then**:
  - Function-Signatur `classifyAndDraftCommit(input: { sha: string; diff: string; commitMessage: string; publicPaths: string[] }): Promise<DraftResult>`
  - DraftResult-Typ:
    ```ts
    type DraftResult =
      | { kind: 'skip'; reason: string }
      | {
          kind: 'draft';
          category: UpdateCategory;
          title_de: string;
          summary_de: string;
          tags: string[];
          body: string;
        };
    ```
  - Subagent-Aufruf via `claude --print --append-system-prompt "<PROMPT>"` (analog `codex-review`-Pattern).
  - **Diff-Truncation:** Wenn `git show <sha>` > 3000 Zeilen liefert, Diff wird auf `--name-only` + `git log -1 --format=%B <sha>` (Commit-Message) + erste 200 Zeilen pro geänderter Allowlist-Datei reduziert. Subagent kriegt klaren Hinweis im Input: „Commit ist groß, Klassifizierung basiert auf Filenamen + Commit-Message + Datei-Auszug." Halluzinations-Risk steigt, deshalb `tags`-Output bei großen Commits leer-default und Body-Header trägt `> Auto-Lint-Hinweis: Commit ist groß, bitte vor Promote besonders sorgfältig prüfen.`.
  - System-Prompt-Constraints (Lock im File `scripts/publish-update/system-prompt.txt`, Pure-Text):
    1. „Du bist ein Public-Changelog-Generator für navigator.berlin. Du schreibst NIE über Internals (Env-Vars, Server-Hostnames, Tooling-Namen, interne Tickets, ADRs, Commit-SHAs außer in Metadata)."
    2. „Du klassifizierst genau einen Commit in eine der 5 Kategorien: daten-update, feature, methodik, datenquelle, lizenz. Wenn unsicher: gib `skip` mit Begründung zurück."
    3. „Body-Sprache: deutsch, Plex-Serif-Brand-Tone, Bürger-Sprache, aktive Verben."
    4. „VERBOTEN im Body: em-dashes (—, U+2014), das Wort „Lebenswert", Engineering-Jargon, Marketing-Floskeln, Mietpreis-Werte in €/m², Bezirks-Rankings, Composite-Score-Trends, Personen-Biografien."
    5. „Body-Länge: 200-800 Wörter. Strukturiere mit Markdown-Headings `## Was sich ändert`, optional `## Quelle` (nur Public-Quelle), optional `## Wirkung im Atlas`."
    6. „Output strikt als JSON, NICHT als freier Text: `{ kind: 'skip' | 'draft', ... }`."
  - Schema-Validation des Subagent-Outputs via Valibot (`DraftResultSchema` in `scripts/publish-update/draft-result-schema.ts`). Schema-Verstoß → Skip + Warn-Log.
  - Frontmatter-Validation: Generierter `title_de`, `summary_de`, `category`, `tags` werden durch `parseFrontmatter()` aus `src/lib/content/updates/frontmatter-schema.ts` gefiltert. Schema-Verstoß → Draft mit `_FAIL_`-Präfix.
  - Tests `invoke-classifier.test.ts`: Mock-Subagent-Response für jede 5 Categories + Skip + Schema-Verstoß + JSON-Parse-Fail.

**AC-5 (Forbidden-Token-Lint):**

**Given** Defense-in-Depth gegen Subagent-Halluzinationen
**When** ich `scripts/publish-update/forbidden-tokens.ts` schreibe
**Then**:
  - Pure-Function `lintBody(body: string): { ok: boolean; violations: Array<{ token: string; line: number }> }`
  - Forbidden-Token-Patterns (Regex-Liste):
    ```ts
    const FORBIDDEN_PATTERNS: Array<{ name: string; regex: RegExp }> = [
      { name: 'em-dash', regex: /—/ },                                  // U+2014
      { name: 'lebenswert', regex: /\blebenswert\w*/i },               // memory feedback_no_lebenswert
      { name: 'env-var-uppercase', regex: /\b[A-Z][A-Z0-9_]{4,}_(KEY|TOKEN|SECRET|URL|HOST|PASSWORD)\b/ },
      { name: 'hetzner', regex: /\bhetzner\b|\bcpx\d+\b/i },           // memory project_server_purchase_sequencing
      { name: 'coolify', regex: /\bcoolify\b/i },
      { name: 'lefthook', regex: /\blefthook\b/i },
      { name: 'github-actions-internal', regex: /\.github\/workflows/ },
      { name: 'commit-sha', regex: /\b[0-9a-f]{7,40}\b/ },             // SHA-likes im Body
      { name: 'traefik', regex: /\btraefik\b/i },
      { name: 'crowdsec', regex: /\bcrowdsec\b/i },
      { name: 'postgres-internal', regex: /\bDATABASE_URL\b|\bDRIZZLE_/ },
      { name: 'docker', regex: /\bdocker-compose\b|\bdocker\.io\b/i },
      { name: 'absolute-fs-path', regex: /\/Users\/|\/home\/[^/\s)]+\/|C:\\\\Users\\\\/ },
      { name: 'mietpreis-eurom2', regex: /\d+[,.]?\d*\s*€\s*\/\s*m[²2]/ },  // Memo: Mietspiegel-Wert-Verbot
    ];
    ```
  - Function liefert ALLE Verstöße (kein early-exit) inkl. Zeilennummer.
  - Tests `forbidden-tokens.test.ts`: pro Pattern mind. 1 positiv + 1 negativ (Wort in unverdächtigem Kontext, z.B. „Funktion" matched nicht den env-var-Regex).

**AC-6 (Draft-Datei-Schreiben):**

**Given** Editorial-Gate-Pflicht: Drafts NIE direkt in `_content/updates/`
**When** ich `scripts/publish-update/write-draft.ts` schreibe
**Then**:
  - Pure-Function `writeDraft(input: { commitSha: string; commitDate: string; draft: DraftResult; lintResult: LintResult }): { path: string; ok: boolean }`
  - Pfad-Konvention: `_content/updates/_drafts/{YYYY-MM-DD}-{slug}.md`
    - `YYYY-MM-DD` = Author-Date des Commits (`git show -s --format=%aI <sha>`, Date-Anteil only).
    - `{slug}` = `slugify(title_de)` mit lowercase-kebab-case, ASCII-only, max 60 Zeichen, deterministic (kein Random-Suffix). Slug-Kollision → Anhang `-{kurz-sha-6}`.
    - **Unicode-Transliteration-Tabelle (Lock):** `ä → ae`, `ö → oe`, `ü → ue`, `ß → ss`, `Ä → ae`, `Ö → oe`, `Ü → ue`. Restliche Non-ASCII → strip. Whitespace + Sonderzeichen → `-`. Multiple `-` collapsed zu einem. Leading/Trailing `-` getrimmt.
  - Bei `lintResult.ok === false`: Datei-Präfix `_FAIL_` (z.B. `_FAIL_2026-05-20-mietspiegel-refresh.md`), Body bekommt Markdown-Header
    ```
    > **Lint-Verstoß — vor Promote bearbeiten.**
    >
    > {Liste der Verstöße mit Zeilennummer}
    ```
  - Datei wird ATOMIC geschrieben: `fs.writeFile(target + '.tmp', content)` + `fs.rename(target + '.tmp', target)`. Kein Halb-Zustand. POSIX-rename-atomicity gilt innerhalb gleichem Filesystem (Drafts-Folder).
  - `_content/updates/_drafts/.gitignore` enthält `*` und `!.gitignore` (Drafts NICHT versioniert; Owner promotet via `git mv` aus `_drafts/` raus, dann committet). Begründung: Drafts sind Arbeits-Material, nicht History-Asset.
  - Tests `write-draft.test.ts` (mit `tmpdir`): Slug-Generation deterministic, Slug-Kollision-Suffix, `_FAIL_`-Präfix, Atomicity (kein Halb-File bei Fehler).

**AC-7 (Editorial-Gate + Maintainer-Runbook-Update):**

**Given** Owner muss verstehen wie Drafts aus `_drafts/` rausgehen
**When** ich `docs/runbooks/publish-update-skill.md` (NEU) und `docs/runbooks/add-update-entry.md` (UPDATE) editiere
**Then**:
  - Neues Runbook `docs/runbooks/publish-update-skill.md`:
    - **Voraussetzung:** Working-Tree clean, Story 2.13 deployt.
    - **Trigger:**
      ```bash
      claude /publish-update HEAD~7..HEAD
      # oder
      claude /publish-update --since=2026-05-09
      # oder
      claude /publish-update --commit=abc1234
      ```
    - **Review-Schritt:**
      1. Drafts in `_content/updates/_drafts/` öffnen.
      2. `_FAIL_*.md`-Drafts manuell korrigieren oder verwerfen.
      3. Verbleibende Drafts inhaltlich prüfen (Brand-Tone, Faktentreue, keine versteckten Leaks).
      4. Promote via `git mv _content/updates/_drafts/2026-05-20-foo.md _content/updates/2026-05-20-foo.md`.
      5. `pnpm dev` lokal verifizieren.
      6. Commit + Push wie in `add-update-entry.md` Schritt 5-6.
    - **Bei Lint-Verstoß:** `_FAIL_`-Datei umbenennen oder verwerfen, NICHT promoten.
    - **Anti-Patterns:** Drafts nicht direkt nach `_content/updates/` committen ohne Review.
  - Update `docs/runbooks/add-update-entry.md`: Ergänze Section „Skill-Workflow-Alternative" mit Verweis auf neuen Runbook + Hinweis dass Manual-Workflow weiterhin gültig bleibt.

**AC-8 (CLI-Entry + Wiring):**

**Given** Skill-SKILL.md ruft eine ausführbare TypeScript-Pipeline auf
**When** ich `scripts/publish-update/main.ts` schreibe
**Then**:
  - Entry-Function `main(argv: string[]): Promise<{ exitCode: number; reportLines: string[] }>`
  - Schritte:
    1. Preflight (Working-Tree clean, Drafts-Folder existiert).
    2. `resolveCommitRange(argv)` (AC-2).
    3. Pro SHA: `isPublicRelevant(sha)` (AC-3). Skip → Report-Line, weiter.
    4. Pro relevanter SHA: `git show <sha>` als Diff-Input, `classifyAndDraftCommit()` (AC-4). Skip → Report-Line.
    5. Pro Draft: `lintBody()` (AC-5), `writeDraft()` (AC-6).
    6. Report-Lines pro Commit + Summary (X Drafts geschrieben, Y geskipped, Z mit Lint-Verstoß als `_FAIL_`).
  - Exit-Code: 0 wenn pipeline durchläuft (auch bei Skips/Lint-Verstößen), 1 bei Preflight-Fail oder unerwartetem Error.
  - SKILL.md Body verweist auf `scripts/publish-update/main.ts` und beschreibt, wie der Subagent es invoked (via `Bash`-Tool mit klarem Command-Pattern).
  - Optional: `package.json`-Script `"publish-update": "tsx scripts/publish-update/main.ts"` für lokale CLI-Tests ohne Skill-Aufruf.

**AC-9 (TDD-Pflicht + Test-Coverage):**

**Given** ADR-012 TDD-Mandat
**When** ich Story 5.8 implementiere
**Then**:
  - **Test-First für Business-Logic** (alle Pure-Functions): `resolve-commit-range`, `filter-commit`, `forbidden-tokens`, `write-draft`, `draft-result-schema`, `slugify`.
  - **Test-First für API-Boundaries** (Subagent-Call): `invoke-classifier` mit Mock-Subagent-Response.
  - **Smoke-Level für Skill-Prompt-Datei** (`system-prompt.txt`): kein TDD pro Prompt-Variante, aber ein End-to-End-Manual-Smoke-Run mit echtem `claude --print`-Aufruf gegen Test-Fixture-Commit ist im Hand-off dokumentiert.
  - Tests laufen in `vitest` mit Server-Project-Config (kein Browser-Mode, keine Svelte-Komponenten in diesem Skill).
  - Coverage-Ziel: ≥ 90% für `scripts/publish-update/` (Logic-heavy + kein UI).
  - Failing-then-passing-History pro AC im Commit-Log nachvollziehbar.

**AC-10 (Allowlist-Pflege-Doku + Forbidden-Tokens-Pflege-Doku):**

**Given** Allowlist und Forbidden-Tokens sind Lebewesen, nicht Einmal-Setup
**When** ich `scripts/publish-update/README.md` schreibe
**Then**:
  - Section „Allowlist erweitern" — Workflow: neue Route oder neue `src/lib/seo/`-Source dazu = Allowlist-Pattern ergänzen + Test ergänzen.
  - Section „Forbidden-Token ergänzen" — Workflow: nach jedem Subagent-Halluzinations-Fall wird neuer Pattern ergänzt + Test geschrieben. Anti-Drift-Routine.
  - Section „Wann NICHT" — Skill nicht für Marketing-Posts, nicht für Methodik-ADRs (die haben eigene Pages), nicht für Release-Notes mit Versionsnummern (siehe `add-update-entry.md` Anti-Patterns).

## Tasks / Subtasks

- [ ] **T1: Setup `scripts/publish-update/`-Verzeichnis + Test-Foundation** (AC: 1, 9)
  - [ ] T1.1: `scripts/publish-update/` anlegen mit `README.md`-Stub.
  - [ ] T1.2: `scripts/publish-update/types.ts` mit `DraftResult`, `LintViolation`, `LintResult`, `CommitRangeResolution`-Typen.
  - [ ] T1.3: Vitest-Config-Check: ensure `scripts/**/*.test.ts` läuft im Server-Project (kein Browser).
  - [ ] T1.4: Test-Fixture-Helper `scripts/publish-update/__test__/fixtures.ts` (Mock-Git-Repo-Init, Mock-Subagent-Responses).

- [ ] **T2: Commit-Range-Resolver** (AC: 2, 9)
  - [ ] T2.1: Failing-Test `resolve-commit-range.test.ts` (Range + Since + Single + Default + Invalid-SHA).
  - [ ] T2.2: `resolve-commit-range.ts` implementieren (Pure + git-CLI-Wrapper).
  - [ ] T2.3: Tests grün.

- [ ] **T3: Allowlist-Filter** (AC: 3, 9)
  - [ ] T3.1: Failing-Test `filter-commit.test.ts` (allowlist-only, denylist-only, mixed, empty, .env-add, sources.ts-edit).
  - [ ] T3.2: `filter-commit.ts` mit ALLOWLIST_PATTERNS + DENYLIST_PATTERNS + Mixed-Schutz.
  - [ ] T3.3: Tests grün.

- [ ] **T4: Forbidden-Token-Linter** (AC: 5, 9)
  - [ ] T4.1: Failing-Test `forbidden-tokens.test.ts` pro Pattern (em-dash, lebenswert, env-var, hetzner, coolify, lefthook, gh-actions, sha, traefik, crowdsec, postgres, docker, fs-path, mietpreis).
  - [ ] T4.2: `forbidden-tokens.ts` mit Patterns + Line-Nr-Tracking.
  - [ ] T4.3: Tests grün, alle false-positive-cases auch grün (e.g. „Funktion" matched env-var-Pattern NICHT).

- [ ] **T5: Slug-Generator + Draft-Writer** (AC: 6, 9)
  - [ ] T5.1: Failing-Test `slugify.test.ts` (Umlaute, Sonderzeichen, ≤ 60 Zeichen, deterministic).
  - [ ] T5.2: `slugify.ts` implementieren (oder Existenz-Check `src/lib/utils/`).
  - [ ] T5.3: Failing-Test `write-draft.test.ts` (tmpdir + Slug-Kollision + `_FAIL_`-Präfix + Atomicity).
  - [ ] T5.4: `write-draft.ts` implementieren mit `fs.rename`-Atomic-Pattern.
  - [ ] T5.5: `_content/updates/_drafts/.gitignore` anlegen (`*` + `!.gitignore`).
  - [ ] T5.6: Tests grün.

- [ ] **T6: Draft-Result-Schema + Subagent-Caller** (AC: 4, 9)
  - [ ] T6.1: Failing-Test `draft-result-schema.test.ts` (Valibot-Schema: skip, draft-pro-Category, invalid-Category, missing-Field).
  - [ ] T6.2: `draft-result-schema.ts` implementieren.
  - [ ] T6.3: Failing-Test `invoke-classifier.test.ts` mit Mock-Subagent (echte CLI nicht gefeuert).
  - [ ] T6.4: `invoke-classifier.ts` implementieren als Wrapper über `claude --print --append-system-prompt`.
  - [ ] T6.5: `system-prompt.txt` schreiben mit 6 Constraints aus AC-4.
  - [ ] T6.6: Tests grün.

- [ ] **T7: Main-Entry + Wiring + CLI** (AC: 8, 9)
  - [ ] T7.1: Failing-Test `main.test.ts` mit gemockten Sub-Modulen (Preflight-Pass, 3 Commits: 1 skip, 1 draft, 1 lint-fail).
  - [ ] T7.2: `main.ts` implementieren mit Schritt-Sequenz aus AC-8.
  - [ ] T7.3: Optional: `package.json`-Script `publish-update`.
  - [ ] T7.4: Tests grün.

- [ ] **T8: SKILL.md + Doku** (AC: 1, 7, 10)
  - [ ] T8.1: `.claude/skills/publish-update/SKILL.md` mit Frontmatter + Body (Preflight + Argument-Pattern + Subagent-Call-Anweisung).
  - [ ] T8.2: `docs/runbooks/publish-update-skill.md` neu (Trigger + Review-Schritt + Anti-Patterns).
  - [ ] T8.3: `docs/runbooks/add-update-entry.md` updaten („Skill-Workflow-Alternative"-Section).
  - [ ] T8.4: `scripts/publish-update/README.md` mit Allowlist-/Forbidden-Token-Pflege-Doku.

- [ ] **T9: End-to-End-Smoke** (Hand-off zu Owner)
  - [ ] T9.1: Owner ruft `claude /publish-update --commit=<test-sha>` gegen einen echten Story-2.13-Commit. Verifiziert: Draft landet in `_drafts/`, kein `_FAIL_`-Präfix bei sauberem Test-Commit, Frontmatter parsed durch `parseFrontmatter()`.
  - [ ] T9.2: Owner ruft `claude /publish-update --commit=<sha-mit-env-add>` (Test-Commit der `.env`-Update enthält). Verifiziert: Skill skipped, kein Draft geschrieben.
  - [ ] T9.3: Owner ruft Skill mit Halluzinations-Triggernem Commit (z.B. einer der Coolify-Config-Edit erwähnt im Subject). Verifiziert: entweder skip, oder `_FAIL_`-Draft.

- [ ] **T10: Final-Verifikation** (AC: 1-10)
  - [ ] T10.1: `pnpm test scripts/publish-update` 100% grün.
  - [ ] T10.2: `pnpm check` 0 Errors.
  - [ ] T10.3: Sprint-Status `5-8-public-update-skill`: `ready-for-dev → in-progress → review`.

## Dev Notes

### Architektur-Entscheidungen

**Separation zwischen Story 7.1 (Auto-Doc-Skill) und Story 5.8 (Public-Update-Skill).**

- Story 7.1: post-commit-Hook, schreibt `docs/*.md`, kennt Secrets und Server-Internals, darf auto-committen. Trust-Boundary: hoch (Owner-Repo, Owner-Audience).
- Story 5.8: Manual-Trigger, schreibt `_content/updates/_drafts/`, sieht nur Allowlist-Paths, KEIN Auto-Commit. Trust-Boundary: niedrig (Public-Audience, Brand-Risk).
- Beide Skills teilen sich KEIN System-Prompt, KEIN Trust-Level, KEIN Output-Target. Separation-of-Concerns ist Hard-Lock.

**Allowlist > Denylist Begründung.**

Denylists vergessen immer was. Wenn Skill auf 200 zukünftige File-Patterns reagieren muss, ist Whitelist (Allowlist) sicherer: alles was nicht explizit erlaubt ist, wird ignoriert. Denylist-Patterns sind nur ZUSÄTZLICHE Sicherheit gegen Allowlist-Lücken (Belt-and-Braces).

**Mixed-Commit-Schutz.**

Wenn ein Commit sowohl Allowlist- als auch Denylist-Files berührt, wird er als NICHT relevant markiert. Begründung: Subagent könnte den Allowlist-Anteil korrekt klassifizieren, aber die Denylist-Internals als „Kontext" in den Body schmuggeln. Owner soll solche Mixed-Commits aufsplitten bevor Skill läuft. Klare Fehlermeldung statt Halluzinations-Risiko.

**Draft-Folder ist `.gitignore`d.**

Drafts sind Arbeits-Material. Wenn sie versioniert werden, ist die Versuchung groß, Drafts zu committen ohne Review (Auto-Lint-Bypass via Force-Push, Confirmation-Bias). `.gitignore *` macht den Promote-Step (`git mv` aus `_drafts/` raus) zur bewussten Owner-Handlung.

**Subagent-Call statt eigene LLM-Logic.**

Skill ruft `claude --print --append-system-prompt` als Subagent (gleiches Pattern wie `codex-review` und das in Story 7.1 geplante Auto-Doc-Pattern). Begründung: kein API-Key-Management, kein Token-Counting-Code, kein Provider-Switch. Trust auf Claude-CLI-Pipeline.

**Forbidden-Token-Lint als Defense-in-Depth.**

System-Prompt sagt „nie em-dashes". Lint sagt nochmal „nie em-dashes". Doppelt hält besser. LLM-Output ist nicht-deterministisch; Lint ist deterministic.

### File-Layout

```
.claude/
└── skills/
    └── publish-update/
        └── SKILL.md                                  (Frontmatter + Body, Skill-Definition)

scripts/
└── publish-update/
    ├── README.md                                     (Allowlist-/Forbidden-Pflege-Doku)
    ├── main.ts                                       (Entry, orchestriert Schritte)
    ├── resolve-commit-range.ts                       (git-CLI-Wrapper)
    ├── resolve-commit-range.test.ts
    ├── filter-commit.ts                              (Allowlist + Denylist + Mixed-Schutz)
    ├── filter-commit.test.ts
    ├── invoke-classifier.ts                          (Subagent-Call-Wrapper)
    ├── invoke-classifier.test.ts
    ├── system-prompt.txt                             (System-Prompt-Lock, Plain-Text)
    ├── draft-result-schema.ts                        (Valibot-Schema für Subagent-Output)
    ├── draft-result-schema.test.ts
    ├── forbidden-tokens.ts                           (Lint mit Regex-Liste)
    ├── forbidden-tokens.test.ts
    ├── slugify.ts                                    (oder Re-Use aus `src/lib/utils/`)
    ├── slugify.test.ts
    ├── write-draft.ts                                (Datei-Write atomic + `_FAIL_`-Präfix)
    ├── write-draft.test.ts
    ├── types.ts
    ├── main.test.ts
    └── __test__/
        └── fixtures.ts                               (Mock-Git-Repo-Helper + Mock-Subagent)

_content/
└── updates/
    └── _drafts/
        ├── .gitignore                                (* + !.gitignore)
        └── (Draft-Files, nicht versioniert)

docs/
└── runbooks/
    ├── add-update-entry.md                           (UPDATE: Skill-Alternative-Section)
    └── publish-update-skill.md                       (NEU: Skill-Trigger + Review-Workflow)
```

### Cross-Story-Dependencies + Sequencing

| Story | Status | Auswirkung |
|-------|--------|------------|
| 2.13 | review (merged) | Frontmatter-Schema + 5-Category-Enum + Maintainer-Runbook + `parseFrontmatter()` direkt konsumiert. |
| 5.1 | ready-for-dev | Update-Cadence-Workflows produzieren Auto-Refresh-PRs. Skill-Klassifizierer kann Commit-Subject-Prefix (`data:` o.ä.) als Hint für `daten-update`-Category nutzen. Soft-Block, kein Hard-Block. |
| 5.2-5.7 | backlog | Kein direkter Conflict. |
| 7.1 (Auto-Doc-Skill) | backlog | NICHT abhängig. Beide Skills sind orthogonal. 5.8 kann vor 7.1 landen. |
| 7.2-7.6 | backlog | Kein Conflict. |

**Empfehlung:** Story 5.8 startet wenn Story 5.1 ready-for-dev → in-progress übergeht, ODER unabhängig sobald Owner Kapazität hat. Hard-Foundation ist nur 2.13 (gegeben).

### MUST-Rules-Anwendung (Architecture-Enforcement)

- **#2 Files < 500 LOC:** alle Module split-fähig. `main.ts` orchestriert, Logik in 6 Sub-Modulen.
- **#3 Bestehende Funktionen reuse:** `parseFrontmatter()` aus `src/lib/content/updates/frontmatter-schema.ts`. Slugify ggf. aus `src/lib/utils/` (vorher Check).
- **#6 Keine WHAT-Comments:** Pure-Functions selbsterklärend, Comments nur für nicht-offensichtliche WHY (z.B. „Mixed-Commit blockt um Halluzinations-Risiko zu schließen").
- **#7 TypeScript strict:** kein `any`, alle Schemas typed, `DraftResult` als discriminated union.
- **#11 Kein US-Drittanbieter:** Skill nutzt nur Claude-CLI (Anthropic), keine US-Cloud-Services für Klassifizierung.
- **#21 prerender etc.:** nicht anwendbar (Skill ist Build-Time-CLI, keine SvelteKit-Route).

### Risk-Register (für Owner-Review)

| Risk | Mitigation |
|------|-----------|
| Subagent halluziniert Server-Hostname im Body | Forbidden-Token-Lint (hetzner, coolify, traefik, crowdsec), `_FAIL_`-Präfix erzwingt manuellen Eingriff. |
| Allowlist-Lücke lässt `.env`-Add durch | Mixed-Commit-Schutz blockt auch wenn Allowlist-File daneben liegt. Denylist als 2. Sicherheitsnetz. |
| Owner promoted ohne Review | `_drafts/` ist `.gitignore`d → `git mv` ist explizite Handlung → kein versehentliches Auto-Commit. |
| Slug-Kollision bei zwei Updates am gleichen Tag mit gleichem Titel | Kurz-SHA-Suffix in Slug, deterministic. |
| Subagent gibt JSON-Schrott zurück | Valibot-Schema-Validation → Skip + Warn-Log, kein File-Write. |
| Skill drifted weil Allowlist nicht gepflegt | `scripts/publish-update/README.md` dokumentiert Pflege-Workflow. Pflege bei neuer Route-Family Pflicht (Review-Lint-Check). |
| Forbidden-Token-Pattern produziert false-positive (z.B. „Funktion" matched env-var-Regex) | Test-Pflicht pro Pattern: positiv + negativ. Pattern-Anpassung wenn false-positive in Production. |
| Verworfene Drafts werden nie gelöscht und vermüllen `_drafts/` | Owner-Disziplin. Optional Phase-2: `pnpm publish-update --clean` löscht alle Drafts > 30 Tage alt. |

### Open-Questions vor Dev-Start

1. **Subagent-Modell-Wahl:** Default `claude --print` nutzt den im CLI konfigurierten Default. Reicht Sonnet/Haiku für Klassifizierung + Body-Generierung, oder soll Skill explizit Opus pinnen? **Default-Decision:** kein Pin in System-Prompt → CLI-Default. Owner-Override via Env-Var-Flag falls Output-Qualität schwankt.

2. **Subagent-Antwort-Timeout:** Wenn `claude --print` lange hängt (Long-Body-Generierung), wie lange warten? **Default-Decision:** 90 Sekunden, dann Skip mit Timeout-Reason. Konfigurierbar via `--timeout-seconds=N`-Flag.

3. **Commit-Aggregation: 1 Commit = 1 Draft (Lock) oder Multi-Commit-Aggregation?** **Default-Decision:** 1 Commit = 1 Draft Phase 1 (Memory-Lock aus Brief). Multi-Commit-Aggregation als Phase-2-Optional, wenn Owner-Realität zeigt dass viele kleine Commits zu Spam-Drafts führen.

4. **Slug-Generator: eigenes oder Reuse?** Vorher `src/lib/utils/`-Check ob `slugify` schon existiert. Falls ja, reuse. Falls nein, neu schreiben mit Unicode-Normalisierung (Umlaute → ae/oe/ue, ß → ss, alles andere transliterated oder gestrippt).

5. **Markdown-Body-Sanitization vor Write?** Story 2.13 hat `markdown-sanitizer.ts` für Render-Zeit. Hier könnten wir denselben Sanitizer pre-emptiv im Write-Pfad anwenden. **Default-Decision:** NEIN, sanitization passiert beim Render (Story 2.13). Skill-Output bleibt Markdown-Quelle. Forbidden-Token-Lint deckt Brand-Risk ab.

6. **Allowlist-Pflege bei neuer Route-Family.** Wer pflegt? **Default-Decision:** Owner. Lint-Check in CI optional Phase 2 (wenn neuer Route-Pfad nicht in Allowlist auftaucht, Warn).

7. **Skill-Output bei 0 relevanten Commits:** Stil-Frage. Soll Skill „nichts gefunden, alles gut" reporten oder still beenden? **Default-Decision:** Report ausgeben („0 Drafts, alle Commits geskipped — Gründe: ..."), kein silentes Beenden. Transparenz > Knappheit.

8. **`.claude/skills/publish-update/SKILL.md` Body — auf welcher Detail-Stufe?** Subagent-System-Prompt ist separat in `scripts/publish-update/system-prompt.txt`. SKILL.md beschreibt nur „wann triggern" + „wie Argumente parsen" + „CLI-Aufruf" (analog `codex-review/SKILL.md`-Pattern). Body-Länge ~80-150 Zeilen.

### References

- Story 2.13: `_bmad-output/implementation-artifacts/2-13-updates-route-rss-categories-jsonld.md` (Schema-Source, Maintainer-Runbook)
- Story 5.1: `_bmad-output/implementation-artifacts/5-1-update-cadence-adr-github-actions-schedule.md` (Auto-Refresh-PR-Heuristik)
- ADR-012: `docs/adr/ADR-012-tdd-mandate.md` (Test-First-Pflicht)
- Architecture Enforcement: `_bmad-output/planning-artifacts/architecture.md#Enforcement-Guidelines` (21 MUST-Rules)
- CLAUDE.md (Repo + User-Global): no em-dashes, @lucide/svelte, Files < 500
- Maintainer-Runbook: `docs/runbooks/add-update-entry.md` (Anti-Patterns)
- Skill-Pattern-Referenz: `~/.claude/skills/codex-review/SKILL.md` (Frontmatter + Preflight-Pattern)
- Frontmatter-Schema: `src/lib/content/updates/frontmatter-schema.ts`
- Memory-Set: `feedback_no_em_dashes`, `feedback_no_lebenswert`, `feedback_no_toast`, `project_i18n_phase_1_de_only`, `project_server_purchase_sequencing`, `project_kiez_score_naming`

## Dev Agent Record

### Agent Model Used

_To be filled by dev-story agent._

### Debug Log References

_To be filled by dev-story agent._

### Completion Notes List

_To be filled by dev-story agent._

### File List

_To be filled by dev-story agent._

### Change Log

| Datum | Status | Notiz |
|---|---|---|
| 2026-05-16 | backlog → ready-for-dev | Story authored via `bmad-create-story` (Mary, Business-Analyst-Agent). Schema-Source aus Story 2.13 referenziert, 5-Category-Enum gelocked, Editorial-Gate + Allowlist + Forbidden-Tokens spezifiziert. Phase-1 Manual-Trigger only, Phase-2 Auto-Hook non-goal. |
