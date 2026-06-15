<script lang="ts" module>
	export type AccessibilityRenderedFeature = {
		id?: string | number;
		layer: { id: string };
		geometry: { type: string; coordinates: unknown };
		properties?: Record<string, unknown> | null;
	};

	export type AccessibilityMapLike = {
		queryRenderedFeatures: (geom?: unknown, opts?: { layers?: string[] }) => unknown[];
		getLayer?: (id: string) => unknown;
		on: (event: string, handler: () => void) => unknown;
		off: (event: string, handler: () => void) => unknown;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { LayerMetadata } from '$lib/data/types.js';
	import {
		describeFeature,
		type AccessibleFeature,
		type AccessibleFeatureInput
	} from './internal/feature-describer.js';

	type CompareAddressInfo = { displayName: string };

	type Props = {
		map: AccessibilityMapLike | null;
		layers: LayerMetadata[];
		selectedFeatureId?: string | null;
		maxItems?: number;
		onSelectFeature?: (feature: AccessibleFeature) => void;
		compareA?: CompareAddressInfo | null;
		compareB?: CompareAddressInfo | null;
		onSelectCompareSide?: (side: 'a' | 'b') => void;
	};

	let {
		map,
		layers,
		selectedFeatureId = null,
		maxItems = 50,
		onSelectFeature,
		compareA = null,
		compareB = null,
		onSelectCompareSide
	}: Props = $props();

	let visibleFeatures = $state<AccessibleFeature[]>([]);
	let overflowCount = $state(0);

	const layerBySlug = $derived(new Map(layers.map((l) => [l.slug, l])));
	const layerIdsToQuery = $derived(layers.map((l) => l.slug));

	function geometryTypeOf(g: { type: string }): 'Point' | 'Polygon' | 'MultiPolygon' | null {
		if (g.type === 'Point') return 'Point';
		if (g.type === 'Polygon') return 'Polygon';
		if (g.type === 'MultiPolygon') return 'MultiPolygon';
		return null;
	}

	function firstCoord(geom: { type: string; coordinates: unknown }): [number, number] {
		const c = geom.coordinates as unknown;
		if (geom.type === 'Point' && Array.isArray(c) && typeof c[0] === 'number') {
			return [c[0] as number, c[1] as number];
		}
		// Polygon: coords[0][0]
		if (
			geom.type === 'Polygon' &&
			Array.isArray(c) &&
			Array.isArray(c[0]) &&
			Array.isArray(c[0][0])
		) {
			return [(c[0][0] as number[])[0]!, (c[0][0] as number[])[1]!];
		}
		// MultiPolygon: coords[0][0][0]
		if (
			geom.type === 'MultiPolygon' &&
			Array.isArray(c) &&
			Array.isArray(c[0]) &&
			Array.isArray(c[0][0]) &&
			Array.isArray(c[0][0][0])
		) {
			return [(c[0][0][0] as number[])[0]!, (c[0][0][0] as number[])[1]!];
		}
		return [0, 0];
	}

	function recompute(): void {
		if (!map) {
			visibleFeatures = [];
			overflowCount = 0;
			return;
		}
		const allIds = layerIdsToQuery;
		if (allIds.length === 0) {
			visibleFeatures = [];
			overflowCount = 0;
			return;
		}
		const ids = map.getLayer ? allIds.filter((id) => Boolean(map.getLayer!(id))) : allIds;
		if (ids.length === 0) {
			visibleFeatures = [];
			overflowCount = 0;
			return;
		}
		const rendered = map.queryRenderedFeatures(undefined, {
			layers: ids
		}) as AccessibilityRenderedFeature[];
		const seen: Record<string, true> = Object.create(null);
		const result: AccessibleFeature[] = [];
		for (const r of rendered) {
			const layer = layerBySlug.get(r.layer.id);
			if (!layer) continue;
			const gType = geometryTypeOf(r.geometry);
			if (!gType) continue;
			const input: AccessibleFeatureInput = {
				id: r.id,
				layerId: r.layer.id,
				geometryType: gType,
				properties: r.properties ?? {},
				centroid: firstCoord(r.geometry)
			};
			const accessible = describeFeature(input, layer);
			if (seen[accessible.id]) continue;
			seen[accessible.id] = true;
			result.push(accessible);
			if (result.length >= maxItems) break;
		}
		overflowCount = Math.max(0, rendered.length - result.length);
		visibleFeatures = result;
	}

	onMount(() => {
		if (!map) return;
		const handler = () => recompute();
		map.on('moveend', handler);
		map.on('idle', handler);
		recompute();
		return () => {
			map?.off('moveend', handler);
			map?.off('idle', handler);
		};
	});

	$effect(() => {
		void map;
		void layers;
		recompute();
	});

	function handleSelect(feature: AccessibleFeature): void {
		onSelectFeature?.(feature);
	}
</script>

<div
	class="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-16 focus-within:left-4 focus-within:z-40 focus-within:max-h-[60vh] focus-within:w-[min(28rem,calc(100vw-2rem))] focus-within:overflow-y-auto focus-within:rounded-sm focus-within:border focus-within:border-rule focus-within:bg-bg-elevated focus-within:p-4 focus-within:shadow-lg"
>
	{#if compareA && compareB}
		<div
			data-testid="map-a11y-compare-buttons"
			class="mb-3 flex flex-col gap-1 border-b border-rule pb-3"
		>
			<button
				type="button"
				data-testid="map-a11y-compare-a"
				onclick={() => onSelectCompareSide?.('a')}
				class="w-full border border-rule bg-bg px-3 py-2 text-left text-sm text-ink hover:bg-bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
			>
				<span class="block font-medium">Adresse A: {compareA.displayName}</span>
			</button>
			<button
				type="button"
				data-testid="map-a11y-compare-b"
				onclick={() => onSelectCompareSide?.('b')}
				class="w-full border border-rule bg-bg px-3 py-2 text-left text-sm text-ink hover:bg-bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
			>
				<span class="block font-medium">Adresse B: {compareB.displayName}</span>
			</button>
		</div>
	{/if}
	<p id="map-a11y-layer-heading" class="text-sm font-semibold text-ink">
		Sichtbare Orte und Grenzen auf der Karte
	</p>
	{#if visibleFeatures.length === 0}
		<p class="mt-2 text-sm text-ink-muted">Keine sichtbaren Features im aktuellen Ausschnitt.</p>
	{:else}
		<ul
			role="list"
			aria-labelledby="map-a11y-layer-heading"
			class="mt-2 flex flex-col gap-1"
			data-testid="map-a11y-feature-list"
		>
			{#each visibleFeatures as feature (feature.id)}
				{@const isCurrent = selectedFeatureId === feature.id}
				<li>
					<button
						type="button"
						aria-current={isCurrent ? 'true' : undefined}
						class="w-full border border-rule bg-bg px-3 py-2 text-left text-sm text-ink hover:bg-bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-[current=true]:border-accent aria-[current=true]:bg-accent-soft"
						data-testid="map-a11y-feature-button"
						data-feature-id={feature.id}
						data-layer-slug={feature.layerSlug}
						onclick={() => handleSelect(feature)}
					>
						<span class="block font-medium">{feature.layerName}</span>
						<span class="block text-ink-muted">{feature.description}</span>
					</button>
				</li>
			{/each}
		</ul>
		{#if overflowCount > 0}
			<p class="mt-2 text-xs text-ink-subtle">und {overflowCount} weitere Features ausgeblendet</p>
		{/if}
	{/if}
</div>
