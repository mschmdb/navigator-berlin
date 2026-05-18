<script lang="ts">
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import { parteiColor, parteiPattern } from '$lib/data/partei-farben.js';
	import type {
		WahlResultsAtPoint,
		WahlResultBundle,
		LevelKey,
		Top5Entry
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

	const currentBundle = $derived.by<WahlResultBundle | null>(() => {
		const match = bundlesForTyp.find((b) => b.wahl.stimmtyp === selectedStimmtyp);
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

	const top5 = $derived.by<Top5Entry[]>(() => currentLevelResults?.top5 ?? []);
	const totalStimmen = $derived(top5.reduce((s, e) => s + e.stimmen, 0));

	function formatPct(n: number): string {
		return `${(n * 100).toFixed(1).replace('.', ',')} %`;
	}

	function formatStimmen(n: number): string {
		return n.toLocaleString('de-DE');
	}

	function uniqueId(b: WahlResultBundle): string {
		return `wahl-${bundleKey(b)}`;
	}

	const isBriefwahlLevel = $derived(
		selectedLevel === 'stimmbezirk' && currentLevelResults?.isBriefwahlAggregat === true
	);
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
					class="font-mono text-xs px-2 py-1 rounded border transition-colors"
					class:bg-accent={selectedTyp === typ}
					class:text-accent-foreground={selectedTyp === typ}
					class:border-accent={selectedTyp === typ}
					class:border-rule={selectedTyp !== typ}
					class:text-ink-muted={selectedTyp !== typ}
					class:hover:bg-bg-muted={selectedTyp !== typ}
				>
					{TYP_LABELS[typ]}
				</button>
			{/each}
		</div>

		{#if currentBundle}
			<div class="flex items-baseline justify-between gap-3 flex-wrap">
				<div class="flex flex-col">
					<span class="font-sans text-sm font-semibold text-ink">
						{TYP_LABELS[currentBundle.wahl.typ]} {currentBundle.wahl.jahr}
						{#if currentBundle.wahl.isRepeatElection}
							<span
								class="ml-1 inline-block font-mono text-[10px] uppercase tracking-wide text-ink-subtle align-middle"
								data-testid="wahl-wiederholung-marker"
							>
								(Wiederholung)
							</span>
						{/if}
					</span>
					{#if stimmtypenForTyp.length > 1}
						<div
							role="radiogroup"
							aria-label="Stimmenart"
							class="mt-1 flex gap-1"
							data-testid="wahl-stimmtyp-switch"
						>
							{#each stimmtypenForTyp as st (st)}
								<button
									role="radio"
									type="button"
									aria-checked={selectedStimmtyp === st}
									data-testid={`wahl-stimmtyp-${st}`}
									onclick={() => (selectedStimmtyp = st)}
									class="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded transition-colors"
									class:bg-bg-muted={selectedStimmtyp === st}
									class:text-ink={selectedStimmtyp === st}
									class:text-ink-subtle={selectedStimmtyp !== st}
									class:hover:text-ink={selectedStimmtyp !== st}
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
				</div>

				{#if availableLevels.length > 0}
					<label class="flex items-center gap-2">
						<span class="font-mono text-[10px] uppercase tracking-wide text-ink-subtle">
							Ebene
						</span>
						<select
							data-testid="wahl-level-switch"
							bind:value={selectedLevel}
							class="font-mono text-xs px-2 py-1 rounded border border-rule bg-bg text-ink"
						>
							{#each availableLevels as lvl (lvl)}
								<option value={lvl}>{LEVEL_LABELS[lvl]}</option>
							{/each}
						</select>
					</label>
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
					</div>
					<ul class="grid grid-cols-1 gap-1 sm:grid-cols-2" data-testid="wahl-legend">
						{#each top5 as entry (entry.kurzname)}
							<li class="flex items-baseline gap-2 font-mono text-xs">
								<span
									class="inline-block h-2.5 w-2.5 rounded-sm border border-ink/10 flex-shrink-0"
									style="background-color:{parteiColor(entry.kurzname)};"
									aria-hidden="true"
								></span>
								<span class="text-ink truncate">{entry.kurzname}</span>
								<span class="ml-auto text-ink-muted tabular-nums">
									{formatPct(entry.anteil)}
								</span>
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

		<a
			href={methodikHref}
			data-testid="wahl-methodik-link"
			class="inline-block font-mono text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
		>
			Methodik · Wahldaten
		</a>
	</section>
{/if}
