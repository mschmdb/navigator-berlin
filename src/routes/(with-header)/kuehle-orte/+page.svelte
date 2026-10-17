<script lang="ts">
	import { buildPageTitle } from '$lib/seo/page-title.js';
	import { page } from '$app/state';
	import { Snowflake } from '@lucide/svelte';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import MapEmbed from '$lib/components/atlas/map-embed.svelte';
	import { BERLIN_OUTLINE } from '$lib/data/berlin-outline.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { buildExplorerDeepLink } from '$lib/utils/url-state.js';

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);

	const explorerLink = buildExplorerDeepLink(['kuehle-orte'], 'hitze');
	const pageTitle = $derived(buildPageTitle(m.kuehle_orte_page_meta_title()));
	const pageDescription = $derived(m.kuehle_orte_page_meta_description());
	const ogImagePath = '/og/page/kuehle-orte.png';
	const ogImageAbsolute = $derived(`${origin}${ogImagePath}`);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	{pathname}
	{origin}
	ogImage={ogImageAbsolute}
/>

<article data-testid="kuehle-orte-landing" class="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
	<header class="flex flex-col gap-3">
		<h1 class="flex items-center gap-2 font-sans text-3xl font-semibold text-ink">
			<Snowflake size={28} aria-hidden="true" class="shrink-0 text-umwelt-kuehle-orte" />
			{m.kuehle_orte_page_h1_title()}
		</h1>
		<p class="text-lg leading-body text-ink-muted">
			{m.kuehle_orte_page_intro_p1()}
		</p>
	</header>

	<section aria-labelledby="karte-h" class="flex flex-col gap-2">
		<h2 id="karte-h" class="sr-only">{m.kuehle_orte_page_map_heading()}</h2>
		<MapEmbed
			geometry={BERLIN_OUTLINE}
			label={m.kuehle_orte_page_map_label()}
			heightClass="h-[50vh]"
		/>
		<p class="font-sans text-sm text-ink-subtle">
			{m.kuehle_orte_page_map_hint()}
		</p>
	</section>

	<section aria-labelledby="cta-h" class="flex flex-col gap-2">
		<h2 id="cta-h" class="sr-only">{m.kuehle_orte_page_cta_heading()}</h2>
		<a
			href={localizedHref(explorerLink)}
			data-testid="explorer-cta"
			class="inline-flex min-h-11 w-fit items-center gap-2 rounded bg-accent px-5 py-3 font-sans text-base font-semibold text-bg-elevated hover:bg-accent-strong"
		>
			{m.kuehle_orte_page_cta_button()}
		</a>
		<p class="font-sans text-sm text-ink-subtle">
			{m.kuehle_orte_page_cta_hint()}
		</p>
	</section>
</article>
