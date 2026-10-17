<!--
	Saisonaler Kälte-Teaser auf der Home-Landing. Vererbt Link-Authority der
	Startseite an die Kälte-Landing (/kaelte) und den Warme-Orte-Layer.
	`compact` blendet die Lead aus (Teaser steht dann unter dem Saison-Teaser).
-->
<script lang="ts">
	import { ArrowRight, Flame } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { buildExplorerDeepLink } from '$lib/utils/url-state.js';

	let { compact = false }: { compact?: boolean } = $props();

	const explorerLink = buildExplorerDeepLink(['waerme-orte'], 'kaelte');
</script>

<section data-testid="home-kaelte-teaser" class={compact ? 'space-y-4' : 'space-y-6'}>
	<header class="space-y-2">
		{#if !compact}
			<p
				data-testid="home-kaelte-teaser-eyebrow"
				class="font-mono text-xs tracking-wider text-accent uppercase"
			>
				{m.home_kaelte_eyebrow()}
			</p>
		{/if}
		<h2
			class={compact ? 'font-serif text-xl text-ink' : 'font-serif text-2xl text-ink md:text-3xl'}
		>
			{m.home_kaelte_heading()}
		</h2>
		{#if !compact}
			<p
				data-testid="home-kaelte-teaser-lead"
				class="max-w-prose font-serif text-base text-ink-muted"
			>
				{m.home_kaelte_lead()}
			</p>
		{/if}
	</header>

	<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
		<a
			href={localizedHref('/kaelte')}
			data-testid="home-kaelte-teaser-landing"
			class="inline-flex items-center gap-2 rounded border border-accent bg-accent px-4 py-2 font-mono text-sm tracking-wider text-bg uppercase hover:border-ink hover:bg-ink"
		>
			<Flame size={16} aria-hidden="true" />
			{m.home_kaelte_cta_landing()}
		</a>
		<a
			href={localizedHref(explorerLink)}
			data-testid="home-kaelte-teaser-map"
			class="inline-flex items-center gap-2 font-mono text-sm tracking-wider text-accent uppercase hover:text-ink"
		>
			{m.home_kaelte_cta_map()}
			<ArrowRight size={14} aria-hidden="true" />
		</a>
	</div>
</section>
