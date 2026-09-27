import type { LayerMetadata, Manifest } from './types.js';
import type { Locale } from '$lib/paraglide/runtime';
import {
	getLayerExplainEntry,
	type LayerExplain
} from '$lib/components/atlas/inspector-panel/internal/layer-explain.js';
import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';
import { getEditorialConfig } from '$lib/components/atlas/internal/editorial-config.js';
import type { EditorialConfig } from '$lib/components/atlas/internal/editorial-types.js';
import { getLayerMethodology, type LayerMethodology } from './layer-methodology.js';

export interface LayerDetail {
	readonly slug: string;
	readonly lang: Locale;
	readonly layerName: string;
	readonly explain: LayerExplain;
	readonly meta: LayerMetadata;
	readonly editorial?: EditorialConfig;
	readonly methodology: LayerMethodology | null;
}

export function buildLayerDetail(
	slug: string,
	lang: Locale,
	manifest: Manifest
): LayerDetail | null {
	const meta = manifest.layers.find((l) => l.slug === slug);
	if (!meta) return null;
	// Build-only-Layer (weder Karte noch Inspector, z.B. Heritage-Dichte-Signal
	// denkmal-2024/stolpersteine) bekommen keine öffentliche Detail-Seite.
	if (meta.inspectorRelevant === false && meta.mapRelevant === false) return null;
	return {
		slug,
		lang,
		// i18n Block B4b/C1: `layerName` und `explain` folgen der Aufrufer-Locale
		// (`+page.server.ts` übergibt `getLocale()` als `lang`).
		layerName: getLayerDisplayName(slug, { locale: lang }),
		explain: getLayerExplainEntry(slug, { locale: lang }),
		meta,
		editorial: getEditorialConfig(slug),
		// i18n Block C2: `methodology` folgt jetzt ebenfalls der Aufrufer-Locale
		// (vormals immer DE, Boundary C1: "keine Methodik-Texte").
		methodology: getLayerMethodology(slug, { locale: lang })
	};
}
