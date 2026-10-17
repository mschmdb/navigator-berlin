<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import BezirkHero from '$lib/components/atlas/bezirk-hero.svelte';
	import KeyFigureTiles from '$lib/components/atlas/key-figure-tiles.svelte';
	import BezirkDetails from '$lib/components/atlas/bezirk-details.svelte';
	import BezirkKiezeList from '$lib/components/atlas/bezirk-kieze-list.svelte';
	import OverviewLinks from '$lib/components/atlas/overview-links.svelte';
	import Breadcrumb from '$lib/components/atlas/breadcrumb.svelte';
	import ScoreRankLink from '$lib/components/atlas/score-rank-link.svelte';
	import { buildAdministrativeArea } from '$lib/seo/jsonld-administrative-area.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { buildBezirkMeta } from '$lib/seo/profile-meta.js';
	import { localizedPathname } from '$lib/seo/canonical.js';
	import { bezirkSameAs } from '$lib/seo/sources/bezirk-sameas.js';
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
	const ogImagePath = $derived(`/og/bezirk/${slug}.png`);
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
		buildBezirkMeta({
			name,
			einwohner: data.profile.einwohner,
			flaecheHa: data.profile.flaecheHa,
			stichtag: data.einwohnerStichtag,
			// Score nur mit Rang aus demselben Datenstand (DB), sonst kein Score-Satz.
			score: data.compositeRank.rang === null ? null : data.bezirkComposite,
			rang: data.compositeRank.rang,
			quartil: data.compositeRank.quartil,
			total: data.compositeRank.total,
			locale
		})
	);
	const pageTitle = $derived(meta.title);
	const pageDescription = $derived(meta.description);

	const ogImageAlt = $derived(m.bezirk_page_og_alt({ name }, localeOpts));

	const sameAs = $derived(bezirkSameAs(slug));

	const adminAreaJsonLd = $derived(
		buildAdministrativeArea({
			origin,
			name,
			centroid: data.profile.centroid,
			containedInCity: true,
			slug,
			urlBasePath: '/bezirk',
			einwohner: data.profile.einwohner,
			flaecheHa: data.profile.flaecheHa,
			sameAs,
			...jsonLdLocaleInput
		})
	);

	const breadcrumbItems = $derived([
		{ name: 'Berlin', path: '/' },
		{ name, path: `/bezirk/${slug}` }
	]);
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
<JsonLd data={adminAreaJsonLd} testid="bezirk-administrative-area-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="bezirk-breadcrumb-jsonld" />

<div class="mx-auto max-w-3xl px-4 pt-6">
	<Breadcrumb items={breadcrumbItems} />
</div>

<article>
	<BezirkHero
		profile={data.profile}
		kieze={data.kiezeView.kieze}
		outline={data.kiezeView.outline}
		compositeRank={data.compositeRank}
		einwohnerStichtag={data.einwohnerStichtag}
	/>
	<div class="mx-auto max-w-3xl px-4 pb-8">
		{#key slug}
			<BezirkKiezeList kieze={data.kiezeView.kieze} bezirkName={name} />
		{/key}
	</div>
	<KeyFigureTiles figures={data.keyFigures} regionName={name} kind="bezirk" {slug} />
	<BezirkDetails
		stats={data.stats}
		faq={data.faq}
		faqLocale={data.faqLocale}
		comparison={data.comparison}
		profileProse={data.profileProse}
		profileLocale={data.profileLocale}
	/>
</article>

<div class="mx-auto flex max-w-3xl flex-col gap-2 px-4 pb-10 font-sans text-base">
	<ScoreRankLink rang={data.compositeRank.rang} total={data.compositeRank.total} view="bezirke" />
	<a
		href={localizedHref('/methodik/kiez-score')}
		class="text-accent underline underline-offset-2 hover:text-accent-strong"
	>
		{m.bezirk_page_methodik_link_label()}
	</a>
	<OverviewLinks kind="bezirk" bezirkName={name} bezirkSlug={slug} />
</div>
