<!--
	Story Home-Modernize: Live-KiezScoreRing eines Featured-Kiez auf der Landing.

	Prerender-safe + leicht: KiezScoreRing zieht `layerchart` (~227 KB gzip), darum NICHT statisch
	importiert, sondern erst per IntersectionObserver beim Scrollen dynamisch geladen (code-split).
	Beim Prerender / vor dem Sichtbarwerden rendert ein leichter Platzhalter (Score-Zahl) → die
	Landing bleibt statisch prerendert und schnell, der Ring kommt rein client-seitig dazu.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';
	import { ArrowUpRight } from '@lucide/svelte';
	import type { HomeFeaturedScore } from '../../../routes/(with-header)/+page.server.js';
	import type { KiezScore } from '$lib/data';

	interface Props {
		readonly featured: HomeFeaturedScore | null;
	}
	const { featured }: Props = $props();

	let host = $state<HTMLElement | null>(null);
	let Ring = $state<Component<{ score: KiezScore; layerName?: string }> | null>(null);

	const score = $derived<KiezScore | null>(
		featured
			? {
					persona: 'allgemein',
					dimensions: [
						{
							dimension: 'ruhe-luft',
							value: featured.ruheLuft,
							sources: [],
							missingData: [],
							dataStand: null
						},
						{
							dimension: 'gruen-hitze',
							value: featured.gruenHitze,
							sources: [],
							missingData: [],
							dataStand: null
						},
						{
							dimension: 'mobilitaet',
							value: featured.mobilitaet,
							sources: [],
							missingData: [],
							dataStand: null
						},
						{
							dimension: 'versorgung',
							value: featured.versorgung,
							sources: [],
							missingData: [],
							dataStand: null
						},
						{
							dimension: 'wohnschutz',
							value: featured.wohnschutz,
							sources: [],
							missingData: [],
							dataStand: null
						}
					],
					...(featured.composite !== null ? { overall: featured.composite } : {}),
					missingDimensions: []
				}
			: null
	);

	onMount(() => {
		if (!host || !featured) return;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					io.disconnect();
					void import('$lib/components/atlas/charts/kiez-score-ring.svelte').then((m) => {
						Ring = m.default as unknown as Component<{ score: KiezScore; layerName?: string }>;
					});
				}
			},
			{ rootMargin: '200px' }
		);
		io.observe(host);
		return () => io.disconnect();
	});
</script>

{#if featured && score}
	<div
		bind:this={host}
		data-testid="home-featured-score"
		class="flex flex-col items-center gap-3 text-center"
	>
		{#if Ring}
			<Ring {score} layerName={featured.displayName} />
		{:else}
			<div
				class="flex flex-col items-center justify-center"
				data-testid="home-featured-score-placeholder"
				aria-hidden="true"
			>
				<span class="font-mono text-xs tracking-wide text-ink-subtle uppercase">Gesamt</span>
				<span class="font-mono text-5xl leading-none font-semibold text-ink"
					>{Math.round(featured.composite ?? 0)}</span
				>
				<span class="font-mono text-xs text-ink-subtle">/ 100</span>
			</div>
		{/if}
		<a
			href={featured.exploreHref}
			class="inline-flex items-center gap-1 font-mono text-xs tracking-wider text-accent uppercase hover:text-ink"
		>
			{featured.displayName} auf der Karte
			<ArrowUpRight size={14} aria-hidden="true" />
		</a>
	</div>
{/if}
