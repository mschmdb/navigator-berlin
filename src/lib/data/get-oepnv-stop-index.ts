export interface OepnvStop {
	name: string;
	lat: number;
	lng: number;
	lines?: string[];
}

export interface OepnvStopIndex {
	ubahn: OepnvStop[];
	sbahn: OepnvStop[];
	tram: OepnvStop[];
	bus: OepnvStop[];
}

let cache: OepnvStopIndex | null = null;
let inflight: Promise<OepnvStopIndex> | null = null;

export function _resetOepnvStopIndexCache(): void {
	cache = null;
	inflight = null;
}

export async function getOepnvStopIndex(fetchFn: typeof fetch = fetch): Promise<OepnvStopIndex> {
	if (cache) return cache;
	if (inflight) return inflight;
	inflight = (async () => {
		const res = await fetchFn('/oepnv-stops-index.json');
		if (!res.ok) {
			throw new Error(`Failed to load oepnv-stops-index: HTTP ${res.status}`);
		}
		const data = (await res.json()) as OepnvStopIndex;
		cache = data;
		return data;
	})();
	try {
		return await inflight;
	} finally {
		inflight = null;
	}
}
