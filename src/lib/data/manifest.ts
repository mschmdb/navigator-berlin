import type { Bundle, LayerMetadata, Manifest } from './types.js';
import { validateManifest } from './manifest-schema.js';

const MANIFEST_URL = '/layers/MANIFEST.json';

let cached: Manifest | null = null;
let inflight: Promise<Manifest> | null = null;

export function _resetManifestCache(): void {
	cached = null;
	inflight = null;
}

export async function loadManifest(fetchFn: typeof fetch = fetch): Promise<Manifest> {
	if (cached) return cached;
	if (inflight) return inflight;
	inflight = (async () => {
		const res = await fetchFn(MANIFEST_URL);
		if (!res.ok) {
			inflight = null;
			throw new Error(`Failed to load MANIFEST: HTTP ${res.status}`);
		}
		const json = await res.json();
		const parsed = validateManifest(json);
		cached = parsed;
		inflight = null;
		return parsed;
	})();
	return inflight;
}

export function getLayerEntry(slug: string): LayerMetadata | undefined {
	if (!cached) return undefined;
	return cached.layers.find((l) => l.slug === slug);
}

export function getLayersByBundle(bundle: Bundle): LayerMetadata[] {
	if (!cached) return [];
	return cached.layers.filter((l) => l.bundleGroup === bundle);
}
