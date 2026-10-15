---
title: 'S5: Verlässliches lastmod und harter Prod-Build'
type: 'bugfix'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: '8328e0882f7a517802c2db085bf9c137ecb6d116'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/seo-investigation-s2-s5.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `lastmod` in der Sitemap sagt nichts über Inhaltsänderungen: statische Seiten, Wahl-Portal und Ranking tragen den Build-Zeitpunkt, alle 143 Kieze und 12 Bezirke das Datum des Grenzlayers (16.05.2026), der Sitemap-Index `new Date()`. Google ignoriert unzuverlässige Werte. Außerdem verschwinden Wahl-Seiten still aus der Sitemap, wenn der Build ohne Datenbank läuft, und Prerender-Fehler sind nur Warnungen: in S1 baute ein Fehler alle prerenderten Seiten als 404/500, der Build blieb grün.

**Approach:** `lastmod` nur aus echten Inhaltsdaten, sonst weglassen. Prod-Build bricht bei Prerender-HTTP-Fehlern und bei fehlenden Wahl-Daten ab.

**Entscheidungen (Empfehlung, Freigabe Matze 15.10. für den Epic):**
- Kiez/Bezirk: `lastmod` = späteres Datum aus Profil-Frontmatter (`generatedAt`; EN-Seite `translatedAt`) und `generatedAt` von `kiez-scores.json`.
- Layer: `sourceUpdatedAt`, sonst `fetchedAt`.
- Updates: `updated` (S2) sonst `date`. Wahl: `sourceUpdatedAt`, sonst weglassen (kein 1. Januar mehr).
- Statische Seiten, Wahl-Portal-Übersicht, Ranking: kein `lastmod`. Sitemap-Index: `lastmod` = jüngstes `lastmod` der Teil-Sitemap, sonst weglassen.
- Build-Härte nur, wenn `NODE_ENV=production` (Dockerfile) gilt; lokale Builds ohne DB bleiben möglich und warnen laut.
- `handleHttpError` wirft im Prod-Build (Allowlist leer, da aktueller Build 0 Fehler hat); `handleUnseenRoutes` bleibt Warnung.

## Boundaries & Constraints

**Always:** Bestehende Typen (`lastmod` optional) nutzen. Keine Git-Daten (im Docker-Build nicht vorhanden). `computed_at` aus der DB nicht verwenden (wird bei jedem Prebuild neu gesetzt). Tests zuerst, 43 bestehende lastmod-Assertions anpassen.

**Never:** Keine Änderung an URL-Menge der Sitemap, hreflang, JSON-LD.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Kiez | Profil `generatedAt` 2026-09-03, Scores 2026-10-14 | `lastmod` 2026-10-14 | fehlende Daten → weglassen |
| Statische Seite | `/methodik` | kein `lastmod` | N/A |
| Index | Teil-Sitemaps | `lastmod` = jüngster Eintrag | keine Einträge mit Datum → weglassen |
| Wahl ohne DB, Prod | `NODE_ENV=production`, kein `DATABASE_URL` | Build bricht mit klarer Meldung ab | — |
| Wahl ohne DB, lokal | kein Prod | Warnung, Sitemap ohne Wahl-Seiten | N/A |
| Prerender-404, Prod | defekter interner Link | Build bricht ab | — |

</frozen-after-approval>

## Code Map

Siehe `seo-investigation-s2-s5.md`, Abschnitt S5: `sitemap-builder.ts:142,179,199,90,109,250-273`; `sources/kiez-pages.ts:44-48`, `bezirk-pages.ts:45-49`, `ranking-page.ts:39`, `updates.ts:31,45,66-71`, `wahl-detail-pages.ts:46`; `routes/sitemap.xml/+server.ts:19`, `sitemap-de.xml/+server.ts:33-44`, `sitemap-en.xml/+server.ts`; `svelte.config.js:30-42`; Profil-Frontmatter `src/lib/content/{kiez,bezirk}-profile/*.md`; `kiez-scores.json` `generatedAt`. Letzter Build (15.10., S1): 0 Prerender-HTTP-Fehler, 1 Unseen-Route-Warnung.

## Tasks & Acceptance

**Execution:**
- [x] `sources/*-pages.ts` + Tests -- `lastmod` aus Inhaltsdaten bzw. weglassen.
- [x] `sitemap-builder.ts`, Index-Route + Tests.
- [x] Sitemap-Routen + Test -- Prod ohne Wahl-Daten wirft, lokal warnt.
- [x] `svelte.config.js` -- `handleHttpError` wirft bei `NODE_ENV=production`; Kommentar aktualisieren.
- [x] Prod-Build lokal einmal mit `NODE_ENV=production` und DB laufen lassen: grün.

**Acceptance Criteria:**
- Given der gebaute `sitemap-de.xml`, when man die `lastmod`-Werte zählt, then trägt keine Kiez-Seite mehr das Grenzlayer-Datum und keine statische Seite den Build-Zeitpunkt.

## Implementation Notes

