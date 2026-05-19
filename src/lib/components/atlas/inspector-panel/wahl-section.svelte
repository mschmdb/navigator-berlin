<script lang="ts">
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import { parteiColor, parteiPattern } from '$lib/data/partei-farben.js';
	import type {
		WahlResultsAtPoint,
		WahlResultBundle,
		LevelKey,
		Top5Entry,
		SparklineSeries
	} from '$lib/data/get-wahl-results-at-point.js';

	type Props = {
		results: WahlResultsAtPoint | null;
		methodikHref?: string;
	};

	let { results, methodikHref = '/methodik/wahldaten' }: Props = $props();

	const LEVEL_LABELS: Record<LevelKey, string> = {
		stimmbezirk: 'Stimmbezirk',
		kiez: 'Kiez',
		bezirk: 'Bezirk',
		berlin: 'Berlin gesamt'
	};

	const TYP_LABELS: Record<'btw' | 'agh' | 'bvv', string> = {
		btw: 'Bundestag',
		agh: 'Abgeordnetenhaus',
		bvv: 'BVV'
	};

	type Wahltyp = 'btw' | 'agh' | 'bvv';

	function bundleKey(b: WahlResultBundle): string {
		return `${b.wahl.typ}-${b.wahl.jahr}-${b.wahl.stimmtyp}`;
	}

	const availableTypen = $derived.by<Wahltyp[]>(() => {
		if (!results?.wahlen) return [];
		const set = new Set<Wahltyp>();
		for (const b of results.wahlen) set.add(b.wahl.typ);
		return ['btw', 'agh', 'bvv'].filter((t) => set.has(t as Wahltyp)) as Wahltyp[];
	});

	let selectedTyp = $state<Wahltyp>('btw');
	let selectedLevel = $state<LevelKey>('kiez');
	let selectedStimmtyp = $state<'erststimme' | 'zweitstimme' | 'einstimme'>('zweitstimme');
	let selectedJahr = $state<number | null>(null);

	$effect(() => {
		if (availableTypen.length === 0) return;
		if (!availableTypen.includes(selectedTyp)) {
			selectedTyp = availableTypen[0];
		}
	});

	const bundlesForTyp = $derived.by(() => {
		if (!results?.wahlen) return [] as WahlResultBundle[];
		return results.wahlen
			.filter((b) => b.wahl.typ === selectedTyp)
			.sort((a, b) => b.wahl.jahr - a.wahl.jahr);
	});

	const stimmtypenForTyp = $derived.by<readonly ('erststimme' | 'zweitstimme' | 'einstimme')[]>(() => {
		const set = new Set<'erststimme' | 'zweitstimme' | 'einstimme'>();
		for (const b of bundlesForTyp) set.add(b.wahl.stimmtyp);
		const order: ('erststimme' | 'zweitstimme' | 'einstimme')[] = ['zweitstimme', 'erststimme', 'einstimme'];
		return order.filter((s) => set.has(s));
	});

	$effect(() => {
		if (stimmtypenForTyp.length === 0) return;
		if (!stimmtypenForTyp.includes(selectedStimmtyp)) {
			selectedStimmtyp = stimmtypenForTyp[0];
		}
	});

	const jahreForTypStimmtyp = $derived.by<number[]>(() => {
		const set = new Set<number>();
		for (const b of bundlesForTyp) {
			if (b.wahl.stimmtyp === selectedStimmtyp) set.add(b.wahl.jahr);
		}
		return Array.from(set).sort((a, b) => b - a);
	});

	$effect(() => {
		if (jahreForTypStimmtyp.length === 0) {
			selectedJahr = null;
			return;
		}
		if (selectedJahr === null || !jahreForTypStimmtyp.includes(selectedJahr)) {
			selectedJahr = jahreForTypStimmtyp[0];
		}
	});

	const currentBundle = $derived.by<WahlResultBundle | null>(() => {
		const match = bundlesForTyp.find(
			(b) => b.wahl.stimmtyp === selectedStimmtyp && b.wahl.jahr === selectedJahr
		);
		return match ?? bundlesForTyp[0] ?? null;
	});

	const currentLevelResults = $derived(currentBundle?.levels[selectedLevel] ?? null);

	const availableLevels = $derived.by<readonly LevelKey[]>(() => {
		if (!currentBundle) return [];
		const all: LevelKey[] = ['stimmbezirk', 'kiez', 'bezirk', 'berlin'];
		return all.filter((lvl) => currentBundle.levels[lvl]?.available);
	});

	$effect(() => {
		if (availableLevels.length === 0) return;
		if (!availableLevels.includes(selectedLevel)) {
			selectedLevel = availableLevels.includes('kiez')
				? 'kiez'
				: availableLevels[0];
		}
	});

	const topN = $derived.by<Top5Entry[]>(() => currentLevelResults?.top5 ?? []);
	const top5 = $derived(topN.slice(0, 5));
	const totalStimmen = $derived(top5.reduce((s, e) => s + e.stimmen, 0));

	const deltaLevels = $derived.by<readonly LevelKey[]>(() => {
		const all: LevelKey[] = ['stimmbezirk', 'kiez', 'bezirk', 'berlin'];
		return all.filter((lvl) => lvl !== selectedLevel && currentBundle?.levels[lvl]?.available);
	});

	function anteilForPartei(level: LevelKey, kurzname: string): number | null {
		const all = currentBundle?.levels[level]?.top5;
		const match = all?.find((e) => e.kurzname === kurzname);
		return match ? match.anteil : null;
	}

	function formatPct(n: number): string {
		return `${(n * 100).toFixed(1).replace('.', ',')} %`;
	}

	function formatDeltaLong(pp: number): string {
		const direction = pp > 0 ? 'höher' : pp < 0 ? 'niedriger' : 'gleich';
		const abs = Math.abs(pp).toFixed(1).replace('.', ',');
		if (Math.abs(pp) < 0.05) return 'gleich';
		return `${abs} Prozent-Punkte ${direction}`;
	}

	function formatStimmen(n: number): string {
		return n.toLocaleString('de-DE');
	}

	function uniqueId(b: WahlResultBundle): string {
		return `wahl-${bundleKey(b)}`;
	}

	const isBriefwahlLevel = $derived(selectedLevel === 'stimmbezirk');

	const currentSparkline = $derived.by<SparklineSeries | null>(() => {
		if (!currentBundle || !results) return null;
		return (
			results.sparklines.find(
				(s) => s.typ === currentBundle.wahl.typ && s.stimmtyp === currentBundle.wahl.stimmtyp
			) ?? null
		);
	});

	type SparklineLine = {
		kurzname: string;
		color: string;
		pathD: string;
		latestAnteil: number;
		years: number[];
	};

	const sparklineLines = $derived.by<SparklineLine[]>(() => {
		const sp = currentSparkline;
		if (!sp || sp.points.length === 0) return [];

		const byPartei = new Map<string, { jahr: number; anteil: number }[]>();
		for (const p of sp.points) {
			const bucket = byPartei.get(p.parteiKurzname) ?? [];
			bucket.push({ jahr: p.jahr, anteil: p.anteil });
			byPartei.set(p.parteiKurzname, bucket);
		}

		const allYears = Array.from(new Set(sp.points.map((p) => p.jahr))).sort((a, b) => a - b);
		if (allYears.length < 2) return [];

		const xMin = allYears[0];
		const xMax = allYears[allYears.length - 1];
		const yMin = 0;
		const yMax = Math.max(0.5, ...sp.points.map((p) => p.anteil)) * 1.05;

		const W = 80;
		const H = 24;

		return Array.from(byPartei.entries()).map(([kurzname, pts]) => {
			pts.sort((a, b) => a.jahr - b.jahr);
			const coords = pts.map((p) => {
				const x = xMax === xMin ? 0 : ((p.jahr - xMin) / (xMax - xMin)) * W;
				const y = H - ((p.anteil - yMin) / (yMax - yMin)) * H;
				return [x, y] as const;
			});
			const pathD = coords
				.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
				.join(' ');
			return {
				kurzname,
				color: parteiColor(kurzname),
				pathD,
				latestAnteil: pts[pts.length - 1].anteil,
				years: allYears
			};
		});
	});
