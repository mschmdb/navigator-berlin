import { buildCanonical } from './canonical.js';

export type SupportedLocale = 'de' | 'en';

export interface HreflangLink {
	readonly hreflang: SupportedLocale | 'x-default';
	readonly href: string;
}

export interface HreflangInput {
	readonly origin: string;
	readonly pathname: string;
	readonly locales: readonly SupportedLocale[];
}

/**
 * Build the hreflang alternate cluster for a page.
 *
 * Phase 1 (`project_i18n_phase_1_de_only`): only DE routes exist. Cluster contains
 * `hreflang="de"` plus `hreflang="x-default"` pointing at the DE canonical path.
 * When EN routes ship (story 3.1/3.2), pass `['de', 'en']` and the function will
 * delegate path localization to `localizeHref` from Paraglide.
 *
 * The input pathname is canonicalized via {@link buildCanonical}, so query strings
 * and hash fragments are stripped and trailing slashes (except root) removed.
 */
export function buildHreflangCluster(input: HreflangInput): HreflangLink[] {
	const dePath = canonicalPath(input.pathname, 'de');
	const links: HreflangLink[] = [];

	if (input.locales.includes('de')) {
		links.push({ hreflang: 'de', href: buildCanonical(input.origin, dePath) });
	}
	if (input.locales.includes('en')) {
		const enPath = canonicalPath(input.pathname, 'en');
		links.push({ hreflang: 'en', href: buildCanonical(input.origin, enPath) });
	}
	// x-default always points at DE canonical (DE is base locale for phase 1)
	links.push({ hreflang: 'x-default', href: buildCanonical(input.origin, dePath) });

	return links;
}

/**
 * Compute the locale-specific canonical pathname.
 *
 * In Phase 1 EN routes do not exist (memory `project_i18n_phase_1_de_only`), so
 * we keep this helper minimal: it strips query / hash / trailing slashes and
 * returns the canonical pathname. When EN coverage lands (story 3.1/3.2),
 * delegate to Paraglide's `localizeHref` here.
 *
 * Note: this is intentionally not importing `localizeHref` from Paraglide yet;
 * the function only operates on already de-localized paths from `page.url.pathname`
 * + Paraglide's `reroute` hook (memory `project_paraglide_reroute.md`).
 */
function canonicalPath(pathname: string, _locale: SupportedLocale): string {
	let path = pathname;
	const queryIdx = path.indexOf('?');
	if (queryIdx !== -1) path = path.slice(0, queryIdx);
	const hashIdx = path.indexOf('#');
	if (hashIdx !== -1) path = path.slice(0, hashIdx);
	if (!path.startsWith('/')) path = `/${path}`;
	if (path.length > 1) path = path.replace(/\/+$/, '');
	return path;
}
