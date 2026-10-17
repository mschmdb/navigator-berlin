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
	import { buildWahlMeta } from '$lib/seo/wahl-meta.js';
	import { localeToBcp47, resolveEffectiveLocale } from '$lib/seo/index.js';
	import { canonicalOrigin, localizedPathname } from '$lib/seo/canonical.js';
	import { deriveTemporalCoverage, originOfUrl } from '$lib/seo/dataset-helpers.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages.js';
	import { BEZIRKE_BBOX } from '$lib/data/berlin-bbox.generated.js';
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
		return parts.join(', ');
	});

	const topParty = $derived(data.berlin.find((e) => e.kurzname !== 'Sonstige'));
	const wahlMeta = $derived(
		buildWahlMeta({
			typ: data.wahl.typ,
			jahr: data.wahl.jahr,
			stimmtyp: data.wahl.stimmtyp,
			isRepeatElection: data.wahl.isRepeatElection,
			hasStimmbezirke: data.geoSlug !== null && data.winnersByUwb.length > 0,
			vorlaeufig: data.wahl.vorlaeufig,
			topParty: topParty ? { kurzname: topParty.kurzname, anteil: topParty.anteil } : null,
			locale: getLocale()
		})
	);
	const pageTitle = $derived(wahlMeta.title);
	const pageDescription = $derived(wahlMeta.description);

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
			url: `${canonicalOrigin(origin)}${localizedPathname(`/berlin-wahlen/${data.slug}`, getLocale())}`,
			bbox: BEZIRKE_BBOX,
			temporalCoverage: deriveTemporalCoverage({ year: data.wahl.jahr }),
			description: pageDescription,
			license: 'dl-de/by-2-0',
			dateModified: data.wahl.sourceUpdatedAt ?? `${data.wahl.jahr}-01-01`,
			creatorName: sourceDisplayLabel(data.wahl.sourceName),
			creatorUrl: originOfUrl(data.wahl.sourceUrl),
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
		<p class="text-xs text-ink-muted">
			<a href={localizedHref('/')} class="underline-offset-2 hover:text-ink hover:underline">
				Berlin
			</a>
			<span aria-hidden="true">/</span>
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
			<p class="text-xs text-ink-muted" data-testid="wahl-detail-wiederholung">
				{wahlWiederholungLabel()},
				<a
					href={localizedHref(`/berlin-wahlen/${data.wahl.parentSlug}`)}
					class="text-accent underline underline-offset-2 hover:text-accent-strong"
				>
					{m.wahl_detail_original_wahl_link()}
				</a>
			</p>
		{/if}
		<p class="text-xs text-ink-muted" data-testid="wahl-detail-meta">
			{m.wahl_detail_quelle_label({ source: sourceDisplayLabel(data.wahl.sourceName) })},
			{m.wahl_portal_lizenz_suffix({
				license: licenseDisplayLabel(data.wahl.license)
			})}{#if data.wahl.sourceUpdatedAt},
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
				class="inline-block text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
			>
				{portalDeepLinkLabel}
			</a>
		</p>
		{#if portalDeepLinkIstErststimme}
			<p
				id="wahl-detail-portal-link-hinweis"
				data-testid="wahl-detail-portal-link-hinweis"
				class="text-dense-meta text-ink-muted"
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
						title={`${parteiDisplayName(entry.kurzname)}: ${formatPercent(entry.anteil)}`}
					></span>
				{/each}
			</div>

			<table
				class="w-full text-xs sm:text-sm"
				aria-label={m.wahl_detail_aria_top5_berlin({ title: wahlTitel })}
				data-testid="wahl-detail-berlin-table"
			>
				<thead>
					<tr class="text-dense-meta text-ink-muted">
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
									<!-- GH-92: überall Kurzform, die Langform nur im title. -->
									<span
										class="text-ink"
										title={entry.vollname !== entry.kurzname ? entry.vollname : undefined}
										>{parteiDisplayName(entry.kurzname)}</span
									>
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
			<p class="text-sm text-ink-muted" data-testid="wahl-detail-berlin-empty">
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
			<p class="text-dense-meta text-ink-muted" data-testid="wahl-detail-choropleth-count">
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
				class="border-l-2 border-ink/30 pl-2 text-sm text-ink-muted"
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
		<!-- #90: zwölf gleiche Kästen werden eine Tabelle, Bezirk als Zeilenkopf. -->
		<div class="overflow-x-auto">
			<table class="w-full font-sans text-sm">
				<thead>
					<tr class="border-b border-rule text-left">
						<th scope="col" class="py-2 pr-4 font-semibold text-ink"
							>{m.wahl_detail_bezirke_col_bezirk()}</th
						>
						{#each [1, 2, 3] as platz (platz)}
							<th scope="col" class="py-2 pr-4 font-semibold text-ink"
								>{m.wahl_detail_bezirke_col_platz({ platz })}</th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.bezirke as bezirk (bezirk.slug)}
						<tr
							class="border-b border-rule align-top"
							data-testid={`wahl-detail-bezirk-${bezirk.slug}`}
						>
							<th scope="row" class="py-2 pr-4 text-left font-semibold">
								<a
									href={localizedHref(`/bezirk/${bezirk.slug}`)}
									class="inline-flex min-h-(--target-min) items-center text-ink underline-offset-2 hover:text-accent hover:underline"
								>
									{bezirk.name}
								</a>
							</th>
							{#if bezirk.top3.length > 0}
								{#each [0, 1, 2] as i (i)}
									{@const entry = bezirk.top3[i]}
									<td class="py-2 pr-4">
										{#if entry}
											<span class="inline-flex items-baseline gap-2">
												<span
													class="inline-block h-2 w-2 flex-shrink-0 rounded-full"
													style="background-color:{parteiColor(entry.kurzname)};"
													aria-hidden="true"
												></span>
												<span class="text-ink">{parteiDisplayName(entry.kurzname)}</span>
												<span class="text-ink-muted tabular-nums"
													>{formatPercent(entry.anteil)}</span
												>
											</span>
										{/if}
									</td>
								{/each}
							{:else}
								<td colspan="3" class="py-2 pr-4 text-ink-muted"
									>{m.wahl_detail_bezirk_keine_daten()}</td
								>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</KapitelSection>

	<EditorialDisclaimer variant="wahl-portal-stimmenanteile" />

	<a
		href={localizedHref('/methodik/wahldaten')}
		class="inline-block text-sm text-accent underline underline-offset-2 hover:text-accent-strong"
		data-testid="wahl-detail-methodik-link"
	>
		{m.wahl_detail_methodik_link_label()}
	</a>
</article>
