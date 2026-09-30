<script lang="ts">
	import { page } from '$app/state';
	import { Accordion } from 'bits-ui';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import RichText from '$lib/components/rich-text.svelte';
	import ScoreRankingTable from '$lib/components/atlas/score-ranking-table.svelte';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { richSegments } from '$lib/i18n/rich-text.js';
	import { m } from '$lib/paraglide/messages.js';
	import { buildDataset } from '$lib/seo/jsonld-dataset.js';
	import { buildItemList } from '$lib/seo/jsonld-itemlist.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import type { PageData } from './$types';

	interface Props {
		readonly data: PageData;
	}

	const { data }: Props = $props();

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);
	const pageTitle = $derived(m.uis_meta_title());
	const pageDescription = $derived(m.uis_meta_description());
	const ogImagePath = '/og/page/umwelt-infrastruktur-score.png';
	const ogImageAbsolute = $derived(`${origin}${ogImagePath}`);

	const datasetJsonLd = $derived(
		buildDataset({
			origin,
			name: m.uis_jsonld_dataset_name(),
			description: pageDescription,
			license: 'CC BY 4.0',
			dateModified: data.computedAt ?? new Date().toISOString(),
			creatorName: 'navigator.berlin',
			contentUrl: `${origin}${pathname}`,
			encodingFormat: 'text/html',
			keywords: [m.uis_jsonld_keyword_kiez_score(), 'Berlin', 'Ranking']
		})
	);

	const itemListJsonLd = $derived(
		buildItemList({
			origin,
			items: data.kieze.map((row) => ({
				name: row.displayName,
				path: localizedHref(`/kiez/${row.slug}`)
			}))
		})
	);

	const accordionSegments = $derived(
		richSegments((t) =>
			m.uis_accordion_content({ link_start: t('link').start, link_end: t('link').end })
		)
	);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin,
			items: [
				{ name: 'Berlin', path: localizedHref('/') },
				{ name: m.uis_h1_title(), path: pathname }
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
/>
<JsonLd data={datasetJsonLd} testid="ranking-dataset-jsonld" />
<JsonLd data={itemListJsonLd} testid="ranking-itemlist-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="ranking-breadcrumb-jsonld" />

<article class="mx-auto max-w-4xl space-y-10 px-4 py-10" data-testid="ranking-page">
	<header class="space-y-4">
		<h1 class="font-serif text-3xl text-ink md:text-4xl">{m.uis_h1_title()}</h1>
		<p class="max-w-prose font-serif text-lg leading-relaxed text-ink-muted">
			{m.uis_intro_p1()}
		</p>
	</header>

	<aside
		data-testid="ranking-editorial-disclaimer"
		class="bg-bg-soft rounded border border-rule px-4 py-3 font-serif text-base text-ink-muted"
		role="note"
	>
		{m.uis_disclaimer()}
	</aside>

	<Accordion.Root type="single" class="border-y border-rule">
		<Accordion.Item value="methodik" class="py-1">
			<Accordion.Header>
				<Accordion.Trigger
					data-testid="ranking-methodik-disclosure"
					class="flex w-full items-center justify-between gap-4 py-3 text-left font-sans text-base font-semibold text-ink hover:text-accent"
				>
					{m.uis_accordion_trigger()}
				</Accordion.Trigger>
			</Accordion.Header>
			<Accordion.Content class="pb-4 font-serif text-base leading-relaxed text-ink-muted">
				<RichText segments={accordionSegments}>
					{#snippet tag(text)}
						<a class="text-accent underline" href={localizedHref('/methodik/kiez-score')}>{text}</a>
					{/snippet}
				</RichText>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>

	{#if data.kieze.length === 0 && data.bezirke.length === 0}
		<p data-testid="ranking-empty" class="font-serif text-base text-ink-muted">
			{m.uis_empty_state()}
		</p>
	{:else}
		<ScoreRankingTable kieze={data.kieze} bezirke={data.bezirke} />
	{/if}
</article>
