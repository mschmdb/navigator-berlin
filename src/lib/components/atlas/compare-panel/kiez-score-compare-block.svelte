<script lang="ts">
	import ValueChip from '../value-chip.svelte';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import {
		DIMENSION_LABELS_DE,
		scaleFor,
		scaleForOverall
	} from '../inspector-panel/internal/kiez-score-display.js';
	import type { KiezScore, KiezScoreDimension } from '$lib/data';

	type Props = {
		scoreA: KiezScore | null;
		scoreB: KiezScore | null;
		methodikHref?: string;
	};
	let { scoreA, scoreB, methodikHref = '/methodik/kiez-score' }: Props = $props();

	const visible = $derived(scoreA !== null || scoreB !== null);

	function getDimensionValue(score: KiezScore | null, dim: KiezScoreDimension): number | null {
		if (!score) return null;
		return score.dimensions.find((d) => d.dimension === dim)?.value ?? null;
	}

	const DIMENSIONS: readonly KiezScoreDimension[] = [
		'ruhe-luft',
		'gruen-hitze',
		'mobilitaet',
		'versorgung',
		'wohnschutz'
	];

	const overallA = $derived(scaleForOverall(scoreA?.overall));
	const overallB = $derived(scaleForOverall(scoreB?.overall));

	interface DimRow {
		dim: KiezScoreDimension;
		label: string;
		valueA: number | null;
		valueB: number | null;
		scaleA: ReturnType<typeof scaleFor>;
		scaleB: ReturnType<typeof scaleFor>;
	}

	const rows = $derived<DimRow[]>(
		DIMENSIONS.map((dim) => {
			const valueA = getDimensionValue(scoreA, dim);
			const valueB = getDimensionValue(scoreB, dim);
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

{#if visible}
	<section
		data-testid="compare-kiez-score"
		class="border-b border-rule px-6 py-4"
		aria-label="Kiez-Score-Vergleich"
	>
		<h3
			class="mb-3 font-mono text-xs uppercase tracking-wide text-ink-muted"
			data-testid="compare-kiez-score-header"
		>
			Kiez-Score
		</h3>
		<table class="w-full border-collapse">
			<thead>
				<tr class="border-b border-rule-strong">
					<th
						scope="col"
						class="py-1 pr-3 text-left font-mono text-[10px] uppercase tracking-wide text-ink-subtle"
					>
						Dimension
					</th>
					<th
						scope="col"
						data-cell="a"
						class="py-1 pr-3 text-left font-mono text-[10px] uppercase tracking-wide text-ink-subtle"
					>
						A
					</th>
					<th
						scope="col"
						data-cell="b"
						class="py-1 text-left font-mono text-[10px] uppercase tracking-wide text-ink-subtle"
					>
						B
					</th>
				</tr>
			</thead>
			<tbody>
				<tr
					data-testid="compare-kiez-score-overall"
					class="border-b border-rule"
				>
					<th
						scope="row"
						class="py-2 pr-3 text-left font-sans text-sm font-semibold text-ink"
					>
						Gesamt
					</th>
					<td data-cell="a" class="py-2 pr-3">
						{#if overallA && scoreA?.overall !== undefined}
							<ValueChip
								severity={overallA.severity}
								value={`${overallA.label} (${Math.round(scoreA.overall)}/100)`}
								layerName="Kiez-Score gesamt"
							/>
						{:else}
							<span class="font-mono text-xs text-ink-subtle">—</span>
						{/if}
					</td>
					<td data-cell="b" class="py-2">
						{#if overallB && scoreB?.overall !== undefined}
							<ValueChip
								severity={overallB.severity}
								value={`${overallB.label} (${Math.round(scoreB.overall)}/100)`}
								layerName="Kiez-Score gesamt"
							/>
						{:else}
							<span class="font-mono text-xs text-ink-subtle">—</span>
						{/if}
					</td>
				</tr>
				{#each rows as row (row.dim)}
					<tr data-testid={`compare-kiez-score-dim-${row.dim}`}>
						<th
							scope="row"
							class="py-2 pr-3 text-left font-sans text-sm font-medium text-ink"
						>
							{row.label}
						</th>
						<td data-cell="a" class="py-2 pr-3">
							{#if row.scaleA && row.valueA !== null}
								<ValueChip
									severity={row.scaleA.severity}
									value={`${row.scaleA.label} (${Math.round(row.valueA)})`}
									layerName={row.label}
								/>
							{:else}
								<span class="font-mono text-xs text-ink-subtle">—</span>
							{/if}
						</td>
						<td data-cell="b" class="py-2">
							{#if row.scaleB && row.valueB !== null}
								<ValueChip
									severity={row.scaleB.severity}
									value={`${row.scaleB.label} (${Math.round(row.valueB)})`}
									layerName={row.label}
								/>
							{:else}
								<span class="font-mono text-xs text-ink-subtle">—</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<div class="mt-3 flex flex-col gap-2">
			<EditorialDisclaimer variant="kiez-score-explainer" />
			<a
				href={methodikHref}
				data-testid="compare-kiez-score-methodik-link"
				class="inline-block font-mono text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
			>
				Methodik · Wie der Kiez-Score berechnet wird
			</a>
		</div>
	</section>
{/if}
