<!--
	Skizze 11/2026: neue Bezirksseite. Wegwerf-Prototyp, /demo ist noindex.
	Dieselben Kapitel wie die Kiezseite, mit dem Bezirk als Einheit unter den 12 Bezirken.
	Die eigenen Kieze erscheinen nur als Spanne innerhalb des Bezirks.
-->
<script lang="ts">
	import '$lib/skizzen/components/skizze.css';
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
	import { rankOf } from '$lib/skizzen/stats';
	import { latestLeader } from '$lib/skizzen/wahl-summary';
	import { CHAPTERS, characterPoints } from '$lib/skizzen/topics';
	import { RATED_DIMS, type Dim } from '$lib/skizzen/types';
	import type { WahlArt } from '$lib/skizzen/wahl-types';
	import { dimLabel, formatInt, formatScore } from '$lib/skizzen/labels';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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
			`mittlerer Bezirk, Median der ${bezirke.length} Bezirke`
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
	const refName = $derived(kind === 'berlin' ? 'Berlin-Median' : ref.label);

	const scoreRank = $derived(
		rankOf(
			self?.dims.composite ?? null,
			bezirke.map((b) => b.dims.composite)
		)
	);
	const character = $derived(
		self
			? characterPoints(
					self.metrics,
					bezirke.map((b) => b.metrics),
					'Bezirke'
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
	const wahlRefName = $derived(kind === 'berlin' ? 'ganz Berlin' : ref.label);
	const wahlOwn = $derived(data.wahl.own[wahlArt]);
	const wahlRefPoints = $derived(wahlRef?.[wahlArt] ?? []);
	const leader = $derived(latestLeader(wahlOwn, wahlRefPoints));
	const years = $derived([...new Set(wahlOwn.map((p) => p.jahr))].sort());
	const fmtPct = (v: number) => `${Math.round(v)} %`;

	const profileDims: readonly Dim[] = ['composite', ...RATED_DIMS, 'kriminalitaet'];
	const jump = [
		...CHAPTERS.map((c) => ({ id: c.id, short: c.short })),
		{ id: 'wahlen', short: 'Wahlen' },
		{ id: 'nachbarn', short: 'Nachbarn' },
		{ id: 'ueberblick', short: 'Kiez-Score' },
		{ id: 'fragen', short: 'Fragen' }
	];
</script>

<svelte:head>
	<title>Skizze: {name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<ReferenceBar
	berlinNote={berlin.note ?? ''}
	bezirkLabel={null}
	neighborLabel="Nachbarbezirk"
	neighbors={data.neighborSlugs.map((s) => ({ slug: s, name: byslug.get(s)?.name ?? s }))}
	similar={[]}
	all={bezirke
		.filter((b) => b.slug !== data.profile.slug)
		.map((b) => ({ slug: b.slug, name: b.name, group: 'Alle Bezirke' }))
		.sort((a, b) => a.name.localeCompare(b.name, 'de'))}
	freeLabel="Anderer Bezirk"
	choice={skizze.choice}
	mode={skizze.mode}
	chapters={jump}
	onchoice={(c) => skizze.setChoice(c)}
	onmode={(m) => skizze.setMode(m)}
/>

<main class="mx-auto max-w-6xl px-4 pb-24">
	<header class="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-12 lg:py-14">
		<div class="min-w-0">
			<p class="text-dense-label tracking-wide text-ink-subtle uppercase">Bezirk von Berlin</p>
			<h1
				class="mt-1 text-3xl leading-tight font-semibold text-balance [overflow-wrap:anywhere] text-ink lg:text-4xl"
			>
				{name}
			</h1>
			<p class="mt-2 text-base text-ink-muted tabular-nums">
				{formatInt(data.profile.einwohner)} Einwohnerinnen und Einwohner auf {formatInt(
					data.profile.flaecheHa / 100
				)} km², {data.kieze.length} Kieze
			</p>
			{#if character.length > 0}
				<ul class="mt-5 flex flex-col gap-1.5 text-lg leading-snug text-ink">
					{#each character as c (c)}<li>{c}.</li>{/each}
				</ul>
			{/if}
			<p class="mt-6 border-t border-rule pt-4 text-base text-ink">
				<strong class="font-semibold"
					>Kiez-Score {formatScore(self?.dims.composite ?? null)} von 100{scoreRank
						? `, Platz ${scoreRank.rang} von ${scoreRank.total} Bezirken`
						: ''}.</strong
				>
				<span class="text-ink-muted">
					Der Kiez-Score fasst fünf Bereiche zusammen: Ruhe und Luft, Grün und Hitze, Mobilität,
					Versorgung und Wohnschutz. Höher ist besser. Für Bezirke gilt derselbe Wert, über den
					ganzen Bezirk gerechnet.</span
				>
				<a class="text-accent underline" href={resolve('/methodik/kiez-score')}
					>So entsteht der Kiez-Score</a
				>
			</p>
		</div>
		<div class="flex flex-col gap-4">
			{#if data.outline}
				<ScoreMap
					outline={data.outline}
					scores={kiezScores}
					ownSlug={null}
					label="Karte der {data.kieze.length} Kieze in {name}, eingefärbt nach Kiez-Score."
				/>
			{/if}
			{#if data.berlinMap}
				<div class="flex items-center gap-3">
					<ScoreMap
						outline={data.berlinMap}
						scores={bezirkNames}
						ownSlug={data.profile.slug}
						plain
						label="Lage von {name} in Berlin"
						class="w-24 shrink-0"
					/>
					<p class="text-sm text-ink-muted">Lage von {name} in Berlin</p>
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
				unitPlural="Bezirke"
				{ref}
				{refName}
				refIsLine={false}
				refIsBerlin={kind === 'berlin'}
				refHeadName={ref.label}
				refHeadSub={kind === 'nachbar' ? 'Nachbarbezirk' : 'Vergleichsbezirk'}
				highlight={neighborSet}
				highlightLabel="Nachbarbezirke"
				mapHref={null}
				kieze={data.kieze}
				onpick={pick}
			/>
		{/each}
	{/if}

	<Section id="wahlen" title="Wahlen seit 2011" mode={skizze.mode}>
		{#snippet text()}
			{#if leader}
				<p>
					Bei der letzten Wahl {leader.jahr} lag {leader.partei} in {name} vorn, mit {fmtPct(
						leader.anteil
					)}.{#if leader.refAnteil !== null}&#32;In {wahlRefName} kam {leader.partei} auf {fmtPct(
							leader.refAnteil
						)}.{/if}
				</p>
			{/if}
			<p class="text-sm">
				Jede Kachel ist eine Partei, alle mit derselben Skala. Auf Bezirksebene reichen die Daten
				zurück bis 2011 (Abgeordnetenhaus) und 2013 (Bundestag).
			</p>
		{/snippet}
		{#snippet controls()}<WahlSwitch bind:value={wahlArt} />{/snippet}
		{#snippet chart()}
			{#if wahlOwn.length > 0}
				<PartyMultiples
					own={wahlOwn}
					ref={wahlRefPoints}
					ownLabel={name}
					refLabel={ref.slug ? ref.label : `${wahlRefName}, Gesamtergebnis`}
				/>
			{/if}
		{/snippet}
		{#snippet table(visible)}
			<DataTable
				{visible}
				caption="Stimmenanteile in {name} (Prozent), in Klammern {wahlRefName}"
				head={['Partei', ...years.map(String)]}
				rows={[...new Set(wahlOwn.map((p) => p.partei))].map((partei) => [
					partei,
					...years.map((j) => {
						const o = wahlOwn.find((p) => p.partei === partei && p.jahr === j);
						const r = wahlRefPoints.find((p) => p.partei === partei && p.jahr === j);
						return `${o ? fmtPct(o.anteil) : '–'}${r ? ` (${fmtPct(r.anteil)})` : ''}`;
					})
				])}
			/>
		{/snippet}
		{#snippet sources()}
			<p>
				Amt für Statistik Berlin-Brandenburg und Landeswahlleiterin Berlin.
				<a class="text-accent underline" href={resolve('/methodik')}>Methodik der Wahldaten</a>.
			</p>
		{/snippet}
	</Section>

	<section
		id="nachbarn"
		aria-labelledby="nachbarn-h"
		class="scroll-mt-28 border-t border-rule py-12"
	>
		<h2 id="nachbarn-h" class="text-xl font-semibold text-ink">Nachbarbezirke und Kieze</h2>
		<p class="mt-2 mb-6 max-w-2xl text-base text-ink-muted">
			„Vergleichen“ rechnet die ganze Seite auf diesen Bezirk um. Der Name führt zu seiner eigenen
			Seite.
		</p>
		<NeighborList
			route="/demo/bezirk-skizze/[slug]"
			oncompare={pick}
			groups={[
				{
					title: 'Grenzt an',
					hint: 'Bezirke mit gemeinsamer Grenze',
					entries: data.neighborSlugs.map((s) => ({ slug: s, name: byslug.get(s)?.name ?? s }))
				}
			]}
		/>
		<h3 class="mt-8 text-base font-semibold text-ink">Die {data.kieze.length} Kieze in {name}</h3>
		<ul class="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
			{#each [...data.kieze].sort((a, b) => a.name.localeCompare(b.name, 'de')) as k (k.slug)}
				<li>
					<a
						class="text-sm text-ink underline underline-offset-2 hover:text-accent"
						href={resolve('/demo/kiez-skizze/[slug]', { slug: k.slug })}>{k.name}</a
					>
				</li>
			{/each}
		</ul>
	</section>

	{#if self}
		<Section id="ueberblick" title="Der Kiez-Score im Überblick" mode={skizze.mode}>
			{#snippet text()}
				<p>
					{name} erreicht {formatScore(self.dims.composite)} von 100 Punkten{scoreRank
						? `, Platz ${scoreRank.rang} von ${scoreRank.total} Bezirken`
						: ''}. Jede Zeile ist ein Bereich, höher ist besser. Der Ring ist {refName}.
				</p>
				<p class="text-sm">
					Kultur und erfasste Kriminalität zählen nicht zum Kiez-Score. Kriminalität steht abgesetzt
					und ohne Wertung.
				</p>
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
					caption="Kiez-Score nach Bereichen: {name} und {refName}"
					head={['Bereich', name, refName, 'Abstand']}
					rows={profileDims.map((d) => [
						dimLabel(d),
						formatScore(self.dims[d]),
						formatScore(ref.dims[d]),
						self.dims[d] !== null && ref.dims[d] !== null
							? signedPoints((self.dims[d] ?? 0) - (ref.dims[d] ?? 0))
							: '–'
					])}
				/>
			{/snippet}
			{#snippet sources()}
				<p>
					<a class="text-accent underline" href={resolve('/methodik/kiez-score')}
						>So entsteht der Kiez-Score</a
					>
				</p>
			{/snippet}
		</Section>
	{/if}

	<FaqBlock items={data.faq} />
</main>
