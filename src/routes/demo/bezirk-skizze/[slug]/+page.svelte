<!--
	Skizze 11/2026: neue Bezirksseite. Wegwerf-Prototyp, /demo ist noindex.
	Dieselben Kapitel wie die Kiezseite, mit dem Bezirk als Einheit unter den 12 Bezirken.
	Die eigenen Kieze erscheinen nur als Spanne innerhalb des Bezirks.
-->
<script lang="ts">
	import '$lib/skizzen/components/skizze.css';
	import PlaceSeo from '$lib/skizzen/components/PlaceSeo.svelte';
	import ReferenceBar from '$lib/skizzen/components/ReferenceBar.svelte';
	import Section from '$lib/skizzen/components/Section.svelte';
	import Chapter from '$lib/skizzen/components/Chapter.svelte';
	import ScoreMap from '$lib/skizzen/components/ScoreMap.svelte';
	import ProfileChart from '$lib/skizzen/components/ProfileChart.svelte';
	import PartyMultiples from '$lib/skizzen/components/PartyMultiples.svelte';
	import WahlSwitch from '$lib/skizzen/components/WahlSwitch.svelte';
	import NeighborList from '$lib/skizzen/components/NeighborList.svelte';
	import FaqBlock from '$lib/skizzen/components/FaqBlock.svelte';
	import DataTable from '$lib/skizzen/components/DataTable.svelte';
	import { aggregateProfile, resolveReference } from '$lib/skizzen/reference';
	import { SkizzeState, WahlCache } from '$lib/skizzen/reference-state.svelte';
	import { signedPoints } from '$lib/skizzen/compare-text';
	import { latestLeader } from '$lib/skizzen/wahl-summary';
	import { CHAPTERS, chapterText, characterPoints } from '$lib/skizzen/topics';
	import { buildChapterFaq } from '$lib/skizzen/faq';
	import { RATED_DIMS, type Dim } from '$lib/skizzen/types';
	import type { WahlArt } from '$lib/skizzen/wahl-types';
	import { dimLabel, fmtPct, formatInt, formatScore } from '$lib/skizzen/labels';
	import { localHref } from '$lib/skizzen/locale';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const opts = $derived({ locale: getLocale() });
	const unitPlural = $derived(m.skizze_units_bezirke());

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
			data.berlinFigures,
			m.skizze_berlin_note_bezirk({ count: bezirke.length })
		)
	);
	const skizze = new SkizzeState(() => ({
		self: data.profile.slug,
		hasParent: false,
		neighbors: data.neighborSlugs,
		similar: [],
		all: new Set(data.bezirke.map((b) => b.slug))
	}));
	$effect(() => {
		skizze.readUrl(page.url);
	});
	const ref = $derived(resolveReference(skizze.choice, { berlin, bezirk: null, regions: byslug }));
	const kind = $derived(skizze.choice.kind);
	const refName = $derived(kind === 'berlin' ? m.skizze_ref_berlin_median() : ref.label);

	// Gespeicherter Wettkampf-Rang (kiez_rank/bezirk_rank), nicht selbst gerechnet.
	const scoreRank = $derived(
		data.compositeRank.rang !== null
			? { rang: data.compositeRank.rang, total: data.compositeRank.total }
			: null
	);
	const character = $derived(
		self
			? characterPoints(
					self.metrics,
					bezirke.map((b) => b.metrics),
					unitPlural,
					3,
					opts
				)
			: []
	);
	const kiezScores = $derived(
		new Map(data.kieze.map((k) => [k.slug, { name: k.name, composite: k.dims.composite }]))
	);
	const bezirkNames = $derived(
		new Map(bezirke.map((b) => [b.slug, { name: b.name, composite: b.dims.composite }]))
	);
	const pick = (slug: string) => {
		if (slug === data.profile.slug) return;
		skizze.setChoice({ kind: neighborSet.has(slug) ? 'nachbar' : 'frei', slug });
	};

	// --- Wahlen ---
	let wahlArt = $state<WahlArt>('agh');
	const wahlCache = new WahlCache();
	$effect(() => {
		if (ref.slug) void wahlCache.load('bezirk', ref.slug);
	});
	const wahlRef = $derived(kind === 'berlin' ? data.wahl.berlin : wahlCache.current);
	const wahlRefName = $derived(kind === 'berlin' ? m.skizze_ref_all_berlin() : ref.label);
	const wahlOwn = $derived(data.wahl.own[wahlArt]);
	const wahlRefPoints = $derived(wahlRef?.[wahlArt] ?? []);
	const leader = $derived(latestLeader(wahlOwn, wahlRefPoints));
	const years = $derived([...new Set(wahlOwn.map((p) => p.jahr))].sort());
	const pct = (v: number) => fmtPct(v, opts);

	const headline = $derived(
		scoreRank
			? m.skizze_headline_bezirk_ranked({
					score: formatScore(self?.dims.composite ?? null, opts),
					rank: scoreRank.rang,
					total: scoreRank.total
				})
			: m.skizze_headline_bezirk({ score: formatScore(self?.dims.composite ?? null, opts) })
	);
	const overview = $derived(
		self
			? scoreRank
				? m.skizze_ov_bezirk_ranked({
						name,
						score: formatScore(self.dims.composite, opts),
						rank: scoreRank.rang,
						total: scoreRank.total,
						ref: refName
					})
				: m.skizze_ov_bezirk({ name, score: formatScore(self.dims.composite, opts), ref: refName })
			: ''
	);
	const profileDims: readonly Dim[] = ['composite', ...RATED_DIMS, 'kriminalitaet'];
	const jump = $derived([
		...CHAPTERS.map((c) => ({ id: c.id, short: chapterText(c.id, opts).short })),
		{ id: 'wahlen', short: m.skizze_jump_wahlen() },
		{ id: 'nachbarn', short: m.skizze_jump_nachbarn() },
		{ id: 'ueberblick', short: m.skizze_jump_score() },
		{ id: 'fragen', short: m.skizze_jump_fragen() }
	]);
