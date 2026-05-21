import type { LayerAggregatesFile } from './layer-aggregates-types.js';

// Story 8.2b · Lazy-Loader für die 8.2a-Pre-Aggregate. Cached, einmaliger Fetch.
// Erst laden, wenn ein Nicht-Adress-Level gewählt wird (kein Eager-Fetch bei Inspector-Open).

const AGGREGATES_URL = '/layer-aggregates/layer-aggregates.json';

let cached: LayerAggregatesFile | null = null;
let inflight: Promise<LayerAggregatesFile> | null = null;

export function _resetLayerAggregatesCache(): void {
	cached = null;
	inflight = null;
}

export async function loadLayerAggregates(
	fetchFn: typeof fetch = fetch
): Promise<LayerAggregatesFile> {
	if (cached) return cached;
	if (inflight) return inflight;
	inflight = (async () => {
		const res = await fetchFn(AGGREGATES_URL);
		if (!res.ok) {
			inflight = null;
			throw new Error(`Failed to load layer-aggregates: HTTP ${res.status}`);
		}
		const json = (await res.json()) as LayerAggregatesFile;
		if (json?.schemaVersion !== 1 || typeof json.aggregates !== 'object') {
			inflight = null;
			throw new Error('layer-aggregates.json: unerwartetes Schema');
		}
		cached = json;
		inflight = null;
		return json;
	})();
	return inflight;
}
