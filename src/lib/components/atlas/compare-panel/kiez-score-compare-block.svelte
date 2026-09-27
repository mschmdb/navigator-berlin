<script lang="ts">
	import ValueChip from '../value-chip.svelte';
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import {
		dimensionLabel,
		scaleFor,
		scaleForOverall
	} from '../inspector-panel/internal/kiez-score-display.js';
	import { severityDescriptions } from '../inspector-panel/internal/value-severity-mapping.js';
	import type { KiezScore, KiezScoreDimension } from '$lib/data';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { localizedHref } from '$lib/i18n/localized-href.js';

	type Props = {
		scoreA: KiezScore | null;
		scoreB: KiezScore | null;
		methodikHref?: string;
	};
	let { scoreA, scoreB, methodikHref = '/methodik/kiez-score' }: Props = $props();

	const localeOpts = $derived({ locale: getLocale() });
	const chipSeverityDescriptions = $derived(severityDescriptions(localeOpts));

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
		'wohnschutz',
		'kultur',
		// Story 14.4: Kriminalität als Kontext-Zeile (neutrale Chips via scaleFor, kein Gut-Pfeil).
		'kriminalitaet'
	];

	const overallA = $derived(scaleForOverall(scoreA?.overall, localeOpts));
	const overallB = $derived(scaleForOverall(scoreB?.overall, localeOpts));

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
				label: dimensionLabel(dim, localeOpts),
				valueA,
				valueB,
				scaleA: scaleFor(valueA, dim, localeOpts),
				scaleB: scaleFor(valueB, dim, localeOpts)
			};
		})
	);
</script>

{#if visible}
	<section
		data-testid="compare-kiez-score"
		class="border-b border-rule px-6 py-4"
		aria-label={m.compare_kiez_score_aria()}
	>
		<h3
			class="mb-3 font-mono text-xs tracking-wide text-ink-muted uppercase"
			data-testid="compare-kiez-score-header"
		>
			{m.inspector_kiez_score_heading()}
		</h3>
		<table class="w-full border-collapse">
			<thead>
				<tr class="border-b border-rule-strong">
					<th
						scope="col"
						class="py-1 pr-3 text-left font-mono text-[10px] tracking-wide text-ink-subtle uppercase"
					>
						{m.compare_kiez_score_th_dimension()}
					</th>
					<th
						scope="col"
						data-cell="a"
						class="py-1 pr-3 text-left font-mono text-[10px] tracking-wide text-ink-subtle uppercase"
					>
						A
					</th>
					<th
						scope="col"
						data-cell="b"
						class="py-1 text-left font-mono text-[10px] tracking-wide text-ink-subtle uppercase"
					>
						B
					</th>
				</tr>
			</thead>
			<tbody>
				<tr data-testid="compare-kiez-score-overall" class="border-b border-rule">
					<th scope="row" class="py-2 pr-3 text-left font-sans text-sm font-semibold text-ink">
						{m.compare_kiez_score_overall_label()}
					</th>
					<td data-cell="a" class="py-2 pr-3">
						{#if overallA && scoreA?.overall !== undefined}
							<ValueChip
								severity={overallA.severity}
								value={`${overallA.label} (${Math.round(scoreA.overall)}/100)`}
								layerName={m.compare_kiez_score_overall_layername()}
								severityDescriptions={chipSeverityDescriptions}
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
								layerName={m.compare_kiez_score_overall_layername()}
								severityDescriptions={chipSeverityDescriptions}
							/>
						{:else}
							<span class="font-mono text-xs text-ink-subtle">—</span>
						{/if}
					</td>
				</tr>
				{#each rows as row (row.dim)}
					<tr data-testid={`compare-kiez-score-dim-${row.dim}`}>
						<th scope="row" class="py-2 pr-3 text-left font-sans text-sm font-medium text-ink">
							{row.label}
						</th>
						<td data-cell="a" class="py-2 pr-3">
							{#if row.scaleA && row.valueA !== null}
								<ValueChip
									severity={row.scaleA.severity}
									value={`${row.scaleA.label} (${Math.round(row.valueA)})`}
									layerName={row.label}
									severityDescriptions={chipSeverityDescriptions}
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
									severityDescriptions={chipSeverityDescriptions}
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
				href={localizedHref(methodikHref)}
				data-testid="compare-kiez-score-methodik-link"
				class="hover:text-accent-strong inline-block font-mono text-xs text-accent underline underline-offset-2"
			>
				{m.inspector_kiez_score_methodik_link()}
			</a>
		</div>
	</section>
{/if}
