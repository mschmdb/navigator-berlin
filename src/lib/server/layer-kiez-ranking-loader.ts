import {
	buildLayerKiezRanking,
	buildRankingRegions,
	SCORE_LAYER,
	type LayerKiezRanking,
	type RankingLorCollection,
	type RankingRegion
} from '$lib/data/layer-kiez-ranking.js';
import { readLayer } from './kiez-neighbors-index.js';
import { readLayerAggregatesFile } from './profile/meta-sources.js';

type Composites = { kiez: Record<string, number | null> };

let regionsCache: Promise<ReadonlyMap<string, RankingRegion>> | null = null;
let compositesCache: Promise<Composites | null> | null = null;

/** Cached eine Quelle pro Prozess. Ein Fehler bleibt nicht im Cache. */
function cachedOnce<T>(
	get: () => Promise<T> | null,
	set: (p: Promise<T> | null) => void,
	load: () => Promise<T>
): Promise<T> {
	const existing = get();
	if (existing) return existing;
	const promise = load().catch((err: unknown) => {
		set(null);
		throw err;
	});
	set(promise);
	return promise;
}

async function loadRegions(): Promise<ReadonlyMap<string, RankingRegion>> {
	const [lor, bezirke] = await Promise.all([readLayer('lor-bezirksregion'), readLayer('bezirke')]);
	const bezirkCodeToName = new Map<string, string>();
	for (const f of bezirke.features) {
		const key = f.properties?.Schluessel_gesamt;
		const name = f.properties?.Gemeinde_name;
		if (typeof key === 'string' && typeof name === 'string') {
			bezirkCodeToName.set(key.slice(-2), name.replace(/\s+/g, ' ').trim());
		}
	}
	return buildRankingRegions(lor as RankingLorCollection, bezirkCodeToName);
}

async function loadComposites(): Promise<Composites | null> {
	const { readFile } = await import('node:fs/promises');
	const { resolve } = await import('node:path');
	const raw = await readFile(
		resolve(process.cwd(), 'static/kiez-scores/region-composites.json'),
		'utf-8'
	);
	const data = JSON.parse(raw) as { kiez?: Record<string, number | null> };
	return data.kiez ? { kiez: data.kiez } : null;
}

/** Slug -> Kiez-Name und Bezirk, einmal pro Prozess gelesen. */
export function loadRankingRegions(): Promise<ReadonlyMap<string, RankingRegion>> {
	return cachedOnce(
		() => regionsCache,
		(p) => (regionsCache = p),
		loadRegions
	);
}

function loadCompositesOnce(): Promise<Composites | null> {
	return cachedOnce(
		() => compositesCache,
		(p) => (compositesCache = p),
		loadComposites
	);
}

/**
 * Kiez-Rangliste für eine Layer-Seite. Fehlen Quelldateien, gibt die Funktion `null`
 * zurück und die Seite zeigt nur den Karten-Button. Composites laden nur für den
 * Score-Layer, damit eine fehlende Datei die übrigen Layer nicht trifft.
 */
export async function loadLayerKiezRanking(layerSlug: string): Promise<LayerKiezRanking | null> {
	try {
		const needsComposites = layerSlug === SCORE_LAYER;
		const [regions, composites, aggregates] = await Promise.all([
			loadRankingRegions(),
			needsComposites ? loadCompositesOnce() : Promise.resolve(null),
			needsComposites ? Promise.resolve(null) : readLayerAggregatesFile()
		]);
		return buildLayerKiezRanking({ layerSlug, aggregates, composites, regions });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[layer-ranking] WARN: ranking unavailable (${msg})\n`);
		return null;
	}
}
