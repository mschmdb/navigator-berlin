---
type: architecture
audience: both
last-verified: 2026-06-10
related:
  - docs/INDEX.md
  - docs/pipelines/data-flow.md
---

# Story-Map

Auto-generiert via `pnpm doc:story-map` aus `_bmad-output/implementation-artifacts/sprint-status.yaml`. Stand: 2026-06-10.

**143 Stories total**: ✅ 78 done · 🚧 1 in-progress · 📋 4 ready-for-dev · ⏳ 4 backlog · ▫️ 56 other

## Pro Epic

### Epic 1

| Story                                                 | Status  | Kommentar |
| ----------------------------------------------------- | ------- | --------- |
| `1-1-repository-initialisierung-mit-stack-foundation` | ✅ done | —         |
| `1-2-design-token-foundation-mit-cloud-dancer-plex`   | ✅ done | —         |
| `1-3-build-zeit-daten-pipeline-mit-manifest`          | ✅ done | —         |
| `1-4-daten-zugriffs-abstraktion`                      | ✅ done | —         |
| `1-5-adress-suche-mit-geocoding-proxy`                | ✅ done | —         |
| `1-6-maplibre-plex-cartography-mit-glyph-pack`        | ✅ done | —         |
| `1-7-karten-interaktion-url-state-sync`               | ✅ done | —         |
| `1-8-karten-accessibility-layer`                      | ✅ done | —         |
| `1-9-inspektor-panel-mit-layer-hits`                  | ✅ done | —         |
| `1-10-layer-toggle-palette`                           | ✅ done | —         |
| `1-10c-pmtiles-pipeline`                              | ✅ done | —         |
| `1-10d-mietspiegel-preis-lookup`                      | ✅ done | —         |
| `1-11-klima-heritage-visualisierung`                  | ✅ done | —         |
| `1-12-editorial-verantwortung-pattern`                | ✅ done | —         |
| `1-13-sbahn-netz`                                     | ✅ done | —         |
| `1-14-multi-layer-diff`                               | ✅ done | —         |
| `1-15-poi-popover-lucide-icons`                       | ✅ done | —         |
| `1-16-layer-explain-coverage`                         | ✅ done | —         |
| `1-17-climate-charts-layerchart-rework`               | ✅ done | —         |
| `1-18-inspector-ux-rework`                            | ✅ done | —         |
| `1-19-naechste-oepnv-stops`                           | ✅ done | —         |
| `1-20-share-sheet-og-card`                            | ✅ done | —         |
| `1-21-mobility-soft-cutoff`                           | ✅ done | —         |
| `1-22-skala-harmonisierung-gruenversorgung`           | ✅ done | —         |
| `1-23-datenfehlt-reason-aufdroeseln`                  | ✅ done | —         |
| `1-24-klima-normalperioden-ui`                        | ✅ done | —         |
| `1-25-klima-pet-2022-coverage-bug`                    | ✅ done | —         |
| `1-26-adress-bookmarks-localstorage`                  | ✅ done | —         |
| `1-27-adress-vergleich`                               | ✅ done | —         |
| `1-28-livability-index`                               | ✅ done | —         |
| `1-29-atlas-methodik-pattern`                         | ✅ done | —         |
| `1-30-mss-soziale-stadtentwicklung`                   | ✅ done | —         |
| `1-31-atlas-ui-ux-polish`                             | ✅ done | —         |

### Epic 10