</script>

{#if featureFlags.wahlSection && results && results.wahlen.length > 0 && availableTypen.length > 0}
	<section data-testid="wahl-section" class="space-y-3">
		<h3
			class="font-mono text-xs uppercase tracking-wide text-ink-muted border-t border-rule pt-4"
			data-testid="wahl-section-header"
		>
			Wahlverhalten hier
		</h3>

		<div
			role="tablist"
			aria-label="Wahltyp wählen"
			class="flex gap-1"
			data-testid="wahl-typ-tabs"
		>
			{#each availableTypen as typ (typ)}
				<button
					role="tab"
					type="button"
					aria-selected={selectedTyp === typ}
					data-testid={`wahl-typ-tab-${typ}`}
					onclick={() => (selectedTyp = typ)}
					class="font-mono text-xs px-2.5 py-1 rounded border border-ink transition-colors"
					class:bg-ink={selectedTyp === typ}
					class:text-bg={selectedTyp === typ}
					class:bg-bg={selectedTyp !== typ}
					class:text-ink={selectedTyp !== typ}
					class:hover:bg-bg-muted={selectedTyp !== typ}
				>
					{TYP_LABELS[typ]}
				</button>
			{/each}
		</div>

		{#if currentBundle}
			{#if currentBundle.wahl.isRepeatElection}
				<p
					class="font-mono text-[10px] uppercase tracking-wide text-ink-muted"
					data-testid="wahl-wiederholung-marker"
				>
					Wiederholungswahl
				</p>
			{/if}

			<div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-center text-xs">
				{#if jahreForTypStimmtyp.length > 1}
					<span
						id="wahl-jahr-label"
						class="font-mono text-[10px] uppercase tracking-wide text-ink-muted"
					>
						Jahr
					</span>
					<div
						role="radiogroup"
						aria-labelledby="wahl-jahr-label"
						class="flex flex-wrap gap-1"
						data-testid="wahl-jahr-switch"
					>
						{#each jahreForTypStimmtyp as jahr (jahr)}
							<button
								role="radio"
								type="button"
								aria-checked={selectedJahr === jahr}
								data-testid={`wahl-jahr-${jahr}`}
								onclick={() => (selectedJahr = jahr)}
								class="font-mono text-[11px] tabular-nums px-2 py-0.5 rounded border border-ink transition-colors"
								class:bg-ink={selectedJahr === jahr}
								class:text-bg={selectedJahr === jahr}
								class:bg-bg={selectedJahr !== jahr}
								class:text-ink={selectedJahr !== jahr}
								class:hover:bg-bg-muted={selectedJahr !== jahr}
							>
								{jahr}
							</button>
						{/each}
					</div>
				{:else if jahreForTypStimmtyp.length === 1}
					<span class="font-mono text-[10px] uppercase tracking-wide text-ink-muted">Jahr</span>
					<span
						class="font-mono text-[11px] tabular-nums text-ink"
						data-testid="wahl-jahr-static"
					>
						{jahreForTypStimmtyp[0]}
					</span>
				{/if}

				{#if stimmtypenForTyp.length > 1}
					<span
						id="wahl-stimmtyp-label"
						class="font-mono text-[10px] uppercase tracking-wide text-ink-muted"
					>
						Stimme
					</span>
					<div
						role="radiogroup"
						aria-labelledby="wahl-stimmtyp-label"
						class="flex flex-wrap gap-1"
						data-testid="wahl-stimmtyp-switch"
					>
						{#each stimmtypenForTyp as st (st)}
							<button
								role="radio"
								type="button"
								aria-checked={selectedStimmtyp === st}
								data-testid={`wahl-stimmtyp-${st}`}
								onclick={() => (selectedStimmtyp = st)}
								class="font-mono text-[11px] px-2 py-0.5 rounded border border-ink transition-colors"
								class:bg-ink={selectedStimmtyp === st}
								class:text-bg={selectedStimmtyp === st}
								class:bg-bg={selectedStimmtyp !== st}
								class:text-ink={selectedStimmtyp !== st}
								class:hover:bg-bg-muted={selectedStimmtyp !== st}
							>
								{st === 'zweitstimme'
									? 'Zweitstimme'
									: st === 'erststimme'
										? 'Erststimme'
										: 'Stimme'}
							</button>
						{/each}
					</div>
				{/if}

				{#if availableLevels.length > 1}
					<span
						id="wahl-level-label"
						class="font-mono text-[10px] uppercase tracking-wide text-ink-muted"
					>
						Ebene
					</span>
					<div
						role="radiogroup"
						aria-labelledby="wahl-level-label"
						class="flex flex-wrap gap-1"
						data-testid="wahl-level-switch"
					>
						{#each availableLevels as lvl (lvl)}
							<button
								role="radio"
								type="button"
								aria-checked={selectedLevel === lvl}
								data-testid={`wahl-level-${lvl}`}
								onclick={() => (selectedLevel = lvl)}
								class="font-mono text-[11px] px-2 py-0.5 rounded border border-ink transition-colors"
								class:bg-ink={selectedLevel === lvl}
								class:text-bg={selectedLevel === lvl}
								class:bg-bg={selectedLevel !== lvl}
								class:text-ink={selectedLevel !== lvl}
								class:hover:bg-bg-muted={selectedLevel !== lvl}
							>
								{LEVEL_LABELS[lvl]}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			{#if top5.length > 0 && totalStimmen > 0}
				<div data-testid="wahl-stacked-bar" class="space-y-2" aria-hidden="true">
					<div
						class="relative h-6 w-full overflow-hidden rounded border border-rule bg-bg-muted"
					>
						{#each top5 as entry, i (entry.kurzname)}
							{@const widthPct = (entry.anteil * 100).toFixed(2)}
							{@const offsetPct = top5
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
								title={`${entry.kurzname}: ${formatPct(entry.anteil)}`}
							></span>
						{/each}
						{#if isBriefwahlLevel}
							<span
								class="absolute top-0 right-0 h-full w-1.5 pointer-events-none"
								data-testid="wahl-confidence-hairline"
								style="background-image: repeating-linear-gradient(45deg, rgba(20,20,20,0.45) 0 2px, transparent 2px 4px);"
								title="Unsicherheits-Zone: Stimmbezirks-Werte ohne Briefstimmen"
							></span>
						{/if}
					</div>
					<ul class="space-y-1.5" data-testid="wahl-legend">
						{#each top5 as entry (entry.kurzname)}
							<li class="flex flex-col gap-0.5 font-mono text-xs">
								<div class="flex items-baseline gap-2">
									<span
										class="inline-block h-2.5 w-2.5 rounded-sm border border-ink/10 flex-shrink-0"
										style="background-color:{parteiColor(entry.kurzname)};"
										aria-hidden="true"
									></span>
									<span class="text-ink truncate">{entry.kurzname}</span>
									<span class="ml-auto text-ink-muted tabular-nums">
										{formatPct(entry.anteil)}
									</span>
								</div>
								{#if deltaLevels.length > 0}
									<div
										class="flex flex-wrap gap-x-3 gap-y-0.5 pl-4 text-[10px] text-ink-muted"
										data-testid={`wahl-delta-row-${entry.kurzname}`}
									>
										{#each deltaLevels as lvl (lvl)}
											{@const ref = anteilForPartei(lvl, entry.kurzname)}
											{@const pp = ref !== null ? (entry.anteil - ref) * 100 : null}
											<span
												class="tabular-nums"
												data-testid={`wahl-delta-${entry.kurzname}-${lvl}`}
												data-delta={pp !== null ? pp.toFixed(2) : 'na'}
												title={pp !== null
													? `${LEVEL_LABELS[lvl]}: ${formatPct(ref!)} (hier ${formatDeltaLong(pp)})`
													: `${LEVEL_LABELS[lvl]}: nicht in Top-5`}
											>
												{LEVEL_LABELS[lvl]} {ref !== null ? formatPct(ref) : '–'}
											</span>
										{/each}
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				</div>

				<table
					class="sr-only"
					data-testid="wahl-a11y-table"
					aria-label={`Top-5 Parteien · ${TYP_LABELS[currentBundle.wahl.typ]} ${currentBundle.wahl.jahr} · Ebene ${LEVEL_LABELS[selectedLevel]}`}
				>
					<caption>
						Top-5-Parteien für {TYP_LABELS[currentBundle.wahl.typ]} {currentBundle.wahl.jahr},
						Ebene {LEVEL_LABELS[selectedLevel]}
					</caption>
					<thead>
						<tr>
							<th scope="col">Partei</th>
							<th scope="col">Stimmen</th>
							<th scope="col">Anteil</th>
						</tr>
					</thead>
					<tbody>
						{#each top5 as entry (entry.kurzname)}
							<tr>
								<th scope="row">{entry.vollname}</th>
								<td>{formatStimmen(entry.stimmen)}</td>
								<td>{formatPct(entry.anteil)}</td>
							</tr>
						{/each}
					</tbody>
				</table>

				{#if isBriefwahlLevel}
					<p
						data-testid="wahl-briefwahl-note"
						class="font-mono text-[10px] uppercase tracking-wide text-ink-subtle"
					>
						Stimmbezirks-Werte ohne Briefstimmen · Briefwähler nur als Bezirks-Aggregat
					</p>
				{/if}
			{:else}
				<p data-testid="wahl-empty" class="font-mono text-xs text-ink-subtle">
					Keine Daten für diese Ebene verfügbar.
				</p>
			{/if}

			{#if sparklineLines.length > 0}
				<div data-testid="wahl-sparkline" class="space-y-2 pt-2 border-t border-rule">
					<p
						class="font-mono text-[10px] uppercase tracking-wide text-ink-muted"
						data-testid="wahl-sparkline-label"
					>
						Verlauf Kiez-Ebene · {sparklineLines[0]?.years[0]}–{sparklineLines[0]
							?.years[sparklineLines[0].years.length - 1]}
					</p>
					<ul class="space-y-1" data-testid="wahl-sparkline-list">
						{#each sparklineLines as line (line.kurzname)}
							<li
								class="flex items-center gap-3 font-mono text-[11px] text-ink"
								data-testid={`wahl-sparkline-${line.kurzname}`}
							>
								<svg
									width="60"
									height="18"
									viewBox="0 0 80 24"
									preserveAspectRatio="none"
									role="img"
									aria-label={`${line.kurzname} Verlauf`}
									class="flex-shrink-0"
								>
									<path
										d={line.pathD}
										fill="none"
										stroke={line.color}
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										vector-effect="non-scaling-stroke"
									/>
								</svg>
								<span class="flex-1 min-w-0">{line.kurzname}</span>
								<span class="tabular-nums text-ink-muted whitespace-nowrap">
									{formatPct(line.latestAnteil)}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<p
				id={uniqueId(currentBundle) + '-meta'}
				class="font-mono text-[10px] uppercase tracking-wide text-ink-subtle"
				data-testid="wahl-meta"
			>
				Quelle: {currentBundle.wahl.sourceUrl.includes('bundeswahlleiterin')
					? 'Bundeswahlleiterin'
					: 'Amt für Statistik Berlin-Brandenburg'} · Lizenz {currentBundle.wahl.license}
			</p>
		{/if}

		<EditorialDisclaimer variant="wahl-stimmenanteile" />

		<div class="flex flex-wrap gap-3">
			{#if currentBundle}
				{@const slug =
					currentBundle.wahl.typ === 'bvv'
						? `${currentBundle.wahl.jahr}-bvv`
						: `${currentBundle.wahl.jahr}-${currentBundle.wahl.typ}-${currentBundle.wahl.stimmtyp}`}
				<a
					href={`/wahl/${slug}`}
					data-testid="wahl-detail-link"
					class="inline-block font-mono text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
				>
					Detail-Seite öffnen
				</a>
			{/if}
			<a
				href={methodikHref}
				data-testid="wahl-methodik-link"
				class="inline-block font-mono text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
			>
				Methodik · Wahldaten
			</a>
		</div>
	</section>
{/if}
