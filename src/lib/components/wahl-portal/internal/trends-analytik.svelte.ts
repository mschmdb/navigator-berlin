/**
 * Story 8 (Trends/Volatilität): Fetch von `/api/wahl/analytik` (Kiez-only,
 * siehe `docs/wahldaten-methodik.md` „Analytik-Methoden") als eigene Klasse
 * (Muster `KiezBezirkWinnersLoader`). Gecacht pro `typ×stimmtyp` (Boundary:
 * kein Ebenen-Parameter -- die API akzeptiert nur `ebene=kiez`, siehe
 * `+server.ts`). Modul-Cache + In-Flight-Dedupe, `_resetAnalytikCache()` für
 * Test-Isolation.
 */
import type { LoadStatus } from './winner-map-winners.svelte.js';

export interface AnalytikTrendEntry {
	readonly partei: string;
	readonly slope: number;
}

export interface AnalytikGebiet {
	readonly kiez_slug: string;
	readonly wechsel_count: number;
	readonly wechsel_jahre: readonly number[];
	readonly volatilitaet: number;
	readonly trends: readonly AnalytikTrendEntry[];
}

export interface AnalytikApiResponse {
	readonly gebiete: readonly AnalytikGebiet[];
	readonly license?: string | null;
	readonly source_name?: string | null;
	readonly source_url?: string | null;
}

const responseCache: Record<string, AnalytikApiResponse> = {};
const inFlight: Record<string, Promise<AnalytikApiResponse>> = {};

export function _resetAnalytikCache(): void {
	for (const key of Object.keys(responseCache)) delete responseCache[key];
	for (const key of Object.keys(inFlight)) delete inFlight[key];
}

export class AnalytikLoader {
	status = $state<LoadStatus>('idle');
	response = $state<AnalytikApiResponse | null>(null);

	#fetchFn: typeof fetch;

	constructor(fetchFn: typeof fetch) {
		this.#fetchFn = fetchFn;
	}

	async load(typ: string, stimmtyp: string, isStale: () => boolean): Promise<void> {
		const key = `${typ}-${stimmtyp}`;
		const cached = responseCache[key];
		if (cached) {
			this.response = cached;
			this.status = 'loaded';
			return;
		}
		this.status = 'loading';
		try {
			const data = await (inFlight[key] ?? this.#fetchOnce(key, typ, stimmtyp));
			if (isStale()) return;
			this.response = data;
			this.status = 'loaded';
		} catch {
			if (isStale()) return;
			this.status = 'error';
		}
	}

	#fetchOnce(key: string, typ: string, stimmtyp: string): Promise<AnalytikApiResponse> {
		const promise = (async () => {
			const url = `/api/wahl/analytik?ebene=kiez&typ=${typ}&stimmtyp=${stimmtyp}`;
			const res = await this.#fetchFn(url);
			if (!res.ok) throw new Error(`status ${res.status}`);
			const data = (await res.json()) as AnalytikApiResponse;
			if (!Array.isArray(data?.gebiete)) throw new Error('malformed analytik response');
			responseCache[key] = data;
			return data;
		})();
		inFlight[key] = promise;
		// Muster `KiezBezirkWinnersLoader#fetchOnce`: `.finally()` liefert eine
		// neue Promise, deren Rejection sonst als unhandled-rejection liegen
		// bleibt -- der Original-`promise` (Rückgabe) wird vom Aufrufer regulär
		// try/catch-behandelt.
		promise
			.finally(() => {
				if (inFlight[key] === promise) delete inFlight[key];
			})
			.catch(() => {});
		return promise;
	}
}
