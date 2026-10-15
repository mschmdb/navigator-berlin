import bbox from '@turf/bbox';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import {
	bezCodeToBezirkName,
	bezirkSlugsForFeatures,
	buildKiezSlugsForFeatures
} from '$lib/components/wahl-portal/internal/winner-map-data.js';
import { normalizeSlug } from '$lib/data/internal/slug.js';
import type { RegionComposites } from '$lib/data/get-region-composites.js';
import type { Bbox, RegionFocusKind, RegionFocusRequest } from '$lib/utils/url-state.js';

export type RegionFeature = Feature<Polygon | MultiPolygon>;

export interface RegionFocusTarget {
	readonly kind: RegionFocusKind;
	readonly slug: string;
	readonly name: string;
	/** Bezirk-Name; beim Bezirk-Fokus der eigene Name. */
	readonly bezirkName: string;
	readonly bezirkSlug: string;
	readonly feature: RegionFeature;
	readonly bbox: Bbox;
}

export interface RegionRank {
	readonly composite: number;
	readonly rang: number;
	readonly total: number;
}

function cleanName(raw: unknown): string {
	return typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';
}

function isPolygonFeature(f: Feature | undefined): f is RegionFeature {
	return f?.geometry?.type === 'Polygon' || f?.geometry?.type === 'MultiPolygon';
}

/**
 * Löst einen Ortsfokus-Slug auf Feature, Namen und Bbox auf. Slugs entstehen
 * über dieselben Helfer wie Kiez-/Bezirksseiten, damit Dubletten
 * (`heerstrasse-spandau`) auf den richtigen Kiez zeigen. Unbekannt: `null`.
 */
export function resolveRegionFocus(
	request: RegionFocusRequest,
	kiezFc: FeatureCollection | null,
	bezirkeFc: FeatureCollection
): RegionFocusTarget | null {
	if (request.kind === 'bezirk') {
		const index = bezirkSlugsForFeatures(bezirkeFc).indexOf(request.slug);
		const feature = bezirkeFc.features[index];
		if (index < 0 || !isPolygonFeature(feature)) return null;
		const name = cleanName(feature.properties?.Gemeinde_name);
		return {
			kind: 'bezirk',
			slug: request.slug,
			name,
			bezirkName: name,
			bezirkSlug: request.slug,
			feature,
			bbox: bbox(feature) as Bbox
		};
	}
	if (!kiezFc) return null;
	const index = buildKiezSlugsForFeatures(kiezFc, bezirkeFc).indexOf(request.slug);
	const feature = kiezFc.features[index];
	if (index < 0 || !isPolygonFeature(feature)) return null;
	const props = feature.properties ?? {};
	const bezCode = typeof props.BEZ === 'string' ? props.BEZ : '';
	const bezirkName = cleanName(bezCodeToBezirkName(bezirkeFc).get(bezCode));
	return {
		kind: 'kiez',
		slug: request.slug,
		name: cleanName(props.BZR_NAME),
		bezirkName,
		bezirkSlug: normalizeSlug(bezirkName),
		feature,
		bbox: bbox(feature) as Bbox
	};
}

/**
 * Dichter Rang des Composite (1 = bester, Gleichstand teilt den Rang). Gleiche
 * Regel wie `rankBy` in `scripts/lib/ranking`, das `kiez_rank`/`bezirk_rank`
 * und damit den Rang auf den Profilseiten befüllt.
 */
export function compositeRank(
	data: RegionComposites | null,
	kind: RegionFocusKind,
	slug: string
): RegionRank | null {
	if (!data) return null;
	const field = kind === 'kiez' ? data.kiez : data.bezirk;
	const own = field[slug];
	if (typeof own !== 'number') return null;
	const values = Object.values(field).filter((v): v is number => typeof v === 'number');
	const distinctBetter = new Set(values.filter((v) => v > own));
	return { composite: own, rang: distinctBetter.size + 1, total: values.length };
}
