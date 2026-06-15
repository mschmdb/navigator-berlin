import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { LRUCache } from 'lru-cache';
import type { KiezScoreOutput } from '../../../scripts/lib/kiez-score/output-schema.js';
import type { KiezScore, Modus, NearestStopLike } from '../../../scripts/lib/kiez-score/types.js';
import { loadManifest } from './manifest.js';
import { defaultLorIdFor } from '../../../scripts/lib/kiez-score/pipeline.js';

const SCORES_URL = '/kiez-scores/kiez-scores.json';

type LorFeature = Feature<Polygon | MultiPolygon>;

let scoresCache: KiezScoreOutput | null = null;
let scoresInflight: Promise<KiezScoreOutput> | null = null;
let lorCache: LorFeature[] | null = null;
let lorInflight: Promise<LorFeature[]> | null = null;

interface CachedResult {
	score: KiezScore | null;
}

const resultCache = new LRUCache<string, CachedResult>({ max: 200 });

export function _resetKiezScoreCache(): void {
	scoresCache = null;
	scoresInflight = null;
	lorCache = null;
	lorInflight = null;
	resultCache.clear();
}

const EMPTY_SCORES: KiezScoreOutput = {
	schemaVersion: 1,
	generatedAt: '',
	scores: {}
};

export async function loadKiezScores(fetchFn: typeof fetch = fetch): Promise<KiezScoreOutput> {
	if (scoresCache) return scoresCache;
	if (scoresInflight) return scoresInflight;
	scoresInflight = (async () => {
		// Statisch benannt, pro Deploy überschrieben → Revalidierung erzwingen (ETag/304),
		// sonst zeigt der Cache nach einem Score-Update veraltete Werte.
		const res = await fetchFn(SCORES_URL, { cache: 'no-cache' });
		if (res.status === 404) {
			// Build-Pipeline noch nicht gelaufen (pnpm data:kiez-scores). Kein Hard-Fail im Frontend.
			scoresCache = EMPTY_SCORES;
			scoresInflight = null;
			return EMPTY_SCORES;
		}
		if (!res.ok) {
			scoresInflight = null;
			throw new Error(`Failed to load kiez-scores: HTTP ${res.status}`);
		}
		const data = (await res.json()) as KiezScoreOutput;
		scoresCache = data;
		scoresInflight = null;
		return data;
	})();
	return scoresInflight;
}

export async function loadLorFeatures(fetchFn: typeof fetch = fetch): Promise<LorFeature[]> {
	if (lorCache) return lorCache;
	if (lorInflight) return lorInflight;
	lorInflight = (async () => {
		const manifest = await loadManifest(fetchFn);
		const entry = manifest.layers.find((l) => l.slug === 'lor-planungsraum');
		if (!entry) {
			// Pipeline noch nicht gelaufen oder LOR-Layer entfernt. Score-Section bleibt leer statt zu werfen.
			lorCache = [];
			lorInflight = null;
			return [];
		}
		const res = await fetchFn(`/layers/${entry.filename}`);
		if (res.status === 404) {
			lorCache = [];
			lorInflight = null;
			return [];
		}
		if (!res.ok) {
			lorInflight = null;
			throw new Error(`Failed to load lor-planungsraum: HTTP ${res.status}`);
		}
		const fc = (await res.json()) as FeatureCollection;
		const polygons = (fc.features ?? []).filter(
			(f): f is LorFeature => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
		);
		lorCache = polygons;
		lorInflight = null;
		return polygons;
	})();
	return lorInflight;
}

export function findLorIdContaining(
	lat: number,
	lng: number,
	features: readonly LorFeature[]
): string | null {
	const queryPoint = point([lng, lat]);
	for (const feat of features) {
		if (booleanPointInPolygon(queryPoint, feat)) {
			return defaultLorIdFor(feat);
		}
	}
	return null;
}

export interface MobilityOverride {
	nearestStops: Record<Modus, NearestStopLike | null>;
}

/**
 * Wendet einen Mobilität-Override mit der exakten Adress-Distance auf das Baseline-LOR-Ergebnis an.
 * Die anderen drei Dimensionen bleiben unverändert (LOR-Centroid-Genauigkeit).
 */
export function applyMobilityOverride(baseline: KiezScore, override: MobilityOverride): KiezScore {
	const dimensions = baseline.dimensions.map((dim) => {
		if (dim.dimension !== 'mobilitaet') return dim;
		const sources = dim.sources.map((s) => {
			const stopMatch = matchModeForLayer(s.layer);
			if (!stopMatch) return s;
			const stop = override.nearestStops[stopMatch.mode];
			const normalized = stop
				? Math.max(0, Math.min(100, 100 * (1 - stop.distanceM / stopMatch.threshold)))
				: 0;
			return {
				...s,
				rawValue: stop ? { distanceM: stop.distanceM } : null,
				normalizedValue: stop && stop.distanceM >= stopMatch.threshold ? 0 : normalized
			};
		});
		const usable = sources.filter((s) => s.normalizedValue !== null);
		let total = 0;
		let sum = 0;
		for (const s of usable) {
			sum += (s.normalizedValue as number) * s.weight;
			total += s.weight;
		}
		const value = total === 0 ? null : Math.round((sum / total) * 10) / 10;
		return { ...dim, sources, value };
	});
	const missingDimensions = dimensions.filter((d) => d.value === null).map((d) => d.dimension);
	return { ...baseline, dimensions, missingDimensions };
}

const MOBILITY_LAYER_TO_MODE: Record<string, { mode: Modus; threshold: number }> = {
	'oepnv-ubahn': { mode: 'ubahn', threshold: 1000 },
	'oepnv-sbahn': { mode: 'sbahn', threshold: 1000 },
	'oepnv-tram': { mode: 'tram', threshold: 1000 },
	'oepnv-bus': { mode: 'bus', threshold: 1000 }
};

function matchModeForLayer(layer: string): { mode: Modus; threshold: number } | null {
	return MOBILITY_LAYER_TO_MODE[layer] ?? null;
}

export async function getKiezScore(
	lat: number,
	lng: number,
	fetchFn: typeof fetch = fetch,
	override?: MobilityOverride
): Promise<KiezScore | null> {
	const key = `${lat.toFixed(6)},${lng.toFixed(6)}|${override ? '1' : '0'}`;
	const cached = resultCache.get(key);
	if (cached !== undefined) return cached.score;

	const [scores, lors] = await Promise.all([loadKiezScores(fetchFn), loadLorFeatures(fetchFn)]);
	const lorId = findLorIdContaining(lat, lng, lors);
	if (!lorId) {
		resultCache.set(key, { score: null });
		return null;
	}
	const baseline = scores.scores[lorId];
	if (!baseline) {
		resultCache.set(key, { score: null });
		return null;
	}
	const result = override ? applyMobilityOverride(baseline, override) : baseline;
	resultCache.set(key, { score: result });
	return result;
}
