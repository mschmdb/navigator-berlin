---
title: 'Wahl-Detailseiten ins Portal überführen (yaml-Story 12)'
type: 'feature'
created: '2026-09-23'
status: 'draft'
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

**Never:**
- Kein Umbau der Portal-Hauptseite, keine neuen Kapitel.
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
- Nicht ändern: Portal-Hauptseite, `/api/wahl/*`, OG-PNG-Pfade `static/og/wahl/*`.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/data/wahl-slug.ts` (+ Test) -- `parseWahlSlug`/`buildWahlSlug` aus `wahl/[slug]/slug-utils.ts` nach `src/lib` ziehen, Kopien darauf umstellen
- [ ] `src/routes/(with-header)/berlin-wahlen/[slug]/+page.*` -- Detailseite laut Entscheidung 2A, Breadcrumb/JSON-LD auf neue Pfade, Portal-Deep-Link
- [ ] `src/routes/(with-header)/wahl/` -- Ordner löschen
- [ ] `src/lib/seo/renamed-route-redirect.ts` (+ Test) -- `/wahl` exakt, `/wahl/<slug>` per Präfix mit Slug-Validierung
- [ ] Link-Stellen der Code Map + Tests -- direkt auf `/berlin-wahlen[/slug]`
- [ ] Sitemap/llms (`wahl-detail-pages.ts`, `llms-builder.ts`, Consistency-Test) -- neue Pfade, `lastmod` aus `sourceUpdatedAt` mit Jahres-Fallback; `wahlPortal: true` (1A), Flag-Tests anpassen
- [ ] `page-card-template.ts`, `lint-wahl-editorial.ts`, `docs/wahldaten-methodik.md`, `technical-notes.md` -- Pfade nachziehen

**Acceptance Criteria:**
- Given der Build, when `grep -rn "['\"\`(]/wahl[/'\"\`)]" src _content` läuft, then gibt es keinen Seiten-Link mehr auf `/wahl`.
- Given `pnpm build && pnpm preview`, when `/wahl/2023-bvv` aufgerufen wird, then antwortet der Server mit 301 auf `/berlin-wahlen/2023-bvv`, und die Zielseite ist prerendered.
- Given die Sitemap, when sie erzeugt wird, then enthält sie `/berlin-wahlen/<slug>` für alle Wahlen und keinen `/wahl`-Pfad.

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
- `pnpm test:unit -- --run src/lib/seo src/lib/data/wahl-slug src/lib/server/llms` -- expected: grün
- `pnpm check && pnpm lint:wahl` -- expected: 0 Fehler
- `pnpm build` -- expected: keine `/wahl`-Warnungen des Prerender-Crawlers

**Manual checks:**
- `pnpm preview`: `curl -sI localhost:4173/wahl/2023-bvv` → `301` mit `location: /berlin-wahlen/2023-bvv`.
