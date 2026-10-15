---
title: 'L3: Title und Meta-Description von Kiez- und Bezirksseiten mit Fakten'
type: 'feature'
created: '2026-10-14'
status: 'done'
route: 'dispatch'
baseline_commit: '468c910081176972646581bb5ea92aa35bf39112'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epic-landing-enhance.md'
  - '{project-root}/_bmad-output/implementation-artifacts/landing-investigation-l2-l6.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bezirksseiten haben 9.764 Impressionen bei 0,19 % CTR (Search Console, 3 Monate). Gesucht wird vor allem die Einwohnerzahl („kreuzberg einwohner“ 377 Impressionen, 0 Klicks, Platz ~10). Der Title nennt keine Zahl („Bezirk Friedrichshain-Kreuzberg - Berlin in Daten - navigator.berlin“), die Description endet in einer Keyword-Liste.

**Approach:** Title und Description von Kiez- und Bezirksseiten beginnen mit den gesuchten Fakten: Einwohnerzahl, Fläche in km², Stichtag, Score mit Rang. Keyword-Liste entfällt. DE und EN.

**Entscheidungen (Empfehlung, Freigabe Matze 14.10. für den Epic):**
- Title Bezirk: `{name}: {einwohner} Einwohner:innen, {km2} km² | navigator.berlin` (EN `{name}: {einwohner} residents, {km2} km² | navigator.berlin`).
- Title Kiez: `{name} ({bezirk}): {einwohner} Einwohner:innen, Kiez-Score {score} | navigator.berlin`; ohne Score ohne den Score-Teil, ohne Bezirk ohne Klammer.
- Description: erster Satz Antwort („{name} hat {einwohner} Einwohner:innen auf {km2} km² (Stand Ende 2024).“), zweiter Satz Score und Rang („Kiez-Score {score} von 100, Platz {rang} von {total} in Berlin.“), dritter Satz Nutzen („Karte, Lärm, Miete, Grün und Wahlergebnisse je Kiez.“ bzw. „… je Bezirk und Kiez.“). Fehlende Teile entfallen ohne Lücke.
- Rang folgt `formatRank`: im unteren Viertel kein Platz, sondern dessen Wortlaut (Anti-Stigma, ADR-015).
- Fläche in km² mit einer Nachkommastelle, lokalisiert (`20,3` / `20.3`).

## Boundaries & Constraints

**Always:** Werte aus den vorhandenen Page-Daten (`profile.einwohner`, `profile.flaecheHa`, `score`, `compositeRank`); Stichtag aus `static/data/einwohner-lor.json` (`stichtag`), nicht hart codiert. Zahlenformat über bestehende Formatter (`formatCount`). Builds ohne DB liefern Title/Description ohne Score/Rang.

**Never:** Keine Änderung an `seo-head.svelte`, hreflang, canonical, OG-Bildern, JSON-LD. Keine Änderung am sichtbaren Seiteninhalt (kommt in L2/L5).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Bezirk DE | Friedrichshain-Kreuzberg, 292.624, 2.033 ha, Rang 7/12 | Title „Friedrichshain-Kreuzberg: 292.624 Einwohner:innen, 20,3 km² \| navigator.berlin“; Description beginnt mit „Friedrichshain-Kreuzberg hat 292.624 Einwohner:innen auf 20,3 km² (Stand Ende 2024).“ | N/A |
| Bezirk EN | dieselben Daten, `/en/` | „292,624 residents, 20.3 km²“ | N/A |
| Kiez mit Score | Reuterstraße, Score 41, Rang 57/143 | Title mit „Kiez-Score 41“, Description mit „Platz 57 von 143“ | N/A |
| Unteres Viertel | Rang im Quartil 4 | kein „Platz X“, `formatRank`-Wortlaut | N/A |
| Ohne DB | `score` null, `compositeRank.rang` null | Title ohne Score, Description ohne zweiten Satz | N/A |
| Fehlende Fläche/Einwohner | 0 | Teil entfällt, kein „0 Einwohner:innen“ | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/kiez/[slug]/+page.svelte:46-66` und `bezirk/[slug]/+page.svelte:44-61` -- bauen Title/Description heute inline. Logik in reine Funktionen `src/lib/seo/profile-meta.ts` (`buildKiezMeta`, `buildBezirkMeta`) mit Unit-Test ziehen; Seiten rufen sie nur auf.
- `messages/de.json` ~1154-1190, `messages/en.json` -- `kiez_page_title_*`, `bezirk_page_title`, `profile_page_description`, `profile_lead_*`; neue Keys für Title/Satzbausteine, alte nur entfernen, wenn kein anderer Aufrufer (grep).
- `src/lib/data/rank-format.ts` -- `formatRank` für den Rang-Satz wiederverwenden.
- `static/data/einwohner-lor.json` -- `stichtag: "2024-12-31"`; im Server-Load lesen (Kiez- und Bezirks-`+page.server.ts`) und als `einwohnerStichtag` in Page-Daten geben; Formatierung „Ende 2024“/„end of 2024“ nur bei 31.12., sonst Datum.
- Bezirks-Score: Page-Daten haben nur `compositeRank`. Den Score DB-frei aus `static/kiez-scores/region-composites.json` (`bezirk[slug]`, gerundet) im Server-Load lesen; dieselbe Datei nutzt L1 (`compositeRank` in `src/lib/components/atlas/internal/region-focus.ts`).
- Tests: `tests/e2e/i18n-profile-frame.e2e.ts`, `i18n-d1.e2e.ts` prüfen evtl. alte Titel; anpassen.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/seo/profile-meta.test.ts`, `profile-meta.ts` -- Red/Green für alle Matrix-Zeilen inkl. EN und Längen (Title ≤ 70 Zeichen bei längstem Bezirksnamen, Description ≤ 160).
- [x] Server-Loads Kiez/Bezirk -- Stichtag (und ggf. Bezirks-Score) in Page-Daten.
- [x] Kiez-/Bezirks-`+page.svelte` -- auf `profile-meta.ts` umstellen.
- [x] `messages/de.json`, `messages/en.json` -- Keys.
- [x] E2E -- Title/Description einer Bezirks- und einer Kiez-Seite (DE, EN) gegen Preview.

