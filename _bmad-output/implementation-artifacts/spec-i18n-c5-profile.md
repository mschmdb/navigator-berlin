---
title: 'i18n Block C5: Kiez- und Bezirksprofile auf Englisch'
type: 'feature'
created: '2026-09-30'
status: 'done'
baseline_commit: 'df8081d9d981fab6ac447c820a9dc336bdfa3f39'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-i18n-c4d-updates.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Auf `/en/kiez/<slug>` und `/en/bezirk/<slug>` ist das Prosa-Profil (143 Kieze, 12 Bezirke) deutsch und mit `lang="de"` markiert. `getProfileParagraphs` kennt keine Locale.

**Approach:** Je Profil eine Schwesterdatei `<slug>.en.md` (Muster C4d) mit der abgenommenen Übersetzung aus `_bmad-output/implementation-artifacts/c5-profiles-en/`. Der Loader liefert die Seiten-Locale mit DE-Fallback, die Hero-Komponenten setzen `lang` nur bei Fallback. `lint:profiles` prüft die EN-Fassungen mit.

## Boundaries & Constraints

**Always:**
- Frontmatter EN: `slug`, `name`, `pageType`, `locale: en`, `sourceInputHash` (= `inputHash` der DE-Datei), `model`, `translatedAt`.
- `lint:profiles` prüft jede `.en.md`: Zahlen gedeckt (gleicher `factLint`, EN-Dezimalpunkt), keine Dashes, EN-Stigma-Liste (crime, criminal, dangerous, unsafe, safe area/neighbourhood, burglary, robbery, deprived, rundown o. ä.), `sourceInputHash` = aktueller `inputHash` (sonst STALE: DE wurde neu generiert, EN veraltet), verwaiste `.en.md` = FAIL. Ausgabe zählt DE und EN getrennt.
- Fehlt die `.en.md` oder ist sie STALE, zeigt `/en` das DE-Profil mit `lang="de"`. Kein stiller DE-Text ohne `lang`.
- DE-Profile, DE-Seiten und der Generator `build-kiez-profiles.ts` bleiben unverändert. Ein Neu-Generieren von DE macht EN sichtbar STALE (Lint), nicht still falsch.
- `llms`-Export (`data-collector.ts`) bleibt DE (Boundary Nicht-UI-Konsumenten).
- TDD pro AC.

- Entscheidung Matze 30.09. 17:29: Stichprobe abgenommen. DE-Korrektur in 6 Profilen „Grünversorgung gilt als schlecht“ → „gilt als gering“ (neutrale Skala Story 1.22), EN „rated low“. Vom Koordinator bereits in `src/lib/content/*-profile/` und `c5-profiles-en/` angewendet.

**Never:**
- Keine Registrierung von `/kiez`, `/bezirk` (Abschluss-Block, braucht Gesamt-Audit der Seiten).
- Keine weitere Änderung an DE-Prosa, keine Neu-Generierung.
- Keine Übersetzung zur Laufzeit.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kiez EN | `/en/kiez/<slug>` mit `.en.md` | Profil englisch, kein `lang="de"` | N/A |
| Bezirk EN | `/en/bezirk/<slug>` | Profil englisch | N/A |
| EN fehlt | nur DE-Datei | DE-Profil mit `lang="de"` | N/A |
| EN veraltet | `sourceInputHash` ≠ `inputHash` | `/en` zeigt DE mit `lang="de"`, Lint meldet STALE | Lint Exit 1 |
| DE-Seite | `/kiez/<slug>` | unverändert | N/A |
| Ungedeckte Zahl EN | Zahl nicht in Daten | Lint FAIL mit Slug | Exit 1 |

</frozen-after-approval>

## Code Map

- `src/lib/server/profile/get-profile.ts` -- `getProfileParagraphs(pageType, slug)` → Locale-Parameter, Ergebnis mit Inhalts-Locale; Staleness gegen DE-`inputHash` aus dem DE-Frontmatter.
- `src/routes/(with-header)/kiez/[slug]/+page.server.ts`, `bezirk/[slug]/+page.server.ts` -- Locale übergeben, `profileLocale` wie `faqLocale` (C3) durchreichen.
- `src/lib/components/atlas/kiez-hero.svelte`, `bezirk-hero.svelte` (`:171-180`) -- `lang` nur bei Abweichung, Kommentare aktualisieren.
- `src/lib/server/llms/data-collector.ts` -- ruft weiter ohne Locale (DE).
- `scripts/lint-profiles.ts`, `scripts/lib/profiles/fact-lint.ts` -- EN-Durchlauf, EN-Stigma-Muster, STALE/Orphan für `.en.md`. Tests `fact-lint.test.ts`.
- `src/lib/content/{kiez,bezirk}-profile/*.en.md` -- 155 Dateien aus `c5-profiles-en/`.
- Tests: Hero-Komponententests (`kiez-hero.svelte.test.ts`, `bezirk-hero.svelte.test.ts`), e2e `i18n-profile-frame.e2e.ts` (erwartet heute DE-Profil mit `lang="de"`).

## Tasks & Acceptance

**Execution:**
- [x] `fact-lint` EN-Stigma + `lint-profiles` EN-Durchlauf (+ Tests, rot vor den Dateien)
- [x] `get-profile` Locale + Staleness-Fallback (+ Tests)
- [x] Loader + Heroes: `profileLocale`, `lang` nur bei Fallback (+ Tests)
- [x] 155 `.en.md` übernehmen, `pnpm lint:profiles` grün (DE und EN)
- [x] e2e `i18n-profile-frame`: Profil EN ohne `lang="de"` (Kiez und Bezirk), DE-Kontrolle
- [x] Zeitmessung

