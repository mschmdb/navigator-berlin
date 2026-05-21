<script lang="ts">
	import { ChevronDown, ChevronRight } from '@lucide/svelte';
	import ValueChip from '../value-chip.svelte';
	import { getLayerDisplayName } from '../internal/layer-palette-filter.js';
	import { DIMENSION_LABELS_DE, scaleFor } from './internal/kiez-score-display.js';
	import type { DimensionScore } from '$lib/data';

	type Props = {
		score: DimensionScore;
		/** Optional kontrolliert: wenn gesetzt, steuert der Konsument den Aufklapp-Zustand (z.B. via Ring-Klick). */
		open?: boolean;
		onToggle?: (dimension: DimensionScore['dimension']) => void;
	};
	let { score, open, onToggle }: Props = $props();

	const scale = $derived(scaleFor(score.value, score.dimension));
	const label = $derived(DIMENSION_LABELS_DE[score.dimension]);
	const hasSources = $derived(score.sources.length > 0);
	let internalOpen = $state(false);
	const sourcesOpen = $derived(open ?? internalOpen);

	function toggleSources(): void {
		if (onToggle) onToggle(score.dimension);
		else internalOpen = !internalOpen;
	}
</script>

<div
	data-testid="kiez-score-dim-{score.dimension}"
	data-dimension={score.dimension}
	class="py-1"
>
	{#if hasSources}
		<button
			type="button"
			onclick={toggleSources}
			aria-expanded={sourcesOpen}
			data-testid="kiez-score-toggle-sources-{score.dimension}"
			class="flex w-full items-center gap-2 py-1 text-left hover:text-accent"
		>
			{#if sourcesOpen}
				<ChevronDown size={14} class="shrink-0 text-ink-subtle" aria-hidden="true" />
			{:else}
				<ChevronRight size={14} class="shrink-0 text-ink-subtle" aria-hidden="true" />
			{/if}
			<span class="flex-1 font-sans text-sm font-medium text-ink">{label}</span>
			{#if scale}
				<ValueChip severity={scale.severity} value={scale.label} layerName={label} />
			{:else}
				<span class="font-mono text-xs text-ink-subtle" data-testid="kiez-score-missing-{score.dimension}">
					Daten unzureichend
				</span>
			{/if}
		</button>
	{:else}
		<div class="flex items-center gap-2 py-1 pl-[22px]">
			<span class="flex-1 font-sans text-sm font-medium text-ink">{label}</span>
			{#if scale}
				<ValueChip severity={scale.severity} value={scale.label} layerName={label} />
			{:else}
				<span class="font-mono text-xs text-ink-subtle" data-testid="kiez-score-missing-{score.dimension}">
					Daten unzureichend
				</span>
			{/if}
		</div>
	{/if}

	{#if hasSources && sourcesOpen}
		<ul
			class="mt-1 space-y-1 border-l border-rule pl-[22px] font-mono text-xs text-ink-muted"
			data-testid="kiez-score-sources-{score.dimension}"
		>
			{#each score.sources as src (src.layer)}
				<li class="flex items-baseline justify-between gap-2">
					<span>{getLayerDisplayName(src.layer)}</span>
					<span class="text-ink-subtle">
						{src.normalizedValue === null ? '—' : `${Math.round(src.normalizedValue)}/100`}
						<span class="ml-1 text-[10px]">·</span>
						<span class="ml-1 text-[10px]">w {Math.round(src.weight * 100)}%</span>
					</span>
				</li>
			{/each}
			{#if score.dataStand}
				<li
					class="pt-0.5 text-[10px] text-ink-subtle"
					data-testid="kiez-score-stand-{score.dimension}"
				>
					Stand: {new Date(score.dataStand).toLocaleDateString('de-DE')}
				</li>
			{/if}
		</ul>
	{/if}
</div>
