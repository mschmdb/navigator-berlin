import {
	buildKiezNeighborLists,
	SIMILARITY_DIMENSIONS,
	type KiezNeighborLists,
	type KiezScoreSnapshot,
	type NeighborLorCollection
} from '$lib/data/kiez-neighbors.js';

export const EMPTY_NEIGHBOR_LISTS: KiezNeighborLists = { neighbors: [], similar: [] };

type Index = ReadonlyMap<string, KiezNeighborLists>;

interface BuildResult {
	readonly index: Index;
	/** `false` bei Lade-Fehlern: Ergebnis nutzen, aber nicht cachen. */
	readonly complete: boolean;
}

let cached: Index | null = null;
let inflight: Promise<BuildResult> | null = null;

export async function readLayer(slug: string): Promise<NeighborLorCollection> {
	const { readFile } = await import('node:fs/promises');
	const { resolve } = await import('node:path');
	const manifest = JSON.parse(
		await readFile(resolve(process.cwd(), 'static/layers/MANIFEST.json'), 'utf-8')
	) as { layers: { slug: string; filename: string }[] };
	const layer = manifest.layers.find((l) => l.slug === slug);
	if (!layer) throw new Error(`${slug} fehlt im MANIFEST.json`);
	return JSON.parse(
		await readFile(resolve(process.cwd(), 'static/layers', layer.filename), 'utf-8')
	) as NeighborLorCollection;
}

async function loadScores(): Promise<{
	scores: Map<string, KiezScoreSnapshot>;
	complete: boolean;
}> {
	const scores = new Map<string, KiezScoreSnapshot>();
	if (!process.env.DATABASE_URL) return { scores, complete: true };
	try {
		const { getDb } = await import('$lib/server/db/index.js');
		const { kiezScore } = await import('$lib/server/db/schema/index.js');
		const rows = await getDb().select().from(kiezScore);
		for (const row of rows) {
			scores.set(row.slug, {
				composite: row.composite,
				dims: Object.fromEntries(
					SIMILARITY_DIMENSIONS.map((key) => [key, row[key] ?? null])
				) as KiezScoreSnapshot['dims']
			});
		}
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[kiez-neighbors] WARN: kiez_score unavailable (${msg})\n`);
		return { scores: new Map(), complete: false };
	}
	return { scores, complete: true };
}

async function buildIndex(): Promise<BuildResult> {
	try {
		const [lor, bezirke, { scores, complete }] = await Promise.all([
			readLayer('lor-bezirksregion'),
			readLayer('bezirke'),
			loadScores()
		]);
		const bezirkCodeToName = new Map<string, string>();
		for (const f of bezirke.features) {
			const key = f.properties?.Schluessel_gesamt;
			const name = f.properties?.Gemeinde_name;
			if (typeof key === 'string' && typeof name === 'string') {
				bezirkCodeToName.set(key.slice(-2), name);
			}
		}
		return {
			index: buildKiezNeighborLists({ lorFeatureCollection: lor, bezirkCodeToName, scores }),
			complete
		};
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[kiez-neighbors] WARN: index build failed (${msg})\n`);
		return { index: new Map(), complete: false };
	}
}

/**
 * Nachbar- und ähnliche Kieze. Der Index entsteht einmal pro Prozess, nicht pro
 * Request. Nach einem Lade-Fehler versucht der nächste Aufruf es neu.
 */
export async function getKiezNeighborLists(slug: string): Promise<KiezNeighborLists> {
	if (!cached) {
		inflight ??= buildIndex().finally(() => {
			inflight = null;
		});
		const result = await inflight;
		if (!result.complete) return result.index.get(slug) ?? EMPTY_NEIGHBOR_LISTS;
		cached = result.index;
	}
	return cached.get(slug) ?? EMPTY_NEIGHBOR_LISTS;
}

/** Nur für Tests. */
export function resetKiezNeighborIndexCache(): void {
	cached = null;
	inflight = null;
}
