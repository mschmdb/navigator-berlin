<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import BezirkHero from '$lib/components/atlas/bezirk-hero.svelte';
	import BezirkKiezeList from '$lib/components/atlas/bezirk-kieze-list.svelte';
	import { buildPlace } from '$lib/seo/jsonld-place.js';
	import { buildAdministrativeArea } from '$lib/seo/jsonld-administrative-area.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { bezirkSameAs } from '$lib/seo/sources/bezirk-sameas.js';
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

	const pageTitle = $derived(`Bezirk ${name} - Berlin in Daten - navigator.berlin`);
	const numberDe = new Intl.NumberFormat('de-DE');
	const pageDescription = $derived.by(() => {
		const parts: string[] = [];
		if (data.profile.einwohner > 0) {
			parts.push(`${numberDe.format(data.profile.einwohner)} Einwohner:innen`);
		}
		if (data.profile.flaecheHa > 0) {
			parts.push(`${numberDe.format(data.profile.flaecheHa)} ha`);
		}
		const suffix = parts.length > 0 ? ` (${parts.join(', ')})` : '';
		return `Bezirk ${name}${suffix}: Kiez-Score, Lärm, Klima, Grün, Mobilität, Versorgung, Sozialstruktur. Berliner Daten-Atlas.`;
	});
	const ogImageAlt = $derived(
		`Bezirk ${name}: navigator.berlin-Karten-Vorschau mit Kiez-Score und Bezirks-Daten`
	);

	const sameAs = $derived(bezirkSameAs(slug));

	const placeJsonLd = $derived(
		buildPlace({
			origin,
			name,
			centroid: data.profile.centroid,
			containedInPlaceName: 'Berlin',
			slug,
			urlBasePath: '/bezirk',
			einwohner: data.profile.einwohner,
			flaecheHa: data.profile.flaecheHa,
			sameAs
		})
	);

	const adminAreaJsonLd = $derived(
		buildAdministrativeArea({
			origin,
			name,
			centroid: data.profile.centroid,
			containedInPlaceName: 'Berlin',
			slug,
			urlBasePath: '/bezirk',
			einwohner: data.profile.einwohner,
			flaecheHa: data.profile.flaecheHa,
			sameAs
		})
	);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name, path: `/bezirk/${slug}` }
			]
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
<JsonLd data={placeJsonLd} testid="bezirk-place-jsonld" />
<JsonLd data={adminAreaJsonLd} testid="bezirk-administrative-area-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="bezirk-breadcrumb-jsonld" />

<BezirkHero
	profile={data.profile}
	stats={data.stats}
	faq={data.faq}
	comparison={data.comparison}
	profileProse={data.profileProse}
/>
<div class="mx-auto max-w-3xl px-4 pb-8">
	<BezirkKiezeList kieze={data.kieze} bezirkName={name} />
</div>
