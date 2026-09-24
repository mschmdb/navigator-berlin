---
title: 'Wahl-Detailseiten ins Portal überführen (yaml-Story 12)'
type: 'feature'
created: '2026-09-23'
status: 'done'
baseline_commit: 'c52335d572e6f3a2000e4908f0993eabfcfdbc3d'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/specs/spec-berlin-wahlen/technical-notes.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Die Einzelwahl-Seiten liegen unter `/wahl` und `/wahl/[slug]`, das Portal unter `/berlin-wahlen`. Zwei Adressräume teilen das SEO-Gewicht, und interne Links führen am Portal vorbei. (CAP-16, CAP-13-Redirects; Entscheidung Matze 19.09.)

**Approach:** Die Detailseiten ziehen nach `/berlin-wahlen/[slug]` (Slugs unverändert, prerendered). `/wahl` antwortet mit 301 auf `/berlin-wahlen`, `/wahl/[slug]` mit 301 auf `/berlin-wahlen/[slug]`. Alle internen Links, Sitemap, llms und OG zeigen direkt auf die neuen URLs.

## Boundaries & Constraints

**Always:**
- 301 per Hook-Muster `renamed-route-redirect.ts`, Query-String bleibt erhalten, nur valide Slugs (`parseWahlSlug`) werden umgeleitet, sonst 404.
- Alte Routen-Ordner löschen: adapter-node liefert prerenderte Dateien vor `handle` aus, sonst greift der 301 nie.
- Kein interner Link auf `/wahl` oder `/wahl/…` bleibt übrig (Abschluss-Check per grep); `/api/wahl/*` und `/og/wahl/*` bleiben.
- Vorläufig-Badge, JSON-LD (Breadcrumb Berlin → Wahlen → Wahl, Dataset), OG-Bild und Disclaimer bleiben auf der Detailseite erhalten.
- TDD pro AC, `lint:wahl` deckt die neue Route ab.
- Entscheidung Matze 23.09. (1A): `wahlPortal` wird mit diesem Deploy `true`. Portal indexierbar, in Sitemap und llms; die Redirects greifen ab Launch 29.09.
- Entscheidung Matze 23.09. (2A): Die bestehende SSR-Detailseite zieht um und bekommt den Portal-Rahmen (`KapitelSection`, `PortalDatenstand`, `VorlaeufigBadge`). Inhalt bleibt serverseitig gerendert, dazu ein Deep-Link „Im Portal ansehen“ mit `?reihe=&jahr=` (bei Erststimme auf die Reihe ohne Stimmtyp-Wechsel, Hinweis im Link-Text).
- Entscheidung Matze 24.09. (Review, Intent-Gap „verwaiste Detailseiten“, A): Das bestehende Kapitel Methodik/Quellen des Portals bekommt einen kompakten Block „Alle Wahlen einzeln“, nach Wahltyp gruppiert, der alle Detailseiten (inkl. Erststimme, Wiederholungswahlen) verlinkt. Kein neues Kapitel. Code bleibt, Umsetzung als Patch.

**Never:**
- Kein Umbau der Portal-Hauptseite, keine neuen Kapitel (Ausnahme: Block „Alle Wahlen einzeln“ im bestehenden Methodik-Kapitel).
- Keine Einstiegspunkte aus yaml-Story 13 (Home-Feature-Block, Footer-Link, OG-Final).
- Kein Subdomain-Alias.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Index-Redirect | GET `/wahl` bzw. `/wahl/` | 301 → `/berlin-wahlen` | N/A |
| Detail-Redirect | GET `/wahl/2023-agh-zweitstimme?x=1` | 301 → `/berlin-wahlen/2023-agh-zweitstimme?x=1` | N/A |
| Ungültiger Slug | GET `/wahl/foo` | kein Redirect | 404 |
| Neue Detailseite | GET `/berlin-wahlen/2026-bvv` (prerendered) | Seite mit Ergebnis, Karte, Vorläufig-Badge, Breadcrumb auf `/berlin-wahlen` | N/A |
| Erststimme | GET `/berlin-wahlen/2021-agh-erststimme` | Seite zeigt Erststimmen-Zahlen, nicht Zweitstimme | N/A |
| Unbekannter Slug neu | GET `/berlin-wahlen/2030-agh-zweitstimme` | kein Treffer | 404 |

</frozen-after-approval>

## Code Map

