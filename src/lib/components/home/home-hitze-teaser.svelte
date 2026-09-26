<!--
	Saisonaler Hitze-Teaser auf der Home-Landing. Vererbt Link-Authority der
	Startseite an die Kühle-Orte-Landing (/hitze) und den Layer.
-->
<script lang="ts">
	import { ArrowRight, Snowflake } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { buildExplorerDeepLink } from '$lib/utils/url-state.js';

	const explorerLink = `${buildExplorerDeepLink(['kuehle-orte'])}&mode=hitze`;
</script>

<section data-testid="home-hitze-teaser" class="space-y-6">
	<header class="space-y-2">
		<p class="font-mono text-xs tracking-wider text-accent uppercase">{m.home_hitze_eyebrow()}</p>
		<h2 class="font-serif text-2xl text-ink md:text-3xl">{m.home_hitze_heading()}</h2>
		<p class="max-w-prose font-serif text-base text-ink-muted">
			{m.home_hitze_lead()}
		</p>
	</header>

	<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
		<a
			href={localizedHref('/hitze')}
			data-testid="home-hitze-teaser-landing"
			class="inline-flex items-center gap-2 rounded border border-accent bg-accent px-4 py-2 font-mono text-sm tracking-wider text-bg uppercase hover:border-ink hover:bg-ink"
		>
			<Snowflake size={16} aria-hidden="true" />
			{m.home_hitze_cta_landing()}
		</a>
		<a
			href={localizedHref(explorerLink)}
			data-testid="home-hitze-teaser-map"
			class="inline-flex items-center gap-2 font-mono text-sm tracking-wider text-accent uppercase hover:text-ink"
		>
			{m.home_hitze_cta_map()}
			<ArrowRight size={14} aria-hidden="true" />
		</a>
	</div>
</section>
