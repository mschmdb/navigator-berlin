/**
 * Trends-/Volatilitäts-Karte: eigener MapLibre-Controller (Muster
 * `WinnerMapController`, reduziert auf das hier Nötige -- kein Tooltip,
 * keine Patterns). Volatilität + Trend aller Chip-Parteien sind bereits
 * gebacken (`bakeTrendsProperties`), ein Toggle-/Chip-Wechsel ist deshalb
 * NUR `setPaintProperty` (AC), niemals Destroy+Re-Init und niemals ein
 * zweiter `/api/wahl/analytik`-Request.
 */
import bbox from '@turf/bbox';
import {
	trendsFillColorExpression,
	trendsFillOpacityExpression,
	type BakedTrendsFeatureCollection
} from './trends-map-expressions.js';
import { TRENDS_FILL_OPACITY, type TrendsToggle } from './trends-map-data.js';
import { paddedMaxBounds, type FitBounds } from './map-fit-constraints.js';

/** Deckkraft für Gebiete ohne Analytik-Daten (`*_hat_daten: 0`); exportiert,
 * damit die Legende (`trends-kapitel.svelte`, Review Triage Log #7) den
 * „Keine Daten"-Swatch mit derselben Optik wie die Karte rendert. */
export const NEUTRAL_OPACITY = 0.12;

interface GeoJsonSourceLike {
	setData: (data: GeoJSON.FeatureCollection) => void;
}

interface MapLibreMapLike {
	remove: () => void;
	resize: () => void;
	getSource: (id: string) => GeoJsonSourceLike | undefined;
	addSource: (id: string, source: Record<string, unknown>) => void;
	addLayer: (layer: Record<string, unknown>) => void;
	setPaintProperty: (layer: string, prop: string, value: unknown) => void;
	fitBounds: (bounds: [[number, number], [number, number]], opts?: Record<string, unknown>) => void;
	/** Story 12: Karten-Anschlag-Grenzen nach dem initialen Fit (siehe
	 * `map-fit-constraints.ts`). `getBounds()` liefert die nach dem Fit
	 * SICHTBAREN Bounds (echtes MapLibre: `LngLatBounds.toArray()` ==
	 * `[[west, south], [east, north]]`), die Quelle für `paddedMaxBounds` --
	 * nicht die schmale Daten-Bbox (Review Triage Log #1). */
	setMaxBounds: (bounds: FitBounds) => void;
	setMinZoom: (zoom: number) => void;
	getZoom: () => number;
	getBounds: () => { toArray: () => FitBounds };
	on: (event: string, handler: unknown) => void;
}

type MapLibreMapCtor = new (options: Record<string, unknown>) => MapLibreMapLike;

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

async function defaultMapFactory(): Promise<MapLibreMapCtor> {
	const { Map: MapLibreMap } = await import('maplibre-gl');
	await import('maplibre-gl/dist/maplibre-gl.css');
	return MapLibreMap as unknown as MapLibreMapCtor;
}

export interface TrendsMapControllerOptions {
	readonly getFc: () => BakedTrendsFeatureCollection | null;
	readonly getToggle: () => TrendsToggle;
	readonly getAktivePartei: () => string;
	readonly mapFactory?: () => Promise<MapLibreMapCtor>;
}

export class TrendsMapController {
	container: HTMLDivElement | null = $state(null);
	ready = $state(false);

	#map: MapLibreMapLike | null = null;
	/** Container, an dem `#map` tatsächlich hängt -- weicht `container` nach
	 * einem Reihen-Wechsel-Loading-Zyklus (Container neu gemountet) ab, siehe
	 * `ensureMap` (Review Triage Log #13). */
	#mountedContainer: HTMLDivElement | null = null;
	#initializing = false;
	#destroyed = false;
	#getFc: () => BakedTrendsFeatureCollection | null;
	#getToggle: () => TrendsToggle;
	#getAktivePartei: () => string;
	#mapFactory: () => Promise<MapLibreMapCtor>;

	constructor(opts: TrendsMapControllerOptions) {
		this.#getFc = opts.getFc;
		this.#getToggle = opts.getToggle;
		this.#getAktivePartei = opts.getAktivePartei;
		this.#mapFactory = opts.mapFactory ?? defaultMapFactory;
	}

	/** Init beim ersten Mal mit Daten; ein späterer Datenwechsel (z. B. Ebenen-
	 * Wechsel im Sankey wirkt sich NICHT auf diese Karte aus, die ist immer
	 * Kiez-only) aktualisiert die bestehende Source statt neu zu initialisieren. */
	ensureMap(fc: BakedTrendsFeatureCollection | null): void {
		if (!fc || fc.features.length === 0 || !this.container) return;
		if (this.#map && this.container !== this.#mountedContainer) {
			// Container wurde neu gemountet (z. B. Reihen-Wechsel-Loading-Zyklus):
			// die bestehende Map hängt an einem abgehängten Div und würde als
			// dauerhaft leerer Kasten stehen bleiben -- Destroy + Neustart statt
			// `setData` ins Leere (Review Triage Log #13).
			this.destroy();
			this.#destroyed = false;
		}
		if (!this.#map && !this.#initializing) {
			void this.#initMap();
		} else if (this.ready && this.#map) {
			this.#map.getSource('trends')?.setData(fc as unknown as GeoJSON.FeatureCollection);
		}
	}

