<!--
	Skizze 11/2026: neue Kiezseite. Wegwerf-Prototyp, /demo ist noindex.
	Gegliedert nach Themen, nicht nach Score. Die Kapitel zeigen Messwerte in echten Einheiten;
	Score-Punkte stehen nur in Karte, Einstiegszeile und Überblick am Ende.
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
			`mittlerer Kiez, Median aller ${all.length} Kieze`
		)
	);
	const bezirk = $derived(
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
		kind === 'berlin' ? 'Berlin-Median' : kind === 'bezirk' ? `${ref.label} gesamt` : ref.label
	);

	const scoreRank = $derived(
		rankOf(
			self?.dims.composite ?? null,
			all.map((r) => r.dims.composite)
		)
	);
	const character = $derived(
		self
			? characterPoints(
					self.metrics,
					all.map((r) => r.metrics),
					'Kieze'
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
		return `${resolve('/explore')}?${q.toString()}`;
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
	bezirkLabel={bezirkName}
	neighbors={data.neighbors.map((n) => ({ slug: n.slug, name: n.name }))}
	similar={data.similar.map((n) => ({ slug: n.slug, name: n.name }))}
	all={all
		.filter((r) => r.slug !== data.profile.slug)
		.map((r) => ({ slug: r.slug, name: r.name, group: r.parentName ?? '' }))
		.sort((a, b) => a.group.localeCompare(b.group, 'de') || a.name.localeCompare(b.name, 'de'))}
	freeLabel="Anderer Kiez"
	choice={skizze.choice}
	mode={skizze.mode}
	chapters={jump}
	onchoice={(c) => skizze.setChoice(c)}
	onmode={(m) => skizze.setMode(m)}
/>

<main class="mx-auto max-w-6xl px-4 pb-24">
	<header class="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-12 lg:py-14">
		<div class="min-w-0">
			<p class="text-dense-label tracking-wide text-ink-subtle uppercase">Kiez in {bezirkName}</p>
			<h1
				class="mt-1 text-3xl leading-tight font-semibold text-balance [overflow-wrap:anywhere] text-ink lg:text-4xl"
			>
				<!-- Umbruch nach dem Schrägstrich statt mitten im Wort -->
				{name.replaceAll('/', '/​')}
			</h1>
			<p class="mt-2 text-base text-ink-muted tabular-nums">
				{formatInt(data.profile.einwohner)} Einwohnerinnen und Einwohner auf {(
					data.profile.flaecheHa / 100
				).toLocaleString('de-DE', { maximumFractionDigits: 1 })}&nbsp;km²
			</p>
			{#if character.length > 0}
				<ul class="mt-5 flex flex-col gap-1.5 text-lg leading-snug text-ink">
					{#each character as c (c)}<li>{c}.</li>{/each}
				</ul>
			{/if}
			<p class="mt-6 border-t border-rule pt-4 text-base text-ink">
				<strong class="font-semibold"
					>Kiez-Score {formatScore(self?.dims.composite ?? null)} von 100{scoreRank
						? `, Platz ${scoreRank.rang} von ${scoreRank.total}`
						: ''}.</strong
				>
				<span class="text-ink-muted">
					Der Kiez-Score fasst fünf Bereiche zusammen: Ruhe und Luft, Grün und Hitze, Mobilität,
					Versorgung und Wohnschutz. Höher ist besser.</span
				>
				<a class="text-accent underline" href={resolve('/methodik/kiez-score')}
					>So entsteht der Kiez-Score</a
				>
			</p>
		</div>
		{#if data.outline}
			<ScoreMap
				outline={data.outline}
				scores={scoreMap}
				ownSlug={data.profile.slug}
				label="Karte der Kieze in {bezirkName}, eingefärbt nach Kiez-Score. {name} ist dunkel umrandet."
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
				unitPlural="Kieze"
				{ref}
				{refName}
				refIsLine={kind === 'bezirk'}
				refIsBerlin={kind === 'berlin'}
				refHeadName={ref.label}
				refHeadSub={kind === 'bezirk'
					? 'gesamt'
					: kind === 'nachbar'
						? 'Nachbarkiez'
						: kind === 'aehnlich'
							? 'ähnlicher Kiez'
							: 'Vergleichskiez'}
				highlight={new Set(neighborSlugs)}
				highlightLabel="Nachbarkieze"
				mapHref={mapHref(spec.mapLayers)}
				onpick={pick}
			/>
		{/each}
	{/if}

	<Section id="wahlen" title="Wahlen seit 2016" mode={skizze.mode}>
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
				Jede Kachel ist eine Partei, alle mit derselben Skala. Ergebnisse auf Kiezebene gibt es ab
				2016, für den Bundestag ab 2017.
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
		<h2 id="nachbarn-h" class="text-xl font-semibold text-ink">Nachbarn und ähnliche Kieze</h2>
		<p class="mt-2 mb-6 max-w-2xl text-base text-ink-muted">
			„Vergleichen“ rechnet die ganze Seite auf diesen Kiez um. Der Name führt zu seiner eigenen
			Seite.
		</p>
		<NeighborList
			route="/demo/kiez-skizze/[slug]"
			oncompare={pick}
			groups={[
				{
					title: 'Grenzt an',
					hint: 'Kieze mit gemeinsamer Grenze',
					entries: data.neighbors.map((n) => ({ slug: n.slug, name: n.name }))
				},
				{
					title: 'Ähnlich',
					hint: 'Kieze mit ähnlichen Werten in den fünf Bereichen des Kiez-Scores',
					entries: data.similar.map((n) => ({ slug: n.slug, name: n.name }))
				}
			]}
		/>
	</section>

	{#if self}
		<Section id="ueberblick" title="Der Kiez-Score im Überblick" mode={skizze.mode}>
			{#snippet text()}
				<p>
					{name} erreicht {formatScore(self.dims.composite)} von 100 Punkten{scoreRank
						? `, Platz ${scoreRank.rang} von ${scoreRank.total} Kiezen`
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
