<!--
	Story 2.11 T1: Home-Hero auf „/".

	Phase-1 DE-only. Hardcoded Strings, Story 2.12 / 3.x migriert auf
	Paraglide. Voice: kein Marketing-Sprech, keine Floskeln, keine
	„KI-Übersetzungs"-Bauklotz-Sätze.
-->
<script lang="ts">
	import { Map as MapIcon, ListOrdered } from '@lucide/svelte';
	import HomeFeaturedScore from './home-featured-score.svelte';
	import type { HomeFeaturedScore as HomeFeaturedScoreData } from '../../../routes/(with-header)/+page.server.js';

	interface Props {
		readonly mapHref?: string;
		readonly rankingHref?: string;
		readonly featured?: HomeFeaturedScoreData | null;
	}

	const {
		mapHref = '/explore',
		rankingHref = '/umwelt-infrastruktur-score',
		featured = null
	}: Props = $props();
</script>

<section
	data-testid="home-hero"
	class="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-12"
>
	<div class="space-y-6">
		<p class="font-mono text-xs tracking-wider text-accent uppercase">navigator.berlin · Beta</p>
		<h1 class="font-serif text-4xl text-ink md:text-5xl lg:text-6xl">Berlin in Daten.</h1>
		<p class="max-w-prose font-serif text-lg leading-relaxed text-ink-muted">
			Gib eine Adresse ein. Du siehst, wie laut es dort ist, wie heiß es im Sommer wird, wie nah die
			nächste S-Bahn liegt. Zusammengefasst zu einem Kiez-Score aus fünf Dimensionen.
		</p>
		<div class="flex flex-wrap gap-3 pt-2">
			<a
				href={mapHref}
				data-testid="home-hero-cta-map"
				class="inline-flex items-center gap-2 rounded border border-accent bg-accent px-4 py-2 font-mono text-sm tracking-wider text-bg uppercase hover:border-ink hover:bg-ink"
			>
				<MapIcon size={16} aria-hidden="true" />
				Karte öffnen
			</a>
			<a
				href={rankingHref}
				data-testid="home-hero-cta-ranking"
				class="inline-flex items-center gap-2 rounded border border-rule px-4 py-2 font-mono text-sm tracking-wider text-ink uppercase hover:border-ink"
			>
				<ListOrdered size={16} aria-hidden="true" />
				Kiez-Ranking
			</a>
		</div>
	</div>
	{#if featured}
		<HomeFeaturedScore {featured} />
	{/if}
</section>
