<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import type { PointCountResult } from '$lib/data/count-points-in-polygon.js';
	import type { LayerLevelView } from './internal/aggregate-layer-for-level.js';
	import LayerHitRow from './layer-hit-row.svelte';
	import DistributionBar, { type DistributionClass } from '../charts/distribution-bar.svelte';
	import ScoreBar from '../charts/score-bar.svelte';
	import CoverageBar from '../charts/coverage-bar.svelte';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';

	type Props = {
		view: LayerLevelView;
		hit: LayerHit;
		layerName: string;
		lang?: string;
		lat?: number;
		lng?: number;
		isActive?: boolean;
		onToggleLayer?: (slug: string) => void;
		/** Runtime-Count für point-density-Layer (vom Parent berechnet). */
		pointResult?: PointCountResult | null;
	};

	let {
		view,
		hit,
		layerName,
		lang = 'de',
		lat,
		lng,
		isActive = false,
		onToggleLayer,
		pointResult = null
	}: Props = $props();

	const agg = $derived(view.aggregate);
	const distClasses = $derived<DistributionClass[]>(
		agg?.type === 'ordinal-distribution'
			? agg.classes.map((c) => ({ label: c.label, share: c.share }))
			: []
	);
	const dominant = $derived(agg?.type === 'ordinal-distribution' ? (agg.dominant ?? undefined) : undefined);

	// address ODER point-density ohne berechneten Count (Story 8.2c liefert ihn später)
	// → heutige Layer-Hit-Row (Passthrough, kein „wird berechnet"-Deadstate).
	const usePassthrough = $derived(
		view.kind === 'address' || (view.kind === 'point-density' && !pointResult)
	);
</script>

{#if usePassthrough}
	<LayerHitRow {hit} {layerName} {lang} {lat} {lng} {isActive} {onToggleLayer} />
{:else}
	<div data-testid="layer-level-card" data-kind={view.kind} data-layer={hit.layer} class="space-y-1">
		<p class="flex items-baseline justify-between gap-2 font-sans text-sm font-medium text-ink">
			{layerName}
		</p>
		{#if view.kind === 'aggregate' && agg}
			{#if agg.type === 'ordinal-distribution'}
				<DistributionBar
					classes={distClasses}
					{dominant}
					{layerName}
					neutral={view.neutral ?? false}
				/>
			{:else if agg.type === 'numeric-median'}
				<ScoreBar
					value={agg.median ?? 0}
					min={agg.min ?? 0}
					max={agg.max ?? 100}
					{layerName}
					severity="neutral"
				/>
			{:else if agg.type === 'coverage-share' || agg.type === 'area-share'}
				<CoverageBar share={agg.share} label={layerName} {layerName} />
			{/if}
		{:else if view.kind === 'point-density'}
			<p data-testid="point-density-summary" class="font-sans text-sm text-ink">
				{#if pointResult}
					<span class="font-mono tabular-nums">{pointResult.count}</span> im Gebiet ·
					<span class="font-mono tabular-nums">{pointResult.densityPerKm2}</span> / km²
				{:else}
					Anzahl wird berechnet …
				{/if}
			</p>
		{:else if view.kind === 'below-threshold'}
			<EditorialDisclaimer variant="level-below-threshold" />
		{:else if view.kind === 'not-aggregatable'}
			<EditorialDisclaimer variant="brw-not-aggregatable" />
		{:else}
			<p data-testid="level-no-data" class="font-mono text-xs text-ink-subtle">
				Keine Daten auf dieser Ebene.
			</p>
		{/if}
	</div>
{/if}
