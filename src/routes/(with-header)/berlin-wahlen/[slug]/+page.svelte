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
	import { localeToBcp47, resolveEffectiveLocale } from '$lib/seo/index.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { formatPercent, formatCount, formatWahlDate } from '$lib/i18n/format.js';
	import {
		wahlTypLabel,
		wahlStimmtypLabel,
		wahlReiheLabel,
		wahlWiederholungLabel,
		sourceDisplayLabel,
		licenseDisplayLabel
	} from '$lib/data/wahl-labels.js';
	import { parteiDisplayName } from '$lib/components/wahl-portal/internal/winner-map-data.js';
	import VorlaeufigBadge from '$lib/components/wahl-portal/vorlaeufig-badge.svelte';
	import KapitelSection from '$lib/components/wahl-portal/kapitel-section.svelte';
	import { serializePortalState, DEFAULT_EBENE } from '$lib/utils/wahl-portal-url-state.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const origin = $derived(page.url.origin);
	const pathname = $derived(page.url.pathname);

	// Titel wird clientseitig aus den rohen Feldern gebaut (Boundary Spec
	// i18n Block B, Code-Map „Titel → Keys liefern, Label im Client"): der
	// Server liefert nur noch typ/stimmtyp/jahr/isRepeatElection, keine
	// vorgefertigte DE-Zeichenkette mehr.
	const typLabel = $derived(wahlTypLabel(data.wahl.typ));
	const stimmtypLabel = $derived(wahlStimmtypLabel(data.wahl.stimmtyp));
	const wahlTitel = $derived.by(() => {
		const parts = [`${typLabel} ${data.wahl.jahr}`];
		if (data.wahl.typ !== 'bvv') parts.push(stimmtypLabel);
		if (data.wahl.isRepeatElection) parts.push(wahlWiederholungLabel());
		return parts.join(' · ');
	});

	const pageTitle = $derived(`${wahlTitel} · Berlin · navigator.berlin`);
	const pageDescription = $derived(
		m.wahl_detail_page_description({ typLabel, jahr: data.wahl.jahr })
	);

	const totalStimmen = $derived(data.berlin.reduce((s, e) => s + e.stimmen, 0));
	const berlinTop5 = $derived(data.berlin.slice(0, 5));
	const karteTitle = $derived(
		data.geoSlug ? m.wahl_detail_karte_titel_stimmbezirk() : m.wahl_detail_karte_titel_bezirk()
	);

	const breadcrumbs = $derived(
		buildBreadcrumbList({
			origin,
			items: [
				{ name: 'Berlin', path: '/' },
				{ name: m.wahl_detail_breadcrumb_wahlen(), path: '/berlin-wahlen' },
				{ name: wahlTitel, path: pathname }
			]
		})
	);

	const dataset = $derived(
		buildDataset({
			origin,
			name: wahlTitel,
			description: pageDescription,
			license: 'dl-de/by-2-0',
			dateModified: `${data.wahl.jahr}-01-01`,
			creatorName: sourceDisplayLabel(data.wahl.sourceName),
			contentUrl: data.wahl.sourceUrl,
			encodingFormat: data.wahl.sourceUrl.endsWith('.zip')
				? 'application/zip'
				: data.wahl.sourceUrl.endsWith('.xlsx')
					? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
					: 'text/csv',
			keywords: [m.wahl_detail_keyword_wahl(), 'Berlin', typLabel, String(data.wahl.jahr)],
			inLanguage: localeToBcp47(resolveEffectiveLocale(pathname, getLocale()))
		})
	);

	// Entscheidung Matze 23.09. (2A): Deep-Link ins Portal mit `?reihe=&jahr=`.
	// Erststimme hat im Portal keinen eigenen Stimmtyp-Toggle (die Karte zeigt
	// dort immer die Zweitstimme/Einstimme, siehe `stimmtypForReihe`) -- der
	// Link führt deshalb auf dieselbe Reihe/Jahr, ohne Stimmtyp zu wechseln.
	// Review-Fund: der Hinweis hing vorher per `&nbsp;` im Linknamen und nannte
	// weder Wahl noch Jahr -- Linktext nennt jetzt Reihe+Jahr, der Hinweis
	// steht als eigener Text außerhalb des Links und ist per `aria-describedby`
	// verknüpft statt stillschweigend im Link-Namen zu verschwinden.
	const portalDeepLinkHref = $derived.by(() => {
		const params = serializePortalState({
			reihe: data.wahl.typ,
			jahr: data.wahl.jahr,
			ebene: DEFAULT_EBENE
		});
		const qs = params.toString();
		const base = localizedHref('/berlin-wahlen');
		return qs ? `${base}?${qs}` : base;
	});
	const portalDeepLinkLabel = $derived(
		m.wahl_detail_portal_link_label({
			reihe: wahlReiheLabel(data.wahl.typ),
			jahr: data.wahl.jahr
		})
	);
	const portalDeepLinkIstErststimme = $derived(data.wahl.stimmtyp === 'erststimme');
