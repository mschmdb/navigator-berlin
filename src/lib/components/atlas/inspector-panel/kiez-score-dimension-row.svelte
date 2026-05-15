<script lang="ts">
	import { ChevronDown, ChevronUp } from '@lucide/svelte';
	import ValueChip from '../value-chip.svelte';
	import { getLayerDisplayName } from '../internal/layer-palette-filter.js';
	import { DIMENSION_LABELS_DE, scaleFor } from './internal/kiez-score-display.js';
	import type { DimensionScore } from '$lib/data';

	type Props = {
		score: DimensionScore;
	};
	let { score }: Props = $props();

	const scale = $derived(scaleFor(score.value, score.dimension));
	const label = $derived(DIMENSION_LABELS_DE[score.dimension]);
	let sourcesOpen = $state(false);

	function toggleSources(): void {
		sourcesOpen = !sourcesOpen;
	}
</script>

<div
	data-testid="kiez-score-dim-{score.dimension}"
	data-dimension={score.dimension}
	class="flex flex-col gap-2 py-2"
>
	<div class="flex items-center justify-between gap-3">
		<span class="font-sans font-medium text-ink">{label}</span>
		{#if scale}
			<ValueChip severity={scale.severity} value={scale.label} layerName={label} />
		{:else}
			<span
				class="font-mono text-xs text-ink-subtle"
				data-testid="kiez-score-missing-{score.dimension}"
			>
				Daten unzureichend
			</span>
		{/if}
	</div>
	{#if score.sources.length > 0}
		<button
			type="button"
			onclick={toggleSources}
			aria-expanded={sourcesOpen}
			data-testid="kiez-score-toggle-sources-{score.dimension}"
			class="inline-flex items-center gap-1 self-start font-mono text-[11px] uppercase tracking-wide text-ink-muted hover:text-ink"
		>
			{#if sourcesOpen}
				<ChevronUp size={12} aria-hidden="true" />
				<span>Quellen verbergen</span>
			{:else}
				<ChevronDown size={12} aria-hidden="true" />
				<span>Quellen anzeigen</span>
			{/if}
		</button>
		{#if sourcesOpen}
			<ul
				class="space-y-1 border-l border-rule pl-3 font-mono text-xs text-ink-muted"
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
			</ul>
		{/if}
	{/if}
	{#if score.dataStand}
		<span class="font-mono text-[10px] text-ink-subtle" data-testid="kiez-score-stand-{score.dimension}">
			Stand: {new Date(score.dataStand).toLocaleDateString('de-DE')}
		</span>
	{/if}
</div>
