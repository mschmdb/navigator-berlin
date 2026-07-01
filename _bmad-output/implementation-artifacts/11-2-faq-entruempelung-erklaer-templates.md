# Story 11.2: FAQ-Entrümpelung — Erklär-Templates auf Methodik bündeln

Status: review

> **Anker:** Behebt AEO-Duplicate-Content. Erklär-FAQ (`requires: []`) steht identisch auf allen 155 Detailseiten. Score-unabhängig, sofort machbar, kein Hard-Block.
>
> **Abhängigkeiten:** Keine. Bereitet 11.3 vor (Detailseiten-FAQ wird danach nur noch kiez-spezifisch befüllt).

## Story

As a Discovery-User,
I want auf der Kiez/Bezirks-Seite nur kiez-spezifische Fragen sehen,
so that die Seite einzigartig ist und allgemeine Erklärungen einmal zentral stehen.

## Acceptance Criteria

1. **AC-1 (Erklär-Templates raus aus Detailseiten):**
   **Given** FAQ-Templates mit `requires: []` und `applicableTo` inkl. bezirk/kiez (z.B. `laerm-was-bedeutet-lden`, `laerm-warum-nacht-schaedlicher`, `laerm-welche-quellen`)
   **When** ihr `applicableTo` auf `[layer]` reduziert wird (oder ein neuer `applicableTo: [methodik]`-Scope entsteht)
   **Then** rendert `render-faq.ts` für pageType `kiez`/`bezirk` nur noch Templates mit echtem Aggregat-Bezug (`requires`-Pfad gesetzt)

2. **AC-2 (Erklär-Inhalte zentral erreichbar):**
   **Given** die entfernten Erklär-Q&As
   **When** sie auf der Methodik-Seite (oder pro Layer-Seite) gebündelt werden
   **Then** sind sie weiter erreichbar; Detailseiten verlinken die Methodik-Erklärung (kein toter Content-Verlust)

3. **AC-3 (TDD + Duplicate-Check):**
   **Given** ADR-012
   **When** der FAQ-Render-Lauf getestet wird
   **Then**: kein Detailseiten-FAQ-Eintrag ohne `requires`-Bezug; zwei beliebige Kiez-Seiten haben keinen identischen Q&A-Block; FAQPage-JSON-LD bleibt valide (`faq-section.svelte`); Tests in `template-renderer.test.ts`/`load-templates.test.ts` erweitert

4. **AC-4 (Re-Build):**
   **Given** geänderte Templates
   **When** `pnpm data:faq` läuft
   **Then** `faq_qna` enthält für kiez/bezirk nur spezifische Q&As; Anzahl pro Seite dokumentiert (vorher/nachher)

## Tasks / Subtasks

