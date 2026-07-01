# Story 12.2: Versorgung · Apotheke + Post als Nahversorgungs-Terme

Status: review

> **Anker:** ADR-012 (TDD), ADR-015 (eindeutige Besser-Richtung).
> **Hard-Block:** Story 12.0 `done` (`nahversorgung-apotheke`, `nahversorgung-post` im PoiIndex).
> **Soft-Block:** Epic 9 + Epic 10.1–10.4 `done`. Koordination mit 12.1 (gleicher Config-Block) — 12.1 + 12.2 parallel-möglich, aber Merge serialisieren.

## Story

As a Bewohner,
I want dass Apotheke und Post-/Paketstelle in Reichweite in die Versorgung einfließen,
so that gesundheitsnahe und behördennahe Alltagswege im Score sichtbar werden.

## Kontext: Warum dieser Change

12.0 hat `nahversorgung-apotheke` (`amenity=pharmacy`) und `nahversorgung-post` (`amenity=post_office`) geholt + in den PoiIndex gehängt. Diese Story fügt beide als `poi-density`-Terme zur `VERSORGUNG_CONFIG` hinzu. Apotheke und Post sind seltener als Lebensmittel → größerer Radius, niedrigerer Cap. Finale Gewichts-Kalibrierung in 12.3.

## Acceptance Criteria

1. **AC-1 (Apotheke- + Post-Term):**
   **Given** 12.0 + beide Layer im PoiIndex
   **When** `VERSORGUNG_CONFIG` zwei `poi-density`-`LayerWeight` erhält (Apotheke ~800 m, Post ~1000 m)
   **Then** beide zählen als Dichte im Radius, jeweils eigener Cap, plausibel zur typischen Erreichbarkeit
   **And** `POI_DENSITY_SPECS` nimmt beide Slugs automatisch auf

2. **AC-2 (TDD):**
   **Given** ADR-012
   **When** Tests laufen
   **Then** beide Terme, Radien, Caps und Missing-Data sind getestet
   **And** `dimension-config.test.ts` Gewichts-Summe `versorgung` = 1.0 bleibt grün

3. **AC-3 (Bäcker-Konsistenz):**
   **Given** die Bäcker-Entscheidung aus 12.0 (AC-3)
   **When** dieser Story-Scope geprüft wird
   **Then** Bäcker ist NICHT als eigener Term hier ergänzt (bereits in 12.0 entschieden: Lebensmittel-Bucket oder weglassen)

4. **AC-4 (Inspector + Methodik):**
   **Given** FR15/FR40
   **When** ein Punkt getroffen wird
   **Then** Apotheke + Post erscheinen als Versorgungs-Quellen mit ODbL-Attribution
   **And** `kiez-score-versorgung`-Methodik nennt beide Terme

## Tasks / Subtasks

