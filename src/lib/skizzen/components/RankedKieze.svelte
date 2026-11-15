<script lang="ts">
	import { flip } from 'svelte/animate';
	import { resolve } from '$app/paths';
	import { dimLabel, formatScore } from '../labels';
	import type { Dim, RegionSnapshot } from '../types';
	import Legend from './Legend.svelte';
	import { prefersReducedMotion } from './motion.svelte';

	interface Props {
		/** Nur die Kieze dieses Bezirks. */
		kieze: readonly RegionSnapshot[];
		dims: readonly Dim[];
		dim: Dim;
		bezirkName: string;
		bezirkValue: number | null;
		berlinKiezMedian: number | null;
	}
	let {
		kieze,
		dims,
		dim = $bindable(),
		bezirkName,
		bezirkValue,
		berlinKiezMedian
	}: Props = $props();

	// Ungerundet sortieren, Gleichstand nach Name: 57,4 steht immer vor 56,9.
	const sorted = $derived(
		[...kieze].sort(
			(a, b) =>
				(b.dims[dim] ?? -Infinity) - (a.dims[dim] ?? -Infinity) ||
				a.name.localeCompare(b.name, 'de')
		)
	);
	const duration = $derived(prefersReducedMotion() ? 0 : 450);
</script>

<label class="mb-3 flex flex-wrap items-center gap-2 text-sm text-ink">
	Sortieren nach
	<select
		bind:value={dim}
		class="min-h-8 rounded border border-rule-strong bg-bg-elevated px-2 text-sm"
	>
		{#each dims as d (d)}<option value={d}>{dimLabel(d)}</option>{/each}
	</select>
</label>

<Legend
	items={[
		{ kind: 'value', label: `${bezirkName} als Ganzes` },
		{ kind: 'dashed', label: 'Berlin: Median aller 143 Kieze' }
	]}
/>

<ol class="flex flex-col" aria-label="Kieze in {bezirkName} nach {dimLabel(dim)}">
	{#each sorted as k, i (k.slug)}
		{@const v = k.dims[dim]}
		<li
			animate:flip={{ duration }}
			class="grid grid-cols-[1.5rem_minmax(0,10rem)_minmax(0,1fr)_2.5rem] items-center gap-3 border-b border-rule py-1.5 sm:grid-cols-[1.5rem_minmax(0,14rem)_minmax(0,1fr)_2.5rem]"
		>
			<span class="text-right text-dense-label text-ink-subtle tabular-nums">{i + 1}.</span>
			<a
				href={resolve('/demo/kiez-skizze/[slug]', { slug: k.slug })}
				class="truncate text-sm text-ink underline-offset-2 hover:text-accent hover:underline"
				>{k.name}</a
			>
			<span class="relative h-3" aria-hidden="true">
				<span
					class="absolute inset-y-0 left-0 rounded-r-sm bg-rule-strong/70 transition-[width] duration-500 motion-reduce:transition-none"
					style:width="{v ?? 0}%"
				></span>
				{#if berlinKiezMedian !== null}
					<span
						class="absolute -inset-y-1 border-l-2 border-dashed border-ink"
						style:left="{berlinKiezMedian}%"
					></span>
				{/if}
				{#if bezirkValue !== null}
					<span
						class="absolute -inset-y-1 w-[3px] bg-accent transition-[left] duration-500 motion-reduce:transition-none"
						style:left="{bezirkValue}%"
					></span>
				{/if}
			</span>
			<span class="text-right text-sm text-ink tabular-nums">{formatScore(v)}</span>
		</li>
	{/each}
</ol>
