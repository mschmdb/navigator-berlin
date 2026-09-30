---
title: 'i18n Block C3: FAQ auf Englisch'
type: 'feature'
created: '2026-09-30'
status: 'done'
baseline_commit: 'f5cf128465b6171a4117283bc548338d1df26f03'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-005-i18n-paraglide.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-c2-layer-methodik.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Auf `/en/kiez/<slug>`, `/en/bezirk/<slug>` und `/en/layer/<slug>` ist die FAQ deutsch und mit `lang="de"` markiert. Die drei Loader fragen `faq_qna` hart mit `locale: 'de'` ab. Der Renderer ignoriert `ctx.locale` und setzt deutsche Slot-Werte ein.

**Approach:** Wir übernehmen die abgenommene Übersetzung aus `c3-uebersetzung.json` als `*.en.yaml` je Cluster. `pnpm data:faq` rendert dann DE- und EN-Zeilen in `faq_qna`, die Spalte `locale` existiert schon. Die Loader fragen die Seiten-Locale ab und fallen auf DE zurück, wenn keine EN-Zeilen da sind.

## Boundaries & Constraints

**Always:**
- Übersetzung: `_bmad-output/implementation-artifacts/c3-uebersetzung.json` (DE wörtlich, EN abgenommen), Entscheidungen in `c3-uebersetzung-review.md`.
- EN-Templates haben dieselben `id`, `applicableTo`, `requires` und dieselbe Slot-Menge wie DE. Ein Test erzwingt das. `editorialNote` fehlt in EN.
- DE-Ausgabe Zeichen für Zeichen gleich: bestehende Renderer-Tests bleiben unverändert grün.
- EN-Slots sind englisch: Kategorien und Erklärungen über die Helper mit `opts.locale`, `formatRank` mit Locale, Stand als „June 2023“, Zahlen `en-GB`, Vergleich „about the same as / above / below the district average“ bzw. „the Berlin median“, Layer-Name über `getLayerDisplayName(slug, { locale })`.
- Fallback: Fehlen EN-Zeilen für eine Seite, zeigt sie DE mit `lang="de"` am Accordion. Sonst kein `lang`.
- FAQPage-JSON-LD spiegelt den sichtbaren Inhalt (Google-Vorgabe). Übrige JSON-LD bleibt nach B4b-Linie DE.
- Anti-Stigma (ADR-015): `wohnen-stigma-disclaimer` existiert auch in EN. Quartil 4 bleibt „bottom quartile“ ohne Platzzahl.
- TDD pro AC.

- Entscheidung Matze 30.09. 07:09: DE-Fehler mitkorrigieren. Einzige DE-Änderung: `gruen-was-bedeutet-versorgung` nennt „gut", „mittel" oder „gering" statt „hoch", … (DE-Spalte in `c3-uebersetzung.json` ist maßgeblich). „Vier Stufen" im MSS stimmt und bleibt.

**Never:**
- Keine weitere DE-Textänderung, keine Schema-Migration.
- Kein Register-Eintrag `/layer`, `/kiez`, `/bezirk` (Abschluss-Block, `/kiez` `/bezirk` brauchen C5).
- Kein Fix des Cluster-Filters in `renderAll` (jede Layer-Seite bekommt alle 17 Layer-Templates), nur Eintrag in `deferred-work.md`.
- `hitze-faq.ts` gehört zu C4c. llms, WebMCP, KI-Export bleiben unberührt.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kiez EN | `/en/kiez/<slug>` | FAQ englisch, Rang/Vergleich englisch, kein `lang="de"` | N/A |
| Quartil 4 EN | Kiez im unteren Viertel | „bottom quartile“, keine Platzzahl | N/A |
| Layer EN | `/en/layer/<slug>` | FAQ englisch, `{name}` = EN-Layer-Name | N/A |
| EN fehlt | nur DE-Zeilen in DB | DE-FAQ mit `lang="de"`, JSON-LD DE | N/A |
| DE unverändert | `/kiez/<slug>` | Texte identisch zu vorher | N/A |
| Keine DB | `DATABASE_URL` fehlt | FAQ leer wie bisher | WARN wie bisher |

</frozen-after-approval>

## Code Map

