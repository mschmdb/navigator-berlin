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
			// `robots.txt`, `sitemap.xml`, `sitemap-de.xml` haben keine internen Links und
			// werden vom Crawler nicht entdeckt. Story 2.1 zwingt sie als Entry-Points
			// in den prerender. Falls weitere standalone-Endpoints dazukommen, hier ergaenzen.
			entries: ['*', '/robots.txt', '/sitemap.xml', '/sitemap-de.xml'],
			// Footer-Links (/datenschutz, /impressum, /architektur) existieren noch nicht.
			// Eigene Legal-/Architektur-Stories werden die Routes anlegen. Ohne diesen
			// Handler bricht `vite build` mit "404 linked from /lizenzen" ab.
			// Wir warnen, statt zu fehlen.
			handleHttpError: ({ path, referrer, message }) => {
				const KNOWN_MISSING = ['/datenschutz', '/impressum', '/architektur'];
				const COMPOSITE_LAYER_SLUGS = ['oepnv-composite'];
				if (KNOWN_MISSING.some((p) => path === p || path.startsWith(`${p}#`))) {
					console.warn(`[prerender] Warning: ${message} (referrer: ${referrer})`);
					return;
				}
				if (COMPOSITE_LAYER_SLUGS.some((s) => path === `/layer/${s}`)) {
					console.warn(`[prerender] Composite layer not yet routable: ${path} (referrer: ${referrer})`);
					return;
				}
				throw new Error(message);
			}
		}
	}
};

export default config;