| Story                                               | Status  | Kommentar                                                                                                              |
| --------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `10-0-einwohner-lor-join-foundation`                | ✅ done | Einwohner-CSV (542 LOR-PLR, Altersjahre, CC-BY, 31.12.2024) join via plr_id auf LOR-Geometrie. Abgeleitete Aggregate:… |
| `10-1-versorgung-kita-platz-pro-kind`               | ✅ done | V1: kita.e_platz (live 99% gefüllt, Range 1-310, Median 30) + Kinder 0-6 aus 10-0 → Versorgung-Score Pro-Kopf statt n… |
| `10-2-versorgung-krankenhaus-betten-fachabteilung`  | ✅ done | V2: betten/betten_insgesamt + fachabteilungen (vorhanden, ungenutzt) gewichten Distanz-Score. string/int-Parsing vere… |
| `10-3-versorgung-schulart-differenzierung`          | ✅ done | V3: schulen.schulart (vorhanden, nur Inspector-Text) → eigene Distanz-Schwellen pro Schulart. Hängt an Epic 9.         |
| `10-4-poi-score-distanz-zu-dichte`                  | ✅ done | V5: POI-Score von Nächste-Distanz auf Anzahl-im-Radius (optional pro Kopf). Behebt zweiter-Punkt-zählt-0 + Distanz-Cl… |
| `10-5-einwohnerdichte-altersstruktur-kontext-block` | ✅ done | V4: Demografie als neutraler Inspector-Block (categorical, kein Score-Input, ADR-015). Hängt an 10-0.                  |
| `10-6-laerm-db-upgrade-spike`                       | ✅ done | V6: Spike Strategische Lärmkarten 2022 (fassadengenaue dB) statt 3-Stufen-Umweltgerechtigkeit. Tile-Strategie-Frage. … |
| `10-7-umweltgerechtigkeit-kategorie-mapping-fix`    | ✅ done | Render-Bug: choropleth-mehrfach (layer-style-builder.ts:444) matcht keinfach/.../vierfach, Quelle liefert „keine star… |
| `10-8-milieuschutz-sichtbarkeit-styling-fix`        | ✅ done | Styling-Bug: polygon-outline-soft #E0E4F0 × Opacity 0.35 = unsichtbar. Kräftigere Farbe/Opacity/Umriss, beide Milieus… |
| `10-9-gefuehlte-temperatur-flaechendeckend`         | ✅ done | PET-Lücken füllen: pb_ua_pet_str + pc_ua_pet_grfrei (gleiches pet14h-Feld, live geprüft) mit pa_siedlg mergen → fläch… |
| `10-6b-laerm-db-per-lor-aggregat`                   | ✅ done | Folge aus 10-6-Spike: Per-LOR-dB-Mittel aus aa_fp_gesamt2022 (3,8 Mio Fassadenpunkte ges_den) statt 3-Stufen-Index. W… |

### Epic 11

| Story                                       | Status     | Kommentar                                                                                                                |
| ------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `11-0-ranking-quartil-foundation`           | ▫️ review  | Build-Step: Rang 1..143 + Quartil pro Score-Dimension/Metrik (analog 12 Bezirke). TDD. Hard-Block fuer 11-3, 11-4, 11-6. |
| `11-1-wikidata-entitaeten-sameas-jsonld`    | ▫️ review  | Stufe 3.1: Wikidata (CC0) + Wikipedia je Bezirk/Ortsteil als sameAs in Place/AdministrativeArea-JsonLd. Match per Cen…   |
| `11-2-faq-entruempelung-erklaer-templates`  | ▫️ review  | Stufe 1.1: FAQ-Templates mit requires:[] aus kiez/bezirk raus, auf Methodik/Layer buendeln. Behebt AEO-Duplicate-Cont…   |
| `11-3-daten-faq-ranking-vergleich-zahl`     | ▫️ review  | Stufe 1.2: neue FAQ-Templates kombinieren Rang + Vergleich + konkrete Zahl, Antwort in ersten 40-60 Woertern (AEO). A…   |
| `11-4-vergleichswerte-kiez-bezirk-berlin`   | ▫️ review  | Stufe 1.4: Steckbrief zeigt Kiez-Wert vs Bezirks-Schnitt vs Berlin-Median je Dimension. A11y (kein Farb-only). Haengt…   |
| `11-5-verteilungen-zaehldaten-steckbrief`   | ▫️ review  | Stufe 1.5: categoryDistribution + Counts (U/S/Tram/Bus, Kitas/Schulen/km2, Spielplaetze) statt nur Dominant-Wert. FR4…   |
| `11-6-grounded-ki-profile-build-step`       | ▫️ review  | Stufe 2 (Owner-Decision 2026-06-06): eigener Script pnpm data:profiles (NICHT prebuild, Owner-getriggert), grounded 2…   |
| `11-7-fakten-lint-editorial-gate`           | ▫️ review  | Stufe 2.3/2.4: Lint prueft jede Zahl im Profil-Content-File gegen Datenbasis (analog lint:wahl + forbidden-tokens.ts)…   |
| `11-8-bezirksregionenprofile-prosa-quelle`  | ⏳ backlog | FUTURE-TASK (deferred 2026-06-07, siehe epics.md Future-Epics). Stufe 3.2 optional: amtliche Bezirksregionenprofile T…   |
| `11-9-disclaimer-bezirk-audit-llms-content` | ▫️ review  | Offene Punkte: Methodik-Disclaimer Kiez=LOR-BZR, Bezirks-Komponenten-Audit vs Kiez, llms_content-Rolle klaeren. Begle…   |
| `11-10-epic-11-dokumentation`               | ▫️ review  | Doku-Abschluss (Epic-7-Muster): scoring-methodology (Ranking/Quartil), faq-template-style-guide (neue Muster), neue d…   |

