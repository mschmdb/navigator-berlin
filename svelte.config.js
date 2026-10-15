import adapter from '@sveltejs/adapter-node';
import { createHandleHttpError } from './src/lib/build/strict-build.js';

/** Pfade, deren Prerender-HTTP-Fehler den strikten Build nicht abbrechen. Bewusst leer (S5). */
/** @type {string[]} */
const ALLOWED_HTTP_ERROR_PATHS = [];

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
		experimental: { async: true }
	},
	kit: {
		adapter: adapter(),
		experimental: { remoteFunctions: true },
		prerender: {
			// Production-Origin für robots.txt/sitemap.xml während Prerender. Ohne diesen
			// Override liefert `url.origin` `http://sveltekit-prerender` (SvelteKit-Default)
			// → robots.txt + sitemap-index verlinken kaputt.
			origin: 'https://navigator.berlin',
			// `robots.txt`, `sitemap.xml`, `sitemap-de.xml` haben keine internen Links und
			// werden vom Crawler nicht entdeckt. Story 2.1 zwingt sie als Entry-Points
			// in den prerender. Falls weitere standalone-Endpoints dazukommen, hier ergaenzen.
			entries: [
				'*',
				'/robots.txt',
				'/sitemap.xml',
				'/sitemap-de.xml',
				'/sitemap-en.xml',
				'/webmcp-manifest.json',
				'/.well-known/webmcp.json'
			],
			handleUnseenRoutes: ({ route }) => {
				console.warn(`[prerender] unseen route ${route} (Phase-1 warn-only)`);
			},
			// S5: Im strikten Build (NAVIGATOR_STRICT_BUILD=1, setzt das Dockerfile) bricht
			// jeder Prerender-HTTP-Fehler (404/500) den Build ab. NODE_ENV taugt nicht als
			// Signal, weil `vite build` es selbst auf production setzt. Die Allowlist ist
			// leer, weil der Build 0 Fehler hat. Ohne Flag bleibt es bei der Warnung.
			// `handleUnseenRoutes` bleibt bewusst eine Warnung.
			handleHttpError: createHandleHttpError(ALLOWED_HTTP_ERROR_PATHS)
		}
	}
};

export default config;
