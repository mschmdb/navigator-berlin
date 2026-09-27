<script lang="ts">
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import BriefwahlMarker from '../briefwahl-marker.svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import { parteiColor, parteiPattern } from '$lib/data/partei-farben.js';
	import { buildWahlSlug } from '$lib/data/wahl-slug.js';
	import {
		wahlReiheLabel,
		wahlEbeneLabel,
		wahlStimmtypLabel,
		wahlWiederholungLabel,
		wahlVorlaeufigLabel,
		sourceDisplayLabel,
		type WahlTyp as Wahltyp
	} from '$lib/data/wahl-labels.js';
	import {
		formatPercent,
		formatCount,
		formatWahlDate,
		formatPercentagePointsDelta
	} from '$lib/i18n/format.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
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
		lang?: Locale;
	};

	let { results, methodikHref = '/methodik/wahldaten', lang }: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

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

	const stimmtypenForTyp = $derived.by<readonly ('erststimme' | 'zweitstimme' | 'einstimme')[]>(
		() => {
			const set = new Set<'erststimme' | 'zweitstimme' | 'einstimme'>();
			for (const b of bundlesForTyp) set.add(b.wahl.stimmtyp);
			const order: ('erststimme' | 'zweitstimme' | 'einstimme')[] = [
				'zweitstimme',
				'erststimme',
				'einstimme'
			];
			return order.filter((s) => set.has(s));
		}
	);

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
			selectedLevel = availableLevels.includes('kiez') ? 'kiez' : availableLevels[0];
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
		return formatPercent(n, localeOpts);
	}

	// Reuses `formatPercentagePointsDelta` (Muster `trends-kapitel.svelte::
	// bareSchwellenWert`, Block B): Vorzeichen + Pp./pp-Einheit abstreifen,
	// die reine Dezimalzahl bleibt so Zeichen-fuer-Zeichen gleich zum
	// vormaligen `toFixed(1)`-Hack, ohne die Logik zu duplizieren.
	function formatDeltaAbs(pp: number): string {
		return formatPercentagePointsDelta(pp, localeOpts)
			.replace(/^[+−]/, '')
			.replace(/\s?(Pp\.|pp)$/, '');
	}

	function formatDeltaLong(pp: number): string {
		if (Math.abs(pp) < 0.05) return m.inspector_wahl_delta_equal(undefined, localeOpts);
		const abs = formatDeltaAbs(pp);
		return pp > 0
			? m.inspector_wahl_delta_higher({ abs }, localeOpts)
			: m.inspector_wahl_delta_lower({ abs }, localeOpts);
	}

	function formatStimmen(n: number): string {
		return formatCount(n, localeOpts);
	}

	function uniqueId(b: WahlResultBundle): string {
		return `wahl-${bundleKey(b)}`;
	}

	// Stimmbezirks-Werte sind für jede Wahl mit Geometrie echte Gruppen-
	// Summen aus Urne + Briefwahlbezirk, kein Caveat nötig. Kiez-Werte
	// verteilen die Briefwahl einer Gruppe anteilig nach Wahlberechtigten
	// auf ihre Urnen -- eine Schätzung, keine amtliche Aufteilung
	// (Design Notes, Methodik-Doku).
	const isKiezBriefwahlSchaetzung = $derived(selectedLevel === 'kiez');

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

	// Quelle wird bisher über die URL statt über ein `source_name`-Feld
	// erkannt (Datenlage). Mappt trotzdem über dieselbe Message-Quelle wie
	// `sourceDisplayLabel`, damit DE/EN nicht zweimal gepflegt werden.
	const sourceLabel = $derived.by(() => {
		const url = currentBundle?.wahl.sourceUrl ?? '';
		if (url.includes('bundeswahlleiterin')) {
			return sourceDisplayLabel('Bundeswahlleiterin', localeOpts);
		}
		if (url.includes('wahlen-berlin.de')) {
			return sourceDisplayLabel('Landeswahlleiterin Berlin', localeOpts);
		}
		return sourceDisplayLabel('Amt für Statistik Berlin-Brandenburg', localeOpts);
	});
</script>

