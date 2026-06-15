<script lang="ts">
	import { page } from '$app/state';
	import SeoHead from '$lib/components/atlas/seo-head.svelte';
	import JsonLd from '$lib/components/atlas/json-ld.svelte';
	import EditorialDisclaimer from '$lib/components/atlas/editorial-disclaimer.svelte';
	import WahlBezirkChoropleth from '$lib/components/atlas/wahl-bezirk-choropleth.svelte';
	import WahlStimmbezirkChoropleth from '$lib/components/atlas/wahl-stimmbezirk-choropleth.svelte';
	import { parteiColor, parteiPattern } from '$lib/data/partei-farben.js';
	import { buildBreadcrumbList } from '$lib/seo/jsonld-breadcrumb.js';
	import { buildDataset } from '$lib/seo/jsonld-dataset.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);

	const pageTitle = $derived(`${data.wahl.title} · Berlin · navigator.berlin`);
	const pageDescription = $derived(
		`Ergebnisse der ${data.wahl.typLabel} ${data.wahl.jahr} in Berlin: Stimmenanteile, Top-Parteien je Bezirk und Kiez. navigator.berlin.`
	);

	const totalStimmen = $derived(data.berlin.reduce((s, e) => s + e.stimmen, 0));
	const berlinTop5 = $derived(data.berlin.slice(0, 5));

	function formatPct(n: number): string {
		return `${(n * 100).toFixed(1).replace('.', ',')} %`;
	}

	function formatStimmen(n: number): string {
		return n.toLocaleString('de-DE');
	}

	const breadcrumbs = $derived(
		buildBreadcrumbList({
			origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: 'Wahlen', path: '/wahl' },
				{ name: data.wahl.title, path: pathname }
			]
		})
	);

	const dataset = $derived(
		buildDataset({
			origin,
			name: data.wahl.title,
			description: pageDescription,
			license: 'dl-de/by-2-0',
			dateModified: `${data.wahl.jahr}-01-01`,
			creatorName: data.wahl.sourceName,
			contentUrl: data.wahl.sourceUrl,
			encodingFormat: data.wahl.sourceUrl.endsWith('.zip')
				? 'application/zip'
				: data.wahl.sourceUrl.endsWith('.xlsx')
					? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
					: 'text/csv',
			keywords: ['Wahl', 'Berlin', data.wahl.typLabel, String(data.wahl.jahr)],
			inLanguage: 'de-DE'
		})
	);
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	{origin}
	{pathname}
	ogImage={`${origin}/og/wahl/${data.slug}.png`}
	ogImageAlt={`OG-Karte: ${data.wahl.title}, Top-5 Berlin gesamt`}
	locales={['de']}
/>

<JsonLd data={breadcrumbs} />
<JsonLd data={dataset} />

