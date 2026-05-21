---
type: architecture
audience: both
last-verified: 2026-05-21
related:
  - docs/INDEX.md
  - docs/pipelines/data-flow.md
---

# Story-Map

Auto-generiert via `pnpm doc:story-map` aus `_bmad-output/implementation-artifacts/sprint-status.yaml`. Stand: 2026-05-21.

**107 Stories total**: ✅ 77 done · 🚧 0 in-progress · 📋 4 ready-for-dev · ⏳ 2 backlog · ▫️ 24 other

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

### Epic 10

| Story | Status | Kommentar |
|---|---|---|
| `10-0-einwohner-lor-join-foundation` | ✅ done | Einwohner-CSV (542 LOR-PLR, Altersjahre, CC-BY, 31.12.2024) join via plr_id auf LOR-Geometrie. Abgeleitete Aggregate:… |
| `10-1-versorgung-kita-platz-pro-kind` | ✅ done | V1: kita.e_platz (live 99% gefüllt, Range 1-310, Median 30) + Kinder 0-6 aus 10-0 → Versorgung-Score Pro-Kopf statt n… |
| `10-2-versorgung-krankenhaus-betten-fachabteilung` | ✅ done | V2: betten/betten_insgesamt + fachabteilungen (vorhanden, ungenutzt) gewichten Distanz-Score. string/int-Parsing vere… |
| `10-3-versorgung-schulart-differenzierung` | ✅ done | V3: schulen.schulart (vorhanden, nur Inspector-Text) → eigene Distanz-Schwellen pro Schulart. Hängt an Epic 9. |
| `10-4-poi-score-distanz-zu-dichte` | ✅ done | V5: POI-Score von Nächste-Distanz auf Anzahl-im-Radius (optional pro Kopf). Behebt zweiter-Punkt-zählt-0 + Distanz-Cl… |
| `10-5-einwohnerdichte-altersstruktur-kontext-block` | ✅ done | V4: Demografie als neutraler Inspector-Block (categorical, kein Score-Input, ADR-015). Hängt an 10-0. |
| `10-6-laerm-db-upgrade-spike` | ✅ done | V6: Spike Strategische Lärmkarten 2022 (fassadengenaue dB) statt 3-Stufen-Umweltgerechtigkeit. Tile-Strategie-Frage. … |
| `10-7-umweltgerechtigkeit-kategorie-mapping-fix` | ✅ done | Render-Bug: choropleth-mehrfach (layer-style-builder.ts:444) matcht keinfach/.../vierfach, Quelle liefert „keine star… |
| `10-8-milieuschutz-sichtbarkeit-styling-fix` | ✅ done | Styling-Bug: polygon-outline-soft #E0E4F0 × Opacity 0.35 = unsichtbar. Kräftigere Farbe/Opacity/Umriss, beide Milieus… |
| `10-9-gefuehlte-temperatur-flaechendeckend` | ✅ done | PET-Lücken füllen: pb_ua_pet_str + pc_ua_pet_grfrei (gleiches pet14h-Feld, live geprüft) mit pa_siedlg mergen → fläch… |
| `10-6b-laerm-db-per-lor-aggregat` | ⏳ backlog | Folge aus 10-6-Spike: Per-LOR-dB-Mittel aus aa_fp_gesamt2022 (3,8 Mio Fassadenpunkte ges_den) statt 3-Stufen-Index. W… |

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
| `5-9-seo-aeo-pre-indexing-hardening` | ▫️ review | 2026-05-18 review. 11 AC + 9 Task-Cluster done. Recon ergeben: buildPlace + AdministrativeArea + Breadcrumb + WebSite… |

### Epic 6

