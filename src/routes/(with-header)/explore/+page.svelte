<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import MapLibreCanvas from '$lib/components/atlas/map-libre-canvas.svelte';
	import MapControls from '$lib/components/atlas/map-controls.svelte';
	import MapAttribution from '$lib/components/atlas/map-attribution.svelte';
	import MapAccessibilityLayer from '$lib/components/atlas/map-accessibility-layer.svelte';
	import MapLegend from '$lib/components/atlas/map-legend.svelte';
	import KiezFinderPanel, {
		type FinderMapApi
	} from '$lib/components/atlas/kiez-finder-panel.svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import MapHoverTooltip, {
		type MapHoverApi
	} from '$lib/components/atlas/map-hover-tooltip.svelte';
	import InspectorPanel from '$lib/components/atlas/inspector-panel.svelte';
	import ComparePanel from '$lib/components/atlas/compare-panel/compare-panel.svelte';
	import BottomSheet from '$lib/components/atlas/inspector-panel/bottom-sheet.svelte';
	import type { MapHandle } from '$lib/components/atlas/internal/map-keyboard.js';
	import { createPinMarkerElement } from '$lib/components/atlas/internal/map-markers.js';
	import { COLORS } from '$lib/components/atlas/internal/colors.js';
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
	import { getKuehleOrteIndex } from '$lib/data/get-kuehle-orte-index.js';
	import { getTrinkbrunnenIndex } from '$lib/data/get-trinkbrunnen-index.js';
	import { getKiezScore } from '$lib/data/get-kiez-score.js';
	import { getLaermDbAt } from '$lib/data/get-kiez-laerm-db.js';
	import { getWahlResultsAtPoint } from '$lib/data/get-wahl-results-at-point.js';
	import { findAllNearestStops } from '$lib/components/atlas/inspector-panel/internal/nearest-oepnv-stop.js';
	import { fetchLayer } from '$lib/data/internal/layer-fetch.js';
	import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
	import { point } from '@turf/helpers';
	import type { Feature, Polygon, MultiPolygon } from 'geojson';
	import type { DemografieScope } from '$lib/components/atlas/inspector-panel/internal/demografie-types.js';
	import { queryPmtilesAt, type MapLibreLike } from '$lib/data/internal/pmtiles-query.js';
	import type { GeocodeSuggestion, LayerMetadata } from '$lib/data/types.js';
	import { useViewport } from '$lib/utils/use-viewport.svelte.js';
	import { SvelteSet } from 'svelte/reactivity';
	import LayerPalette from '$lib/components/atlas/layer-palette.svelte';
	import { page } from '$app/state';
	import {
		buildOgDescription,
		buildOgImageUrl,
		type OgImageInput
	} from '$lib/utils/og-image-url.js';
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
		isChoroplethSlug
	} from '$lib/components/atlas/internal/layer-style-cascade.js';
	import { sortSlugsByBundleStable } from '$lib/components/atlas/internal/layer-order-sorting.js';
	import {
		applyHiddenSlugs,
		exceedsPolygonLimit,
		capPolygonSlugs,
		orderChoropleths
	} from '$lib/components/atlas/internal/layer-visibility.js';
	import {
		toggleLayerHidden,
		removeLayer as removeUiLayer,
		setComparisonAddress,
		exitCompareMode
	} from '$lib/state/ui-context.svelte.js';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import {
		diffLayerSlugs,
		dotsSourceIdFor,
		sourceIdFor,
		layerIdFor,
		outlineLayerIdFor
	} from '$lib/components/atlas/internal/layer-diff.js';
	import { featureLabelPoints } from '$lib/components/atlas/internal/feature-label-points.js';
	import { dotSpecForSlug } from '$lib/components/atlas/internal/choropleth-dots.js';
	import { PIN_LAYER_SLUGS } from '$lib/components/atlas/internal/pin-icon-mapping.js';

	type Viewport = {
		center: [number, number];
		zoom: number;
		bbox: [number, number, number, number];
	};
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
	let currentMarkerEl: HTMLElement | null = null;
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

	// Default-Einstieg ohne URL-Adresse: Pariser Platz (Mitte) als Beispiel-Punkt.
	const PARISER_PLATZ = { lat: 52.51631, lng: 13.3777 } as const;
	const PARISER_PLATZ_FALLBACK: GeocodeSuggestion = {
		id: 'default-pariser-platz',
		displayName: 'Pariser Platz',
		lat: PARISER_PLATZ.lat,
		lng: PARISER_PLATZ.lng,
		type: 'point',
		addresstype: 'point',
		bezirk: 'Mitte',
		postcode: '10117'
	};
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

	$effect(() => {
		if (typeof document === 'undefined') return;
		document.body.classList.add('route-explore');
		return () => {
			document.body.classList.remove('route-explore');
			// Finder-Session endet mit der Seite: sonst öffnet ein
			// Leichen-State den Finder beim nächsten Explore-Besuch von
			// selbst und kollidiert mit dem Auto-Inspector.
			ui.finderOpen = false;
		};
	});

	onMount(() => {
		// URL ist Source-of-Truth für aktive Layer: immer setzen, auch leer. Sonst schleppt ein
		// Explorer-Einstieg ohne ?layers die aus einer früheren Session persistierten Layer mit
		// (z.B. kuehle-orte via Hitze-Landing → Home → Explorer).
		// Multi-Layer-Limit auch am URL-Einstieg: höchstens 2 Choroplethen.
		ui.activeLayerSlugs = capPolygonSlugs(data.activeLayers ?? []);
		// Lead gegen die GEKAPPTE Liste prüfen: parseLead sah die rohe URL-Liste,
		// der Cap kann den Lead-Slug gerade entfernt haben.
		ui.choroplethLeadSlug =
			data.leadSlug && ui.activeLayerSlugs.includes(data.leadSlug) ? data.leadSlug : null;
		// Story 2.12 Quick-Links: wenn `?address=lng,lat&q=…` gesetzt, bauen
		// wir eine synthetische GeocodeSuggestion und triggern die Adress-
		// Selection. Inspector öffnet sich dann automatisch.
		// Finder-Einstieg (?finder=1): keine Default-Adresse setzen, sonst
		// verdeckt der automatisch geöffnete Inspector den Finder im Slot.
		if (featureFlags.kiezFinder && data.finderOpen) {
			// bewusst leer: der Finder besetzt den Slot, kein Auto-Inspector
		} else if (typeof data.address?.lng === 'number' && typeof data.address?.lat === 'number') {
			const displayName =
				data.address.q ?? `${data.address.lat.toFixed(5)}, ${data.address.lng.toFixed(5)}`;
			selection.set({
				id: `url-${data.address.lng.toFixed(5)}-${data.address.lat.toFixed(5)}`,
				displayName,
				lng: data.address.lng,
				lat: data.address.lat,
				type: 'point',
				addresstype: 'point'
			});
		} else {
			// Kein Punkt in URL: Pariser Platz als Default setzen (Reverse-Geocode für
			// echte Subline, Fallback auf statische Suggestion).
			void (async () => {
				try {
					const s = await reverseGeocodeAddress({
						lat: PARISER_PLATZ.lat,
						lng: PARISER_PLATZ.lng
					}).run();
					// addresstype steuert nur den Fly-Zoom: für den Default-Einstieg
					// bewusst Übersicht statt Gebäude-Zoom.
					selection.set({ ...(s ?? PARISER_PLATZ_FALLBACK), addresstype: 'city_district' });
				} catch {
					selection.set({ ...PARISER_PLATZ_FALLBACK, addresstype: 'city_district' });
				}
			})();
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

	const syncLayers = debounce((slugs: string[], lead: string | null) => {
		const url = new URL(window.location.href);
		url.searchParams.delete(LAYERS_KEY);
		url.searchParams.delete('lead');
		// Story 1.14 AC-5: Aktivierungs-Reihenfolge persistieren, kein Bundle-Re-Sort.
		const csv = serializeLayers(slugs);
		if (csv) url.searchParams.set(LAYERS_KEY, csv);
		if (csv && lead && slugs.includes(lead)) url.searchParams.set('lead', lead);
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`?${url.searchParams.toString()}`, {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}, 200);

	let layersSyncBootstrapped = false;
	$effect(() => {
		// Tief lesen VOR dem Bootstrap-Guard: Der erste Lauf muss Länge und
		// Elemente tracken. Mit dem Read nach dem Guard sah der Effekt nur die
		// Array-Referenz, die nie neu zugewiesen wird, und feuerte nach dem
		// Mount nie wieder. Folge: Permalink ohne die aktivierten Layer.
		const slugs = [...ui.activeLayerSlugs];
		const lead = ui.choroplethLeadSlug;
		if (!layersSyncBootstrapped) {
			layersSyncBootstrapped = true;
			return;
		}
		syncLayers(slugs, lead);
	});

	type GeoJsonSource = { type: 'geojson'; data: unknown };
	type VectorSource = { type: 'vector'; url: string };
	type MapWithLayers = {
		addSource: (id: string, source: GeoJsonSource | VectorSource) => void;
		removeSource: (id: string) => void;
		addLayer: (spec: MapLibreLayerSpec & { 'source-layer'?: string }) => void;
		removeLayer: (id: string) => void;
		moveLayer: (id: string, beforeId?: string) => void;
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
		if (isChoroplethSlug(slug) && (variant === 'fill' || variant === 'outline')) {
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
		const ordered = orderChoropleths(
			sortSlugsByBundleStable(visible, manifestLayers),
			ui.choroplethLeadSlug
		);
		const cascade = computeCascadeVariants(ordered);

		const variantBySlug: Record<string, string> = {};
		for (const slug of ordered) {
			variantBySlug[slug] = isChoroplethSlug(slug) ? (cascade.get(slug) ?? 'fill') : 'non-polygon';
		}

		const visibleSet = new Set(ordered);
		const { toRemove } = diffLayerSlugs(renderedSlugs, ordered);

		// 1. remove sources for slugs no longer visible. Kontur-Varianten führen
		// einen zweiten Layer unter der -outline-ID, der mit weg muss.
		for (const slug of toRemove) {
			const layerId = layerIdFor(slug);
			const outlineId = outlineLayerIdFor(slug);
			const sourceId = sourceIdFor(slug);
			const dotsId = dotsSourceIdFor(slug);
			if (map.getLayer(outlineId)) map.removeLayer(outlineId);
			if (map.getLayer(layerId)) map.removeLayer(layerId);
			if (map.getSource(sourceId)) map.removeSource(sourceId);
			if (map.getSource(dotsId)) map.removeSource(dotsId);
		}

		// 2. for slugs whose variant changed but still visible: remove layer (keep source)
		for (const slug of renderedSlugs) {
			if (!visibleSet.has(slug)) continue;
			if (renderedVariantBySlug[slug] === variantBySlug[slug]) continue;
			const layerId = layerIdFor(slug);
			const outlineId = outlineLayerIdFor(slug);
			if (map.getLayer(outlineId)) map.removeLayer(outlineId);
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
						// Score-Layer: Label-Punkt-Quelle für die Punktsymbole der
						// Sekundär-Variante. Ein Punkt pro Fläche, zoom-unabhängig,
						// statt MapLibres Symbol-pro-Tile-Fragment auf Polygonen.
						if (dotSpecForSlug(slug) && !map.getSource(dotsSourceIdFor(slug))) {
							map.addSource(dotsSourceIdFor(slug), {
								type: 'geojson',
								data: featureLabelPoints(fc)
							});
						}
					}
				} catch {
					layerRenderInflight.delete(slug);
					continue;
				}
				layerRenderInflight.delete(slug);
			}

			// Dots-Quelle unabhängig sicherstellen: Existiert die Haupt-Quelle,
			// aber die Punkt-Quelle fehlt (z.B. nach Teil-Aufräumen), würde der
			// Symbol-Spec sonst still übersprungen und der Zweit-Choropleth
			// bliebe unsichtbar.
			if (
				meta.format !== 'pmtiles' &&
				dotSpecForSlug(slug) &&
				map.getSource(sourceId) &&
				!map.getSource(dotsSourceIdFor(slug)) &&
				!layerRenderInflight.has(slug)
			) {
				layerRenderInflight.add(slug);
				try {
					const fc = await fetchLayer(meta.filename);
					if (!rawMap) return;
					if (!map.getSource(dotsSourceIdFor(slug))) {
						map.addSource(dotsSourceIdFor(slug), {
							type: 'geojson',
							data: featureLabelPoints(fc)
						});
					}
				} catch {
					// Punkt-Quelle bleibt aus; der Fill rendert weiter.
				}
				layerRenderInflight.delete(slug);
			}

			// Layer ensure: re-add wenn nicht da ODER variant changed (variant change removed layer above).
			if (!map.getLayer(layerId)) {
				const specs = specsForSlug(slug, sourceId, variant, reduced);
				for (const spec of specs) {
					if (spec.source !== sourceId && !map.getSource(spec.source)) continue;
					if (!map.getLayer(spec.id)) {
						const merged = meta.format === 'pmtiles' ? { ...spec, 'source-layer': slug } : spec;
						map.addLayer(merged);
					}
				}
			}
		}

		// 4. Z-Reihenfolge deterministisch erzwingen. Der Add-Loop fügt nur
		// fehlende Layer hinzu, sonst wäre die Stapelung Aktivierungs-Historie:
		// ein später zugeschalteter Overlay läge über den Aggregat-Symbolen.
		// moveLayer ohne beforeId hebt an die Spitze; die ordered-Sequenz
		// bottom-up ergibt exakt die gewünschte Stapelung, Symbole zuoberst.
		for (const slug of ordered) {
			const layerId = layerIdFor(slug);
			if (map.getLayer(layerId)) map.moveLayer(layerId);
		}
		// Aggregat-Symbole liegen über ALLEN Daten-Layern, auch über Overlays
		// und Punkt-Layern: Sie sind die kleinste Tinte und tragen den Wert.
		for (const slug of ordered) {
			const outlineId = outlineLayerIdFor(slug);
			if (map.getLayer(outlineId)) map.moveLayer(outlineId);
		}
		// Die Auswahl-Kontur (Region-Outline) bleibt zuoberst.
		if (map.getLayer(OUTLINE_LINE_ID)) map.moveLayer(OUTLINE_LINE_ID);

		renderedSlugs = [...ordered];
		renderedVariantBySlug = variantBySlug;
	}

	$effect(() => {
		// reactive deps: activeLayerSlugs, hiddenLayerSlugs, choroplethLeadSlug, manifestLayers
		const slugs = ui.activeLayerSlugs;
		const _hidden = ui.hiddenLayerSlugs;
		void _hidden;
		const _lead = ui.choroplethLeadSlug;
		void _lead;
		if (!rawMap || manifestLayers.length === 0) return;
		void renderLayers(slugs);
	});

	// Story 10.5: Karten-Outline folgt dem Demografie-Scope. Eigene Source/Layer-IDs,
	// getrennt von renderLayers, damit Choropleth-Layer unberührt bleiben.
	const OUTLINE_SOURCE_ID = 'region-outline-src';
	const OUTLINE_LINE_ID = 'region-outline-line';
	const OUTLINE_LAYER_SLUG: Record<DemografieScope, string> = {
		standort: 'lor-planungsraum',
		kiez: 'lor-bezirksregion',
		bezirk: 'bezirke'
	};

	function removeRegionOutline(): void {
		if (!rawMap) return;
		const map = rawMap as MapWithLayers;
		if (map.getLayer(OUTLINE_LINE_ID)) map.removeLayer(OUTLINE_LINE_ID);
		if (map.getSource(OUTLINE_SOURCE_ID)) map.removeSource(OUTLINE_SOURCE_ID);
	}

	async function containingFeature(
		slug: string,
		lat: number,
		lng: number
	): Promise<Feature<Polygon | MultiPolygon> | null> {
		const meta = getLayerEntry(slug);
		if (!meta) return null;
		const fc = await fetchLayer(meta.filename);
		if (!Array.isArray(fc?.features)) return null;
		const queryPoint = point([lng, lat]);
		for (const f of fc.features) {
			const geom = f.geometry;
			if (geom?.type !== 'Polygon' && geom?.type !== 'MultiPolygon') continue;
			const feat = f as Feature<Polygon | MultiPolygon>;
			if (booleanPointInPolygon(queryPoint, feat)) return feat;
		}
		return null;
	}

	async function renderRegionOutline(
		lat: number,
		lng: number,
		scope: DemografieScope,
		addrId: string
	): Promise<void> {
		const feature = await containingFeature(OUTLINE_LAYER_SLUG[scope], lat, lng);
		// Stale-Guard: Adresse/Scope können während des Fetch gewechselt haben.
		if (!rawMap || ui.selectedAddress?.id !== addrId || ui.demografieScope !== scope) return;
		removeRegionOutline();
		if (!feature) return;
		const map = rawMap as MapWithLayers;
		map.addSource(OUTLINE_SOURCE_ID, {
			type: 'geojson',
			data: { type: 'FeatureCollection', features: [feature] }
		});
		map.addLayer({
			id: OUTLINE_LINE_ID,
			type: 'line',
			source: OUTLINE_SOURCE_ID,
			paint: { 'line-color': COLORS.markerPin, 'line-width': 2.5, 'line-opacity': 0.9 }
		} as MapLibreLayerSpec);
	}

	$effect(() => {
		const addr = ui.selectedAddress;
		const scope = ui.demografieScope;
		if (!rawMap) return;
		if (!addr) {
			removeRegionOutline();
			return;
		}
		void renderRegionOutline(addr.lat, addr.lng, scope, addr.id);
	});

	// ?finder=1 wird bei JEDER Navigation konsumiert, nicht nur beim Mount:
	// der Header-Link navigiert client-seitig, onMount liefe dann nie.
	// Nach dem Konsum fliegt der Param aus der URL, damit ein erneuter
	// Header-Klick wieder eine echte Navigation auslöst.
	$effect(() => {
		if (!featureFlags.kiezFinder || !data.finderOpen) return;
		ui.finderOpen = true;
		ui.inspectorOpen = false;
		trackEvent('Finder', { action: 'open' });
		const url = new URL(window.location.href);
		if (url.searchParams.has('finder')) {
			url.searchParams.delete('finder');
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			void goto(`?${url.searchParams.toString()}`, {
				replaceState: true,
				keepFocus: true,
				noScroll: true
			});
		}
	});

	$effect(() => {
		if (!ui.finderOpen) return;
		const remaining = ui.activeLayerSlugs.filter((slug) => !isChoroplethSlug(slug));
		if (remaining.length !== ui.activeLayerSlugs.length) {
			ui.activeLayerSlugs.splice(0, ui.activeLayerSlugs.length, ...remaining);
		}
	});

	const cascadeForLegend = $derived(
		computeCascadeVariants(
			orderChoropleths(
				sortSlugsByBundleStable(
					applyHiddenSlugs(ui.activeLayerSlugs, ui.hiddenLayerSlugs),
					manifestLayers
				),
				ui.choroplethLeadSlug
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
		currentMarkerEl = null;
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
		const el = createPinMarkerElement({ color: COLORS.markerPin });
		currentMarkerEl = el;
		currentMarker = new MarkerCtor({ element: el, anchor: 'bottom' })
			.setLngLat(lngLat)
			.addTo(rawMap);
		if (ui.compareMode) el.style.display = 'none';

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
			hits = await getLayersAtPoint(suggestion.lat, suggestion.lng, undefined, pmtilesQuery);
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
		ui.wahlResults = null;
		ui.kiezLaermDb = null;
		announceGlobal(`Inspektor geöffnet für ${suggestion.displayName}`);
		// Demografie lädt der Inspector selbst (scope-abhängig, Story 10.5).
		void (async () => {
			try {
				const db = await getLaermDbAt(suggestion.lat, suggestion.lng);
				if (ui.selectedAddress?.id === suggestion.id) ui.kiezLaermDb = db;
			} catch {
				if (ui.selectedAddress?.id === suggestion.id) ui.kiezLaermDb = null;
			}
		})();
		void (async () => {
			try {
				const wahl = await getWahlResultsAtPoint(suggestion.lat, suggestion.lng);
				if (ui.selectedAddress?.id === suggestion.id) {
					ui.wahlResults = wahl;
				}
			} catch {
				if (ui.selectedAddress?.id === suggestion.id) ui.wahlResults = null;
			}
		})();
		if (!ui.oepnvStopIndex) {
			void getOepnvStopIndex()
				.then((idx) => {
					ui.oepnvStopIndex = idx;
				})
				.catch(() => {
					ui.oepnvStopIndex = null;
				});
		}
		if (!ui.kuehleOrteIndex) {
			void getKuehleOrteIndex()
				.then((idx) => {
					ui.kuehleOrteIndex = idx;
				})
				.catch(() => {
					ui.kuehleOrteIndex = null;
				});
		}
		if (!ui.trinkbrunnenIndex) {
			void getTrinkbrunnenIndex()
				.then((idx) => {
					ui.trinkbrunnenIndex = idx;
				})
				.catch(() => {
					ui.trinkbrunnenIndex = null;
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
				if (opened) {
					trackEvent('MapClick', suggestion.bezirk ? { bezirk: suggestion.bezirk } : undefined);
				} else {
					clearMarker();
				}
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
		if (opened) {
			trackEvent('MapClick', { type: 'point' });
		} else {
			clearMarker();
		}
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
			flyToSuggestion({
				lng: feature.centroid[0],
				lat: feature.centroid[1],
				addresstype: 'street'
			});
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
			try {
				const wahl = await getWahlResultsAtPoint(addr.lat, addr.lng);
				if (ui.comparisonAddress?.id === addr.id) {
					ui.comparisonWahlResults = wahl;
				}
			} catch {
				if (ui.comparisonAddress?.id === addr.id) ui.comparisonWahlResults = null;
			}
			if (ui.comparisonAddress?.id === addr.id) {
				ui.comparisonLoading = false;
			}
		})();
	});

	let compareMarkerA: { remove: () => void } | null = null;
	let compareMarkerB: { remove: () => void } | null = null;

	function removeCompareMarkers(): void {
		compareMarkerA?.remove();
		compareMarkerA = null;
		compareMarkerB?.remove();
		compareMarkerB = null;
	}

	$effect(() => {
		const a = ui.selectedAddress;
		const b = ui.comparisonAddress;
		const active = ui.compareMode;
		if (!rawMap || !MarkerCtor) return;
		removeCompareMarkers();
		if (!active || !a || !b) {
			// Selektions-Pin (A) wieder einblenden, sobald Vergleich endet.
			if (currentMarkerEl) currentMarkerEl.style.display = '';
			return;
		}
		// Selektions-Pin verstecken: A wird durch labeled Compare-Pin ersetzt (kein Doppel-Pin).
		if (currentMarkerEl) currentMarkerEl.style.display = 'none';
		const elA = createPinMarkerElement({ color: COLORS.markerPin, label: 'A' });
		const elB = createPinMarkerElement({ color: COLORS.markerPinCompare, label: 'B' });
		compareMarkerA = new MarkerCtor({ element: elA, anchor: 'bottom' })
			.setLngLat([a.lng, a.lat])
			.addTo(rawMap);
		compareMarkerB = new MarkerCtor({ element: elB, anchor: 'bottom' })
			.setLngLat([b.lng, b.lat])
			.addTo(rawMap);
		const map = rawMap as {
			fitBounds?: (
				bounds: [[number, number], [number, number]],
				opts: { padding: number; essential?: boolean }
			) => void;
		};
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

	const finderActive = $derived(featureFlags.kiezFinder && ui.finderOpen);
	const inspectorActive = $derived(ui.inspectorOpen && ui.selectedAddress !== null);
	const slotOccupied = $derived(inspectorActive || ui.compareMode || finderActive);
	const showSidePanel = $derived(viewport.breakpoint !== 'mobile' && slotOccupied);
	const showBottomSheet = $derived(viewport.breakpoint === 'mobile' && slotOccupied);
	// Finder bleibt gemountet, solange er offen ist: Slider-Gewichte und
	// Karten-Färbung überleben den Wechsel zum Inspector (Karten-Klick).
	const finderVisible = $derived(finderActive && !inspectorActive && !ui.compareMode);

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
			: 'Berliner Open-Data-Atlas: pro Adresse Lärm, Klima, Grün, Mobilität, Wohnen, Sozialstruktur und Wahlen. Karte plus Kiez-Score.'
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
		'flex h-[calc(100dvh-72px)] max-h-[calc(100dvh-72px)] min-h-0 flex-col overflow-hidden md:h-[calc(100dvh-72px-40px)] md:max-h-[calc(100dvh-72px-40px)]',
		showSidePanel &&
			'lg:grid lg:h-[calc(100dvh-72px-40px)] lg:max-h-[calc(100dvh-72px-40px)] lg:grid-cols-[1fr_var(--inspector-width)] lg:grid-rows-[minmax(0,1fr)]'
	]
		.filter(Boolean)
		.join(' ')}
	style={ui.compareMode
		? '--inspector-width: clamp(480px, 38vw, 600px);'
		: '--inspector-width: clamp(360px, 28vw, 420px);'}
	data-testid="atlas-shell"
>
	<!-- sr-only H1 + Intro: crawlbarer Seiten-Content (fixt Google-Soft-404 +
	     Bing-H1-missing) und a11y-Landmark, ohne das visuelle Karten-Layout zu
	     verändern. Statischer Page-Titel, unabhängig von der Adress-Auswahl. -->
	<h1 class="sr-only">Berlin-Atlas: Daten zu jeder Adresse</h1>
	<p class="sr-only">
		Suche eine Adresse oder setze einen Pin auf der Karte. Sieh Lärm, Klima, Grün, Mobilität,
		Wohnen, Sozialstruktur und Wahlergebnisse für deinen Kiez, über Bezirksgrenzen hinweg.
	</p>
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
			{manifestLayers}
			hiddenSlugs={ui.hiddenLayerSlugs}
			cascadeVariants={cascadeForLegend}
			showLimitWarning={legendLimitWarning}
			onToggleHidden={onLegendToggleHidden}
			onRemove={onLegendRemove}
			onPromoteLayer={(slug: string) => (ui.choroplethLeadSlug = slug)}
		/>
		<MapHoverTooltip
			map={rawMap as MapHoverApi | null}
			activeLayerSlugs={ui.activeLayerSlugs}
			isMobile={viewport.breakpoint === 'mobile'}
		/>
		{#if outsideBerlinHintVisible}
			<div
				class="pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-sm border border-severity-warning/40 bg-severity-warning-bg px-3 py-2 font-sans text-sm text-severity-warning shadow-sm"
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
			class="min-h-0 overflow-y-auto border-t border-rule bg-bg-elevated lg:h-full lg:border-t-0 lg:border-l"
			aria-label={ui.compareMode
				? 'Adress-Vergleich'
				: inspectorActive
					? 'Adress-Inspector-Bereich'
					: 'Kiez-Finder'}
			data-testid="inspector-slot"
		>
			{#if ui.compareMode}
				<ComparePanel
					layerMeta={manifestLayers}
					geocode={geocodeForCompare}
					onOpenBookmarkPicker={openBookmarkPickerForCompare}
				/>
			{:else if inspectorActive}
				<InspectorPanel layerMeta={manifestLayers} />
			{/if}
			{#if finderActive && viewport.breakpoint !== 'mobile'}
				<div class={finderVisible ? 'h-full' : 'hidden'}>
					<KiezFinderPanel
						map={rawMap as unknown as FinderMapApi | null}
						onClose={() => (ui.finderOpen = false)}
					/>
				</div>
			{/if}
		</aside>
	{/if}
	{#if showBottomSheet}
		<BottomSheet
			open
			snapVh={ui.sheetSnapVh}
			onSnap={setSnap}
			onClose={ui.compareMode
				? () => exitCompareMode(ui)
				: inspectorActive
					? closeInspector
					: () => (ui.finderOpen = false)}
			ariaLabel={ui.compareMode
				? 'Adress-Vergleich'
				: inspectorActive
					? 'Adress-Inspektor'
					: 'Kiez-Finder'}
		>
			{#if ui.compareMode}
				<ComparePanel
					layerMeta={manifestLayers}
					geocode={geocodeForCompare}
					onOpenBookmarkPicker={openBookmarkPickerForCompare}
				/>
			{:else if inspectorActive}
				<InspectorPanel layerMeta={manifestLayers} variant="sheet" />
			{/if}
			{#if finderActive && viewport.breakpoint === 'mobile'}
				<div class={finderVisible ? '' : 'hidden'}>
					<KiezFinderPanel
						map={rawMap as unknown as FinderMapApi | null}
						onClose={() => (ui.finderOpen = false)}
					/>
				</div>
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
