<script lang="ts">
	import type { LayerKiezRanking, RankingList } from '$lib/data/layer-kiez-ranking.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { trackLanding } from '$lib/utils/plausible.js';
	import { formatDecimal } from '$lib/i18n/format.js';

	interface Props {
		readonly ranking: LayerKiezRanking;
		/** Messgröße des Layers (Kurzerklärung), eingeblendet im Hinweis "ohne Wertung". */
		readonly measure?: string;
	}

	const { ranking, measure }: Props = $props();

	const locale = $derived(getLocale());

	function formatValue(value: number): string {
		const opts = { locale };
		switch (ranking.unit) {
			case 'score':
				return m.layer_ranking_value_score({ value: formatDecimal(value, opts) }, opts);
			case 'eur-m2':
				return m.layer_ranking_value_eur_m2(
					{
						value: formatDecimal(value, {
							...opts,
							minimumFractionDigits: 2,
							maximumFractionDigits: 2
						})
					},
					opts
				);
			case 'celsius':
				return m.layer_ranking_value_celsius(
					{ value: formatDecimal(value, { ...opts, maximumFractionDigits: 1 }) },
					opts
				);
			case 'percent':
				return m.layer_ranking_value_percent(
					{ value: formatDecimal(value, { ...opts, maximumFractionDigits: 1 }) },
					opts
				);
		}
	}

	const topHeading = $derived(
		ranking.variant === 'score'
			? m.layer_ranking_score_heading({ count: ranking.top.entries.length }, { locale })
			: m.layer_ranking_top_heading(undefined, { locale })
	);

	const note = $derived(
		ranking.variant === 'score'
			? null
			: measure
				? m.layer_ranking_neutral_note({ measure }, { locale })
				: m.layer_ranking_neutral_note_plain(undefined, { locale })
	);
</script>

{#snippet list(data: RankingList, heading: string, testid: string, id: string)}
	<div data-testid={testid} class="flex flex-col gap-2">
		<h3 {id} class="text-lg font-semibold text-ink">{heading}</h3>
		{#if data.entries.length > 0}
			<ol aria-labelledby={id} class="flex flex-col gap-1.5 font-sans text-base">
				{#each data.entries as entry (entry.slug)}
					<li class="flex flex-wrap items-baseline justify-between gap-x-4">
						<a
							href={localizedHref(`/kiez/${entry.slug}`)}
							onclick={() => trackLanding('ranking_link', 'layer')}
							data-testid="layer-kiez-ranking-link"
							aria-label={m.layer_ranking_link_label(
								{ name: entry.name, bezirk: entry.bezirkName, value: formatValue(entry.value) },
								{ locale }
							)}
							class="text-accent underline underline-offset-2 hover:text-accent-strong"
						>
							{entry.name}
						</a>
						<span class="text-sm text-ink-muted" aria-hidden="true">
							{entry.bezirkName}, {formatValue(entry.value)}
						</span>
					</li>
				{/each}
			</ol>
		{/if}
		{#if data.tie}
			<p data-testid="layer-kiez-ranking-more" class="text-sm text-ink-muted">
				{m.layer_ranking_more(
					{ count: data.tie.count, value: formatValue(data.tie.value) },
					{ locale }
				)}
			</p>
		{/if}
	</div>
{/snippet}

<section
	data-testid="layer-kiez-ranking"
	data-variant={ranking.variant}
	aria-labelledby="layer-kiez-ranking-h"
	class="flex flex-col gap-4 border border-rule p-4"
>
	<h2 id="layer-kiez-ranking-h" class="font-sans text-sm font-semibold text-ink-muted">
		{m.layer_ranking_heading(undefined, { locale })}
	</h2>
	{#if note}
		<p data-testid="layer-kiez-ranking-note" class="text-sm text-ink-muted">{note}</p>
	{/if}
	{@render list(ranking.top, topHeading, 'layer-kiez-ranking-top', 'layer-kiez-ranking-top-h')}
	{#if ranking.bottom}
		{@render list(
			ranking.bottom,
			m.layer_ranking_bottom_heading(undefined, { locale }),
			'layer-kiez-ranking-bottom',
			'layer-kiez-ranking-bottom-h'
		)}
	{/if}
</section>
