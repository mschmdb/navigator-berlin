---
type: architecture
audience: owner, llm
last-verified: 2026-06-07
---

# AEO-Content-Strategie für Kiez/Bezirk-Seiten (Epic 11)

Wie navigator.berlin die 143 Kiez- und 12 Bezirks-Seiten von „datenstark, aber sprachlos" zu einzigartigen, zitierfähigen Seiten bringt. Quelle: `_user-input/kiez-bezirk-content-aeo-analyse-2026-06-06.md`.

## Problem

Vorher: Detailseiten zeigten nur den Dominant-Wert je Cluster, die FAQ bestand zu ~75% aus identischem Erklärtext über alle 155 Seiten (Duplicate-Content). Kein Ranking, kein Vergleich, keine Prosa.

## Drei Stufen

**Stufe 1 (eigene Daten):**
- Ranking + Quartil je Score-Dimension/Metrik (`kiez_rank`/`bezirk_rank`, Story 11.0, `pnpm data:rank`).
- Vergleich Kiez ↔ Bezirks-Schnitt ↔ Berlin-Median (`kiez_comparison`/`bezirk_comparison`, Story 11.4, `pnpm data:comparison`), gerendert als „Im Vergleich"-Tabelle.
- FAQ entrümpelt: Erklär-Templates (`requires: []`) nur noch auf Layer/Methodik-Seiten, nicht auf Detailseiten (Story 11.2). Neue Daten-FAQ kombiniert Rang + Vergleich + Zahl, answer-first (Story 11.3).
- Verteilungen + Zähldaten im Steckbrief (Story 11.5), in `<details>` kompakt.

**Stufe 2 (KI-Profile):**
- Pro Kiez/Bezirk ein grounded 2-Absatz-Profil (Story 11.6). Pipeline siehe unten.
- Faktentreue-Gate `pnpm lint:profiles` (Story 11.7).

**Stufe 3 (externe Anreicherung):**
- Wikidata/Wikipedia `sameAs` in Place/AdministrativeArea-JSON-LD je Bezirk (Story 11.1).
- Bezirksregionenprofile als zusätzliche Prosa-Quelle (Story 11.8, optional/Spike).

## Profil-Pipeline (Story 11.6/11.7)

Entkoppelt vom Deploy (ADR-016): **kein LLM-Call im Build/Production-Pfad**, NICHT in `prebuild`.

```
data:rank + data:comparison + data:aggregate(-scores)   (DB-Aggregate)
        │
        ▼
scripts/lib/profiles/build.ts  buildAllInputs()         (ProfileInput + inputHash, geteilt mit Lint)
        │
        ├── pnpm data:profiles            → Claude API (claude-sonnet-4-6), schreibt Content-Files
        └── pnpm data:profiles --dump-inputs → JSON → Claude-Code-Subagenten (Opus, gratis) schreiben Content-Files
        │
        ▼
src/lib/content/{kiez,bezirk}-profile/{slug}.md         (committet, Frontmatter: slug,name,pageType,model,inputHash,generatedAt)
        │
        ├── pnpm lint:profiles            → Fakten-Lint-Gate (jede Zahl gedeckt, keine em-dashes)
        ▼
get-profile.ts (Prerender liest File) → kiez-hero/bezirk-hero Profil-Sektion + llms.txt/llms-full.txt
```

Inkrementell: `inputHash` (Hash über den ProfileInput) überspringt unveränderte Areas; `lint:profiles` meldet `stale` bei Abweichung.

## Externe Quellen + Lizenz

| Quelle | Nutzung | Lizenz |
|--------|---------|--------|
| Wikidata | `sameAs` je Bezirk (Q-IDs) | CC0 |
| Wikipedia (de) | `sameAs` je Bezirk | CC BY-SA 4.0 |
| Bezirksregionenprofile (berlin.de) | optionale Prosa-Quelle (11.8) | offen, je Bezirk |
| eigene Aggregate (`*_score`/`*_stats`/`*_rank`/`*_comparison`) | Profile + FAQ + Vergleich | siehe `/lizenzen` (FR40-Attribution je Layer) |

## Anti-Stigma (ADR-015)

Ranking-Anzeige nutzt `formatRank`: exakter Rang für Q1–Q3, „unteres Viertel" statt „Platz 143 von 143" für Q4. Profile + FAQ vermeiden Wertungen („guter/schlechter/beliebter Kiez").

## Begriff „Kiez"

„Kiez" = amtliche LOR-Bezirksregion 2021 (143), nicht das umgangssprachliche gefühlte Viertel. Erklärt auf der Methodik-Seite (Story 11.9).
