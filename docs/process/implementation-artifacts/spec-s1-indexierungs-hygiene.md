---
title: 'S1: Indexierungs-Hygiene (Hitze-Canonical, Explore-Parameter, Fehlerseiten, robots)'
type: 'bugfix'
created: '2026-10-15'
status: 'done'
route: 'dispatch'
baseline_commit: '6aa91d75abe6949c65b44c86fed2ab0027fd4b27'
review_loop_iteration: 0
context:
  - '{project-root}/docs/process/planning-artifacts/seo-audit-2026-10-15.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Suchmaschinen sehen falsche oder unerwünschte URLs. `/hitze` hat live das Canonical `https://navigator.berlin./hitze` (EN `…./../en/hitze`), weil ein beim Prerender relativer Pfad an die Domain gehängt wird. Rund 213 Seiten verlinken `/explore` mit Parametern (`?layers=`, `?kiez=`, `?bezirk=`, `?finder=1`, `?address=`); die Search Console zeigt Impressionen für solche URLs. SSR-Routen auf `hitze.navigator.berlin` setzen selbstreferenzierende Canonicals auf die Subdomain. Fehlerseiten haben keinen Titel und kein `noindex`, `/demo` ist ohne `noindex` erreichbar. In `robots.txt` gilt `Disallow: /api/` nicht für die AI-Bot-Gruppen.

**Approach:** Canonicals immer absolut auf `https://navigator.berlin` mit lokalisiertem Pfad, zentral normalisiert. `/explore` mit Query bekommt `X-Robots-Tag: noindex, follow`, Canonical bleibt `/explore`. Neue Fehlerseite mit Titel und `noindex`. `/demo*` mit `noindex`. `Disallow: /api/` in jeder Allow-Gruppe.

**Entscheidungen (Empfehlung, Freigabe Matze 15.10. für den Epic):**
- Origin-Normalisierung zentral (Helfer in `src/lib/seo/canonical.ts`), genutzt von `seo-head.svelte` und `/hitze`; Subdomain `hitze.` wird auf die Hauptdomain gemappt, lokale Origins bleiben lokal.
- Kein Redirect der Hitze-Subdomain (Reroute-Verhalten bleibt), nur Canonical.
- `noindex, follow` (nicht `nofollow`), damit Links aus `/explore` weiter zählen.
- Fehlerseite: Titel „Seite nicht gefunden · navigator.berlin“ (404) bzw. „Fehler · navigator.berlin“, DE/EN, Link zur Startseite und zum Atlas.

## Boundaries & Constraints

**Always:** Bestehender Hook `handleNoIndexHeaders` (`src/hooks.server.ts:74`) wird erweitert, nicht dupliziert. Canonical und `og:url` immer identisch. DE/EN. Tests zuerst (Pragmatic TDD).

**Never:** Keine Änderung an Sitemap-Inhalten, JSON-LD (S3/S4), Titeln/Beschreibungen (S6). Kein `Disallow` für `/explore` oder `/layers/` in robots (Render-Ressourcen). `/explore` ohne Query bleibt indexierbar.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hitze DE | `/hitze` (Prerender) | Canonical und `og:url` `https://navigator.berlin/hitze` | N/A |
| Hitze EN | `/en/hitze` | `https://navigator.berlin/en/hitze` | N/A |
| Hitze-Subdomain | Host `hitze.navigator.berlin`, Pfad `/` | Canonical `https://navigator.berlin/hitze` | N/A |
| Subdomain SSR | Host `hitze.navigator.berlin`, `/explore` | Canonical `https://navigator.berlin/explore` | N/A |
| Explore Query | `/explore?kiez=reuterstrasse` | Header `X-Robots-Tag: noindex, follow`, Canonical `/explore` | N/A |
| Explore ohne Query | `/explore` | kein `X-Robots-Tag` | N/A |
| 404 | `/gibtsnicht` | Status 404, `<title>` gesetzt, `<meta name="robots" content="noindex">` | N/A |
| Demo | `/demo` | `noindex` (Header oder Meta) | N/A |
| robots | `/robots.txt` | jede `Allow`-Bot-Gruppe enthält `Disallow: /api/` | N/A |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/hitze/+page.svelte:32-61` -- `primaryOrigin` + `localizedHref('/hitze')` (liefert beim Prerender relativ `./hitze`) → Ursache. Auf `localizedPathname` (`src/lib/seo/canonical.ts:36`) und den neuen Origin-Helfer umstellen.
- `src/lib/seo/canonical.ts` -- `buildCanonical` (12), `localizedPathname` (36); neuer Helfer `canonicalOrigin(origin)` (Hitze-Subdomain → Hauptdomain).
- `src/lib/components/seo-head.svelte` (bzw. Fundort von SeoHead) -- Canonical/`og:url` über den Helfer.
- `src/hooks.server.ts:64-83` -- `handleNoIndexHeaders`: ergänzen um `/explore` mit nicht-leerer Query und `/demo*`.
- Neu `src/routes/+error.svelte` -- Titel, `noindex`, DE/EN-Texte, Links.
- `src/routes/robots.txt/+server.ts:40-60` + `renderBotBlock` -- `Disallow: /api/` in Allow-Gruppen.
- Tests: `hooks.server.test.ts`, `canonical.test.ts`, robots-Test, Hitze-Page-Test; E2E für Header und Fehlerseite.

## Tasks & Acceptance

**Execution:**
- [x] `canonical.test.ts`, `canonical.ts` -- Red/Green: Origin-Helfer (Subdomain, lokal, Hauptdomain, Trailing Slash).
- [x] Hitze-Seite + SeoHead -- Canonical/`og:url` absolut; Page-Test DE/EN.
- [x] `hooks.server.test.ts`, `hooks.server.ts` -- `noindex, follow` für `/explore?…` und `/demo*`, nicht für `/explore`.
- [x] `+error.svelte` + Test -- Titel, Meta robots, DE/EN.
- [x] robots-Test + `robots.txt/+server.ts`.
- [x] E2E: Header auf `/explore?kiez=x`, Fehlerseite 404 mit Titel/noindex, Hitze-Canonical im gebauten HTML.

**Acceptance Criteria:**
- Given der gebaute `/hitze`, when man das Canonical liest, then lautet es `https://navigator.berlin/hitze`.
- Given ein Link auf `/explore?layers=x`, when Google die URL abruft, then sieht es `noindex, follow` und das Canonical `/explore`.