- `src/routes/(with-header)/wahl/+page.*`, `wahl/[slug]/+page.*`, `slug-utils.ts`, Tests -- Quelle der Detailseite; Ordner wird nach `berlin-wahlen/[slug]/` verschoben bzw. gelöscht.
- `src/lib/seo/renamed-route-redirect.ts` (+ Test), `src/hooks.server.ts:29-38` -- exakte Map, braucht Präfix-Regel `/wahl/<slug>` mit `parseWahlSlug`-Validierung.
- `svelte.config.js:22` -- Prerender-Crawler `entries: ['*']`; übrig gebliebene `/wahl`-Links würden als meta-refresh-HTML mit 200 geschrieben, `handleHttpError` warnt nur.
- Link-Stellen: `wahl-section.svelte:546-551`, `home-wahl-teaser.svelte:56,75`, `atlas/internal/meta-links.ts:23,40`, `methodik/+page.svelte:317`, `methodik/wahldaten/+page.svelte:280`, `berlin-wahlen/+page.svelte:211` (DataCatalog `urlPath`), `seo/llms-builder.ts:214,221`, `server/llms/wahl-renderer.ts:73`, `seo/sources/wahl-detail-pages.ts:37`, `server/og/page-card-template.ts:646`, `_content/updates/2026-05-19-wahldaten.md:19`; Kommentare in `sitemap-builder.ts:30`, `source-label.ts:4`, `format-berlin-date.ts:6`.
- Tests mit `/wahl`-Erwartung: `seo/sources/wahl-detail-pages.test.ts`, `server/llms/wahl-renderer.test.ts:60`, `llms-sitemap-consistency.test.ts`.
- `src/lib/data/feature-flags.ts:21` -- `wahlPortal`; Sitemap/llms-Einträge des Portals hängen daran (`sitemap-builder.ts:144-152`, `llms-builder.ts:163-170`).
- `scripts/lint-wahl-editorial.ts:12` -- `TARGET_PATHS` auf neue Route umstellen.
- Slug-Logik mehrfach (`slug-utils.ts`, `wahl-detail-pages.ts:24`, `wahl-section.svelte:546`, `api/wahl/list/+server.ts:18`) -- nach dem Umzug `parseWahlSlug`/`buildWahlSlug` aus `src/lib/` importieren, keine neue Kopie.
- Hinweis Story 17: Detailseiten-Choropleth nutzt jetzt `wahlgruppen-*` und `src/lib/data/wahl-gruppe-label.ts`; beim Umzug unverändert übernehmen.
- Nicht ändern: Portal-Hauptseite, `/api/wahl/*`, OG-PNG-Pfade `static/og/wahl/*`.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/data/wahl-slug.ts` (+ Test) -- `parseWahlSlug`/`buildWahlSlug` aus `wahl/[slug]/slug-utils.ts` nach `src/lib` ziehen, Kopien darauf umstellen
- [x] `src/routes/(with-header)/berlin-wahlen/[slug]/+page.*` -- Detailseite laut Entscheidung 2A, Breadcrumb/JSON-LD auf neue Pfade, Portal-Deep-Link
- [x] `src/routes/(with-header)/wahl/` -- Ordner löschen
- [x] `src/lib/seo/renamed-route-redirect.ts` (+ Test) -- `/wahl` exakt, `/wahl/<slug>` per Präfix mit Slug-Validierung
- [x] Link-Stellen der Code Map + Tests -- direkt auf `/berlin-wahlen[/slug]`
- [x] Sitemap/llms (`wahl-detail-pages.ts`, `llms-builder.ts`, Consistency-Test) -- neue Pfade, `lastmod` aus `sourceUpdatedAt` mit Jahres-Fallback; `wahlPortal: true` (1A), Flag-Tests anpassen
- [x] `page-card-template.ts`, `lint-wahl-editorial.ts`, `docs/wahldaten-methodik.md`, `technical-notes.md` -- Pfade nachziehen

**Acceptance Criteria:**
- Given der Build, when `grep -rn "['\"\`(]/wahl[/'\"\`)]" src _content` läuft, then gibt es keinen Seiten-Link mehr auf `/wahl`.
- Given `pnpm build && pnpm preview`, when `/wahl/2023-bvv` aufgerufen wird, then antwortet der Server mit 301 auf `/berlin-wahlen/2023-bvv`, und die Zielseite ist prerendered.
- Given die Sitemap, when sie erzeugt wird, then enthält sie `/berlin-wahlen/<slug>` für alle Wahlen und keinen `/wahl`-Pfad.

## Implementation Notes

- Slug-Logik konsolidiert: `api/wahl/list/+server.ts` (lokales `buildSlug`), `wahl-detail-pages.ts` (lokales `slugFor`), `wahl-section.svelte` (Inline-Template-Literal) und `llms/data-collector.ts#collectWahlen` (Inline-Template-Literal) importieren jetzt `buildWahlSlug` aus `$lib/data/wahl-slug.ts` statt eigener Kopien.
- Detailseite (Entscheidung 2A): `KapitelSection` für Berlin-gesamt/Karte/Bezirke-Blöcke, `PortalDatenstand` (minJahr=maxJahr=Wahljahr, status `loaded`) und `VorlaeufigBadge` (unverändert) übernommen. Portal-Deep-Link „Im Portal ansehen" nutzt `serializePortalState({ reihe: wahl.typ, jahr: wahl.jahr, ebene: DEFAULT_EBENE })`; bei Erststimme bleibt die Reihe/Stimmtyp unverändert (Portal kennt keinen Erststimme-Toggle), Link-Text trägt den Hinweis „(zeigt Zweitstimme, Erststimme nur hier)".
- `wahl-detail-pages.ts`: `lastmod` nutzt jetzt `sourceUpdatedAt` (ISO, wenn vorhanden -- v.a. für die vorläufigen AGH/BVV-2026-Ergebnisse), sonst Fallback `Wahljahr-01-01`. `SitemapSourceContext.wahlen[].sourceUpdatedAt` neu, `sitemap-de.xml/+server.ts` reicht `wahl.sourceUpdatedAt.toISOString()` durch.
- `llms-builder.ts`: Die separate „Wahl-Übersicht"-Bullet-Zeile (ehemals `/wahl`-Index) entfällt ersatzlos -- der Index existiert nicht mehr als eigene Seite, `/berlin-wahlen` deckt die Rolle bereits über den `wahlPortalEnabled`-Eintrag ab.
- `featureFlags.wahlPortal` auf `true` (Matze-Entscheidung 23.09., 1A). Dadurch mussten zwei Tests, die gegen den echten Flag-Wert assertieren (`llms-endpoints.test.ts`, `endpoints.test.ts`), von `not.toContain('/berlin-wahlen')` auf `toContain(...)` gedreht werden.
- `scripts/lint-wahl-editorial.ts`: `TARGET_PATHS`-Eintrag für die alte `wahl/[slug]/+page.svelte` entfernt statt umgeschrieben, da `SCAN_DIR_CONFIGS` das `berlin-wahlen`-Verzeichnis bereits rekursiv scannt (neue `[slug]/+page.svelte` liegt automatisch mit im Scan).
- Bekannte, vorbestehende Eslint-Regel-Verstöße (`svelte/no-navigation-without-resolve` auf einfachen `<a href>`-Links, `no-navigation-without-resolve` in `wahl-section.svelte`/`home-wahl-teaser.svelte`) bestanden schon in den migrierten Dateien vor dem Umzug (verifiziert per Diff gegen den alten Stand) und sind projektweite Alt-Last, nicht Teil dieser Story.

