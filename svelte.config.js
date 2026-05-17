import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
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
			entries: ['*', '/robots.txt', '/sitemap.xml', '/sitemap-de.xml', '/webmcp-manifest.json', '/.well-known/webmcp.json'],
			handleUnseenRoutes: ({ route }) => {
				console.warn(`[prerender] unseen route ${route} (Phase-1 warn-only)`);
			},
			// Footer-Links (/datenschutz, /impressum, /architektur) existieren noch nicht.
			// Eigene Legal-/Architektur-Stories werden die Routes anlegen. Ohne diesen
			// Handler bricht `vite build` mit "404 linked from /lizenzen" ab.
			// Wir warnen, statt zu fehlen.
			handleHttpError: ({ path, referrer, message }) => {
				// Phase-1-Pragmatik: 404er nur warnen, nicht das Build kicken.
				// Tighten zu hard-fail wenn 4.6/4.7 (Compliance + Architektur)
				// und alle OG-Endpoints stabilisiert sind.
				console.warn(`[prerender] ${message} (referrer: ${referrer})`);
			}
		}
	}
};

export default config;
