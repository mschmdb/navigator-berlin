---
type: architecture
audience: both
last-verified: 2026-05-17
related:
  - docs/INDEX.md
  - docs/pipelines/data-flow.md
---

# Story-Map

Auto-generiert via `pnpm doc:story-map` aus `_bmad-output/implementation-artifacts/sprint-status.yaml`. Stand: 2026-05-17.

**80 Stories total**: ✅ 56 done · 🚧 0 in-progress · 📋 7 ready-for-dev · ⏳ 11 backlog · ▫️ 6 other

## Pro Epic
### Epic 1

| Story | Status | Kommentar |
|---|---|---|
| `1-1-repository-initialisierung-mit-stack-foundation` | ✅ done | — |
| `1-2-design-token-foundation-mit-cloud-dancer-plex` | ✅ done | — |
| `1-3-build-zeit-daten-pipeline-mit-manifest` | ✅ done | — |
| `1-4-daten-zugriffs-abstraktion` | ✅ done | — |
| `1-5-adress-suche-mit-geocoding-proxy` | ✅ done | — |
| `1-6-maplibre-plex-cartography-mit-glyph-pack` | ✅ done | — |
| `1-7-karten-interaktion-url-state-sync` | ✅ done | — |
| `1-8-karten-accessibility-layer` | ✅ done | — |
| `1-9-inspektor-panel-mit-layer-hits` | ✅ done | — |
| `1-10-layer-toggle-palette` | ✅ done | — |
| `1-10c-pmtiles-pipeline` | ✅ done | — |
| `1-10d-mietspiegel-preis-lookup` | ✅ done | — |
| `1-11-klima-heritage-visualisierung` | ✅ done | — |
| `1-12-editorial-verantwortung-pattern` | ✅ done | — |
| `1-13-sbahn-netz` | ✅ done | — |
| `1-14-multi-layer-diff` | ✅ done | — |
| `1-15-poi-popover-lucide-icons` | ✅ done | — |
| `1-16-layer-explain-coverage` | ✅ done | — |
| `1-17-climate-charts-layerchart-rework` | ✅ done | — |
| `1-18-inspector-ux-rework` | ✅ done | — |
| `1-19-naechste-oepnv-stops` | ✅ done | — |
| `1-20-share-sheet-og-card` | ✅ done | — |
| `1-21-mobility-soft-cutoff` | ✅ done | — |
| `1-22-skala-harmonisierung-gruenversorgung` | ✅ done | — |
| `1-23-datenfehlt-reason-aufdroeseln` | ✅ done | — |
| `1-24-klima-normalperioden-ui` | ✅ done | — |
| `1-25-klima-pet-2022-coverage-bug` | ✅ done | — |
| `1-26-adress-bookmarks-localstorage` | ✅ done | — |
| `1-27-adress-vergleich` | ✅ done | — |
| `1-28-livability-index` | ✅ done | — |
| `1-29-atlas-methodik-pattern` | ✅ done | — |
| `1-30-mss-soziale-stadtentwicklung` | ✅ done | — |
| `1-31-atlas-ui-ux-polish` | ✅ done | — |

### Epic 2