## Spec Change Log

## Review Triage Log

Runde 1 (24.09.2026), 3 Layer: Blind Hunter (BH) 15, Edge Case (EC) 9, Verification Gap (VG) 3 + 3. Route: IG = intent_gap (von Matze entschieden, als Patch umgesetzt), P = patch, R = reject.

| # | Layer | Fund | Verdict | Evidenz | Route |
|---|---|---|---|---|---|
| 1 | BH/EC | Detailseiten verwaist: gelöschter `/wahl`-Index war einzige Liste, Portal verlinkt keine Detailseite | high | grep `/berlin-wahlen/` in Portal-Seite ohne Treffer; Spec-Never verbot Portal-Umbau | IG → Entscheidung A, P |
| 2 | EC/VG | Nicht-kanonische Slugs (`/wahl/2023-agh`, `2023-bvv-einstimme`) → 301 auf nie prerenderte Seite | medium | `resolveWahlRedirect` übernimmt Slug wörtlich | P |
| 3 | BH/EC | `PortalDatenstand` zeigt „Wahlen 2023–2023 · Bundeswahlleiterin …“ | medium | feste Quellnamen, widerspricht `sourceName` | P |
| 4 | BH/VG | OG-PNGs tragen alten Footer `/wahl/<slug>` | medium | 23 committed PNGs, nur Template geändert | P |
| 5 | BH/EC/VG | Flag-Kommentar „Redirects erst ab 29.09.“ falsch | low | Redirect ohne Flag/Datum | P |
| 6 | BH | Linktexte „Übersicht aller Wahlen“, datierter Changelog umgeschrieben | medium | `methodik/+page.svelte`, `_content/updates/2026-05-19-wahldaten.md` | P |
| 7 | BH | Erststimmen-Hinweis im Linknamen, Link ohne Wahl/Jahr | medium | `&nbsp;`-Anhang im Link, WCAG 2.4.4 | P |
| 8 | BH | Em-dashes in neuen `describe`-Titeln | low | Projektregel U+2014 | P |
| 9 | BH | Kommentar „vierfach dupliziert“ nennt drei Dateien | low | `wahl-slug.ts` | P |
| 10 | BH | Flag-Aus-Pfad ungetestet | low | Tests gegen echten Flag-Wert gedreht | P |
| 11 | VG | llms-Wahl-URLs und Konsistenz zur Sitemap ungetestet | gap | kein Test mit `ctx.wahlen` | P |
| 12 | VG | `sourceUpdatedAt` am Sitemap-Handler ungetestet | gap | Endpoint-Test ohne Wahl-Rows | P |
| 13 | VG/BH | 301 in echter `handle`-Sequenz nur per curl; Detailseite ohne e2e/a11y | gap | kein e2e auf `/wahl`, axe nur `/berlin-wahlen` | P |
| 14 | BH | Scroll-Margin 5.5rem passt nicht ohne Reihenleiste | low | im Browser prüfen, bei Abweichung korrigieren | P |
| 15 | EC | Wohlgeformter, nicht existierender Slug → 301 auf 404 | low | gewollt einfach; Browser-Cache unkritisch für nie existierende URLs | R |
| 16 | EC | Invalid Date im Sitemap-Handler | low | Postgres liefert gültige Timestamps | R |
| 17 | EC | leerer String als `lastmod` | false | Feld ist `Date | null`, nie '' | R |
| 18 | BH | llms bei Flag aus ohne Index | low | Flag ist `true` (1A) | R |
| 19 | BH | Trailing-Slash doppelt normalisiert | low | Wrapper normalisiert vor Aufruf | R |
| 20 | BH | `changefreq` für vorläufige Seiten | low | `lastmod` reicht Crawlern | R |
| 21 | EC | gelöschter Leerzustand des Index | low | Portal hat eigenen Leerzustand | R |

