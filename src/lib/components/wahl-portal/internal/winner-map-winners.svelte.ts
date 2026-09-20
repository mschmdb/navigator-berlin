/**
 * Winners-Fetch (kiez/bezirk) als eigene Klasse ausgelagert (Datei-
 * Zeilenlimit `winner-map.svelte`, Muster `StimmbezirkLoader`). Gecacht pro
 * `typ×stimmtyp×ebene` (AC: genau EIN Request je Kombination) -- liefert
 * ALLE Jahre der Reihe in einem Response (Story 7: Grundlage für
 * `bakeJahrProperties`, kein Jahr-Request mehr).
 *
 * Cache + In-Flight-Promise liegen auf Modul-Ebene (nicht pro Instanz):
 * Story 7 hat mit `wechsel-kapitel.svelte` einen zweiten, unabhängig
 * gemounteten Konsumenten derselben Bulk-Response bekommen (Muster
 * `manifest.ts`/`layer-fetch.ts`) -- ohne geteilten Cache würde jede
 * Komponente ihren eigenen Request feuern und die "genau EIN Request"-AC
 * verletzen. `_resetWinnersCache()` für Test-Isolation (Muster
 * `_resetManifestCache`/`_resetLayerCache`).
 *
 * Story 9 (Partei-Tabs): optionaler `partei`-Parameter erweitert den
 * Cache-Key auf `typ-stimmtyp-ebene-partei` (Default-Key ohne Partei bleibt
 * unverändert für den Gewinner-Tab, kein Cache-Invalidierungs-Bruch für
 * bestehende Aufrufer wie `wechsel-kapitel.svelte`). Die Small Multiples
 * teilen sich denselben Cache/In-Flight-Dedupe wie die Partei-Tabs.
 */
import type { WinnerApiRow } from './winner-map-data.js';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface WinnersApiResponse {
	readonly winners: WinnerApiRow[];
	readonly license?: string | null;
	readonly source_name?: string | null;
	readonly source_url?: string | null;
}

const responseCache: Record<string, WinnersApiResponse> = {};
const inFlight: Record<string, Promise<WinnersApiResponse>> = {};

export function _resetWinnersCache(): void {
	for (const key of Object.keys(responseCache)) delete responseCache[key];
	for (const key of Object.keys(inFlight)) delete inFlight[key];
}

function cacheKey(typ: string, stimmtyp: string, ebene: string, partei?: string): string {
	return `${typ}-${stimmtyp}-${ebene}-${partei ?? 'gewinner'}`;
}

export class KiezBezirkWinnersLoader {
	status = $state<LoadStatus>('idle');
	response = $state<WinnersApiResponse | null>(null);

	#fetchFn: typeof fetch;

	constructor(fetchFn: typeof fetch) {
		this.#fetchFn = fetchFn;
	}

	/**
	 * `isStale` wird nach dem Await erneut geprüft (Muster
	 * `StimmbezirkLoader.loadWinners`): ein schneller Reihe-/Ebenen-Wechsel
	 * darf eine langsame alte Response nicht mehr über die aktuelle Auswahl
	 * schreiben.
	 */
	async load(
		typ: string,
		stimmtyp: string,
		ebene: 'kiez' | 'bezirk',
		isStale: () => boolean,
		partei?: string
	): Promise<void> {
		const key = cacheKey(typ, stimmtyp, ebene, partei);
		const cached = responseCache[key];
		if (cached) {
			this.response = cached;
			this.status = 'loaded';
			return;
		}
		this.status = 'loading';
		try {
			const data = await (inFlight[key] ?? this.#fetchOnce(key, typ, stimmtyp, ebene, partei));
			if (isStale()) return;
			this.response = data;
			this.status = 'loaded';
		} catch {
			if (isStale()) return;
			this.status = 'error';
		}
	}

	/** Ein einziger In-Flight-Request je Key, geteilt über alle Aufrufer
	 * (winner-map.svelte UND wechsel-kapitel.svelte können im selben Tick
	 * denselben Key anfragen). */
	#fetchOnce(
		key: string,
		typ: string,
		stimmtyp: string,
		ebene: 'kiez' | 'bezirk',
		partei?: string
	): Promise<WinnersApiResponse> {
		const promise = (async () => {
			const parteiQuery = partei ? `&partei=${encodeURIComponent(partei)}` : '';
			const url = `/api/wahl/winners?typ=${typ}&stimmtyp=${stimmtyp}&ebene=${ebene}${parteiQuery}`;
			const res = await this.#fetchFn(url);
			if (!res.ok) throw new Error(`status ${res.status}`);
			const data = (await res.json()) as WinnersApiResponse;
			if (!Array.isArray(data?.winners)) throw new Error('malformed winners response');
			responseCache[key] = data;
			return data;
		})();
		inFlight[key] = promise;
		// `.finally()` gibt eine NEUE Promise zurueck, die eine Rejection der
		// Original-Promise übernimmt; ungenutzt (kein `await`/`.catch`) waere
		// das ein unhandled-rejection-Leck. Der Original-`promise` (Rückgabe
		// dieser Methode) wird vom Aufrufer (`load()`) regulär try/catch-
		// behandelt, dieser zweite Strang dient nur der Cache-Aufräumung.
		promise
			.finally(() => {
				if (inFlight[key] === promise) delete inFlight[key];
			})
			.catch(() => {});
		return promise;
	}
}
