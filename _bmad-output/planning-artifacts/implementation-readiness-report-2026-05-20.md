---
stepsCompleted: [step-01-document-discovery, step-02-prd-analysis, step-03-epic-coverage-validation, step-04-ux-alignment, step-05-epic-quality-review, step-06-final-assessment]
scope: epic-8-only
documentsIncluded:
  - prd.md
  - architecture.md
  - epics.md
  - ux-design-specification.md
  - docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md
  - 8 epic-8 story files (_bmad-output/implementation-artifacts/8-*.md)
---

# Implementation Readiness Assessment Report

**Date:** 2026-05-20
**Project:** navigator.berlin
**Scope:** Epic 8 (Multi-Level-Inspector + Karten-Polygon-Highlight) only

## Step 1: Document Inventory

**Whole Documents (keine Sharded-Duplikate gefunden):**

| Dokument | Größe | Geändert |
|----------|-------|----------|
| prd.md | 93 KB | 2026-05-11 |
| architecture.md | 107 KB | 2026-05-15 |
| epics.md | 251 KB | 2026-05-20 |
| ux-design-specification.md | 143 KB | 2026-05-15 |

**Epic-8-spezifisch:**
- docs/adr/ADR-014-multi-level-inspector-aggregat-strategie.md (Foundation, status Proposed)
- 8 Story-Files unter _bmad-output/implementation-artifacts/: 8-0 (review), 8-1, 8-1b, 8-2a, 8-2b, 8-3, 8-4, 8-5 (alle ready-for-dev)

**Issues:** keine Duplikate, keine fehlenden Pflicht-Dokumente.

## Step 2: PRD/Constraint-Analyse (Epic-8-Lens)

**Scope-Hinweis (User-Decision 2026-05-20):** Epic 8 ist Phase-2-Erweiterung und geht bewusst über die ursprüngliche PRD/Architektur/UX hinaus. Das ist akzeptiert, KEIN Traceability-Failure. Trotzdem hat Epic 8 echte PRD-Anker und bindende Cross-Cutting-NFRs, die die Story-Qualität gaten.

### PRD-Anker für Epic 8 (latente Requirements, jetzt eingelöst)

| FR | Text (Kurz) | Epic-8-Story |
|----|-------------|--------------|
| FR5 | Nutzer kann mit Mittelpunkt eines Bezirks/Kiezes statt Punkt-Adresse arbeiten | 8.1 (Level-Context Kiez/Bezirk) |
| FR12 | Boundary der ausgewählten LOR-Region/Bezirk als `--accent`-Outline | 8.3 (Polygon-Highlight, erweitert auf Level-Switch) |
| FR20 | Layer-Hits ohne Coverage explizit als „nicht vorhanden" | 8.2a/8.2b (below-threshold-Card statt Fake-Wert) |
| FR26 | Sparkline als tastatur-navigierbare LayerChart + Daten-Tabellen-Alternative | 8.1b (Primitive-A11y-Pattern, sr-only-Tabelle) |
| FR39 | WebMCP-Prompt-Template „Vergleiche diese zwei Kieze" | 8.4 + 8.5 (Multi-Level-Compare + spatial_level) |

Befund: Epic 8 ist kein Fremdkörper, sondern löst PRD-Versprechen ein, die in Phase 1 nur angedeutet waren.

### Bindende NFRs (gaten Story-Qualität, müssen in Stories adressiert sein)

| NFR | Schwelle | Relevanz für Epic 8 |
|-----|----------|---------------------|
| NFR-P2 (INP) | < 200 ms Layer-Toggle/Karten-Klick | Level-Switch + viele Mini-Charts: 8.1b/8.2b Lazy-Render Pflicht |
| NFR-P5 (Initial JS) | ≤ 200 KB gzipped, CI-Gate | LayerChart Lazy-Load (8.1b), kein Eager-Aggregat-Fetch (8.2b) |
| WCAG 2.2 AA + axe 0 Violations | Pflicht-Gate | Jedes Visual sr-only-Tabelle (8.1b), Toggle radiogroup-a11y (8.1) |
| SC 2.5.8 Target-Size | 44×44 px | Level-Toggle-Segmente (8.1), Card-Header (8.1b) |
| SC 2.4.11 Focus not obscured | Pflicht | Sticky-Toolbar mit Level-Toggle (8.1) darf Focus nicht verdecken |

### PRD-Completeness (Epic-8-Lens)

PRD deckt die Multi-Level-Tiefe NICHT vollständig ab (Phase-1-Fokus auf Punkt-Inspector). Die fachliche Aggregat-Methodik-Lücke ist durch ADR-014 geschlossen (Foundation, status Proposed). Das ist die korrekte Stelle dafür, kein PRD-Mangel. ADR-014 fungiert als De-facto-Requirements-Quelle für Epic 8.