- `src/lib/data/faq-templates/{cluster}/{cluster}.en.yaml` -- neu, aus `c3-uebersetzung.json` erzeugt. Loader (`src/lib/server/faq/load-templates.ts:48`) und Schema erkennen `en` schon.
- `src/lib/server/faq/template-renderer.ts` -- `buildSlotMap` locale-fähig: Helper `*De(raw, { locale })` (`src/lib/data/faq-helpers/*.ts`, B4a), `formatRank(…, { locale })`, `sourceLabel(slug, { locale })`, `formatSourceStand(iso, locale)`, `toLocaleString` je Locale, `compareDirection` je Locale. `MetricContext.compareLabel: string` → `compareKind: 'bezirk' | 'berlin'`, Label je Locale (Paraglide-Message oder lokale Map, DE-Werte „Bezirksschnitt“/„Berlin-Median“ unverändert).
- `scripts/render-faq.ts` -- `compareKind` statt Label (`:104`, `:130`). Layer-Targets: Name je Locale statt `t.label` (DE bleibt `t.label`). `slugToDisplayName` für Kiez/Bezirk bleibt (locale-neutral).
- `src/lib/server/db/queries/get-faq-qna.ts` -- neue Funktion mit DE-Fallback, liefert `{ items, locale }`. Ersetzt die dreifach duplizierte `tryLoadFaq` in `src/routes/(with-header)/{bezirk,kiez,layer}/[slug]/+page.server.ts` (`:44`, `:84`, `:35`), Kommentare „FAQ bleibt DE“ anpassen.
- `src/lib/components/atlas/faq-section.svelte` -- Prop für die Inhalts-Locale, `lang="de"` nur bei Fallback (`:57`), Kopf-Kommentar anpassen.
- `src/lib/server/faq/detail-faq-invariant.test.ts` -- EN-Parität (IDs, `applicableTo`, `requires`, Slots), Disclaimer in EN.
- Tests mit DE-Erwartung: `tests/e2e/i18n-profile-frame.e2e.ts:112-133`, `tests/e2e/i18n-layer-frame.e2e.ts:17`, `load-templates.test.ts:19`, `faq-section.svelte.test.ts`, `layer/[slug]/page.svelte.test.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/data/faq-templates/*/*.en.yaml` -- aus der Übersetzung erzeugen -- Parity-Test (IDs, Felder, Slots, DE-Spalte = YAML)
- [x] `template-renderer.ts` + `render-faq.ts` -- Slots locale-fähig, `compareKind` -- Tests EN je Slot-Gruppe, Quartil 4, DE-Tests unverändert
- [x] `get-faq-qna.ts` + drei Loader -- Locale + DE-Fallback, `tryLoadFaq` zusammenführen -- Unit-Test Fallback
- [x] `faq-section.svelte` -- `lang` nur bei Fallback, JSON-LD folgt Inhalt -- Komponententest
- [x] e2e `i18n-profile-frame`, `i18n-layer-frame` -- FAQ EN ohne `lang="de"`, DE-Kontrolle
- [x] `deferred-work.md` -- Cluster-Filter-Bug in `renderAll` eintragen
- [x] Zeitmessung

**Acceptance Criteria:**
- Given eine befüllte DB nach `pnpm data:faq`, when `faq_qna` gelesen wird, then existieren je Seite DE- und EN-Zeilen mit gleichen `template_id`.
- Given `/en/kiez/<slug>` mit FAQ, when die Seite lädt, then sind Fragen und Antworten englisch, ohne `lang="de"`, und das FAQPage-JSON-LD ist englisch.

## Implementation Notes

- 30.09. 06:50 Inventur C3/C4 (2 Explore-Subagenten), 06:53 Übersetzung (Subagent, 06:54-06:56), Spec 06:55. Abnahme Matze 07:09 („approve and continue“, DE-Fehler mitkorrigieren).
- EN-Templates als `*.en.yaml` aus `c3-uebersetzung.json`. Einzige DE-Änderung: `gruen-was-bedeutet-versorgung` („gut“ statt „hoch“). MSS „vier Stufen“ geprüft und korrekt (`si_v`).
- Renderer: `compareKind` statt `compareLabel`, Phrasen und Zahlen-/Datumsformat je Locale, EN-Rang im Satz klein („rank 12 of 143“).
- Loader: `getFaqForPage` mit DE-Fallback ersetzt dreifaches `tryLoadFaq`, liefert `faqLocale`. `FaqSection.contentLocale` setzt `lang` nur bei Abweichung. `/hitze` übergibt `contentLocale="de"`, damit `/en/hitze` sein `lang="de"` behält (FAQ dort C4c).
- Lokale DB: `data:rank`, `data:comparison`, `data:faq` neu befüllt (CASCADE-Wipe). DE und EN je Seitentyp gleiche Zeilenzahl (Bezirk 132, Kiez 1282, Layer 1207).
- Vorbestehende ESLint-Fehler, nicht angefasst: ungenutzter Import `AggregateValue` in `render-faq.ts`, `svelte/no-navigation-without-resolve` in `faq-section.svelte`.
- Zeitmessung: Umsetzung 07:10-07:18 (8 min), Review 07:18-07:21, Patch-Runde 07:21-07:23, Verifikation 07:23-07:31. Gesamt ohne Wartezeit rund 40 min.
- Qualität: 18 Review-Funde, 7 gepatcht, 2 deferred (plus 1 Beifund Methodik Grün), 9 rejected.

