<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { parteiColor } from '$lib/data/partei-farben.js';
	import { gruppeIdFromGeo } from '$lib/data/wahl-geo-mapping.js';
	import { gruppenAnzeigeName } from '$lib/data/wahl-gruppe-label.js';
	import { m } from '$lib/paraglide/messages.js';
	import { formatPercent } from '$lib/i18n/format.js';

	type WinnerEntry = {
		/** Briefwahl-Gruppen-ID, nicht die einzelne Urnen-uwbId. */
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
	let resizeListener: (() => void) | null = null;

	const winnerMap = $derived.by(() => {
		const m = new Map<string, WinnerEntry>();
		for (const w of winnersByUwb) m.set(w.uwbId, w);
		return m;
	});

	onMount(() => {
		void (async () => {
			if (!container) return;
			const { Map: MapLibreMap, Popup, LngLatBounds } = await import('maplibre-gl');
			await import('maplibre-gl/dist/maplibre-gl.css');
			const manifestRes = await fetch('/layers/MANIFEST.json');
			if (!manifestRes.ok) return;
			type ManifestShape = { layers: Array<{ slug: string; filename: string }> };
			const manifest = (await manifestRes.json()) as ManifestShape;

			// Story 17: kleinste Kartenebene ist die dissolvierte Briefwahl-
			// Gruppen-Fläche (`wahlgruppen-${geoSlug}`), nicht mehr die einzelne
			// Urnen-Fläche (`wahlbezirke-${geoSlug}`) -- Never-Boundary "kein
			// Urnen-only-Umschalter".
			const geoLayer = manifest.layers.find((l) => l.slug === `wahlgruppen-${geoSlug}`);
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
				const gruppeId = gruppeIdFromGeo(props, wahlSlug);
				const winner = gruppeId ? winnerMap.get(gruppeId) : null;
				if (winner) matched++;
				props.partei = winner?.parteiKurzname ?? null;
				props.partei_farbe = winner ? parteiColor(winner.parteiKurzname) : '#CCCCCC';
				props.anteil = winner?.anteil ?? 0;
				props.gruppe_id = gruppeId;
				props.gruppe_name = gruppeId
					? gruppenAnzeigeName(
							gruppeId,
							typeof props.MEMBERS === 'string' ? props.MEMBERS : undefined
						)
					: null;
				props.has_winner = winner ? 1 : 0;
			}
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
									['interpolate', ['linear'], ['get', 'anteil'], 0.15, 0.4, 0.45, 0.9],
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

			const bounds = new LngLatBounds();
			for (const f of bezirkeFc.features) {
				const geom = f.geometry;
				if (!geom) continue;
				const coordsList: number[][] =
					geom.type === 'Polygon'
						? geom.coordinates.flat(1)
						: geom.type === 'MultiPolygon'
							? geom.coordinates.flat(2)
							: [];
				for (const c of coordsList) {
					if (Array.isArray(c) && c.length >= 2) {
						bounds.extend([c[0], c[1]]);
					}
				}
			}
			if (!bounds.isEmpty()) {
				map.fitBounds(bounds, { padding: 16, animate: false });
			}
			const handleResize = (): void => {
				map.resize();
				if (!bounds.isEmpty()) {
					map.fitBounds(bounds, { padding: 16, animate: false });
				}
			};
			window.addEventListener('resize', handleResize);
			resizeListener = handleResize;

			map.on('click', 'wahlbezirke-fill', (e) => {
				const feature = e.features?.[0];
				if (!feature) return;
				const props = feature.properties as Record<string, unknown>;
				const partei = typeof props.partei === 'string' ? props.partei : null;
				const gruppenName =
					typeof props.gruppe_name === 'string'
						? props.gruppe_name
						: m.wahl_portal_choropleth_briefwahl_gruppe_fallback();
				const anteilNum = typeof props.anteil === 'number' ? props.anteil : 0;
				const html = partei
					? `<div style="font-family:monospace;font-size:12px;line-height:1.4;">` +
						`<div style="font-weight:600;margin-bottom:4px;">${gruppenName}</div>` +
						`<div>${m.wahl_portal_choropleth_staerkste_zeile({ partei: `<strong>${partei}</strong>`, pct: formatPercent(anteilNum) })}</div>` +
						`</div>`
					: `<div style="font-family:monospace;font-size:12px;">${gruppenName}<br/>${m.wahl_portal_keine_daten_label()}</div>`;
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
		if (resizeListener) {
			window.removeEventListener('resize', resizeListener);
			resizeListener = null;
		}
		if (mapInstance && typeof (mapInstance as { remove?: () => void }).remove === 'function') {
			(mapInstance as { remove: () => void }).remove();
		}
	});
</script>

<figure
	class="space-y-2"
	aria-label={title
		? m.wahl_portal_choropleth_aria_mit_titel({ title })
		: m.wahl_portal_choropleth_aria_ohne_titel()}
	data-testid="wahl-stimmbezirk-choropleth"
>
	<div
		bind:this={container}
		role="img"
		aria-label={m.wahl_portal_stimmbezirk_choropleth_alt()}
		class="h-[360px] w-full overflow-hidden rounded border border-rule sm:h-[480px] md:h-[520px]"
	></div>
	<figcaption class="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
		{m.wahl_portal_stimmbezirk_choropleth_figcaption()}
	</figcaption>
</figure>
