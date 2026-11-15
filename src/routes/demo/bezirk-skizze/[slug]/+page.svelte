<!--
	Skizze 11/2026: neue Bezirksseite. Wegwerf-Prototyp, /demo ist noindex.
	Kernaussage: Ein Bezirk ist kein Durchschnitt. Die Seite zeigt seine Kieze im Berliner Feld.
-->
<script lang="ts">
	import '$lib/skizzen/components/skizze.css';
	import ReferenceBar from '$lib/skizzen/components/ReferenceBar.svelte';
	import Section from '$lib/skizzen/components/Section.svelte';
	import ProfileChart from '$lib/skizzen/components/ProfileChart.svelte';
	import StripGroup, { type StripRow } from '$lib/skizzen/components/StripGroup.svelte';
	import RankedKieze from '$lib/skizzen/components/RankedKieze.svelte';
	import PartyMultiples from '$lib/skizzen/components/PartyMultiples.svelte';
	import WahlSwitch from '$lib/skizzen/components/WahlSwitch.svelte';
	import DataTable from '$lib/skizzen/components/DataTable.svelte';
	import { aggregateProfile, resolveReference } from '$lib/skizzen/reference';
	import { SkizzeState, WahlCache } from '$lib/skizzen/reference-state.svelte';
	import { compareSentence, dimDiffs, signedPoints } from '$lib/skizzen/compare-text';
	import { median, niceDomain, rankOf, spread } from '$lib/skizzen/stats';
	import { latestLeader } from '$lib/skizzen/wahl-summary';
	import { FIGURES, RATED_DIMS, type Dim, type Figure } from '$lib/skizzen/types';
	import type { WahlArt } from '$lib/skizzen/wahl-types';
	import {
		FIGURE_SPECS,
		dimLabel,
		formatFigure,
		formatInt,
		formatScore
	} from '$lib/skizzen/labels';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const self = $derived(data.bezirke.find((b) => b.slug === data.profile.slug) ?? null);
	const byslug = $derived(new Map(data.bezirke.map((b) => [b.slug, b])));
	const own = $derived(data.kieze.filter((k) => k.parentSlug === data.profile.slug));
	const ownSet = $derived(new Set(own.map((k) => k.slug)));

	const berlin = $derived(
		aggregateProfile(
			'berlin',
			'Berlin',
			data.bezirke,
			'median',
			data.berlinFigures,
			`Median der ${data.bezirke.length} Bezirke`
		)
	);
	const skizze = new SkizzeState(() => ({
		self: data.profile.slug,
		hasParent: false,
		neighbors: [],
		similar: [],
		all: new Set(data.bezirke.map((b) => b.slug))
	}));
	const ref = $derived(resolveReference(skizze.choice, { berlin, bezirk: null, regions: byslug }));
	const refName = $derived(ref.label);

	const profileDims: readonly Dim[] = ['composite', ...RATED_DIMS, 'kriminalitaet'];
	const lead = $derived(
		self ? compareSentence(dimDiffs(RATED_DIMS, self.dims, ref.dims), dimLabel, refName) : ''
	);
	const bezirkRank = $derived(
		rankOf(
			self?.dims.composite ?? null,
			data.bezirke.map((b) => b.dims.composite)
		)
	);

	// --- Spannweite der Kieze je Dimension ---
	const spreads = $derived(profileDims.map((dim) => ({ dim, s: spread(own, (k) => k.dims[dim]) })));
	const widest = $derived(
		spreads
			.filter((e) => e.dim !== 'kriminalitaet' && e.s !== null)
			.sort((a, b) => (b.s?.range ?? 0) - (a.s?.range ?? 0))[0] ?? null
	);
	function refMarkerFor(value: number | null) {
		return [{ value, label: ref.note ? `${refName}, ${ref.note}` : refName }];
	}
	const kiezMedian = (dim: Dim) => median(data.kieze.map((k) => k.dims[dim]));

	const scoreRows: StripRow[] = $derived(
		spreads.map(({ dim, s }) => ({
			key: dim,
			label: dimLabel(dim),
			meta: s ? `Spanne ${Math.round(s.range)} Punkte` : 'keine Angabe',
			items: data.kieze.map((k) => ({ slug: k.slug, name: k.name, value: k.dims[dim] })),
			domain: [0, 100] as const,
			format: (v: number) => formatScore(v),
			markers: [
				{ value: self?.dims[dim] ?? null, label: data.profile.name, strong: true },
				...refMarkerFor(ref.dims[dim])
			],
			neutral: dim === 'kriminalitaet'
		}))
	);
	const extremes = $derived([
		...new Set(spreads.flatMap((e) => (e.s ? [e.s.min.slug, e.s.max.slug] : [])))
	]);

	// --- Kiezliste ---
	let sortDim = $state<Dim>('composite');

	// --- Rohwerte ---
	const figureRows: StripRow[] = $derived(
		FIGURES.map((f) => {
			const s = spread(own, (k) => k.figures[f]);
			return {
				key: f,
				label: FIGURE_SPECS[f].label,
				meta: s
					? `${formatFigure(f, s.min.figures[f])} bis ${formatFigure(f, s.max.figures[f])}`
					: 'keine Angabe',
				items: data.kieze.map((k) => ({ slug: k.slug, name: k.name, value: k.figures[f] })),
				domain: niceDomain(
					data.kieze.map((k) => k.figures[f]),
					f === 'bestandsmiete' || f === 'hitze' ? 1 : 10
				),
				format: (v: number) => formatFigure(f, v),
				markers: [
					{ value: self?.figures[f] ?? null, label: `${data.profile.name} gesamt`, strong: true },
					{
						value: ref.figures[f],
						label: skizze.choice.kind === 'berlin' ? 'Berlin gesamt' : `${refName} gesamt`
					}
				],
				neutral: true,
				note: FIGURE_SPECS[f].what
			};
		})
	);

	// --- Wahlen ---
	let wahlArt = $state<WahlArt>('agh');
	const wahlCache = new WahlCache();
	$effect(() => {
		if (ref.slug) void wahlCache.load('bezirk', ref.slug);
	});
	$effect(() => {
		skizze.readUrl(page.url);
	});
	const wahlRef = $derived(skizze.choice.kind === 'berlin' ? data.wahl.berlin : wahlCache.current);
	const wahlOwn = $derived(data.wahl.own[wahlArt]);
	const wahlRefPoints = $derived(wahlRef?.[wahlArt] ?? []);
	const leader = $derived(latestLeader(wahlOwn, wahlRefPoints));
	const fmtPct = (v: number) => `${Math.round(v)} %`;
	const years = $derived([...new Set(wahlOwn.map((p) => p.jahr))].sort());
