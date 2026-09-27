import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';
import type { LocaleOptions } from '$lib/components/atlas/internal/atlas-label-options.js';

/**
 * Mappt einen technischen Layer-/Quellen-Slug auf einen lesbaren Namen
 * (Story 11.3/11.4-Fix: keine Roh-Slugs wie „klima-pet-2022" oder
 * „oepnv-composite" im UI).
 *
 * i18n Block B4a: liest nicht mehr direkt `LAYER_EXPLAIN_DE`, sondern
 * delegiert an den bereits locale-fähigen `getLayerDisplayName()`
 * (`layer-palette-filter.ts`, Boundary Spec i18n B3a). `opts` mit DE-Default
 * (Server-FAQ-Renderer ruft weiterhin ohne `opts` auf und bleibt deutsch).
 * `oepnv-composite` ist jetzt Teil von `LAYER_EXPLAIN_DE`/`LAYER_NAME_MESSAGE`
 * (vormals eine separate `EXTRA_SOURCE_LABELS`-Ausnahme hier).
 *
 * Review-Fund: `getLayerDisplayName()` fällt für unbekannte Slugs auf den
 * ROHEN Slug zurück (Bindestrich-Schreibweise, z. B. „foo-bar-2099"). Der
 * Story-11.3/11.4-Vertrag dieser Funktion verlangt aber IMMER einen
 * lesbaren Namen -- der `prettifySlug`-Fallback bleibt deshalb hier erhalten.
 */
function prettifySlug(slug: string): string {
	return slug
		.split('-')
		.map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
		.join(' ');
}

export function sourceLabel(slug: string, opts?: LocaleOptions): string {
	const resolved = getLayerDisplayName(slug, opts);
	return resolved !== slug ? resolved : prettifySlug(slug);
}
