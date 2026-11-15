<!--
	Skizze 11/2026: neue Kiezseite. Wegwerf-Prototyp, /demo ist noindex.
	Eine Seite, ein Bezugspunkt: alle Grafiken und Sätze rechnen auf ihn um.
-->
<script lang="ts">
	import '$lib/skizzen/components/skizze.css';
	import ReferenceBar from '$lib/skizzen/components/ReferenceBar.svelte';
	import Section from '$lib/skizzen/components/Section.svelte';
	import ProfileChart from '$lib/skizzen/components/ProfileChart.svelte';
	import StripGroup, { type StripRow } from '$lib/skizzen/components/StripGroup.svelte';
	import PartyMultiples from '$lib/skizzen/components/PartyMultiples.svelte';
	import WahlSwitch from '$lib/skizzen/components/WahlSwitch.svelte';
	import DataTable from '$lib/skizzen/components/DataTable.svelte';
	import { aggregateProfile, resolveReference } from '$lib/skizzen/reference';
	import { SkizzeState, WahlCache } from '$lib/skizzen/reference-state.svelte';
	import { compareSentence, dimDiffs, signedPoints } from '$lib/skizzen/compare-text';
	import { countBelow, niceDomain, rankOf } from '$lib/skizzen/stats';
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

	const self = $derived(data.regions.find((r) => r.slug === data.profile.slug) ?? null);
	const byslug = $derived(new Map(data.regions.map((r) => [r.slug, r])));
	const bezirkName = $derived(data.profile.bezirk || null);

	const berlin = $derived(
		aggregateProfile(
			'berlin',
			'Berlin',
			data.regions,
			'median',
			data.berlinFigures,
			`mittlerer Kiez, Median aller ${data.regions.length} Kieze`
		)
	);
	const bezirk = $derived(
		bezirkName && data.bezirkRegion
			? aggregateProfile(
					'bezirk',
					bezirkName,
					data.regions.filter((r) => r.parentSlug === data.bezirkSlug),
					'mean',
					data.bezirkRegion.figures,
					`Mittel der Kieze in ${bezirkName}`
				)
			: null
	);

	const skizze = new SkizzeState(() => ({
		self: data.profile.slug,
		hasParent: !!data.bezirkSlug,
		neighbors: data.neighbors.map((n) => n.slug),
		similar: data.similar.map((n) => n.slug),
		all: new Set(data.regions.map((r) => r.slug))
	}));
	const ref = $derived(resolveReference(skizze.choice, { berlin, bezirk, regions: byslug }));
	const refName = $derived(
		skizze.choice.kind === 'berlin'
			? 'Berlin-Median'
			: skizze.choice.kind === 'bezirk'
				? `Mittel ${ref.label}`
				: ref.label
	);
	// Im Satz: „gegenüber dem Berliner Median“, „gegenüber dem Mittel der Kieze in Neukölln“.
	const refPhrase = $derived(
		skizze.choice.kind === 'berlin'
			? 'dem Berliner Median'
			: skizze.choice.kind === 'bezirk'
				? `dem Mittel der Kieze in ${ref.label}`
				: ref.label
	);
	// Wahlen vergleichen echte Ergebnisse, keinen Median.
	const wahlRefName = $derived(skizze.choice.kind === 'berlin' ? 'ganz Berlin' : ref.label);

	// Rang aus denselben Werten wie die Verteilung (Gleichstand teilt den Platz, zählt aber mit).
	const heroRank = $derived(
		rankOf(
			self?.dims.composite ?? null,
			data.regions.map((r) => r.dims.composite)
		)
	);

	// --- Profil ---
	const profileDims: readonly Dim[] = ['composite', ...RATED_DIMS, 'kriminalitaet'];
	const ratedDiffs = $derived(self ? dimDiffs(RATED_DIMS, self.dims, ref.dims) : []);
	const lead = $derived(compareSentence(ratedDiffs, dimLabel, refPhrase, data.profile.name));

	// --- Verteilung ---
	const neighborSlugs = $derived(data.neighbors.map((n) => n.slug));
	const refRegionSlug = $derived(ref.slug);
	const all = $derived(data.regions);
	const zeroWohnschutz = $derived(all.filter((r) => r.dims.wohnschutz === 0).length);

	const wahlRefLabel = $derived(ref.slug ? refName : `${wahlRefName}, Gesamtergebnis`);

	const scoreRows: StripRow[] = $derived(
		(['composite', ...RATED_DIMS, 'kriminalitaet'] as const).map((dim) => {
			const values = all.map((r) => r.dims[dim]);
			const rk = rankOf(self?.dims[dim] ?? null, values);
			return {
				key: dim,
				label: dimLabel(dim),
				meta:
					dim === 'kriminalitaet'
						? 'ohne Rang, ohne Wertung'
						: rk
							? `Platz ${rk.rang} von ${rk.total}`
							: 'keine Angabe',
				items: all.map((r) => ({ slug: r.slug, name: r.name, value: r.dims[dim] })),
				domain: [0, 100] as const,
				format: (v: number) => formatScore(v),
				refLine:
					skizze.choice.kind === 'bezirk'
						? { value: ref.dims[dim], label: `Mittel der Kieze in ${ref.label}` }
						: null,
				...(dim === 'wohnschutz'
					? {
							zeroName: 'ohne Milieuschutz',
							zeroMedianLabel: 'Median der Kieze mit Milieuschutz',
							note: `${Math.round((zeroWohnschutz / all.length) * 100)} % der Kieze haben keinen Milieuschutz und den Wert 0.`
						}
					: {})
			};
		})
	);

	const bestWorst = $derived.by(() => {
		if (!self) return null;
		const ranked = RATED_DIMS.map((d) => ({
			d,
			rk: rankOf(
				self.dims[d],
				all.map((r) => r.dims[d])
			)
		})).filter(
			(e): e is { d: (typeof RATED_DIMS)[number]; rk: { rang: number; total: number } } =>
				e.rk !== null
		);
		ranked.sort((a, b) => a.rk.rang - b.rk.rang);
		return ranked.length > 1 ? { best: ranked[0], worst: ranked[ranked.length - 1] } : null;
	});

	// --- Rohwerte ---
	const figureRows: StripRow[] = $derived(
		FIGURES.map((f) => {
			const values = all.map((r) => r.figures[f]);
			const ownV = self?.figures[f] ?? null;
			const below = countBelow(ownV, values);
			const spec = FIGURE_SPECS[f];
			return {
				key: f,
				label: `${spec.label} in ${spec.unit}`,
				meta:
					below === null
						? 'keine Angabe'
						: below === 0
							? 'kein Kiez liegt niedriger'
							: `höher als in ${below} von ${values.filter((v) => v !== null).length - 1} Kiezen`,
				items: all.map((r) => ({ slug: r.slug, name: r.name, value: r.figures[f] })),
				domain: niceDomain(values, f === 'bestandsmiete' || f === 'hitze' ? 1 : 10),
				format: (v: number) => formatFigure(f, v),
				refLine:
					skizze.choice.kind === 'bezirk'
						? { value: ref.figures[f], label: `${ref.label} gesamt` }
						: null,
				note: spec.what,
				...(f === 'milieuschutz'
					? { zeroName: 'ohne Milieuschutz', zeroMedianLabel: 'Median der Kieze mit Milieuschutz' }
					: {})
			};
		})
	);

	// --- Wahlen ---
	let wahlArt = $state<WahlArt>('btw');
	const wahlCache = new WahlCache();
	$effect(() => {
		if (ref.slug) void wahlCache.load('kiez', ref.slug);
	});
	$effect(() => {
		skizze.readUrl(page.url);
	});
	const wahlRef = $derived(
		skizze.choice.kind === 'berlin'
			? data.wahl.berlin
			: skizze.choice.kind === 'bezirk'
				? data.wahl.bezirk
				: wahlCache.current
	);
	const wahlOwn = $derived(data.wahl.own[wahlArt]);
	const wahlRefPoints = $derived(wahlRef?.[wahlArt] ?? []);
	const leader = $derived(latestLeader(wahlOwn, wahlRefPoints));

	const fmtPct = (v: number) => `${Math.round(v)} %`;
	const pick = (slug: string) => {
		if (slug === data.profile.slug) return;
		const kind = neighborSlugs.includes(slug)
			? 'nachbar'
			: data.similar.some((s) => s.slug === slug)
				? 'aehnlich'
				: 'frei';
		skizze.setChoice({ kind, slug });
	};
