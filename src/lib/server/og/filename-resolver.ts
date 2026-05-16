/**
 * OG-Image-Pfad-Konvention (Story 2.6, Pure-Satori-Pivot 2026-05-16).
 *
 * Phase 1 ist DE-only (Memory `project_i18n_phase_1_de_only`). Pro Page-Type
 * + Slug existiert genau ein PNG, kein Locale-Suffix, kein Filename-Hash
 * (User-Decision Story 2.6 Open-Question 3: max-age=86400, kein immutable).
 *
 * Konvention:
 *   static/og/{type}/{slug}.png                  → finale OG-Card (Satori-Only)
 *
 * Public-URL (Meta-Tag): `${origin}/og/{type}/{slug}.png`
 */

const SLUG_INVALID_RE = /[\\/]|^\./;

export const ogTargetTypes = ['bezirk', 'kiez', 'layer'] as const;
export type OgTargetType = (typeof ogTargetTypes)[number];

export function isOgTargetType(value: string): value is OgTargetType {
	return (ogTargetTypes as readonly string[]).includes(value);
}

function assertValidSlug(slug: string): void {
	if (slug.length === 0) throw new Error('OG filename: empty slug');
	if (SLUG_INVALID_RE.test(slug)) {
		throw new Error(`OG filename: invalid slug "${slug}" (no path separators, no leading dot)`);
	}
}

/** `mitte.png` (DE-only Phase 1, kein Locale-Suffix, kein Hash). */
export function buildOgFilename(slug: string): string {
	assertValidSlug(slug);
	return `${slug}.png`;
}

/** Filesystem-Pfad zur finalen OG-Card. */
export function buildOgPath(repoRoot: string, type: OgTargetType, slug: string): string {
	return `${repoRoot}/static/og/${type}/${buildOgFilename(slug)}`;
}

/**
 * Absolute Public-URL für `<meta property="og:image">`. Pflicht: `origin`
 * MUSS absolut sein (`https://...`), weil Crawler relative Pfade ignorieren.
 */
export function buildOgPublicUrl(origin: string, type: OgTargetType, slug: string): string {
	if (!/^https?:\/\//.test(origin)) {
		throw new Error(`OG filename: absolute origin required, got "${origin}"`);
	}
	const cleanOrigin = origin.replace(/\/+$/, '');
	return `${cleanOrigin}/og/${type}/${buildOgFilename(slug)}`;
}
