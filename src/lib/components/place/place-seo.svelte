<!--
	SEO wie auf den Live-Seiten, mit denselben Helfern (Titel aus PR #213 unverändert):
	SeoHead (Titel, Beschreibung, canonical, hreflang, OG-Bild), JSON-LD AdministrativeArea und
	BreadcrumbList, sichtbare Brotkrumen. canonical auf die eigene Seite.
-->
<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import Breadcrumb from '$lib/components/atlas/breadcrumb.svelte';
	import { buildAdministrativeArea } from '$lib/seo/jsonld-administrative-area.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { buildBezirkMeta, buildKiezMeta } from '$lib/seo/profile-meta.js';
	import { localizedPathname } from '$lib/seo/canonical.js';
	import { bezirkSameAs } from '$lib/seo/sources/bezirk-sameas.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';

	interface Props {
		kind: 'kiez' | 'bezirk';
		slug: string;
		name: string;
		bezirkName?: string | null;
		bezirkSlug?: string | null;
		centroid: [number, number];
		einwohner: number;
		flaecheHa: number;
		stichtag: string | null;
		score: number | null;
		rank: { rang: number | null; quartil: number | null; total: number };
	}
	let p: Props = $props();

	const origin = $derived(page.url.origin);
	const locale = $derived(getLocale());
	const opts = $derived({ locale });
	const pagePath = $derived(`/${p.kind}/${p.slug}`);
	const meta = $derived(
		p.kind === 'kiez'
			? buildKiezMeta({
					name: p.name,
					bezirk: p.bezirkName ?? '',
					einwohner: p.einwohner,
					flaecheHa: p.flaecheHa,
					stichtag: p.stichtag,
					score: p.score,
					rang: p.rank.rang,
					quartil: p.rank.quartil,
					total: p.rank.total,
					locale
				})
			: buildBezirkMeta({
					name: p.name,
					einwohner: p.einwohner,
					flaecheHa: p.flaecheHa,
					stichtag: p.stichtag,
					score: p.rank.rang === null ? null : p.score,
					rang: p.rank.rang,
					quartil: p.rank.quartil,
					total: p.rank.total,
					locale
				})
	);
	const localeInput = $derived({
		locale,
		propertyNames: {
			einwohner: m.jsonld_property_einwohner(undefined, opts),
			flaecheHa: m.jsonld_property_flaeche_ha(undefined, opts)
		}
	});
	const adminArea = $derived(
		buildAdministrativeArea({
			origin,
			name: p.name,
			centroid: p.centroid,
			...(p.kind === 'kiez'
				? {
						containedInPlaceName: p.bezirkName ?? undefined,
						containedInCity: !p.bezirkName,
						containedInPlaceRef: p.bezirkSlug
							? { slug: p.bezirkSlug, urlBasePath: '/bezirk' }
							: undefined
					}
				: { containedInCity: true, sameAs: bezirkSameAs(p.slug) }),
			slug: p.slug,
			urlBasePath: `/${p.kind}`,
			einwohner: p.einwohner,
			flaecheHa: p.flaecheHa,
			...localeInput
		})
	);
	const crumbs = $derived([
		{ name: 'Berlin', path: '/' },
		...(p.kind === 'kiez' && p.bezirkName && p.bezirkSlug
			? [{ name: p.bezirkName, path: `/bezirk/${p.bezirkSlug}` }]
			: []),
		{ name: p.name, path: pagePath }
	]);
	const breadcrumbLd = $derived(
		buildBreadcrumbList({
			origin,
			items: crumbs.map((c) => ({ ...c, path: localizedPathname(c.path, locale) }))
		})
	);
	const ogAlt = $derived(
		p.kind === 'bezirk'
			? m.bezirk_page_og_alt({ name: p.name }, opts)
			: p.bezirkName
				? m.kiez_page_og_alt_with_bezirk({ name: p.name, bezirk: p.bezirkName }, opts)
				: m.kiez_page_og_alt_no_bezirk({ name: p.name }, opts)
	);
</script>

<SeoHead
	title={meta.title}
	description={meta.description}
	{origin}
	pathname={localizedPathname(pagePath, locale)}
	ogImage={`${origin}/og/${p.kind}/${p.slug}.png`}
	ogImageAlt={ogAlt}
/>
<JsonLd data={adminArea} testid="place-administrative-area-jsonld" />
<JsonLd data={breadcrumbLd} testid="place-breadcrumb-jsonld" />
<div class="mx-auto max-w-6xl px-4 pt-6">
	<Breadcrumb items={crumbs} />
</div>
