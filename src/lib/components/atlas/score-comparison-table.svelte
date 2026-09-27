<!--
	Story 11.4: Score-Dimensionen im Vergleich (Kiez ↔ Bezirk-Schnitt ↔ Berlin-Median)
	plus Rang/Quartil. Reine Präsentation; Daten aus kiez_comparison/bezirk_comparison
	(get-*-comparison) + kiez_rank/bezirk_rank (get-*-rank). A11y: Werte als Text,
	Rang anti-stigma-formatiert (formatRank), keine Farb-only-Signale.

	i18n Block B4a: Zeilen-Label kommt jetzt aus `dimensionLabel(row.key, opts)`
	statt einem fest gelieferten DE-String (`+page.server.ts` liefert nur noch
	`key`). Die Kriminalitäts-Sonderbehandlung (Fußnote, kein Rang) erkennt die
	Zeile am `key === 'kriminalitaet'`, nicht mehr am (jetzt lokalisierten) Label.
-->
<script lang="ts">
	import { formatRank } from '$lib/data/rank-format.js';
	import { dimensionLabel } from './inspector-panel/internal/kiez-score-display.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import type { ComparisonDimRow } from '$lib/data/comparison-types.js';

	interface Props {
		readonly rows: readonly ComparisonDimRow[];
		/** Kiez-Seite zeigt die Bezirk-Schnitt-Spalte; Bezirk-Seite nicht. */
		readonly showBezirkColumn?: boolean;
		/** Spaltentitel für den ersten Wert (z. B. „Kiez" oder „Bezirk"). */
		readonly valueLabel?: string;
	}

	const { rows, showBezirkColumn = false, valueLabel }: Props = $props();

	const localeOpts = $derived({ locale: getLocale() });
	// i18n Block B4a Review-Fund: der vormalige Default `'Wert'` war fest
	// deutsch. Aufrufer, die "Kiez"/"Bezirk" übergeben (Glossar-Begriffe,
	// bleiben unverändert), sind davon nicht betroffen.
	const resolvedValueLabel = $derived(
		valueLabel ?? m.score_comparison_default_value_label(undefined, localeOpts)
	);

	// Section nur zeigen, wenn mindestens ein Wert vorliegt (kein leerer „–"-Block
	// bei fehlender DB im Build).
	const hasData = $derived(rows.some((r) => r.value !== null && r.value !== undefined));

	// Story 14.9: Kriminalität ist eine Magnitude (höher = mehr erfasste Fälle), kein Gut-Wert
	// wie die übrigen Zeilen, und ohne Rang. Fußnote klärt das auf (ADR-019).
	const isKriminalitaet = (key: ComparisonDimRow['key']): boolean => key === 'kriminalitaet';
	const hasKriminalitaet = $derived(rows.some((r) => isKriminalitaet(r.key)));

	function fmt(v: number | null | undefined): string {
		if (v === null || v === undefined || !Number.isFinite(v)) return '–';
		return Math.round(v).toString();
	}
</script>

{#if rows.length > 0 && hasData}
	<section aria-labelledby="vergleich-heading" class="space-y-4" data-testid="score-comparison">
		<h2 id="vergleich-heading" class="font-serif text-2xl text-ink">
			{m.score_comparison_heading()}
		</h2>
		<div class="overflow-x-auto">
			<table class="w-full font-sans text-base">
				<thead>
					<tr class="border-b border-rule text-left">
						<th scope="col" class="py-2 pr-4 font-semibold">{m.score_comparison_col_dimension()}</th
						>
						<th scope="col" class="py-2 pr-4 text-right font-semibold">{resolvedValueLabel}</th>
						{#if showBezirkColumn}
							<th scope="col" class="py-2 pr-4 text-right font-semibold"
								>{m.score_comparison_col_bezirk_avg()}</th
							>
						{/if}
						<th scope="col" class="py-2 pr-4 text-right font-semibold"
							>{m.score_comparison_col_berlin()}</th
						>
						<th scope="col" class="py-2 text-left font-semibold">{m.score_comparison_col_rank()}</th
						>
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.key)}
						<tr
							class="border-b border-rule"
							data-row={isKriminalitaet(row.key) ? 'kriminalitaet' : undefined}
						>
							<th scope="row" class="py-3 pr-4 text-left font-semibold text-ink">
								{dimensionLabel(row.key, localeOpts)}{#if isKriminalitaet(row.key)}<span
										aria-hidden="true"
										class="text-ink-subtle">&nbsp;*</span
									>{/if}
							</th>
							<td class="py-3 pr-4 text-right text-ink">{fmt(row.value)}</td>
							{#if showBezirkColumn}
								<td class="py-3 pr-4 text-right text-ink-muted">{fmt(row.bezirkMean)}</td>
							{/if}
							<td class="py-3 pr-4 text-right text-ink-muted">{fmt(row.berlinMedian)}</td>
							<td class="py-3 text-left font-mono text-xs text-ink-muted">
								{formatRank(row.rang, row.quartil, row.total, localeOpts)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="font-mono text-xs text-ink-subtle">
			{#if showBezirkColumn}
				{m.score_comparison_legend_with_bezirk()}
			{:else}
				{m.score_comparison_legend_bezirk_only()}
			{/if}
		</p>
		{#if hasKriminalitaet}
			<p
				class="font-serif text-xs leading-snug text-ink-muted italic"
				data-testid="kriminalitaet-footnote"
			>
				{m.score_comparison_kriminalitaet_footnote()}
				<a
					href={localizedHref('/methodik/kiez-score')}
					class="hover:text-accent-strong text-accent underline underline-offset-2"
					>{m.score_comparison_footnote_methodik_label()}</a
				>.
			</p>
		{/if}
	</section>
{/if}
