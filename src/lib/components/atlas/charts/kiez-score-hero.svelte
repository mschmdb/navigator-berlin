<script lang="ts">
	import KiezScoreRing from './kiez-score-ring.svelte';
	import ScoreBar from './score-bar.svelte';
	import ValueChip from '../value-chip.svelte';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import { DIMENSION_LABELS_DE, scaleFor } from '../inspector-panel/internal/kiez-score-display.js';
	import type { KiezScore, KiezScoreDimension } from '$lib/data';

	const KIEZ_SCORE_DIMENSIONS: readonly KiezScoreDimension[] = [
		'ruhe-luft',
		'gruen',
		'mobilitaet',
		'soziale-lage',
		'versorgung'
	];

	type Props = {
		score: KiezScore | null;
		/** Compare-Mode: Doppel-Ring unleserlich → 5-Dim-Bar-Stack A/B (ADR-014 Abschnitt 5). */
		comparisonScore?: KiezScore | null;
		methodikHref?: string;
	};

	let { score, comparisonScore = null, methodikHref = '/methodik/kiez-score' }: Props = $props();

	const compareActive = $derived(comparisonScore !== null);

	function dimValue(s: KiezScore | null, dim: KiezScoreDimension): number | null {
		return s?.dimensions.find((d) => d.dimension === dim)?.value ?? null;
	}

	const rows = $derived(
		KIEZ_SCORE_DIMENSIONS.map((dim) => {
			const valueA = dimValue(score, dim);
			const valueB = dimValue(comparisonScore, dim);
			return {
				dim,
				label: DIMENSION_LABELS_DE[dim],
				valueA,
				valueB,
				scaleA: scaleFor(valueA, dim),
				scaleB: scaleFor(valueB, dim)
			};
		})
	);
</script>

{#if score}
	<div data-testid="kiez-score-hero" data-compare={compareActive}>
		{#if compareActive}
			<div data-testid="kiez-score-hero-compare" class="space-y-3">
				{#each rows as row (row.dim)}
					<div data-testid={`hero-compare-dim-${row.dim}`}>
						<p class="mb-1 font-sans text-sm font-medium text-ink">{row.label}</p>
						<div class="space-y-1">
							<div class="flex items-center gap-2">
								<span class="w-4 font-mono text-[10px] uppercase text-ink-subtle">A</span>
								{#if row.valueA !== null && row.scaleA}
									<ScoreBar
										value={row.valueA}
										layerName={`${row.label} A`}
										severity={row.scaleA.severity}
									/>
								{:else}
									<span class="font-mono text-xs text-ink-subtle">keine Daten</span>
								{/if}
							</div>
							<div class="flex items-center gap-2">
								<span class="w-4 font-mono text-[10px] uppercase text-ink-subtle">B</span>
								{#if row.valueB !== null && row.scaleB}
									<ScoreBar
										value={row.valueB}
										layerName={`${row.label} B`}
										severity={row.scaleB.severity}
									/>
								{:else}
									<span class="font-mono text-xs text-ink-subtle">keine Daten</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
				<KiezScoreRing {score} />
				<ul data-testid="kiez-score-hero-dims" class="flex-1 space-y-2">
					{#each rows as row (row.dim)}
						<li
							data-testid={`hero-dim-${row.dim}`}
							class="flex items-center justify-between gap-2"
						>
							<span class="font-sans text-sm text-ink">{row.label}</span>
							{#if row.valueA !== null && row.scaleA}
								<ValueChip
									severity={row.scaleA.severity}
									value={`${row.scaleA.label} (${Math.round(row.valueA)})`}
									layerName={row.label}
								/>
							{:else}
								<span class="font-mono text-xs text-ink-subtle">keine Daten</span>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="mt-3 flex flex-col gap-2">
			<EditorialDisclaimer variant="kiez-score-explainer" />
			<a
				href={methodikHref}
				data-testid="kiez-score-hero-methodik-link"
				class="inline-block font-mono text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
			>
				Methodik · Wie der Kiez-Score berechnet wird
			</a>
		</div>
	</div>
{/if}
