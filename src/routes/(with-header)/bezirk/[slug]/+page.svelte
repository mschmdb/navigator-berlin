<!--
	Bezirksseite (NAV-104/105).
	Dieselben Kapitel wie die Kiezseite, mit dem Bezirk als Einheit unter den 12 Bezirken.
	Die eigenen Kieze erscheinen nur als Spanne innerhalb des Bezirks.
-->
<script lang="ts">
	import { formatCount, formatPercent } from '$lib/i18n/format.js';
	import '$lib/components/place/place.css';
	import RegionTitle from '$lib/components/atlas/region-title.svelte';
	import PlaceSeo from '$lib/components/place/place-seo.svelte';
	import ReferenceBar from '$lib/components/place/reference-bar.svelte';
	import Section from '$lib/components/place/place-section.svelte';
	import Chapter from '$lib/components/place/chapter.svelte';
	import ScoreMap from '$lib/components/place/score-map.svelte';
	import ProfileChart from '$lib/components/place/profile-chart.svelte';
	import PartyMultiples from '$lib/components/place/party-multiples.svelte';
	import WahlSwitch from '$lib/components/place/wahl-switch.svelte';
	import NeighborList from '$lib/components/place/neighbor-list.svelte';
	import FaqBlock from '$lib/components/place/place-faq.svelte';
	import DataTable from '$lib/components/place/data-table.svelte';
	import { aggregateProfile, resolveReference } from '$lib/place/reference';
	import { PlaceViewState, WahlCache } from '$lib/place/reference-state.svelte';
	import { latestLeader } from '$lib/place/wahl-summary';
	import { CHAPTERS, chapterText } from '$lib/place/topics';
	import { trackLanding } from '$lib/utils/plausible.js';
	import { atlasQuery } from '$lib/place/atlas-link';
	import { buildChapterFaq } from '$lib/place/faq';
	import { RATED_DIMS, type Dim } from '$lib/place/types';
	import type { WahlArt } from '$lib/place/wahl-types';
	import { dimLabel, formatScore, signedPoints } from '$lib/place/labels';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const opts = $derived({ locale: getLocale() });
	const unitPlural = $derived(m.place_units_bezirke());

	const name = $derived(data.profile.name);
	const bezirke = $derived(data.bezirke);
	const self = $derived(bezirke.find((b) => b.slug === data.profile.slug) ?? null);
	const byslug = $derived(new Map(bezirke.map((b) => [b.slug, b])));
	const neighborSet = $derived(new Set(data.neighborSlugs));

	const berlin = $derived(
		aggregateProfile(
			'berlin',
			'Berlin',
			bezirke,
			'median',
			m.place_berlin_note_bezirk({ count: bezirke.length })
		)
	);
	const view = new PlaceViewState(() => ({
		self: data.profile.slug,
		hasParent: false,
		neighbors: data.neighborSlugs,
		similar: [],
		all: new Set(data.bezirke.map((b) => b.slug))
	}));
	$effect(() => {
		view.readUrl(page.url);
	});
	const ref = $derived(resolveReference(view.choice, { berlin, bezirk: null, regions: byslug }));
	const kind = $derived(view.choice.kind);
	const refName = $derived(kind === 'berlin' ? m.place_ref_berlin_median() : ref.label);

	// Gespeicherter Wettkampf-Rang (kiez_rank/bezirk_rank), nicht selbst gerechnet.
	const scoreRank = $derived(
		data.compositeRank.rang !== null
			? { rang: data.compositeRank.rang, total: data.compositeRank.total }
			: null
	);
	const kiezScores = $derived(
		new Map(data.kieze.map((k) => [k.slug, { name: k.name, composite: k.dims.composite }]))
	);
	const bezirkNames = $derived(
		new Map(bezirke.map((b) => [b.slug, { name: b.name, composite: b.dims.composite }]))
	);
	const pick = (slug: string) => {
		if (slug === data.profile.slug) return;
		view.setChoice({ kind: neighborSet.has(slug) ? 'nachbar' : 'frei', slug });
	};

	// --- Wahlen ---
	let wahlArt = $state<WahlArt>('agh');
	const wahlCache = new WahlCache();
	$effect(() => {
		if (ref.slug) void wahlCache.load('bezirk', ref.slug);
	});
	const wahlRef = $derived(kind === 'berlin' ? data.wahl.berlin : wahlCache.current);
	const wahlRefName = $derived(kind === 'berlin' ? m.place_ref_all_berlin() : ref.label);
	const wahlOwn = $derived(data.wahl.own[wahlArt]);
	const wahlRefPoints = $derived(wahlRef?.[wahlArt] ?? []);
	const leader = $derived(latestLeader(wahlOwn, wahlRefPoints));
	const years = $derived([...new Set(wahlOwn.map((p) => p.jahr))].sort());
	const pct = (v: number) => formatPercent(v / 100, { decimals: 0, locale: opts.locale });

	const headline = $derived(
		scoreRank
			? m.place_headline_bezirk_ranked({
					score: formatScore(self?.dims.composite ?? null, opts),
					rank: scoreRank.rang,
					total: scoreRank.total
				})
			: m.place_headline_bezirk({ score: formatScore(self?.dims.composite ?? null, opts) })
	);
	const overview = $derived(
		self
			? scoreRank
				? m.place_ov_bezirk_ranked({
						name,
						score: formatScore(self.dims.composite, opts),
						rank: scoreRank.rang,
						total: scoreRank.total,
						ref: refName
					})
				: m.place_ov_bezirk({ name, score: formatScore(self.dims.composite, opts), ref: refName })
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
	bezirkLabel={null}
	level="bezirk"
	neighbors={data.neighborSlugs.map((s) => ({ slug: s, name: byslug.get(s)?.name ?? s }))}
	similar={[]}
	all={bezirke
		.filter((b) => b.slug !== data.profile.slug)
		.map((b) => ({ slug: b.slug, name: b.name, group: m.place_group_all_bezirke() }))
		.sort((a, b) => a.name.localeCompare(b.name, opts.locale))}
	freeLabel={m.place_free_bezirk()}
	choice={view.choice}
	mode={view.mode}
	chapters={jump}
	onchoice={(c) => view.setChoice(c)}
	onmode={(m) => view.setMode(m)}
/>

<PlaceSeo
	kind="bezirk"
	slug={data.profile.slug}
	{name}
	centroid={data.profile.centroid}
	einwohner={data.profile.einwohner}
	flaecheHa={data.profile.flaecheHa}
	stichtag={data.einwohnerStichtag}
	score={data.bezirkComposite}
	rank={data.compositeRank}
/>

<main class="mx-auto max-w-6xl px-4 pb-24">
	<header class="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-12 lg:py-14">
		<div class="min-w-0">
			<p class="text-dense-label tracking-wide text-ink-subtle uppercase">
				{m.place_eyebrow_bezirk()}
			</p>
			<RegionTitle {name} />
			<p class="mt-2 text-base text-ink-muted tabular-nums">
				{m.place_facts_bezirk({
					inhabitants: formatCount(data.profile.einwohner, opts),
					area: formatCount(Math.round(data.profile.flaecheHa / 100), opts),
					count: data.kieze.length
				})}
			</p>
			<!-- Eigene Prosa je Bezirk: der einzige frei formulierte Text der Seite (SEO, kein Template). -->
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
				<span class="text-ink-muted"> {m.place_explainer_bezirk()}</span>
				<a class="text-accent underline" href={localizedHref('/methodik/kiez-score', opts.locale)}
					>{m.place_method_link()}</a
				>
			</p>
		</div>
		<div class="flex flex-col gap-4">
			{#if data.outline}
				<ScoreMap
					outline={data.outline}
					scores={kiezScores}
					ownSlug={null}
					label={m.place_map_label_bezirk({ count: data.kieze.length, name })}
				/>
			{/if}
			{#if data.berlinMap}
				<div class="flex items-center gap-3">
					<ScoreMap
						outline={data.berlinMap}
						scores={bezirkNames}
						ownSlug={data.profile.slug}
						plain
						label={m.place_map_location({ name })}
						class="w-24 shrink-0"
					/>
					<p class="text-sm text-ink-muted">{m.place_map_location({ name })}</p>
				</div>
			{/if}
		</div>
	</header>

	{#if self}
		{#each CHAPTERS as spec (spec.id)}
			<Chapter
				{spec}
				mode={view.mode}
				regions={bezirke}
				own={self}
				{unitPlural}
				{ref}
				{refName}
				refIsLine={false}
				refIsBerlin={kind === 'berlin'}
				refHeadName={ref.label}
				refHeadSub={kind === 'nachbar' ? m.place_ref_neighbor_bezirk() : m.place_sub_other_bezirk()}
				highlight={neighborSet}
				highlightLabel={m.place_highlight_bezirk()}
				mapHref={spec.mapLayers
					? `${localizedHref('/explore', opts.locale)}?${atlasQuery(spec.mapLayers, data.profile.centroid, name)}`
					: null}
				pageType="bezirk"
				kieze={data.kieze}
				onpick={pick}
			/>
		{/each}
	{/if}

	<Section id="wahlen" title={m.place_wahl_title_bezirk()} mode={view.mode}>
		{#snippet text()}
			{#if leader}
				<p>
					{m.place_wahl_leader({
						jahr: leader.jahr,
						partei: leader.partei,
						name,
						pct: pct(leader.anteil)
					})}{#if leader.refAnteil !== null}{` ${m.place_wahl_leader_ref({
							ref: wahlRefName,
							partei: leader.partei,
							pct: pct(leader.refAnteil)
						})}`}{/if}
				</p>
			{/if}
			<p class="text-sm">{m.place_wahl_hint_bezirk()}</p>
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
				<a class="text-accent underline" href={localizedHref('/methodik', opts.locale)}
					>{m.place_wahl_method_link()}</a
				>.
			</p>
		{/snippet}
	</Section>

	<section
		id="nachbarn"
		aria-labelledby="nachbarn-h"
		class="scroll-mt-44 border-t border-rule py-12"
	>
		<h2 id="nachbarn-h" class="text-xl font-semibold text-ink">{m.place_nb_title_bezirk()}</h2>
		<p class="mt-2 mb-6 max-w-2xl text-base text-ink-muted">
			{m.place_nb_intro_bezirk()}
		</p>
		<NeighborList
			route="/bezirk/[slug]"
			pageType="bezirk"
			oncompare={pick}
			groups={[
				{
					title: m.place_nb_borders(),
					hint: m.place_nb_borders_bezirk(),
					action: 'neighbor',
					entries: data.neighborSlugs.map((s) => ({ slug: s, name: byslug.get(s)?.name ?? s }))
				}
			]}
		/>
		<h3 class="mt-8 text-base font-semibold text-ink">
			{m.place_nb_kieze_in({ count: data.kieze.length, name })}
		</h3>
		<ul class="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
			{#each [...data.kieze].sort( (a, b) => a.name.localeCompare(b.name, opts.locale) ) as k (k.slug)}
				<li>
					<a
						class="inline-flex min-h-6 items-center text-sm text-ink underline underline-offset-2 hover:text-accent"
						href={localizedHref(`/kiez/${k.slug}`, opts.locale)}
						onclick={() => trackLanding('list_link', 'bezirk')}>{k.name}</a
					>
				</li>
			{/each}
		</ul>
		<nav aria-label={m.place_more_nav()} class="mt-10">
			<ul class="flex flex-col gap-1 text-base">
				<li>
					<a
						class="inline-flex min-h-6 items-center text-accent underline"
						href={localizedHref('/bezirke', opts.locale)}>{m.place_more_bezirke()}</a
					>
				</li>
				<li>
					<a
						class="inline-flex min-h-6 items-center text-accent underline"
						href={`${localizedHref('/kiez-score', opts.locale)}?view=bezirke`}
						>{m.place_more_ranking_bezirk()}</a
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
					<a class="text-accent underline" href={localizedHref('/methodik/kiez-score', opts.locale)}
						>{m.place_method_link()}</a
					>
				</p>
			{/snippet}
		</Section>
	{/if}

	{#if self}
		<FaqBlock
			items={buildChapterFaq(
				self,
				bezirke.map((r) => r.metrics),
				unitPlural,
				opts
			)}
		/>
	{/if}
</main>
