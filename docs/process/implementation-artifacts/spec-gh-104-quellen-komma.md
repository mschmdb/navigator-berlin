---
title: 'Kältehilfe-Quellen mit Leerzeichen nach dem Komma (#104)'
type: 'bugfix'
created: '2026-10-17'
status: 'done'
route: 'dispatch'
baseline_commit: '1be77a22c11044203102437b861925b987a5cefc'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Auf /kaelte stehen die Quellen der Hilfedienste ohne Leerzeichen nach dem Komma, etwa „berlin.de/kaeltehilfe,GEBEWO pro“ (4× auf der Seite). Ursache: Svelte entfernt den Zeilenumbruch nach dem Komma in `{#if i > 0},{/if}` (`notfall-block.svelte:183`).

**Approach:** Den Trenner als String-Ausdruck setzen, damit das Leerzeichen erhalten bleibt. Ein Komponententest sichert den gerenderten Text ab.

## Boundaries & Constraints

**Always:** Trenner „, “ zwischen zwei Quellen, kein Trenner vor der ersten. Der Screenreader-Hinweis „neuer Tab“ an verlinkten Quellen bleibt erhalten.

**Never:** Keine Änderung an Daten (`hilfe-dienste.ts`), Texten in `messages/*.json` oder am Layout. Kein Umbau auf `Intl.ListFormat`, weil das ein „und“ vor die letzte Quelle setzt und die Links in Text auflöst.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Zwei Quellen, erste verlinkt | Kältehilfetelefon: berlin.de/kaeltehilfe, GEBEWO pro | sichtbar „berlin.de/kaeltehilfe, GEBEWO pro“ | N/A |
| Eine Quelle | Dienst mit nur einer Quelle | kein Komma | N/A |
| Drei oder mehr Quellen | Dienst mit 3 Quellen | „A, B, C“ | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/components/kaelte/notfall-block.svelte:180-190` -- Quellenzeile pro Dienst; `{#each dienst.quellen as quelle, i}` mit Trenner `{#if i > 0},\n{/if}`. Nur hier ändern.
- `src/lib/kaelte/hilfe-dienste.ts` -- `HILFE_DIENSTE`, Quellen je Dienst (`BERLIN_DE`, GEBEWO pro …). Nicht ändern; Testdaten von hier.
- `src/lib/components/kaelte/notfall-block.svelte.test.ts` -- bestehende Browser-Tests (vitest-browser-svelte), Muster `root()`, `data-testid="kaelte-dienst-{id}"`.
- `src/lib/components/atlas/distribution-bar.svelte:29` -- nutzt schon `{' · '}` als Trenner, korrektes Muster als Vorbild. Repo-weiter grep: kein weiterer Komma-Trenner mit diesem Fehler.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/components/kaelte/notfall-block.svelte.test.ts` -- Test zuerst: Quellenzeile des Kältehilfetelefons enthält sichtbar „berlin.de/kaeltehilfe, GEBEWO pro“ (ohne sr-only-Text) und keine Quelle startet mit Komma -- sichert den Fehler ab (Red).
- [ ] `src/lib/components/kaelte/notfall-block.svelte` -- Trenner auf `{', '}` umstellen -- Leerzeichen bleibt beim Kompilieren erhalten (Green).

**Acceptance Criteria:**
- Given /kaelte mit Hilfediensten, when die Quellenzeile rendert, then steht zwischen zwei Quellen „, “ und vor der ersten kein Trenner.
- Given eine verlinkte Quelle, when sie rendert, then bleibt der Screenreader-Hinweis für den neuen Tab erhalten.

## Implementation Notes

Spec-Checkpoint übersprungen: Matze war abwesend und hat autonomes Arbeiten erlaubt. Der Issue-Text gilt als Spec, bitte im PR prüfen.

## Spec Change Log

## Review Triage Log

Reviewer liefen über Codex (`gpt-6.1-sol`), weil der ausführende Agent keine eigenen Subagenten starten durfte.

| Layer | Fundstelle | Befund | Verdict | Evidenz / Route |
|---|---|---|---|---|
| blind | `quellen-zeile.svelte:16` | Hinweis „öffnet neuen Tab“ liegt außerhalb des `<a>`, fehlt im Accessible Name | medium | Stimmt, aber unverändert aus `notfall-block.svelte` übernommen (vorbestehend). defer |
| blind | `quellen-zeile.svelte:10` | Leeres `quellen` erzeugt verwaistes „Quellen:“ | low | `hilfe-dienste.test.ts:27` erzwingt mindestens eine Quelle je Dienst; Fix bräuchte einen Guard. reject |
| blind | `quellen-zeile.svelte.test.ts:13` | Kein EN-Test für die Komponente | low | Messages unverändert, Trenner sprachunabhängig. reject |
| edge | `quellen-zeile.svelte:11` | Doppelte Labels kollidieren als `each`-Key | low | Key `quelle.label` stand schon vorher so; alle Labels je Dienst sind eindeutig. reject |
| vgap | n/a | Keine Lücken | n/a | n/a |

## Verification

**Commands:**
- `pnpm test:unit -- --run src/lib/components/kaelte/notfall-block.svelte.test.ts` -- expected: alle Tests grün, neuer Test vorher rot
- `pnpm check` -- expected: 0 Fehler
- `pnpm lint` -- expected: sauber

## Codex Review (gpt-6.1-sol)

Verdict APPROVE, keine Befunde.
