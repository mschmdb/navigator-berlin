/**
 * Geometrie-Fetch (kiez/bezirk) als eigene Klasse ausgelagert (Datei-
 * Zeilenlimit `winner-map.svelte`, Muster `KiezBezirkWinnersLoader`/
 * `StimmbezirkLoader`). Gecacht pro Ebene, kein Fetch ohne Winners-Daten
 * (Boundary DB-los) -- dieser Guard bleibt beim Aufrufer, hier nur Laden/Cache.
 */
import type { FeatureCollection } from 'geojson';
import { loadManifest } from '$lib/data/manifest.js';
import { fetchLayer } from '$lib/data/internal/layer-fetch.js';
import {
	buildKiezSlugsForFeatures,
	bezirkSlugsForFeatures,
	kiezNamesForFeatures,
	bezirkNamesForFeatures
} from './winner-map-data.js';
import type { LoadStatus } from './winner-map-winners.svelte.js';

export interface KiezBezirkGeometryState {
	readonly ebene: 'kiez' | 'bezirk';
	readonly fc: FeatureCollection;
	readonly slugs: string[];
	readonly names: string[];
}

export class KiezBezirkGeometryLoader {
	status = $state<LoadStatus>('idle');
	geometry = $state<KiezBezirkGeometryState | null>(null);

	#fetchFn: typeof fetch;
	#cache: Record<string, KiezBezirkGeometryState> = {};

	constructor(fetchFn: typeof fetch) {
		this.#fetchFn = fetchFn;
	}

	async load(ebene: 'kiez' | 'bezirk', isStale: () => boolean): Promise<void> {
		const cached = this.#cache[ebene];
		if (cached) {
			this.geometry = cached;
			this.status = 'loaded';
			return;
		}
		this.status = 'loading';
		try {
			const manifest = await loadManifest(this.#fetchFn);
			const bezirkeLayer = manifest.layers.find((l) => l.slug === 'bezirke');
			if (!bezirkeLayer) throw new Error('bezirke-Layer fehlt im Manifest');
			const bezirkeFc = await fetchLayer(bezirkeLayer.filename, this.#fetchFn);
			let next: KiezBezirkGeometryState;
			if (ebene === 'bezirk') {
				next = {
					ebene,
					fc: bezirkeFc,
					slugs: bezirkSlugsForFeatures(bezirkeFc),
					names: bezirkNamesForFeatures(bezirkeFc)
				};
			} else {
				const kiezLayer = manifest.layers.find((l) => l.slug === 'lor-bezirksregion');
				if (!kiezLayer) throw new Error('lor-bezirksregion-Layer fehlt im Manifest');
				const kiezFc = await fetchLayer(kiezLayer.filename, this.#fetchFn);
				next = {
					ebene,
					fc: kiezFc,
					slugs: buildKiezSlugsForFeatures(kiezFc, bezirkeFc),
					names: kiezNamesForFeatures(kiezFc, bezirkeFc)
				};
			}
			this.#cache[ebene] = next;
			// Stale-Guard: gegen die tatsächlich angezeigte Ebene.
			if (isStale()) return;
			this.geometry = next;
			this.status = 'loaded';
		} catch {
			if (isStale()) return;
			this.status = 'error';
		}
	}
}
