<!--
	Kiezseite (NAV-104/105): gegliedert nach Themen, nicht nach Score. Die Kapitel zeigen Messwerte
	in echten Einheiten; Score-Punkte stehen nur in Karte, Einstiegszeile und Überblick am Ende.
	Der Einstieg behält die eigene Profil-Prosa des Kiezes (eigener Text je Seite, SEO).
-->
<script lang="ts">
	import { formatCount, formatDecimal, formatPercent } from '#lib/i18n/format.js';
	import '#lib/components/place/place.css';
	import RegionTitle from '#lib/components/atlas/region-title.svelte';
	import NoJsFallback from '#lib/components/place/no-js-fallback.svelte';
	import PlaceSeo from '#lib/components/place/place-seo.svelte';
	import ReferenceBar from '#lib/components/place/reference-bar.svelte';
	import Section from '#lib/components/place/place-section.svelte';
	import Chapter from '#lib/components/place/chapter.svelte';
	import ScoreMap from '#lib/components/place/score-map.svelte';
	import ProfileChart from '#lib/components/place/profile-chart.svelte';
	import PartyMultiples from '#lib/components/place/party-multiples.svelte';
	import WahlSwitch from '#lib/components/place/wahl-switch.svelte';
	import NeighborList from '#lib/components/place/neighbor-list.svelte';
	import FaqBlock from '#lib/components/place/place-faq.svelte';
	import DataTable from '#lib/components/place/data-table.svelte';
	import { aggregateProfile, resolveReference } from '#lib/place/reference.ts';
	import { PlaceViewState, WahlCache } from '#lib/place/reference-state.svelte.ts';
	import { wahlFacts, wahlSentences } from '#lib/place/wahl-text.ts';
	import { CHAPTERS, chapterText } from '#lib/place/topics.ts';
	import { trackLanding } from '#lib/utils/plausible.js';
	import { atlasQuery } from '#lib/place/atlas-link.ts';
	import { RATED_DIMS, type Dim } from '#lib/place/types.ts';
	import type { WahlArt } from '#lib/place/wahl-types.ts';
	import { dimLabel, formatScore, signedPoints } from '#lib/place/labels.ts';
	import { bezirkAnchorId } from '#lib/data/region-overview.js';
	import { unpackRegions, unpackWahl } from '#lib/place/pack.ts';
	import { localizedHref } from '#lib/i18n/localized-href.js';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const opts = $derived({ locale: getLocale() });
	const unitPlural = $derived(m.place_units_kieze());

	const name = $derived(data.profile.name);
	// Die Seitendaten kommen spaltenweise gepackt, ausgepackt wird einmal im Browser.
	const regions = $derived(unpackRegions(data.regions));
	const wahlData = $derived({
		own: unpackWahl(data.wahl.own),
		berlin: unpackWahl(data.wahl.berlin),
		bezirk: data.wahl.bezirk ? unpackWahl(data.wahl.bezirk) : null
	});
	const self = $derived(regions.find((r) => r.slug === data.profile.slug) ?? null);
	const byslug = $derived(new Map(regions.map((r) => [r.slug, r])));
	const bezirkName = $derived(data.profile.bezirk || null);
	const all = $derived(regions);

	const berlin = $derived(
		aggregateProfile(
			'berlin',
			'Berlin',
			all,
			'median',
			m.place_berlin_note_kiez({ count: all.length })
		)
	);
	// Bezirk als Vergleich: dieselben Werte wie auf der Bezirksseite (Score und Themen des ganzen Bezirks).
	const bezirkProfile = $derived(
		bezirkName && data.bezirkRegion
			? aggregateProfile(
					'bezirk',
					bezirkName,
					all.filter((r) => r.parentSlug === data.bezirkSlug),
					'mean',
					null,
					{ metrics: data.bezirkRegion.metrics, labels: data.bezirkRegion.labels }
				)
			: null
	);
	const bezirk = $derived(
		bezirkProfile && data.bezirkRegion
			? { ...bezirkProfile, dims: data.bezirkRegion.dims }
			: bezirkProfile
	);

	const view = new PlaceViewState(() => ({
		self: data.profile.slug,
		hasParent: !!data.bezirkSlug,
		neighbors: data.neighbors.map((n) => n.slug),
		similar: data.similar.map((n) => n.slug),
		all: new Set(all.map((r) => r.slug))
	}));
	$effect(() => {
		view.readUrl(page.url);
	});
	const ref = $derived(resolveReference(view.choice, { berlin, bezirk, regions: byslug }));
	const kind = $derived(view.choice.kind);
	const refName = $derived(
		kind === 'berlin'
			? m.place_ref_berlin_median()
			: kind === 'bezirk'
				? m.place_total_of({ name: ref.label })
				: ref.label
	);
	// Im Satz mit Artikel („Der Ring ist der Berliner Median.“), als Beschriftung ohne.
	const refText = $derived(kind === 'berlin' ? m.place_ref_berlin_median_text() : refName);

	// Gespeicherter Wettkampf-Rang (kiez_rank/bezirk_rank), nicht selbst gerechnet.
	const scoreRank = $derived(
		data.compositeRank.rang !== null
			? { rang: data.compositeRank.rang, total: data.compositeRank.total }
			: null
	);
	const neighborSlugs = $derived(data.neighbors.map((n) => n.slug));
	const mapHref = (layers: string | undefined) =>
		layers
			? `${localizedHref('/explore', opts.locale)}?${atlasQuery(layers, data.profile.centroid, name)}`
			: null;
	const pick = (slug: string) => {
		if (slug === data.profile.slug) return;
		view.setChoice({
			kind: neighborSlugs.includes(slug)
				? 'nachbar'
				: data.similar.some((s) => s.slug === slug)
					? 'aehnlich'
					: 'frei',
			slug
		});
	};

	// --- Wahlen ---
	let wahlArt = $state<WahlArt>('btw');
	const wahlCache = new WahlCache();
	$effect(() => {
		if (ref.slug) void wahlCache.load('kiez', ref.slug);
	});
	const wahlRef = $derived(
		kind === 'berlin' ? wahlData.berlin : kind === 'bezirk' ? wahlData.bezirk : wahlCache.current
	);
	const wahlRefName = $derived(kind === 'berlin' ? m.place_ref_all_berlin() : ref.label);
	const wahlOwn = $derived(wahlData.own[wahlArt]);
	const wahlRefPoints = $derived(wahlRef?.[wahlArt] ?? []);
	const wahlLead = $derived(
		wahlSentences(wahlFacts(wahlOwn, wahlRefPoints), {
			wahl: wahlArt,
			name,
			ref: wahlRefName,
			locale: getLocale()
		})
	);
	const years = $derived([...new Set(wahlOwn.map((p) => p.jahr))].sort());
	const pct = (v: number) => formatPercent(v / 100, { decimals: 0, locale: opts.locale });

	const headline = $derived(
		scoreRank
			? m.place_headline_kiez_ranked({
					score: formatScore(self?.dims.composite ?? null, opts),
					rank: scoreRank.rang,
					total: scoreRank.total
				})
			: m.place_headline_kiez({ score: formatScore(self?.dims.composite ?? null, opts) })
	);
	const overview = $derived(
		self
			? scoreRank
				? m.place_ov_kiez_ranked({
						name,
						score: formatScore(self.dims.composite, opts),
						rank: scoreRank.rang,
						total: scoreRank.total,
						ref: refText
					})
				: m.place_ov_kiez({ name, score: formatScore(self.dims.composite, opts), ref: refText })
			: ''
	);
	const profileDims: readonly Dim[] = ['composite', ...RATED_DIMS, 'kriminalitaet'];
	const jump = $derived([
		...CHAPTERS.map((c) => ({ id: c.id, short: chapterText(c.id, opts).short })),
		{ id: 'wahlen', short: m.place_jump_wahlen() },
		{ id: 'nachbarn', short: m.place_jump_nachbarn() },
		{ id: 'ueberblick', short: m.place_jump_score() },
		{ id: 'fragen', short: m.place_jump_fragen() }
	]);
