# SvelteKit 3 Upgrade (NAV-114)

Stand 21.11.2026. Ziel: `@sveltejs/kit` 2.70.3 auf 3.2.0. Anlass: GHSA-3r8g-jcqq-3p5j.

## Anlass

- GHSA-3r8g-jcqq-3p5j: O(n²)-Parsing von Remote-Form-Daten, DoS. Schwere High, CVSS 7.5.
- Betroffen sind Kit >= 2.42.0 bis 3.1.0 mit `experimental.remoteFunctions`. navigator nutzt `query` in `src/lib/data/geocode.remote.ts`.
- Fix in 3.1.1. Die Advisory nennt keinen 2.x-Patch.
- Am 29.10. erschienen weitere Advisories, unter anderem GHSA-m9j8-jcmv-hp69 (Server-only-Guard) und GHSA-mw6w-2fmv-pvw3 (adapter-node-Crash bei `reroute` mit kaputtem Pfad). Die Fixes stecken laut Changelog in 3.1.1. Patch-Versionen je Advisory: ungeprüft.

## Versionen

- npm `latest` ist inzwischen 3.4.0 (18.11.). Dazwischen liegen 3.2.1, 3.3.0, 3.3.1.
- 3.4.0 lehnt Remote-Function-Requests mit falscher HTTP-Methode ab. adapter-node 6.0.5 baut auf `@sveltejs/adapter-server` auf.
- Inhalte von 3.2.1 bis 3.3.1: ungeprüft.
- Mindestversionen für Kit 3: Node 22.17, Svelte 5.57.1, Vite 8, TypeScript 6, vite-plugin-svelte 7, adapter-node 6.

## Breaking Changes mit Bezug zu navigator

Quelle: offizieller Guide. Auswahl, nicht vollständig.

- `svelte.config.js` entfällt. Die Optionen gehen an `sveltekit()` in `vite.config.ts`.
- `prerender.origin` entfällt. Ersatz: `paths.origin`. adapter-node 6.0.2 liest `ORIGIN` wieder als Fallback, falls `paths.origin` fehlt.
- `$lib` wird `#lib` über `imports` in `package.json`. Dateiendungen sind Pflicht.
- `$app/environment` wird `$app/env`. `$env/*` ist deprecated, Ersatz `$app/env/private` und `$app/env/public` plus `src/env.ts`.
- `goto`: `replaceState` heißt `replace`, `keepFocus` und `noScroll` werden `reset: false`. `goto` rejected bei URLs ohne Route.
- `pushState` und `replaceState` aus `$app/navigation` sind deprecated. Ersatz: `goto(url, { shallow: true })`.
- `page.url` ist `ReadonlyURL`. Vor Änderungen kopieren.
- `event.request` ist readonly. Das betrifft das Paraglide-Hook-Muster `event.request = request`.
- `resolve('/…')` liest eine Route-ID. Konkrete Pfade gehen ohne führenden Slash. Ab 3.2.0 lehnt `resolve` URLs ab.
- `src/params/*` wird `src/params.ts` mit `defineParams`.
- CSRF ist immer aktiv. Ausnahmen über `csrf.trustedOrigins`.
- `json()` und `text()` sind deprecated. Ersatz: `Response.json()`.
- Queries in Remote Functions werfen bei Zugriff auf `event.url`, `event.params`, `event.route`.
- adapter-node 6: Die Liste statischer Dateien entsteht beim Build. Später geschriebene Dateien serviert er nicht. ETags sind Content-Hashes, `Last-Modified` entfällt. Statische Assets nur für GET und HEAD.

## Migrationstool

- `pnpm dlx sv migrate sveltekit-3` (sv 1.7.0). `--tasks` ohne Liste zeigt die Tasks.
- Prerequisites laufen immer mit: `package-json`, `tsconfig`.
- Tasks: `svelte-config`, `environment`, `paths`, `external-redirects`, `shallow-routing`, `params`, `imports`, `lib-alias`, `app-state`, `collect-migration-instructions`.
- Der letzte Task schreibt `MIGRATION_TASKS.md` mit Handarbeit und Dateiliste. Einzelne Stellen markiert das Tool mit `@migration-task`.
- Empfehlung der Doku: Task für Task laufen lassen und dazwischen committen. Wir haben das so gemacht, ein Commit pro Task.
- Weitere offizielle Codemods für Kit 3 gibt es nicht. Ältere Migrationen (`svelte-5`, `sveltekit-2`) laufen über `svelte-migrate@1`, ungepflegt.

