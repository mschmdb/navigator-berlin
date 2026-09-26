import type { Locale } from '$lib/paraglide/runtime';
import { buildCanonical, localizedPathname } from './canonical.js';

export interface HreflangLink {
	readonly hreflang: Locale | 'x-default';
	readonly href: string;
}

export interface HreflangInput {
	readonly origin: string;
	readonly pathname: string;
	/**
	 * Locales to render into the cluster (already filtered by the caller,
	 * typically `[baseLocale, ...translatedLocalesFor(pathname, locales)]`
	 * from `translation-register.ts`).
	 */
	readonly locales: readonly Locale[];
}

/**
 * Build the hreflang alternate cluster for a page.
 *
 * `x-default` always points at the DE canonical path (DE is base locale,
 * decision Matze 26.09.2026: `x-default` = DE for the lifetime of the
 * project, not just Block A).
 *
 * i18n Block A (2026-09-26, ADR-005): `SeoHead` only ever passes a
 * translated-locale set that grows beyond `['de']` once
 * `translation-register.ts` marks a path as translated for a non-base
 * locale. Until a page is registered, this returns just the DE + x-default
 * pair -- no `en` link, matching the I/O-matrix row "Nicht übersetzt: kein
 * hreflang-Paar".
 */
export function buildHreflangCluster(input: HreflangInput): HreflangLink[] {
	const dePath = localizedPathname(input.pathname, 'de');
	const links: HreflangLink[] = [];

	for (const locale of input.locales) {
		links.push({
			hreflang: locale,
			href: buildCanonical(input.origin, localizedPathname(input.pathname, locale))
		});
	}
	links.push({ hreflang: 'x-default', href: buildCanonical(input.origin, dePath) });

	return links;
}
