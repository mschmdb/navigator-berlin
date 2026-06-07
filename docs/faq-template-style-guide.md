---
type: editorial
audience: owner
last-verified: 2026-05-17
---

# FAQ-Template Style-Guide (Story 2.5b)

Geltend für alle `src/lib/data/faq-templates/{cluster}/*.yaml` Dateien. Phase 1 ist
DE-only (Memory `project_i18n_phase_1_de_only`); EN-Coverage kommt in der
Phase-3-Future-Epic, Style-Guide gilt analog.

## Tonalität

- **Frage:** direkt, kein „Sie", neutrale Position. „Wie laut ist es im Boxhagener Kiez?"
  statt „Welcher Schalldruckpegel wurde gemessen?".
- **Antwort:** sachlich-knapp, max 2–3 Sätze. Daten zuerst, kurze Einordnung danach.
- **Keine Bewertung** des Lebensraums. Niemals „lebenswert" oder „Lebensqualität"
  (Memory `feedback_no_lebenswert`). Niemals em-dashes (Memory
  `feedback_no_em_dashes`); ersetze durch Komma, Doppelpunkt oder neuen Satz.
- **Keine Live-Daten-Sprache.** Memory `feedback_no_live_data`: keine Wörter wie
  „aktuell", „derzeit", „live". Statt dessen Stand-Datum aus der Quelle nennen.

## Zahlen + Einheiten

- dB-Werte: gerundet auf 1 Nachkommastelle. Einheit „dB" hinten.
- Temperatur (PET): 1 Nachkommastelle, Einheit „°C".
- Dichten: „X/km²" mit Tausender-Trennzeichen.
- Counts: deutsches Tausender-Trennzeichen (`Intl.NumberFormat('de-DE')`).

## Quellen-Attribution

Jede Antwort, die auf einem Aggregat-Wert beruht, schließt mit einer Quellenangabe:

> Quelle: `{layerSlug}`, Stand `{Monat YYYY}`.

Die Slots `{laermSource}`, `{laermStand}` usw. werden vom Renderer aus dem
`AggregateValue<T>.layer` + `.sourceUpdatedAt` gefüllt.

## Stigma-Disziplin

- **Score-Cluster (Phase 2):** keine evaluative Frage („Ist Kiez X lebenswert?").
  Stattdessen neutrale Variante („Wie schneidet Kiez X im Kiez-Score ab?").
- **Wohnen / MSS:** Aggregat-Sprache, nie Einzel-Adresse. „Im Bezirks-Mittel liegt
  die soziale Lage in der Kategorie …" statt „Dieser Kiez ist sozial schwach".
- **Heritage (Stolpersteine):** keine automatische Q&A zu Personen-Biografien.
  Nur Coverage-Aggregate („Wie viele Stolpersteine gibt es in {bezirk}?").

## Slot-Konvention

Slots sind `{camelCase}`-Platzhalter, vom Renderer deterministisch ersetzt. Aktuell
verfügbare Slots siehe `src/lib/server/faq/template-renderer.ts` (`buildSlotMap`).
Unbekannte Slots bleiben als Literal stehen (Fail-Loud im Browser-View).

## Phase-1-Cluster (User-Lock 2026-05-16)

`laerm`, `gruen`, `oepnv`, `wohnen`, `klima`. Phase-2-Backlog: `luft`, `bildung`,
`heritage`, `score`.

## Detailseiten vs. Layer/Methodik (Epic 11)

- **Detailseiten (kiez/bezirk):** nur Templates mit echtem Aggregat-Bezug (`requires`-Pfad gesetzt). Reine Erklär-Templates (`requires: []`, z. B. „Was bedeutet LDEN?") gehören NICHT hierher (Duplicate-Content über 155 Seiten). Ausnahme: `wohnen-stigma-disclaimer` (ADR-015-Kontext). Invariante in `detail-faq-invariant.test.ts`.
- **Layer-Seiten:** tragen die Erklär-Templates (`applicableTo: [layer]`). Detailseiten verlinken die Methodik-Seite (`faq-section.svelte`).

## Ranking-FAQ-Muster (Story 11.3, answer-first)

Detailseiten-Templates kombinieren Score + Rang + Vergleich in den ersten Wörtern. Renderer-Slots (aus `kiez_rank`/`kiez_comparison`):

- `{<dim>Score}` — Score-Wert (gerundet), z. B. `{gruenHitzeScore}`.
- `{<dim>Rang}` — `formatRank` (exakter Rang, oder „unteres Viertel" bei Q4, Anti-Stigma).
- `{<dim>Vergleich}` — neutrale Richtung „über/unter/etwa im Bezirksschnitt" (Kiez) bzw. Berlin-Median (Bezirk).

`requires` ankert auf einem vorhandenen Aggregat-Feld, damit nur bei Daten gerendert wird.

## Quellen-Namen

`{...Source}`-Slots geben lesbare Layer-Namen aus (`src/lib/data/source-label.ts`), keine technischen Slugs.