{#if featureFlags.wahlSection && results && results.wahlen.length > 0 && availableTypen.length > 0}
	<section data-testid="wahl-section" class="space-y-3">
		<h3
			class="border-t border-rule pt-4 font-mono text-xs tracking-wide text-ink-muted uppercase"
			data-testid="wahl-section-header"
		>
			{m.inspector_wahl_section_header(undefined, localeOpts)}
		</h3>

		<div
			role="tablist"
			aria-label={m.inspector_wahl_typ_tabs_aria_label(undefined, localeOpts)}
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
					class="rounded border border-ink px-2.5 py-1 font-mono text-xs transition-colors"
					class:bg-ink={selectedTyp === typ}
					class:text-bg={selectedTyp === typ}
					class:bg-bg={selectedTyp !== typ}
					class:text-ink={selectedTyp !== typ}
					class:hover:bg-bg-muted={selectedTyp !== typ}
				>
					{wahlReiheLabel(typ, localeOpts)}
				</button>
			{/each}
		</div>

		{#if currentBundle}
			{#if currentBundle.wahl.isRepeatElection}
				<p
					class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
					data-testid="wahl-wiederholung-marker"
				>
					{wahlWiederholungLabel(localeOpts)}
				</p>
			{/if}
			{#if currentBundle.wahl.vorlaeufig}
				<p
					class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
					data-testid="wahl-vorlaeufig-marker"
				>
					{wahlVorlaeufigLabel(localeOpts)}{#if currentBundle.wahl.sourceUpdatedAt}&nbsp;{m.inspector_wahl_vorlaeufig_stand(
							{ date: formatWahlDate(currentBundle.wahl.sourceUpdatedAt, localeOpts) },
							localeOpts
						)}{/if}
				</p>
			{/if}

			<div class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-xs">
				{#if jahreForTypStimmtyp.length > 1}
					<span
						id="wahl-jahr-label"
						class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
					>
						{m.inspector_wahl_jahr_label(undefined, localeOpts)}
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
								class="rounded border border-ink px-2 py-0.5 font-mono text-[11px] tabular-nums transition-colors"
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
					<span class="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
						{m.inspector_wahl_jahr_label(undefined, localeOpts)}
					</span>
					<span class="font-mono text-[11px] text-ink tabular-nums" data-testid="wahl-jahr-static">
						{jahreForTypStimmtyp[0]}
					</span>
				{/if}

				{#if stimmtypenForTyp.length > 1}
					<span
						id="wahl-stimmtyp-label"
						class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
					>
						{m.inspector_wahl_stimmtyp_group_label(undefined, localeOpts)}
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
								class="rounded border border-ink px-2 py-0.5 font-mono text-[11px] transition-colors"
								class:bg-ink={selectedStimmtyp === st}
								class:text-bg={selectedStimmtyp === st}
								class:bg-bg={selectedStimmtyp !== st}
								class:text-ink={selectedStimmtyp !== st}
								class:hover:bg-bg-muted={selectedStimmtyp !== st}
							>
								{wahlStimmtypLabel(st, localeOpts)}
							</button>
						{/each}
					</div>
				{/if}

				{#if availableLevels.length > 1}
					<span
						id="wahl-level-label"
						class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
					>
						{m.inspector_wahl_ebene_group_label(undefined, localeOpts)}
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
								class="rounded border border-ink px-2 py-0.5 font-mono text-[11px] transition-colors"
								class:bg-ink={selectedLevel === lvl}
								class:text-bg={selectedLevel === lvl}
								class:bg-bg={selectedLevel !== lvl}
								class:text-ink={selectedLevel !== lvl}
								class:hover:bg-bg-muted={selectedLevel !== lvl}
							>
								{wahlEbeneLabel(lvl, localeOpts)}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			{#if top5.length > 0 && totalStimmen > 0}
				<div data-testid="wahl-stacked-bar" class="space-y-2" aria-hidden="true">
					<div class="bg-bg-muted relative h-6 w-full overflow-hidden rounded border border-rule">
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
					</div>
					<ul class="space-y-1.5" data-testid="wahl-legend">
						{#each top5 as entry (entry.kurzname)}
							<li class="flex flex-col gap-0.5 font-mono text-xs">
								<div class="flex items-baseline gap-2">
									<span
										class="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm border border-ink/10"
										style="background-color:{parteiColor(entry.kurzname)};"
										aria-hidden="true"
									></span>
									<span class="truncate text-ink">{entry.kurzname}</span>
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
													? m.inspector_wahl_delta_title(
															{
																level: wahlEbeneLabel(lvl, localeOpts),
																value: formatPct(ref!),
																delta: formatDeltaLong(pp)
															},
															localeOpts
														)
													: m.inspector_wahl_delta_not_in_top5(
															{ level: wahlEbeneLabel(lvl, localeOpts) },
															localeOpts
														)}
											>
												{wahlEbeneLabel(lvl, localeOpts)}
												{ref !== null ? formatPct(ref) : '–'}
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
					aria-label={m.inspector_wahl_a11y_table_aria_label(
						{
							typ: wahlReiheLabel(currentBundle.wahl.typ, localeOpts),
							jahr: String(currentBundle.wahl.jahr),
							ebene: wahlEbeneLabel(selectedLevel, localeOpts)
						},
						localeOpts
					)}
				>
					<caption>
						{m.inspector_wahl_a11y_caption(
							{
								typ: wahlReiheLabel(currentBundle.wahl.typ, localeOpts),
								jahr: String(currentBundle.wahl.jahr),
								ebene: wahlEbeneLabel(selectedLevel, localeOpts)
							},
							localeOpts
						)}
					</caption>
					<thead>
						<tr>
							<th scope="col">{m.inspector_wahl_table_partei(undefined, localeOpts)}</th>
							<th scope="col">{m.inspector_wahl_table_stimmen(undefined, localeOpts)}</th>
							<th scope="col">{m.inspector_wahl_table_anteil(undefined, localeOpts)}</th>
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

				<BriefwahlMarker
					showBadge={isKiezBriefwahlSchaetzung}
					tooltip={m.inspector_wahl_briefwahl_tooltip(undefined, localeOpts)}
					label={m.inspector_wahl_briefwahl_label(undefined, localeOpts)}
					methodikHref={localizedHref(`${methodikHref}#wahldaten-briefwahl`, locale)}
				/>
			{:else}
				<p data-testid="wahl-empty" class="font-mono text-xs text-ink-subtle">
					{m.inspector_wahl_empty(undefined, localeOpts)}
				</p>
			{/if}

			{#if sparklineLines.length > 0}
				<div data-testid="wahl-sparkline" class="space-y-2 border-t border-rule pt-2">
					<p
						class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
						data-testid="wahl-sparkline-label"
					>
						{m.inspector_wahl_sparkline_label(
							{
								from: String(sparklineLines[0]?.years[0] ?? ''),
								to: String(sparklineLines[0]?.years[sparklineLines[0].years.length - 1] ?? '')
							},
							localeOpts
						)}
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
									aria-label={m.inspector_wahl_sparkline_aria(
										{ partei: line.kurzname },
										localeOpts
									)}
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
								<span class="min-w-0 flex-1">{line.kurzname}</span>
								<span class="whitespace-nowrap text-ink-muted tabular-nums">
									{formatPct(line.latestAnteil)}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<p
				id={uniqueId(currentBundle) + '-meta'}
				class="font-mono text-[10px] tracking-wide text-ink-subtle uppercase"
				data-testid="wahl-meta"
			>
				{m.inspector_wahl_meta(
					{ source: sourceLabel, license: currentBundle.wahl.license },
					localeOpts
				)}
			</p>
		{/if}

		<EditorialDisclaimer variant="wahl-stimmenanteile" />

		<div class="flex flex-wrap gap-3">
			{#if currentBundle}
				{@const slug = buildWahlSlug({
					jahr: currentBundle.wahl.jahr,
					typ: currentBundle.wahl.typ,
					stimmtyp: currentBundle.wahl.stimmtyp
				})}
				<a
					href={localizedHref(`/berlin-wahlen/${slug}`, locale)}
					data-testid="wahl-detail-link"
					class="hover:text-accent-strong inline-block font-mono text-xs text-accent underline underline-offset-2"
				>
					{m.inspector_wahl_detail_link(undefined, localeOpts)}
				</a>
			{/if}
			<a
				href={localizedHref(methodikHref, locale)}
				data-testid="wahl-methodik-link"
				class="hover:text-accent-strong inline-block font-mono text-xs text-accent underline underline-offset-2"
			>
				{m.inspector_wahl_methodik_link(undefined, localeOpts)}
			</a>
		</div>
	</section>
{/if}
