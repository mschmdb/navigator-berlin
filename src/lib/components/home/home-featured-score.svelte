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
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import type { HomeFeaturedScore } from '../../../routes/(with-header)/+page.server.js';
	import type { KiezScore, KiezScoreDimension } from '$lib/data';

	interface Props {
		readonly featured: HomeFeaturedScore | null;
	}
	const { featured }: Props = $props();

	type RingProps = {
		score: KiezScore;
		layerName?: string;
		overallLabel?: string;
		noDataLabel?: string;
		dimensionLabels?: Partial<Record<KiezScoreDimension, string>>;
	};

	// i18n Block B2: KiezScoreRing ist ein geteilter Baustein mit DE-Defaults;
	// die (übersetzt registrierte) Startseite übergibt ihre eigenen Labels.
	const ringDimensionLabels = {
		'ruhe-luft': m.home_featured_score_dim_ruhe_luft(),
		'gruen-hitze': m.home_featured_score_dim_gruen_hitze(),
		mobilitaet: m.home_featured_score_dim_mobilitaet(),
		versorgung: m.home_featured_score_dim_versorgung(),
		wohnschutz: m.home_featured_score_dim_wohnschutz()
	};

	let host = $state<HTMLElement | null>(null);
	let Ring = $state<Component<RingProps> | null>(null);

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
						Ring = m.default as unknown as Component<RingProps>;
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
			<Ring
				{score}
				layerName={featured.displayName}
				overallLabel={m.home_featured_score_overall_label()}
				noDataLabel={m.home_featured_score_no_data_label()}
				dimensionLabels={ringDimensionLabels}
			/>
		{:else}
			<div
				class="flex flex-col items-center justify-center"
				data-testid="home-featured-score-placeholder"
				aria-hidden="true"
			>
				<span class="font-mono text-xs tracking-wide text-ink-subtle uppercase"
					>{m.home_featured_score_overall_label()}</span
				>
				<span class="font-mono text-5xl leading-none font-semibold text-ink"
					>{Math.round(featured.composite ?? 0)}</span
				>
				<span class="font-mono text-xs text-ink-subtle">/ 100</span>
			</div>
		{/if}
		<a
			href={localizedHref(featured.exploreHref)}
			class="inline-flex items-center gap-1 font-mono text-xs tracking-wider text-accent uppercase hover:text-ink"
		>
			{m.home_featured_score_link_label({ name: featured.displayName })}
			<ArrowUpRight size={14} aria-hidden="true" />
		</a>
	</div>
{/if}
