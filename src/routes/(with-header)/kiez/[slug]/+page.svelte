<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import KiezHero from '$lib/components/atlas/kiez-hero.svelte';
	import KiezSiblingsList from '$lib/components/atlas/kiez-siblings-list.svelte';
	import { buildPlace } from '$lib/seo/jsonld-place.js';
	import { buildAdministrativeArea } from '$lib/seo/jsonld-administrative-area.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { normalizeSlug } from '$lib/data/internal/slug.js';
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

	const pageTitle = $derived(
		bezirkName.length > 0
			? `Kiez ${name} (${bezirkName}) - Berlin in Daten - navigator.berlin`
			: `Kiez ${name} - Berlin in Daten - navigator.berlin`
	);

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
		const bezirkPart = bezirkName.length > 0 ? ` in Bezirk ${bezirkName}` : '';
		return `Kiez ${name}${bezirkPart}${suffix}: Kiez-Score, Lärm, Klima, Grün, Mobilität, Versorgung, Sozialstruktur. Berliner Daten-Atlas.`;
	});
	const ogImageAlt = $derived(
		bezirkName.length > 0
			? `Kiez ${name} (${bezirkName}): navigator.berlin-Vorschau mit Kiez-Score`
			: `Kiez ${name}: navigator.berlin-Vorschau mit Kiez-Score`
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

	const breadcrumbJsonLd = $derived.by(() => {
		const items = [{ name: 'Berlin', path: '/' }];
		if (bezirkName.length > 0 && bezirkSlug) {
			items.push({ name: bezirkName, path: `/bezirk/${bezirkSlug}` });
		}
		items.push({ name, path: `/kiez/${slug}` });
		return buildBreadcrumbList({ origin, items });
	});
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
<JsonLd data={placeJsonLd} testid="kiez-place-jsonld" />
<JsonLd data={adminAreaJsonLd} testid="kiez-administrative-area-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="kiez-breadcrumb-jsonld" />

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
