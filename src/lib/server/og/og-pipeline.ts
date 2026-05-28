/**
 * OG-Image-Pipeline-Orchestrator (Story 2.6).
 *
 * Wandelt die Build-Inputs (GeoJSON-Layer + Manifest) in eine flache Liste von
 * Render-Targets um. Pro Target: `{type, slug, label, bbox?, ...}`. Konsumiert
 * von `scripts/generate-og-snapshots.ts` (Karten-PNG via Headless Playwright)
 * und `scripts/generate-og-images.ts` (Satori-Overlay).
 *
 * Slug-Konvention spiegelt `scripts/aggregate-data.ts`: `Gemeinde_name` bzw.
 * `BZR_NAME` durch `normalizeSlug` → kebab-case. Wichtig damit OG-Pfade exakt
 * zu Page-Routes passen (`/bezirk/[slug]`, `/kiez/[slug]`, `/layer/[slug]`).
 *
 * Pure Function ohne IO.
 */

import { normalizeSlug } from '$lib/data/internal/slug.js';
import { buildKiezSlugs, type KiezNameRef } from '$lib/data/internal/kiez-slug.js';
import { LAYER_EXPLAIN_DE } from '$lib/components/atlas/internal/layer-palette-filter.js';

export type Bbox4 = readonly [minLon: number, minLat: number, maxLon: number, maxLat: number];

export interface GeoJsonFeature {
	readonly type: 'Feature';
	readonly geometry:
		| { readonly type: 'Polygon'; readonly coordinates: readonly (readonly (readonly number[])[])[] }
		| {
				readonly type: 'MultiPolygon';
				readonly coordinates: readonly (readonly (readonly (readonly number[])[])[])[];
		  };
	readonly properties: Record<string, unknown> | null;
}

export interface GeoJsonFeatureCollection {
	readonly type: 'FeatureCollection';
	readonly features: readonly GeoJsonFeature[];
}

export interface LayerManifestEntry {
	readonly slug: string;
	readonly bundleGroup: string;
	readonly license: string;
	readonly sourceUpdatedAt?: string;
	readonly sourceUrl: string;
}

export interface BezirkTarget {
	readonly type: 'bezirk';
	readonly slug: string;
	readonly label: string;
	readonly bezirkCode: string | null;
	readonly bbox: Bbox4;
}

export interface KiezTarget {
	readonly type: 'kiez';
	readonly slug: string;
	readonly label: string;
	readonly parentBezirkSlug: string;
	readonly bbox: Bbox4;
}

export interface LayerTarget {
	readonly type: 'layer';
	readonly slug: string;
	readonly label: string;
	readonly bundleGroup: string;
	readonly authority: string;
	readonly license: string;
	readonly sourceUpdatedAt: string;
}

export type OgTarget = BezirkTarget | KiezTarget | LayerTarget;

export function computeFeatureBbox(feature: GeoJsonFeature): Bbox4 {
	let minLon = Infinity;
	let minLat = Infinity;
	let maxLon = -Infinity;
	let maxLat = -Infinity;
	function visit(coord: readonly number[]): void {
		const lon = coord[0];
		const lat = coord[1];
		if (typeof lon !== 'number' || typeof lat !== 'number') return;
		if (lon < minLon) minLon = lon;
		if (lat < minLat) minLat = lat;
		if (lon > maxLon) maxLon = lon;
		if (lat > maxLat) maxLat = lat;
	}
	if (feature.geometry.type === 'Polygon') {
		for (const ring of feature.geometry.coordinates) {
			for (const c of ring) visit(c);
		}
	} else {
		for (const poly of feature.geometry.coordinates) {
			for (const ring of poly) {
				for (const c of ring) visit(c);
			}
		}
	}
	if (!Number.isFinite(minLon) || !Number.isFinite(maxLat)) {
		throw new Error('computeFeatureBbox: feature has no coordinates');
	}
	return [minLon, minLat, maxLon, maxLat];
}

function readStringProp(feature: GeoJsonFeature, key: string): string | null {
	const props = feature.properties ?? {};
	const value = props[key];
	return typeof value === 'string' ? value : null;
}

export function buildBezirkTargetsFromGeoJson(fc: GeoJsonFeatureCollection): BezirkTarget[] {
	const out: BezirkTarget[] = [];
	for (const feature of fc.features) {
		const name = readStringProp(feature, 'Gemeinde_name');
		if (!name) throw new Error('bezirke feature missing Gemeinde_name');
		const schluessel = readStringProp(feature, 'Schluessel_gesamt');
		const bezirkCode = schluessel ? schluessel.slice(-2) : null;
		out.push({
			type: 'bezirk',
			slug: normalizeSlug(name),
			label: name,
			bezirkCode,
			bbox: computeFeatureBbox(feature)
		});
	}
	return out;
}

export function buildBezirkCodeToSlugMap(targets: readonly BezirkTarget[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const t of targets) {
		if (t.bezirkCode) map.set(t.bezirkCode, t.slug);
	}
	return map;
}

export function buildKiezTargetsFromGeoJson(
	fc: GeoJsonFeatureCollection,
	bezirkCodeToSlug: ReadonlyMap<string, string>
): KiezTarget[] {
	// Erst alle Features validieren + Refs sammeln, dann gemeinsam disambiguieren.
	// Duplikat-Namen (z.B. "Heerstraße") brauchen Bezirk-Suffix damit OG-Slug exakt
	// zum Page-Slug passt (/kiez/heerstrasse-spandau), sonst OG-404. Siehe
	// buildKiezSlugs (gleiche Util wie entries/Resolver/Sitemap).
	const validated = fc.features.map((feature) => {
		const name = readStringProp(feature, 'BZR_NAME');
		if (!name) throw new Error('lor-bezirksregion feature missing BZR_NAME');
		const bez = readStringProp(feature, 'BEZ');
		if (!bez) throw new Error('lor-bezirksregion feature missing BEZ');
		const parentBezirkSlug = bezirkCodeToSlug.get(bez);
		if (!parentBezirkSlug) {
			throw new Error(`unknown bezirk code "${bez}" for kiez "${name}"`);
		}
		return { feature, name, parentBezirkSlug };
	});

	const refs: KiezNameRef[] = validated.map((v) => ({ name: v.name, bezirk: v.parentBezirkSlug }));
	const slugs = buildKiezSlugs(refs);

	return validated.map((v, i) => ({
		type: 'kiez' as const,
		slug: slugs[i],
		label: v.name,
		parentBezirkSlug: v.parentBezirkSlug,
		bbox: computeFeatureBbox(v.feature)
	}));
}

function authorityFromSourceUrl(url: string): string {
	try {
		const u = new URL(url);
		return u.hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}

function labelFromSlug(slug: string): string {
	return slug
		.split('-')
		.map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
		.join(' ');
}

function layerDisplayLabel(slug: string): string {
	return LAYER_EXPLAIN_DE[slug] ?? labelFromSlug(slug);
}

function stripIsoTime(isoDate: string | undefined): string {
	if (!isoDate) return '';
	return isoDate.slice(0, 10);
}

export function buildLayerTargetsFromManifest(entries: readonly LayerManifestEntry[]): LayerTarget[] {
	return entries.map((e) => ({
		type: 'layer' as const,
		slug: e.slug,
		label: layerDisplayLabel(e.slug),
		bundleGroup: e.bundleGroup,
		authority: authorityFromSourceUrl(e.sourceUrl),
		license: e.license,
		sourceUpdatedAt: stripIsoTime(e.sourceUpdatedAt)
	}));
}
