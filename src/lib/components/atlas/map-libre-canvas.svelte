<script lang="ts">
	import { onMount } from 'svelte';
	import { BERLIN_BBOX_ARRAY, BERLIN_CENTER, DEFAULT_ZOOM } from '$lib/data/constants.js';

	type Viewport = { center: [number, number]; zoom: number; bbox: [number, number, number, number] };

	type Props = {
		initialBbox?: [number, number, number, number];
		initialZoom?: number;
		styleUrl?: string;
		maxBounds?: [[number, number], [number, number]] | null;
		minZoom?: number;
		maxZoom?: number;
		onMoveEnd?: (v: Viewport) => void;
		onClick?: (lngLat: [number, number]) => void;
		onLoad?: (map: unknown) => void;
	};

	// Berlin-Bbox mit kleinem Padding fuer Pan-Komfort am Rand.
	const BERLIN_MAX_BOUNDS: [[number, number], [number, number]] = [
		[12.9, 52.25],
		[13.9, 52.75]
	];

	let {
		initialBbox = BERLIN_BBOX_ARRAY,
		initialZoom = DEFAULT_ZOOM,
		styleUrl = '/map-style.json',
		maxBounds = BERLIN_MAX_BOUNDS,
		minZoom = 9,
		maxZoom = 19,
		onMoveEnd,
		onClick,
		onLoad
	}: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let isReady = $state(false);
	let loadError = $state<string | null>(null);
	let mapInstance: { remove: () => void } | null = null;

	onMount(() => {
		if (!container) return;
		let cancelled = false;
		const TIMEOUT_MS = 5000;
		const timer = setTimeout(() => {
			if (!isReady && !cancelled) {
				loadError = 'Karte konnte nicht geladen werden. Bitte Seite neu laden.';
			}
		}, TIMEOUT_MS);

		(async () => {
			try {
				const maplibreModule = await import('maplibre-gl');
				await import('maplibre-gl/dist/maplibre-gl.css');
				if (cancelled || !container) return;
				const Map = maplibreModule.default.Map;
				const map = new Map({
					container,
					style: styleUrl,
					bounds: initialBbox,
					center: BERLIN_CENTER,
					zoom: initialZoom,
					minZoom,
					maxZoom,
					maxBounds: maxBounds ?? undefined,
					attributionControl: { compact: true }
				});
				mapInstance = map as unknown as { remove: () => void };
				map.on('load', () => {
					isReady = true;
					onLoad?.(map);
				});
				map.on('moveend', () => {
					const c = map.getCenter();
					const b = map.getBounds();
					onMoveEnd?.({
						center: [c.lng, c.lat],
						zoom: map.getZoom(),
						bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
					});
				});
				map.on('click', (e: { lngLat: { lng: number; lat: number } }) => {
					onClick?.([e.lngLat.lng, e.lngLat.lat]);
				});
			} catch (err) {
				if (!cancelled) {
					loadError = err instanceof Error ? err.message : 'Unbekannter Karten-Fehler';
				}
			}
		})();

		return () => {
			cancelled = true;
			clearTimeout(timer);
			mapInstance?.remove();
		};
	});
</script>

<div class="relative h-full w-full">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		bind:this={container}
		role="application"
		tabindex="0"
		aria-describedby="map-help"
		class="h-full w-full"
	></div>

	{#if !isReady && !loadError}
		<div
			data-testid="map-skeleton"
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 flex items-center justify-center bg-bg-elevated text-ink-muted"
		>
			Karte wird geladen…
		</div>
	{/if}

	{#if loadError}
		<div
			role="alert"
			class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-elevated p-6 text-ink"
		>
			<p>{loadError}</p>
			<button
				type="button"
				class="border border-rule-strong px-4 py-2 text-base hover:bg-bg"
				onclick={() => location.reload()}
			>
				Neu laden
			</button>
		</div>
	{/if}

	<p id="map-help" class="sr-only">
		Karte interaktiv. Pfeiltasten zum Verschieben, Plus und Minus zum Zoomen, Tab fuer POI-Liste.
	</p>
	<div data-testid="map-status" aria-live="polite" class="sr-only"></div>
</div>
