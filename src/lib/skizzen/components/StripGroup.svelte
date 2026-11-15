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
		readonly markers: readonly { value: number | null; label: string; strong?: boolean }[];
		readonly neutral?: boolean;
		readonly note?: string;
	}

	interface Props {
		rows: readonly StripRow[];
		ownSlug: string | null;
		highlight?: ReadonlySet<string>;
		labelSlugs?: readonly string[];
		refSlug: string | null;
		onpick?: (slug: string) => void;
	}
	let { rows, ownSlug, highlight, labelSlugs, refSlug, onpick }: Props = $props();
</script>

<div class="flex flex-col gap-4">
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
				markers={row.markers}
				neutral={row.neutral}
				{ownSlug}
				{highlight}
				{labelSlugs}
				{refSlug}
				{onpick}
			/>
			{#if row.note}<p class="text-dense-label text-ink-subtle">{row.note}</p>{/if}
		</div>
	{/each}
</div>