</script>

<!-- Links tragen den Sprachpräfix selbst (localizedHref). -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<ReferenceBar
	berlinNote={berlin.note ?? ''}
	bezirkLabel={bezirkName}
	neighbors={data.neighbors.map((n) => ({ slug: n.slug, name: n.name }))}
	similar={data.similar.map((n) => ({ slug: n.slug, name: n.name }))}
	all={all
		.filter((r) => r.slug !== data.profile.slug)
		.map((r) => ({ slug: r.slug, name: r.name, group: r.parentName ?? '' }))
		.sort(
			(a, b) =>
				a.group.localeCompare(b.group, opts.locale) || a.name.localeCompare(b.name, opts.locale)
		)}
	freeLabel={m.place_free_kiez()}
	choice={view.choice}
	mode={view.mode}
	chapters={jump}
	onchoice={(c) => view.setChoice(c)}
	onmode={(m) => view.setMode(m)}
/>

<NoJsFallback />
<PlaceSeo
	kind="kiez"
	slug={data.profile.slug}
	{name}
	{bezirkName}
	bezirkSlug={data.bezirkSlug}
	centroid={data.profile.centroid}
	einwohner={data.profile.einwohner}
	flaecheHa={data.profile.flaecheHa}
	stichtag={data.einwohnerStichtag}
	score={self?.dims.composite ?? null}
	rank={data.compositeRank}