<article class="mx-auto max-w-4xl space-y-8 px-4 py-8" data-testid="wahl-detail-page">
	<header class="space-y-3">
		<p class="font-mono text-xs tracking-wide text-ink-muted uppercase">
			<a href="/" class="underline-offset-2 hover:text-ink hover:underline">Berlin</a>
			·
			<a href="/wahl" class="underline-offset-2 hover:text-ink hover:underline">Wahlen</a>
		</p>
		<h1
			class="font-sans text-2xl font-bold break-words hyphens-auto text-ink sm:text-3xl"
			lang="de"
			data-testid="wahl-detail-title"
		>
			{data.wahl.title}
		</h1>
		{#if data.wahl.isRepeatElection && data.wahl.parentSlug}
			<p
				class="font-mono text-xs tracking-wide text-ink-muted uppercase"
				data-testid="wahl-detail-wiederholung"
			>
				Wiederholungswahl ·
				<a
					href={`/wahl/${data.wahl.parentSlug}`}
					class="hover:text-accent-strong text-accent underline underline-offset-2"
				>
					Original-Wahl ansehen
				</a>
			</p>
		{/if}
		<p class="font-mono text-xs text-ink-muted" data-testid="wahl-detail-meta">
			Quelle: {data.wahl.sourceName} · Lizenz {data.wahl.license}
		</p>
	</header>

	<section data-testid="wahl-detail-berlin" class="space-y-4">
		<h2 class="font-sans text-xl font-semibold text-ink">Berlin gesamt</h2>

		{#if berlinTop5.length > 0 && totalStimmen > 0}
			<div
				class="bg-bg-muted relative h-8 w-full overflow-hidden rounded border border-rule"
				aria-hidden="true"
				data-testid="wahl-detail-stacked-bar"
			>
				{#each berlinTop5 as entry, i (entry.kurzname)}
					{@const widthPct = (entry.anteil * 100).toFixed(2)}
					{@const offsetPct = berlinTop5
						.slice(0, i)
						.reduce((s, e) => s + e.anteil * 100, 0)
						.toFixed(2)}
					<span
						class="absolute top-0 h-full"
						style="left:{offsetPct}%;width:{widthPct}%;background-color:{parteiColor(
							entry.kurzname
						)};"
						data-pattern={parteiPattern(entry.kurzname)}
						data-partei={entry.kurzname}
						title={`${entry.kurzname}: ${formatPct(entry.anteil)}`}
					></span>
				{/each}
			</div>

			<table
				class="w-full font-mono text-xs sm:text-sm"
				aria-label={`Top-5-Parteien Berlin gesamt ${data.wahl.title}`}
				data-testid="wahl-detail-berlin-table"
			>
				<thead>
					<tr class="text-[10px] tracking-wide text-ink-muted uppercase">
						<th class="pb-2 text-left">Partei</th>
						<th class="pb-2 pl-2 text-right whitespace-nowrap">Stimmen</th>
						<th class="pb-2 pl-2 text-right whitespace-nowrap">Anteil</th>
					</tr>
				</thead>
				<tbody>
					{#each berlinTop5 as entry (entry.kurzname)}
						<tr class="border-t border-rule/40">
							<td class="py-1.5 pr-2">
								<span class="inline-flex items-center gap-2">
									<span
										class="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm border border-ink/10"
										style="background-color:{parteiColor(entry.kurzname)};"
										aria-hidden="true"
									></span>
									<span class="text-ink">
										<span class="sm:hidden">{entry.kurzname}</span>
										<span class="hidden sm:inline">{entry.vollname}</span>
									</span>
								</span>
							</td>
							<td class="py-1.5 pl-2 text-right whitespace-nowrap text-ink tabular-nums">
								{formatStimmen(entry.stimmen)}
							</td>
							<td class="py-1.5 pl-2 text-right whitespace-nowrap text-ink tabular-nums">
								{formatPct(entry.anteil)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="font-mono text-sm text-ink-muted" data-testid="wahl-detail-berlin-empty">
				Keine Berlin-Aggregat-Daten für diese Wahl.
			</p>
		{/if}
	</section>

	<section data-testid="wahl-detail-choropleth" class="space-y-3">
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<h2 class="font-sans text-xl font-semibold text-ink">
				{data.geoSlug ? 'Stimmbezirkskarte' : 'Bezirkskarte'}
			</h2>
			{#if data.geoSlug}
				<span class="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
					~{data.winnersByUwb.length.toLocaleString('de-DE')} Stimmbezirke
				</span>
			{/if}
		</div>
		{#if data.geoSlug && data.winnersByUwb.length > 0}
			<WahlStimmbezirkChoropleth
				geoSlug={data.geoSlug}
				wahlSlug={`${data.wahl.typ}${String(data.wahl.jahr).slice(-2)}`}
				winnersByUwb={data.winnersByUwb}
				title={data.wahl.title}
			/>
		{:else}
			<p
				class="border-l-2 border-ink/30 pl-2 font-serif text-sm text-ink-muted italic"
				data-testid="wahl-detail-choropleth-fallback-note"
			>
				Stimmbezirks-Geometrie nicht verfügbar für diese Wahl. Karte zeigt Bezirks-Aggregat.
			</p>
			<WahlBezirkChoropleth bezirke={data.bezirke} title={data.wahl.title} />
		{/if}
	</section>

	<section data-testid="wahl-detail-bezirke" class="space-y-4">
		<h2 class="font-sans text-xl font-semibold text-ink">Top-3 je Bezirk</h2>
		<ul class="grid gap-3 sm:grid-cols-2">
			{#each data.bezirke as bezirk (bezirk.slug)}
				<li
					class="space-y-2 rounded border border-rule p-3"
					data-testid={`wahl-detail-bezirk-${bezirk.slug}`}
				>
					<a
						href={`/bezirk/${bezirk.slug}`}
						class="font-sans font-semibold text-ink hover:text-accent"
					>
						{bezirk.name}
					</a>
					{#if bezirk.top3.length > 0}
						<ul class="space-y-1 font-mono text-xs">
							{#each bezirk.top3 as entry (entry.kurzname)}
								<li class="flex items-baseline gap-2">
									<span
										class="inline-block h-2 w-2 flex-shrink-0 rounded-sm border border-ink/10"
										style="background-color:{parteiColor(entry.kurzname)};"
										aria-hidden="true"
									></span>
									<span class="truncate text-ink">{entry.kurzname}</span>
									<span class="ml-auto text-ink-muted tabular-nums">
										{formatPct(entry.anteil)}
									</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="font-mono text-xs text-ink-muted">Keine Daten.</p>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<EditorialDisclaimer variant="wahl-stimmenanteile" />

	<a
		href="/methodik/wahldaten"
		class="hover:text-accent-strong inline-block font-mono text-sm text-accent underline underline-offset-2"
		data-testid="wahl-detail-methodik-link"
	>
		Methodik · Wahldaten
	</a>
</article>
