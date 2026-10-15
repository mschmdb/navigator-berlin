<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import KiezHero from '$lib/components/atlas/kiez-hero.svelte';
	import KeyFigureTiles from '$lib/components/atlas/key-figure-tiles.svelte';
	import KiezDetails from '$lib/components/atlas/kiez-details.svelte';
	import KiezNeighbors from '$lib/components/atlas/kiez-neighbors.svelte';
	import OverviewLinks from '$lib/components/atlas/overview-links.svelte';
	import Breadcrumb from '$lib/components/atlas/breadcrumb.svelte';
	import ScoreRankLink from '$lib/components/atlas/score-rank-link.svelte';
	import { buildAdministrativeArea } from '$lib/seo/jsonld-administrative-area.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { buildKiezMeta } from '$lib/seo/profile-meta.js';
	import { localizedPathname } from '$lib/seo/canonical.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import type { PageData } from './$types';

	interface Props {
		readonly data: PageData;
	}

	const { data }: Props = $props();

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);
	const slug = $derived(data.profile.slug);
	const name = $derived(data.profile.name);
	const bezirkName = $derived(data.profile.bezirk);
	const bezirkSlug = $derived(data.bezirkSlug);
	const ogImagePath = $derived(`/og/kiez/${slug}.png`);
	const ogImageAbsolute = $derived(`${origin}${ogImagePath}`);

	const locale = $derived(getLocale());
	const localeOpts = $derived({ locale });
	// i18n Block D1: Place/AdministrativeArea/Breadcrumb folgen der Seiten-Locale.
	const jsonLdLocaleInput = $derived({
		locale,
		propertyNames: {
			einwohner: m.jsonld_property_einwohner(undefined, localeOpts),
			flaecheHa: m.jsonld_property_flaeche_ha(undefined, localeOpts)
		}
	});

	const meta = $derived(
		buildKiezMeta({
			name,
			bezirk: bezirkName,
			einwohner: data.profile.einwohner,
			flaecheHa: data.profile.flaecheHa,
			stichtag: data.einwohnerStichtag,
			score: data.score?.composite ?? null,
			rang: data.compositeRank.rang,
			quartil: data.compositeRank.quartil,
			total: data.compositeRank.total,
			locale
		})
	);
	const pageTitle = $derived(meta.title);
	const pageDescription = $derived(meta.description);

	const ogImageAlt = $derived(
		bezirkName.length > 0
			? m.kiez_page_og_alt_with_bezirk({ name, bezirk: bezirkName }, localeOpts)
			: m.kiez_page_og_alt_no_bezirk({ name }, localeOpts)
	);

	const adminAreaJsonLd = $derived(
		buildAdministrativeArea({
			origin,
			name,
			centroid: data.profile.centroid,
			containedInPlaceName: bezirkName.length > 0 ? bezirkName : undefined,
			containedInCity: bezirkName.length === 0,
			containedInPlaceRef:
				bezirkName.length > 0 && bezirkSlug
					? { slug: bezirkSlug, urlBasePath: '/bezirk' }
					: undefined,
			slug,
			urlBasePath: '/kiez',
			einwohner: data.profile.einwohner,
			flaecheHa: data.profile.flaecheHa,
			...jsonLdLocaleInput
		})
	);

	const breadcrumbItems = $derived.by(() => {
		const items = [{ name: 'Berlin', path: '/' }];
		if (bezirkName.length > 0 && bezirkSlug) {
			items.push({ name: bezirkName, path: `/bezirk/${bezirkSlug}` });
		}
		items.push({ name, path: `/kiez/${slug}` });
		return items;
	});
	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin,
			items: breadcrumbItems.map((item) => ({
				...item,
				path: localizedPathname(item.path, locale)
			}))
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
<JsonLd data={adminAreaJsonLd} testid="kiez-administrative-area-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="kiez-breadcrumb-jsonld" />

<div class="mx-auto max-w-3xl px-4 pt-6">
	<Breadcrumb items={breadcrumbItems} />
</div>

<article>
	<KiezHero
		profile={data.profile}
		score={data.score}
		compositeRank={data.compositeRank}
		comparison={data.comparison}
		outline={data.outline}
		einwohnerStichtag={data.einwohnerStichtag}
	/>
	<KeyFigureTiles figures={data.keyFigures} regionName={name} kind="kiez" {slug} />
	{#if data.neighbors.length > 0 || data.similar.length > 0}
		<div class="mx-auto max-w-3xl px-4 py-8">
			<KiezNeighbors neighbors={data.neighbors} similar={data.similar} />
		</div>
	{/if}
	<KiezDetails
		profile={data.profile}
		stats={data.stats}
		score={data.score}
		faq={data.faq}
		faqLocale={data.faqLocale}
		wahlVerlauf={data.wahlVerlauf}
		comparison={data.comparison}
		profileProse={data.profileProse}
		profileLocale={data.profileLocale}
	/>
</article>

<div class="mx-auto flex max-w-3xl flex-col gap-2 px-4 pb-10 font-sans text-base">
	<ScoreRankLink rang={data.compositeRank.rang} total={data.compositeRank.total} view="kieze" />
	<a
		href={localizedHref('/methodik/kiez-score')}
		class="hover:text-accent-strong text-accent underline underline-offset-2"
	>
		{m.kiez_page_methodik_link_label()} →
	</a>
	<OverviewLinks kind="kiez" {bezirkName} {bezirkSlug} />
</div>
