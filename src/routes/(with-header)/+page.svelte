<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import MapLibreCanvas from '$lib/components/atlas/map-libre-canvas.svelte';
	import MapControls from '$lib/components/atlas/map-controls.svelte';
	import MapAccessibilityLayer from '$lib/components/atlas/map-accessibility-layer.svelte';
	import InspectorPanel from '$lib/components/atlas/inspector-panel.svelte';
	import BottomSheet from '$lib/components/atlas/inspector-panel/bottom-sheet.svelte';
	import type { MapHandle } from '$lib/components/atlas/internal/map-keyboard.js';
	import { createPlexMarker } from '$lib/components/atlas/internal/map-markers.js';
	import { announceGlobal } from '$lib/utils/aria-live.js';
	import { serializeViewport, serializeLayers, sortLayerSlugsByBundle } from '$lib/utils/url-state.js';
	import { debounce } from '$lib/utils/debounce.js';
	import { matchZoomForType } from '$lib/utils/zoom-mapping.js';
	import { reverseGeocodeAddress } from '$lib/data/geocode.remote.js';
	import { useAddressSelection } from '$lib/state/address-selection.svelte.js';
	import { getUiState, type SheetSnapVh } from '$lib/state/ui-context.svelte.js';
	import { loadManifest, getLayerEntry } from '$lib/data/manifest.js';
	import { getLayersAtPoint } from '$lib/data/get-layers-at-point.js';
	import { fetchLayer } from '$lib/data/internal/layer-fetch.js';
	import type { GeocodeSuggestion, LayerMetadata } from '$lib/data/types.js';
	import { useViewport } from '$lib/utils/use-viewport.svelte.js';
	import { SvelteSet } from 'svelte/reactivity';
	import LayerPalette from '$lib/components/atlas/layer-palette.svelte';
	import {
		buildLayerSpec,
		type MapLibreLayerSpec
	} from '$lib/components/atlas/internal/layer-style-builder.js';
	import {
		diffLayerSlugs,
		sourceIdFor,
		layerIdFor
	} from '$lib/components/atlas/internal/layer-diff.js';

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
	let MarkerCtor:
		| (new (options: { element: HTMLElement; anchor?: string }) => {
				setLngLat: (ll: [number, number]) => {
					addTo: (m: unknown) => {
						remove: () => void;
						getLngLat: () => { lng: number; lat: number };
					};
				};
		  })
		| null = null;

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
		const ordered = sortLayerSlugsByBundle(slugs, manifestLayers);
		const csv = serializeLayers(ordered);
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

	type MapWithLayers = {
		addSource: (id: string, source: { type: 'geojson'; data: unknown }) => void;
		removeSource: (id: string) => void;
		addLayer: (spec: MapLibreLayerSpec) => void;
		removeLayer: (id: string) => void;
		getLayer: (id: string) => unknown;
		getSource: (id: string) => unknown;
	};

	let renderedSlugs: string[] = [];
	const layerRenderInflight = new SvelteSet<string>();

	async function renderLayers(slugs: readonly string[]): Promise<void> {
		if (!rawMap) return;
		const map = rawMap as MapWithLayers;
		const { toAdd, toRemove } = diffLayerSlugs(renderedSlugs, slugs);
		for (const slug of toRemove) {
			const layerId = layerIdFor(slug);
			const sourceId = sourceIdFor(slug);
			if (map.getLayer(layerId)) map.removeLayer(layerId);
			if (map.getSource(sourceId)) map.removeSource(sourceId);
		}
		const reduced = prefersReducedMotion();
		await Promise.all(
			toAdd.map(async (slug) => {
				if (layerRenderInflight.has(slug)) return;
				const meta = getLayerEntry(slug);
				if (!meta) return;
				layerRenderInflight.add(slug);
				try {
					const fc = await fetchLayer(meta.filename);
					if (!rawMap) return;
					const sourceId = sourceIdFor(slug);
					if (!map.getSource(sourceId)) {
						map.addSource(sourceId, { type: 'geojson', data: fc });
					}
					for (const spec of buildLayerSpec(slug, sourceId, { reducedMotion: reduced })) {
						if (!map.getLayer(spec.id)) map.addLayer(spec);
					}
				} catch {
					// Layer-Fetch fehlgeschlagen, still aufgeben (Story 1.4 Error-Path)
				} finally {
					layerRenderInflight.delete(slug);
				}
			})
		);
		renderedSlugs = [...slugs];
	}

	$effect(() => {
		const slugs = ui.activeLayerSlugs;
		if (!rawMap || manifestLayers.length === 0) return;
		void renderLayers(slugs);
	});

	function clearMarker() {
		currentMarker?.remove();
		currentMarker = null;
		selectedFeatureId = null;
		announceGlobal('Auswahl entfernt');
		ui.inspectorOpen = false;
		ui.selectedAddress = null;
		ui.selectedLayerHits = [];
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

	async function openInspectorFor(suggestion: GeocodeSuggestion) {
		ui.selectedAddress = suggestion;
		try {
			ui.selectedLayerHits = await getLayersAtPoint(suggestion.lat, suggestion.lng);
		} catch {
			ui.selectedLayerHits = [];
		}
		ui.inspectorOpen = true;
		announceGlobal(`Inspektor geöffnet für ${suggestion.displayName}`);
	}

	async function onClick(lngLat: [number, number]) {
		if (currentMarker) {
			const m = currentMarker.getLngLat();
			const dx = m.lng - lngLat[0];
			const dy = m.lat - lngLat[1];
			if (dx * dx + dy * dy < 1e-7) {
				clearMarker();
				return;
			}
		}
		try {
			const suggestion = await reverseGeocodeAddress({ lat: lngLat[1], lng: lngLat[0] }).run();
			if (suggestion) {
				await placeMarker([suggestion.lng, suggestion.lat], suggestion.displayName);
				const bezirkPart = suggestion.bezirk ? `, Bezirk ${suggestion.bezirk}` : '';
				announceGlobal(`Adresse ausgewählt: ${suggestion.displayName}${bezirkPart}`);
				await openInspectorFor(suggestion);
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
		await openInspectorFor(synthetic);
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

	const showSidePanel = $derived(
		viewport.breakpoint !== 'mobile' && ui.inspectorOpen && ui.selectedAddress !== null
	);
	const showBottomSheet = $derived(
		viewport.breakpoint === 'mobile' && ui.inspectorOpen && ui.selectedAddress !== null
	);
</script>

<section
	class={[
		'flex h-[calc(100vh-120px)] flex-col',
		showSidePanel && 'lg:grid lg:h-[calc(100vh-120px)] lg:grid-cols-[6fr_4fr] lg:grid-rows-1'
	]
		.filter(Boolean)
		.join(' ')}
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
		<MapControls {onPan} {onZoom} />
		<MapAccessibilityLayer
			map={a11yMap}
			layers={manifestLayers}
			{selectedFeatureId}
			onSelectFeature={onSelectAccessibleFeature}
		/>
	</div>

	{#if showSidePanel}
		<aside
			class="border-t border-rule bg-bg-elevated lg:border-l lg:border-t-0"
			aria-label="Adress-Inspector-Bereich"
			data-testid="inspector-slot"
		>
			<InspectorPanel layerMeta={manifestLayers} />
		</aside>
	{/if}
	{#if showBottomSheet}
		<BottomSheet
			open
			snapVh={ui.sheetSnapVh}
			onSnap={setSnap}
			onClose={closeInspector}
			ariaLabel="Adress-Inspektor"
		>
			<InspectorPanel layerMeta={manifestLayers} variant="sheet" />
		</BottomSheet>
	{/if}
</section>

<LayerPalette layers={manifestLayers} />
