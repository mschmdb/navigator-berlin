<!--
	Saisonaler Hitze-Teaser auf der Home-Landing. Vererbt Link-Authority der
	Startseite an die Kühle-Orte-Landing (/hitze) und den Layer.
-->
<script lang="ts">
	import { ArrowRight, Snowflake } from '@lucide/svelte';
	import { buildExplorerDeepLink } from '$lib/utils/url-state.js';

	const explorerLink = `${buildExplorerDeepLink(['kuehle-orte'])}&mode=hitze`;
</script>

<section data-testid="home-hitze-teaser" class="space-y-6">
	<header class="space-y-2">
		<p class="font-mono text-xs tracking-wider text-accent uppercase">Neu · bei Hitze</p>
		<h2 class="font-serif text-2xl text-ink md:text-3xl">Kühle Orte in Berlin</h2>
		<p class="max-w-prose font-serif text-base text-ink-muted">
			Über 500 kühle Orte bei Hitze: Kinos, Bibliotheken, Schwimmhallen, Museen, Malls und
			Trinkbrunnen. Mit Adresse, Live-Status und Weg dorthin. Ein Angebot auf offenen Daten.
		</p>
	</header>

	<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
		<a
			href="/hitze"
			data-testid="home-hitze-teaser-landing"
			class="inline-flex items-center gap-2 rounded border border-accent bg-accent px-4 py-2 font-mono text-sm tracking-wider text-bg uppercase hover:border-ink hover:bg-ink"
		>
			<Snowflake size={16} aria-hidden="true" />
			Hitze-Navigator öffnen
		</a>
		<a
			href={explorerLink}
			data-testid="home-hitze-teaser-map"
			class="inline-flex items-center gap-2 font-mono text-sm tracking-wider text-accent uppercase hover:text-ink"
		>
			Direkt zur Karte
			<ArrowRight size={14} aria-hidden="true" />
		</a>
	</div>
</section>
