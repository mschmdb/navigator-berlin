import {
	BUNDLE_ORDER,
	getLayerDisplayName
} from '$lib/components/atlas/internal/layer-palette-filter.js';
import { explainLayer } from '$lib/components/atlas/inspector-panel/internal/layer-explain.js';
import type { Locale } from '$lib/paraglide/runtime';
import { themeLabel } from '$lib/seo/layer-meta.js';
import { hasLayerDetailPage } from './layer-visibility.js';
import type { Bundle, LayerMetadata } from './types.js';

/** Schlanke Layer-Angaben, die die Übersicht braucht (Namen und Texte löst die Seite lokal auf). */
export type LayerOverviewSource = Pick<
	LayerMetadata,
	'slug' | 'bundleGroup' | 'inspectorRelevant' | 'mapRelevant'
>;

export interface OverviewLayer {
	readonly slug: string;
	readonly name: string;
	/** Kurztext aus den Layer-Erklärungen, leer wenn keiner vorliegt. */
	readonly description: string;
}

export interface OverviewLayerGroup {
	readonly bundle: Bundle;
	readonly label: string;
	readonly layers: readonly OverviewLayer[];
}

/** Gruppiert alle Layer mit Detailseite nach Themengruppe (Reihenfolge wie im Atlas). */
export function groupLayersForOverview(
	layers: readonly LayerOverviewSource[],
	locale: Locale
): OverviewLayerGroup[] {
	const opts = { locale };
	const visible = layers.filter((l) => hasLayerDetailPage(l));
	return BUNDLE_ORDER.map((bundle) => ({
		bundle,
		label: themeLabel(bundle, locale),
		layers: visible
			.filter((l) => l.bundleGroup === bundle)
			.map((l) => ({
				slug: l.slug,
				name: getLayerDisplayName(l.slug, opts),
				description: explainLayer(l.slug, opts)
			}))
			.sort((a, b) => a.name.localeCompare(b.name, locale))
	})).filter((g) => g.layers.length > 0);
}

/**
 * Slugs von Layern mit Detailseite, deren Themengruppe `groupLayersForOverview`
 * nicht kennt. Sie würden sonst still fehlen; `/daten` meldet sie beim Prerender
 * (Warnung lokal, Abbruch im Strict-Build).
 */
export function layersOutsideBundles(layers: readonly LayerOverviewSource[]): string[] {
	return layers
		.filter((l) => hasLayerDetailPage(l) && !BUNDLE_ORDER.includes(l.bundleGroup))
		.map((l) => l.slug);
}
