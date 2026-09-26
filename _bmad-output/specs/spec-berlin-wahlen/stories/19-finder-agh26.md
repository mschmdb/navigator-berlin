---
title: 'Kiez-Finder nutzt AGH-Zweitstimme 2026'
type: 'feature'
created: '2026-09-26'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/docs/wahldaten-methodik.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Der Regler „Wahlverhalten ähnlich“ im Kiez-Finder rechnet fest mit der BTW-Zweitstimme 2025. Für die Frage, wie ein Berliner Kiez wählt, ist die AGH-Wahl vom 20.09.2026 aktueller und näher an der Landespolitik.

**Approach:** Der Finder nutzt `2026-agh-zweitstimme` (Entscheidung Matze 26.09.2026, Variante A). Der Hinweistext nennt Wahl und Quelle aus den Daten. Solange die Wahl vorläufig ist, trägt er „vorläufig, Stand …“ (Regel aus Story 15: vorläufige Zahlen nie unmarkiert); nach dem Endergebnis-Re-Ingest entfällt der Zusatz ohne Code-Änderung. `/api/wahl/kiez-shares` liefert dafür `vorlaeufig`, `source_updated_at` und `source_name`. Die WebMCP-Beschreibung von `set_finder_weights` nennt die neue Wahl (englisch; live erst nach Freeze-Ende).

</frozen-after-approval>

## Implementation Notes

- `kiez-finder-data.ts`: `FINDER_ELECTION = '2026-agh-zweitstimme'`, `formatFinderWahlHinweis` (Quelle + „vorläufig, Stand …“ aus den Daten, Datum per `formatBerlinDate`), `parseKiezSharesResponse` (leere Antwort → `null`).
- `kiez-finder-panel.svelte`: Hinweistext datengetrieben (`finder-wahl-hinweis`); nach einem Fehlschlag kein Cache und kein „geladen“-Status, der nächste Regler-Move lädt erneut (Review-Fund, dabei echter Bug in `loadedPartei` behoben).
- `/api/wahl/kiez-shares`: zusätzlich `vorlaeufig`, `source_updated_at`, `source_name`.
- WebMCP: `set_finder_weights`-Description und `voting_similarity`-Schema nennen „Berlin state election 2026, Zweitstimme“ und verweisen für den Vorläufig-Status auf `list_elections` (kein fest eingebautes „provisional“, das nach dem Endergebnis falsch würde); Manifest neu erzeugt.
- Daten geprüft: alle 7 Finder-Parteien in allen 143 Kiezen der AGH-Zweitstimme 2026 vorhanden.
- Kein Browser-Check (Playwright-MCP nicht verbunden); Komponententests decken Hinweis vor/nach Laden und Retry ab.

## Review Triage Log

Blind Hunter, 13 Funde:

| # | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|
| 1 | WebMCP-Text „provisional until…“ veraltet nach Endergebnis | medium | statischer Text, Test zementierte ihn | patch: Verweis auf `list_elections` |
| 2 | Agenten sehen Wahl/Status im Finder-Output nicht | medium | `get_finder_state`/`set_finder_weights` ohne Felder; Fix wäre neue Public API | defer |
| 3 | Mapping in `defaultLoadShares` ungetestet | gap | alle Tests injizieren `loadShares` | patch: `parseKiezSharesResponse` + Test |
| 4 | Endpoint nur ohne DB getestet | gap | kein Fall mit Treffer | patch: DB-Test mit Skip |
| 5 | Fehlschlag wird als „endgültig“ gecacht | medium | `[]` gecacht, Meta `vorlaeufig: false`; dazu `loadedPartei` gesetzt → kein Retry | patch |
| 6 | Hinweis vor dem Laden ohne „vorläufig“ | false | vor dem Laden fließen keine Wahlzahlen in Karte oder Liste | reject |
| 7 | Alte geteilte Links rechnen mit neuer Wahl | low | gewollter Wechsel, URL trägt keine Wahl | reject |
| 8 | Parteinamen AGH vs. Finder ungeprüft | false | SQL: alle 7 Parteien in allen 143 Kiezen | reject |
| 9 | Zwei Konstanten für Wahl und Label | low | Fix bräuchte Label-Ableitung aus DB | reject |
| 10 | Veraltete Beispiele/Doku | low | 400-Text korrigiert; `docs/webmcp-challenge.md` dokumentiert die Einreichung und bleibt | patch (400), reject (Challenge-Doku) |
| 11 | Spec unvollständig, Freeze-Hinweis veraltet | false | Oneshot-Format; Freeze ist bis 29.09. verlängert | reject |
| 12 | TZ-Testname verspricht mehr als geprüft | low | Titel korrigiert; TZ-Festigkeit testet `format-berlin-date.test.ts` | patch |
| 13 | Formatierung | low | Prettier | patch |

Verifikation: Unit 4110/4110, check 0, lint:wahl 0.
