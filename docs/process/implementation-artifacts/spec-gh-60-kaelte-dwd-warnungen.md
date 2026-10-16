---
title: 'Kälte-Navigator: DWD-Warnungen für Frost, Glätte und Schnee (#60)'
type: 'feature'
created: '2026-10-16'
status: 'done'
route: 'dispatch'
baseline_commit: '9f181452b1996f51e2274824ed389e7e7c3aa127'
review_loop_iteration: 0
context:
  - '{project-root}/docs/adr/ADR-012-tdd-mandate.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/kaelte` zeigt keine amtlichen Kältewarnungen. Wer helfen will, sieht nicht, ob Frost, Glätte oder Schnee die Lage gerade verschärfen (Epic #57).

**Approach:** Ein Server-Load auf `/kaelte` holt die aktiven DWD-Warnungen für Berlin aus demselben WFS-Dienst wie die Hitzewarnung, nur mit Kälte-Codes. Ein Banner im Platzhalter oben auf der Seite zeigt sie mit Stufe, DWD-Text und Quellenvermerk. Ohne Warnung oder bei Fehler erscheint nichts.

**Entscheidungen (Matze 16.10.2026):**
- Erst ab Stufe 2: Frost (22), Glätte (84) und leichter Schneefall (70) lösen kein Banner aus.
- Mehrere gleichzeitige Warnungen: alle aktiven Kälte-Warnungen als Liste, höchste Stufe zuerst, je Ereignis nur einmal.

## Boundaries & Constraints