## Step 3: Coverage-Validation (ADR-014 + Epic-8-Vision × Stories)

Da Epic 8 gegen ADR-014 statt PRD-FRs spezifiziert ist, prüft die Coverage-Matrix die ADR-014-Decisions + Epic-8-Vision-Bullets gegen die 7 Stories.

### ADR-014-Decision-Coverage

| ADR-014 Abschnitt | Inhalt | Story | Status |
|-------------------|--------|-------|--------|
| §1 Vier Spatial-Level + Default address | Level-Definition, Planungsraum intern | 8.1 | ✓ |
| §2 Aggregat-Typen (8) | numeric-median/ordinal-distribution/coverage/area/point-density/score/vote/not-aggregatable | 8.2a (rechnet) + 8.2b (liest) | ✓ |
| §3 Matrix pro Layer-Familie | Strategie + Visual-Typ + Compare-Gate pro Layer | 8.2a (strategy map) + 8.2b (adapter) + 8.1b (Visuals) | ✓ |
| §4 Visual-Summary-Pflicht | collapsed-Card mit Mini-Visual, kein blindes Collapsible | 8.1b + 8.2b | ✓ |
| §5 Compare-Modus | same-level-lock, Diff-Gate, 5-Dim-Bar-Stack | 8.4 | ✓ |
| §6 Backwards-Compat: Compare | same-level-lock | 8.4 | ✓ |
| §6 Backwards-Compat: WebMCP | optional level-Param, default address | 8.5 | ✓ |
| §6 Backwards-Compat: Disclaimer | not-aggregatable → Disclaimer-Card | 8.2b | ✓ |
| §6 Backwards-Compat: Adress-Section | Level=address bit-identisch | 8.1 + 8.2b | ✓ |
| §6 Backwards-Compat: Bookmarks | Level NICHT persistiert, Open=address-Default | — | ⚠ implizit (siehe Gap-1) |
| §7 Missing-Data-Threshold 50% | null + below-threshold-Marker | 8.2a + 8.2b | ✓ |
| §8 Output static JSON | static/layer-aggregates/ | 8.2a | ✓ |

### Epic-8-Vision-Coverage

| Vision-Bullet | Story | Status |
|---------------|-------|--------|
| Globaler Level-Selector | 8.1 | ✓ |
| Alle Sections adaptieren: numerisch + ordinal | 8.2b | ✓ |
| Alle Sections adaptieren: Kiez-Score-Hero | 8.1b | ✓ |
| Alle Sections adaptieren: Point-Layer (Kitas/ÖPNV/Stolpersteine) | 8.2b (nur erwähnt, kein harter AC) | ⚠ schwach (Gap-2) |
| Alle Sections adaptieren: Wahl-Section | — | ⚠ ungeklärt (Gap-3) |
| Karte Polygon-Highlight | 8.3 | ✓ |
| Compare über alle Levels | 8.4 | ✓ |

### Coverage-Gaps (für Step 5 priorisiert)

**Gap-1 (LOW): Bookmark-Backwards-Compat nicht explizit verankert.** ADR-014 §6 sagt Level wird nicht persistiert, Bookmark öffnet auf address-Default. Keine Story benennt das explizit. Faktisch ein No-op (8.1-Default=address deckt es ab), aber als AC in 8.1 sauberer. Empfehlung: 1 AC/Dev-Note-Zeile in 8.1 ergänzen.

**Gap-2 (MEDIUM): Point-Layer Multi-Level-Darstellung unterspezifiziert.** ADR-014 §3 definiert point-density-Visual (Distanz-Ring address / Dichte-Dot Polygon) für Kitas/Schulen/ÖPNV-Stops/Stolpersteine. 8.2a nimmt Point-Layer von der Pre-Aggregation aus (Runtime-Count), 8.2b fokussiert numeric+ordinal und erwähnt Point-Adaption nur als „optional/gleiches Muster". Wer baut die Polygon-Level-Dichte-Darstellung? Aktuell niemand mit hartem AC. Empfehlung: entweder expliziter AC in 8.2b oder eigene kleine Folge-Story 8.2c (Point-Layer-Adapter).

**Gap-3 (MEDIUM-HIGH): Wahl-Section vs. globaler Level-Context ungeklärt.** Die Wahl-Section (Epic 6, Story 6.3) hat bereits einen EIGENEN lokalen Level-Switch (Stimmbezirk/Wahlbezirk/Bezirk). Epic-8-Vision verlangt „alle Sections adaptieren" auf den globalen Level. Keine Story klärt das Verhältnis: bleibt der lokale Wahl-Switch bestehen, ordnet er sich dem globalen unter, oder Koexistenz? 8.5 (WebMCP) hat das via `spatial_level`-Naming gelöst, aber die UI-Seite (Wahl-Section im Inspector) ist offen. Empfehlung: Decision + AC in 8.2b oder neue Story.

