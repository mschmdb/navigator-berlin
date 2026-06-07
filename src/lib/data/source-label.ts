import { LAYER_EXPLAIN_DE } from '$lib/components/atlas/internal/layer-palette-filter.js';

/**
 * Mappt einen technischen Layer-/Quellen-Slug auf einen lesbaren deutschen Namen
 * (Story 11.3/11.4-Fix: keine Roh-Slugs wie „klima-pet-2022" oder
 * „oepnv-composite" im UI). Reihenfolge: Palette-Label → synthetische Quelle →
 * generische Prettify-Fallback.
 */
const EXTRA_SOURCE_LABELS: Readonly<Record<string, string>> = {
	'oepnv-composite': 'ÖPNV-Haltestellen (BVG + S-Bahn)'
};

function prettifySlug(slug: string): string {
	return slug
		.split('-')
		.map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
		.join(' ');
}

export function sourceLabel(slug: string): string {
	return LAYER_EXPLAIN_DE[slug] ?? EXTRA_SOURCE_LABELS[slug] ?? prettifySlug(slug);
}