| Story | Status | Kommentar |
|---|---|---|
| `2-0-postgres-aggregat-foundation-drizzle-build-step` | ✅ done | — |
| `2-1-seo-foundation-sitemap-canonical-robots-txt` | ✅ done | — |
| `2-2-json-ld-generator-bibliothek` | ✅ done | — |
| `2-3-bezirks-pages-prerendered` | ✅ done | 2026-05-16 wave-4: 12 prerendered DE-only routes; MapEmbed entfernt per User-Decision (siehe 2-3-followup-fixes-Comment) |
| `2-4-kiez-pages-prerendered` | ✅ done | 2026-05-16 wave-5: 143 prerendered DE-only routes, Variante A LOR-Bezirksregion (siehe 2-4-Wave-5-Comment) |
| `2-5a-layer-page-en-variante-dataset-jsonld` | ✅ done | scope-reduced 2026-05-16: DE-only refactor + authority centralization; EN-coverage deferred phase-3 |
| `2-5b-faq-section-template-daten-slots` | ✅ done | 2026-05-16 wave-4: 5 Cluster DE-only + render-faq + faq-section (siehe 2-5b-Wave-4-Comment) |
| `2-6-og-image-pipeline-bezirk-kiez-layer` | ✅ done | — |
| `2-7-webmcp-integration-tools-resources-prompts` | ✅ done | Runtime-Bugs als GH-Issue #7 nachgezogen (Wave A) |
| `2-8-llms-txt-llms-full-txt-endpoints` | ✅ done | — |
| `2-9a-kiez-score-bezirks-score-aggregat-berechnung` | ✅ done | — |
| `2-9b-ranking-page-wo-lebt-es-sich-gut` | ✅ done | 2026-05-16 wave-5: /wo-lebt-es-sich-gut prerendered, Top-30-Kieze + 12 Bezirke, View-Toggle + Sort-via-URL-State (sie… |
| `2-11-static-hero-landing-atlas-move-explore` | ✅ done | 2026-05-16 wave-6: Hero-Landing auf / + Atlas auf /explore, 7 home-Komponenten, Header-CTA + e2e-Sweep (siehe 2-11-Wa… |
| `2-12-hero-landing-content-screenshot-assets` | ✅ done | 2026-05-16 wave-7: content-files + screenshot-manifest + quick-links + 2 runbooks (siehe 2-12-Wave-7-Comment); i18n-M… |
| `2-13-updates-route-rss-categories-jsonld` | ✅ done | — |

### Epic 3

| Story | Status | Kommentar |
|---|---|---|
| `3-1-paraglide-setup-reduce-de-only` | ⏳ backlog | — |

### Epic 4

| Story | Status | Kommentar |
|---|---|---|
| `4-1-hetzner-cpx22-coolify-traefik-postgres-production-setup` | ✅ done | 2026-05-17: live https://navigator.berlin (CPX22 Falkenstein, Coolify v4 + Traefik + Postgres-17), backup-cron weekly… |
| `4-2-security-hardening-tls-csp-headers-crowdsec` | ✅ done | 2026-05-17: pragmatic-scope per user (kein CrowdSec/Strict-CSP/GPG-Backup — public Berlin-geo-data, kein Auth/PII). L… |
| `4-3-github-actions-ci-8-gates-lefthook` | 📋 ready-for-dev | — |
| `4-4-adr-nachzieher-disaster-recovery-runbooks` | 📋 ready-for-dev | — |
| `4-5-lizenzen-page-en-variante-auto-gen-coverage-test` | ✅ done | 2026-05-17: lizenzen-Page existiert seit 1.x mit voller daten-lizenz/software/schriften/osm-namensnennung-Abdeckung. … |
| `4-6-compliance-pages-impressum-datenschutz-barrierefreiheit-de-en` | ✅ done | 2026-05-17: Impressum nach § 5 TMG + § 18 MStV, Datenschutz mit #bookmarks-Anchor für LocalStorage-Aufklärung, beide … |
| `4-7-architektur-page-eu-foss-showcase-de-en` | ✅ done | 2026-05-17: 8 Sections EU-FOSS-Stack (Hosting/Proxy/App/Daten/Security/Build/Backup/NICHT-Stack). DE-only. |

### Epic 5

| Story | Status | Kommentar |
|---|---|---|
| `5-1-update-cadence-adr-github-actions-schedule` | ↪ deferred-to-epic-7 | 2026-05-17 user-decision: bundle mit Epic 7 Knowledge-Layer-Foundation (7-1 Auto-Doc-Skill thematisch passend) |
| `5-2-brand-asset-pack-press-kit` | ↪ deferred | 2026-05-17 user-decision: irgendwann, kein Launch-Blocker |
| `5-3-launch-sequencing-plan-channel-material` | ↪ deferred | 2026-05-17 user-decision: irgendwann |
| `5-4-post-launch-monitoring-eu-foss` | ↪ deferred | 2026-05-17 user-decision: Plausible reicht für Monitoring-Visibility |
| `5-5-backup-restore-drill-staging` | ✅ done | 2026-05-17 drill PASS — pg-2026-05-17.sql.gz restored in throwaway postgres:17-alpine, alle 5 Tabellen mit exakten Co… |
| `5-6-gdpr-dpia-dokument-beratungs-asset` | ❌ cancelled | 2026-05-17 user-decision: nicht relevant für nicht-kommerziellen Single-Maintainer |
| `5-7-sitemap-submission-search-console-setup` | ✅ done | 2026-05-17 user hat GSC + Bing verifiziert + Sitemap submitted |
| `5-8-public-update-skill` | ✅ done | 2026-05-17: /publish-update Skill complete. 7 test-files / 58 tests (TDD), 6 pure-funcs + 1 subagent-wrapper. SKILL.m… |

### Epic 6

| Story | Status | Kommentar |
|---|---|---|
| `6-0-wahl-daten-schema-pipeline-foundation` | ⏳ backlog | — |
| `6-1-bezirksreform-2001-mapping` | ⏳ backlog | — |
| `6-2-wahlbezirks-geometrie-layer-adress-lookup` | ⏳ backlog | — |
| `6-3-inspector-section-wahlverhalten-hier` | ⏳ backlog | — |
| `6-4-per-wahl-detail-page` | ⏳ backlog | — |
| `6-5-briefwahl-asymmetrie-ui-pattern` | ⏳ backlog | — |
| `6-6-volksentscheide-sub-layer` | ⏳ backlog | — |
| `6-7-cross-layer-story-templates-wahl-variablen` | ⏳ backlog | — |
| `6-8-webmcp-tools-wahldaten` | ⏳ backlog | — |
| `6-9-json-ld-dataset-methodik-doku` | ⏳ backlog | — |

### Epic 7

| Story | Status | Kommentar |
|---|---|---|
| `7-1-auto-doc-skill-foundation` | ❌ cancelled | 2026-05-17 verworfen wie spec'd (Lefthook-post-commit + Subagent-Auto-Narrative-Writes haben hohe Friction + Halluzin… |
| `7-5-owner-recovery-playbook-secrets-map` | 📋 ready-for-dev | NEUE Priorität #1 post-launch |
| `7-2-docs-tree-struktur-index` | 📋 ready-for-dev | Priorität #2: Tree + INDEX + Frontmatter-Convention für Owner+LLM-Discovery |
| `7-4-data-pipeline-atlas` | 📋 ready-for-dev | Priorität #3: Generator-Script `pnpm doc:pipelines`, deterministisch |
| `7-3-system-map-service-topology` | 📋 ready-for-dev | Priorität #4: Mermaid manuell, Content-First |
| `7-6-llm-konsum-optimierung` | 📋 ready-for-dev | Priorität #5: Story-Map-Generator + Stale-Marker, kein Lefthook |