</script>

<svelte:head>
	<title>Skizze: {data.profile.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<ReferenceBar
	berlinNote={berlin.note ?? ''}
	bezirkLabel={bezirkName}
	neighbors={data.neighbors.map((n) => ({ slug: n.slug, name: n.name }))}
	similar={data.similar.map((n) => ({ slug: n.slug, name: n.name }))}
	all={data.regions
		.filter((r) => r.slug !== data.profile.slug)
		.map((r) => ({ slug: r.slug, name: r.name, group: r.parentName ?? '' }))
		.sort((a, b) => a.group.localeCompare(b.group, 'de') || a.name.localeCompare(b.name, 'de'))}
	freeLabel="Anderer Kiez"
	choice={skizze.choice}
	mode={skizze.mode}
	onchoice={(c) => skizze.setChoice(c)}
	onmode={(m) => skizze.setMode(m)}
/>

<main class="mx-auto max-w-6xl px-4 pb-24">
	<header class="grid gap-8 py-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12 lg:py-16">
		<div class="min-w-0">
			<p class="text-dense-label tracking-wide text-ink-subtle uppercase">Kiez in {bezirkName}</p>
			<h1
				class="mt-1 text-3xl leading-tight font-semibold text-balance [overflow-wrap:anywhere] text-ink lg:text-4xl"
			>
				<!-- Umbruch nach dem Schrägstrich statt mitten im Wort -->
				{data.profile.name.replaceAll('/', '/\u200b')}
			</h1>
			<dl class="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
				<div>
					<dt class="text-ink-subtle">Einwohner</dt>
					<dd class="text-lg text-ink tabular-nums">{formatInt(data.profile.einwohner)}</dd>
				</div>
				<div>
					<dt class="text-ink-subtle">Fläche</dt>
					<dd class="text-lg text-ink tabular-nums">
						{(data.profile.flaecheHa / 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km²
					</dd>
				</div>
				<div>
					<dt class="text-ink-subtle">Kiez-Score</dt>
					<dd class="text-lg text-ink tabular-nums">
						{formatScore(self?.dims.composite ?? null)} von 100
					</dd>
				</div>
				<div>
					<dt class="text-ink-subtle">Rang in Berlin</dt>
					<dd class="text-lg text-ink tabular-nums">
						{heroRank ? `${heroRank.rang} von ${heroRank.total}` : '–'}
					</dd>
				</div>
			</dl>
		</div>
		<div class="flex flex-col gap-4 text-lg leading-body text-ink">
			<p aria-live="polite" class="text-xl leading-snug">{lead}</p>
			<p class="text-base text-ink-muted">
				Der Kiez-Score von navigator.berlin fasst fünf Bereiche zusammen: Ruhe und Luft, Grün und
				Hitze, Mobilität, Versorgung und Wohnschutz. Er reicht von 0 bis 100, höher ist besser.
				<a class="text-accent underline" href={resolve('/methodik/kiez-score')}
					>So entsteht der Kiez-Score</a
				>.
			</p>
			{#each data.prose.slice(0, 2) as p, i (i)}
				<p class="text-base text-ink-muted">{p}</p>
			{/each}
		</div>
	</header>

	{#if self}
		<Section id="profil" title="Die fünf Bereiche im Vergleich" mode={skizze.mode}>
			{#snippet text()}
				<p>
					Jede Zeile ist ein Bereich des Kiez-Scores, 0 bis 100 Punkte, höher ist besser. Der
					gefüllte Punkt ist {data.profile.name}, der Ring ist {refName}{ref.note
						? ` (${ref.note})`
						: ''}.
				</p>
				<p>Rechts steht der Abstand in Punkten. Unter 5 Punkten gilt er als etwa gleich.</p>
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
					ownLabel={data.profile.name}
					refValues={ref.dims}
					refLabel={ref.note ? `${refName} (${ref.note})` : refName}
				/>
			{/snippet}
			{#snippet table(visible)}
				<DataTable
					{visible}
					caption="Kiez-Score nach Bereichen: {data.profile.name} und {refName}"
					head={['Bereich', data.profile.name, refName, 'Abstand']}
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
					Kiez-Score von navigator.berlin, jeder Bereich mit eigenem Datenstand. <a
						class="text-accent underline"
						href={resolve('/methodik/kiez-score')}>So entsteht der Score</a
					>.
				</p>
			{/snippet}
		</Section>

		<Section
			id="verteilung"
			title="Wo {data.profile.name} unter den {all.length} Kiezen steht"
			mode={skizze.mode}
		>
			{#snippet text()}
				<p>
					Jeder Punkt ist einer der {all.length} Kieze Berlins. So sieht man, ob ein Platz knapp ist oder
					ob ein Kiez weit vom Feld entfernt liegt.
				</p>
				{#if bestWorst}
					<p>
						Am weitesten vorn liegt {data.profile.name} bei {dimLabel(bestWorst.best.d)} (Platz {bestWorst
							.best.rk.rang}), am weitesten hinten bei {dimLabel(bestWorst.worst.d)} (Platz {bestWorst
							.worst.rk.rang}).
					</p>
				{/if}
				<p class="text-sm">
					Fahr mit der Maus über einen Punkt, um den Namen zu sehen. Ein Klick vergleicht mit diesem
					Kiez.
				</p>
			{/snippet}

			{#snippet chart()}
				<StripGroup
					rows={scoreRows}
					ownSlug={data.profile.slug}
					highlight={new Set(neighborSlugs)}
					highlightLabel="Nachbarkieze"
					medianLabel="Berlin-Median"
					refSlug={refRegionSlug}
					onpick={pick}
				/>
			{/snippet}
			{#snippet table(visible)}
				<DataTable
					{visible}
					caption="Rang von {data.profile.name} unter {all.length} Kiezen"
					head={['Bereich', 'Wert', 'Platz', refName]}
					rows={scoreRows.map((r) => [
						r.label,
						formatScore(self.dims[r.key as Dim]),
						r.meta,
						formatScore(ref.dims[r.key as Dim])
					])}
				/>
			{/snippet}
			{#snippet sources()}
				<p>
					Platz 1 hat den höchsten Wert. Gleiche Werte teilen sich einen Platz, die folgenden zählen
					weiter.
				</p>
			{/snippet}
		</Section>

		<Section
			id="rohwerte"
			title="Miete, Altbau, Grün, Hitze und Milieuschutz im Vergleich"
			mode={skizze.mode}
		>
			{#snippet text()}
				<p>
					Gemessene Werte aus amtlichen Daten, in ihren echten Einheiten und wieder für alle Kieze.
					Grünanlagen und Hitze fließen in den Bereich Grün und Hitze ein, Milieuschutz in den
					Wohnschutz. Miete und Altbau zählen nicht zum Kiez-Score.
				</p>
				<p>
					Diese Werte haben keine Richtung: Eine höhere Miete ist weder gut noch schlecht, sie ist
					höher.
				</p>
			{/snippet}
			{#snippet chart()}
				<StripGroup
					rows={figureRows}
					ownSlug={data.profile.slug}
					highlight={new Set(neighborSlugs)}
					highlightLabel="Nachbarkieze"
					medianLabel="Berlin-Median"
					refSlug={refRegionSlug}
					onpick={pick}
				/>
			{/snippet}
			{#snippet table(visible)}
				<DataTable
					{visible}
					caption="Miete, Altbau, Grün, Hitze und Milieuschutz: {data.profile.name} und {refName}"
					head={['Kennzahl', data.profile.name, refName, 'Einordnung']}
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
							>: {FIGURE_SPECS[f].what}
						</li>
					{/each}
				</ul>
			{/snippet}
		</Section>
	{/if}

	<Section id="wahlen" title="Wie {data.profile.name} wählt" mode={skizze.mode}>
		{#snippet text()}
			{#if leader}
				<p>
					Bei der letzten Wahl {leader.jahr} lag {leader.partei} vorn, mit {fmtPct(leader.anteil)}.
					{#if leader.refAnteil !== null}In {wahlRefName} kam {leader.partei} auf {fmtPct(
							leader.refAnteil
						)}.{/if}
				</p>
			{/if}
			<p>
				Jede Kachel ist eine Partei, alle mit derselben Skala. Die gestrichelte Linie zeigt
				{wahlRefLabel}.
			</p>
			{#if wahlRefPoints.length === 0 && ref.slug}
				<p class="text-sm">
					{wahlCache.failed
						? 'Vergleichswerte konnten nicht geladen werden.'
						: 'Lade Vergleichswerte …'}
				</p>
			{/if}
		{/snippet}
		{#snippet controls()}
			<WahlSwitch bind:value={wahlArt} />
		{/snippet}
		{#snippet chart()}
			{#if wahlOwn.length > 0}
				<PartyMultiples
					own={wahlOwn}
					ref={wahlRefPoints}
					ownLabel={data.profile.name}
					refLabel={wahlRefLabel}
				/>
			{:else}
				<p class="text-ink-muted">Keine Wahldaten.</p>
			{/if}
		{/snippet}
		{#snippet table(visible)}
			<DataTable
				{visible}
				caption="Stimmenanteile in {data.profile.name} (Prozent), in Klammern {wahlRefName}"
				head={['Partei', ...[...new Set(wahlOwn.map((p) => p.jahr))].sort().map(String)]}
				rows={[...new Set(wahlOwn.map((p) => p.partei))].map((partei) => [
					partei,
					...[...new Set(wahlOwn.map((p) => p.jahr))].sort().map((j) => {
						const o = wahlOwn.find((p) => p.partei === partei && p.jahr === j);
						const r = wahlRefPoints.find((p) => p.partei === partei && p.jahr === j);
						return `${o ? fmtPct(o.anteil) : '–'}${r ? ` (${fmtPct(r.anteil)})` : ''}`;
					})
				])}
			/>
		{/snippet}
		{#snippet sources()}
			<p>
				Amt für Statistik Berlin-Brandenburg und Landeswahlleiterin Berlin. <a
					class="text-accent underline"
					href={resolve('/methodik')}>Methodik der Wahldaten</a
				>. Auf Kiezebene ab 2016, Bundestag ab 2017.
			</p>
		{/snippet}
	</Section>
</main>
