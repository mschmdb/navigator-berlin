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
import type { GebietFeatureCollection } from './winner-map-data.js';
import { genericFillOpacityExpression, NEUTRAL_FARBE } from './winner-map-data.js';
import {
	registerPartyPatterns,
	buildPatternImageData,
	toImageData,
	type PatternAddImageMap
} from './partei-pattern-images.js';
import {
	fillColorExpression,
	fillOpacityExpression,
	fillPatternExpression,
	wechselOutlineExpression,
	winnerForJahrJs
} from './winner-map-expressions.js';
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
	setFilter: (layer: string, filter: unknown) => void;
	fitBounds: (bounds: [[number, number], [number, number]], opts?: Record<string, unknown>) => void;
	on: (event: string, layerOrHandler: unknown, handler?: unknown) => void;
}

/** Konstruktor-Signatur der MapLibre-`Map`-Klasse -- Test-Naht (`mapFactory`)
 * kann eine Fake-Implementierung liefern statt der echten Bibliothek. */
type MapLibreMapCtor = new (options: Record<string, unknown>) => MapLibreMapLike;

/** Filter, der auf keinem Feature jemals matcht (Stimmbezirk: nie Wechsel-Outline). */
const NEVER_FILTER: unknown[] = ['==', ['literal', 1], 0];

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
	readonly getFc: () => GebietFeatureCollection | null;
	/**
	 * Aktives Anzeige-Jahr für den Erst-Init-Paint (Story 7: kiez/bezirk
	 * backen alle Jahre einmal, das Paint muss ab dem ersten Frame den
	 * richtigen Jahr-Ausschnitt zeigen statt kurz generische/leere Keys zu
	 * lesen). `null`/undefiniert = Stimmbezirks-Pfad, generische Properties.
	 */
	readonly getActiveJahr?: () => number | null;
	/**
	 * Injizierbar für Tests: liefert den MapLibre-`Map`-Konstruktor, ohne den
	 * echten dynamischen Import (inkl. CSS) auszulösen (Muster
	 * `kiez-finder-panel.svelte.test.ts`, hier als Factory statt fertiger
	 * Instanz, weil der Controller die Instanz selbst erzeugt/verwaltet).
	 * Default: echter `import('maplibre-gl')` + CSS.
	 */
	readonly mapFactory?: () => Promise<MapLibreMapCtor>;
}

