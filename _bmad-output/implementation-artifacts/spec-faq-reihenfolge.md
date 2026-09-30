---
title: 'FAQ-Reihenfolge stabil nach YAML-Position'
type: 'bugfix'
created: '2026-09-30'
status: 'draft'
baseline_commit: '1e5d86bbb71bd38fbb5acdc34209c4b6debd062d'
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
- [ ] Positionsfunktion + Unit-Test (Cluster-Folge, YAML-Folge, DE = EN)
- [ ] Schema + Migration generieren
- [ ] `render-faq.ts` schreibt `sortOrder`
- [ ] `getFaqQna` sortiert nach `sortOrder`
- [ ] `deferred-work.md`: Eintrag „`getFaqQna` hat kein ORDER BY“ als erledigt markieren (Verweis auf diese Spec)

**Acceptance Criteria:**
- Given lokale DB nach `pnpm db:migrate` und `pnpm data:faq`, when `/kiez/<slug>` und `/en/kiez/<slug>` gerendert werden, then erscheinen die FAQ in derselben `template_id`-Folge wie in den YAML-Dateien.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün (bekannter Flake `winner-map.svelte.test.ts`)
- `pnpm check` -- expected: 0 Fehler
- `pnpm db:migrate && pnpm data:faq` lokal -- expected: `sort_order` befüllt, SQL-Stichprobe Reihenfolge = YAML
- `pnpm build` + e2e `i18n-profile-frame`, `i18n-layer-frame` -- expected: grün (Port 4173 ist belegt: temporäre Config auf freiem Port, danach löschen)
