<script lang="ts">
	import { goto } from '$app/navigation';
	import MapLibreCanvas from '$lib/components/atlas/map-libre-canvas.svelte';
	import MapControls from '$lib/components/atlas/map-controls.svelte';
	import type { MapHandle } from '$lib/components/atlas/internal/map-keyboard.js';
	import { createPlexMarker } from '$lib/components/atlas/internal/map-markers.js';
	import { serializeViewport } from '$lib/utils/url-state.js';
	import { debounce } from '$lib/utils/debounce.js';
	import { matchZoomForType } from '$lib/utils/zoom-mapping.js';
	import { reverseGeocodeAddress } from '$lib/data/geocode.remote.js';
	import { useAddressSelection } from '$lib/state/address-selection.svelte.js';

	type Viewport = { center: [number, number]; zoom: number; bbox: [number, number, number, number] };
	type Props = { data: import('./$types').PageData };

	let { data }: Props = $props();

	const selection = useAddressSelection();

	let mapHandle: MapHandle | null = $state.raw(null);
	let rawMap: unknown = null;
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

	const syncViewport = debounce((viewport: Viewport) => {
		const url = new URL(window.location.href);
		for (const key of VIEWPORT_KEYS) url.searchParams.delete(key);
		const params = serializeViewport(viewport);
		for (const [k, v] of params) url.searchParams.set(k, v);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`?${url.searchParams.toString()}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}, 500);

	function onMoveEnd(viewport: Viewport) {
		syncViewport(viewport);
	}

	function onMapHandle(handle: MapHandle) {
		mapHandle = handle;
	}

	async function onMapLoad(map: unknown) {
		rawMap = map;
		if (!MarkerCtor) {
			const mod = (await import('maplibre-gl')) as unknown as {
				Marker?: typeof MarkerCtor;
				default?: { Marker?: typeof MarkerCtor };
			};
			MarkerCtor = (mod.Marker ?? mod.default?.Marker) as typeof MarkerCtor;
		}
	}

	function clearMarker() {
		currentMarker?.remove();
		currentMarker = null;
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
			const suggestion = await reverseGeocodeAddress({ lat: lngLat[1], lng: lngLat[0] });
			if (suggestion) {
				await placeMarker([suggestion.lng, suggestion.lat], suggestion.displayName);
			} else {
				await placeMarker(lngLat);
			}
		} catch {
			await placeMarker(lngLat);
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
	});
</script>

<section class="flex h-[calc(100vh-120px)] flex-col">
	<div class="relative h-[70vh] w-full">
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
	</div>
	<aside
		class="flex-1 border-t border-rule bg-bg-elevated p-6 text-ink"
		aria-label="Adress-Inspector"
	>
		<p class="text-base text-ink-muted">
			Inspector-Panel kommt in Story 1.9. Adresse via Header-Suche oder Karten-Klick.
		</p>
	</aside>
</section>