## Erfahrungen aus der Community

Sekundärquellen, teils ungeprüft.

- Das Tool migriert nur Muster, die es sicher erkennt. Bedingte Config-Einträge können still verloren gehen (eigene Erfahrung in schmidbauer-dev#38). Darum `svelte.config.js` Zeile für Zeile gegen `vite.config.ts` vergleichen.
- `lib-alias` schreibt `"#lib": "./src/lib/index.js"`, auch wenn nur `index.ts` existiert. Imports außerhalb von `src/` bleiben `$lib`.
- Das Tool stürzt bei einigen Mustern ab, etwa `vite.config.ts` mit Funktions-Export. Vorher committen.
- Vite 8 benennt eigene Config-Keys um (`rollupOptions` zu `rolldownOptions`, `esbuild` zu `oxc`).
- Alles außerhalb des Codes, das `svelte.config.js` referenziert, bricht: CI, Dockerfile, ESLint.

## Befunde im Upgrade

- Das Tool hat Kommentarblöcke am Anfang von `.svelte`-Dateien hinter `</script>` verschoben und Leerzeilen eingefügt. Kosmetisch.
- `lib-alias` hat `src/routes/.well-known/webmcp.json/+server.ts` ausgelassen.
- `MIGRATION_TASKS.md` meldet `delta` und Remote-Form-Felder in `explore/+page.svelte`. Beides sind Fehlalarme: `delta` ist ein Zoom-Parameter, und navigator nutzt kein Remote-`form`.
- adapter-node 6 nimmt `paths.origin` als festen Origin jeder Laufzeit-Anfrage. Dann rendern hitze., kaelte. und stories.navigator.berlin die Startseite, weil `reroute` den Subdomain-Host nicht mehr sieht. `withRequestOrigin` (`src/lib/build/request-origin-adapter.js`) reicht dem Adapter den Builder ohne `paths.origin`. Der Prerender behält den Origin, zur Laufzeit gilt wie unter Kit 2 der Host-Header oder `ORIGIN`. Für CSRF bleibt `paths.origin` die Self-Origin. navigator hat keine POST-Endpunkte und keine mutierenden Remote Functions, darum betrifft das die Subdomains nicht.
- svelte 5.58.1 und neuer crashen im keyed `{#each}`-Reconcile. Der Test `stories/[slug]/page.svelte.test.ts` (Kapitel 5 mit `?bezirk=` und `wahl5=`) wirft `Cannot read properties of undefined (reading 'e')`. 5.58.0 läuft grün, darum ist svelte exakt auf 5.58.0 gepinnt. Ein Upstream-Issue ist noch offen zu suchen oder anzulegen.
- adapter-node 6 schickt keinen `Link`-Preload-Header mehr (`output.linkHeaderPreload` ist `false`). Die Preloads stehen als `<link rel="modulepreload">` im `<head>`.
- Redirects auf Trailing Slash liefern eine relative `location` (`../explore` statt `/explore`). Browser lösen beides gleich auf.
- `Cache-Control` aus `server.js` bleibt für alle geprüften Pfade gleich. Sitemaps, `robots.txt` und die Liste der Prerender-Dateien sind identisch mit `main`.
- `pnpm lint` hatte auf `main` schon 110 Fehler. Nach dem Upgrade bleiben dieselben Regeln übrig. `svelte/no-navigation-without-resolve` meldet nichts mehr, die Disable-Kommentare dafür bleiben als Warnung stehen.

## Quellen

- https://svelte.dev/docs/kit/migrating-to-sveltekit-3
- https://svelte.dev/docs/cli/sv-migrate
- https://svelte.dev/blog/sveltekit-3-release-candidate
- https://github.com/sveltejs/kit/blob/main/packages/kit/CHANGELOG.md
- https://github.com/sveltejs/kit/blob/main/packages/adapter-node/CHANGELOG.md
- https://github.com/sveltejs/kit/security/advisories/GHSA-3r8g-jcqq-3p5j
- https://github.com/sveltejs/kit/security/advisories
- https://byteiota.com/sveltekit-3-migration-config-lib-and-what-sv-migrate-misses/
- https://www.netlify.com/changelog/2026-10-01-sveltekit-3/
