<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { parteiColor } from '$lib/data/partei-farben.js';

	type WinnerEntry = {
		readonly uwbId: string;
		readonly parteiKurzname: string;
		readonly farbeHex: string;
		readonly anteil: number;
	};

	type Props = {
		geoSlug: string;
		wahlSlug: string;
		winnersByUwb: ReadonlyArray<WinnerEntry>;
		title?: string;
	};

	let { geoSlug, wahlSlug, winnersByUwb, title = '' }: Props = $props();

	let container: HTMLDivElement | null = $state(null);
	let mapInstance: unknown = null;

	const winnerMap = $derived.by(() => {
		const m = new Map<string, WinnerEntry>();
		for (const w of winnersByUwb) m.set(w.uwbId, w);
		return m;
	});

	function formatPct(n: number): string {
		return `${(n * 100).toFixed(1).replace('.', ',')} %`;
	}

	function pickUwb3(props: Record<string, unknown>): string | null {
		if (typeof props.UWB3 === 'string') return props.UWB3;
		if (typeof props.UWB === 'string') {
			const u = props.UWB;
			if (u.length === 5) return u.slice(2);
			return u;
		}
		if (typeof props.WB === 'string') return props.WB;
		return null;
	}

	function dbUwbIdFromGeo(props: Record<string, unknown>): string | null {
		const bez = typeof props.BEZ === 'string' ? props.BEZ.padStart(2, '0') : null;
		const uwb3 = pickUwb3(props);
		if (!bez || !uwb3) return null;

		if (wahlSlug === 'btw21' || wahlSlug === 'btw25') {
			const bwk = typeof props.BWK === 'string' ? props.BWK.padStart(3, '0') : null;
			return bwk ? `${bwk}-${bez}-${uwb3}-0` : null;
		}
		if (wahlSlug === 'btw17') {
			const bwk = typeof props.BWK === 'string' ? props.BWK.padStart(3, '0') : null;
			return bwk ? `${bwk}-${bez}-${bez}W${uwb3}-0` : null;
		}
		if (['agh21', 'agh23', 'bvv21', 'bvv23'].includes(wahlSlug)) {
			return `${bez}W${uwb3}-W`;
		}
		if (['agh16', 'bvv16'].includes(wahlSlug)) {
			return `${bez}W${uwb3}`;
		}
		return null;
	}

	onMount(() => {
		void (async () => {
			if (!container) return;
			const { Map: MapLibreMap, Popup } = await import('maplibre-gl');
			const manifestRes = await fetch('/layers/MANIFEST.json');
			if (!manifestRes.ok) return;
			type ManifestShape = { layers: Array<{ slug: string; filename: string }> };
			const manifest = (await manifestRes.json()) as ManifestShape;

			const geoLayer = manifest.layers.find((l) => l.slug === `wahlbezirke-${geoSlug}`);
			const bezirkeLayer = manifest.layers.find((l) => l.slug === 'bezirke');
			if (!geoLayer || !bezirkeLayer) return;

			const [geoFc, bezirkeFc] = await Promise.all([
				fetch(`/layers/${geoLayer.filename}`).then((r) => r.json()),
				fetch(`/layers/${bezirkeLayer.filename}`).then((r) => r.json())
			]);

			type RawFc = {
				type: string;
				features: Array<{
					type: string;
					geometry: unknown;
					properties: Record<string, unknown> | null;
				}>;
			};
			const fc = geoFc as RawFc;
			let matched = 0;
			for (const feature of fc.features) {
				const props = (feature.properties ?? {}) as Record<string, unknown>;
				const dbUwbId = dbUwbIdFromGeo(props);
				const winner = dbUwbId ? winnerMap.get(dbUwbId) : null;
				if (winner) matched++;
				props.partei = winner?.parteiKurzname ?? null;
				props.partei_farbe = winner ? parteiColor(winner.parteiKurzname) : '#CCCCCC';
				props.anteil = winner?.anteil ?? 0;
				props.db_uwb_id = dbUwbId;
				props.has_winner = winner ? 1 : 0;
			}
			console.debug(`[wahl-stimmbezirk-choropleth] ${matched}/${fc.features.length} matched`);

			const map = new MapLibreMap({
				container,
				style: {
					version: 8,
					sources: {
						wahlbezirke: { type: 'geojson', data: fc as unknown as GeoJSON.FeatureCollection },
						bezirke: { type: 'geojson', data: bezirkeFc as unknown as GeoJSON.FeatureCollection }
					},
					layers: [
						{
							id: 'wahlbezirke-fill',
							type: 'fill',
							source: 'wahlbezirke',
							paint: {
								'fill-color': ['get', 'partei_farbe'],
								'fill-opacity': [
									'case',
									['==', ['get', 'has_winner'], 1],
									[
										'interpolate',
										['linear'],
										['get', 'anteil'],
										0.15,
										0.4,
										0.45,
										0.9
									],
									0.1
								],
								'fill-outline-color': 'rgba(20,20,20,0.18)'
							}
						},
						{
							id: 'bezirke-outline',
							type: 'line',
							source: 'bezirke',
							paint: {
								'line-color': '#141414',
								'line-width': 1.4
							}
						}
					]
				},
				center: [13.4, 52.5],
				zoom: 9,
				attributionControl: false,
				interactive: true
			});

			mapInstance = map;

			map.on('click', 'wahlbezirke-fill', (e) => {
				const feature = e.features?.[0];
				if (!feature) return;
				const props = feature.properties as Record<string, unknown>;
				const partei = typeof props.partei === 'string' ? props.partei : null;
				const dbUwbId = typeof props.db_uwb_id === 'string' ? props.db_uwb_id : '–';
				const anteilNum = typeof props.anteil === 'number' ? props.anteil : 0;
				const html = partei
					? `<div style="font-family:monospace;font-size:12px;line-height:1.4;">` +
						`<div style="font-weight:600;margin-bottom:4px;">Stimmbezirk ${dbUwbId}</div>` +
						`<div>Stärkste: <strong>${partei}</strong> ${formatPct(anteilNum)}</div>` +
						`</div>`
					: `<div style="font-family:monospace;font-size:12px;">Stimmbezirk ${dbUwbId}<br/>Keine Daten</div>`;
				new Popup({ closeButton: true, closeOnClick: true, maxWidth: '260px' })
					.setLngLat(e.lngLat)
					.setHTML(html)
					.addTo(map);
			});

			map.on('mouseenter', 'wahlbezirke-fill', () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', 'wahlbezirke-fill', () => {
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
	data-testid="wahl-stimmbezirk-choropleth"
>
	<div
		bind:this={container}
		role="img"
		aria-label="Berliner Stimmbezirke gefärbt nach stärkster Partei"
		class="h-[520px] w-full overflow-hidden rounded border border-rule"
	></div>
	<figcaption class="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
		Farbe = stärkste Partei pro Stimmbezirk · Sättigung skaliert mit Anteil · Klick öffnet Detail
	</figcaption>
</figure>