	/** Toggle-/Chip-Wechsel: NUR `setPaintProperty` (AC), kein `setData`, kein Re-Init. */
	repaint(): void {
		if (!this.ready || !this.#map) return;
		const toggle = this.#getToggle();
		const partei = this.#getAktivePartei();
		this.#map.setPaintProperty(
			'trends-fill',
			'fill-color',
			trendsFillColorExpression(toggle, partei)
		);
		this.#map.setPaintProperty(
			'trends-fill',
			'fill-opacity',
			trendsFillOpacityExpression(toggle, partei, TRENDS_FILL_OPACITY, NEUTRAL_OPACITY)
		);
	}

	destroy(): void {
		this.#destroyed = true;
		this.#map?.remove();
		this.#map = null;
		this.#mountedContainer = null;
		this.ready = false;
	}

	async #initMap(): Promise<void> {
		if (!this.container || this.#map || this.#initializing) return;
		this.#initializing = true;
		const container = this.container;
		try {
			const MapLibreMap = await this.#mapFactory();
			if (this.#destroyed || !this.container) {
				this.#initializing = false;
				return;
			}
			const instance = new MapLibreMap({
				container,
				style: '/map-style.json',
				center: [13.4, 52.5],
				zoom: 9,
				// Story 12: von 9 auf 8 gesenkt -- der echte Fit-Zoom der Kiez-Bbox
				// liegt bei ~8,7 und wurde vom Konstruktions-minZoom vorher geklemmt,
				// was den initialen Fit auf breiten Canvases verzerrte (Review
				// Triage Log #1).
				minZoom: 8,
				maxZoom: 19,
				maxBounds: BERLIN_MAX_BOUNDS,
				attributionControl: false,
				interactive: true
			});
			const typedInstance = instance as unknown as MapLibreMapLike;
			this.#map = typedInstance;
			this.#mountedContainer = container;
			this.#initializing = false;

			instance.on('error', (e: { error?: Error }) => {
				if (e?.error) console.warn('[trends-kapitel]', e.error.message);
			});
			instance.on('load', () => this.#onStyleLoad(typedInstance));
		} catch (error) {
			// Review Triage Log #3: dasselbe Problem wie im Wechsel-Controller --
			// ein Factory-/Import-Reject hielt `#initializing` vorher dauerhaft
			// `true` (kein Fehlerzustand, unbehandelte Promise-Rejection).
			this.#initializing = false;
			console.warn('[trends-kapitel] Karte konnte nicht initialisiert werden', error);
		}
	}

	#onStyleLoad(instance: MapLibreMapLike): void {
		if (instance !== this.#map) return;
		const fc = this.#getFc();
		if (!fc) return;
		const toggle = this.#getToggle();
		const partei = this.#getAktivePartei();
		instance.addSource('trends', {
			type: 'geojson',
			data: fc as unknown as GeoJSON.FeatureCollection
		});
		instance.addLayer({
			id: 'trends-fill',
			type: 'fill',
			source: 'trends',
			paint: {
				'fill-color': trendsFillColorExpression(toggle, partei),
				'fill-opacity': trendsFillOpacityExpression(
					toggle,
					partei,
					TRENDS_FILL_OPACITY,
					NEUTRAL_OPACITY
				),
				'fill-outline-color': 'rgba(20,20,20,0.18)'
			}
		});
		// Review Triage Log #2: eine leere FeatureCollection liefert aus
		// `turf.bbox` Infinity -- kein Fit, keine Anschlag-Grenzen, kein Crash;
		// Basemap + (leere) Source bleiben trotzdem sichtbar.
		if (fc.features.length > 0) {
			// Story 12/Review Triage Log #1: `resize()` SYNCHRON vor dem Fit --
			// sonst stammen die Transform-Maße noch aus der Konstruktion, MapLibre
			// fittet dann auf einen falschen Canvas und "korrigiert" das später
			// per Constrain-Zoom (Beschnitt).
			instance.resize();
			const fitTo = toFitBounds(bbox(fc) as [number, number, number, number]);
			instance.fitBounds(fitTo, { padding: 16, animate: false });
			// fitZoom NACH dem Fit erfassen (vor jedem setMaxBounds!) -- sonst
			// friert `setMinZoom` einen durch `setMaxBounds` bereits verbogenen
			// Zoom ein (Review Triage Log #1).
			const fitZoom = instance.getZoom();
			// Die Anschlag-Grenzen kommen aus den nach dem Fit SICHTBAREN Bounds
			// (`getBounds()`), nicht aus der Daten-Bbox -- der Viewport ist dann
			// nie breiter als `maxBounds`, MapLibre zwingt sich also nicht mehr
			// per Constrain-Zoom hinein (Review Triage Log #1).
			instance.setMaxBounds(paddedMaxBounds(instance.getBounds().toArray()));
			if (Number.isFinite(fitZoom)) instance.setMinZoom(fitZoom);
		}
		if (typeof requestAnimationFrame !== 'undefined') {
			// Guard gegen destroy() zwischen Schedule und Callback (Review Triage
			// Log #13): ein rAF-resize nach `destroy()` würde sonst auf einer
			// bereits entfernten Instanz laufen.
			requestAnimationFrame(() => {
				if (instance === this.#map) instance.resize();
			});
		}
		this.ready = true;
	}
}
