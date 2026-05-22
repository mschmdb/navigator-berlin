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
		// MANIFEST.json ist der Layer-Index und ändert sich bei jedem Deploy mit neuen
		// Content-Hashes. Der statische Cache-Header (max-age + stale-while-revalidate) würde
		// sonst ein veraltetes Manifest liefern, das auf gelöschte Hash-Files zeigt (404).
		// `no-cache` erzwingt Revalidierung gegen den ETag (billig: 304 wenn unverändert).
		const res = await fetchFn(MANIFEST_URL, { cache: 'no-cache' });
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