- Neu: `src/lib/seo/lastmod.ts` (`validLastmod`, `latestLastmod`, `profileLastmod`). Ungültige Datumswerte lassen `lastmod` weg.
- Neu: `sources/profile-dates.ts` liest `generatedAt`/`translatedAt` aus dem Profil-Frontmatter und `generatedAt` aus dem Kopf (erste 2 KB) von `kiez-scores.json`. Keine Versionshistorie, kein `computed_at`.
- Kiez/Bezirk: `lastmod` = späteres von Profil-`generatedAt` (EN zusätzlich `translatedAt`) und Scores-`generatedAt`. Der Kontext trägt dafür `profileDates` und `scoresGeneratedAt`.
- Layer: `sourceUpdatedAt`, sonst `fetchedAt`. Updates: `entryModifiedDate` (S2), Index = jüngstes gültiges Datum. Wahl: nur `sourceUpdatedAt`. Statische Seiten, Wahl-Portal und Ranking: kein `lastmod`.
- Index (`sitemap.xml`): `lastmod` je Teil-Sitemap = jüngstes `lastmod` ihrer Einträge, sonst weggelassen. Er lädt dafür beide Sitemaps über `sitemap-context.ts`.
- `sitemap-context.ts` bündelt das Laden für alle drei Routen. `sitemap-wahlen.ts` wirft im strikten Build ohne `DATABASE_URL`, bei DB-Fehler und bei leerer Wahl-Liste. Lokal warnt es laut und liefert `[]`. Die Fehlermeldung nennt nur `err.code` bzw. `err.name`, nie die Treibermeldung.
- Entscheidung: leere Wahl-Liste zählt im strikten Build als fehlende Daten und bricht ab.
- Entscheidung: EN-Seite nimmt das Maximum aus `generatedAt`, `translatedAt` und Scores-Datum. Eine veraltete Übersetzung fällt auf den DE-Text zurück, dessen Datum zählt dann mit.
- Strict-Flag statt NODE_ENV: `vite build` setzt `NODE_ENV=production` selbst, jeder lokale Build wäre sonst strikt. Die Härte hängt an `NAVIGATOR_STRICT_BUILD=1` (`isStrictBuild()` in `src/lib/build/strict-build.js`, Dockerfile setzt es in der Build-Stage). Ohne Flag warnen alle Stellen nur.
- `svelte.config.js` importiert `createHandleHttpError` aus `strict-build.js` (reines JS, getestet): strikt wirft der Handler, sonst Warnung, Allowlist `ALLOWED_HTTP_ERROR_PATHS` bleibt leer. `handleUnseenRoutes` bleibt Warnung.
- `validLastmod` akzeptiert nur `YYYY-MM-DD` und ISO-Datetime mit Zeitzone und prüft den Kalender (2026-02-30 fällt durch).
- `profile-dates.ts`: kaputte Einzeldatei (YAML, Datum) wird mit Dateiname gewarnt und übersprungen. Dateinamen müssen `^([a-z0-9-]+)(?:\.(en))?\.md$` entsprechen. Fehlendes Verzeichnis, fehlende Scores-Datei oder fehlendes `generatedAt` warnt, im strikten Build wirft es.
- `buildTimestamp` ist aus dem Sitemap-Kontext entfernt.
- Tests: neue Dateien `lastmod.test.ts`, `profile-dates.test.ts`, `sitemap-wahlen.test.ts`. Die bestehenden lastmod-Assertions sind angepasst, plus Edge Cases (fehlende/ungültige Daten, EN mit `translatedAt`, Index ohne datierte Einträge, Prod ohne DB).
- Ergebnis Build lokal mit DB, ohne Flag und mit `NAVIGATOR_STRICT_BUILD=1` jeweils grün; `sitemap-de.xml` vorher/nachher: statisch 11/0, Wahl-Portal 1/0, Kiez 143/143 (vorher alle 2026-05-16, nachher alle 2026-06-10), Bezirk 12/12 (gleiche Daten), Layer 58/58, Updates 15/15, Wahl-Detail 23/3. Index vorher `new Date()`, nachher 2026-10-14.

## Spec Change Log

- 15.10.2026, nach Review: Die Build-Härte hängt an `NAVIGATOR_STRICT_BUILD=1` statt an `NODE_ENV=production`. Grund: `vite build` setzt `NODE_ENV=production` selbst, die Spec-Absicht „lokale Builds ohne DB bleiben möglich“ wäre sonst verfehlt. Das Dockerfile setzt das Flag in der Build-Stage.

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, Edge, VerifGap | `vite build` setzt `NODE_ENV=production`, jeder lokale Build wäre strikt | high | patch (`NAVIGATOR_STRICT_BUILD`) |
| VerifGap | `handleHttpError` ungetestet | high | patch (ausgelagert + Tests) |
| Blind, Edge | Kaputtes Profil-Frontmatter bricht alle Sitemaps, fehlende Quellen still | medium | patch |
| Blind, Edge | `validLastmod` akzeptiert Nicht-W3C-Formate | medium | patch |
| VerifGap | Index ohne Datum, echte Kiez-Verdrahtung, lokale leere Wahl-Liste, Bezirk-Fixture ungetestet | medium | patch |
| Edge | Layer-Platzhalter `YYYY-01-01` vor `fetchedAt` | medium | defer (Spec-Entscheidung, Matze) |
| Blind, Edge | Vierfaches Laden der Quellen | medium | defer |
| Blind, Edge | DB-Fehlertext im Build-Log | low | patch |
| Blind | `buildTimestamp` toter Code | low | patch |
| Blind | Slug-Ableitung nur `.en.md` | low | patch |
| Blind | Kiez/Bezirk-Source dupliziert | low | defer |
| Blind | Scores-`generatedAt` ändert sich bei jedem Lauf | low | reject: nur die Daten-Pipeline schreibt es, nicht der Build |
| Blind | EN-Datum springt bei neuer DE-Generierung | low | reject: Spec-Entscheidung (DE-Fallback zählt mit) |
| Blind | Allowlist-Pfad-Normalisierung | low | reject: Liste leer |

## Verification

**Commands:**
- `pnpm exec vitest run src` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `NAVIGATOR_STRICT_BUILD=1 pnpm build` mit DB -- expected: grün; `static/kiez-scores/region-composites.json` zurücksetzen
