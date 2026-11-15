/**
 * Link-Prüfung der Kiez-, Bezirks- und Übersichtsseiten (NAV-105): reine Helfer, das Skript
 * `scripts/check-place-links.ts` holt die Seiten vom laufenden Server.
 */

export interface InternalLink {
	readonly path: string;
	readonly anchor: string | null;
}

const ASSET = /\.(png|jpe?g|svg|webp|ico|json|geojson|pdf|xml|txt|css|js)$/i;

function decode(s: string): string {
	return s.replace(/&amp;/g, '&').replace(/&#x2F;/g, '/');
}

/** Interne Seitenlinks einer HTML-Seite; reine Anker beziehen sich auf die Seite selbst. */
export function internalLinks(html: string, pagePath: string): InternalLink[] {
	const out: InternalLink[] = [];
	for (const m of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
		const href = decode(m[1]);
		if (href.startsWith('#')) {
			out.push({ path: pagePath, anchor: href.slice(1) || null });
			continue;
		}
		if (/^[a-z]+:/i.test(href) || href.startsWith('//')) continue;
		// SvelteKit schreibt relative Links („./kiez/x“, „../bezirk/y“): gegen die Seite auflösen.
		const url = new URL(href, `http://site${pagePath}`);
		const path = url.pathname.replace(/\/$/, '') || '/';
		const hash = url.hash.slice(1);
		if (ASSET.test(path) || path.startsWith('/api/')) continue;
		out.push({ path, anchor: hash || null });
	}
	return out;
}

export function anchorIds(html: string): Set<string> {
	return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
}

/**
 * Jeder Ort braucht einen Link aus der Übersicht und mindestens einen von einer anderen
 * Detailseite (Nachbar oder Bezirk). `linkedFrom`: Ziel-Slug → Seiten, die darauf verlinken.
 */
export function orphans(
	slugs: readonly string[],
	linkedFrom: ReadonlyMap<string, ReadonlySet<string>>,
	overviewPath: string,
	detailPrefix: string
): { slug: string; reason: string }[] {
	const out: { slug: string; reason: string }[] = [];
	for (const slug of slugs) {
		const from = linkedFrom.get(slug) ?? new Set<string>();
		if (!from.has(overviewPath)) out.push({ slug, reason: 'fehlt in der Übersicht' });
		const fromDetail = [...from].some(
			(p) => p.startsWith(detailPrefix) && p !== `${detailPrefix}${slug}`
		);
		if (!fromDetail) out.push({ slug, reason: 'kein Nachbar verlinkt' });
	}
	return out;
}
