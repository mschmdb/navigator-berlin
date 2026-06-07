<!--
	Story 11.4: Score-Dimensionen im Vergleich (Kiez ↔ Bezirk-Schnitt ↔ Berlin-Median)
	plus Rang/Quartil. Reine Präsentation; Daten aus kiez_comparison/bezirk_comparison
	(get-*-comparison) + kiez_rank/bezirk_rank (get-*-rank). A11y: Werte als Text,
	Rang anti-stigma-formatiert (formatRank), keine Farb-only-Signale.
-->
<script lang="ts">
	import { formatRank } from '$lib/data/rank-format.js';
	import type { ComparisonDimRow } from '$lib/data/comparison-types.js';

	interface Props {
		readonly rows: readonly ComparisonDimRow[];
		/** Kiez-Seite zeigt die Bezirk-Schnitt-Spalte; Bezirk-Seite nicht. */
		readonly showBezirkColumn?: boolean;
		/** Spaltentitel für den ersten Wert (z. B. „Kiez" oder „Bezirk"). */
		readonly valueLabel?: string;
	}

	const { rows, showBezirkColumn = false, valueLabel = 'Wert' }: Props = $props();

	// Section nur zeigen, wenn mindestens ein Wert vorliegt (kein leerer „–"-Block
	// bei fehlender DB im Build).
	const hasData = $derived(rows.some((r) => r.value !== null && r.value !== undefined));

	function fmt(v: number | null | undefined): string {
		if (v === null || v === undefined || !Number.isFinite(v)) return '–';
		return Math.round(v).toString();
	}
</script>

{#if rows.length > 0 && hasData}
	<section aria-labelledby="vergleich-heading" class="space-y-4" data-testid="score-comparison">
		<h2 id="vergleich-heading" class="font-serif text-2xl text-ink">Im Vergleich</h2>
		<div class="overflow-x-auto">
			<table class="w-full font-sans text-base">
				<thead>
					<tr class="border-b border-rule text-left">
						<th scope="col" class="py-2 pr-4 font-semibold">Dimension</th>
						<th scope="col" class="py-2 pr-4 text-right font-semibold">{valueLabel}</th>
						{#if showBezirkColumn}
							<th scope="col" class="py-2 pr-4 text-right font-semibold">Bezirk-Ø</th>
						{/if}
						<th scope="col" class="py-2 pr-4 text-right font-semibold">Berlin</th>
						<th scope="col" class="py-2 text-left font-semibold">Rang</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.label)}
						<tr class="border-b border-rule">
							<th scope="row" class="py-3 pr-4 text-left font-semibold text-ink">{row.label}</th>
							<td class="py-3 pr-4 text-right text-ink">{fmt(row.value)}</td>
							{#if showBezirkColumn}
								<td class="py-3 pr-4 text-right text-ink-muted">{fmt(row.bezirkMean)}</td>
							{/if}
							<td class="py-3 pr-4 text-right text-ink-muted">{fmt(row.berlinMedian)}</td>
							<td class="py-3 text-left font-mono text-xs text-ink-muted">
								{formatRank(row.rang, row.quartil, row.total)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="font-mono text-xs text-ink-subtle">
			{#if showBezirkColumn}
				Werte 0–100. Bezirk-Ø = Mittel der Kieze im Bezirk, Berlin = Median aller Kieze.
			{:else}
				Werte 0–100. Berlin = Median aller Bezirke.
			{/if}
		</p>
	</section>
{/if}
