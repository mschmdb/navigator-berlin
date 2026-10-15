---
title: 'L8: Messung der Landing-Seiten (Events und Vorher/Nachher-Abfrage)'
type: 'feature'
created: '2026-10-14'
status: 'done'
route: 'dispatch'
baseline_commit: 'b7d75363a72bbbce7a390f864b383ea52bdaa43d'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/epic-landing-enhance.md'
  - '{project-root}/_bmad-output/planning-artifacts/landing-audit-2026-10-14.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ob die neuen Kiez-, Bezirks- und Layer-Seiten Absprünge senken, lässt sich heute nur grob über Bounce und Dauer sehen. Welche neuen Elemente angeklickt werden, misst niemand.

**Approach:** Plausible-Events für die neuen Klickziele und eine wiederholbare Abfrage, die Einstiege, Bounce, Dauer und Seiten pro Besuch je Seitentyp für zwei Zeiträume vergleicht.

**Entscheidungen (Empfehlung, Freigabe Matze 14.10. für den Epic):**
- Ein Event `Landing` mit Property `action` und `page_type` (`kiez`/`bezirk`/`layer`): `map_button`, `key_figure`, `neighbor`, `similar`, `list_sort`, `list_link`, `map_link`, `ranking_link`, `eyebrow_link`. Keine Slugs, keine personenbezogenen Daten.
- Abfrage als Skript `scripts/landing-metrics.ts`, das eine SQL-Abfrage für die ClickHouse-DB der Plausible-Instanz ausgibt (Zeitraum A/B als Argumente). Das Skript verbindet sich nicht selbst; Ausführung per SSH bleibt manuell und steht im Runbook.
- Runbook `docs/runbooks/landing-metrics.md`: Abfrage ausführen, Search-Console-Export (Seiten, Suchanfragen) für dieselben Zeiträume, Auswertung im Epic-Dokument nachtragen. Erster Vergleich 4 Wochen nach Deploy.

## Boundaries & Constraints

**Always:** Bestehenden Helfer `trackEvent` (`src/lib/utils/plausible.js`) nutzen; Events nur auf Klick, nicht auf Seitenansicht. Keine Cookies, keine IDs. Tests prüfen, dass Klicks das Event mit den richtigen Properties auslösen.

**Never:** Keine Zugangsdaten, Hostnamen oder Servernamen im Repo oder im Runbook (nur Platzhalter wie `<plausible-host>`). Kein automatischer Lauf gegen Produktion.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Karten-Button Kiez | Klick | `Landing {action: map_button, page_type: kiez}` | N/A |
| Sortierung Bezirk | Klick Sortier-Button | `Landing {action: list_sort, page_type: bezirk}` | N/A |
| Skript | `--a 2026-09-16:2026-10-14 --b 2026-10-20:2026-11-17` | SQL mit beiden Zeiträumen, gruppiert nach Seitentyp | ungültiges Datum → Fehler mit Hinweis |
| Plausible fehlt | Embed/iframe oder Script nicht geladen | kein Fehler, Klick funktioniert | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/utils/plausible.js` (`trackEvent`) -- bereits für Finder genutzt (`explore/+page.svelte`).
- Klickziele: `bezirk-hero.svelte` (Button), `bezirk-kieze-list.svelte` (Sortierung, Links), `bezirk-kieze-map.svelte` (Links), `kiez-hero.svelte` (Button, L2), `key-figure-tiles.svelte` (L4), Nachbar-/Ähnlich-Listen (L6), `layer/[slug]` Button und `layer-kiez-ranking.svelte` (L7).
- `_bmad-output/planning-artifacts/landing-audit-2026-10-14.md` -- Baseline-Zahlen und bisherige Abfrage-Logik (`sessions_v2`, `site_id`, Gewichtung `sign`), ohne Hostnamen übernehmen.
- Neu `scripts/landing-metrics.ts` + Test, `docs/runbooks/landing-metrics.md`.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/landing-metrics.test.ts`, `landing-metrics.ts` -- Red/Green: SQL für zwei Zeiträume, Seitentyp-Klassifikation (`/kiez/`, `/en/kiez/`, …), Datumsvalidierung.
- [x] Komponenten -- `trackEvent`-Aufrufe + Tests je Klickziel.
- [x] `docs/runbooks/landing-metrics.md`.
- [x] `package.json` -- Script `metrics:landing`.

**Acceptance Criteria:**
- Given eine Bezirksseite, when man den Karten-Button klickt, then sendet die Seite genau ein `Landing`-Event mit `map_button` und `bezirk`.

## Implementation Notes

- `trackLanding(action, pageType)` in `src/lib/utils/plausible.ts` sendet `Landing` mit `interactive: false`; Actions: `map_button`, `map_link_bottom`, `key_figure`, `neighbor`, `similar`, `list_sort`, `list_link`, `map_link`, `ranking_link`, `eyebrow_link`.
- `scripts/landing-metrics.ts` (`pnpm metrics:landing`): Sessions-Vergleich A/B je Seitentyp und `--events` für die Klickverteilung; Tagesgrenzen Europe/Berlin. Spaltennamen von `sessions_v2`/`events_v2` ungeprüft, Runbook verlangt `DESCRIBE TABLE` vor dem ersten Lauf (SSH auf den Plausible-Server war am 14.10. abends nicht möglich).
- Runbook `docs/runbooks/landing-metrics.md` nur mit Platzhaltern für Host und Container.
- Lokale `kiez_rank` war nach dem `main`-Gegenbuild leer (bekannter CASCADE-Effekt), per `data:rank` + `data:comparison` neu gefüllt.
- Verifikation: Unit 4.865 (winner-map bekannt wackelig), `pnpm check` 0, Build mit DB, Epic-E2E 93/93.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind | Custom Events gelten als interaktiv, Bounce/Dauer in B nicht mit A vergleichbar | high | patch (`interactive: false`, Runbook) |
| Blind, Edge, VerifGap | `ORDER BY` nach `UNION ALL` wirkt nur auf B | medium | patch |
| Blind, Edge | Tagesgrenzen UTC statt Berlin | medium | patch |
| Blind, Edge | Flag ohne Wert, überlappende/umgekehrte Zeiträume | low | patch |
| Blind | Abfrage für Klickverteilung je `action` fehlt | medium | patch (`--events`) |
| Blind, Edge, VerifGap | Oberer und unterer Layer-Link nicht unterscheidbar, unterer ungetestet | medium | patch (`map_link_bottom`) |
| Blind | Runbook: Custom Properties freischalten, ungemessene Links, Mittelklick | low | patch (Doku) |
| Blind | `metrics:landing` im `data:*`-Block | low | patch |
| VerifGap | SQL nie gegen ClickHouse ausgeführt | medium | defer: kein ClickHouse-Harness; Runbook verlangt `DESCRIBE TABLE` vor dem ersten Lauf |
| Edge | Jahr 9999 erzeugt fünfstelliges Datum | low | reject: unerreichbar |
| Blind | Test „ohne window.plausible“ ohne Aussage | low | reject: Guard auf Util-Ebene getestet |

## Verification

**Commands:**
- `pnpm exec vitest run scripts src/lib/components/atlas` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
