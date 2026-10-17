<!--
	Saisonaler Kälte-Teaser auf der Home-Landing. Vererbt Link-Authority der
	Startseite an die Kälte-Landing (/kaelte) und den Warme-Orte-Layer.
	`compact` blendet die Lead aus (Teaser steht dann unter dem Saison-Teaser).
-->
<script lang="ts">
	import { ctaPrimary, ctaSecondary } from './internal/cta.js';
	import { Flame } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { buildExplorerDeepLink } from '$lib/utils/url-state.js';

	let { compact = false }: { compact?: boolean } = $props();

	const explorerLink = buildExplorerDeepLink(['waerme-orte'], 'kaelte');
</script>

<section data-testid="home-kaelte-teaser" class={compact ? 'space-y-4' : 'space-y-6'}>
	<header class="space-y-2">
		<h2 class={compact ? 'text-xl font-bold text-ink' : 'text-2xl font-bold text-ink md:text-3xl'}>
			{m.home_kaelte_heading()}
		</h2>
		{#if !compact}
			<p data-testid="home-kaelte-teaser-lead" class="max-w-prose text-base text-ink-muted">
				{m.home_kaelte_lead()}
			</p>
		{/if}
	</header>

	<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
		<a href={localizedHref('/kaelte')} data-testid="home-kaelte-teaser-landing" class={ctaPrimary}>
			<Flame size={16} aria-hidden="true" />
			{m.home_kaelte_cta_landing()}
		</a>
		<a href={localizedHref(explorerLink)} data-testid="home-kaelte-teaser-map" class={ctaSecondary}>
			{m.home_kaelte_cta_map()}
		</a>
	</div>
</section>