/>

<article class="mx-auto max-w-6xl px-4 pb-24">
	<header class="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-12 lg:py-14">
		<div class="min-w-0">
			<p class="text-dense-label text-ink-subtle">
				{#if bezirkName && data.bezirkSlug}
					{m.place_eyebrow_kiez_prefix()}
					<a
						class="inline-flex min-h-6 items-center underline underline-offset-2 hover:text-accent"
						href={localizedHref(`/bezirk/${data.bezirkSlug}`, opts.locale)}
						onclick={() => trackLanding('eyebrow_link', 'kiez')}>{bezirkName}</a
					>
				{:else}
					{m.place_eyebrow_kiez({ bezirk: bezirkName ?? '' })}
				{/if}
			</p>
			<RegionTitle {name} />
			<p class="mt-2 text-base text-ink-muted tabular-nums">
				{m.place_facts_kiez({
					inhabitants: formatCount(data.profile.einwohner, opts),
					area: formatDecimal(data.profile.flaecheHa / 100, { ...opts, maximumFractionDigits: 1 })
				})}
			</p>
			<!-- Eigene Prosa je Kiez: der einzige frei formulierte Text der Seite (SEO, kein Template). -->
			{#each data.profileProse as paragraph, i (i)}
				<p
					class="mt-4 max-w-[62ch] text-base leading-body text-ink {i === 0 ? 'text-lg' : ''}"
					lang={data.profileLocale}
				>
					{paragraph}
				</p>
			{/each}
			<p class="mt-6 border-t border-rule pt-4 text-base text-ink">
				<strong class="font-semibold">{headline}</strong>
				<span class="text-ink-muted"> {m.place_explainer_kiez()}</span>
				<a
					class="inline-flex min-h-6 items-center text-accent underline"
					href={localizedHref('/methodik/kiez-score', opts.locale)}>{m.place_method_link()}</a
				>
			</p>
		</div>
		{#if data.map}
			<ScoreMap
				image={data.map}
				ownName={name}
				label={m.place_map_label_kiez({ bezirk: bezirkName ?? '', name })}
			/>
		{/if}
	</header>

	{#if self}
		{#each CHAPTERS as spec (spec.id)}
			<Chapter
				{spec}
				mode={view.mode}
				regions={all}
				own={self}
				{unitPlural}
				{ref}
				{refName}
				refIsLine={kind === 'bezirk'}
				refIsBerlin={kind === 'berlin'}
				refHeadName={ref.label}
				refHeadSub={kind === 'bezirk'
					? m.place_sub_total()
					: kind === 'nachbar'
						? m.place_ref_neighbor_kiez()
						: kind === 'aehnlich'
							? m.place_sub_similar_kiez()
							: m.place_sub_other_kiez()}
				highlight={new Set(neighborSlugs)}
				highlightLabel={m.place_highlight_kiez()}
				mapHref={mapHref(spec.mapLayers)}
				pageType="kiez"
				onpick={pick}
			/>
		{/each}
	{/if}

	<Section id="wahlen" title={m.place_wahl_title_kiez()} mode={view.mode}>
		{#snippet text()}
			{#if wahlLead.length > 0}
				<p>{wahlLead.join(' ')}</p>
			{/if}
			{#if wahlCache.failed && ref.slug}
				<p role="status" class="text-sm text-ink">
					{m.place_wahl_ref_failed({ ref: ref.label })}
					<button
						type="button"
						class="ml-1 min-h-6 text-accent underline"
						onclick={() => ref.slug && wahlCache.load('kiez', ref.slug)}
						>{m.place_wahl_retry()}</button
					>
				</p>
			{/if}
			<p class="text-sm">{m.place_wahl_hint_kiez()}</p>
		{/snippet}
		{#snippet controls()}<WahlSwitch bind:value={wahlArt} />{/snippet}
		{#snippet chart()}
			{#if wahlOwn.length > 0}
				<PartyMultiples
					own={wahlOwn}
					ref={wahlRefPoints}
					ownLabel={name}
					refLabel={ref.slug ? ref.label : m.place_ref_total_result({ name: wahlRefName })}
				/>
			{/if}
		{/snippet}
		{#snippet table(visible)}
			<DataTable
				{visible}
				caption={m.place_wahl_caption({ name, ref: wahlRefName })}
				head={[m.place_table_party(), ...years.map(String)]}
				rows={[...new Set(wahlOwn.map((p) => p.partei))].map((partei) => [
					partei,
					...years.map((j) => {
						const o = wahlOwn.find((p) => p.partei === partei && p.jahr === j);
						const r = wahlRefPoints.find((p) => p.partei === partei && p.jahr === j);
						return `${o ? pct(o.anteil) : '–'}${r ? ` (${pct(r.anteil)})` : ''}`;
					})
				])}
			/>
		{/snippet}
		{#snippet sources()}
			<p>
				{m.place_wahl_sources()}
				<a
					class="inline-flex min-h-6 items-center text-accent underline"
					href={localizedHref('/methodik', opts.locale)}>{m.place_wahl_method_link()}</a
				>.
			</p>
		{/snippet}
	</Section>

	<section
		id="nachbarn"
		aria-labelledby="nachbarn-h"
		class="scroll-mt-16 border-t border-rule py-12"
	>
		<h2 id="nachbarn-h" class="text-xl font-semibold text-ink">{m.place_nb_title_kiez()}</h2>
		<p class="mt-2 mb-6 max-w-2xl text-base text-ink-muted">
			{m.place_nb_intro_kiez()}
		</p>
		<NeighborList
			route="/kiez/[slug]"
			pageType="kiez"
			oncompare={pick}
			groups={[
				{
					title: m.place_nb_borders(),
					hint: m.place_nb_borders_kiez(),
					action: 'neighbor',
					entries: data.neighbors.map((n) => ({ slug: n.slug, name: n.name }))
				},
				{
					title: m.place_nb_similar(),
					hint: m.place_nb_similar_hint(),
					action: 'similar',
					entries: data.similar.map((n) => ({ slug: n.slug, name: n.name }))
				}
			]}
		/>
		<nav aria-label={m.place_more_nav()} class="mt-10">
			<ul class="flex flex-col gap-1 text-base">
				{#if bezirkName && data.bezirkSlug}
					<li>
						<a
							class="inline-flex min-h-6 items-center text-accent underline"
							href={localizedHref(`/bezirk/${data.bezirkSlug}`, opts.locale)}
							>{m.place_more_bezirk({ bezirk: bezirkName })}</a
						>
					</li>
				{/if}
				{#if bezirkName && data.bezirkSlug}
					<li>
						<a
							class="inline-flex min-h-6 items-center text-accent underline"
							data-testid="overview-link-kieze"
							href={`${localizedHref('/kieze', opts.locale)}#${bezirkAnchorId(data.bezirkSlug)}`}
							>{m.overview_link_kieze_in_bezirk({ bezirk: bezirkName })}</a
						>
					</li>
				{/if}
				<li>
					<a
						class="inline-flex min-h-6 items-center text-accent underline"
						href={localizedHref('/kieze', opts.locale)}>{m.place_more_kieze()}</a
					>
				</li>
				<li>
					<a
						class="inline-flex min-h-6 items-center text-accent underline"
						href={localizedHref('/kiez-score', opts.locale)}>{m.place_more_ranking_kiez()}</a
					>
				</li>
				<li>
					<a
						class="inline-flex min-h-6 items-center text-accent underline"
						href={localizedHref('/berlin-wahlen', opts.locale)}>{m.place_more_wahlen()}</a
					>
				</li>
			</ul>
		</nav>
	</section>

	{#if self}
		<Section id="ueberblick" title={m.place_ov_title()} mode={view.mode}>
			{#snippet text()}
				<p>{overview}</p>
				<p class="text-sm">{m.place_ov_note()}</p>
			{/snippet}
			{#snippet chart()}
				<ProfileChart
					dims={profileDims}
					own={self.dims}
					ownLabel={name}
					refValues={ref.dims}
					refLabel={ref.note ? `${refName} (${ref.note})` : refName}
				/>
			{/snippet}
			{#snippet table(visible)}
				<DataTable
					{visible}
					caption={m.place_ov_caption({ name, ref: refName })}
					head={[m.place_table_area(), name, refName, m.place_table_gap()]}
					rows={profileDims.map((d) => [
						dimLabel(d, opts),
						formatScore(self.dims[d], opts),
						formatScore(ref.dims[d], opts),
						self.dims[d] !== null && ref.dims[d] !== null
							? signedPoints((self.dims[d] ?? 0) - (ref.dims[d] ?? 0))
							: '–'
					])}
				/>
			{/snippet}
			{#snippet sources()}
				<p>
					<a
						class="inline-flex min-h-6 items-center text-accent underline"
						href={localizedHref('/methodik/kiez-score', opts.locale)}>{m.place_method_link()}</a
					>
				</p>
			{/snippet}
		</Section>
	{/if}

	<FaqBlock
		items={data.faq.map((f) => ({
			...f,
			chapter: { id: f.chapter, title: chapterText(f.chapter, opts).title }
		}))}
	/>
</article>