</script>

<SeoHead
	title={pageTitle}
	description={pageDescription}
	{origin}
	{pathname}
	ogImage={`${origin}/og/wahl/${data.slug}.png`}
	ogImageAlt={m.wahl_detail_og_alt({ title: wahlTitel })}
/>

<JsonLd data={breadcrumbs} />
<JsonLd data={dataset} />

<article class="mx-auto max-w-4xl space-y-8 px-4 py-8" data-testid="wahl-detail-page">
	<header class="space-y-3">
		<p class="font-mono text-xs tracking-wide text-ink-muted uppercase">
			<a href={localizedHref('/')} class="underline-offset-2 hover:text-ink hover:underline">
				Berlin
			</a>
			·
			<a
				href={localizedHref('/berlin-wahlen')}
				class="underline-offset-2 hover:text-ink hover:underline"
			>
				{m.wahl_detail_breadcrumb_wahlen()}
			</a>
		</p>
		<h1
			class="font-sans text-2xl font-bold break-words hyphens-auto text-ink sm:text-3xl"
			data-testid="wahl-detail-title"
		>
			{wahlTitel}
		</h1>
		{#if data.wahl.vorlaeufig}
			<p>
				<VorlaeufigBadge
					sourceUpdatedAt={data.wahl.sourceUpdatedAt}
					testid="wahl-detail-vorlaeufig"
				/>
			</p>
		{/if}
		{#if data.wahl.isRepeatElection && data.wahl.parentSlug}
			<p
				class="font-mono text-xs tracking-wide text-ink-muted uppercase"
				data-testid="wahl-detail-wiederholung"
			>
				{wahlWiederholungLabel()} ·
				<a
					href={localizedHref(`/berlin-wahlen/${data.wahl.parentSlug}`)}
					class="hover:text-accent-strong text-accent underline underline-offset-2"
				>
					{m.wahl_detail_original_wahl_link()}
				</a>
			</p>
		{/if}
		<p class="font-mono text-xs text-ink-muted" data-testid="wahl-detail-meta">
			{m.wahl_detail_quelle_label({ source: sourceDisplayLabel(data.wahl.sourceName) })} ·
			{m.wahl_portal_lizenz_suffix({ license: licenseDisplayLabel(data.wahl.license) })}{#if data.wahl.sourceUpdatedAt}
				{m.wahl_portal_vorlaeufig_stand({ date: formatWahlDate(data.wahl.sourceUpdatedAt) })}
			{/if}
		</p>
		<p>
			<a
				href={portalDeepLinkHref}
				data-testid="wahl-detail-portal-link"
				aria-describedby={portalDeepLinkIstErststimme
					? 'wahl-detail-portal-link-hinweis'
					: undefined}
				class="hover:text-accent-strong inline-block font-mono text-xs text-accent underline underline-offset-2"
			>
				{portalDeepLinkLabel}
			</a>
		</p>
		{#if portalDeepLinkIstErststimme}
			<p
				id="wahl-detail-portal-link-hinweis"
				data-testid="wahl-detail-portal-link-hinweis"
				class="font-mono text-[10px] text-ink-muted"
			>
				{m.wahl_detail_erststimme_hinweis({
					zweitstimme: wahlStimmtypLabel('zweitstimme'),
					erststimme: wahlStimmtypLabel('erststimme')
				})}
			</p>
		{/if}
	</header>

	<KapitelSection
		id="detail-berlin"
		title={m.wahl_detail_section_berlin_titel()}
		testid="wahl-detail-berlin"
		withPortalChrome={false}
	>
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
						title={`${parteiDisplayName(entry.kurzname)}: ${formatPercent(entry.anteil)}`}
					></span>
				{/each}
			</div>

			<table
				class="w-full font-mono text-xs sm:text-sm"
				aria-label={m.wahl_detail_aria_top5_berlin({ title: wahlTitel })}
				data-testid="wahl-detail-berlin-table"
			>
				<thead>
					<tr class="text-[10px] tracking-wide text-ink-muted uppercase">
						<th class="pb-2 text-left">{m.wahl_portal_spalte_partei()}</th>
						<th class="pb-2 pl-2 text-right whitespace-nowrap">
							{m.wahl_detail_spalte_stimmen()}
						</th>
						<th class="pb-2 pl-2 text-right whitespace-nowrap">{m.wahl_portal_spalte_anteil()}</th>
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
										<span class="sm:hidden">{parteiDisplayName(entry.kurzname)}</span>
										<span class="hidden sm:inline">{parteiDisplayName(entry.vollname)}</span>
									</span>
								</span>
							</td>
							<td class="py-1.5 pl-2 text-right whitespace-nowrap text-ink tabular-nums">
								{formatCount(entry.stimmen)}
							</td>
							<td class="py-1.5 pl-2 text-right whitespace-nowrap text-ink tabular-nums">
								{formatPercent(entry.anteil)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="font-mono text-sm text-ink-muted" data-testid="wahl-detail-berlin-empty">
				{m.wahl_detail_berlin_empty()}
			</p>
		{/if}
	</KapitelSection>

	<KapitelSection
		id="detail-karte"
		title={karteTitle}
		testid="wahl-detail-choropleth"
		withPortalChrome={false}
	>
		{#if data.geoSlug}
			<p
				class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
				data-testid="wahl-detail-choropleth-count"
			>
				{m.wahl_detail_briefwahl_gruppen_count({ count: formatCount(data.winnersByUwb.length) })}
			</p>
		{/if}
		{#if data.geoSlug && data.winnersByUwb.length > 0}
			<WahlStimmbezirkChoropleth
				geoSlug={data.geoSlug}
				wahlSlug={`${data.wahl.typ}${String(data.wahl.jahr).slice(-2)}`}
				winnersByUwb={data.winnersByUwb}
				title={wahlTitel}
			/>
		{:else}
			<p
				class="border-l-2 border-ink/30 pl-2 font-serif text-sm text-ink-muted italic"
				data-testid="wahl-detail-choropleth-fallback-note"
			>
				{m.wahl_detail_choropleth_fallback_note()}
			</p>
			<WahlBezirkChoropleth bezirke={data.bezirke} title={wahlTitel} />
		{/if}
	</KapitelSection>

	<KapitelSection
		id="detail-bezirke"
		title={m.wahl_detail_section_bezirke_titel()}
		testid="wahl-detail-bezirke"
		withPortalChrome={false}
	>
		<ul class="grid gap-3 sm:grid-cols-2">
			{#each data.bezirke as bezirk (bezirk.slug)}
				<li
					class="space-y-2 rounded border border-rule p-3"
					data-testid={`wahl-detail-bezirk-${bezirk.slug}`}
				>
					<a
						href={localizedHref(`/bezirk/${bezirk.slug}`)}
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
									<span class="truncate text-ink">{parteiDisplayName(entry.kurzname)}</span>
									<span class="ml-auto text-ink-muted tabular-nums">
										{formatPercent(entry.anteil)}
									</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="font-mono text-xs text-ink-muted">{m.wahl_detail_bezirk_keine_daten()}</p>
					{/if}
				</li>
			{/each}
		</ul>
	</KapitelSection>

	<EditorialDisclaimer variant="wahl-portal-stimmenanteile" />

	<a
		href={localizedHref('/methodik/wahldaten')}
		class="hover:text-accent-strong inline-block font-mono text-sm text-accent underline underline-offset-2"
		data-testid="wahl-detail-methodik-link"
	>
		{m.wahl_detail_methodik_link_label()}
	</a>
</article>
