import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { loadManifest } from './manifest.js';
import { fetchLayer } from './internal/layer-fetch.js';
import { getIndex } from './internal/spatial-index.js';
import { isInBerlin } from './constants.js';
import { normalizeSlug } from './internal/slug.js';
import { buildKiezSlugs, type KiezNameRef } from './internal/kiez-slug.js';

/**
 * Vier User-sichtbare Spatial-Level (ADR-014 Abschnitt 1).
 * Planungsraum (542) ist KEIN User-Level, bleibt interne Aggregat-Quelle.
 * Zentral definiert für Re-Use in 8.2a/8.2b/8.5.
 */
export type SpatialLevel = 'address' | 'kiez' | 'bezirk' | 'berlin';

/** Aufgelöster Kiez/Bezirk-Kontext aus einer Adresse (lat/lng). */
export interface SpatialContext {
	/** LOR-Bezirksregion (143), Slug aus BZR_NAME. */
	kiezSlug: string | null;
	kiezName: string | null;
	/** Bezirk (12), Slug aus Gemeinde_name. */
	bezirkSlug: string | null;
	bezirkName: string | null;
}

const BEZIRKE_SLUG = 'bezirke';
const BEZIRKSREGION_SLUG = 'lor-bezirksregion';

const EMPTY_CONTEXT: SpatialContext = {
	kiezSlug: null,
	kiezName: null,
	bezirkSlug: null,
	bezirkName: null
};

type PropResolver = (props: Record<string, unknown> | null) => string | null;

const readBezirkName: PropResolver = (props) => {
	const v = props?.['Gemeinde_name'];
	return typeof v === 'string' ? v : null;
};

const readKiezName: PropResolver = (props) => {
	const v = props?.['BZR_NAME'];
	return typeof v === 'string' ? v : null;
};

async function findContainingName(
	slug: string,
	lat: number,
	lng: number,
	readName: PropResolver,
	fetchFn: typeof fetch
): Promise<string | null> {
	const manifest = await loadManifest(fetchFn);
	const layer = manifest.layers.find((l) => l.slug === slug);
	if (!layer) return null;

	const fc = await fetchLayer(layer.filename, fetchFn);
	if (!Array.isArray(fc?.features) || fc.features.length === 0) return null;

	const idx = await getIndex(layer.filename, fetchFn);
	const candidates = idx.search({
		minX: lng - 0.001,
		minY: lat - 0.001,
		maxX: lng + 0.001,
		maxY: lat + 0.001
	});
	const queryPoint = point([lng, lat]);
	for (const cand of candidates) {
		const feat = fc.features[cand.featureIndex] as Feature<Polygon | MultiPolygon>;
		if (booleanPointInPolygon(queryPoint, feat)) {
			return readName(feat.properties as Record<string, unknown> | null);
		}
	}
	return null;
}

const readBezirkCode: PropResolver = (props) => {
	const v = props?.['BEZ'];
	return typeof v === 'string' ? v : null;
};

/**
 * Löst den enthaltenden Kiez auf und liefert Name + disambiguierten Slug.
 *
 * Anders als der bare `normalizeSlug(BZR_NAME)` braucht der kanonische Slug die
 * Duplikat-Erkennung über ALLE LOR-Features (Duplikat "Heerstraße" → Bezirk-Suffix),
 * damit Karten-Links + Wahl-DB-Lookup (suffixed-keyed) treffen. Identisch zu
 * entries()/Sitemap/get-kiez-profile (8.2b-Mismatch-Fix).
 */
async function resolveContainingKiez(
	lat: number,
	lng: number,
	fetchFn: typeof fetch
): Promise<{ name: string; slug: string } | null> {
	const manifest = await loadManifest(fetchFn);
	const lorLayer = manifest.layers.find((l) => l.slug === BEZIRKSREGION_SLUG);
	if (!lorLayer) return null;

	const fc = await fetchLayer(lorLayer.filename, fetchFn);
	if (!Array.isArray(fc?.features) || fc.features.length === 0) return null;

	const idx = await getIndex(lorLayer.filename, fetchFn);
	const candidates = idx.search({
		minX: lng - 0.001,
		minY: lat - 0.001,
		maxX: lng + 0.001,
		maxY: lat + 0.001
	});
	const queryPoint = point([lng, lat]);
	let containingIndex = -1;
	for (const cand of candidates) {
		const feat = fc.features[cand.featureIndex] as Feature<Polygon | MultiPolygon>;
		if (booleanPointInPolygon(queryPoint, feat)) {
			containingIndex = cand.featureIndex;
			break;
		}
	}
	if (containingIndex === -1) return null;

	const bezCodeToName = new Map<string, string>();
	const bezLayer = manifest.layers.find((l) => l.slug === BEZIRKE_SLUG);
	if (bezLayer) {
		const bezFc = await fetchLayer(bezLayer.filename, fetchFn);
		for (const f of bezFc.features) {
			const p = (f.properties ?? {}) as Record<string, unknown>;
			const schluessel = p.Schluessel_gesamt;
			const name = p.Gemeinde_name;
			if (typeof schluessel === 'string' && typeof name === 'string') {
				bezCodeToName.set(schluessel.slice(-2), name);
			}
		}
	}

	const named: { origIndex: number; ref: KiezNameRef }[] = [];
	fc.features.forEach((f, i) => {
		const props = (f.properties ?? null) as Record<string, unknown> | null;
		const name = readKiezName(props);
		if (!name) return;
		const bezCode = readBezirkCode(props);
		const bezirk = bezCode ? bezCodeToName.get(bezCode) ?? '' : '';
		named.push({ origIndex: i, ref: { name, bezirk } });
	});

	const pos = named.findIndex((n) => n.origIndex === containingIndex);
	if (pos === -1) return null;
	const slug = buildKiezSlugs(named.map((n) => n.ref))[pos];
	return { name: named[pos].ref.name, slug };
}

/**
 * Löst aus einem Punkt (lat/lng) den enthaltenden Kiez (LOR-Bezirksregion, 143)
 * und Bezirk (12) auf. Außerhalb Berlins (oder ohne Treffer) sind die Felder null
 * (AC #5, kein Crash). Reuse Manifest-Slug-Auflösung + RBush-Index + Turf-PiP.
 */
export async function resolveSpatialLevel(
	lat: number,
	lng: number,
	fetchFn: typeof fetch = fetch
): Promise<SpatialContext> {
	if (!isInBerlin(lat, lng)) return { ...EMPTY_CONTEXT };

	const [bezirkName, kiez] = await Promise.all([
		findContainingName(BEZIRKE_SLUG, lat, lng, readBezirkName, fetchFn),
		resolveContainingKiez(lat, lng, fetchFn)
	]);

	return {
		kiezSlug: kiez?.slug ?? null,
		kiezName: kiez?.name ?? null,
		bezirkSlug: bezirkName ? normalizeSlug(bezirkName) : null,
		bezirkName
	};
}
