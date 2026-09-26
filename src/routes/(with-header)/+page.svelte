<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import HomeHero from '$lib/components/home/home-hero.svelte';
	import HomeHook from '$lib/components/home/home-hook.svelte';
	import HomeFinderTeaser from '$lib/components/home/home-finder-teaser.svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import HomeSteps from '$lib/components/home/home-steps.svelte';
	import HomeQuickLinks from '$lib/components/home/home-quick-links.svelte';
	import HomeLayerTeasers from '$lib/components/home/home-layer-teasers.svelte';
	import HomeTopKieze from '$lib/components/home/home-top-kieze.svelte';
	import HomeFeaturedBezirke from '$lib/components/home/home-featured-bezirke.svelte';
	import HomeOpenBlock from '$lib/components/home/home-open-block.svelte';
	import HomeUpdatesTeaser from '$lib/components/home/home-updates-teaser.svelte';
	import HomeWahlTeaser from '$lib/components/home/home-wahl-teaser.svelte';
	import HomeHitzeTeaser from '$lib/components/home/home-hitze-teaser.svelte';
	import { buildWebSite } from '$lib/seo/jsonld-website.js';
	import { localeToBcp47, resolveEffectiveLocale } from '$lib/seo/index.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import type { PageData } from './$types';

	interface Props {
		readonly data: PageData;
	}

	const { data }: Props = $props();

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);
	// i18n Block B2, Entscheidung Matze 26.09. 2A: Startseite ist als übersetzt
	// registriert -- Titel/Beschreibung folgen der effektiven Content-Locale
	// (identisch zur URL-Locale, sobald das Register-Entry greift).
	const effectiveLocale = $derived(resolveEffectiveLocale(pathname, getLocale()));
	const pageTitle = $derived(m.home_page_title(undefined, { locale: effectiveLocale }));
	const pageDescription = $derived(m.home_page_description(undefined, { locale: effectiveLocale }));
	const ogImagePath = '/og/page/home.png';
	const ogImageAbsolute = $derived(`${origin}${ogImagePath}`);
	const ogImageAlt = $derived(m.home_page_og_alt(undefined, { locale: effectiveLocale }));

	const websiteJsonLd = $derived(
		buildWebSite({
			origin,
			name: 'navigator.berlin',
			locale: localeToBcp47(effectiveLocale),
			description: pageDescription,
			searchPath: '/explore'
		})
	);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	{origin}
	{pathname}
	ogImage={ogImageAbsolute}
	{ogImageAlt}
/>
<JsonLd data={websiteJsonLd} testid="home-website-jsonld" />

<article class="mx-auto max-w-5xl space-y-16 px-4 py-12" data-testid="home-landing">
	<HomeHero featured={data.featured} />
	{#if featureFlags.kiezFinder}
		<HomeFinderTeaser />
	{/if}
	<HomeHook />
	<HomeSteps />
	<HomeQuickLinks />
	<HomeWahlTeaser wahlCount={data.wahlCount} />
	<HomeHitzeTeaser />
	<HomeFeaturedBezirke />
	<HomeTopKieze items={data.topKieze} />
	<HomeLayerTeasers layerCount={data.layerCount} />
	<HomeUpdatesTeaser items={data.updates} />
	<HomeOpenBlock />
</article>
