<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import KiezHero from '$lib/components/atlas/kiez-hero.svelte';
	import KiezSiblingsList from '$lib/components/atlas/kiez-siblings-list.svelte';
	import Breadcrumb from '$lib/components/atlas/breadcrumb.svelte';
	import ScoreRankLink from '$lib/components/atlas/score-rank-link.svelte';
	import { buildPlace } from '$lib/seo/jsonld-place.js';
	import { buildAdministrativeArea } from '$lib/seo/jsonld-administrative-area.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { normalizeSlug } from '$lib/data/internal/slug.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { formatCount } from '$lib/i18n/format.js';
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
	const bezirkSlug = $derived(bezirkName ? normalizeSlug(bezirkName) : null);
	const ogImagePath = $derived(`/og/kiez/${slug}.png`);
	const ogImageAbsolute = $derived(`${origin}${ogImagePath}`);

	const localeOpts = $derived({ locale: getLocale() });

	const pageTitle = $derived(
		bezirkName.length > 0
			? m.kiez_page_title_with_bezirk({ name, bezirk: bezirkName }, localeOpts)
			: m.kiez_page_title_no_bezirk({ name }, localeOpts)
	);

	const pageDescription = $derived.by(() => {
		const parts: string[] = [];
		if (data.profile.einwohner > 0) {
			parts.push(
				m.profile_lead_einwohner({ count: formatCount(data.profile.einwohner, localeOpts) })
			);
		}
		if (data.profile.flaecheHa > 0) {
			parts.push(m.profile_lead_flaeche({ ha: formatCount(data.profile.flaecheHa, localeOpts) }));
		}
		const suffix = parts.length > 0 ? ` (${parts.join(', ')})` : '';
		const bezirkPart =
			bezirkName.length > 0 ? m.kiez_page_description_bezirk_part({ bezirk: bezirkName }) : '';
		return m.profile_page_description({ subject: `Kiez ${name}`, bezirkPart, suffix }, localeOpts);
	});

	const ogImageAlt = $derived(
		bezirkName.length > 0
			? m.kiez_page_og_alt_with_bezirk({ name, bezirk: bezirkName }, localeOpts)
			: m.kiez_page_og_alt_no_bezirk({ name }, localeOpts)
	);

	const placeJsonLd = $derived(
		buildPlace({
			origin,
			name,
			centroid: data.profile.centroid,
			containedInPlaceName: bezirkName.length > 0 ? bezirkName : 'Berlin',
			slug,
			urlBasePath: '/kiez',
			einwohner: data.profile.einwohner,
			flaecheHa: data.profile.flaecheHa
		})
	);

	const adminAreaJsonLd = $derived(
		buildAdministrativeArea({
			origin,
			name,
			centroid: data.profile.centroid,
			containedInPlaceName: bezirkName.length > 0 ? bezirkName : 'Berlin',
			slug,
			urlBasePath: '/kiez',
			einwohner: data.profile.einwohner,
			flaecheHa: data.profile.flaecheHa
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
	const breadcrumbJsonLd = $derived(buildBreadcrumbList({ origin, items: breadcrumbItems }));
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	{origin}
	{pathname}
	ogImage={ogImageAbsolute}
	{ogImageAlt}
/>
<JsonLd data={placeJsonLd} testid="kiez-place-jsonld" />
<JsonLd data={adminAreaJsonLd} testid="kiez-administrative-area-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="kiez-breadcrumb-jsonld" />

<div class="mx-auto max-w-3xl px-4 pt-6">
	<Breadcrumb items={breadcrumbItems} />
</div>

<KiezHero
	profile={data.profile}
	stats={data.stats}
	score={data.score}
	faq={data.faq}
	wahlVerlauf={data.wahlVerlauf}
	comparison={data.comparison}
	profileProse={data.profileProse}
/>

{#if bezirkName.length > 0}
	<div class="mx-auto max-w-3xl px-4 pb-8">
		<KiezSiblingsList siblings={data.siblings} parentBezirkName={bezirkName} />
	</div>
{/if}

<div class="mx-auto flex max-w-3xl flex-col gap-2 px-4 pb-10 font-sans text-base">
	<ScoreRankLink rang={data.compositeRank.rang} total={data.compositeRank.total} view="kieze" />
	<a
		href={localizedHref('/methodik/kiez-score')}
		class="hover:text-accent-strong text-accent underline underline-offset-2"
	>
		{m.kiez_page_methodik_link_label()} →
	</a>
</div>
