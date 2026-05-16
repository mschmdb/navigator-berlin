<!--
	Story 2.3 T2: Read-Only MapLibre-Embed mit Boundary-Highlight.

	Pattern: ~150-LOC-Wrapper um `maplibre-gl` direkt, kein Inspector, kein
	URL-State, kein Layer-Toggle. Nutzt gleiches `static/map-style.json` wie
	`map-libre-canvas.svelte` (Story 1.6) damit Tiles + Cartography identisch
	aussehen. Heavy-Lift bleibt in der Full-Canvas-Variante.

	Progressive-Enhancement (AC-4): `<noscript>`-Fallback zeigt OG-Image-Pfad
	`/og/bezirk/{slug}.png` (Story 2.6 generiert das Asset). Bei JS off bekommt
	der Crawler ein statisches Bild + Region-Label.
-->
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import turfBbox from '@turf/bbox';
	import type { Feature, MultiPolygon, Polygon } from 'geojson';

	interface Props {
		readonly geometry: Polygon | MultiPolygon;
		readonly label: string;
		readonly ogImagePath?: string;
		readonly styleUrl?: string;
		/** Tailwind height-class. Default 50vh per UX-DR43. */
		readonly heightClass?: string;
	}

	const {
		geometry,
		label,
		ogImagePath,
		styleUrl = '/map-style.json',
		heightClass = 'h-[50vh]'
	}: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let map: { remove: () => void } | null = null;
	let mountFailed = $state(false);

	const FILL_PAINT = {
		'fill-color': '#2A3F7C',
		'fill-opacity': 0.18
	} as const;
	const LINE_PAINT = {
		'line-color': '#2A3F7C',
		'line-width': 2,
		'line-opacity': 0.85
	} as const;

	onMount(() => {
		if (!container) return;
		let cancelled = false;
		(async () => {
			try {
				const maplibre = await import('maplibre-gl');
				await import('maplibre-gl/dist/maplibre-gl.css');
				if (cancelled || !container) return;
				const featureGeom: Feature<Polygon | MultiPolygon> = {
					type: 'Feature',
					geometry,
					properties: {}
				};
				const bbox = turfBbox(featureGeom) as [number, number, number, number];
				const centerLng = (bbox[0] + bbox[2]) / 2;
				const centerLat = (bbox[1] + bbox[3]) / 2;
				const instance = new maplibre.default.Map({
					container,
					style: styleUrl,
					center: [centerLng, centerLat],
					zoom: 11,
					attributionControl: false,
					maxZoom: 17,
					dragRotate: false,
					pitchWithRotate: false
				});
				map = instance as unknown as { remove: () => void };
				instance.on('error', (e: { error?: Error }) => {
					if (e?.error) console.warn('[map-embed]', e.error.message);
				});
				instance.on('load', () => {
					instance.resize();
					instance.fitBounds(
						[
							[bbox[0], bbox[1]],
							[bbox[2], bbox[3]]
						],
						{ padding: 40, animate: false }
					);
					instance.addSource('bezirk-boundary', {
						type: 'geojson',
						data: featureGeom
					});
					instance.addLayer({
						id: 'bezirk-boundary-fill',
						type: 'fill',
						source: 'bezirk-boundary',
						paint: FILL_PAINT
					});
					instance.addLayer({
						id: 'bezirk-boundary-line',
						type: 'line',
						source: 'bezirk-boundary',
						paint: LINE_PAINT
					});
				});
				// Layout-timing fallback: container can be 0x0 at mount in some
				// SvelteKit-prerender + hydration paths. Trigger resize once on
				// next frame so MapLibre rebuilds tile-pyramid for actual size.
				if (typeof requestAnimationFrame !== 'undefined') {
					requestAnimationFrame(() => instance.resize());
				}
			} catch {
				mountFailed = true;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = null;
		}
	});
</script>

<figure
	class="relative w-full overflow-hidden rounded border border-rule {heightClass}"
	aria-label={`Karten-Embed: ${label}`}
	data-testid="map-embed"
>
	<div bind:this={container} class="absolute inset-0" aria-hidden="true"></div>
	{#if mountFailed && ogImagePath}
		<img
			src={ogImagePath}
			alt={`Karten-Ansicht ${label}`}
			class="absolute inset-0 h-full w-full object-cover"
		/>
	{/if}
	<noscript>
		{#if ogImagePath}
			<img
				src={ogImagePath}
				alt={`Karten-Ansicht ${label}`}
				class="absolute inset-0 h-full w-full object-cover"
			/>
		{:else}
			<div class="flex h-full items-center justify-center bg-bg-soft text-ink-muted">
				Karte für {label}
			</div>
		{/if}
	</noscript>
	<figcaption class="sr-only">Karten-Ansicht des Bezirks {label} mit hervorgehobener Grenze.</figcaption>
</figure>