async function defaultMapFactory(): Promise<MapLibreMapCtor> {
	const { Map: MapLibreMap } = await import('maplibre-gl');
	await import('maplibre-gl/dist/maplibre-gl.css');
	return MapLibreMap as unknown as MapLibreMapCtor;
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
	#getFc: () => GebietFeatureCollection | null;
	#getActiveJahr: () => number | null;
	/** Zuletzt gemaltes Jahr (Story 7); `null` = Stimmbezirks-Pfad, generische Properties. */
	#activeJahr: number | null = null;
	#patternsEnabled = false;
	#mapFactory: () => Promise<MapLibreMapCtor>;

	constructor(opts: WinnerMapControllerOptions) {
		this.#getFc = opts.getFc;
		this.#getActiveJahr = opts.getActiveJahr ?? (() => null);
		this.#mapFactory = opts.mapFactory ?? defaultMapFactory;
	}

	/** Init beim ersten Mal mit Daten, danach nur noch `setData` auf der
	 * bestehenden Instanz -- niemals erneut initialisieren. */
	ensureMap(fc: GebietFeatureCollection | null): void {
		if (!fc || fc.features.length === 0 || !this.container) return;
		if (!this.#map && !this.#initializing) {
			void this.#initMap();
		} else if (this.ready && this.#map) {
			this.#map.getSource('winners')?.setData(fc as unknown as GeoJSON.FeatureCollection);
		}
	}

	/**
	 * Story 7: Jahr-Wechsel auf kiez/bezirk ist NUR NOCH `setPaintProperty`
	 * (Finder-Muster), kein `setData`. Aktualisiert Farbe/Deckkraft/Muster
	 * (falls aktiv) UND den Wechsel-Outline-Filter für das übergebene Jahr.
	 * Kein Aufruf vom Stimmbezirks-Pfad (Boundary: nie Zeit-Animation dort).
	 */
	setActiveJahr(jahr: number): void {
		this.#activeJahr = jahr;
		if (!this.ready || !this.#map) return;
		this.#map.setPaintProperty('winners-fill', 'fill-color', fillColorExpression(jahr));
		this.#map.setPaintProperty('winners-fill', 'fill-opacity', fillOpacityExpression(jahr));
		if (this.#patternsEnabled) {
			this.#map.setPaintProperty(
				'winners-fill',
				'fill-pattern',
				fillPatternExpression(jahr, NEUTRAL_PATTERN_ID)
			);
		}
		this.#map.setFilter('winners-wechsel-outline', wechselOutlineExpression(jahr));
	}

	/**
	 * Ebenen-Wechsel WEG von kiez/bezirk (z. B. zu Stimmbezirk): setzt Paint/
	 * Filter zurück auf die generischen Properties (`farbe`/`anteil`/
	 * `has_winner`), sonst bleibt die Stimmbezirks-Karte auf den zuletzt
	 * gemalten `w_<jahr>_*`-Keys stehen (leer/neutral) und der Tooltip verliert
	 * Partei/Anteil, weil `#activeJahr` nie zurückgesetzt wurde.
	 */
	clearActiveJahr(): void {
		if (this.#activeJahr === null) return;
		this.#activeJahr = null;
		if (!this.ready || !this.#map) return;
		this.#map.setPaintProperty('winners-fill', 'fill-color', ['get', 'farbe']);
		this.#map.setPaintProperty('winners-fill', 'fill-opacity', genericFillOpacityExpression());
		if (this.#patternsEnabled) {
			this.#map.setPaintProperty('winners-fill', 'fill-pattern', [
				'coalesce',
				['get', 'pattern_image_id'],
				NEUTRAL_PATTERN_ID
			]);
		}
		this.#map.setFilter('winners-wechsel-outline', NEVER_FILTER);
	}

	setPatternsEnabled(enabled: boolean, parteien: readonly string[]): void {
		this.#patternsEnabled = enabled;
		if (!this.ready || !this.#map) return;
		if (enabled) {
			registerPartyPatterns(this.#map, parteien);
			this.#registerNeutralPattern(this.#map);
			// coalesce: neutrale Gebiete haben pattern_image_id null; ohne
			// Fallback-Image meldet MapLibre missing-image und die Flaeche kippt.
			const patternExpr =
				this.#activeJahr !== null
					? fillPatternExpression(this.#activeJahr, NEUTRAL_PATTERN_ID)
					: ['coalesce', ['get', 'pattern_image_id'], NEUTRAL_PATTERN_ID];
			this.#map.setPaintProperty('winners-fill', 'fill-pattern', patternExpr);
		} else {
			this.#map.setPaintProperty('winners-fill', 'fill-pattern', undefined);
		}
	}

	highlight(fc: GebietFeatureCollection | null, slug: string | null): void {
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
		const MapLibreMap = await this.#mapFactory();
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
		// Story 7: Erst-Init-Paint liest bereits das aktive Jahr (falls
		// bekannt), sonst würden kiez/bezirk-Baked-FCs für einen Frame
		// generische (nicht existente) Property-Keys ansprechen.
		this.#activeJahr = this.#getActiveJahr();
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
				'fill-color':
					this.#activeJahr !== null ? fillColorExpression(this.#activeJahr) : ['get', 'farbe'],
				'fill-opacity':
					this.#activeJahr !== null
						? fillOpacityExpression(this.#activeJahr)
						: genericFillOpacityExpression(),
				'fill-outline-color': 'rgba(20,20,20,0.18)'
			}
		});
		instance.addLayer({
			id: 'winners-highlight',
			type: 'line',
			source: 'highlight',
			paint: { 'line-color': '#141414', 'line-width': 3 }
		});
		// Wechsel-Outline (Story 7): eigener line-Layer über winners-fill,
		// Filter statt Paint-Bedingung -- nur Gebiete mit Wechsel-Flag=1 im
		// aktiven Jahr bekommen eine Kontur. Nie sichtbar auf Stimmbezirk
		// (activeJahr bleibt dort `null`, Boundary: nie Zeit-Animation dort).
		instance.addLayer({
			id: 'winners-wechsel-outline',
			type: 'line',
			source: 'winners',
			filter: this.#activeJahr !== null ? wechselOutlineExpression(this.#activeJahr) : NEVER_FILTER,
			paint: { 'line-color': '#141414', 'line-width': 2.5, 'line-dasharray': [2, 1] }
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
				if (this.#activeJahr !== null) {
					const w = winnerForJahrJs(props, this.#activeJahr);
					this.tooltipData = {
						gebietName: w.gebietName,
						partei: w.partei,
						anteil: w.anteil,
						hasWinner: w.hasWinner,
						wechsel: w.wechsel
					};
				} else {
					this.tooltipData = {
						gebietName: typeof props.gebiet_name === 'string' ? props.gebiet_name : '',
						partei: typeof props.partei === 'string' ? props.partei : null,
						anteil: typeof props.anteil === 'number' ? props.anteil : 0,
						hasWinner: props.has_winner === 1,
						wechsel: false
					};
				}
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
