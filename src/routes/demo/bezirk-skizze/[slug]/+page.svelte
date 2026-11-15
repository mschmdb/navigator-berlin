<!--
	Skizze 11/2026: neue Bezirksseite. Wegwerf-Prototyp, /demo ist noindex.
	Der Bezirk ist die Einheit: verglichen mit Berlin und den anderen 11 Bezirken.
	Kieze erscheinen nur dort, wo sie etwas über den Bezirk erzählen (Spanne innen).
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
	import { countBelow, niceDomain, rankOf, spread } from '$lib/skizzen/stats';
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
	const refName = $derived(skizze.choice.kind === 'berlin' ? 'Berlin-Median' : ref.label);
	const refPhrase = $derived(
		skizze.choice.kind === 'berlin' ? 'dem Median der 12 Bezirke' : ref.label
	);
	const wahlRefName = $derived(skizze.choice.kind === 'berlin' ? 'ganz Berlin' : ref.label);
	const refFull = $derived(ref.note ? `${refName} (${ref.note})` : refName);

	const profileDims: readonly Dim[] = ['composite', ...RATED_DIMS, 'kriminalitaet'];
	const lead = $derived(
		self
			? compareSentence(dimDiffs(RATED_DIMS, self.dims, ref.dims), dimLabel, refPhrase, name)
			: ''
	);
	const rank = (dim: Dim) =>
		rankOf(
			self?.dims[dim] ?? null,
			bezirke.map((b) => b.dims[dim])
		);

	// --- Einordnung unter den 12 Bezirken ---
	const scoreRows: StripRow[] = $derived(
		profileDims.map((dim) => {
			const rk = rank(dim);
			return {
				key: dim,
				label: dimLabel(dim),
				meta:
					dim === 'kriminalitaet'
						? 'ohne Rang, ohne Wertung'
						: rk
							? `Platz ${rk.rang} von ${rk.total}`
							: 'keine Angabe',
				items: bezirke.map((b) => ({ slug: b.slug, name: b.name, value: b.dims[dim] })),
				domain: [0, 100] as const,
				format: (v: number) => formatScore(v),
				refLine: null
			};
		})
	);
	const bestWorst = $derived.by(() => {
		const ranked = RATED_DIMS.map((d) => ({ d, rk: rank(d) }))
			.filter((e) => e.rk !== null)
			.sort((a, b) => (a.rk?.rang ?? 0) - (b.rk?.rang ?? 0));
		return ranked.length > 1 ? { best: ranked[0], worst: ranked[ranked.length - 1] } : null;
	});

	// --- Spanne innen: nur die Kieze dieses Bezirks ---
	let sortDim = $state<Dim>('composite');
	const sortSpread = $derived(spread(data.kieze, (k) => k.dims[sortDim]));
	const widest = $derived(
		RATED_DIMS.map((d) => ({ d, s: spread(data.kieze, (k) => k.dims[d]) }))
			.filter((e) => e.s !== null)
			.sort((a, b) => (b.s?.range ?? 0) - (a.s?.range ?? 0))[0] ?? null
	);

	// --- Rohwerte unter den 12 Bezirken ---
	const figureRows: StripRow[] = $derived(
		FIGURES.map((f) => {
			const values = bezirke.map((b) => b.figures[f]);
			const below = countBelow(self?.figures[f] ?? null, values);
			return {
				key: f,
				label: `${FIGURE_SPECS[f].label} in ${FIGURE_SPECS[f].unit}`,
				meta:
					below === null
						? 'keine Angabe'
						: below === 0
							? 'kein Bezirk liegt niedriger'
							: `höher als in ${below} von ${values.filter((v) => v !== null).length - 1} Bezirken`,
				items: bezirke.map((b) => ({ slug: b.slug, name: b.name, value: b.figures[f] })),
				domain: niceDomain(values, f === 'bestandsmiete' || f === 'hitze' ? 1 : 10),
				format: (v: number) => formatFigure(f, v),
				refLine: null,
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
	const wahlRef = $derived(skizze.choice.kind === 'berlin' ? data.wahl.berlin : wahlCache.current);
	const wahlOwn = $derived(data.wahl.own[wahlArt]);
	const wahlRefPoints = $derived(wahlRef?.[wahlArt] ?? []);
	const leader = $derived(latestLeader(wahlOwn, wahlRefPoints));
	const fmtPct = (v: number) => `${Math.round(v)} %`;
	const years = $derived([...new Set(wahlOwn.map((p) => p.jahr))].sort());

	function pick(slug: string) {
		if (slug === data.profile.slug) return;
		skizze.setChoice({ kind: neighborSet.has(slug) ? 'nachbar' : 'frei', slug });
	}
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
				{name}
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
					<dt class="text-ink-subtle">Kiez-Score des Bezirks</dt>
					<dd class="text-lg text-ink tabular-nums">
						{formatScore(self?.dims.composite ?? null)} von 100
					</dd>
				</div>
				<div>
					<dt class="text-ink-subtle">Rang unter 12 Bezirken</dt>
					<dd class="text-lg text-ink tabular-nums">
						{rank('composite') ? `Platz ${rank('composite')?.rang}` : '–'}
					</dd>
				</div>
			</dl>
		</div>
		<div class="flex flex-col gap-4 text-lg leading-body text-ink">
			<p aria-live="polite" class="text-xl leading-snug">{lead}</p>
			<p class="text-base text-ink-muted">
				Der Kiez-Score von navigator.berlin fasst fünf Bereiche zusammen: Ruhe und Luft, Grün und
				Hitze, Mobilität, Versorgung und Wohnschutz. Er reicht von 0 bis 100, höher ist besser. Für
				jeden Bezirk gibt es denselben Wert, über den ganzen Bezirk gerechnet.
				<a class="text-accent underline" href={resolve('/methodik/kiez-score')}
					>So entsteht der Kiez-Score</a
				>.
			</p>
			{#each data.prose.slice(0, 1) as p, i (i)}<p class="text-base text-ink-muted">{p}</p>{/each}
		</div>
	</header>

	{#if self}
		<Section id="profil" title="Die fünf Bereiche im Vergleich" mode={skizze.mode}>
			{#snippet text()}
				<p>
					Jede Zeile ist ein Bereich des Kiez-Scores, 0 bis 100 Punkte, höher ist besser. Der
					gefüllte Punkt ist
					{name}, der Ring ist {refFull}. Rechts steht der Abstand in Punkten.
				</p>
				<p class="text-sm">
					Kultur und erfasste Kriminalität zählen nicht zum Kiez-Score. Kriminalität steht
					abgesetzt: Sie zählt angezeigte Fälle und sagt nichts darüber, wie sicher sich ein Ort
					anfühlt.
				</p>
			{/snippet}
			{#snippet chart()}
				<ProfileChart
					dims={profileDims}
					own={self.dims}
					ownLabel={name}
					refValues={ref.dims}
					refLabel={refFull}
				/>
			{/snippet}
			{#snippet table(visible)}
				<DataTable
					{visible}
					caption="Kiez-Score nach Bereichen: {name} und {refFull}"
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
					Kiez-Score von navigator.berlin, für den Bezirk gerechnet.
					<a class="text-accent underline" href={resolve('/methodik/kiez-score')}
						>So entsteht der Kiez-Score</a
					>.
				</p>
			{/snippet}
		</Section>

		<Section id="einordnung" title="Wo {name} unter den 12 Bezirken steht" mode={skizze.mode}>
			{#snippet text()}
				<p>
					Jeder Punkt ist einer der {bezirke.length} Bezirke. So sieht man, ob {name} knapp vorn liegt
					oder weit vom Feld entfernt.
				</p>
				{#if bestWorst}
					<p>
						Am weitesten vorn liegt {name} bei {dimLabel(bestWorst.best.d)} (Platz {bestWorst.best
							.rk?.rang}), am weitesten hinten bei {dimLabel(bestWorst.worst.d)} (Platz {bestWorst
							.worst.rk?.rang}).
					</p>
				{/if}
				<p class="text-sm">
					Fahr mit der Maus über einen Punkt, um den Namen zu sehen. Ein Klick vergleicht mit diesem
					Bezirk.
				</p>
			{/snippet}
			{#snippet chart()}
				<StripGroup
					rows={scoreRows}
					ownSlug={data.profile.slug}
					highlight={neighborSet}
					highlightLabel="Nachbarbezirke"
					medianLabel="Median der 12 Bezirke"
					unitPlural="Bezirke"
					refSlug={ref.slug}
					r={6}
					onpick={pick}
				/>
			{/snippet}
			{#snippet table(visible)}
				<DataTable
					{visible}
					caption="Alle {bezirke.length} Bezirke, Kiez-Score nach Bereichen"
					head={['Bezirk', ...profileDims.map((d) => dimLabel(d))]}
					rows={[...bezirke]
						.sort((a, b) => (b.dims.composite ?? 0) - (a.dims.composite ?? 0))
						.map((b) => [b.name, ...profileDims.map((d) => formatScore(b.dims[d]))])}
				/>
			{/snippet}
			{#snippet sources()}<p>Rang absteigend, gleiche Werte teilen sich den Platz.</p>{/snippet}
		</Section>

		<Section
			id="kieze"
			title="Wie verschieden die Kieze in {name} sind"
			mode={skizze.mode}
			interactive
		>
			{#snippet text()}
				<p>
					Ein Bezirkswert ist ein Mittel über {data.kieze.length} Kieze. Die Liste zeigt nur die Kieze
					von {name}, sortiert nach dem gewählten Bereich.
				</p>
				{#if sortSpread}
					<p>
						Bei {dimLabel(sortDim)} reichen sie von {sortSpread.min.name} ({formatScore(
							sortSpread.min.dims[sortDim]
						)}) bis {sortSpread.max.name} ({formatScore(sortSpread.max.dims[sortDim])}), eine Spanne
						von
						{Math.round(sortSpread.range)} Punkten.
					</p>
				{/if}
				{#if widest && widest.d !== sortDim}
					<p class="text-sm">
						Am weitesten auseinander liegen die Kieze bei {dimLabel(widest.d)}: {Math.round(
							widest.s?.range ?? 0
						)} Punkte.
					</p>
				{/if}
			{/snippet}
			{#snippet chart()}
				<RankedKieze
					kieze={data.kieze}
					dims={profileDims}
					bind:dim={sortDim}
					bezirkName={name}
					bezirkValue={self.dims[sortDim]}
					berlinKiezMedian={data.kiezMedians[sortDim]}
				/>
			{/snippet}
			{#snippet table(visible)}
				{#if visible}
					<DataTable
						{visible}
						caption="Kieze in {name}, Kiez-Score nach Bereichen"
						head={['Kiez', ...profileDims.map((d) => dimLabel(d))]}
						rows={[...data.kieze]
							.sort((a, b) => (b.dims.composite ?? 0) - (a.dims.composite ?? 0))
							.map((k) => [k.name, ...profileDims.map((d) => formatScore(k.dims[d]))])}
					/>
				{/if}
			{/snippet}
			{#snippet sources()}<p>Kiez = LOR-Bezirksregion 2021.</p>{/snippet}
		</Section>

		<Section
			id="rohwerte"
			title="Miete, Altbau, Grün, Hitze und Milieuschutz im Vergleich"
			mode={skizze.mode}
		>
			{#snippet text()}
				<p>
					Gemessene Werte aus amtlichen Daten, in echten Einheiten und für alle {bezirke.length}
					Bezirke. Grünanlagen und Hitze fließen in den Bereich Grün und Hitze ein, Milieuschutz in den
					Wohnschutz. Miete und Altbau zählen nicht zum Kiez-Score.
				</p>
				<p>Diese Werte haben keine Richtung. Eine höhere Miete ist höher, nicht schlechter.</p>
			{/snippet}
			{#snippet chart()}
				<StripGroup
					rows={figureRows}
					ownSlug={data.profile.slug}
					highlight={neighborSet}
					highlightLabel="Nachbarbezirke"
					medianLabel="Median der 12 Bezirke"
					unitPlural="Bezirke"
					refSlug={ref.slug}
					r={6}
					onpick={pick}
				/>
			{/snippet}
			{#snippet table(visible)}
				<DataTable
					{visible}
					caption="Miete, Altbau, Grün, Hitze und Milieuschutz: {name} und {refName}"
					head={['Kennzahl', name, refName, 'Einordnung']}
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
					{#each FIGURES as f (f)}
						<li>
							<a class="text-accent underline" href={resolve(`/layer/${FIGURE_SPECS[f].layer}`)}
								>{FIGURE_SPECS[f].label}</a
							>:
							{FIGURE_SPECS[f].what}
						</li>
					{/each}
				</ul>
			{/snippet}
		</Section>
	{/if}

	<Section id="wahlen" title="Wie {name} wählt" mode={skizze.mode}>
		{#snippet text()}
			{#if leader}
				<p>
					Bei der letzten Wahl {leader.jahr} lag {leader.partei} vorn, mit {fmtPct(
						leader.anteil
					)}.{#if leader.refAnteil !== null}&#32;In {wahlRefName} kam {leader.partei} auf {fmtPct(
							leader.refAnteil
						)}.{/if}
				</p>
			{/if}
			<p>
				Auf Bezirksebene reichen die Daten weiter zurück als im Kiez, beim Abgeordnetenhaus bis
				2011.
			</p>
			{#if wahlRefPoints.length === 0 && ref.slug}
				<p class="text-sm">
					{wahlCache.failed
						? 'Vergleichswerte konnten nicht geladen werden.'
						: 'Lade Vergleichswerte …'}
				</p>
			{/if}
		{/snippet}
		{#snippet controls()}<WahlSwitch bind:value={wahlArt} />{/snippet}
		{#snippet chart()}
			{#if wahlOwn.length > 0}
				<PartyMultiples
					own={wahlOwn}
					ref={wahlRefPoints}
					ownLabel={name}
					refLabel={ref.slug ? refName : 'ganz Berlin, Gesamtergebnis'}
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
</main>
