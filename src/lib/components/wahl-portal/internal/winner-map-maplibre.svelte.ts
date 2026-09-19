/**
 * Story 4 (Winner-Map): MapLibre-Lifecycle als eigene Klasse ausgelagert
 * (Datei-Zeilenlimit `winner-map.svelte`). Kapselt Init/Update/Highlight/
 * Pattern-Toggle/Cleanup der MapLibre-Instanz, damit die Kapitel-Komponente
 * nur noch Daten-Ableitung + Markup bleibt.
 *
 * Basemap = Navigator-Standard-Style (Muster `map-libre-canvas.svelte`/
 * `map-embed.svelte`: `styleUrl` statt Inline-Style, `attributionControl:
 * false`, `maxBounds`/`minZoom`/`maxZoom` gegen Wegscrollen/Rauszoomen). Die
 * Winners-Choropleth wird als halbtransparente Fill-Layer NACH `load` darüber
 * gelegt (Look der Atlas-Wertkarten); Sources/Layers können bei einem Style
 * aus einer URL erst nach `load` ergänzt werden.
 *
 * Reihe/Jahr/Ebene-Wechsel aktualisieren NUR die bestehende Instanz
 * (`setData`/`setPaintProperty`), niemals Destroy+Re-Init (Live-Fund 19.09.:
 * ein Steuerleisten-Klick liess die Karte sonst dauerhaft verschwinden, weil
 * der `{#if}`-Zweig der Kapitel-Komponente kurz kollabierte und den
 * Container-Node unter der Instanz wegriss).
 */
import bbox from '@turf/bbox';
import type { WinnerFeatureCollection } from './winner-map-data.js';
import { ANTEIL_OPACITY_RAMP, NEUTRAL_OPACITY, NEUTRAL_FARBE } from './winner-map-data.js';
import {
	registerPartyPatterns,
	buildPatternImageData,
	toImageData,
	type PatternAddImageMap
} from './partei-pattern-images.js';
import type { WinnerTooltipData } from '../winner-map-tooltip.svelte';

interface GeoJsonSourceLike {
	setData: (data: GeoJSON.FeatureCollection) => void;
}

interface MapLibreMapLike extends PatternAddImageMap {
	remove: () => void;
	resize: () => void;
	getCanvas: () => { style: { cursor: string } };
	getSource: (id: string) => GeoJsonSourceLike | undefined;
	addSource: (id: string, source: Record<string, unknown>) => void;
	addLayer: (layer: Record<string, unknown>) => void;
	setPaintProperty: (layer: string, prop: string, value: unknown) => void;
	fitBounds: (bounds: [[number, number], [number, number]], opts?: Record<string, unknown>) => void;
	on: (event: string, layerOrHandler: unknown, handler?: unknown) => void;
}

// Navigator-Standard-Pan-Bounds (Muster map-libre-canvas.svelte BERLIN_MAX_BOUNDS).
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

export interface WinnerMapControllerOptions {
	/** Liest den aktuell abgeleiteten Stand (nicht den Aufruf-Zeitpunkt-Stand)
	 * -- der `load`-Handler feuert async, `joinedFc` kann sich bis dahin schon
	 * weiterbewegt haben. */
	readonly getFc: () => WinnerFeatureCollection | null;
}

const NEUTRAL_PATTERN_ID = 'wahl-partei-pattern-neutral';

export class WinnerMapController {
	container: HTMLDivElement | null = $state(null);
	ready = $state(false);
	tooltipVisible = $state(false);
	tooltipPos = $state<{ x: number; y: number }>({ x: 0, y: 0 });
	tooltipData = $state<WinnerTooltipData | null>(null);
	/** Test-/UI-beobachtbar: Slug des aktuell hervorgehobenen Gebiets. */
	highlightedSlug = $state<string | null>(null);

	#map: MapLibreMapLike | null = null;
	#initializing = false;
	#getFc: () => WinnerFeatureCollection | null;

	constructor(opts: WinnerMapControllerOptions) {
		this.#getFc = opts.getFc;
	}

	/** Init beim ersten Mal mit Daten, danach nur noch `setData` auf der
	 * bestehenden Instanz -- niemals erneut initialisieren. */
	ensureMap(fc: WinnerFeatureCollection | null): void {
		if (!fc || fc.features.length === 0 || !this.container) return;
		if (!this.#map && !this.#initializing) {
			void this.#initMap();
		} else if (this.ready && this.#map) {
			this.#map.getSource('winners')?.setData(fc as unknown as GeoJSON.FeatureCollection);
		}
	}

	setPatternsEnabled(enabled: boolean, parteien: readonly string[]): void {
		if (!this.ready || !this.#map) return;
		if (enabled) {
			registerPartyPatterns(this.#map, parteien);
			this.#registerNeutralPattern(this.#map);
			// coalesce: neutrale Gebiete haben pattern_image_id null; ohne
			// Fallback-Image meldet MapLibre missing-image und die Flaeche kippt.
			this.#map.setPaintProperty('winners-fill', 'fill-pattern', [
				'coalesce',
				['get', 'pattern_image_id'],
				NEUTRAL_PATTERN_ID
			]);
		} else {
			this.#map.setPaintProperty('winners-fill', 'fill-pattern', undefined);
		}
	}