## Design Notes

Präfix-Redirect als eigene kleine Funktion neben `RENAMED_ROUTES`, damit die exakte Map unangetastet bleibt:

```ts
export function resolveWahlRedirect(pathname: string): string | null {
	const p = pathname.replace(/\/$/, '');
	if (p === '/wahl') return '/berlin-wahlen';
	const m = p.match(/^\/wahl\/([^/]+)$/);
	return m && parseWahlSlug(m[1]) ? `/berlin-wahlen/${m[1]}` : null;
}
```

## Verification

**Commands:**
- `pnpm test:unit -- --run src/lib/seo src/lib/data/wahl-slug src/lib/server/llms` -- grün (voller Suite-Lauf: 441 Testdateien / 4052 Tests grün; ein bekannt flakiger `winner-map.svelte.test.ts`-Timing-Test tritt sporadisch auf, unabhängig von dieser Story, mehrfach reproduziert auch vor den Änderungen)
- `pnpm check && pnpm lint:wahl` -- 0 Fehler (svelte-check: 6537 Dateien, 0 Errors/Warnings; `lint:wahl`: 69 Dateien, 0 Violations)
- `pnpm build` -- lief gegen die echte lokale Postgres-DB (23 `wahl`-Rows) durch; keine `/wahl`-Warnungen des Prerender-Crawlers, alle 23 `/berlin-wahlen/<slug>`-Seiten prerendered, `sitemap-de.xml` enthält 24 `/berlin-wahlen`-Einträge (Portal + 23 Detailseiten) und keinen `/wahl`-Pfad

**Manual checks (gegen echten `pnpm build && pnpm preview`):**
- `curl -sI localhost:4173/wahl/2023-bvv` → `301` mit `location: /berlin-wahlen/2023-bvv` ✅
- `curl -sI localhost:4173/wahl` → `301` mit `location: /berlin-wahlen` ✅
- `curl -sI localhost:4173/wahl/foo` → `404` (kein Redirect bei ungültigem Slug) ✅
- `curl -sI "localhost:4173/wahl/2023-bvv?x=1"` → `301` mit `location: /berlin-wahlen/2023-bvv?x=1` (Query erhalten) ✅
- `curl -sI localhost:4173/berlin-wahlen/2030-agh-zweitstimme` → `404` (unbekannter neuer Slug) ✅
- `curl -sI localhost:4173/berlin-wahlen/2026-bvv` → `200`, `curl -sI localhost:4173/api/wahl/list` → `200` (API unverändert) ✅
