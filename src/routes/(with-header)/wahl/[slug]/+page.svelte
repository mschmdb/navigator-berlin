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
		`Ergebnisse der ${data.wahl.typLabel} ${data.wahl.jahr} in Berlin nach Bezirken. ` +
			`Stimmenanteile pro Partei, Top-3 je Bezirk, Quelle ${data.wahl.sourceName}.`
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
	locales={['de']}
/>

<JsonLd data={breadcrumbs} />
<JsonLd data={dataset} />

<article class="mx-auto max-w-4xl px-4 py-8 space-y-8" data-testid="wahl-detail-page">
	<header class="space-y-3">
		<p class="font-mono text-xs uppercase tracking-wide text-ink-muted">
			<a href="/" class="hover:text-ink underline-offset-2 hover:underline">Berlin</a>
			·
			<a href="/wahl" class="hover:text-ink underline-offset-2 hover:underline">Wahlen</a>
		</p>
		<h1 class="font-sans text-3xl font-bold text-ink" data-testid="wahl-detail-title">
			{data.wahl.title}
		</h1>
		{#if data.wahl.isRepeatElection && data.wahl.parentSlug}
			<p
				class="font-mono text-xs uppercase tracking-wide text-ink-muted"
				data-testid="wahl-detail-wiederholung"
			>
				Wiederholungswahl ·
				<a
					href={`/wahl/${data.wahl.parentSlug}`}
					class="text-accent underline underline-offset-2 hover:text-accent-strong"
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
				class="relative h-8 w-full overflow-hidden rounded border border-rule bg-bg-muted"
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
				class="w-full font-mono text-sm"
				aria-label={`Top-5-Parteien Berlin gesamt ${data.wahl.title}`}
				data-testid="wahl-detail-berlin-table"
			>
				<thead>
					<tr class="text-[10px] uppercase tracking-wide text-ink-muted">
						<th class="text-left pb-2">Partei</th>
						<th class="text-right pb-2">Stimmen</th>
						<th class="text-right pb-2">Anteil</th>
					</tr>
				</thead>
				<tbody>
					{#each berlinTop5 as entry (entry.kurzname)}
						<tr class="border-t border-rule/40">
							<td class="py-1.5">
								<span class="inline-flex items-center gap-2">
									<span
										class="inline-block h-2.5 w-2.5 rounded-sm border border-ink/10"
										style="background-color:{parteiColor(entry.kurzname)};"
										aria-hidden="true"
									></span>
									<span class="text-ink">{entry.vollname}</span>
								</span>
							</td>
							<td class="text-right tabular-nums text-ink py-1.5">
								{formatStimmen(entry.stimmen)}
							</td>
							<td class="text-right tabular-nums text-ink py-1.5">
								{formatPct(entry.anteil)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p
				class="font-mono text-sm text-ink-muted"
				data-testid="wahl-detail-berlin-empty"
			>
				Keine Berlin-Aggregat-Daten für diese Wahl.
			</p>
		{/if}
	</section>

	<section data-testid="wahl-detail-choropleth" class="space-y-3">
		<div class="flex items-baseline justify-between gap-2 flex-wrap">
			<h2 class="font-sans text-xl font-semibold text-ink">
				{data.geoSlug ? 'Stimmbezirkskarte' : 'Bezirkskarte'}
			</h2>
			{#if data.geoSlug}
				<span class="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
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
				class="font-serif italic text-sm text-ink-muted border-l-2 border-ink/30 pl-2"
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
					class="border border-rule rounded p-3 space-y-2"
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
										class="inline-block h-2 w-2 rounded-sm border border-ink/10 flex-shrink-0"
										style="background-color:{parteiColor(entry.kurzname)};"
										aria-hidden="true"
									></span>
									<span class="text-ink truncate">{entry.kurzname}</span>
									<span class="ml-auto tabular-nums text-ink-muted">
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
		class="inline-block font-mono text-sm text-accent underline underline-offset-2 hover:text-accent-strong"
		data-testid="wahl-detail-methodik-link"
	>
		Methodik · Wahldaten
	</a>
</article>