</script>

<svelte:head>
	<title>Skizze: {data.profile.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<ReferenceBar
	berlinNote={berlin.note ?? ''}
	bezirkLabel={null}
	neighbors={[]}
	similar={[]}
	all={data.bezirke
		.filter((b) => b.slug !== data.profile.slug)
		.map((b) => ({ slug: b.slug, name: b.name, group: 'Bezirke' }))
		.sort((a, b) => a.name.localeCompare(b.name, 'de'))}
	freeLabel="Anderer Bezirk"
	choice={skizze.choice}
	mode={skizze.mode}
	onchoice={(c) => skizze.setChoice(c)}
	onmode={(m) => skizze.setMode(m)}
/>

<main class="mx-auto max-w-6xl px-4 pb-24">
	<header class="grid gap-8 py-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12 lg:py-16">
		<div class="min-w-0">
			<p class="text-dense-label tracking-wide text-ink-subtle uppercase">Bezirk von Berlin</p>
			<h1
				class="mt-1 text-3xl leading-tight font-semibold text-balance [overflow-wrap:anywhere] text-ink lg:text-4xl"
			>
				{data.profile.name}
			</h1>
			<dl class="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
				<div>
					<dt class="text-ink-subtle">Einwohner</dt>
					<dd class="text-lg text-ink tabular-nums">{formatInt(data.profile.einwohner)}</dd>
				</div>
				<div>
					<dt class="text-ink-subtle">Fläche</dt>
					<dd class="text-lg text-ink tabular-nums">
						{formatInt(data.profile.flaecheHa / 100)} km²
					</dd>
				</div>
				<div>
					<dt class="text-ink-subtle">Kieze</dt>
					<dd class="text-lg text-ink tabular-nums">{own.length}</dd>
				</div>
				<div>
					<dt class="text-ink-subtle">Score, Rang</dt>
					<dd class="text-lg text-ink tabular-nums">
						{formatScore(self?.dims.composite ?? null)}, Platz {bezirkRank?.rang ?? '–'} von {bezirkRank?.total ??
							12}
					</dd>
				</div>
			</dl>
		</div>
		<div class="flex flex-col gap-4 text-lg leading-body text-ink">
			<p aria-live="polite" class="text-xl leading-snug">{lead}</p>
			{#each data.prose.slice(0, 1) as p, i (i)}<p class="text-base text-ink-muted">{p}</p>{/each}
		</div>
	</header>

	{#if self}
		<Section id="profil" eyebrow="1 Profil" title="Der Bezirk als Ganzes" mode={skizze.mode}>
			{#snippet text()}
				<p>
					Der gefüllte Punkt ist {data.profile.name}, der Ring ist {refName}{ref.note
						? ` (${ref.note})`
						: ''}. Rechts steht der Abstand in Punkten.
				</p>
				<p>
					Ein Bezirkswert ist ein Mittel über viele Kieze. Wie unterschiedlich die sind, zeigt der
					nächste Abschnitt.
				</p>
			{/snippet}
			{#snippet chart()}
				<ProfileChart
					dims={profileDims}
					own={self.dims}
					ownLabel={data.profile.name}
					refValues={ref.dims}
					refLabel={ref.note ? `${refName} (${ref.note})` : refName}
				/>
			{/snippet}
			{#snippet table(visible)}
				<DataTable
					{visible}
					caption="Kiez-Score-Dimensionen: {data.profile.name} und {refName}"
					head={['Dimension', data.profile.name, refName, 'Abstand']}
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
			{#snippet sources()}<p>
					Bezirks-Score von navigator.berlin. <a
						class="text-accent underline"
						href={resolve('/methodik/kiez-score')}>So entsteht der Score</a
					>.
				</p>{/snippet}
		</Section>

		<Section
			id="streuung"
			eyebrow="2 Streuung"
			title="Kein Bezirk ist ein Durchschnitt"
			mode={skizze.mode}
		>
			{#snippet text()}
				<p>
					Jeder Punkt ist einer der {data.kieze.length} Berliner Kieze. Schwarz sind die {own.length}
					Kieze in {data.profile.name}. Die blaue Linie ist der Bezirkswert, die gestrichelte {refName}.
				</p>
				{#if widest?.s}
					<p>
						Am weitesten liegen die Kieze bei {dimLabel(widest.dim)} auseinander: von {widest.s.min
							.name} ({formatScore(widest.s.min.dims[widest.dim])}) bis {widest.s.max.name} ({formatScore(
							widest.s.max.dims[widest.dim]
						)}).
					</p>
				{/if}
			{/snippet}
			{#snippet chart()}
				<StripGroup
					rows={scoreRows}
					ownSlug={null}
					highlight={ownSet}
					labelSlugs={extremes}
					refSlug={null}
				/>
			{/snippet}
			{#snippet table(visible)}
				<DataTable
					{visible}
					caption="Spannweite der Kieze in {data.profile.name}"
					head={['Dimension', 'Niedrigster Kiez', 'Höchster Kiez', 'Bezirk', refName]}
					rows={spreads.map(({ dim, s }) => [
						dimLabel(dim),
						s ? `${s.min.name} ${formatScore(s.min.dims[dim])}` : '–',
						s ? `${s.max.name} ${formatScore(s.max.dims[dim])}` : '–',
						formatScore(self.dims[dim]),
						formatScore(ref.dims[dim])
					])}
				/>
			{/snippet}
			{#snippet sources()}<p>Kiez = LOR-Bezirksregion 2021.</p>{/snippet}
		</Section>

		<Section
			id="kieze"
			eyebrow="3 Kieze"
			title="Die Kieze im Vergleich"
			mode={skizze.mode}
			interactive
		>
			{#snippet text()}
				<p>
					Die Liste sortiert sich nach der Dimension, die du wählst. So siehst du, welcher Kiez beim
					Grün vorn liegt und welcher bei der Mobilität.
				</p>
				<p class="text-sm">
					Gleiche Werte teilen sich den Platz, sortiert wird nach dem ungerundeten Wert.
				</p>
			{/snippet}
			{#snippet chart()}
				<RankedKieze
					kieze={own}
					all={data.kieze}
					dims={profileDims}
					bind:dim={sortDim}
					berlinMedian={kiezMedian(sortDim)}
				/>
			{/snippet}
			{#snippet table(visible)}
				{#if visible}
					<DataTable
						{visible}
						caption="Alle Kieze in {data.profile.name}, Kiez-Score-Dimensionen"
						head={['Kiez', ...profileDims.map((d) => dimLabel(d))]}
						rows={[...own]
							.sort((a, b) => (b.dims.composite ?? 0) - (a.dims.composite ?? 0))
							.map((k) => [k.name, ...profileDims.map((d) => formatScore(k.dims[d]))])}
					/>
				{/if}
			{/snippet}
		</Section>

		<Section
			id="rohwerte"
			eyebrow="4 Rohwerte"
			title="Die Zahlen hinter dem Score"
			mode={skizze.mode}
		>
			{#snippet text()}
				<p>
					Gemessene Werte in echten Einheiten. Die blaue Linie ist der Wert für den ganzen Bezirk,
					die gestrichelte {skizze.choice.kind === 'berlin' ? 'für ganz Berlin' : `für ${refName}`}.
				</p>
				<p>Diese Werte haben keine Richtung. Eine höhere Miete ist höher, nicht schlechter.</p>
			{/snippet}
			{#snippet chart()}
				<StripGroup
					rows={figureRows}
					ownSlug={null}
					highlight={ownSet}
					labelSlugs={[]}
					refSlug={null}
				/>
			{/snippet}
			{#snippet table(visible)}
				<DataTable
					{visible}
					caption="Rohwerte: {data.profile.name} und {refName}"
					head={['Kennzahl', data.profile.name, refName, 'Spanne der Kieze']}
					rows={figureRows.map((r) => [
						r.label,
						formatFigure(r.key as Figure, self.figures[r.key as Figure]),
						formatFigure(r.key as Figure, ref.figures[r.key as Figure]),
						r.meta
					])}
				/>
			{/snippet}
			{#snippet sources()}
				<ul class="flex flex-col gap-1">
					{#each FIGURES as f (f)}<li>
							<a class="text-accent underline" href={resolve(`/layer/${FIGURE_SPECS[f].layer}`)}
								>{FIGURE_SPECS[f].label}</a
							>: {FIGURE_SPECS[f].what}
						</li>{/each}
				</ul>
			{/snippet}
		</Section>
	{/if}

	<Section id="wahlen" eyebrow="5 Wahlen" title="Wie der Bezirk wählt" mode={skizze.mode}>
		{#snippet text()}
			{#if leader}
				<p>
					Bei der letzten Wahl {leader.jahr} lag {leader.partei} vorn, mit {fmtPct(
						leader.anteil
					)}.{#if leader.refAnteil !== null}
						In {refName} kam {leader.partei} auf {fmtPct(leader.refAnteil)}.{/if}
				</p>
			{/if}
			<p>
				Auf Bezirksebene reichen die Daten weiter zurück als im Kiez, beim Abgeordnetenhaus bis
				2011.
			</p>
		{/snippet}
		{#snippet controls()}<WahlSwitch bind:value={wahlArt} />{/snippet}
		{#snippet chart()}
			{#if wahlOwn.length > 0}
				<PartyMultiples
					own={wahlOwn}
					ref={wahlRefPoints}
					ownLabel={data.profile.name}
					refLabel={refName}
				/>
			{/if}
		{/snippet}
		{#snippet table(visible)}
			<DataTable
				{visible}
				caption="Stimmenanteile in {data.profile.name} (Prozent), in Klammern {refName}"
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
		{#snippet sources()}<p>
				Amt für Statistik Berlin-Brandenburg und Landeswahlleiterin Berlin. <a
					class="text-accent underline"
					href={resolve('/methodik')}>Methodik der Wahldaten</a
				>.
			</p>{/snippet}
	</Section>
</main>
