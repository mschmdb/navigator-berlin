<script lang="ts">
	import { page } from '$app/state';
	import { Accordion } from 'bits-ui';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import ScoreRankingTable from '$lib/components/atlas/score-ranking-table.svelte';
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
	const pageTitle = 'Wo lebt es sich gut? · navigator.berlin';
	const pageDescription =
		'Kiez-Score-Ranking aus 5 Dimensionen: Top-30-Kieze und 12 Bezirke nach aggregiertem Score. Methodik offen, Quellen verlinkt, keine evaluative Sprache.';
	const ogImagePath = '/og/page/wo-lebt-es-sich-gut.png';
	const ogImageAbsolute = $derived(`${origin}${ogImagePath}`);

	const datasetJsonLd = $derived(
		buildDataset({
			origin,
			name: 'Kiez-Score-Ranking Berlin',
			description: pageDescription,
			license: 'CC BY 4.0',
			dateModified: data.computedAt ?? new Date().toISOString(),
			creatorName: 'navigator.berlin',
			contentUrl: `${origin}${pathname}`,
			encodingFormat: 'text/html',
			keywords: ['Kiez-Score', 'Berlin', 'Ranking']
		})
	);

	const itemListJsonLd = $derived(
		buildItemList({
			origin,
			items: data.kieze.map((row) => ({
				name: row.displayName,
				path: `/kiez/${row.slug}`
			}))
		})
	);

	const breadcrumbJsonLd = $derived(
		buildBreadcrumbList({
			origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Ranking', path: pathname }
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
	locales={['de']}
/>
<JsonLd data={datasetJsonLd} testid="ranking-dataset-jsonld" />
<JsonLd data={itemListJsonLd} testid="ranking-itemlist-jsonld" />
<JsonLd data={breadcrumbJsonLd} testid="ranking-breadcrumb-jsonld" />

<article
	class="mx-auto max-w-4xl space-y-10 px-4 py-10"
	data-testid="ranking-page"
>
	<header class="space-y-4">
		<h1 class="font-serif text-3xl text-ink md:text-4xl">Wo lebt es sich gut?</h1>
		<p class="max-w-prose font-serif text-lg leading-relaxed text-ink-muted">
			Berliner Kieze und Bezirke nach Kiez-Score sortiert. 5 Dimensionen,
			gleichgewichtet. Der Score beschreibt statistische Verteilung, nicht
			Wertung einzelner Adressen oder Personen.
		</p>
	</header>

	<aside
		data-testid="ranking-editorial-disclaimer"
		class="rounded border border-rule bg-bg-soft px-4 py-3 font-serif text-base text-ink-muted"
		role="note"
	>
		Der Score fasst öffentliche Senats-Daten pro LOR-Bezirksregion zusammen. Was sich
		gut anfühlt, bemisst sich an persönlichen Prioritäten. Vergleich, nicht Urteil.
	</aside>

	<Accordion.Root type="single" class="border-y border-rule">
		<Accordion.Item value="methodik" class="py-1">
			<Accordion.Header>
				<Accordion.Trigger
					data-testid="ranking-methodik-disclosure"
					class="flex w-full items-center justify-between gap-4 py-3 text-left font-sans text-base font-semibold text-ink hover:text-accent"
				>
					Wie wird der Score berechnet?
				</Accordion.Trigger>
			</Accordion.Header>
			<Accordion.Content
				class="pb-4 font-serif text-base leading-relaxed text-ink-muted"
			>
				Wir aggregieren fünf Dimensionen: Ruhe & Luft, Grün, Mobilität, Soziale Lage,
				Versorgung. Quelle pro Dimension sind offene Senats-Daten (Lärmkartierung,
				Grünversorgung, Klima-Atlas, ÖPNV-Halte, MSS, POI-Distanzen). Die
				Aggregation läuft 542 LOR-Planungsräume → 143 LOR-Bezirksregionen →
				12 Bezirke, jeweils flächengewichtet. Jede Dimension wird gleich
				gewichtet (5 × 20%).
				<a class="text-accent underline" href="/methodik/kiez-score">
					Vollständige Methodik · Kiez-Score
				</a>.
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>

	{#if data.kieze.length === 0 && data.bezirke.length === 0}
		<p data-testid="ranking-empty" class="font-serif text-base text-ink-muted">
			Score-Daten werden mit dem nächsten Build freigeschaltet.
		</p>
	{:else}
		<ScoreRankingTable kieze={data.kieze} bezirke={data.bezirke} />
	{/if}
</article>