- [x] **Task 1: Template-Audit** (AC: #1)
  - [x] 1.1 Alle 5 Cluster-YAMLs durchgegangen, `requires` + `applicableTo` tabelliert
  - [x] 1.2 Entscheidung je Template: 16 reine Erklärer → `[layer]`; requires-tragende bleiben; `wohnen-stigma-disclaimer` bleibt auf kiez/bezirk (ADR-015-Ausnahme)
- [x] **Task 2: Templates umscopen** (AC: #1, #2)
  - [x] 2.1 (RED) `detail-faq-invariant.test.ts`: 16 Offender gelistet (Stigma-Disclaimer via Allowlist ausgenommen)
  - [x] 2.2 (GREEN) `applicableTo` der 16 Erklärer auf `[layer]`; bleiben dort erreichbar
  - [x] 2.3 Methodik-Scope nicht nötig: PageType-Enum = [bezirk,kiez,layer], Erklärer korrekt auf Layer-Seiten
- [x] **Task 3: Detailseiten-Verlink** (AC: #2)
  - [x] 3.1 `faq-section.svelte`: Methodik-Link für pageType kiez/bezirk (`/methodik`), nicht auf Layer; Component-Tests ergänzt
- [x] **Task 4: Re-Build + Verify** (AC: #3, #4)
  - [x] 4.1 `pnpm data:faq` (1818 Q&As). Kiez-FAQ jetzt 6 Templates (5 requires + Stigma), Erklärer auf 51 Layer-Seiten, FAQPage-JSON-LD valide

## Dev Notes

### Ist-Zustand (Beleg Genericness)

- `src/lib/data/faq-templates/laerm/laerm.de.yaml`: 8 Templates, **6 mit `requires: []`** (z.B. `laerm-was-bedeutet-lden` Zeile 37, `laerm-warum-nacht-schaedlicher` Zeile 27, `laerm-welche-quellen` Zeile 56) → identisch auf jeder Seite. Nur `laerm-dominant-kiez` (Zeile 18) + `laerm-wie-aktuell` (Zeile 47) interpolieren `{name}`/`{laermKategorie}`.
- `scripts/render-faq.ts` rendert YAML × Aggregat × {bezirk,kiez,layer} und TRUNCATE+Insert in `faq_qna` (Zeile 214-231). `applicableTo` steuert pageType-Zuordnung.
- `src/lib/server/faq/template-schema.ts` definiert `applicableTo`-Enum + `requires`-Pfade. `load-templates.ts` lädt alle YAMLs.
- `faq-section.svelte:35` emittiert FAQPage-JSON-LD aus den geladenen Q&As.

### Architektur-Compliance

- Keine harte Löschung von Inhalten: Erklär-Q&As wandern, verschwinden nicht (AEO-Wert bleibt auf Methodik/Layer).
- `applicableTo`-Änderung ist der saubere Hebel, kein Renderer-Sonderfall.

### Was nicht brechen darf

- Layer-Seiten-FAQ (`layer/[slug]`) behält die Erklär-Q&As (dort sind sie korrekt platziert).
- FAQPage-JSON-LD-Schema bleibt valide. `pnpm test`/`pnpm check` grün.
- `docs/faq-template-style-guide.md` wird in 11.10 nachgezogen (nicht hier).

### Previous Story Intelligence

- **Story 2.5b:** FAQ-Template-System + 5-Spalten-PK in `faq_qna` (`schema/faq-qna.ts`). PK enthält `templateId` → Entfernen eines Templates reduziert Zeilen sauber.

## References

- [Source: _bmad-output/planning-artifacts/epics.md, Epic 11, Story 11.2]
- [Source: _user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md, Abschnitt 2 (FAQ-Problem) + Stufe 1.1]
- [Source: src/lib/data/faq-templates/laerm/laerm.de.yaml]
- [Source: scripts/render-faq.ts:184-231]
- [Source: src/lib/server/faq/template-schema.ts]
- [Source: src/lib/server/faq/load-templates.ts]
- [Source: src/lib/components/atlas/faq-section.svelte:35]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code)

### Debug Log References

- RED: `detail-faq-invariant.test.ts` listet 16 Offender (laerm 4, gruen 2, klima 4, oepnv 4, wohnen 2), `wohnen-stigma-disclaimer` korrekt via Allowlist ausgenommen.
- `laerm-wie-aktuell` hat `requires: [laerm.dominantCategory]` + `applicableTo [bezirk, kiez]` → bewusst NICHT geändert (kiez-spezifisch). Beim Edit beinahe miterwischt, per präzisem id-Kontext-Match vermieden.

### Completion Notes List

- 16 reine Erklär-Templates (`requires: []`) von kiez/bezirk auf `[layer]` umgescopt. Behebt AEO-Duplicate-Content (identischer Text × 155).
- **Ausnahme (ADR-015):** `wohnen-stigma-disclaimer` bleibt auf kiez/bezirk — Anti-Stigma-Kontext darf nicht von den Seiten verschwinden, die Wohnlage zeigen. Im Invariant-Test als Allowlist dokumentiert.
- Kein methodik-PageType nötig (Enum = bezirk/kiez/layer); Erklärer sind auf 51 Layer-Seiten erreichbar (kein Content-Verlust).
- AC-2-Cross-Link: `faq-section.svelte` zeigt auf kiez/bezirk einen `/methodik`-Link, nicht auf Layer.
- Verify: Kiez-FAQ = 5 requires-Templates + Stigma-Disclaimer; Re-Build 1818 Q&As; FAQPage-JSON-LD valide.
- `pnpm check` 0 Errors; Suite 2734 Tests grün (inkl. neuer Invariant- + Component-Tests).

### File List

**Neu:** src/lib/server/faq/detail-faq-invariant.test.ts
**Geändert:** src/lib/data/faq-templates/{laerm,gruen,klima,oepnv,wohnen}/*.de.yaml, src/lib/components/atlas/faq-section.svelte (+ .test.ts)
**DB (lokal):** faq_qna via `pnpm data:faq` neu befüllt

## Change Log

- 2026-06-06: Story 11.2 implementiert. FAQ-Entrümpelung (16 Erklärer → Layer, Stigma-Ausnahme), Methodik-Link auf Detailseiten. Status → review.