**Always:**
- Event-Codes (EC_II) ausschließlich laut DWD „Übersicht verfügbarer Warnnummern“ (Stand 01.02.2024, https://www.dwd.de/DE/leistungen/opendata/help/warnungen/warning_codes_pdf.pdf): Strenger Frost 82 (Stufe 2), Markante Glätte 87 (2), Glatteis 85 (3), Extremes Glatteis 86 (4), Schneefall 71 (2), Starker Schneefall 72 (3), Extrem starker Schneefall 73 (4), Schneeverwehung 74 (2), Starke Schneeverwehung 75 (3), Extrem starke Schneeverwehung 76 (4).
- Berlin-Filter und Zeitfenster wie bei Hitze: Warncell 811000000/111000000, nur heute aktive Warnungen (Berliner Kalendertag, EXPIRES in der Zukunft).
- Quellenvermerk „Quelle: Deutscher Wetterdienst“ direkt am Banner mit Link auf dwd.de/warnungen; DWD-Text unverändert übernehmen.
- Stufe als Text, nicht nur Farbe; `role="status"`; DE/EN von Hand; live DWD-Text auf EN mit `lang="de"`; keine em-dashes; Tests zuerst.
- Fehler, Timeout oder kaputtes JSON: kein Banner, Seite rendert normal (wie Hitze).

**Never:**
- Kein geändertes Verhalten von Hitzewarnung, `/hitze` oder `dwd-hitzewarn-banner.svelte`. Gemeinsame Helfer dürfen herausgezogen werden, Hitze-Tests bleiben unverändert grün.
- Keine Vorabinformationen, kein Tauwetter (88/89), keine Warnungen für morgen.
- Keine Kopplung an den Notfall-Block (eigene Story, falls gewünscht).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Eine Warnung | Berlin, EC 82, heute aktiv | Banner „Strenger Frost“ (Stufe 2), DWD-Headline, Quelle | N/A |
| Mehrere Warnungen | 82 und 85 gleichzeitig | Liste: Glatteis (3) vor Strenger Frost (2) | N/A |
| Stufe 1 | nur EC 22 oder 84 oder 70 | kein Banner | N/A |
| Dubletten | EC 82 zweimal (Gemeinde und Kreis) | Strenger Frost nur einmal | N/A |
| Hitzecode | Berlin, EC 247 | kein Kälte-Banner | N/A |
| Andere Region | Warncell nicht Berlin, Name „Überlingen“ | kein Banner | N/A |
| Morgen | ONSET am nächsten Berliner Tag | kein Banner | N/A |
| Abgelaufen | EXPIRES in der Vergangenheit | kein Banner | N/A |
| DWD-Fehler | HTTP 500, Timeout, kein JSON | kein Banner, Seite 200 | null, kurzer Negativ-Cache |
| EN | `/en/kaelte` mit Warnung | Stufe englisch, DWD-Text deutsch mit `lang="de"` | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/server/dwd-warnings.ts` -- Hitze: WFS-URL mit `EC_II IN(247,248)` und Warncell-Filter (Z. 14-17), private `isBerlin`, `isActiveToday`, `BERLIN_DAY`, LRU-Cache `berlin-heat` (10 min, Negativ 30 s), Timeout 5 s, Fehler → null. Generik herausziehen oder exportieren, Hitze-Verhalten unverändert.
- `src/lib/server/dwd-warnings.test.ts` -- Muster: inline `fc([...])`-FeatureCollection, `_resetDwdCache`; Kälte-Tests analog in eigener Datei.
- `src/lib/data/dwd-warnung.types.ts` + `src/lib/data/index.ts:12` -- `HeatWarning`; Kälte-Typ daneben.
- `src/routes/(with-header)/hitze/+page.server.ts` -- Vorlage: `prerender = false`, `load` mit Fetch; für `/kaelte` neues `+page.server.ts`.
- `src/lib/components/kuehle-orte/dwd-hitzewarn-banner.svelte` + Test -- Vorlage für `src/lib/components/kaelte/dwd-kaeltewarn-banner.svelte` (role=status, Level-Text, `lang="de"`, Quelle-Link, `state-warning`/`state-error`-Töne).
- `src/routes/(with-header)/kaelte/+page.svelte:48-49` -- Platzhalter `kaelte-platzhalter-warnung` ersetzen; `page.svelte.test.ts:24-32` prüft ihn heute als leer, Tests rendern ohne `data`.
- `messages/de.json`/`en.json` -- `dwd_banner_*` (Z. 2100-2102) als Muster; neue Keys `dwd_kaelte_*`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/server/dwd-kaelte-warnings.ts` (+ ggf. geteilter Helfer aus `dwd-warnings.ts`) + Test -- Kälte-Codes, Mapping Code → Ereignis/Stufe, Berlin, heute, Cache-Key getrennt, Fehler → null.
- [x] `src/lib/data/dwd-warnung.types.ts` -- Kälte-Typ.
- [x] `src/routes/(with-header)/kaelte/+page.server.ts` + Test -- `prerender = false`, liefert Warnung(en) oder null.
- [x] `src/lib/components/kaelte/dwd-kaeltewarn-banner.svelte` + Test -- Banner laut Matrix, DE/EN.
- [x] `src/routes/(with-header)/kaelte/+page.svelte` + Test -- Banner statt Platzhalter, `data` durchreichen.
- [x] `messages/de.json`, `messages/en.json` -- Ereignis- und Stufentexte, Quellenvermerk.
- [x] `tests/e2e/kaelte.e2e.ts` -- Seite bleibt 200 und axe-sauber (Banner live nicht steuerbar, Komponententest deckt Darstellung).

**Acceptance Criteria:**
- Given eine aktive DWD-Kältewarnung für Berlin, when jemand `/kaelte` öffnet, then steht das Banner oberhalb des Notfall-Blocks und der 112-Link bleibt auf dem Smartphone (390×844) im ersten Bildschirm.
- Given ein Screenreader, when die Seite lädt, then liest er Ereignis, Stufe und Quelle als Text vor.

## Implementation Notes

- `tests/e2e/kaelte.e2e.ts` bleibt unverändert. Die bestehenden E2E-Tests decken 200 und axe ohne Banner. Der Server-Fetch lässt sich im E2E nicht steuern. Die Banner-Darstellung und AC 1 (112-Link im Viewport 390×844 mit drei Warnungen) prüfen der Komponententest und `page.svelte.test.ts`.

- Fehlerfall liefert intern eine leere Liste statt `null`; Verhalten laut Matrix gleich (kein Banner, Seite 200).
- `dwd-warnings.ts`: nur Exports und `buildWfsUrl`, Hitze-URL identisch, Hitze-Tests unverändert.
- AC 1 mit Banner (112 im ersten Bildschirm) nicht per E2E gemessen: Server-Fetch im E2E nicht steuerbar.

## Spec Change Log

## Review Triage Log

| # | Fund | Verdikt | Route | Beleg |
|---|------|---------|-------|-------|
| 1 | Verwandte Codes gleichzeitig (85+86, 71+72) erscheinen doppelt | medium | patch | Dedupe nach `event`, nicht nach Phänomen. Einzige sinnvolle Lesart von „je Ereignis nur einmal“: Familie Frost, Glätte, Glatteis, Schneefall, Verwehung, höchste Stufe bleibt. |
| 2 | AC 1 mit Banner (mehrere Warnungen) ungetestet, Banner ohne Höhengrenze | medium | patch | Kein Test rendert die Seite mit Warnungen bei 390×844. Komponententest mit `page.viewport` möglich. |
| 3 | Cache liefert abgelaufene Warnungen bis 10 min | medium | patch | `isActiveToday` läuft nur beim Fetch; Roh-Features cachen und pro Abruf filtern. |
| 4 | Hitze-URL nach `buildWfsUrl`-Refactor ungetestet | medium | patch | Hitze-Fetch-Stubs ignorieren die URL. |
| 5 | Fallback-Erkennung per Stringvergleich `headline === label` | low | patch | Zwei Quellen für DE-Labels; `headline: string \| null` ist direkt. |
| 6 | Stufe nur als Zahl | low | patch | DWD-Bedeutung (markantes Wetter, Unwetter, extremes Unwetter) fehlt im Text. |
| 7 | Quellenlink ohne Hinweis auf neuen Tab | low | patch | `kaelte_new_tab_hint` existiert. |
| 8 | Farbstufe ungetestet | low | patch | Kein Test auf `state-error`/`state-warning`. |
| 9 | Cache-Trennungstest wirkungslos | low | patch | Getrennte LRU-Instanzen, Test kann nicht fehlschlagen. Löschen. |
| 10 | 200 ohne `features` wird 10 min als „keine Warnung“ gecacht | low | patch | Direkt: fehlende `features` wie Fehler behandeln. |
| 11 | E2E-Task abgehakt ohne Dateiänderung | low | patch | In Implementation Notes vermerken (bestehende Tests decken 200 und axe ohne Banner). |
| 12 | Negativ-Cache-TTL nicht beobachtet | low | defer | Gilt auch für Hitze, braucht Fake-Clock für lru-cache. |
| 13 | AC 2: `role="status"` liest beim Laden nicht automatisch vor | false | reject | Banner steht im Lesefluss vor dem Notfall-Block, Screenreader liest es in Reihenfolge; gleiches Muster wie Hitze. |
| 14 | Doppelte Fetch-/Cache-Logik | low | reject | Funktioniert; Extraktion würde Hitze-Code anfassen. |
| 15 | Parallele Requests bei leerem Cache | low | reject | Max. wenige Requests alle 10 min, Hitze identisch. |
| 16 | Doppelter `each`-Key bei Fremdnutzung | false | reject | Server dedupliziert, Komponente hat einen Aufrufer. |
| 17 | Unbekanntes `event` crasht | false | reject | `ColdEvent` ist geschlossener Union-Typ, `Record` deckt alle ab. |
| 18 | EN-Begriffe nicht am DWD-Englisch geprüft | low | reject | Übersetzungen sind sinngemäß korrekt; DWD-Text selbst bleibt deutsch. |
| 19 | Fremde Änderung `region-composites.json` | false | reject | Build-Artefakt, zurückgesetzt, nicht Teil des Diffs. |
| 20 | Spec-Logs leer | false | reject | Werden in diesem Schritt gefüllt. |

## Verification

**Commands:**
- `pnpm exec vitest run src scripts` -- expected: grün
- `pnpm check` und `pnpm exec prettier --check .` -- expected: 0 Fehler
- `pnpm build`, Preview, E2E `kaelte hitze a11y` -- expected: grün außer bekanntem a11y „Escape löscht Selection“
