<script lang="ts">
	import { buildPageTitle } from '$lib/seo/page-title.js';
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import HomeSearchHero from '$lib/components/home/home-search-hero.svelte';
	import HomeSeasonNote from '$lib/components/home/home-season-note.svelte';
	import HomeTasks from '$lib/components/home/home-tasks.svelte';
	import HomeTrust from '$lib/components/home/home-trust.svelte';
	import HomeUpdatesTeaser from '$lib/components/home/home-updates-teaser.svelte';
	import { buildWebSite } from '$lib/seo/jsonld-website.js';
	import { buildOrganization } from '$lib/seo/jsonld-organization.js';
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
	const pageTitle = $derived(
		buildPageTitle(m.home_page_title(undefined, { locale: effectiveLocale }))
	);
	const pageDescription = $derived(m.home_page_description(undefined, { locale: effectiveLocale }));
	const ogImagePath = '/og/page/home.png';
	const ogImageAbsolute = $derived(`${origin}${ogImagePath}`);
	const ogImageAlt = $derived(m.home_page_og_alt(undefined, { locale: effectiveLocale }));

	const websiteJsonLd = $derived(
		buildWebSite({
			origin,
			name: 'navigator.berlin',
			locale: localeToBcp47(effectiveLocale),
			description: pageDescription
		})
	);
	const organizationJsonLd = $derived(buildOrganization({ origin, description: pageDescription }));
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	{origin}
	{pathname}
	ogImage={ogImageAbsolute}
	{ogImageAlt}
/>
<JsonLd data={websiteJsonLd} testid="website-jsonld" />
<JsonLd data={organizationJsonLd} testid="organization-jsonld" />

<article class="mx-auto max-w-5xl space-y-10 px-4 py-10" data-testid="home-landing">
	<HomeSearchHero />
	<HomeSeasonNote />
	<HomeTasks />
	<!-- Platz für den späteren Data-Stories-Teaser -->
	<HomeUpdatesTeaser items={data.updates} />
	<HomeTrust />
</article>