## Implementation Notes

- Ursache Hitze-Canonical präzisiert: `/hitze` ist SSR (`prerender = false`); `localizedHref` liefert serverseitig relative Pfade (`./hitze`, `../en/hitze`). Gleicher Fehler steckte in den Breadcrumb-JSON-LD von zehn Seiten (live u. a. `/methodik`, `/lizenzen`). Alle auf `localizedPathname` umgestellt; `jsonld-breadcrumb.ts` lehnt relative Pfade per Guard ab.
- `canonicalOrigin` in `src/lib/seo/canonical.ts`, zentral in SeoHead; Hitze reicht nur noch die Origin durch.
- `handleNoIndexHeaders`: `noindex, follow` für `/explore?…` und `/demo*`. Liest `url.search` nur für `/explore` und fängt den Prerender-Fehler ab; ein erster Stand las `search` für alle Pfade und ließ alle prerenderten Seiten mit 404/500 bauen (Build blieb grün, siehe S5). Regressionstests dazu.
- Fehlerseite: `src/lib/components/atlas/error-content.svelte` (404, sonstige 4xx, 5xx), genutzt von `src/routes/+error.svelte` (mit `<main id="main">`) und `src/routes/(with-header)/+error.svelte` (Header bleibt).
- `robots.txt`: `Disallow: /api/` und `/en/api/` in allen Allow-Gruppen.
- Verifikation: Unit 4.904 grün, `pnpm check` 0, Build ohne Prerender-Fehler, E2E 172/172; Preview: Canonical `/hitze` absolut, keine `/./` in JSON-LD, `X-Robots-Tag: noindex, follow` auf `/explore?kiez=…`.

## Spec Change Log

## Review Triage Log

| Reviewer | Fund | Verdikt | Route |
|---|---|---|---|
| Blind, Edge, VerifGap, Orchestrator | Breadcrumb-JSON-LD mit relativen Pfaden (`/./`, `/../en/`); live auch auf `/methodik`, `/lizenzen` | high | patch (projektweit, Guard im Builder) |
| Blind | Hitze baut Canonical selbst, umgeht zentrale Normalisierung | medium | patch |
| VerifGap, Blind | SeoHead mit Hitze-Origin ungetestet, Subdomain-Matrixzeilen ohne Test | medium | patch |
| Blind, Edge | Fehlerseite: Skip-Link ins Leere, nav-Label = Titel, 4xx-Text falsch, kein Header bei 404 in `(with-header)` | medium | patch |
| VerifGap, Blind | 404/Generic-Zweig der Fehlerseite ungetestet | low | patch (mit Fehlerseiten-Patch) |
| Blind, Edge | `robots.txt` ohne `/en/api/` | low | patch |
| Blind, Edge | Verwaister JSDoc im Hook, fehlende Edge-Tests | low | patch |
| Blind | Spec nennt Prerender als Ursache, `/hitze` ist SSR | low | reject: Fix wäre Spec-Edit; Ursache (relativer `resolve()`-Pfad) in Implementation Notes präzisiert |
| Blind | `canonicalOrigin` nur für exakte Hitze-Subdomain | low | reject: Traefik routet nur Haupt- und Hitze-Host (Memory Infra) |

## Verification

**Commands:**
- `pnpm exec vitest run src/lib/seo src/hooks.server.test.ts src/routes` -- expected: grün
- `pnpm check` -- expected: 0 Fehler
- `pnpm build` separat, Preview 4173, Playwright mit temporärer Config (repo-Config ohne `reuseExistingServer`); danach `static/kiez-scores/region-composites.json` per `git checkout` zurücksetzen -- expected: grün
