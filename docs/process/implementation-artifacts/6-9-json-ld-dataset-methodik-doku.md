# Story 6.9: JSON-LD Dataset + Methodik-Doku

Status: backlog

<!-- Created 2026-05-18. Blocked by 6-0 + 6-4 (Detail-Pages müssen existieren). -->

## Story

As a Suchmaschine / LLM-Crawler,
I want Wahldaten als strukturierten Dataset mit dokumentierter Methodik erkennen,
so that Wahl-Pages als zitierbare Quellen indexierbar sind.

## Quellen

- **Story 5.9:** `buildDataset` Generator-Reuse.
- **Story 1.29:** Methodik-Page für `#wahldaten`-Section.
- **Story 2.8:** llms.txt + llms-full.txt-Erweiterung.

## Acceptance Criteria

**AC-1 (Dataset-JSON-LD pro Wahl-Page):**

**Given** die Wahl-Detail-Pages (Story 6.4)
**When** ich `JsonLd` mit `Dataset`-Schema (`name`, `description`, `license = CC-BY`, `dateModified` = Wahl-Datum, `creator` = Berlin Landeswahlleitung / Bundeswahlleiterin, `distribution.contentUrl` → Roh-CSV-URL, `keywords` mit Wahl-Typ + Jahr) via Story-5.9-`buildDataset` einbinde
**Then** jede Wahl ist als Datenset für Google-Dataset-Search + LLM-Crawler erkennbar

**AC-2 (Methodik-Page-Section #wahldaten):**

**Given** die Methodik-Page (Story 1.29)
**When** ich Section `#wahldaten` mit Unterabschnitten ergänze:
- Datenquellen (statistik-berlin-brandenburg.de + bundeswahlleiterin.de)
- Daten-Cutoff-Begründung (2011+ AGH/BVV, 2013+ BTW)
- Briefwahl-Asymmetrie-Methodik (pre-2021 nur Bezirks-Aggregat)
- Stimmbezirks-zu-Kiez-Aggregation-Strategie (Centroid-Methode)
- Wiederholungswahl-2023-Behandlung (is_repeat_election-Flag)
- Update-Cadence (manuell nach Wahl, kein Live-Refresh)
- Coverage-Lücken pre-2017-Wahlbezirks-Geometrien (FragDenStaat = Phase-2)
**Then** Methodik ist transparent dokumentiert
**And** Cross-Layer-Templates-Guide (Story 6.7) verlinkt aus dieser Section
**And** Speakable-Spec (Story 5.9 Builder) erweitert um `#wahldaten`-Section

**AC-3 (llms.txt + llms-full.txt-Erweiterung):**

**Given** llms.txt + llms-full.txt (Story 2.8)
**When** Builder läuft
**Then** Wahl-Pages sind in llms.txt aggregiert (12 URLs)
**And** llms-full.txt enthält Wahl-Methodik-Section + Beispiel-Aggregat pro Wahl-Typ (Berlin-Gesamt + 1 Bezirk + 1 Kiez als Sample)

**AC-4 (Tests):**

- Dataset-JSON-LD-Builder-Tests pro Wahl-Slug
- Methodik-Page-Section-Render-Test
- llms.txt-Wahl-URL-Coverage-Test

## Tasks/Subtasks

- [ ] T1: Wahl-Detail-Page Dataset-JSON-LD-Einhängung (Story 6.4 Erweiterung)
- [ ] T2: Methodik-Page-Section `#wahldaten` mit 7 Unterabschnitten
- [ ] T3: Speakable-Spec-Erweiterung (Story 5.9 Generator)
- [ ] T4: llms.txt-Builder-Update (Story 2.8 Renderer)
- [ ] T5: llms-full.txt-Sample-Data-Renderer für Wahl
- [ ] T6: Tests
