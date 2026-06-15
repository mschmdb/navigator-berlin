<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import HomeHero from '$lib/components/home/home-hero.svelte';
	import HomeHook from '$lib/components/home/home-hook.svelte';
	import HomeSteps from '$lib/components/home/home-steps.svelte';
	import HomeQuickLinks from '$lib/components/home/home-quick-links.svelte';
	import HomeLayerTeasers from '$lib/components/home/home-layer-teasers.svelte';
	import HomeTopKieze from '$lib/components/home/home-top-kieze.svelte';
	import HomeFeaturedBezirke from '$lib/components/home/home-featured-bezirke.svelte';
	import HomeOpenBlock from '$lib/components/home/home-open-block.svelte';
	import HomeUpdatesTeaser from '$lib/components/home/home-updates-teaser.svelte';
	import HomeWahlTeaser from '$lib/components/home/home-wahl-teaser.svelte';
	import { buildWebSite } from '$lib/seo/jsonld-website.js';
	import type { PageData } from './$types';

	interface Props {
		readonly data: PageData;
	}

	const { data }: Props = $props();

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);
	const pageTitle = 'Home - Berlin in Daten - navigator.berlin';
	const pageDescription =
		'Berliner Daten-Atlas: Lärm, Klima, Grün, Mobilität, Wohnen, Sozialstruktur und Wahlen pro Adresse.';
	const ogImagePath = '/og/page/home.png';
	const ogImageAbsolute = $derived(`${origin}${ogImagePath}`);
	const ogImageAlt = 'navigator.berlin: Berlin in Daten · Karte für Adresse, Kiez und Bezirk';

	const websiteJsonLd = $derived(
		buildWebSite({
			origin,
			name: 'navigator.berlin',
			locale: 'de-DE',
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
	locales={['de']}
/>
<JsonLd data={websiteJsonLd} testid="home-website-jsonld" />

<article class="mx-auto max-w-5xl space-y-16 px-4 py-12" data-testid="home-landing">
	<HomeHero featured={data.featured} />
	<HomeHook />
	<HomeSteps />
	<HomeQuickLinks />
	<HomeWahlTeaser />
	<HomeFeaturedBezirke />
	<HomeTopKieze items={data.topKieze} />
	<HomeLayerTeasers layerCount={data.layerCount} />
	<HomeUpdatesTeaser items={data.updates} />
	<HomeOpenBlock />
</article>
