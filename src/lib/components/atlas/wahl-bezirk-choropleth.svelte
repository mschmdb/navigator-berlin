<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { parteiColor } from '$lib/data/partei-farben.js';
	import { normalizeSlug } from '$lib/data/internal/slug.js';

	export type BezirkSummary = {
		readonly slug: string;
		readonly name: string;
		readonly top3: ReadonlyArray<{
			readonly kurzname: string;
			readonly stimmen: number;
			readonly anteil: number;
		}>;
	};

	type Props = {
		bezirke: ReadonlyArray<BezirkSummary>;
		title?: string;
	};

	let { bezirke, title = '' }: Props = $props();

	let container: HTMLDivElement | null = $state(null);
	let mapInstance: unknown = null;

	const byBezirkSlug = $derived.by(() => {
		const map = new Map<string, BezirkSummary>();
		for (const b of bezirke) map.set(b.slug, b);
		return map;
	});

	function formatPct(n: number): string {
		return `${(n * 100).toFixed(1).replace('.', ',')} %`;
	}

	onMount(() => {
		void (async () => {
			if (!container) return;
			const { Map, Popup } = await import('maplibre-gl');
			await import('maplibre-gl/dist/maplibre-gl.css');
			const manifestRes = await fetch('/layers/MANIFEST.json');
			if (!manifestRes.ok) return;
			type ManifestShape = { layers: Array<{ slug: string; filename: string }> };
			const manifest = (await manifestRes.json()) as ManifestShape;
			const bezirkeLayer = manifest.layers.find((l) => l.slug === 'bezirke');
			if (!bezirkeLayer) return;
			const fcRes = await fetch(`/layers/${bezirkeLayer.filename}`);
			if (!fcRes.ok) return;
			type RawFeatureCollection = {
				type: string;
				features: Array<{
					type: string;
					geometry: unknown;
					properties: Record<string, unknown> | null;
				}>;
			};
			const fc = (await fcRes.json()) as RawFeatureCollection;

			for (const feature of fc.features) {
				const props = (feature.properties ?? {}) as Record<string, unknown>;
				const name = typeof props.Gemeinde_name === 'string' ? props.Gemeinde_name : '';
				const slug = normalizeSlug(name);
				const summary = byBezirkSlug.get(slug);
				const top = summary?.top3[0];
				props.partei = top?.kurzname ?? 'Sonstige';
				props.partei_farbe = top ? parteiColor(top.kurzname) : '#CCCCCC';
				props.anteil = top?.anteil ?? 0;
				props.bezirk_slug = slug;
				props.bezirk_name = name;
			}

			const map = new Map({
				container,
				style: {
					version: 8,
					sources: {
						bezirke: { type: 'geojson', data: fc as unknown as GeoJSON.FeatureCollection }
					},
					layers: [
						{
							id: 'bezirke-fill',
							type: 'fill',
							source: 'bezirke',
							paint: {
								'fill-color': ['get', 'partei_farbe'],
								'fill-opacity': [
									'interpolate',
									['linear'],
									['get', 'anteil'],
									0.15,
									0.35,
									0.45,
									0.85
								]
							}
						},
						{
							id: 'bezirke-outline',
							type: 'line',
							source: 'bezirke',
							paint: {
								'line-color': '#141414',
								'line-width': 1
							}
						}
					]
				},
				center: [13.4, 52.5],
				zoom: 8.5,
				attributionControl: false,
				interactive: true
			});

			mapInstance = map;

			map.on('click', 'bezirke-fill', (e) => {
				const feature = e.features?.[0];
				if (!feature) return;
				const props = feature.properties as Record<string, unknown>;
				const slug = String(props.bezirk_slug ?? '');
				const summary = byBezirkSlug.get(slug);
				if (!summary) return;
				const lines = summary.top3
					.map((t) => `<li><strong>${t.kurzname}</strong> ${formatPct(t.anteil)}</li>`)
					.join('');
				new Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' })
					.setLngLat(e.lngLat)
					.setHTML(
						`<div style="font-family:monospace;font-size:12px;line-height:1.4;">` +
							`<div style="font-weight:600;margin-bottom:4px;">${summary.name}</div>` +
							`<ol style="list-style:decimal;padding-left:1.2em;margin:0;">${lines}</ol>` +
							`</div>`
					)
					.addTo(map);
			});

			map.on('mouseenter', 'bezirke-fill', () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', 'bezirke-fill', () => {
				map.getCanvas().style.cursor = '';
			});
		})();
	});

	onDestroy(() => {
		if (mapInstance && typeof (mapInstance as { remove?: () => void }).remove === 'function') {
			(mapInstance as { remove: () => void }).remove();
		}
	});
</script>

<figure
	class="space-y-2"
	aria-label={title ? `Choropleth-Karte: ${title}` : 'Choropleth-Karte'}
	data-testid="wahl-bezirk-choropleth"
>
	<div
		bind:this={container}
		role="img"
		aria-label="Berliner Bezirke gefärbt nach stärkster Partei"
		class="h-[400px] w-full overflow-hidden rounded border border-rule"
	></div>
	<figcaption class="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
		Farbe = stärkste Partei pro Bezirk · Sättigung skaliert mit Anteil ·
		Klick öffnet Top-3
	</figcaption>
</figure>
