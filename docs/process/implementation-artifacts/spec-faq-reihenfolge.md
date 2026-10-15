---
title: 'FAQ-Reihenfolge stabil nach YAML-Position'
type: 'bugfix'
created: '2026-09-30'
status: 'done'
baseline_commit: 'c5f4ac0dd0dabc29b3a4e2b5679a9a34d82993fd'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `getFaqQna` (`src/lib/server/db/queries/get-faq-qna.ts`) liest `faq_qna` ohne ORDER BY. Die FAQ-Reihenfolge auf Kiez-, Bezirk- und Layer-Seiten hängt damit von der physischen Zeilenfolge nach TRUNCATE+INSERT ab. Postgres garantiert sie nicht. DE und EN können so unterschiedlich sortiert sein.

**Approach:** `faq_qna` bekommt eine Spalte `sort_order` (integer). `render-faq.ts` schreibt die redaktionelle Position: Cluster-Reihenfolge `CLUSTER_KEYS`, dann YAML-Position des Templates. `getFaqQna` sortiert nach `sort_order`.

## Boundaries & Constraints

**Always:**
- Die heutige, gewollte Reihenfolge bleibt: laerm, gruen, oepnv, wohnen, klima, darin YAML-Reihenfolge. DE und EN haben je Seite dieselbe Reihenfolge der `template_id`.
- Migration additiv über `pnpm db:generate` (neue Datei in `drizzle/migrations/`), Spalte `NOT NULL DEFAULT 0`. Prod migriert beim Deploy im `prebuild` (`pnpm db:migrate`), danach befüllt `data:faq` die Werte.
- Die Positionsvergabe ist eine reine Funktion mit Unit-Test. TDD.

**Never:**
- Kein Sortieren nach `template_id` oder `cluster` alphabetisch (ändert die redaktionelle Reihenfolge).
- Kein Fix des Cluster-Filters in `renderAll` (eigener deferred-Eintrag).
- Keine Änderung an Texten oder am Primary Key.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kiez DE | 5 Cluster mit Templates | Reihenfolge laerm → klima, je YAML-Position | N/A |
| Kiez EN | EN-Zeilen | gleiche `template_id`-Folge wie DE | N/A |
| Übersprungenes Template | `requires` fehlt, Template nicht gerendert | Lücke in `sort_order` erlaubt, Reihenfolge bleibt | N/A |
| Alte Zeilen | Migration ohne `data:faq` | alle `sort_order = 0`, Seite rendert wie bisher | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/server/db/schema/faq-qna.ts` -- Spalte `sortOrder: integer('sort_order').notNull().default(0)`.
- `drizzle/migrations/` -- neue Migration per `pnpm db:generate` (letzte: `0010_cute_tiger_shark.sql`), inkl. `meta/`-Snapshot.
- `src/lib/server/faq/load-templates.ts` -- iteriert schon `CLUSTER_KEYS` in fester Reihenfolge. Hier oder daneben: reine Funktion, die je `(cluster, templateId)` eine globale Position liefert.
- `scripts/render-faq.ts` -- `RenderedRow` + `upsertRows` schreiben `sortOrder`.
- `src/lib/server/db/queries/get-faq-qna.ts` -- `.orderBy(faqQna.sortOrder)` in `getFaqQna` (auch `getFaqForPage` nutzt es).
- Tests: Positionsfunktion (neu), `get-faq-for-page.test.ts` bleibt grün. `detail-faq-invariant.test.ts` prüft DE/EN-ID-Reihenfolge schon.

## Tasks & Acceptance

**Execution:**
- [x] Positionsfunktion + Unit-Test (Cluster-Folge, YAML-Folge, DE = EN)
- [x] Schema + Migration generieren
- [x] `render-faq.ts` schreibt `sortOrder`
- [x] `getFaqQna` sortiert nach `sortOrder`
- [x] `deferred-work.md`: Eintrag „`getFaqQna` hat kein ORDER BY“ als erledigt markieren (Verweis auf diese Spec)

**Acceptance Criteria:**
- Given lokale DB nach `pnpm db:migrate` und `pnpm data:faq`, when `/kiez/<slug>` und `/en/kiez/<slug>` gerendert werden, then erscheinen die FAQ in derselben `template_id`-Folge wie in den YAML-Dateien.

## Implementation Notes

- 30.09. Spec 07:44, Abnahme Matze 07:46, Umsetzung 07:46-07:50, Review 07:50-07:52, Patches 07:52-07:55, Verifikation 07:55-08:02.
- `computeFaqPositions` (neu, `src/lib/server/faq/faq-positions.ts`): Cluster-Folge, dann YAML-Position, DE-Folge hat Vorrang. `render-faq.ts` wirft bei fehlender Position. Query sortiert `sort_order, cluster, template_id`.
- Migration `0011_spooky_mantis.sql` (additiv, `DEFAULT 0`). Prod: `db:migrate` und danach `data:faq` im `prebuild`.
- AC-Test: e2e `FAQ-Folge Kiez (sort_order)` mit Helper `tests/e2e/faq-order.ts`, DE und EN gleiche Template-Folge in YAML-Reihenfolge.
- Qualität: 14 Review-Funde, 7 gepatcht (1 davon als eigener Commit 5307ee2), 4 rejected.

## Spec Change Log

## Review Triage Log

Runde 1 (30.09.2026 07:52), 3 Layer: Blind Hunter (BH) 10, Edge Case (EC) 1, Verification Gap (VG) 2 + 1. P = patch, R = reject.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/VG | AC (Folge = YAML, DE = EN) ohne Test, `.orderBy` entfernen bliebe grün | medium | e2e explizit ordnungsunabhängig, Query-Tests nur leere Ergebnisse | P: e2e-Reihenfolge-Assertion |
| 2 | BH/VG | `?? 0` verschluckt fehlende Position | medium | kollidiert still mit Position 0 | P: werfen |
| 3 | BH/EC/VG | kein Tiebreaker bei `sort_order`-Gleichstand | low | nur zwischen `db:migrate` und `data:faq` im `prebuild`, Fix trivial | P: `cluster`, `templateId` als Zweitschlüssel |
| 4 | BH | irreführender Testname DE=EN | low | Map hat keinen Locale-Key | P |
| 5 | BH | `as unknown as LoadedTemplate` im Test | low | Projektregel typsicher | P |
| 6 | BH | `faqPositionKey(cluster: string)` | low | `ClusterKey` existiert | P |
| 7 | BH | e2e-Textkorrekturen aus c5f4ac0 im Diff | low | gehört zum Umweltatlas-Fix | P (Koordinator: eigener Commit 5307ee2) |
| 8 | BH | Diff ohne `meta/`-Snapshot | false | vom Koordinator bewusst ausgeschlossen, Dateien liegen vor | R |
| 9 | BH | SQL ohne Newline am Ende | low | von drizzle-kit generiert | R |
| 10 | BH | Spec ohne Notes/Verification | low | Fix editiert Spec, folgt in Step 5 | R |
| 11 | BH | kein Duplikat-Check für `template.id` | low | Duplikat scheitert laut am Primary Key beim Insert | R |

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün -- **grün**: 5034/5034
- `pnpm check` -- expected: 0 Fehler -- **grün**
- `pnpm db:migrate && pnpm data:faq` lokal -- expected: `sort_order` befüllt, SQL-Stichprobe Reihenfolge = YAML -- **grün** (5242 Q&As)
- `pnpm build` + e2e `i18n-profile-frame`, `i18n-layer-frame` -- expected: grün (Port 4173 ist belegt: temporäre Config auf freiem Port, danach löschen) -- **grün**: Build 0 Fehler, e2e 78/78