## Step 4: UX-Alignment (Kurzcheck)

UX-Spec ist Phase-1-fokussiert (Punkt-Inspector). Multi-Level-UX wurde nicht in der UX-Spec ausdesignt, sondern in ADR-014 §4/§5 (Visual-Summary-Pflicht, Ring-vs-Bar-Stack) + User-Decisions 2026-05-20 (Datenjournalismus-Look, mehr Daten-Dichte). Das ist konsistent mit dem Scope-Hinweis: UX-Detaildesign für Epic 8 lebt im ADR + Co-Design.

Bindende UX-/A11y-Prinzipien aus UX-Spec/PRD, die in den Stories adressiert sind:
- Tastatur-Bedienung + Focus-Ringe nicht verdeckt (SC 2.4.11): 8.1-Toggle als radiogroup, sticky-Toolbar-Platzierung beachtet.
- Daten-Tabellen-Alternative für Charts (FR26-Pattern): 8.1b sr-only-Tabelle pro Primitive.
- Stigma-Disziplin (kein Rot-Grün-Wertungssprung, kein „lebenswert"): in 8.1b/8.2b/8.4 strukturell verankert.
- Mobile-First (fitBounds statt fix center, 44px-Targets): 8.1/8.3 adressiert.

Offene UX-Punkte: Ring-Detail-Design Kiez-Score-Hero (Co-Design, in 8.1b als User-Tendenz markiert), Wahl-Section-Level-UX (Gap-3).

## Step 5: Epic-Quality-Review (Kern)

Geprüft gegen create-epics-and-stories-Standards: User-Value, Independence, Forward-Dependencies, AC-Qualität, Sizing. Brownfield-Kontext (bestehender Inspector wird umgebaut).

### Dependency-Graph (Forward-Dependency-Check)

| Story | braucht | Richtung |
|-------|---------|----------|
| 8.1 | — (Foundation) | ✓ |
| 8.1b | 8.1 | ✓ rückwärts |
| 8.2a | — (unabhängige Pipeline) | ✓ |
| 8.2b | 8.1 + 8.1b + 8.2a | ✓ rückwärts |
| 8.3 | 8.1 | ✓ rückwärts |
| 8.4 | 8.1 + 8.1b + 8.2b | ✓ rückwärts |
| 8.5 | 8.1 + 8.2a + 8.2b | ✓ rückwärts |

**Befund: KEINE Forward-Dependencies.** Alle Abhängigkeiten zeigen auf niedrigere/frühere Stories. Sauberer DAG.

### AC-Qualität

Alle 7 Stories: Given/When/Then-BDD, testbar, mit Error-/Edge-Cases (null-Level, below-threshold, not-aggregatable, Backwards-Compat-Regression, same-slug-Compare). Überdurchschnittlich vollständig: 8.1 AC#5 (disabled-Level), 8.2b AC#4+#5 (address-bit-identisch + below-threshold), 8.5 AC#3 (not-aggregatable-Antwort). TDD-Sektion + AC-zu-Test-Mapping pro Story (ADR-012).

### Findings nach Severity

#### 🔴 Critical
Keine.

#### 🟠 Major

**M-1 (= Gap-3): Wahl-Section vs. globaler Level-Context. GELÖST 2026-05-20.** Decision: Wahl-Section bleibt + koexistiert, behält ihren eigenen lokalen Level-Switch und darf den globalen Level lokal für die eigene Section überschreiben. Verankert: 8.1 AC #6 + Task-1-Local-Override-Mechanik, 8.2b Dev-Note „Wahl-Section: globaler Level + lokaler Override". Kein Block mehr.

**M-2 (= Gap-2): Point-Layer-Multi-Level-Darstellung. GELÖST 2026-05-20.** Decision: Count im Polygon + Dichte pro km² (Runtime, kein Pre-Aggregat), als harter AC in 8.2b. Verankert: 8.2b AC #6 + Task 3b (`count-points-in-polygon.ts` Pure-Helper, `@turf/boolean-point-in-polygon` + `@turf/area`) + Test ≥90% + Dichte-Dot-Visual (8.1b). Stolpersteine nur Count, neutral. Kein Block mehr.

#### 🟡 Minor

**m-1: Enabler-Stories ohne eigenständigen User-Value (8.1, 8.1b, 8.2a).** Strikt nach „jede Story liefert User-Value" wären das Verstöße. Hier akzeptabel: ADR-014 + Epic-8 schreiben diese Sequenzierung explizit vor (Foundation muss vor sichtbarem UI stehen, sonst doppelt gebaute Primitive / Hacks). Bewusste Sign-off-Entscheidung, kein Defekt.

**m-2: epics.md Wave-Plan veraltet.** „Wave 3: 8.2 + 8.3 + 8.4 + 8.5 (parallel)" stimmt nicht mit dem Dependency-Graph: 8.4 + 8.5 brauchen 8.2b, können also nicht mit 8.2b parallel laufen. Der Plan datiert vor dem 8.1b/8.2a-Split. Die Story-Files korrigieren das (8.4/8.5 „nach 8.2b"). Remediation: Wave-Plan in epics.md aktualisieren (Wave 3 = 8.2a+8.3 parallel, dann 8.1b, dann 8.2b, dann 8.4+8.5).