## Spec Change Log

## Review Triage Log

Runde 1 (30.09.2026 07:21), 3 Layer: Blind Hunter (BH) 14, Edge Case (EC) 2, Verification Gap (VG) 2 + 1. Triage Koordinator. P = patch, R = reject, D = defer.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH | EN-Rang „(Rank 12 of 143)“ mitten im Satz groß | low | `rank_format_placed` ist UI-Label, Renderer-Test pinnt die Form | P: „rank“ klein im EN-Slot |
| 2 | VG | EN-Slots nur teilweise getestet, `opts`-Verlust bliebe grün | medium | Mix-Test besteht schon durch Zahlenformat | P: Voll-Fixture EN |
| 3 | VG/BH | `faqLocale`-Durchreichung in Kiez/Bezirk/Layer ungetestet | medium | Hero-Tests ohne `faqLocale`, Layer-Tests mit `faq: []` | P: Fallback-Tests je Konsument |
| 4 | EC | e2e-Regex auf erste Frage flakt, `getFaqQna` ohne ORDER BY | medium | „Does …“ bzw. „Berücksichtigt …“ nicht in Regex | P: ordnungsunabhängige Assertion |
| 5 | BH | Test liest Planungsartefakt `c3-uebersetzung.json` | low | cwd-relativ, bricht beim Archivieren | P: Test entfernen |
| 6 | BH | Doc-Kommentar `formatSourceStand` veraltet | low | sagt „deutsches Monat YYYY“ | P |
| 7 | BH | Review-MD „Unsicher“ nennt überholte EN-Fassungen | low | Korrektur nur unter „Abnahme“ | P (Koordinator) |
| 8 | EC | FAQ-Reihenfolge auf der Seite nicht deterministisch | medium, unverifiziert | vorbestehend, `getFaqQna` ohne ORDER BY; ORDER BY `template_id` würde die redaktionelle Reihenfolge ändern | D |
| 9 | BH | `laerm-welche-quellen` („nur Straßenverkehrslärm“) widerspricht Layer-Erklärung („Straßen-, Schienen- und Fluglärm“) | medium, unverifiziert | vorbestehender DE-Inhalt, Quelle (Umweltatlas) muss klären, welche Aussage stimmt | D |
| 10 | BH | `laerm-warum-keine-db-werte` EN „medium/high“ ≠ UI „moderate/loud“ | false | Satz zitiert die publizierten Datenklassen (`kategorie`: gering/mittel/hoch), EN übersetzt treu | R |
| 11 | BH | FAQPage-JSON-LD ohne `inLanguage` bei DE-Fallback | low | Fallback tritt nur ohne EN-Zeilen auf, Build rendert beide Locales | R |
| 12 | BH | AC1 (DE+EN-Zeilen je Seite) ohne automatisierten Test | low | lokal verifiziert: je Seitentyp gleiche Zeilenzahl DE/EN; Test bräuchte DB | R |
| 13 | BH/VG | `localizedName` ohne sichtbare Wirkung, DE-Fallback in `getLayerDisplayName` | low | keines der Layer-Templates nutzt `{name}` | R |
| 14 | BH | kein EN-Test in `load-templates.test.ts` | false | `detail-faq-invariant.test.ts:43` fordert je Cluster eine EN-Datei | R |
| 15 | BH | Spec unvollständig (Zeitmessung, Notes) | low | Fix editiert Spec, folgt in Step 5 | R |
| 16 | BH | `*De`-Helpernamen liefern EN | low | Umbenennung außerhalb Scope, Kommentare B4a erklären es | R |
| 17 | BH | „Milieuschutz“, „Mietspiegel Wohnlage“ ohne Erklärung | low | Glossar-Entscheidung, Übersetzung abgenommen | R |
| 18 | BH | holprige EN-Sätze (Wohnlage, bottom quartile) | low | in der Abnahme bekannt und akzeptiert | R |

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün -- **grün**: 5027/5028, 1 bekannter Flake `winner-map.svelte.test.ts`
- `pnpm check` -- expected: 0 Fehler -- **grün**
- `pnpm lint:wahl` und `pnpm lint:cleartext` -- expected: 0 Verstöße -- **grün**
- `pnpm build` gegen lokale Postgres + e2e `i18n-profile-frame`, `i18n-layer-frame`, `i18n-routing` -- expected: grün -- **grün**: Build 0 Fehler, e2e 77/77 (temporäre Config auf Port 4199, weil ein alter `vite preview` Port 4173 belegt)
