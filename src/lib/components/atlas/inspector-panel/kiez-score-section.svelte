<script lang="ts">
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import KiezScoreDimensionRow from './kiez-score-dimension-row.svelte';
	import KiezScoreRing from '../charts/kiez-score-ring.svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import type { KiezScore, KiezScoreDimension } from '$lib/data';

	type Props = {
		score: KiezScore | null;
		methodikHref?: string;
	};
	let { score, methodikHref = '/methodik/kiez-score' }: Props = $props();

	const enabled = $derived(featureFlags.kiezScore && score !== null);
	const usedDimsCount = $derived.by(() => {
		if (!score) return 0;
		return score.dimensions.filter((d) => d.value !== null).length;
	});

	let expandedDim = $state<KiezScoreDimension | null>(null);

	function toggleDim(dim: KiezScoreDimension): void {
		expandedDim = expandedDim === dim ? null : dim;
	}
</script>

{#if enabled && score}
	<section data-testid="kiez-score-section" class="space-y-3">
		<h3
			class="font-mono text-xs uppercase tracking-wide text-ink-muted"
			data-testid="kiez-score-section-header"
		>
			Kiez-Score
		</h3>

		{#if score.overall !== undefined}
			<div class="flex flex-col items-center gap-1 pb-1" data-testid="kiez-score-overall">
				<KiezScoreRing {score} onSegmentClick={toggleDim} />
				<span
					class="font-mono text-[10px] uppercase tracking-wide text-ink-subtle"
					data-testid="kiez-score-overall-meta"
				>
					Gesamt · Mittel über {usedDimsCount}/{score.dimensions.length} Dimensionen
				</span>
			</div>
		{/if}

		<div class="divide-y divide-rule">
			{#each score.dimensions as dim (dim.dimension)}
				<KiezScoreDimensionRow
					score={dim}
					open={expandedDim === dim.dimension}
					onToggle={toggleDim}
				/>
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