- [x] **Task 1: Zwei Terme in VERSORGUNG_CONFIG** (AC: #1, #2)
  - [x] 1.1 (RED) `dimension-config.test.ts`: Test erwartet `nahversorgung-apotheke` + `nahversorgung-post` mit `poi-density`
  - [x] 1.2 (GREEN) `scripts/lib/kiez-score/dimension-config.ts` `VERSORGUNG_CONFIG` (Z.94–139):
    ```ts
    { layer: 'nahversorgung-apotheke', weight: 0.07, normalize: { kind: 'poi-density', radiusM: 800, cap: 2, softTailFactor: 0.3 } },
    { layer: 'nahversorgung-post',     weight: 0.05, normalize: { kind: 'poi-density', radiusM: 1000, cap: 2, softTailFactor: 0.3 } }
    ```
    Gewichte vorläufig (Summe 1.0 mit 12.1-Term + Bestand). Kommentar „vorläufig, finalisiert in 12.3".
  - [x] 1.3 (RED→GREEN) Gewichts-Summen-Test grün

- [x] **Task 2: Pipeline-Pickup** (AC: #1)
  - [x] 2.1 `POI_DENSITY_SPECS` zieht beide Slugs automatisch — verifizieren
  - [x] 2.2 `pnpm data:kiez-scores`: Recompute, Spot-Check Apotheke/Post-Effekt

- [x] **Task 3: Inspector + Methodik** (AC: #4)
  - [x] 3.1 `src/lib/data/layer-methodology.ts` `kiez-score-versorgung` ergänzen (Apotheke + Post)

- [x] **Task 4: Abschluss** (AC: #2)
  - [x] 4.1 `pnpm test` 100% grün, `pnpm check` ohne neue Errors

## Dev Notes

### Ist-Zustand (verifiziert 2026-06-07)

Siehe Story 12.1 Dev Notes (gleicher Config-Block + poi-density-Infrastruktur). Diese Story fügt zwei weitere `poi-density`-Terme im selben `VERSORGUNG_CONFIG` (`dimension-config.ts` Z.94–139) hinzu.

### Cap/Radius-Begründung (editorial, Assumption)

- Apotheke 800 m / cap 2: eine Apotheke in 800 m deckt den Bedarf, zwei = voll. Apotheken sind dichter als Post.
- Post 1000 m / cap 2: Postfilialen/Paketshops sind dünner gesät, größerer Radius gerechtfertigt.

Schätzwerte, in 12.3 kalibrieren. Per CLAUDE.md: Annahme dokumentiert.

### Merge-Koordination mit 12.1

12.1 und 12.2 editieren denselben `VERSORGUNG_CONFIG`-Block. Bei paralleler Bearbeitung: Merge serialisieren, danach Gewichts-Summe gemeinsam in 12.3 final setzen. Falls 12.1 noch nicht gemergt: Gewichte hier so wählen, dass Summe mit dem 12.1-Term aufgeht.

### Was nicht brechen darf

- `DIMENSION_WEIGHTS` (5 × 0.20) unverändert.
- `compute-score.ts`, `normalize.ts`: kein Anfassen.

## References

- `scripts/lib/kiez-score/dimension-config.ts` (VERSORGUNG_CONFIG Z.94–139)
- `scripts/lib/kiez-score/pipeline.ts` (POI_DENSITY_SPECS Z.22–31)
- `src/lib/data/layer-methodology.ts` (kiez-score-versorgung ~Z.479)
- `docs/adr/ADR-012-tdd-mandate.md`, `docs/adr/ADR-015-score-composition-umwelt-infra.md`
- `_bmad-output/implementation-artifacts/12-0-nahversorgung-layer-foundation.md`, `12-1-lebensmittel-dichte-term.md`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code), Branch `feat/epic-12-nahversorgung`.

### Debug Log References

- `dimension-config.test.ts`: Apotheke+Post-Term-Test (RED → GREEN), Gewichts-Summen-Guard grün.
- Recompute `pnpm data:kiez-scores`: Versorgung in 510/542 LOR verändert.
- Fixture `compute-score.test.ts` um Apotheke+Post-poiCounts erweitert.

### Completion Notes List

- Apotheke (`poi-density`, radiusM 800, cap 2, 0.07) + Post (radiusM 1000, cap 2, 0.05) in `VERSORGUNG_CONFIG`.
- Umverteilung Kita (2×0.15→0.12) + Schule (2×0.15→0.12) = −0.12, deckt +Apotheke 0.07 +Post 0.05. **Interne Summe = 1.0.** Damit entspricht die Versorgungs-Verteilung bereits exakt der 12.3-Zieltabelle (Kita 0.24, Schule 0.24, Krankenhaus 0.18, Spielplatz 0.10, Nahversorgung 0.24) → 12.3 wird Verifikation + Doppel-Penalty-Analyse + DB-Recompute-Kette.
- Bäcker NICHT als eigener Term (in 12.0 in Lebensmittel-Bucket gefaltet, AC-3).
- Methodik `kiez-score-versorgung`: Apotheke + Post + aktualisierte Gewichte, `relatedLayers` ergänzt.
- **Verifikation:** `pnpm check` 0 Errors, Unit-Suite **2783/2783 grün**.
- DB-Aggregat-Kette (`data:aggregate-scores`/`-rank`/`-comparison`) gehört in 12.3 (DB-abhängig).

### File List

**Geändert:**
- `scripts/lib/kiez-score/dimension-config.ts` (Apotheke + Post + Kita/Schule-Umgewichtung)
- `scripts/lib/kiez-score/dimension-config.test.ts` (Apotheke+Post-Term-Test)
- `scripts/lib/kiez-score/compute-score.test.ts` (Fixture)
- `src/lib/data/layer-methodology.ts` (Versorgungs-calculation + relatedLayers)
- `static/kiez-scores/kiez-scores.json`, `static/kiez-scores/layers/kiez-score-versorgung.geojson`, `kiez-score-gesamt.geojson` (Recompute)
- `static/layers/MANIFEST.json` (Re-Augment)

## Change Log

- 2026-06-07: Story 12.2 erstellt (ready-for-dev). Apotheke + Post als poi-density-Terme. Gewichte vorläufig, finale Kalibrierung in 12.3.
- 2026-06-07: Story 12.2 implementiert (→ review). Apotheke (0.07) + Post (0.05), Kita/Schule auf 0.12 reduziert (Summe 1.0 = 12.3-Zieltabelle), Methodik + Recompute (510/542 LOR). check 0 Errors, 2783/2783 grün.