	highlight(fc: WinnerFeatureCollection | null, slug: string | null): void {
		this.highlightedSlug = slug;
		if (!this.ready || !this.#map) return;
		const source = this.#map.getSource('highlight');
		if (!source) return;
		const feature = slug && fc ? fc.features.find((f) => f.properties.gebiet_slug === slug) : null;
		if (!feature) {
			source.setData({ type: 'FeatureCollection', features: [] });
			return;
		}
		source.setData({ type: 'FeatureCollection', features: [feature] });
		const featureBbox = toFitBounds(bbox(feature) as [number, number, number, number]);
		this.#map.fitBounds(featureBbox, { padding: 40, animate: true });
	}

	#registerNeutralPattern(map: MapLibreMapLike): void {
		if (map.hasImage(NEUTRAL_PATTERN_ID)) return;
		const spec = buildPatternImageData('solid', NEUTRAL_FARBE);
		map.addImage(NEUTRAL_PATTERN_ID, toImageData(spec));
	}

	destroy(): void {
		this.#map?.remove();
		this.#map = null;
		this.ready = false;
	}

	async #initMap(): Promise<void> {
		if (!this.container || this.#map || this.#initializing) return;
		this.#initializing = true;
		const { Map: MapLibreMap } = await import('maplibre-gl');
		await import('maplibre-gl/dist/maplibre-gl.css');
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
			if (e?.error) console.warn('[winner-map]', e.error.message);
		});

		instance.on('load', () => this.#onStyleLoad(typedInstance));
	}

	#onStyleLoad(instance: MapLibreMapLike): void {
		// destroy() kann vor dem async load-Event laufen; dann gehoert die
		// Closure-Instanz nicht mehr zur Klasse und darf nichts mehr anfassen.
		if (instance !== this.#map) return;
		const fc = this.#getFc();
		if (!fc) return;
		instance.addSource('winners', {
			type: 'geojson',
			data: fc as unknown as GeoJSON.FeatureCollection
		});
		instance.addSource('highlight', {
			type: 'geojson',
			data: { type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection
		});
		instance.addLayer({
			id: 'winners-fill',
			type: 'fill',
			source: 'winners',
			paint: {
				'fill-color': ['get', 'farbe'],
				'fill-opacity': [
					'case',
					['==', ['get', 'has_winner'], 1],
					[
						'interpolate',
						['linear'],
						['get', 'anteil'],
						ANTEIL_OPACITY_RAMP.minAnteil,
						ANTEIL_OPACITY_RAMP.minOpacity,
						ANTEIL_OPACITY_RAMP.maxAnteil,
						ANTEIL_OPACITY_RAMP.maxOpacity
					],
					NEUTRAL_OPACITY
				],
				'fill-outline-color': 'rgba(20,20,20,0.18)'
			}
		});
		instance.addLayer({
			id: 'winners-highlight',
			type: 'line',
			source: 'highlight',
			paint: { 'line-color': '#141414', 'line-width': 3 }
		});

		// Navigator-Hover-Tooltip statt MapLibre-Klick-Popup (Muster
		// map-hover-tooltip.svelte): kein HTML-String-Popup.
		instance.on(
			'mousemove',
			'winners-fill',
			(e: { features?: Array<{ properties: Record<string, unknown> }>; point: { x: number; y: number } }) => {
				const feature = e.features?.[0];
				if (!feature) {
					this.tooltipVisible = false;
					return;
				}
				const props = feature.properties;
				this.tooltipData = {
					gebietName: typeof props.gebiet_name === 'string' ? props.gebiet_name : '',
					partei: typeof props.partei === 'string' ? props.partei : null,
					anteil: typeof props.anteil === 'number' ? props.anteil : 0,
					hasWinner: props.has_winner === 1
				};
				this.tooltipPos = { x: e.point.x, y: e.point.y };
				this.tooltipVisible = true;
				instance.getCanvas().style.cursor = 'pointer';
			}
		);
		instance.on('mouseleave', 'winners-fill', () => {
			this.tooltipVisible = false;
			instance.getCanvas().style.cursor = '';
		});

		const fitTo = toFitBounds(bbox(fc) as [number, number, number, number]);
		instance.fitBounds(fitTo, { padding: 16, animate: false });

		// Layout-timing-Fallback (Muster map-embed.svelte): Container kann bei
		// Hydration/spätem Mount kurzzeitig 0×0 sein.
		if (typeof requestAnimationFrame !== 'undefined') {
			requestAnimationFrame(() => instance.resize());
		}

		this.ready = true;
	}
}
