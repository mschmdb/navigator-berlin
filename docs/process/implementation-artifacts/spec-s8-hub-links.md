---
title: 'S8: Detailseiten verlinken die Übersichtsseiten; Layer-lastmod mit Abrufdatum'
type: 'feature'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: '4a547ed'
review_loop_iteration: 0
context:
  - '{project-root}/docs/process/implementation-artifacts/spec-s7-uebersichtsseiten.md'
  - '{project-root}/docs/process/implementation-artifacts/spec-s5-sitemap-build-haerte.md'
---

<frozen-after-approval reason="human-owned intent, do not modify unless human renegotiates">

## Intent

**Problem:** Die Übersichtsseiten `/kieze`, `/bezirke` und `/daten` (S7) sind nur aus Footer, Menü-Drawer, Sitemap und `llms.txt` verlinkt. Kiez-, Bezirks- und Layer-Seiten führen nicht dorthin; Besucher aus der Suche landen auf Detailseiten und sehen keinen Weg zur Übersicht. Außerdem tragen 15 Layer als `sourceUpdatedAt` einen Jahres-Platzhalter (`YYYY-01-01`); `lastmod` steigt deshalb bei einem Daten-Refresh nicht.

**Approach:** Je Detailseitentyp ein kontextbezogener Link zur passenden Übersicht. Layer-`lastmod` = späteres Datum aus `sourceUpdatedAt` und `fetchedAt`.

**Entscheidungen (Matze 15.10.2026: „mach die kleine Folge-Story“, Layer-lastmod „wie du empfiehlst“):**
- Kiez-Seite: Link „Alle Kieze in {Bezirk}“ auf `/kieze#bezirk-<slug>` (Sprungziel aus S7).
- Bezirksseite: Links „Alle Kieze in {Bezirk}“ auf `/kieze#bezirk-<slug>` und „Alle Bezirke“ auf `/bezirke`.
- Layer-Seite: Link „Alle Daten-Layer“ auf `/daten`.
- Platzierung dort, wo die Seite schon auf Nachbarn oder Verwandtes verweist (Gestalt: Nähe zu verwandten Links), nicht im Hero.
- Layer-`lastmod`: `latestLastmod([sourceUpdatedAt, fetchedAt])`.

## Boundaries & Constraints

**Always:** DE/EN, `localizedHref` für sichtbare Links. Barrierefrei: sprechender Linktext, keine reinen Icon-Links. Hero-Struktur (Gestalt-QA-Fix) unverändert. Tests zuerst.

**Never:** Keine neue Navigation im Header, keine Änderung an Startseite, Titeln, JSON-LD.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kiez | `/kiez/reuterstrasse` | Link „Alle Kieze in Neukölln“ auf `/kieze#bezirk-neukoelln` | ohne Bezirk: „Alle Kieze“ auf `/kieze` |
| Bezirk | `/bezirk/pankow` | Links auf `/kieze#bezirk-pankow` und `/bezirke` | N/A |
| Layer | `/layer/laerm-2023` | Link „Alle Daten-Layer“ auf `/daten` | N/A |
| EN | `/en/kiez/reuterstrasse` | Links mit `/en/…`, EN-Text | N/A |
| Layer-lastmod | `sourceUpdatedAt` 2022-05-15, `fetchedAt` 2026-10-14 | `lastmod` 2026-10-14 | ungültige Werte entfallen |

</frozen-after-approval>

## Tasks & Acceptance

**Execution:**
- [x] Kiez-, Bezirks-, Layer-Seite: Links + Komponententests DE/EN.
- [x] Anker der Links gegen die Sprungziel-IDs auf `/kieze` abgleichen (Test).
- [x] `sitemap-builder.ts` Layer-Quelle + Test; deferred-work-Eintrag als erledigt markieren.
- [x] E2E: Link auf je einer Detailseite führt zur Übersicht, Anker existiert.

**Acceptance Criteria:**
- Given eine Kiez-, Bezirks- oder Layer-Seite, when man den Übersichtslink klickt, then landet man auf der passenden Übersicht, bei Kiez/Bezirk im richtigen Bezirksabschnitt.

## Implementation Notes

- Neue Komponente `overview-links.svelte` (Kiez und Bezirk). Sie sitzt im Linkblock am Seitenende neben Rang-Link und Methodik-Link, gleiche Linkklasse. Die Nachbar-Kieze-Sektion erscheint nur bedingt, deshalb nicht dort.
- Layer: Link `layer-detail-overview-link` zwischen Methodik-Aside und Karten-Link.
- Anker-ID aus `bezirkAnchorId()` in `region-overview.ts`. `/kieze` nutzt dieselbe Funktion für Sprungliste und Abschnitts-IDs.
- Kiez ohne Bezirk: „Alle Kieze“ auf `/kieze`. Neue Messages `overview_link_*` (DE/EN).
- Layer-`lastmod` = `lastmodOfLayer()` in `lastmod.ts`: `sourceUpdatedAt`, außer es fehlt, ist ungültig oder ein Jahres-Platzhalter (`YYYY-01-01`); dann `fetchedAt`. Zukunftsdaten entfallen. 33 von 58 Layer mit Detailseite nehmen `fetchedAt`. deferred-work-Eintrag entsprechend als erledigt markiert.
- Bezirks-Slug überall aus `bezirkSlugFromName()` (`region-display-names.ts`); Datentest über alle 12 Bezirke in `region-overview-loader.test.ts`.
- Tests: Komponententest, Layer-Seitentest, Helper-Test, Sitemap-Tests, E2E `tests/e2e/hub-links.e2e.ts`.

## Spec Change Log

- 15.10.2026, Review-Fund (HIGH): Die Freigabe von Matze bezog sich auf Jahres-Platzhalter, nicht auf „das spätere Datum“. Die erste Umsetzung (`latestLastmod`) ließ `lastmod` bei jedem Re-Fetch springen. Korrektur: `fetchedAt` gewinnt nur bei fehlendem, ungültigem oder Platzhalter-`sourceUpdatedAt`. Der frozen-Block bleibt unverändert.

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, Edge | `fetchedAt` gewinnt immer, lastmod springt bei jedem Re-Fetch | high | patch (nur bei Platzhalter/fehlend, Zukunft verworfen) |
| Blind | Label und Href bei leerem Slug uneinheitlich | medium | patch |
| VerifGap | Kiez-E2E prüft nicht den konkreten Bezirk | medium | patch |
| Edge | Bezirk-Slug auf Kiez-Seite und /kieze getrennt abgeleitet | low | patch (`bezirkSlugFromName`, Datentest 12 Bezirke) |
| Blind | Hash in `localizedHref` | low | patch |
| Blind | Links ungruppiert, IDs halb refaktoriert, Test-Locale | low | patch |
| VerifGap | EN-Anker ungeprüft | low | patch |
| VerifGap | Kein Vitest-Seitentest für Kiez/Bezirk | low | defer: Seiten haben keine Seitentests, E2E deckt ab |
| VerifGap | Layer-Seite zeigt Stand weiter mit `sourceUpdatedAt ?? fetchedAt` | low | defer: JSON-LD/Seiteninhalt laut Spec unverändert |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` (keine Prerender-Fehler), Preview 4173, `measure-meta` Exit 0, Playwright mit temporärer Config -- expected: grün