**m-3 (= Gap-1): Bookmark-Backwards-Compat nicht als AC.** ADR-014 §6 (Level nicht persistiert, Open=address). Faktisch durch 8.1-Default abgedeckt, aber als expliziter AC/Dev-Note in 8.1 sauberer.

**m-4: ADR-014 status „Proposed", Story 8.0 in „review".** Foundation formal nicht akzeptiert, obwohl 6 abhängige Stories ready-for-dev sind. Remediation: 8.0 abschließen + ADR auf „Accepted" vor Dev-Start von 8.1.

**m-5: Sizing-Watch 8.2b + 8.4.** Beide groß (8.2b: Adapter + alle Section-Typen + Disclaimer + Load-Layer; 8.4: Merge + Hero-Bar-Stack + Diff-Gate + Doppel-Highlight). Noch im Rahmen, aber bei Implementation auf Split-Bedarf achten (Files <500 LOC).

### Best-Practices-Checkliste (Epic 8)

- [x] Epic liefert User-Value (Multi-Level-Inspector, Compare-Kieze)
- [~] Stories einzeln User-Value: 4/7 ja, 3 Enabler (begründet, m-1)
- [x] Keine Forward-Dependencies
- [x] Daten/Tabellen erst bei Bedarf (8.2a baut nur was 8.2b braucht)
- [x] Klare, testbare AC mit Edge-Cases
- [x] Brownfield: Integration + Backwards-Compat explizit
- [x] TDD-Mandat (ADR-012) pro Story verankert

## Summary and Recommendations

### Overall Readiness Status

**READY.** Beide Major-Findings am 2026-05-20 entschieden + in den Stories verankert.

Epic 8 ist gut spezifiziert: ADR-014 als solide fachliche Foundation, sauberer Dependency-DAG ohne Forward-Refs, durchgehend testbare BDD-ACs mit Edge-Cases, TDD + Backwards-Compat strukturell verankert. Story-Qualität hoch. Kein Critical-Defekt, keine offenen Major mehr.

### Gelöste Major-Findings (2026-05-20)

1. **M-1 Wahl-Section × globaler Level → GELÖST:** Koexistenz. Wahl-Section behält lokalen Switch, überschreibt globalen Level nur lokal für sich. Verankert: 8.1 AC #6 + Local-Override-Task, 8.2b Dev-Note.
2. **M-2 Point-Layer Multi-Level → GELÖST:** Count im Polygon + Dichte pro km² (Runtime). Verankert: 8.2b AC #6 + Task 3b + Test.

### Critical Issues Requiring Immediate Action

Keine. 0 Critical, 0 offene Major.

### Recommended Next Steps

1. Story 8.0 abschließen + ADR-014 status „Proposed" → „Accepted" (m-4).
2. epics.md Wave-Plan auf den realen DAG korrigieren (m-2): Wave A = 8.1; Wave B = 8.2a + 8.3 (parallel); Wave C = 8.1b; Wave D = 8.2b; Wave E = 8.4 + 8.5.
3. Bookmark-Backwards-Compat-AC in 8.1 ergänzen (m-3, optional, 1 Zeile).
4. Dev-Start mit 8.1 (Hard-Block für 4 Stories). Bei 8.2b/8.4 auf Sizing/Split achten (m-5) — 8.2b ist durch AC #6 etwas größer geworden.

### Final Note

Assessment fand 7 Findings: 0 Critical, 2 Major (beide gelöst 2026-05-20), 5 Minor (alle non-blocking, mit Remediation). Epic 8 ist implementierungsbereit. Verbleibende Minors sind Hygiene (ADR-Status, Wave-Plan-Doc, optionales Bookmark-AC).

**Scope-Kontext:** Epic 8 geht bewusst über PRD/Architektur/UX hinaus (Phase-2-Erweiterung, User-Decision 2026-05-20). Das ist akzeptiert. ADR-014 ist die maßgebliche Requirements-Quelle, und die Stories sind sauber daran ausgerichtet.

---

*Assessor: bmad-check-implementation-readiness · Scope: Epic 8 only · 2026-05-20*