</script>

<!-- Links tragen den Sprachpräfix selbst (localHref), resolve() kennt ihn nicht. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<ReferenceBar
	berlinNote={berlin.note ?? ''}
	bezirkLabel={null}
	level="bezirk"
	neighbors={data.neighborSlugs.map((s) => ({ slug: s, name: byslug.get(s)?.name ?? s }))}
	similar={[]}
	all={bezirke
		.filter((b) => b.slug !== data.profile.slug)
		.map((b) => ({ slug: b.slug, name: b.name, group: m.skizze_group_all_bezirke() }))
		.sort((a, b) => a.name.localeCompare(b.name, opts.locale))}
	freeLabel={m.skizze_free_bezirk()}
	choice={skizze.choice}
	mode={skizze.mode}
	chapters={jump}
	onchoice={(c) => skizze.setChoice(c)}
	onmode={(m) => skizze.setMode(m)}
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
				{m.skizze_eyebrow_bezirk()}
			</p>
			<h1
				class="mt-1 text-3xl leading-tight font-semibold text-balance [overflow-wrap:anywhere] text-ink lg:text-4xl"
			>
				{name}
			</h1>
			<p class="mt-2 text-base text-ink-muted tabular-nums">
				{m.skizze_facts_bezirk({
					inhabitants: formatInt(data.profile.einwohner, opts),
					area: formatInt(data.profile.flaecheHa / 100, opts),
					count: data.kieze.length
				})}
			</p>
			{#if character.length > 0}
				<ul class="mt-5 flex flex-col gap-1.5 text-lg leading-snug text-ink">
					{#each character as c (c)}<li>{c}.</li>{/each}
				</ul>
			{/if}
			<p class="mt-6 border-t border-rule pt-4 text-base text-ink">
				<strong class="font-semibold">{headline}</strong>
				<span class="text-ink-muted"> {m.skizze_explainer_bezirk()}</span>
				<a class="text-accent underline" href={localHref('/methodik/kiez-score', opts)}
					>{m.skizze_method_link()}</a
				>
			</p>
		</div>
		<div class="flex flex-col gap-4">
			{#if data.outline}
				<ScoreMap
					outline={data.outline}
					scores={kiezScores}
					ownSlug={null}
					label={m.skizze_map_label_bezirk({ count: data.kieze.length, name })}
				/>
			{/if}
			{#if data.berlinMap}
				<div class="flex items-center gap-3">
					<ScoreMap
						outline={data.berlinMap}
						scores={bezirkNames}
						ownSlug={data.profile.slug}
						plain
						label={m.skizze_map_location({ name })}
						class="w-24 shrink-0"
					/>
					<p class="text-sm text-ink-muted">{m.skizze_map_location({ name })}</p>
				</div>
			{/if}
		</div>
	</header>

	{#if self}
		{#each CHAPTERS as spec (spec.id)}
			<Chapter
				{spec}
				mode={skizze.mode}
				regions={bezirke}
				own={self}
				{unitPlural}
				{ref}
				{refName}
				refIsLine={false}
				refIsBerlin={kind === 'berlin'}
				refHeadName={ref.label}
				refHeadSub={kind === 'nachbar'
					? m.skizze_ref_neighbor_bezirk()
					: m.skizze_sub_other_bezirk()}
				highlight={neighborSet}
				highlightLabel={m.skizze_highlight_bezirk()}
				mapHref={null}
				kieze={data.kieze}
				onpick={pick}
			/>
		{/each}
	{/if}

	<Section id="wahlen" title={m.skizze_wahl_title_bezirk()} mode={skizze.mode}>
		{#snippet text()}
			{#if leader}
				<p>
					{m.skizze_wahl_leader({
						jahr: leader.jahr,
						partei: leader.partei,
						name,
						pct: pct(leader.anteil)
					})}{#if leader.refAnteil !== null}{m.skizze_wahl_leader_ref({
							ref: wahlRefName,
							partei: leader.partei,
							pct: pct(leader.refAnteil)
						})}{/if}
				</p>
			{/if}
			<p class="text-sm">{m.skizze_wahl_hint_bezirk()}</p>
		{/snippet}
		{#snippet controls()}<WahlSwitch bind:value={wahlArt} />{/snippet}
		{#snippet chart()}
			{#if wahlOwn.length > 0}
				<PartyMultiples
					own={wahlOwn}
					ref={wahlRefPoints}
					ownLabel={name}
					refLabel={ref.slug ? ref.label : m.skizze_ref_total_result({ name: wahlRefName })}
				/>
			{/if}
		{/snippet}
		{#snippet table(visible)}
			<DataTable
				{visible}
				caption={m.skizze_wahl_caption({ name, ref: wahlRefName })}
				head={[m.skizze_table_party(), ...years.map(String)]}
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
				{m.skizze_wahl_sources()}
				<a class="text-accent underline" href={localHref('/methodik', opts)}
					>{m.skizze_wahl_method_link()}</a
				>.
			</p>
		{/snippet}
	</Section>

	<section
		id="nachbarn"
		aria-labelledby="nachbarn-h"
		class="scroll-mt-28 border-t border-rule py-12"
	>
		<h2 id="nachbarn-h" class="text-xl font-semibold text-ink">{m.skizze_nb_title_bezirk()}</h2>
		<p class="mt-2 mb-6 max-w-2xl text-base text-ink-muted">
			{m.skizze_nb_intro_bezirk()}
		</p>
		<NeighborList
			route="/demo/bezirk-skizze/[slug]"
			oncompare={pick}
			groups={[
				{
					title: m.skizze_nb_borders(),
					hint: m.skizze_nb_borders_bezirk(),
					entries: data.neighborSlugs.map((s) => ({ slug: s, name: byslug.get(s)?.name ?? s }))
				}
			]}
		/>
		<h3 class="mt-8 text-base font-semibold text-ink">
			{m.skizze_nb_kieze_in({ count: data.kieze.length, name })}
		</h3>
		<ul class="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
			{#each [...data.kieze].sort( (a, b) => a.name.localeCompare(b.name, opts.locale) ) as k (k.slug)}
				<li>
					<a
						class="inline-flex min-h-6 items-center text-sm text-ink underline underline-offset-2 hover:text-accent"
						href={localHref(`/demo/kiez-skizze/${k.slug}`, opts)}>{k.name}</a
					>
				</li>
			{/each}
		</ul>
	</section>

	{#if self}
		<Section id="ueberblick" title={m.skizze_ov_title()} mode={skizze.mode}>
			{#snippet text()}
				<p>{overview}</p>
				<p class="text-sm">{m.skizze_ov_note()}</p>
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
					caption={m.skizze_ov_caption({ name, ref: refName })}
					head={[m.skizze_table_area(), name, refName, m.skizze_table_gap()]}
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
					<a class="text-accent underline" href={localHref('/methodik/kiez-score', opts)}
						>{m.skizze_method_link()}</a
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
