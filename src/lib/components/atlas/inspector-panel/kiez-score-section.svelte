<script lang="ts">
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import KiezScoreDimensionRow from './kiez-score-dimension-row.svelte';
	import ValueChip from '../value-chip.svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import { scaleForOverall } from './internal/kiez-score-display.js';
	import type { KiezScore } from '$lib/data';

	type Props = {
		score: KiezScore | null;
		methodikHref?: string;
	};
	let { score, methodikHref = '/methodik/kiez-score' }: Props = $props();

	const enabled = $derived(featureFlags.kiezScore && score !== null);
	const overallScale = $derived(scaleForOverall(score?.overall));
	const usedDimsCount = $derived.by(() => {
		if (!score) return 0;
		return score.dimensions.filter((d) => d.value !== null).length;
	});
</script>

{#if enabled && score}
	<section
		data-testid="kiez-score-section"
		class="space-y-3"
	>
		<h3
			class="font-mono text-xs uppercase tracking-wide text-ink-muted"
			data-testid="kiez-score-section-header"
		>
			Kiez-Score
		</h3>
		{#if overallScale}
			<div
				data-testid="kiez-score-overall"
				class="flex items-baseline justify-between gap-3 border-b border-rule pb-2"
			>
				<div class="flex flex-col">
					<span class="font-sans text-base font-semibold text-ink">Gesamt</span>
					<span
						class="font-mono text-[10px] uppercase tracking-wide text-ink-subtle"
						data-testid="kiez-score-overall-meta"
					>
						Mittel über {usedDimsCount}/{score.dimensions.length} Dimensionen
					</span>
				</div>
				<ValueChip
					severity={overallScale.severity}
					value={`${overallScale.label} (${Math.round(score.overall as number)}/100)`}
					layerName="Kiez-Score gesamt"
				/>
			</div>
		{/if}
		<div class="divide-y divide-rule">
			{#each score.dimensions as dim (dim.dimension)}
				<KiezScoreDimensionRow score={dim} />
			{/each}
		</div>
		<EditorialDisclaimer variant="kiez-score-explainer" />
		<a
			href={methodikHref}
			data-testid="kiez-score-methodik-link"
			class="inline-block font-mono text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
		>
			Methodik · Wie der Kiez-Score berechnet wird
		</a>
	</section>
{/if}
