<!--
	Story 2.11 T1: Home-Hero auf „/".

	Phase-1 DE-only. Hardcoded Strings, Story 2.12 / 3.x migriert auf
	Paraglide. Voice: kein Marketing-Sprech, keine Floskeln, keine
	„KI-Übersetzungs"-Bauklotz-Sätze.
-->
<script lang="ts">
	import { Map as MapIcon, ListOrdered } from '@lucide/svelte';

	interface Props {
		readonly mapHref?: string;
		readonly rankingHref?: string;
	}

	const { mapHref = '/explore', rankingHref = '/umwelt-infrastruktur-score' }: Props = $props();
</script>

<section data-testid="home-hero" class="space-y-6">
	<p class="font-mono text-xs uppercase tracking-wider text-accent">
		navigator.berlin · Beta
	</p>
	<h1 class="font-serif text-4xl text-ink md:text-5xl lg:text-6xl">
		Berlin in Daten.
	</h1>
	<p class="max-w-prose font-serif text-lg leading-relaxed text-ink-muted">
		Gib eine Adresse ein. Du siehst, wie laut es dort ist, wie heiß es im
		Sommer wird, wie nah die nächste S-Bahn liegt, wie der Mietspiegel die
		Lage einordnet. Jeder Wert mit Quelle und Stand-Datum.
	</p>
	<div class="flex flex-wrap gap-3 pt-2">
		<a
			href={mapHref}
			data-testid="home-hero-cta-map"
			class="inline-flex items-center gap-2 rounded border border-accent bg-accent px-4 py-2 font-mono text-sm uppercase tracking-wider text-bg hover:bg-ink hover:border-ink"
		>
			<MapIcon size={16} aria-hidden="true" />
			Karte öffnen
		</a>
		<a
			href={rankingHref}
			data-testid="home-hero-cta-ranking"
			class="inline-flex items-center gap-2 rounded border border-rule px-4 py-2 font-mono text-sm uppercase tracking-wider text-ink hover:border-ink"
		>
			<ListOrdered size={16} aria-hidden="true" />
			Kiez-Ranking
		</a>
	</div>
</section>