| Story | Status | Kommentar |
|---|---|---|
| `6-0-wahl-daten-schema-pipeline-foundation-spike` | ▫️ review | 2026-05-18 review on feat/epic-6-wahldaten. Spike done: Source-Pivot statistik-bb → Bundeswahlleiterin _wbz.zip + SBB… |
| `6-1-bezirksreform-2001-mapping` | ❌ cancelled | 2026-05-18 Scope-Reduce: Daten-Cutoff jetzt 2011+ (post-Reform), Mapping obsolet. Reaktivierungs-Trigger: FragDenStaa… |
| `6-2-wahlbezirks-geometrie-layer-adress-lookup` | ▫️ review | 2026-05-18 review on feat/epic-6-wahldaten. 5 Geo-Layer in static/layers (btw17/ah16/ah21/ah23/bt25) + MANIFEST-Augme… |
| `6-3-inspector-section-wahlverhalten-hier` | ▫️ review | 2026-05-18 review on feat/epic-6-wahldaten. Phase 6.3a/b/c/d done. wahl-section.svelte + wahl-compare-block.svelte + … |
| `6-4-per-wahl-detail-page` | ▫️ review | 2026-05-19 review on feat/epic-6-wahldaten. Phase 6.4a/b/c1/c2 done: 20 prerendered Routes + Methodik-Stub + Bezirks-… |
| `6-5-briefwahl-asymmetrie-pattern` | ▫️ review | 2026-05-19 review on feat/epic-6-wahldaten. briefwahl-marker.svelte (Plex-Mono-Pill + Info-Icon + Tooltip + Methodik-… |
| `6-6-volksentscheide-sub-layer` | ❌ cancelled | 2026-05-18 User-Decision: out-of-scope Phase 1. Reaktivierungs-Trigger: nach Hard-Launch + Capacity. |
| `6-7-cross-layer-story-templates-wahl-variablen` | ▫️ review | 2026-05-19 review on feat/epic-6-wahldaten. Foundation komplett: Schema (Valibot) + Loader (js-yaml) + Renderer (Pure… |
| `6-8-webmcp-tools-wahldaten` | ▫️ review | 2026-05-19 review on feat/epic-6-wahldaten. 4 Tools live: list_elections + get_election_result(level) + compare_elect… |
| `6-9-json-ld-dataset-methodik-doku` | ▫️ review | 2026-05-19 review on feat/epic-6-wahldaten. Methodik-Page /methodik/wahldaten ausgebaut mit 9 Sub-Sections (Datenquel… |

### Epic 7

| Story | Status | Kommentar |
|---|---|---|
| `7-1-auto-doc-skill-foundation` | ❌ cancelled | 2026-05-17 verworfen (Lefthook-post-commit + Subagent-Auto-Narrative-Writes = hohe Friction + Halluzinations-Risiko).… |
| `7-5-owner-recovery-playbook-secrets-map` | ✅ done | 2026-05-17: docs/recovery/wiedereinstieg.md + secrets-map.md mit Bitwarden-Refs, keine Plaintext-Secrets |
| `7-2-docs-tree-struktur-index` | ✅ done | 2026-05-17: docs/INDEX.md + docs/adr/INDEX.md + Subordner architecture/pipelines/recovery + Frontmatter-Bulk-Add für … |
| `7-4-data-pipeline-atlas` | ✅ done | 2026-05-17: scripts/generate-data-flow-doc.ts + pnpm doc:pipelines, deterministisch aus sources.ts, 7 tests, 39 Layer… |
| `7-3-system-map-service-topology` | ✅ done | 2026-05-17: docs/architecture/system-map.md mit 4 Mermaid-Diagrammen (Topology + Datenfluss + Build + Routes) + Cron-… |
| `7-6-llm-konsum-optimierung` | ✅ done | 2026-05-17: scripts/generate-story-map.ts + pnpm doc:story-map aus sprint-status.yaml (line-parse weil js-yaml stripp… |

### Epic 8

| Story | Status | Kommentar |
|---|---|---|
| `8-0-multi-level-architektur-adr-layer-aggregat-strategy` | ▫️ review | 2026-05-20 ADR-014 geschrieben (docs/adr/ADR-014, status proposed). Matrix pro Layer-Familie: Aggregat-Strategie (8 T… |
| `8-1-inspector-globaler-level-switch-foundation` | ▫️ review | 2026-05-21 PIVOT: User-Level-Switch (Adresse/Kiez/Bezirk/Berlin-Toggle) verworfen (Click-durch-Ebenen-Mental-Model du… |
| `8-1b-inspector-card-system-visual-primitives` | ▫️ review | 2026-05-20 impl: inspector-card (Visual-Summary-Pflicht+Lazy-Detail) + Chart-Primitive (score-bar/distribution-bar/co… |
| `8-2a-layer-aggregat-pipeline` | ▫️ review | 2026-05-20 impl: data:layer-aggregate Pipeline, 15 Layer × {kiez,bezirk,berlin} → static/layer-aggregates/layer-aggre… |
| `8-2b-layer-sections-multi-level-adapter` | ▫️ review | 2026-05-20 impl AC#1-5: aggregate-layer-for-level.ts Adapter + layer-level-card.svelte (8.1b-Primitive) + lazy get-la… |
| `8-2c-point-layer-density-count` | 📋 ready-for-dev | 2026-05-21 RESCOPE nach Pivot: kein Level-Switch mehr → Point-Density (Kitas/Schulen/ÖPNV) als Kiez/Bezirk-Anreicheru… |
| `8-3-karten-polygon-highlight-level-switch` | ❌ cancelled | 2026-05-21 verworfen: braucht den verworfenen User-Level-Switch (Polygon-Highlight beim Level-Wechsel). Ohne Toggle k… |
| `8-4-compare-mode-multi-level-integration` | ❌ cancelled | 2026-05-21 verworfen: same-level-lock im Compare setzt den verworfenen Level-Switch voraus. Compare-Mode (1.27) bleib… |
| `8-5-webmcp-tools-multi-level-parameter` | 📋 ready-for-dev | 2026-05-21 RESCOPE nach Pivot: kein UI-Toggle, aber LLM kann Kiez/Bezirk/Berlin-Aggregate via optionalem level-Param … |

### Epic 9

| Story | Status | Kommentar |
|---|---|---|
| `9-1-score-dimensions-foundation` | ✅ done | 2026-05-21 impl: KiezScoreDimension-Union auf ADR-015-Set (soziale-lage raus, gruen→gruen-hitze, wohnschutz neu via M… |
| `9-2-db-schema-migration` | ✅ done | 2026-05-21 impl: Schema kiez_score+bezirk_score migriert (soziale_lage raus, gruen→gruen_hitze, wohnschutz neu). Migr… |
| `9-3-pipeline-recompute-rerun` | ✅ done | 2026-05-21 impl: build-kiez-scores (MSS+Umweltgerechtigkeit raus, klima-pet+Milieuschutz rein als Punkt-in-Polygon-pr… |
| `9-4-konsumenten-migration` | ✅ done | 2026-05-21 impl: alle Score-Konsumenten (Inspector/Compare/Hero/Ring/Ranking/Choropleth/OG/LLM) + Tests auf ADR-015-D… |
| `9-5-content-migration` | ✅ done | 2026-05-21 impl: Methodik-Page + wo-lebt-es-sich-gut + Atlas-Methodik + layer-methodology auf ADR-015. Score-Name „Um… |
| `9-6-erinnerung-layer-removal` | ✅ done | 2026-05-21 impl (AC-5b build-only): denkmal+stolpersteine aus allen Frontend-Surfaces (Palette/Inspector-Section/Laye… |

