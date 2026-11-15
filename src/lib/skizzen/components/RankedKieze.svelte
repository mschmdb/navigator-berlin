<script lang="ts">
	import { flip } from 'svelte/animate';
	import { resolve } from '$app/paths';
	import { dimLabel, formatScore } from '../labels';
	import { rankOf } from '../stats';
	import type { Dim, RegionSnapshot } from '../types';
	import { prefersReducedMotion } from './motion.svelte';

	interface Props {
		kieze: readonly RegionSnapshot[];
		/** Alle Kieze Berlins, für den Rang. */
		all: readonly RegionSnapshot[];
		dims: readonly Dim[];
		dim: Dim;
		berlinMedian: number | null;
	}
	let { kieze, all, dims, dim = $bindable(), berlinMedian }: Props = $props();

	// Ungerundet sortieren, Gleichstand nach Name: 57,4 steht immer vor 56,9.
	const sorted = $derived(
		[...kieze].sort(
			(a, b) =>
				(b.dims[dim] ?? -Infinity) - (a.dims[dim] ?? -Infinity) ||
				a.name.localeCompare(b.name, 'de')
		)
	);
	const values = $derived(all.map((r) => r.dims[dim]));
	const duration = $derived(prefersReducedMotion() ? 0 : 450);
</script>

<label class="mb-4 flex flex-wrap items-center gap-2 text-sm text-ink">
	Sortieren nach
	<select
		bind:value={dim}
		class="min-h-8 rounded border border-rule-strong bg-bg-elevated px-2 text-sm"
	>
		{#each dims as d (d)}<option value={d}>{dimLabel(d)}</option>{/each}
	</select>
</label>

<ol class="flex flex-col" aria-label="Kieze nach {dimLabel(dim)}">
	{#each sorted as k (k.slug)}
		{@const v = k.dims[dim]}
		{@const rk = rankOf(v, values)}
		<li
			animate:flip={{ duration }}
			class="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_2.5rem] items-center gap-3 border-b border-rule py-1.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_2.5rem_6.5rem]"
		>
			<a
				href={resolve('/demo/kiez-skizze/[slug]', { slug: k.slug })}
				class="truncate text-sm text-ink underline-offset-2 hover:text-accent hover:underline"
				>{k.name}</a
			>
			<span class="relative h-3" aria-hidden="true">
				<span
					class="absolute inset-y-0 left-0 rounded-r-sm bg-accent transition-[width] duration-500 motion-reduce:transition-none"
					style:width="{v ?? 0}%"
				></span>
				{#if berlinMedian !== null}
					<span
						class="absolute -inset-y-1 w-0.5 bg-ink"
						style:left="{berlinMedian}%"
						title="Berlin-Median"
					></span>
				{/if}
			</span>
			<span class="text-right text-sm text-ink tabular-nums">{formatScore(v)}</span>
			<span class="hidden text-right text-dense-label text-ink-subtle tabular-nums sm:block"
				>{dim === 'kriminalitaet' ? 'ohne Rang' : rk ? `Platz ${rk.rang}` : '–'}</span
			>
		</li>
	{/each}
</ol>
<p class="mt-2 flex items-center gap-2 text-dense-label text-ink-subtle">
	<span class="inline-block h-3 w-0.5 bg-ink"></span> Berlin-Median aller {all.length} Kieze. Platz unter
	allen {all.length} Kiezen.
</p>