**Acceptance Criteria:**
- Given `/bezirk/friedrichshain-kreuzberg` im Preview, when man `<title>` liest, then enthält er Einwohnerzahl und km².
- Given eine Kiez-Seite im unteren Viertel, when man die Description liest, then steht dort kein „Platz X von 143“.

## Implementation Notes

- Title-Grenze 80 statt 70 Zeichen: das Spec-Beispiel Friedrichshain-Kreuzberg hat bereits 78. Bei Überlänge entfällt zuerst die Marke, beim Kiez dann Score, dann Bezirk.
- Description über 160 Zeichen: der dritte Satz (Nutzen) entfällt; betrifft die meisten Kiez-Seiten.
- Bezirk nutzt „Bezirks-Score“; Rang über `formatRank`, dafür `quartil` in `compositeRank` beider Server-Loads.
- Neu: `src/lib/seo/profile-meta.ts`, `src/lib/server/profile/meta-sources.ts` (Stichtag, Bezirks-Composite DB-frei), `tests/e2e/profile-meta-fakten.e2e.ts`. Alte Keys `kiez_page_title_*`, `kiez_page_description_bezirk_part`, `bezirk_page_title`, `profile_page_description` entfernt (keine weiteren Aufrufer).
- Verifikation Subagent: Unit 351 grün, `pnpm check` 0, Build mit DB, Playwright 26/26 gegen Preview.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Edge, Blind, VerifGap | Bezirks-Score aus statischer JSON, Rang aus DB: ohne DB Score ohne Rang, mit DB Mischstand möglich | medium | patch (Score nur mit Rang) |
| Edge | `quartil` null führt zu „Platz 143 von 143“ trotz Anti-Stigma-Regel | medium | patch |
| VerifGap | `quartil`-Durchreichung in den Loadern ungetestet | medium | patch (Helfer + Unit-Test) |
| Blind | EN-Satz „…, Rank 7 of 12 in Berlin.“ groß geschrieben | low | patch |
| Blind, VerifGap | E2E: „von 143“ fest, bedingter Score-Check ohne DB wirkungslos | low | patch |
| VerifGap | Bezirks-Score-Satz im E2E nicht geprüft | medium | defer: nach Patch erscheint der Satz nur mit DB-Build; braucht DB-gestützten E2E-Lauf |
| Edge, Blind | `formatDate` zeitzonenabhängig bei Nicht-31.12.-Stichtag | low | reject: Stichtag ist 31.12., Zweig in Prod ungenutzt |
| Edge, Blind | Längen nicht garantiert (Satz 1 > 160, letzter Title-Kandidat > 80) | low | reject: längste Namen erreichen die Grenzen nicht (Kiez-Fakten-Satz ~90, kürzester Title-Kandidat ~60) |
| Edge | Tasks nennen ≤ 70 Zeichen, Code 80 | false | Abweichung in Implementation Notes dokumentiert; Fix wäre Spec-Edit |
| Blind | Stichtag passt nicht zur GeoJSON-Fallback-Einwohnerzahl | low | reject: Fallback greift nur ohne `einwohner-lor.json`, dann fehlt auch der Stichtag |
| Blind | `meta-sources.ts` dupliziert Loader, kein Cache, verschluckt Fehler | low | reject: läuft nur beim Prerender (155 Seiten), Fehler führen zu Weglassen statt Abbruch |
| Blind | Title nennt Seitentyp „Kiez“/„Bezirk“ nicht mehr | low | reject: Title-Format im frozen-Block entschieden |
| Blind | og:title/Twitter-Title ungeprüft | low | reject: `seo-head` reicht `title` durch, unverändert laut Spec |
| Blind | Fehlende Randfall-Unit-Tests (EN unteres Viertel, Rundung, ungültiges Datum) | low | reject: Logik über bestehende Fälle abgedeckt, Mehrwert gering |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/seo` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build && pnpm preview` + `pnpm exec playwright test <neue e2e>` -- expected: grün (Build vorher separat, Playwright-webServer-Timeout 60 s reicht nicht)
