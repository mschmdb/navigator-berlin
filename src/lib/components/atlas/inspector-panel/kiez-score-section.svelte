<script lang="ts">
	import { Eye, EyeOff, ExternalLink } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import KiezScoreDimensionRow from './kiez-score-dimension-row.svelte';
	import KiezScoreRing from '../charts/kiez-score-ring.svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import type { KiezScore, KiezScoreDimension } from '$lib/data';

	const GESAMT_SLUG = 'kiez-score-gesamt';

	type Props = {
		score: KiezScore | null;
		methodikHref?: string;
		lang?: string;
		activeLayerSlugs?: readonly string[];
		onToggleLayer?: (slug: string) => void;
	};
	let {
		score,
		methodikHref = '/methodik/kiez-score',
		lang = 'de',
		activeLayerSlugs = [],
		onToggleLayer
	}: Props = $props();

	const gesamtActive = $derived(activeLayerSlugs.includes(GESAMT_SLUG));
	const gesamtHref = $derived((resolve as (p: string) => string)(`/${lang}/layer/${GESAMT_SLUG}`));

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
				<div class="flex items-center gap-1" data-testid="kiez-score-overall-actions">
					{#if onToggleLayer}
						<button
							type="button"
							data-testid="kiez-score-map-toggle-gesamt"
							aria-pressed={gesamtActive}
							aria-label={gesamtActive ? 'Gesamt-Score von Karte entfernen' : 'Gesamt-Score auf Karte zeigen'}
							title={gesamtActive ? 'Von Karte entfernen' : 'Auf Karte zeigen'}
							onclick={() => onToggleLayer?.(GESAMT_SLUG)}
							class={`inline-flex h-6 w-6 items-center justify-center rounded-sm hover:bg-bg ${gesamtActive ? 'text-accent' : 'text-ink-subtle hover:text-ink'}`}
						>
							{#if gesamtActive}<EyeOff size={14} aria-hidden="true" />{:else}<Eye
									size={14}
									aria-hidden="true"
								/>{/if}
						</button>
					{/if}
					<a
						href={gesamtHref}
						data-testid="kiez-score-learn-more-gesamt"
						aria-label="Mehr über den Gesamt-Score"
						title="Layer-Details"
						class="inline-flex h-6 w-6 items-center justify-center rounded-sm text-ink-subtle hover:bg-bg hover:text-ink"
					>
						<ExternalLink size={13} aria-hidden="true" />
					</a>
				</div>
			</div>
		{/if}

		<div class="divide-y divide-rule">
			{#each score.dimensions as dim (dim.dimension)}
				<KiezScoreDimensionRow
					score={dim}
					open={expandedDim === dim.dimension}
					onToggle={toggleDim}
					{lang}
					isActive={activeLayerSlugs.includes(`kiez-score-${dim.dimension}`)}
					{onToggleLayer}
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
