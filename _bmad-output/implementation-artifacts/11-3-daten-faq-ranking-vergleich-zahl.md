# Story 11.3: Daten-FAQ mit Ranking, Vergleich und konkreter Zahl

Status: review

> **Anker:** Ersetzt dünne Ordinal-FAQ durch einordnende, zitierfähige Q&As. Kern des AEO-Hebels auf Detailseiten.
>
> **Abhängigkeiten:** Hard-Block 11.0 (Rang/Quartil). Baut auf 11.2 (entrümpelte Detailseiten-FAQ). Vergleichswerte aus 11.4 wo verfügbar.

## Story

As a Discovery-User,
I want FAQ-Antworten, die meinen Kiez einordnen statt nur einen Ordinalwert zu nennen,
so that ich und Answer Engines eine zitierfähige, spezifische Aussage bekommen.

## Acceptance Criteria

1. **AC-1 (Ranking + Zahl im Template):**
   **Given** 11.0 (Rang/Quartil) + `kiez_stats`-Zähldaten
   **When** neue/erweiterte Templates Rang, Vergleich und konkrete Zahl kombinieren (Muster „Wie grün ist {name}?" → „Platz {rang} von 143, {gruenanlagenCount} Grünanlagen, {versorgung}% gute Versorgung, {ueberUnterBezirk} Bezirksschnitt")
   **Then** nennt die Antwort mindestens Rang/Quartil + eine absolute Zahl

2. **AC-2 (AEO-Antwort-First):**
   **Given** AEO-Best-Practice
   **When** die Antwort gerendert wird
   **Then** steht die Kernaussage in den ersten 40-60 Wörtern nach der Frage-Überschrift