### Epic 12

| Story                                  | Status     | Kommentar                                                                                                              |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| `12-0-nahversorgung-layer-foundation`  | ▫️ review  | Overpass-Fetch (shop=supermarket                                                                                       | convenience | grocery, amenity=pharmacy, amenity=post_office, Tags live verifizieren) … |
| `12-1-lebensmittel-dichte-term`        | ▫️ review  | Lebensmittel als poi-density-Term (~500m) in VERSORGUNG_CONFIG, weicher Tail analog 10-4. Inspector-Quelle + ODbL-Att… |
| `12-2-apotheke-post-dichte-term`       | ▫️ review  | Apotheke (~800m) + Post (~1000m) als poi-density-Terme. Baecker-Entscheidung dokumentieren (Lebensmittel-Bucket oder … |
| `12-3-versorgung-umgewichtung`         | ▫️ review  | Interne Umgewichtung VERSORGUNG_CONFIG (Owner-Review): Kita 0.30->0.24, Schule 0.30->0.24, Krankenhaus 0.25->0.18, Sp… |
| `12-4-methodik-doku-nahversorgung`     | ▫️ review  | scoring-methodology.md + Methodik-Page: Versorgung = oeffentlich + privat. ADR-Notiz Neudefinition + Anti-Stigma-Abgr… |
| `12-5-step-zentren-zentralitaet-spike` | ⏳ backlog | DEFERRED 2026-06-07 (Owner-Decision, optional, nicht gezogen). OPTIONAL Spike: StEP Zentren (Geoportal/ex-FIS-Broker … |
| `12-6-epic-12-dokumentation-updates`   | ▫️ review  | Abschluss (Epic-7-Muster): doc:pipelines + doc:story-map neu, INDEX, Konsistenz-Sweep, PLUS User-facing /updates-Eint… |

### Epic 13

| Story                                        | Status     | Kommentar                                                                                                              |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------- | ------- | ------ | ----------- | --------------------------- |
| `13-0-kultur-layer-foundation`               | ▫️ review  | Overpass-Fetch (tourism=artwork                                                                                        | gallery | museum, amenity=theatre | library | cinema | arts_centre | nightclub, Tags live verif… |
| `13-1-kultur-dimensions-foundation`          | ▫️ review  | Typ-Union 5->6 (+kultur), DIMENSION_WEIGHTS rebalance (Vorschlag 6x0.1667, Owner-Review; Alt: Kultur leichter). KULTU… |
| `13-2-db-schema-migration-kultur`            | ▫️ review  | Drizzle-Migration: Spalte kultur (doublePrecision nullable) in kiez_score + bezirk_score. composite bleibt. Nach 13-1… |
| `13-3-pipeline-recompute-rerun`              | ▫️ review  | compute-score/build-kiez-scores/aggregate-scores auf 6er-Set. data:kiez-scores + aggregate-scores + rank + comparison… |
| `13-4-konsumenten-migration-ui-map-og-llm`   | ▫️ review  | kiez-score-display (Labels), Score-Ring 5->6 Segmente, Inspector-Section, compare-block, score-ranking-table (ranking… |
| `13-5-content-migration-methodik-adr`        | ▫️ review  | /methodik/kiez-score + scoring-methodology.md (Kultur-Dimension, Terme, Quelle, Daempfung). Neue ADR (analog ADR-015)… |
| `13-6-kulturdaten-berlin-anreicherung-spike` | ⏳ backlog | DEFERRED 2026-06-07 (Owner, optional, analog 12-5). # OPTIONAL Spike: kulturdaten.berlin API (CC BY, 3261 Locations,…  |
| `13-7-epic-13-dokumentation-updates`         | ▫️ review  | Abschluss (Epic-7-Muster): doc:pipelines + doc:story-map + system-map neu, INDEX, Konsistenz-Sweep (keine "fuenf Dime… |
| `13-8-prosa-profile-regeneration`            | ▫️ review  | CROSS-EPIC-CAPSTONE (allerletzte Story beider Epics): Profil-Input (build.ts/input.ts) + Fakten-Lint (fact-lint.ts) +… |

### Epic 14

| Story                                              | Status         | Kommentar                                                                                                              |
| -------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `14-0-kriminalitaetsatlas-layer-foundation`        | ▫️ review      | XLSX-Fetch (Fallzahlen&HZ 2016-2025.xlsx, HZ-Sheets letzte 3 Jahre) + Parse wohn-relevanter Delikt-Spalten je LOR-Sch… |
| `14-1-kriminalitaet-dimensions-foundation`         | ▫️ review      | Typ-Union +kriminalitaet, DIMENSION_WEIGHTS.kriminalitaet=0, raus aus COMPOSITE_DIMENSIONS (Option C, kein Rebalance)… |
| `14-2-db-schema-migration-kriminalitaet`           | ▫️ review      | Drizzle-Migration: Spalte kriminalitaet (doublePrecision nullable) in kiez_score + bezirk_score. composite bleibt. Na… |
| `14-3-pipeline-recompute-rerun`                    | ▫️ review      | compute-score/build-kiez-scores/aggregate-scores auf erweitertes Set. data:kiez-scores + aggregate-scores + rank + co… |
| `14-4-konsumenten-migration-inspector-map-compare` | ▫️ review      | Inspector-Section, Choropleth-Score-Layer (Strukturell-Indigo), compare-block, LLM-Renderer. Neutrale Bezeichnung "er… |
| `14-5-content-migration-methodik-adr`              | ▫️ review      | /methodik/kiez-score + scoring-methodology.md (Delikt-Auswahl, Quelle Polizei/dl-de-by-2.0, HZ-Definition, 3-Jahres-M… |
| `14-6-city-core-verzerrung-delikt-set-spike`       | ❌ cancelled   | 2026-06-10 Owner-Decision: Zweck (Normalisierung + Delikt-Gewichte validieren) durch Owner-Sign-off in 14.1/14.5 erfü… |
| `14-7-epic-14-dokumentation-updates`               | 🚧 in-progress | Abschluss (Epic-7-Muster): doc:pipelines + doc:story-map + system-map neu, INDEX, Konsistenz-Sweep (kein "Sicherheits… |
| `14-8-profile-konsistenz-crime-exkludiert`         | ▫️ review      | CAPSTONE (anders als 13-8 KEINE teure Profil-Regeneration): Kriminalitaet bewusst NICHT in Profil-Input (build.ts/inp… |

### Epic 2

| Story                                                 | Status  | Kommentar                                                                                                                |
| ----------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `2-0-postgres-aggregat-foundation-drizzle-build-step` | ✅ done | —                                                                                                                        |
| `2-1-seo-foundation-sitemap-canonical-robots-txt`     | ✅ done | —                                                                                                                        |
| `2-2-json-ld-generator-bibliothek`                    | ✅ done | —                                                                                                                        |
| `2-3-bezirks-pages-prerendered`                       | ✅ done | 2026-05-16 wave-4: 12 prerendered DE-only routes; MapEmbed entfernt per User-Decision (siehe 2-3-followup-fixes-Comment) |
| `2-4-kiez-pages-prerendered`                          | ✅ done | 2026-05-16 wave-5: 143 prerendered DE-only routes, Variante A LOR-Bezirksregion (siehe 2-4-Wave-5-Comment)               |
| `2-5a-layer-page-en-variante-dataset-jsonld`          | ✅ done | scope-reduced 2026-05-16: DE-only refactor + authority centralization; EN-coverage deferred phase-3                      |
| `2-5b-faq-section-template-daten-slots`               | ✅ done | 2026-05-16 wave-4: 5 Cluster DE-only + render-faq + faq-section (siehe 2-5b-Wave-4-Comment)                              |
| `2-6-og-image-pipeline-bezirk-kiez-layer`             | ✅ done | —                                                                                                                        |
| `2-7-webmcp-integration-tools-resources-prompts`      | ✅ done | Runtime-Bugs als GH-Issue #7 nachgezogen (Wave A)                                                                        |
| `2-8-llms-txt-llms-full-txt-endpoints`                | ✅ done | —                                                                                                                        |
| `2-9a-kiez-score-bezirks-score-aggregat-berechnung`   | ✅ done | —                                                                                                                        |
| `2-9b-ranking-page-wo-lebt-es-sich-gut`               | ✅ done | 2026-05-16 wave-5: /wo-lebt-es-sich-gut prerendered, Top-30-Kieze + 12 Bezirke, View-Toggle + Sort-via-URL-State (sie…   |
| `2-11-static-hero-landing-atlas-move-explore`         | ✅ done | 2026-05-16 wave-6: Hero-Landing auf / + Atlas auf /explore, 7 home-Komponenten, Header-CTA + e2e-Sweep (siehe 2-11-Wa…   |
| `2-12-hero-landing-content-screenshot-assets`         | ✅ done | 2026-05-16 wave-7: content-files + screenshot-manifest + quick-links + 2 runbooks (siehe 2-12-Wave-7-Comment); i18n-M…   |
| `2-13-updates-route-rss-categories-jsonld`            | ✅ done | —                                                                                                                        |

### Epic 3

| Story                                | Status     | Kommentar |
| ------------------------------------ | ---------- | --------- |
| `3-1-paraglide-setup-reduce-de-only` | ⏳ backlog | —         |

### Epic 4

| Story                                                               | Status           | Kommentar                                                                                                              |
| ------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `4-1-hetzner-cpx22-coolify-traefik-postgres-production-setup`       | ✅ done          | 2026-05-17: live https://navigator.berlin (CPX22 Falkenstein, Coolify v4 + Traefik + Postgres-17), backup-cron weekly… |
| `4-2-security-hardening-tls-csp-headers-crowdsec`                   | ✅ done          | 2026-05-17: pragmatic-scope per user (kein CrowdSec/Strict-CSP/GPG-Backup — public Berlin-geo-data, kein Auth/PII). L… |
| `4-3-github-actions-ci-8-gates-lefthook`                            | 📋 ready-for-dev | —                                                                                                                      |
| `4-4-adr-nachzieher-disaster-recovery-runbooks`                     | 📋 ready-for-dev | —                                                                                                                      |
| `4-5-lizenzen-page-en-variante-auto-gen-coverage-test`              | ✅ done          | 2026-05-17: lizenzen-Page existiert seit 1.x mit voller daten-lizenz/software/schriften/osm-namensnennung-Abdeckung. … |
| `4-6-compliance-pages-impressum-datenschutz-barrierefreiheit-de-en` | ✅ done          | 2026-05-17: Impressum nach § 5 TMG + § 18 MStV, Datenschutz mit #bookmarks-Anchor für LocalStorage-Aufklärung, beide … |
| `4-7-architektur-page-eu-foss-showcase-de-en`                       | ✅ done          | 2026-05-17: 8 Sections EU-FOSS-Stack (Hosting/Proxy/App/Daten/Security/Build/Backup/NICHT-Stack). DE-only.             |

### Epic 5

| Story                                            | Status               | Kommentar                                                                                                              |
| ------------------------------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `5-1-update-cadence-adr-github-actions-schedule` | ↪ deferred-to-epic-7 | 2026-05-17 user-decision: bundle mit Epic 7 Knowledge-Layer-Foundation (7-1 Auto-Doc-Skill thematisch passend)         |
| `5-2-brand-asset-pack-press-kit`                 | ↪ deferred           | 2026-05-17 user-decision: irgendwann, kein Launch-Blocker                                                              |
| `5-3-launch-sequencing-plan-channel-material`    | ↪ deferred           | 2026-05-17 user-decision: irgendwann                                                                                   |
| `5-4-post-launch-monitoring-eu-foss`             | ↪ deferred           | 2026-05-17 user-decision: Plausible reicht für Monitoring-Visibility                                                   |
| `5-5-backup-restore-drill-staging`               | ✅ done              | 2026-05-17 drill PASS — pg-2026-05-17.sql.gz restored in throwaway postgres:17-alpine, alle 5 Tabellen mit exakten Co… |
| `5-6-gdpr-dpia-dokument-beratungs-asset`         | ❌ cancelled         | 2026-05-17 user-decision: nicht relevant für nicht-kommerziellen Single-Maintainer                                     |
| `5-7-sitemap-submission-search-console-setup`    | ✅ done              | 2026-05-17 user hat GSC + Bing verifiziert + Sitemap submitted                                                         |
| `5-8-public-update-skill`                        | ✅ done              | 2026-05-17: /publish-update Skill complete. 7 test-files / 58 tests (TDD), 6 pure-funcs + 1 subagent-wrapper. SKILL.m… |
| `5-9-seo-aeo-pre-indexing-hardening`             | ▫️ review            | 2026-05-18 review. 11 AC + 9 Task-Cluster done. Recon ergeben: buildPlace + AdministrativeArea + Breadcrumb + WebSite… |

### Epic 6

| Story                                             | Status       | Kommentar                                                                                                               |
| ------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `6-0-wahl-daten-schema-pipeline-foundation-spike` | ▫️ review    | 2026-05-18 review on feat/epic-6-wahldaten. Spike done: Source-Pivot statistik-bb → Bundeswahlleiterin \_wbz.zip + SBB… |
| `6-1-bezirksreform-2001-mapping`                  | ❌ cancelled | 2026-05-18 Scope-Reduce: Daten-Cutoff jetzt 2011+ (post-Reform), Mapping obsolet. Reaktivierungs-Trigger: FragDenStaa…  |
| `6-2-wahlbezirks-geometrie-layer-adress-lookup`   | ▫️ review    | 2026-05-18 review on feat/epic-6-wahldaten. 5 Geo-Layer in static/layers (btw17/ah16/ah21/ah23/bt25) + MANIFEST-Augme…  |
| `6-3-inspector-section-wahlverhalten-hier`        | ▫️ review    | 2026-05-18 review on feat/epic-6-wahldaten. Phase 6.3a/b/c/d done. wahl-section.svelte + wahl-compare-block.svelte + …  |
| `6-4-per-wahl-detail-page`                        | ▫️ review    | 2026-05-19 review on feat/epic-6-wahldaten. Phase 6.4a/b/c1/c2 done: 20 prerendered Routes + Methodik-Stub + Bezirks-…  |
| `6-5-briefwahl-asymmetrie-pattern`                | ▫️ review    | 2026-05-19 review on feat/epic-6-wahldaten. briefwahl-marker.svelte (Plex-Mono-Pill + Info-Icon + Tooltip + Methodik-…  |
| `6-6-volksentscheide-sub-layer`                   | ❌ cancelled | 2026-05-18 User-Decision: out-of-scope Phase 1. Reaktivierungs-Trigger: nach Hard-Launch + Capacity.                    |
| `6-7-cross-layer-story-templates-wahl-variablen`  | ▫️ review    | 2026-05-19 review on feat/epic-6-wahldaten. Foundation komplett: Schema (Valibot) + Loader (js-yaml) + Renderer (Pure…  |
| `6-8-webmcp-tools-wahldaten`                      | ▫️ review    | 2026-05-19 review on feat/epic-6-wahldaten. 4 Tools live: list_elections + get_election_result(level) + compare_elect…  |
| `6-9-json-ld-dataset-methodik-doku`               | ▫️ review    | 2026-05-19 review on feat/epic-6-wahldaten. Methodik-Page /methodik/wahldaten ausgebaut mit 9 Sub-Sections (Datenquel…  |

### Epic 7

| Story                                     | Status       | Kommentar                                                                                                              |
| ----------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `7-1-auto-doc-skill-foundation`           | ❌ cancelled | 2026-05-17 verworfen (Lefthook-post-commit + Subagent-Auto-Narrative-Writes = hohe Friction + Halluzinations-Risiko).… |
| `7-5-owner-recovery-playbook-secrets-map` | ✅ done      | 2026-05-17: docs/recovery/wiedereinstieg.md + secrets-map.md mit Bitwarden-Refs, keine Plaintext-Secrets               |
| `7-2-docs-tree-struktur-index`            | ✅ done      | 2026-05-17: docs/INDEX.md + docs/adr/INDEX.md + Subordner architecture/pipelines/recovery + Frontmatter-Bulk-Add für … |
| `7-4-data-pipeline-atlas`                 | ✅ done      | 2026-05-17: scripts/generate-data-flow-doc.ts + pnpm doc:pipelines, deterministisch aus sources.ts, 7 tests, 39 Layer… |
| `7-3-system-map-service-topology`         | ✅ done      | 2026-05-17: docs/architecture/system-map.md mit 4 Mermaid-Diagrammen (Topology + Datenfluss + Build + Routes) + Cron-… |
| `7-6-llm-konsum-optimierung`              | ✅ done      | 2026-05-17: scripts/generate-story-map.ts + pnpm doc:story-map aus sprint-status.yaml (line-parse weil js-yaml stripp… |

### Epic 8

| Story                                                     | Status           | Kommentar                                                                                                              |
| --------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `8-0-multi-level-architektur-adr-layer-aggregat-strategy` | ▫️ review        | 2026-05-20 ADR-014 geschrieben (docs/adr/ADR-014, status proposed). Matrix pro Layer-Familie: Aggregat-Strategie (8 T… |
| `8-1-inspector-globaler-level-switch-foundation`          | ▫️ review        | 2026-05-21 PIVOT: User-Level-Switch (Adresse/Kiez/Bezirk/Berlin-Toggle) verworfen (Click-durch-Ebenen-Mental-Model du… |
| `8-1b-inspector-card-system-visual-primitives`            | ▫️ review        | 2026-05-20 impl: inspector-card (Visual-Summary-Pflicht+Lazy-Detail) + Chart-Primitive (score-bar/distribution-bar/co… |
| `8-2a-layer-aggregat-pipeline`                            | ▫️ review        | 2026-05-20 impl: data:layer-aggregate Pipeline, 15 Layer × {kiez,bezirk,berlin} → static/layer-aggregates/layer-aggre… |
| `8-2b-layer-sections-multi-level-adapter`                 | ▫️ review        | 2026-05-20 impl AC#1-5: aggregate-layer-for-level.ts Adapter + layer-level-card.svelte (8.1b-Primitive) + lazy get-la… |
| `8-2c-point-layer-density-count`                          | 📋 ready-for-dev | 2026-05-21 RESCOPE nach Pivot: kein Level-Switch mehr → Point-Density (Kitas/Schulen/ÖPNV) als Kiez/Bezirk-Anreicheru… |
| `8-3-karten-polygon-highlight-level-switch`               | ❌ cancelled     | 2026-05-21 verworfen: braucht den verworfenen User-Level-Switch (Polygon-Highlight beim Level-Wechsel). Ohne Toggle k… |
| `8-4-compare-mode-multi-level-integration`                | ❌ cancelled     | 2026-05-21 verworfen: same-level-lock im Compare setzt den verworfenen Level-Switch voraus. Compare-Mode (1.27) bleib… |
| `8-5-webmcp-tools-multi-level-parameter`                  | 📋 ready-for-dev | 2026-05-21 RESCOPE nach Pivot: kein UI-Toggle, aber LLM kann Kiez/Bezirk/Berlin-Aggregate via optionalem level-Param … |

### Epic 9

| Story                             | Status  | Kommentar                                                                                                              |
| --------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `9-1-score-dimensions-foundation` | ✅ done | 2026-05-21 impl: KiezScoreDimension-Union auf ADR-015-Set (soziale-lage raus, gruen→gruen-hitze, wohnschutz neu via M… |
| `9-2-db-schema-migration`         | ✅ done | 2026-05-21 impl: Schema kiez_score+bezirk_score migriert (soziale_lage raus, gruen→gruen_hitze, wohnschutz neu). Migr… |
| `9-3-pipeline-recompute-rerun`    | ✅ done | 2026-05-21 impl: build-kiez-scores (MSS+Umweltgerechtigkeit raus, klima-pet+Milieuschutz rein als Punkt-in-Polygon-pr… |
| `9-4-konsumenten-migration`       | ✅ done | 2026-05-21 impl: alle Score-Konsumenten (Inspector/Compare/Hero/Ring/Ranking/Choropleth/OG/LLM) + Tests auf ADR-015-D… |
| `9-5-content-migration`           | ✅ done | 2026-05-21 impl: Methodik-Page + wo-lebt-es-sich-gut + Atlas-Methodik + layer-methodology auf ADR-015. Score-Name „Um… |
| `9-6-erinnerung-layer-removal`    | ✅ done | 2026-05-21 impl (AC-5b build-only): denkmal+stolpersteine aus allen Frontend-Surfaces (Palette/Inspector-Section/Laye… |
