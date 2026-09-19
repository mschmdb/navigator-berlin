/**
 * Wechsel-Häufigkeits-Karte: eigener, schlanker MapLibre-Controller (Muster
 * `WinnerMapController`, aber ohne Tooltip/Highlight/Pattern-Toggle -- die
 * Farbe pro Gebiet ist bereits gebacken (`buildWechselFeatureCollection`)
 * und ändert sich nur, wenn Reihe/Ebene wechseln, nie pro Jahr). Basemap wie
 * überall im Portal: `/map-style.json`, Berlin-`maxBounds`, `minZoom: 9`.
 */
import bbox from '@turf/bbox';
import { WECHSEL_FILL_OPACITY, type WechselFeatureCollection } from './wechsel-map-data.js';

interface GeoJsonSourceLike {
	setData: (data: GeoJSON.FeatureCollection) => void;
}

interface MapLibreMapLike {
	remove: () => void;
	resize: () => void;
	getSource: (id: string) => GeoJsonSourceLike | undefined;
	addSource: (id: string, source: Record<string, unknown>) => void;
	addLayer: (layer: Record<string, unknown>) => void;
	fitBounds: (bounds: [[number, number], [number, number]], opts?: Record<string, unknown>) => void;
	on: (event: string, handler: unknown) => void;
}

const BERLIN_MAX_BOUNDS: [[number, number], [number, number]] = [
	[12.9, 52.25],
	[13.9, 52.75]
];

function toFitBounds(b: [number, number, number, number]): [[number, number], [number, number]] {
	return [
		[b[0], b[1]],
		[b[2], b[3]]
	];
}

export interface WechselMapControllerOptions {
	readonly getFc: () => WechselFeatureCollection | null;
}

export class WechselMapController {
	container: HTMLDivElement | null = $state(null);
	ready = $state(false);

	#map: MapLibreMapLike | null = null;
	#initializing = false;
	#destroyed = false;
	#getFc: () => WechselFeatureCollection | null;

	constructor(opts: WechselMapControllerOptions) {
		this.#getFc = opts.getFc;
	}

	ensureMap(fc: WechselFeatureCollection | null): void {
		if (!fc || fc.features.length === 0 || !this.container) return;
		if (!this.#map && !this.#initializing) {
			void this.#initMap();
		} else if (this.ready && this.#map) {
			this.#map.getSource('wechsel')?.setData(fc as unknown as GeoJSON.FeatureCollection);
		}
	}

	destroy(): void {
		this.#destroyed = true;
		this.#map?.remove();
		this.#map = null;
		this.ready = false;
	}

	async #initMap(): Promise<void> {
		if (!this.container || this.#map || this.#initializing) return;
		this.#initializing = true;
		const { Map: MapLibreMap } = await import('maplibre-gl');
		// destroy() kann waehrend dieser schwebenden Imports laufen -- ohne
		// diesen Guard wuerde die Instanz unten trotzdem erzeugt und nie
		// geremovet (verwaiste Map-Instanz).
		if (this.#destroyed) {
			this.#initializing = false;
			return;
		}
		await import('maplibre-gl/dist/maplibre-gl.css');
		if (this.#destroyed) {
			this.#initializing = false;
			return;
		}
		if (!this.container) {
			this.#initializing = false;
			return;
		}
		const instance = new MapLibreMap({
			container: this.container,
			style: '/map-style.json',
			center: [13.4, 52.5],
			zoom: 9,
			minZoom: 9,
			maxZoom: 19,
			maxBounds: BERLIN_MAX_BOUNDS,
			attributionControl: false,
			interactive: true
		});
		const typedInstance = instance as unknown as MapLibreMapLike;
		this.#map = typedInstance;
		this.#initializing = false;

		instance.on('error', (e: { error?: Error }) => {
			if (e?.error) console.warn('[wechsel-kapitel]', e.error.message);
		});
		instance.on('load', () => this.#onStyleLoad(typedInstance));
	}

	#onStyleLoad(instance: MapLibreMapLike): void {
		if (instance !== this.#map) return;
		const fc = this.#getFc();
		if (!fc) return;
		instance.addSource('wechsel', {
			type: 'geojson',
			data: fc as unknown as GeoJSON.FeatureCollection
		});
		instance.addLayer({
			id: 'wechsel-fill',
			type: 'fill',
			source: 'wechsel',
			paint: {
				'fill-color': ['get', 'farbe'],
				'fill-opacity': WECHSEL_FILL_OPACITY,
				'fill-outline-color': 'rgba(20,20,20,0.18)'
			}
		});
		const fitTo = toFitBounds(bbox(fc) as [number, number, number, number]);
		instance.fitBounds(fitTo, { padding: 16, animate: false });
		if (typeof requestAnimationFrame !== 'undefined') {
			requestAnimationFrame(() => instance.resize());
		}
		this.ready = true;
	}
}
