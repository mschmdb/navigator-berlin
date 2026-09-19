/**
 * Story 5 (Stimmbezirks-Ebene als Standard-Ansicht): Fetch/Cache/Adress-PiP
 * für die Stimmbezirks-Ebene als eigene Klasse ausgelagert (Datei-Zeilenlimit
 * `winner-map.svelte`, Muster `WinnerMapController`).
 *
 * Zwei Unterschiede zum bestehenden Kiez/Bezirk-Pfad (winner-map.svelte):
 * - Winners-Cache ist pro `typ×stimmtyp×jahr` (nicht pro Reihe-Bulk), weil
 *   die API für Stimmbezirke jahrweise antwortet (Design Notes: ~2.200 statt
 *   ~7.000 Rows pro Response).
 * - Geometrie-Cache ist pro `geo_slug` (Wahl-Generation), nicht pro Ebene --
 *   mehrere Jahre (z. B. agh21/agh23) teilen sich dieselbe Geometrie
 *   (`geoSlugForWahl`).
 *
 * Adress-Suche läuft als Point-in-Polygon direkt auf der geladenen
 * Geometrie (RBush-Index + Turf, Bestandsmuster `resolve-spatial-level.ts`),
 * statt über die generische `resolveSpatialLevel`-Route (die kennt nur
 * Kiez/Bezirk-Layer, keine Stimmbezirke).
 */
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { loadManifest } from '$lib/data/manifest.js';
import { fetchLayer } from '$lib/data/internal/layer-fetch.js';
import { buildIndex, type FeatureIndex } from '$lib/data/internal/spatial-index.js';
import { dbUwbIdFromGeo, type GeoUwbProps } from '$lib/data/wahl-geo-mapping.js';
import type { WinnerApiRow } from './winner-map-data.js';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface StimmbezirkWinnersResponse {
	readonly winners: WinnerApiRow[];
}

export interface StimmbezirkGeometryState {
	readonly geoSlug: string;
	readonly wahlSlug: string;
	readonly fc: FeatureCollection;
	readonly index: FeatureIndex;
}

export class StimmbezirkLoader {
	winnersStatus = $state<LoadStatus>('idle');
	winnersResponse = $state<StimmbezirkWinnersResponse | null>(null);
	geometryStatus = $state<LoadStatus>('idle');
	geometry = $state<StimmbezirkGeometryState | null>(null);

	#fetchFn: typeof fetch;
	#winnersCache: Record<string, StimmbezirkWinnersResponse> = {};
	#geometryCache: Record<string, StimmbezirkGeometryState> = {};

	constructor(fetchFn: typeof fetch) {
		this.#fetchFn = fetchFn;
	}

	/**
	 * `isStale` wird nach dem Await erneut geprüft (Muster winner-map.svelte
	 * Stale-Guards): schnelle Reihe/Jahr-Wechsel dürfen eine langsame alte
	 * Response nicht mehr über die aktuelle Auswahl schreiben.
	 */
	async loadWinners(
		typ: string,
		stimmtyp: string,
		jahr: number,
		isStale: () => boolean
	): Promise<void> {
		const key = `${typ}-${stimmtyp}-${jahr}`;
		const cached = this.#winnersCache[key];
		if (cached) {
			this.winnersResponse = cached;
			this.winnersStatus = 'loaded';
			return;
		}
		this.winnersStatus = 'loading';
		try {
			const url = `/api/wahl/winners?typ=${typ}&stimmtyp=${stimmtyp}&ebene=stimmbezirk&jahr=${jahr}`;
			const res = await this.#fetchFn(url);
			if (!res.ok) throw new Error(`status ${res.status}`);
			const data = (await res.json()) as StimmbezirkWinnersResponse;
			if (!Array.isArray(data?.winners)) throw new Error('malformed winners response');
			this.#winnersCache[key] = data;
			if (isStale()) return;
			this.winnersResponse = data;
			this.winnersStatus = 'loaded';
		} catch {
			if (isStale()) return;
			this.winnersStatus = 'error';
		}
	}

	async loadGeometry(geoSlug: string, wahlSlug: string, isStale: () => boolean): Promise<void> {
		const cached = this.#geometryCache[geoSlug];
		if (cached) {
			// wahlSlug IMMER vom aktuellen Aufruf: ein geoSlug (z.B. ah21) wird
			// von btw21 UND agh21/23/bvv geteilt, deren uwbId-Formate sich
			// unterscheiden -- der zuerst gecachte wahlSlug darf nie kleben.
			this.geometry = { ...cached, wahlSlug };
			this.geometryStatus = 'loaded';
			return;
		}
		this.geometryStatus = 'loading';
		try {
			const manifest = await loadManifest(this.#fetchFn);
			const layer = manifest.layers.find((l) => l.slug === `wahlbezirke-${geoSlug}`);
			if (!layer) throw new Error(`wahlbezirke-${geoSlug}-Layer fehlt im Manifest`);
			const fc = await fetchLayer(layer.filename, this.#fetchFn);
			const next: StimmbezirkGeometryState = { geoSlug, wahlSlug, fc, index: buildIndex(fc) };
			this.#geometryCache[geoSlug] = next;
			if (isStale()) return;
			this.geometry = next;
			this.geometryStatus = 'loaded';
		} catch {
			if (isStale()) return;
			this.geometryStatus = 'error';
		}
	}

	/** Point-in-Polygon auf der geladenen Geometrie, liefert die DB-uwbId oder `null`. */
	resolveAddress(lat: number, lng: number): string | null {
		if (!this.geometry) return null;
		const { fc, index, wahlSlug } = this.geometry;
		const candidates = index.search({
			minX: lng - 0.001,
			minY: lat - 0.001,
			maxX: lng + 0.001,
			maxY: lat + 0.001
		});
		const queryPoint = point([lng, lat]);
		for (const cand of candidates) {
			const feature = fc.features[cand.featureIndex] as Feature<Polygon | MultiPolygon>;
			if (booleanPointInPolygon(queryPoint, feature)) {
				return dbUwbIdFromGeo((feature.properties ?? {}) as GeoUwbProps, wahlSlug);
			}
		}
		return null;
	}
}
