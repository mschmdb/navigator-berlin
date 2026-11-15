<!--
	Skizze 11/2026: neue Kiezseite. Wegwerf-Prototyp, /demo ist noindex.
	Gegliedert nach Themen, nicht nach Score. Die Kapitel zeigen Messwerte in echten Einheiten;
	Score-Punkte stehen nur in Karte, Einstiegszeile und Überblick am Ende.
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
	import { dimLabel, fmtPct, formatInt, formatKm2, formatScore } from '$lib/skizzen/labels';
	import { localHref } from '$lib/skizzen/locale';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const opts = $derived({ locale: getLocale() });
	const unitPlural = $derived(m.skizze_units_kieze());

	const name = $derived(data.profile.name);
	const self = $derived(data.regions.find((r) => r.slug === data.profile.slug) ?? null);
	const byslug = $derived(new Map(data.regions.map((r) => [r.slug, r])));
	const bezirkName = $derived(data.profile.bezirk || null);
	const all = $derived(data.regions);

	const berlin = $derived(
		aggregateProfile(
			'berlin',
			'Berlin',
			all,
			'median',
			data.berlinFigures,
			m.skizze_berlin_note_kiez({ count: all.length })
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
					data.bezirkRegion.figures,
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

	const skizze = new SkizzeState(() => ({
		self: data.profile.slug,
		hasParent: !!data.bezirkSlug,
		neighbors: data.neighbors.map((n) => n.slug),
		similar: data.similar.map((n) => n.slug),
		all: new Set(all.map((r) => r.slug))
	}));
	$effect(() => {
		skizze.readUrl(page.url);
	});
	const ref = $derived(resolveReference(skizze.choice, { berlin, bezirk, regions: byslug }));
	const kind = $derived(skizze.choice.kind);
	const refName = $derived(
		kind === 'berlin'
			? m.skizze_ref_berlin_median()
			: kind === 'bezirk'
				? m.skizze_total_of({ name: ref.label })
				: ref.label
	);

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
					all.map((r) => r.metrics),
					unitPlural,
					3,
					opts
				)
			: []
	);
	const neighborSlugs = $derived(data.neighbors.map((n) => n.slug));
	const scoreMap = $derived(
		new Map(all.map((r) => [r.slug, { name: r.name, composite: r.dims.composite }]))
	);
	const mapHref = (layers: string | undefined) => {
		if (!layers) return null;
		const [lng, lat] = data.profile.centroid;
		const q = new URLSearchParams({
			layers,
			address: `${lng.toFixed(4)},${lat.toFixed(4)}`,
			q: name
		});
		return `${localHref('/explore', opts)}?${q.toString()}`;
	};
	const pick = (slug: string) => {
		if (slug === data.profile.slug) return;
		skizze.setChoice({
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
		kind === 'berlin' ? data.wahl.berlin : kind === 'bezirk' ? data.wahl.bezirk : wahlCache.current
	);
	const wahlRefName = $derived(kind === 'berlin' ? m.skizze_ref_all_berlin() : ref.label);
	const wahlOwn = $derived(data.wahl.own[wahlArt]);
	const wahlRefPoints = $derived(wahlRef?.[wahlArt] ?? []);
	const leader = $derived(latestLeader(wahlOwn, wahlRefPoints));
	const years = $derived([...new Set(wahlOwn.map((p) => p.jahr))].sort());
	const pct = (v: number) => fmtPct(v, opts);

	const headline = $derived(
		scoreRank
			? m.skizze_headline_kiez_ranked({
					score: formatScore(self?.dims.composite ?? null, opts),
					rank: scoreRank.rang,
					total: scoreRank.total
				})
			: m.skizze_headline_kiez({ score: formatScore(self?.dims.composite ?? null, opts) })
	);
	const overview = $derived(
		self
			? scoreRank
				? m.skizze_ov_kiez_ranked({
						name,
						score: formatScore(self.dims.composite, opts),
						rank: scoreRank.rang,
						total: scoreRank.total,
						ref: refName
					})
				: m.skizze_ov_kiez({ name, score: formatScore(self.dims.composite, opts), ref: refName })
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
	freeLabel={m.skizze_free_kiez()}
	choice={skizze.choice}
	mode={skizze.mode}
	chapters={jump}
	onchoice={(c) => skizze.setChoice(c)}
	onmode={(m) => skizze.setMode(m)}
/>

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

<main class="mx-auto max-w-6xl px-4 pb-24">
	<header class="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-12 lg:py-14">
		<div class="min-w-0">
			<p class="text-dense-label tracking-wide text-ink-subtle uppercase">
				{m.skizze_eyebrow_kiez({ bezirk: bezirkName ?? '' })}
			</p>
			<h1
				class="mt-1 text-3xl leading-tight font-semibold text-balance [overflow-wrap:anywhere] text-ink lg:text-4xl"
			>
				<!-- Umbruch nach dem Schrägstrich statt mitten im Wort -->
				{name.replaceAll('/', '/​')}
			</h1>
			<p class="mt-2 text-base text-ink-muted tabular-nums">
				{m.skizze_facts_kiez({
					inhabitants: formatInt(data.profile.einwohner, opts),
					area: formatKm2(data.profile.flaecheHa / 100, opts)
				})}
			</p>
			{#if character.length > 0}
				<ul class="mt-5 flex flex-col gap-1.5 text-lg leading-snug text-ink">
					{#each character as c (c)}<li>{c}.</li>{/each}
				</ul>
			{/if}
			<p class="mt-6 border-t border-rule pt-4 text-base text-ink">
				<strong class="font-semibold">{headline}</strong>
				<span class="text-ink-muted"> {m.skizze_explainer_kiez()}</span>
				<a class="text-accent underline" href={localHref('/methodik/kiez-score', opts)}
					>{m.skizze_method_link()}</a
				>
			</p>
		</div>
		{#if data.outline}
			<ScoreMap
				outline={data.outline}
				scores={scoreMap}
				ownSlug={data.profile.slug}
				label={m.skizze_map_label_kiez({ bezirk: bezirkName ?? '', name })}
			/>
		{/if}
	</header>

	{#if self}
		{#each CHAPTERS as spec (spec.id)}
			<Chapter
				{spec}
				mode={skizze.mode}
				regions={all}
				own={self}
				{unitPlural}
				{ref}
				{refName}
				refIsLine={kind === 'bezirk'}
				refIsBerlin={kind === 'berlin'}
				refHeadName={ref.label}
				refHeadSub={kind === 'bezirk'
					? m.skizze_sub_total()
					: kind === 'nachbar'
						? m.skizze_ref_neighbor_kiez()
						: kind === 'aehnlich'
							? m.skizze_sub_similar_kiez()
							: m.skizze_sub_other_kiez()}
				highlight={new Set(neighborSlugs)}
				highlightLabel={m.skizze_highlight_kiez()}
				mapHref={mapHref(spec.mapLayers)}
				onpick={pick}
			/>
		{/each}
	{/if}

	<Section id="wahlen" title={m.skizze_wahl_title_kiez()} mode={skizze.mode}>
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
			<p class="text-sm">{m.skizze_wahl_hint_kiez()}</p>
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
		<h2 id="nachbarn-h" class="text-xl font-semibold text-ink">{m.skizze_nb_title_kiez()}</h2>
		<p class="mt-2 mb-6 max-w-2xl text-base text-ink-muted">
			{m.skizze_nb_intro_kiez()}
		</p>
		<NeighborList
			route="/demo/kiez-skizze/[slug]"
			oncompare={pick}
			groups={[
				{
					title: m.skizze_nb_borders(),
					hint: m.skizze_nb_borders_kiez(),
					entries: data.neighbors.map((n) => ({ slug: n.slug, name: n.name }))
				},
				{
					title: m.skizze_nb_similar(),
					hint: m.skizze_nb_similar_hint(),
					entries: data.similar.map((n) => ({ slug: n.slug, name: n.name }))
				}
			]}
		/>
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
				all.map((r) => r.metrics),
				unitPlural,
				opts
			)}
		/>
	{/if}
</main>
