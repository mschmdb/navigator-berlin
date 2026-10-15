import type { LayerFormat } from '$lib/data/types.js';

export type BboxTuple = readonly [minLng: number, minLat: number, maxLng: number, maxLat: number];

const SLUG_YEAR = /-((?:19|20)\d{2})$/;

/**
 * `temporalCoverage` nur aus dem Datenzeitraum: explizites Jahr (Wahljahr)
 * oder Jahres-Suffix im Slug (`laerm-2023`). Das Aktualisierungsdatum
 * (`sourceUpdatedAt`) ist kein Datenzeitraum. Sonst `undefined`.
 */
export function deriveTemporalCoverage(input: {
	readonly slug?: string;
	readonly year?: number;
}): string | undefined {
	if (input.year !== undefined) return String(input.year);
	const slugYear = input.slug ? SLUG_YEAR.exec(input.slug)?.[1] : undefined;
	if (slugYear) return slugYear;
	return undefined;
}

/** schema.org `GeoShape.box`: "südBreite westLänge nordBreite ostLänge". */
export function bboxToGeoShapeBox(bbox: BboxTuple): string {
	const [minLng, minLat, maxLng, maxLat] = bbox;
	return `${minLat} ${minLng} ${maxLat} ${maxLng}`;
}

export function originOfUrl(url: string | undefined | null): string | undefined {
	if (!url) return undefined;
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.origin : undefined;
	} catch {
		return undefined;
	}
}

/** Stabile Download-Adresse; leitet auf die aktuelle Hash-Datei weiter. */
export function stableDownloadPath(slug: string, format: LayerFormat = 'geojson'): string {
	return `/daten/${slug}.${format}`;
}