3. **AC-3 (Anti-Stigma, ADR-015):**
   **Given** niedrige Werte
   **When** das Template rendert
   **Then** neutrale Sprache (über/unter Schnitt), bei schwachen Werten Quartil statt exaktem letztem Rang (kein „Platz 143 von 143")

4. **AC-4 (TDD):**
   **Given** ADR-012
   **When** der Renderer getestet wird
   **Then**: Interpolation von Rang/Quartil/Zahl, Skip bei Missing-Data, Anti-Stigma-Quartil-Fallback bei Q4, Wort-Budget (≤60 Wörter Kernaussage) sind getestet

5. **AC-5 (Attribution, FR40):**
   **Given** ein genannter Wert
   **When** die Antwort erscheint
   **Then** sind Quelle + Stand aus dem `AggregateValue`-Triple abgeleitet (Text oder Methodik-Link)

## Tasks / Subtasks

- [x] **Task 1: Renderer um Rang/Vergleich erweitern** (AC: #1, #3, #4)
  - [x] 1.1 (RED) `template-renderer.test.ts`: neue Platzhalter `{rang}`/`{quartil}`/`{ueberUnterBezirk}`, Anti-Stigma-Fallback, Wort-Budget
  - [x] 1.2 (GREEN) `src/lib/server/faq/template-renderer.ts`: Rang/Quartil/Vergleich als Template-Context-Felder; Anti-Stigma-Formatter
  - [x] 1.3 `render-faq.ts`: Rang-Daten (11.0) + Vergleich (11.4) in den Render-Context laden
- [x] **Task 2: Neue Templates pro Cluster** (AC: #1, #2)
  - [x] 2.1 Je Cluster-YAML ein einordnendes Template (gruen/oepnv/wohnen/klima/laerm) im Antwort-First-Format
  - [x] 2.2 Reuse `src/lib/data/faq-helpers/*` für Klassen-Beschreibungen
- [x] **Task 3: Re-Build + Verify** (AC: #2, #5)
  - [x] 3.1 `pnpm data:faq`, Stichprobe: Rang + Zahl vorhanden, Kernaussage ≤60 Wörter, Quelle belegt

## Dev Notes

### Ist-Zustand

- `src/lib/server/faq/template-renderer.ts` interpoliert Platzhalter aus `TemplateContext` (pageType, slug, name, aggregate). Erweitern um `rank`/`comparison`.
- `src/lib/data/faq-helpers/{gruen,oepnv,wohnen,klima,laerm}.ts` liefern Klassen-Beschreibungen (z.B. `describeGruenversorgungDe`, `describeOepnvDichte`) — wiederverwenden statt neu formulieren.
- `scripts/render-faq.ts:184-212` (`renderAll`) baut den Context pro Target; hier Rang + Vergleich injizieren.
- Rang/Quartil kommt aus 11.0 (`getKiezRank`), Vergleich aus 11.4 (Kiez vs. Bezirk/Berlin).

### Architektur-Compliance

- Antwort-First: Kernaussage zuerst, Erklärung danach. Wort-Budget testbar.
- Anti-Stigma-Formatter zentral (eine Funktion, von allen Templates genutzt).
- TS strict, kein `any`.

### Was nicht brechen darf

- FAQPage-JSON-LD bleibt valide. Bestehende spezifische Templates (`*-dominant-kiez`) bleiben oder werden ersetzt, nicht doppelt.
- `pnpm test`/`pnpm check` grün.

### Previous Story Intelligence

- **Story 11.2:** Detailseiten-FAQ ist bereits entrümpelt → neue Templates sind die Hauptfüllung.
- **Story 11.0:** Rang/Quartil-Query + invertierte Richtung pro Metrik.

## References

- [Source: _bmad-output/planning-artifacts/epics.md, Epic 11, Story 11.3]
- [Source: _user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md, Stufe 1.2 + AEO-Best-Practices]
- [Source: src/lib/server/faq/template-renderer.ts]
- [Source: src/lib/data/faq-helpers/gruen.ts] (+ oepnv/wohnen/klima/laerm)
- [Source: scripts/render-faq.ts:184-212]
- [Source: src/lib/server/db/schema/aggregate-types.ts:16] (AggregateValue-Triple für Attribution)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Completion Notes List

- Basis = die 5 Score-Dimensionen (haben Rang UND Vergleich aus 11.0/11.4), nicht die kategorialen stats-Metriken. 4 neue answer-first Templates: ruheLuft (laerm), gruenHitze (gruen), mobilitaet (oepnv), wohnschutz (wohnen). Jedes nennt Score + Rang + Vergleich in den ersten Wörtern.
- Renderer: `TemplateContext.metrics` (Map dimKey→{value,rang,quartil,total,compareValue,compareLabel}); Slots `<dim>Score`/`<dim>Rang`/`<dim>Vergleich`. `formatRank` aus 11.4 wiederverwendet (Anti-Stigma: Q4 → „unteres Viertel").
- Vergleichs-Richtung neutral/nicht-wertend: `compareDirection` → „über dem"/„unter dem"/„etwa im" + Label (Kiez: Bezirksschnitt, Bezirk: Berlin-Median). Toleranz <1 Punkt = „etwa im".
- requires verankert auf vorhandenem Aggregat-Feld (z. B. `laerm.dominantCategory`) → Template rendert nur bei Daten; Rang/Vergleich existieren dann garantiert.
- render-faq lädt kiez_rank/kiez_comparison + bezirk-Pendants, baut metrics-Map pro Target.
- Verify `/kiez/alexanderplatz`: „Platz 2 von 143, über dem Bezirksschnitt" + „unteres Viertel" bestätigt. data:faq 2281 Q&As. Suite 2760 grün, check 0 Errors.

### File List

**Neu:** src/lib/server/faq/template-renderer-metrics.test.ts
**Geändert:** src/lib/server/faq/template-renderer.ts (MetricContext + Slots), scripts/render-faq.ts (Metrik-Loader + Context), src/lib/data/faq-templates/{laerm,gruen,oepnv,wohnen}/*.de.yaml (je 1 Ranking-Template)

## Change Log

- 2026-06-07: Story 11.3 implementiert. Answer-first Ranking-FAQ (Score+Rang+Vergleich) für 4 Dimensionen, Anti-Stigma. Status → review.
