<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import MapLibreCanvas from '$lib/components/atlas/map-libre-canvas.svelte';
	import MapControls from '$lib/components/atlas/map-controls.svelte';
	import MapAttribution from '$lib/components/atlas/map-attribution.svelte';
	import MapAccessibilityLayer from '$lib/components/atlas/map-accessibility-layer.svelte';
	import MapLegend from '$lib/components/atlas/map-legend.svelte';
	import MapHoverTooltip, {
		type MapHoverApi
	} from '$lib/components/atlas/map-hover-tooltip.svelte';
	import InspectorPanel from '$lib/components/atlas/inspector-panel.svelte';
	import ComparePanel from '$lib/components/atlas/compare-panel/compare-panel.svelte';
	import BottomSheet from '$lib/components/atlas/inspector-panel/bottom-sheet.svelte';
	import type { MapHandle } from '$lib/components/atlas/internal/map-keyboard.js';
	import { createPlexMarker } from '$lib/components/atlas/internal/map-markers.js';
	import { announceGlobal } from '$lib/utils/aria-live.js';
	import { trackEvent } from '$lib/utils/plausible.js';
	import { serializeViewport, serializeLayers } from '$lib/utils/url-state.js';
	import { debounce } from '$lib/utils/debounce.js';
	import { matchZoomForType } from '$lib/utils/zoom-mapping.js';
	import { reverseGeocodeAddress } from '$lib/data/geocode.remote.js';
	import { useAddressSelection } from '$lib/state/address-selection.svelte.js';
	import { getUiState, type SheetSnapVh } from '$lib/state/ui-context.svelte.js';
	import { loadManifest, getLayerEntry } from '$lib/data/manifest.js';
	import { getLayersAtPoint } from '$lib/data/get-layers-at-point.js';
	import { hasBerlinBezirkHit } from '$lib/data/has-berlin-bezirk-hit.js';
	import { isInBerlin } from '$lib/data/constants.js';
	import { getNearestClimateStation } from '$lib/data/get-climate-station.js';
	import { getClimateSeries } from '$lib/data/get-climate-series.js';
	import { getOepnvStopIndex } from '$lib/data/get-oepnv-stop-index.js';
	import { getKiezScore } from '$lib/data/get-kiez-score.js';
	import { findAllNearestStops } from '$lib/components/atlas/inspector-panel/internal/nearest-oepnv-stop.js';
	import { fetchLayer } from '$lib/data/internal/layer-fetch.js';
	import { queryPmtilesAt, type MapLibreLike } from '$lib/data/internal/pmtiles-query.js';
	import type { GeocodeSuggestion, LayerMetadata } from '$lib/data/types.js';
	import { useViewport } from '$lib/utils/use-viewport.svelte.js';
	import { SvelteSet } from 'svelte/reactivity';
	import LayerPalette from '$lib/components/atlas/layer-palette.svelte';
	import { page } from '$app/state';
	import { buildOgDescription, buildOgImageUrl, type OgImageInput } from '$lib/utils/og-image-url.js';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import { formatLayerValue } from '$lib/components/atlas/inspector-panel/internal/value-formatters.js';
	import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';
	import {
		buildLayerSpec,
		type MapLibreLayerSpec
	} from '$lib/components/atlas/internal/layer-style-builder.js';
	import {
		buildLayerSpecCascade,
		computeCascadeVariants,
		isPolygonSlug
	} from '$lib/components/atlas/internal/layer-style-cascade.js';
	import { sortSlugsByBundleStable } from '$lib/components/atlas/internal/layer-order-sorting.js';
	import { applyHiddenSlugs, exceedsPolygonLimit } from '$lib/components/atlas/internal/layer-visibility.js';
	import {
		toggleLayerHidden,
		removeLayer as removeUiLayer,
		setComparisonAddress,
		exitCompareMode
	} from '$lib/state/ui-context.svelte.js';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import {
		diffLayerSlugs,
		sourceIdFor,
		layerIdFor
	} from '$lib/components/atlas/internal/layer-diff.js';
	import { PIN_LAYER_SLUGS } from '$lib/components/atlas/internal/pin-icon-mapping.js';

	type Viewport = { center: [number, number]; zoom: number; bbox: [number, number, number, number] };
	type Props = { data: import('./$types').PageData };

	let { data }: Props = $props();

	const selection = useAddressSelection();
	const ui = getUiState();
	const viewport = useViewport('desktop');

	let mapHandle: MapHandle | null = $state.raw(null);
	let rawMap = $state.raw<unknown>(null);
	let a11yMap = $state.raw<{
		queryRenderedFeatures: (geom?: unknown, opts?: { layers?: string[] }) => unknown[];
		on: (event: string, handler: () => void) => unknown;
		off: (event: string, handler: () => void) => unknown;
	} | null>(null);
	let manifestLayers = $state<LayerMetadata[]>([]);
	let selectedFeatureId = $state<string | null>(null);
	let currentMarker: { remove: () => void; getLngLat: () => { lng: number; lat: number } } | null =
		null;
	let MarkerCtor = $state.raw<
		| (new (options: { element: HTMLElement; anchor?: string }) => {
				setLngLat: (ll: [number, number]) => {
					addTo: (m: unknown) => {
						remove: () => void;
						getLngLat: () => { lng: number; lat: number };
					};
				};
		  })
		| null
	>(null);

	const VIEWPORT_KEYS = ['bbox', 'zoom', 'center'] as const;
	const ADDRESS_KEYS = ['address', 'q'] as const;
	const LAYERS_KEY = 'layers';

	const syncViewport = debounce((v: Viewport) => {
		const url = new URL(window.location.href);
		for (const key of VIEWPORT_KEYS) url.searchParams.delete(key);
		const params = serializeViewport(v);
		for (const [k, v2] of params) url.searchParams.set(k, v2);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`?${url.searchParams.toString()}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}, 500);

	function onMoveEnd(v: Viewport) {
		syncViewport(v);
	}

	function onMapHandle(handle: MapHandle) {
		mapHandle = handle;
	}

	async function onMapLoad(map: unknown) {
		rawMap = map;
		a11yMap = map as typeof a11yMap;
		if (!MarkerCtor) {
			const mod = (await import('maplibre-gl')) as unknown as {
				Marker?: typeof MarkerCtor;
				default?: { Marker?: typeof MarkerCtor };
			};
			MarkerCtor = (mod.Marker ?? mod.default?.Marker) as typeof MarkerCtor;
		}
	}

	onMount(() => {
		if (data.activeLayers?.length) {
			ui.activeLayerSlugs = [...data.activeLayers];
		}
		// Story 2.12 Quick-Links: wenn `?address=lng,lat&q=…` gesetzt, bauen
		// wir eine synthetische GeocodeSuggestion und triggern die Adress-
		// Selection. Inspector öffnet sich dann automatisch.
		if (typeof data.address?.lng === 'number' && typeof data.address?.lat === 'number') {
			const displayName = data.address.q ?? `${data.address.lat.toFixed(5)}, ${data.address.lng.toFixed(5)}`;
			selection.set({
				id: `url-${data.address.lng.toFixed(5)}-${data.address.lat.toFixed(5)}`,
				displayName,
				lng: data.address.lng,
				lat: data.address.lat,
				type: 'point',
				addresstype: 'point'
			});
		}
		void (async () => {
			try {
				const manifest = await loadManifest();
				manifestLayers = manifest.layers;
			} catch {
				manifestLayers = [];
			}
		})();
	});

	const syncLayers = debounce((slugs: string[]) => {
		const url = new URL(window.location.href);
		url.searchParams.delete(LAYERS_KEY);
		// Story 1.14 AC-5: Aktivierungs-Reihenfolge persistieren, kein Bundle-Re-Sort.
		const csv = serializeLayers(slugs);
		if (csv) url.searchParams.set(LAYERS_KEY, csv);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`?${url.searchParams.toString()}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}, 200);

	let layersSyncBootstrapped = false;
	$effect(() => {
		const slugs = ui.activeLayerSlugs;
		if (!layersSyncBootstrapped) {
			layersSyncBootstrapped = true;
			return;
		}
		syncLayers([...slugs]);
	});

	type GeoJsonSource = { type: 'geojson'; data: unknown };
	type VectorSource = { type: 'vector'; url: string };
	type MapWithLayers = {
		addSource: (id: string, source: GeoJsonSource | VectorSource) => void;
		removeSource: (id: string) => void;
		addLayer: (spec: MapLibreLayerSpec & { 'source-layer'?: string }) => void;
		removeLayer: (id: string) => void;
		getLayer: (id: string) => unknown;
		getSource: (id: string) => unknown;
	};

	let renderedSlugs: string[] = [];
	let renderedVariantBySlug: Record<string, string> = {};
	const layerRenderInflight = new SvelteSet<string>();
	let pmtilesProtocolRegistered = false;

	async function ensurePmtilesProtocol(): Promise<void> {
		if (pmtilesProtocolRegistered) return;
		const [{ Protocol }, maplibreModule] = await Promise.all([
			import('pmtiles'),
			import('maplibre-gl')
		]);
		const maplibre = (maplibreModule.default ?? maplibreModule) as {
			addProtocol?: (name: string, fn: unknown) => void;
		};
		const protocol = new Protocol();
		maplibre.addProtocol?.('pmtiles', protocol.tile);
		pmtilesProtocolRegistered = true;
	}

	function specsForSlug(
		slug: string,
		sourceId: string,
		variant: string,
		reduced: boolean
	): MapLibreLayerSpec[] {
		if (isPolygonSlug(slug) && (variant === 'fill' || variant === 'outline' || variant === 'outline-dash')) {
			return buildLayerSpecCascade(slug, sourceId, variant, { reducedMotion: reduced });
		}
		return buildLayerSpec(slug, sourceId, { reducedMotion: reduced });
	}

	async function renderLayers(activeSlugs: readonly string[]): Promise<void> {
		if (!rawMap) return;
		const map = rawMap as MapWithLayers;
		// Story 1.14: Eye-Toggle blendet aktive Layer aus, ohne sie aus activeLayerSlugs zu entfernen.
		const visible = applyHiddenSlugs(activeSlugs, ui.hiddenLayerSlugs);
		// Story 1.14 AC-5: Bundle-Order A→F (innerhalb Bundle = Aktivierungs-Reihenfolge).
		const ordered = sortSlugsByBundleStable(visible, manifestLayers);
		const cascade = computeCascadeVariants(ordered);

		const variantBySlug: Record<string, string> = {};
		for (const slug of ordered) {
			variantBySlug[slug] = isPolygonSlug(slug) ? cascade.get(slug) ?? 'fill' : 'non-polygon';
		}

		const visibleSet = new Set(ordered);
		const { toRemove } = diffLayerSlugs(renderedSlugs, ordered);

		// 1. remove sources for slugs no longer visible
		for (const slug of toRemove) {
			const layerId = layerIdFor(slug);
			const sourceId = sourceIdFor(slug);
			if (map.getLayer(layerId)) map.removeLayer(layerId);
			if (map.getSource(sourceId)) map.removeSource(sourceId);
		}

		// 2. for slugs whose variant changed but still visible: remove layer (keep source)
		for (const slug of renderedSlugs) {
			if (!visibleSet.has(slug)) continue;
			if (renderedVariantBySlug[slug] === variantBySlug[slug]) continue;
			const layerId = layerIdFor(slug);
			if (map.getLayer(layerId)) map.removeLayer(layerId);
		}

		const reduced = prefersReducedMotion();
		// 3. Re-add layers in Bundle-Order so MapLibre z-stack respects A unten / F oben.
		for (const slug of ordered) {
			if (layerRenderInflight.has(slug)) continue;
			const meta = getLayerEntry(slug);
			if (!meta) continue;
			const sourceId = sourceIdFor(slug);
			const variant = variantBySlug[slug] ?? 'fill';
			const layerId = layerIdFor(slug);

			// Source ensure (async fetch only on first add).
			if (!map.getSource(sourceId)) {
				layerRenderInflight.add(slug);
				try {
					if (meta.format === 'pmtiles') {
						await ensurePmtilesProtocol();
						if (!rawMap) return;
						map.addSource(sourceId, {
							type: 'vector',
							url: `pmtiles:///layers/${meta.filename}`
						});
					} else {
						const fc = await fetchLayer(meta.filename);
						if (!rawMap) return;
						map.addSource(sourceId, { type: 'geojson', data: fc });
					}
				} catch {
					layerRenderInflight.delete(slug);
					continue;
				}
				layerRenderInflight.delete(slug);
			}

			// Layer ensure: re-add wenn nicht da ODER variant changed (variant change removed layer above).
			if (!map.getLayer(layerId)) {
				const specs = specsForSlug(slug, sourceId, variant, reduced);
				for (const spec of specs) {
					if (!map.getLayer(spec.id)) {
						const merged = meta.format === 'pmtiles' ? { ...spec, 'source-layer': slug } : spec;
						map.addLayer(merged);
					}
				}
			}
		}

		renderedSlugs = [...ordered];
		renderedVariantBySlug = variantBySlug;
	}

	$effect(() => {
		// reactive deps: activeLayerSlugs, hiddenLayerSlugs, manifestLayers
		const slugs = ui.activeLayerSlugs;
		const _hidden = ui.hiddenLayerSlugs;
		void _hidden;
		if (!rawMap || manifestLayers.length === 0) return;
		void renderLayers(slugs);
	});

	const cascadeForLegend = $derived(
		computeCascadeVariants(
			sortSlugsByBundleStable(
				applyHiddenSlugs(ui.activeLayerSlugs, ui.hiddenLayerSlugs),
				manifestLayers
			)
		)
	);
	const legendLimitWarning = $derived(exceedsPolygonLimit(ui.activeLayerSlugs));

	function onLegendToggleHidden(slug: string): void {
		toggleLayerHidden(ui, slug);
	}
	function onLegendRemove(slug: string): void {
		removeUiLayer(ui, slug);
	}

	function clearMarker() {
		currentMarker?.remove();
		currentMarker = null;
		selectedFeatureId = null;
		announceGlobal('Auswahl entfernt');
		ui.inspectorOpen = false;
		ui.selectedAddress = null;
		ui.selectedLayerHits = [];
		ui.nearestStation = null;
		ui.climateSeries = null;
		const url = new URL(window.location.href);
		for (const key of ADDRESS_KEYS) url.searchParams.delete(key);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`?${url.searchParams.toString()}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	async function placeMarker(lngLat: [number, number], displayName?: string) {
		if (!rawMap || !MarkerCtor) return;
		currentMarker?.remove();
		const el = createPlexMarker();
		currentMarker = new MarkerCtor({ element: el, anchor: 'center' })
			.setLngLat(lngLat)
			.addTo(rawMap);

		const url = new URL(window.location.href);
		for (const key of ADDRESS_KEYS) url.searchParams.delete(key);
		url.searchParams.set('address', `${lngLat[0].toFixed(5)},${lngLat[1].toFixed(5)}`);
		if (displayName) url.searchParams.set('q', displayName);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`?${url.searchParams.toString()}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function pmtilesQuery(slug: string, lng: number, lat: number): Record<string, unknown> | null {
		if (!rawMap) return null;
		return queryPmtilesAt(rawMap as unknown as MapLibreLike, layerIdFor(slug), lng, lat);
	}

	let outsideBerlinHintVisible = $state(false);
	let outsideBerlinHintTimer: ReturnType<typeof setTimeout> | null = null;

	function showOutsideBerlinHint(): void {
		outsideBerlinHintVisible = true;
		if (outsideBerlinHintTimer) clearTimeout(outsideBerlinHintTimer);
		outsideBerlinHintTimer = setTimeout(() => {
			outsideBerlinHintVisible = false;
			outsideBerlinHintTimer = null;
		}, 4000);
	}

	async function openInspectorFor(suggestion: GeocodeSuggestion): Promise<boolean> {
		let hits: Awaited<ReturnType<typeof getLayersAtPoint>>;
		try {
			hits = await getLayersAtPoint(
				suggestion.lat,
				suggestion.lng,
				undefined,
				pmtilesQuery
			);
		} catch {
			hits = [];
		}
		if (!hasBerlinBezirkHit(hits)) {
			showOutsideBerlinHint();
			announceGlobal('Bitte wähle eine Adresse innerhalb Berlins');
			return false;
		}
		ui.selectedAddress = suggestion;
		ui.selectedLayerHits = hits;
		const station = getNearestClimateStation(suggestion.lat, suggestion.lng);
		ui.nearestStation = station;
		ui.climateSeries = null;
		void (async () => {
			try {
				const data = await getClimateSeries(station.id);
				if (ui.nearestStation?.id === station.id) {
					ui.climateSeries = data;
				}
			} catch {
				ui.climateSeries = null;
			}
		})();
		ui.inspectorOpen = true;
		ui.kiezScore = null;
		announceGlobal(`Inspektor geöffnet für ${suggestion.displayName}`);
		if (!ui.oepnvStopIndex) {
			void getOepnvStopIndex()
				.then((idx) => {
					ui.oepnvStopIndex = idx;
				})
				.catch(() => {
					ui.oepnvStopIndex = null;
				});
		}
		void (async () => {
			try {
				const stopIndex = ui.oepnvStopIndex ?? (await getOepnvStopIndex());
				const stops = findAllNearestStops(
					{ lat: suggestion.lat, lng: suggestion.lng },
					stopIndex,
					1000
				);
				const override = {
					nearestStops: {
						ubahn: stops.ubahn ? { distanceM: stops.ubahn.distanceM } : null,
						sbahn: stops.sbahn ? { distanceM: stops.sbahn.distanceM } : null,
						tram: stops.tram ? { distanceM: stops.tram.distanceM } : null,
						bus: stops.bus ? { distanceM: stops.bus.distanceM } : null
					}
				};
				const score = await getKiezScore(suggestion.lat, suggestion.lng, undefined, override);
				if (ui.selectedAddress?.id === suggestion.id) {
					ui.kiezScore = score;
				}
			} catch {
				if (ui.selectedAddress?.id === suggestion.id) ui.kiezScore = null;
			}
		})();
		return true;
	}

	function detectPinSlugAtPoint(lngLat: [number, number]): string | null {
		if (!rawMap) return null;
		const m = rawMap as {
			project?: (ll: [number, number]) => { x: number; y: number };
			queryRenderedFeatures?: (
				point: { x: number; y: number },
				opts: { layers: string[] }
			) => Array<{ layer: { id: string } }>;
			getLayer?: (id: string) => unknown;
		};
		if (!m.project || !m.queryRenderedFeatures || !m.getLayer) return null;
		const pinIds = [...PIN_LAYER_SLUGS]
			.map((s) => layerIdFor(s))
			.filter((id) => Boolean(m.getLayer!(id)));
		if (pinIds.length === 0) return null;
		const pt = m.project(lngLat);
		const hits = m.queryRenderedFeatures(pt, { layers: pinIds });
		const top = hits[0];
		if (!top) return null;
		const prefix = 'navigator-layer-';
		return top.layer.id.startsWith(prefix) ? top.layer.id.slice(prefix.length) : null;
	}

	async function onClick(lngLat: [number, number]) {
		if (ui.compareMode && ui.selectedAddress) {
			if (!isInBerlin(lngLat[1], lngLat[0])) {
				showOutsideBerlinHint();
				announceGlobal('Bitte wähle eine Adresse innerhalb Berlins');
				return;
			}
			pendingReplaceLngLat = lngLat;
			return;
		}
		if (currentMarker) {
			const m = currentMarker.getLngLat();
			const dx = m.lng - lngLat[0];
			const dy = m.lat - lngLat[1];
			if (dx * dx + dy * dy < 1e-7) {
				clearMarker();
				return;
			}
		}
		// Brandenburg-Click-Guard (Phase 1: BBOX-Filter, cheap early-exit).
		// Phase-2-Filter (bezirke-Polygon) sitzt in openInspectorFor.
		if (!isInBerlin(lngLat[1], lngLat[0])) {
			showOutsideBerlinHint();
			announceGlobal('Bitte wähle eine Adresse innerhalb Berlins');
			return;
		}
		// Story 1.15 AC-3: Click auf Pin-Layer setzt scroll-target fuer Inspector.
		const pinSlug = detectPinSlugAtPoint(lngLat);
		if (pinSlug) ui.scrollToLayerSlug = pinSlug;
		try {
			const suggestion = await reverseGeocodeAddress({ lat: lngLat[1], lng: lngLat[0] }).run();
			if (suggestion) {
				await placeMarker([suggestion.lng, suggestion.lat], suggestion.displayName);
				const bezirkPart = suggestion.bezirk ? `, Bezirk ${suggestion.bezirk}` : '';
				announceGlobal(`Adresse ausgewählt: ${suggestion.displayName}${bezirkPart}`);
				const opened = await openInspectorFor(suggestion);
				if (!opened) clearMarker();
				return;
			}
		} catch {
			announceGlobal('Adresse konnte nicht aufgelöst werden, Punkt-Auswahl');
		}
		await placeMarker(lngLat);
		const synthetic: GeocodeSuggestion = {
			id: `point-${lngLat[0].toFixed(5)}-${lngLat[1].toFixed(5)}`,
			displayName: `Punkt ${lngLat[1].toFixed(4)}, ${lngLat[0].toFixed(4)}`,
			lat: lngLat[1],
			lng: lngLat[0],
			type: 'point',
			addresstype: 'point'
		};
		announceGlobal(`Punkt ausgewählt: ${lngLat[1].toFixed(4)}, ${lngLat[0].toFixed(4)}`);
		const opened = await openInspectorFor(synthetic);
		if (!opened) clearMarker();
	}

	async function onSelectAccessibleFeature(feature: {
		id: string;
		centroid: [number, number];
		description: string;
		layerName: string;
		geometryType: 'Point' | 'Polygon' | 'MultiPolygon';
	}) {
		selectedFeatureId = feature.id;
		if (rawMap)
			flyToSuggestion({ lng: feature.centroid[0], lat: feature.centroid[1], addresstype: 'street' });
		announceGlobal(`${feature.layerName}: ${feature.description}`);
		if (feature.geometryType === 'Point') {
			await placeMarker(feature.centroid);
		}
	}

	function onClearSelection() {
		if (currentMarker) clearMarker();
	}

	function onPan(direction: 'north' | 'east' | 'south' | 'west') {
		if (!mapHandle) return;
		const w = mapHandle.getCanvasWidth();
		const h = mapHandle.getCanvasHeight();
		const dx = direction === 'east' ? w * 0.2 : direction === 'west' ? -w * 0.2 : 0;
		const dy = direction === 'south' ? h * 0.2 : direction === 'north' ? -h * 0.2 : 0;
		mapHandle.panBy([dx, dy]);
	}

	function onZoom(delta: 1 | -1) {
		if (!mapHandle) return;
		if (delta === 1) mapHandle.zoomIn();
		else mapHandle.zoomOut();
	}

	function prefersReducedMotion(): boolean {
		return typeof window !== 'undefined' && window.matchMedia
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;
	}

	type MapWithFly = {
		flyTo: (opt: { center: [number, number]; zoom: number; essential?: boolean }) => void;
		jumpTo: (opt: { center: [number, number]; zoom: number }) => void;
	};

	function flyToSuggestion(s: { lng: number; lat: number; addresstype: string }) {
		if (!rawMap) return;
		const zoom = matchZoomForType(s.addresstype);
		const reduced = prefersReducedMotion();
		const map = rawMap as MapWithFly;
		if (reduced) {
			map.jumpTo({ center: [s.lng, s.lat], zoom });
		} else {
			map.flyTo({ center: [s.lng, s.lat], zoom, essential: true });
		}
	}

	$effect(() => {
		const s = selection.current;
		if (!s) return;
		if (!rawMap || !MarkerCtor) return;
		flyToSuggestion(s);
		void placeMarker([s.lng, s.lat], s.displayName);
		const bezirkPart = s.bezirk ? `, Bezirk ${s.bezirk}` : '';
		announceGlobal(`Karte gezoomt auf ${s.displayName}${bezirkPart}`);
		void openInspectorFor(s);
	});

	function setSnap(vh: SheetSnapVh) {
		ui.sheetSnapVh = vh;
	}

	function closeInspector() {
		ui.inspectorOpen = false;
	}

	let pendingReplaceLngLat = $state<[number, number] | null>(null);

	async function geocodeForCompare(q: string): Promise<GeocodeSuggestion[]> {
		try {
			return await geocodeAddress({ q }).run();
		} catch {
			return [];
		}
	}

	$effect(() => {
		const addr = ui.comparisonAddress;
		if (!addr) return;
		ui.comparisonLoading = true;
		void (async () => {
			try {
				const hits = await getLayersAtPoint(addr.lat, addr.lng, undefined, pmtilesQuery);
				if (ui.comparisonAddress?.id === addr.id) {
					ui.comparisonLayerHits = hits;
				}
			} catch {
				ui.comparisonLayerHits = [];
			}
			try {
				const station = getNearestClimateStation(addr.lat, addr.lng);
				if (ui.comparisonAddress?.id === addr.id) {
					ui.comparisonClimateStation = station;
				}
				const series = await getClimateSeries(station.id);
				if (ui.comparisonAddress?.id === addr.id) {
					ui.comparisonClimateSeries = series;
				}
			} catch {
				ui.comparisonClimateStation = null;
				ui.comparisonClimateSeries = null;
			}
			try {
				const stopIndex = ui.oepnvStopIndex ?? (await getOepnvStopIndex());
				const stops = findAllNearestStops({ lat: addr.lat, lng: addr.lng }, stopIndex, 1000);
				const override = {
					nearestStops: {
						ubahn: stops.ubahn ? { distanceM: stops.ubahn.distanceM } : null,
						sbahn: stops.sbahn ? { distanceM: stops.sbahn.distanceM } : null,
						tram: stops.tram ? { distanceM: stops.tram.distanceM } : null,
						bus: stops.bus ? { distanceM: stops.bus.distanceM } : null
					}
				};
				const score = await getKiezScore(addr.lat, addr.lng, undefined, override);
				if (ui.comparisonAddress?.id === addr.id) {
					ui.comparisonKiezScore = score;
				}
			} catch {
				if (ui.comparisonAddress?.id === addr.id) ui.comparisonKiezScore = null;
			}
			if (ui.comparisonAddress?.id === addr.id) {
				ui.comparisonLoading = false;
			}
		})();
	});

	const COMPARE_SOURCE_ID = 'compare-markers';
	const COMPARE_LAYER_ID = 'compare-markers-symbol';

	function buildCompareMarkerFc(
		a: GeocodeSuggestion,
		b: GeocodeSuggestion
	): GeoJSON.FeatureCollection {
		return {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
					properties: { label: 'A', name: a.displayName }
				},
				{
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [b.lng, b.lat] },
					properties: { label: 'B', name: b.displayName }
				}
			]
		};
	}

	function removeCompareMarkers(): void {
		if (!rawMap) return;
		const map = rawMap as MapWithLayers;
		if (map.getLayer(COMPARE_LAYER_ID)) map.removeLayer(COMPARE_LAYER_ID);
		if (map.getSource(COMPARE_SOURCE_ID)) map.removeSource(COMPARE_SOURCE_ID);
	}

	$effect(() => {
		const a = ui.selectedAddress;
		const b = ui.comparisonAddress;
		const active = ui.compareMode;
		if (!rawMap) return;
		if (!active || !a || !b) {
			removeCompareMarkers();
			return;
		}
		const map = rawMap as MapWithLayers & {
			fitBounds?: (
				bounds: [[number, number], [number, number]],
				opts: { padding: number; essential?: boolean }
			) => void;
		};
		const fc = buildCompareMarkerFc(a, b);
		const existing = map.getSource(COMPARE_SOURCE_ID) as
			| { setData?: (data: unknown) => void }
			| undefined;
		if (existing?.setData) {
			existing.setData(fc);
		} else {
			if (map.getLayer(COMPARE_LAYER_ID)) map.removeLayer(COMPARE_LAYER_ID);
			if (map.getSource(COMPARE_SOURCE_ID)) map.removeSource(COMPARE_SOURCE_ID);
			map.addSource(COMPARE_SOURCE_ID, { type: 'geojson', data: fc });
			map.addLayer({
				id: COMPARE_LAYER_ID,
				type: 'symbol',
				source: COMPARE_SOURCE_ID,
				layout: {
					'text-field': ['get', 'label'],
					'text-font': ['Noto Sans Bold'],
					'text-size': 16,
					'text-allow-overlap': true
				},
				paint: {
					'text-color': '#ffffff',
					'text-halo-color': '#0044ff',
					'text-halo-width': 4
				}
			} as MapLibreLayerSpec);
		}
		if (map.fitBounds) {
			const minLng = Math.min(a.lng, b.lng);
			const maxLng = Math.max(a.lng, b.lng);
			const minLat = Math.min(a.lat, b.lat);
			const maxLat = Math.max(a.lat, b.lat);
			map.fitBounds(
				[
					[minLng, minLat],
					[maxLng, maxLat]
				],
				{ padding: 100, essential: true }
			);
		}
	});

	async function applyReplace(target: 'a' | 'b'): Promise<void> {
		const lngLat = pendingReplaceLngLat;
		pendingReplaceLngLat = null;
		if (!lngLat) return;
		try {
			const suggestion = await reverseGeocodeAddress({ lat: lngLat[1], lng: lngLat[0] }).run();
			if (!suggestion) return;
			if (target === 'a') {
				selection.set(suggestion);
				await placeMarker([suggestion.lng, suggestion.lat], suggestion.displayName);
				await openInspectorFor(suggestion);
			} else {
				setComparisonAddress(ui, suggestion);
			}
		} catch {
			// Reverse-Geocode hat keinen Treffer; Replace abbrechen.
		}
	}

	function openBookmarkPickerForCompare(): void {
		ui.bookmarksDialogOpen = true;
	}

	let locating = $state(false);

	async function onLocate(): Promise<void> {
		if (typeof navigator === 'undefined' || !navigator.geolocation) {
			announceGlobal('Standort-Bestimmung wird vom Browser nicht unterstützt');
			return;
		}
		locating = true;
		trackEvent('Locate');
		try {
			const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10_000,
					maximumAge: 30_000
				});
			});
			const { latitude: lat, longitude: lng } = pos.coords;
			const suggestion = await reverseGeocodeAddress({ lat, lng }).run();
			if (suggestion) {
				selection.set(suggestion);
				return;
			}
			// Fallback wenn Reverse-Geocode leer (z.B. außerhalb Berlin)
			selection.set({
				id: `geo:${lat.toFixed(6)},${lng.toFixed(6)}`,
				displayName: `Mein Standort (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
				lat,
				lng,
				type: 'geolocation',
				addresstype: 'street'
			});
		} catch (err) {
			const msg =
				err instanceof GeolocationPositionError && err.code === err.PERMISSION_DENIED
					? 'Standort-Berechtigung verweigert'
					: 'Standort konnte nicht ermittelt werden';
			announceGlobal(msg);
		} finally {
			locating = false;
		}
	}

	const showSidePanel = $derived(
		viewport.breakpoint !== 'mobile' &&
			((ui.inspectorOpen && ui.selectedAddress !== null) || ui.compareMode)
	);
	const showBottomSheet = $derived(
		viewport.breakpoint === 'mobile' &&
			((ui.inspectorOpen && ui.selectedAddress !== null) || ui.compareMode)
	);

	const ogInput = $derived.by<OgImageInput | null>(() => {
		const addr = ui.selectedAddress;
		if (!addr) return null;
		const topLayers: string[] = [];
		for (const hit of ui.selectedLayerHits) {
			if (topLayers.length >= 3) break;
			const formatted = formatLayerValue(hit.layer, hit.value);
			if (formatted.text === 'Daten nicht vorhanden') continue;
			topLayers.push(`${getLayerDisplayName(hit.layer)}: ${formatted.text}`);
		}
		return {
			address: addr.displayName,
			lat: addr.lat,
			lng: addr.lng,
			bezirk: addr.bezirk,
			topLayers
		};
	});

	const ogTitle = $derived(
		ogInput
			? `${ogInput.address} - Berlin in Daten - navigator.berlin`
			: 'Atlas - Berlin in Daten - navigator.berlin'
	);
	const ogDescription = $derived(
		ogInput
			? buildOgDescription(ogInput)
			: 'Adress-Daten zu Wohn-, Umwelt-, Klima- und Mobilitäts-Layern für Berlin.'
	);
	const ogImageUrl = $derived(buildOgImageUrl(ogInput, page.url.origin));
</script>

<SeoHead
	title={ogTitle}
	description={ogDescription}
	pathname={page.url.pathname}
	origin={page.url.origin}
	ogImage={ogImageUrl}
/>

<section
	class={[
		'flex h-[calc(100dvh-72px)] flex-col',
		showSidePanel &&
			'lg:grid lg:h-[calc(100dvh-72px)] lg:grid-cols-[1fr_var(--inspector-width)] lg:grid-rows-1'
	]
		.filter(Boolean)
		.join(' ')}
	style={ui.compareMode
		? '--inspector-width: clamp(480px, 38vw, 600px);'
		: '--inspector-width: clamp(360px, 28vw, 420px);'}
	data-testid="atlas-shell"
>
	<div class="relative min-h-0 w-full flex-1 lg:h-full lg:flex-none">
		<MapLibreCanvas
			initialBbox={data.initialBbox}
			initialCenter={data.initialCenter}
			initialZoom={data.initialZoom}
			{onMoveEnd}
			{onClick}
			{onMapHandle}
			{onClearSelection}
			onLoad={onMapLoad}
		/>
		<MapControls {onPan} {onZoom} {onLocate} {locating} />
		<MapAttribution />
		<MapAccessibilityLayer
			map={a11yMap}
			layers={manifestLayers}
			{selectedFeatureId}
			onSelectFeature={onSelectAccessibleFeature}
			compareA={ui.compareMode && ui.selectedAddress
				? { displayName: ui.selectedAddress.displayName }
				: null}
			compareB={ui.compareMode && ui.comparisonAddress
				? { displayName: ui.comparisonAddress.displayName }
				: null}
			onSelectCompareSide={(side) => {
				const targetEl = document.querySelector(
					side === 'a' ? '[data-testid="compare-address-a"]' : '[data-testid="compare-address-b"]'
				) as HTMLElement | null;
				targetEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}}
		/>
		<MapLegend
			activeLayerSlugs={ui.activeLayerSlugs}
			manifestLayers={manifestLayers}
			hiddenSlugs={ui.hiddenLayerSlugs}
			cascadeVariants={cascadeForLegend}
			showLimitWarning={legendLimitWarning}
			onToggleHidden={onLegendToggleHidden}
			onRemove={onLegendRemove}
		/>
		<MapHoverTooltip
			map={rawMap as MapHoverApi | null}
			activeLayerSlugs={ui.activeLayerSlugs}
			isMobile={viewport.breakpoint === 'mobile'}
		/>
		{#if outsideBerlinHintVisible}
			<div
				class="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-sm border border-severity-warning/40 bg-severity-warning-bg px-3 py-2 font-sans text-sm text-severity-warning shadow-sm"
				role="status"
				aria-live="polite"
				data-testid="outside-berlin-hint"
			>
				Bitte wähle eine Adresse innerhalb Berlins
			</div>
		{/if}
	</div>

	{#if showSidePanel}
		<aside
			class="border-t border-rule bg-bg-elevated lg:border-l lg:border-t-0"
			aria-label={ui.compareMode ? 'Adress-Vergleich' : 'Adress-Inspector-Bereich'}
			data-testid="inspector-slot"
		>
			{#if ui.compareMode}
				<ComparePanel
					layerMeta={manifestLayers}
					geocode={geocodeForCompare}
					onOpenBookmarkPicker={openBookmarkPickerForCompare}
				/>
			{:else}
				<InspectorPanel layerMeta={manifestLayers} />
			{/if}
		</aside>
	{/if}
	{#if showBottomSheet}
		<BottomSheet
			open
			snapVh={ui.sheetSnapVh}
			onSnap={setSnap}
			onClose={ui.compareMode ? () => exitCompareMode(ui) : closeInspector}
			ariaLabel={ui.compareMode ? 'Adress-Vergleich' : 'Adress-Inspektor'}
		>
			{#if ui.compareMode}
				<ComparePanel
					layerMeta={manifestLayers}
					geocode={geocodeForCompare}
					onOpenBookmarkPicker={openBookmarkPickerForCompare}
				/>
			{:else}
				<InspectorPanel layerMeta={manifestLayers} variant="sheet" />
			{/if}
		</BottomSheet>
	{/if}
	{#if pendingReplaceLngLat}
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="compare-replace-title"
			data-testid="compare-replace-dialog"
			class="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4"
		>
			<div class="w-full max-w-sm border border-rule bg-bg-elevated p-5 shadow-md">
				<h3 id="compare-replace-title" class="font-serif text-lg text-ink">
					Welche Adresse ersetzen?
				</h3>
				<p class="mt-2 font-sans text-sm text-ink-muted">
					Du bist im Vergleichs-Modus. Klick auf die Karte hat eine neue Adresse erfasst.
				</p>
				<div class="mt-4 flex flex-wrap gap-2">
					<button
						type="button"
						data-testid="compare-replace-a"
						onclick={() => void applyReplace('a')}
						class="border-b border-rule-strong px-3 py-2 text-sm hover:bg-bg"
					>
						Adresse A ersetzen
					</button>
					<button
						type="button"
						data-testid="compare-replace-b"
						onclick={() => void applyReplace('b')}
						class="border-b border-rule-strong px-3 py-2 text-sm hover:bg-bg"
					>
						Adresse B ersetzen
					</button>
					<button
						type="button"
						data-testid="compare-replace-cancel"
						onclick={() => (pendingReplaceLngLat = null)}
						class="px-3 py-2 text-sm text-ink-muted hover:text-ink"
					>
						Abbrechen
					</button>
				</div>
			</div>
		</div>
	{/if}
</section>

<LayerPalette layers={manifestLayers} />
