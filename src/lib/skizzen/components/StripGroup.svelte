<script lang="ts">
	import StripChart, { type StripItem } from './StripChart.svelte';

	export interface StripRow {
		readonly key: string;
		readonly label: string;
		/** Rang oder Einordnung, rechts neben dem Namen. */
		readonly meta: string;
		readonly items: readonly StripItem[];
		readonly domain: readonly [number, number];
		readonly format: (v: number) => string;
		/** Bezugspunkt ohne eigenen Punkt, etwa „Neukölln gesamt“. */
		readonly refLine: { readonly value: number | null; readonly label: string } | null;
		readonly note?: string;
		readonly zeroName?: string;
		readonly zeroMedianLabel?: string;
	}

	interface Props {
		rows: readonly StripRow[];
		ownSlug: string | null;
		highlight: ReadonlySet<string>;
		highlightLabel: string;
		refSlug: string | null;
		medianLabel: string;
		r?: number;
		unitPlural?: string;
		onpick?: (slug: string) => void;
	}
	let {
		rows,
		ownSlug,
		highlight,
		highlightLabel,
		refSlug,
		medianLabel,
		r,
		unitPlural,
		onpick
	}: Props = $props();
</script>

<div class="flex flex-col gap-6">
	{#each rows as row (row.key)}
		<div>
			<div class="flex items-baseline justify-between gap-3 border-b border-rule pb-1">
				<span class="text-sm font-semibold text-ink">{row.label}</span>
				<span class="text-dense-label text-ink-muted tabular-nums">{row.meta}</span>
			</div>
			<StripChart
				items={row.items}
				domain={row.domain}
				format={row.format}
				refLine={row.refLine}
				{ownSlug}
				{highlight}
				{highlightLabel}
				{refSlug}
				{medianLabel}
				{r}
				{unitPlural}
				zeroName={row.zeroName}
				zeroMedianLabel={row.zeroMedianLabel}
				{onpick}
			/>
			{#if row.note}<p class="mt-1 text-dense-label text-ink-subtle">{row.note}</p>{/if}
		</div>
	{/each}
</div>