**Acceptance Criteria:**
- Given alle 155 `.en.md`, when `pnpm lint:profiles` läuft, then meldet es für DE und EN `failed=0 stale=0`.
- Given `/en/kiez/<slug>`, when die Seite lädt, then ist das Profil englisch und ohne `lang="de"`.

## Implementation Notes

- 30.09. Umsetzung 17:28-17:36 (Dev-Agent). `getLocalizedProfile` (Locale + Stale-Fallback), `getProfileParagraphs` bleibt DE (llms). `en-status.ts` klassifiziert `.en.md` (ok/stale/orphan). Heroes: Prop `profileLocale`, `lang` nur bei Abweichung. Verifikation: vitest 5314 grün, check 0 Fehler, lint:profiles DE/EN failed=0 stale=0, Build grün, e2e `i18n-*` 169/169 (Port 4180).

- Koordinator 30.09.: Übersetzung 17:14-17:16 (8 Subagenten, je ~20 Profile), maschinelle Prüfung aller 155, Stichprobe 15 abgenommen 17:29. Umsetzung 17:29-17:36, Review 17:36-17:38, Patches 17:38-17:41, Verifikation 17:41-17:58. Gesamt ohne Wartezeit rund 50 min.
- DE-Korrekturen (Matze-Linie „DE-Fehler mitkorrigieren“, Skala Story 1.22): Grünversorgung „schlecht“ → „gering“ (9 Profile), „gut“ → „hoch“ (26 Profile), EN entsprechend „low“/„high“, einheitlich „green space provision“, „ranks one“ → „ranks first“.
- Staleness zweistufig: `sourceInputHash` (Daten) und `sourceTextHash` (DE-Text). Lint prüft zusätzlich fehlende/leere EN, Slug, Absatzzahl.
- Verifikation: `lint:profiles` meldete einmal EN failed=142 bei leeren Rang-Tabellen (CASCADE-Wipe, siehe Memory), nach `pnpm build` (prebuild füllt rank/comparison) DE und EN failed=0 stale=0.
- Qualität: 28 Review-Funde in 15 Einträgen, 9 gepatcht, 2 deferred, 4 rejected.

## Spec Change Log

## Review Triage Log

Runde 1 (30.09.2026 17:37), 3 Layer: Blind Hunter (BH) 14, Edge Case (EC) 10, Verification Gap (VG) 2 + 2. P = patch, R = reject, D = defer.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | VG/BH | EN-Durchlauf von `lint-profiles` ungetestet | medium | nur Helfer getestet | P: reine Funktion + Tmpdir-Tests |
| 2 | EC/BH/VG | fehlende/leere `.en.md`, Slug-Abweichung, Absatzzahl nicht geprüft | medium | grüner Lint beweist keine Vollständigkeit | P |
| 3 | BH | STALE erkennt keine DE-Textänderung | medium | diese Story ändert selbst DE-Text | P: `sourceTextHash` |
| 4 | BH | Grünversorgung „gut“ bleibt, Skala unvollständig | low | Story 1.22 | P (Koordinator: 55 Dateien, „hoch“) |
| 5 | BH | „ranks one“, „Green provision“ uneinheitlich | low | | P (Koordinator) |
| 6 | EC/BH | EN-Tausendertrennzeichen, EN-Stigma-Liste lückenhaft | low | | P |
| 7 | EC | `profileLocale` Default `'de'` | low | WCAG 3.1.2 | P |
| 8 | BH/EC | ungeprüfter Locale-Cast | low | | P |
| 9 | VG | em-dash in `lint-profiles.ts:27` | low | Projektregel | P |
| 10 | BH | Korrektur hält nicht über Neu-Generierung (Generator-Prompt) | low | Spec: Generator unverändert | D |
| 11 | BH | Zahlwörter („rank five“) vom Zahlen-Lint nicht erfasst | low | auch in DE so | D |
| 12 | BH | „soziale Lage niedrig“ | low | vom Generator-Prompt erlaubt, treu übersetzt, Stichprobe abgenommen | R |
| 13 | BH | „Kieze“ im EN-Text | false | Glossar: Plural bleibt deutsch | R |
| 14 | BH | e2e-Sprachheuristik fragil | low | `\b` schützt vor Eigennamen-Treffern | R |
| 15 | BH | `.en.md` nicht im Diff, Spec-Widersprüche, Zählung 6/9 | low | Diff bewusst ohne Inhalte; Spec-Notes korrigiert in Step 5 | R |

## Verification

**Commands:**
- `pnpm exec vitest run` -- expected: alle grün -- **grün**: 5334/5335, `winner-map`-Flake isoliert grün
- `pnpm check` -- expected: 0 Fehler -- **grün**
- `pnpm lint:profiles` -- expected: DE und EN `failed=0 stale=0` (braucht lokale DB mit frischem Rank/Comparison, sonst `pnpm data:rank && pnpm data:comparison`) -- **grün** nach vollem Build
- `pnpm lint:wahl`, `pnpm lint:cleartext` -- expected: 0 Verstöße -- **grün**
- `pnpm build` (voll) + e2e `i18n-*` -- expected: grün (Port 4173 belegt: temporäre Config, danach löschen; `static/kiez-scores/region-composites.json` zurücksetzen) -- **grün**: Build 0 Fehler, e2e 176/176 (2 Läufe)
