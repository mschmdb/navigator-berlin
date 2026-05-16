<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import HomeHero from '$lib/components/home/home-hero.svelte';
	import HomeLayerTeasers from '$lib/components/home/home-layer-teasers.svelte';
	import HomeTopKieze from '$lib/components/home/home-top-kieze.svelte';
	import HomeFeaturedBezirke from '$lib/components/home/home-featured-bezirke.svelte';
	import HomeOpenBlock from '$lib/components/home/home-open-block.svelte';
	import HomeUpdatesTeaser from '$lib/components/home/home-updates-teaser.svelte';
	import HomeConsultingCta from '$lib/components/home/home-consulting-cta.svelte';
	import { buildWebSite } from '$lib/seo/jsonld-website.js';
	import type { PageData } from './$types';

	interface Props {
		readonly data: PageData;
	}

	const { data }: Props = $props();

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);
	const pageTitle = 'navigator.berlin · Berliner Datenlagen, zusammengelegt';
	const pageDescription =
		'Berliner Adress-, Kiez- und Bezirks-Daten zu Lärm, Klima, Grün, Mobilität, Wohnen und Sozialer Lage. Offene Senats-Daten, nachvollziehbar aggregiert.';
	const ogImagePath = '/og-default.png';
	const ogImageAbsolute = $derived(`${origin}${ogImagePath}`);

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
	locales={['de']}
/>
<JsonLd data={websiteJsonLd} testid="home-website-jsonld" />

<article class="mx-auto max-w-3xl space-y-14 px-4 py-10" data-testid="home-landing">
	<HomeHero />
	<HomeLayerTeasers />
	<HomeTopKieze items={data.topKieze} />
	<HomeFeaturedBezirke />
	<HomeUpdatesTeaser items={data.updates} />
	<HomeOpenBlock />
	<HomeConsultingCta />
</article>
