<script lang="ts">
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import BriefwahlMarker from '../briefwahl-marker.svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import { parteiColor } from '$lib/data/partei-farben.js';
	import type {
		WahlResultsAtPoint,
		WahlResultBundle,
		Top5Entry,
		LevelKey
	} from '$lib/data/get-wahl-results-at-point.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { formatDecimal, formatPercent } from '$lib/i18n/format.js';
	import { wahlEbeneLabel, wahlReiheLabel, wahlStimmtypLabel } from '$lib/data/wahl-labels.js';

	type Props = {
		resultsA: WahlResultsAtPoint | null;
		resultsB: WahlResultsAtPoint | null;
		methodikHref?: string;
	};

	let { resultsA, resultsB, methodikHref = '/methodik/wahldaten' }: Props = $props();

	const localeOpts = $derived({ locale: getLocale() });
	const localizedMethodikHref = $derived(localizedHref(methodikHref));

	type Wahltyp = 'btw' | 'agh' | 'bvv';

	const availableTypen = $derived.by<Wahltyp[]>(() => {
		const set = new Set<Wahltyp>();
		for (const r of [resultsA, resultsB]) {
			if (!r) continue;
			for (const b of r.wahlen) set.add(b.wahl.typ);
		}
		return ['btw', 'agh', 'bvv'].filter((t) => set.has(t as Wahltyp)) as Wahltyp[];
	});

	let selectedTyp = $state<Wahltyp>('btw');
	let selectedLevel = $state<LevelKey>('stimmbezirk');

	$effect(() => {
		if (availableTypen.length === 0) return;
		if (!availableTypen.includes(selectedTyp)) {
			selectedTyp = availableTypen[0];
		}
	});

	const defaultStimmtyp = $derived(selectedTyp === 'bvv' ? 'einstimme' : 'zweitstimme');

	function pickLatestBundle(
		r: WahlResultsAtPoint | null,
		typ: Wahltyp,
		stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme'
	): WahlResultBundle | null {
		if (!r) return null;
		const matches = r.wahlen
			.filter((b) => b.wahl.typ === typ && b.wahl.stimmtyp === stimmtyp)
			.sort((a, b) => b.wahl.jahr - a.wahl.jahr);
		return matches[0] ?? null;
	}

	const bundleA = $derived(pickLatestBundle(resultsA, selectedTyp, defaultStimmtyp));
	const bundleB = $derived(pickLatestBundle(resultsB, selectedTyp, defaultStimmtyp));

	const availableLevels = $derived.by<readonly LevelKey[]>(() => {
		const all: LevelKey[] = ['stimmbezirk', 'kiez', 'bezirk', 'berlin'];
		return all.filter((lvl) => bundleA?.levels[lvl]?.available || bundleB?.levels[lvl]?.available);
	});

	$effect(() => {
		if (availableLevels.length === 0) return;
		if (!availableLevels.includes(selectedLevel)) {
			selectedLevel = availableLevels.includes('stimmbezirk') ? 'stimmbezirk' : availableLevels[0];
		}
	});

	function pickTopForLevel(b: WahlResultBundle | null, lvl: LevelKey): Top5Entry[] {
		if (!b) return [];
		const data = b.levels[lvl];
		return data?.available ? (data.top5 ?? []) : [];
	}

	// API liefert Top-10 für Cross-Level-Lookups (BSW etc Rank 6+ auf höheren Levels).
	// Compare-Render zeigt aber nur die Top-5-Union der beiden Adressen für Lesbarkeit.
	const topAFull = $derived(pickTopForLevel(bundleA, selectedLevel));
	const topBFull = $derived(pickTopForLevel(bundleB, selectedLevel));
	const topA = $derived(topAFull.slice(0, 5));
	const topB = $derived(topBFull.slice(0, 5));

	const sameAggregat = $derived.by(() => {
		if (selectedLevel === 'stimmbezirk') {
			// Story 17: die kleinste Kartenebene ist die Briefwahl-Gruppe, nicht
			// die einzelne Urne -- zwei Adressen mit unterschiedlicher `uwbId`
			// (Urne) können trotzdem zur selben Gruppe gehören (Review-Fund:
			// verglich bisher `uwbId`, meldete "verschieden" auch innerhalb
			// derselben Gruppe).
			return (
				bundleA?.gruppeId !== null &&
				bundleA?.gruppeId !== undefined &&
				bundleA.gruppeId === bundleB?.gruppeId
			);
		}
		if (selectedLevel === 'kiez') {
			return (
				resultsA?.location.kiezSlug !== null &&
				resultsA?.location.kiezSlug !== undefined &&
				resultsA.location.kiezSlug === resultsB?.location.kiezSlug
			);
		}
		if (selectedLevel === 'bezirk') {
			return (
				resultsA?.location.bezirkSlug !== null &&
				resultsA?.location.bezirkSlug !== undefined &&
				resultsA.location.bezirkSlug === resultsB?.location.bezirkSlug
			);
		}
		return selectedLevel === 'berlin';
	});

	const jahr = $derived(bundleA?.wahl.jahr ?? bundleB?.wahl.jahr ?? null);

	// Stimmbezirks-Werte sind für jede Wahl mit Geometrie echte Gruppen-
	// Summen aus Urne + Briefwahlbezirk, kein Caveat nötig. Kiez-Werte
	// verteilen die Briefwahl einer Gruppe anteilig nach Wahlberechtigten
	// auf ihre Urnen: eine Schätzung, keine amtliche Aufteilung.
	const isKiezBriefwahlSchaetzung = $derived(selectedLevel === 'kiez');

	function formatPct(n: number): string {
		return formatPercent(n, localeOpts);
	}

	function anteilForPartei(top: Top5Entry[], kurzname: string): number | null {
		const match = top.find((e) => e.kurzname === kurzname);
		return match ? match.anteil : null;
	}

	function anteilForPartieFull(side: 'a' | 'b', kurzname: string): number | null {
		return anteilForPartei(side === 'a' ? topAFull : topBFull, kurzname);
	}

	const visible = $derived(
		featureFlags.wahlSection && (topA.length > 0 || topB.length > 0) && availableTypen.length > 0
	);
</script>

{#if visible && jahr !== null}
	<section data-testid="wahl-compare-block" class="space-y-3">
		<h3
			class="border-t border-rule pt-4 font-mono text-xs tracking-wide text-ink-muted uppercase"
			data-testid="wahl-compare-header"
		>
			{m.wahl_compare_header()}
		</h3>

		<div
			role="tablist"
			aria-label={m.wahl_compare_typ_aria()}
			class="flex gap-1"
			data-testid="wahl-compare-typ-tabs"
		>
			{#each availableTypen as typ (typ)}
				<button
					role="tab"
					type="button"
					aria-selected={selectedTyp === typ}
					data-testid={`wahl-compare-typ-tab-${typ}`}
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

		{#if availableLevels.length > 1}
			<div
				role="radiogroup"
				aria-label={m.wahl_compare_ebene_aria()}
				class="flex flex-wrap gap-1"
				data-testid="wahl-compare-level-switch"
			>
				{#each availableLevels as lvl (lvl)}
					<button
						role="radio"
						type="button"
						aria-checked={selectedLevel === lvl}
						data-testid={`wahl-compare-level-${lvl}`}
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

		<p
			data-testid="wahl-compare-meta"
			class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
		>
			{wahlReiheLabel(selectedTyp, localeOpts)}
			{jahr} · {m.wahl_compare_ebene_prefix()}
			{wahlEbeneLabel(selectedLevel, localeOpts)} · {wahlStimmtypLabel(defaultStimmtyp, localeOpts)}
		</p>

		<BriefwahlMarker
			showBadge={isKiezBriefwahlSchaetzung}
			tooltip={m.wahl_compare_briefwahl_tooltip()}
			label={m.wahl_compare_briefwahl_label()}
			methodikHref={localizedHref(`${methodikHref}#wahldaten-briefwahl`)}
			testid="wahl-compare-briefwahl-marker"
		/>

		{#if sameAggregat && selectedLevel !== 'berlin'}
			<p
				class="border-l-2 border-ink/30 pl-2 font-serif text-xs text-ink-muted italic"
				data-testid="wahl-compare-same-aggregat"
			>
				{selectedLevel === 'stimmbezirk'
					? m.wahl_compare_same_aggregat_stimmbezirk()
					: selectedLevel === 'kiez'
						? m.wahl_compare_same_aggregat_kiez()
						: m.wahl_compare_same_aggregat_bezirk()}
			</p>
		{/if}

		{#if topA.length === 0 && topB.length === 0}
			<p data-testid="wahl-compare-empty" class="font-mono text-xs text-ink-muted">
				{m.wahl_compare_empty()}
			</p>
		{:else}
			{@const allParteien = Array.from(
				new Set([...topA.map((e) => e.kurzname), ...topB.map((e) => e.kurzname)])
			)}
			<table class="w-full font-mono text-xs" data-testid="wahl-compare-table">
				<thead>
					<tr class="text-[10px] tracking-wide text-ink-muted uppercase">
						<th class="pb-1 text-left">{m.wahl_compare_th_partei()}</th>
						<th class="px-2 pb-1 text-right">A</th>
						<th class="px-2 pb-1 text-right">B</th>
						<th class="pb-1 text-right">{m.wahl_compare_th_diff()}</th>
					</tr>
				</thead>
				<tbody>
					{#each allParteien as kurzname (kurzname)}
						{@const a = anteilForPartieFull('a', kurzname)}
						{@const b = anteilForPartieFull('b', kurzname)}
						{@const diff = a !== null && b !== null ? (a - b) * 100 : null}
						{@const diffAbs = formatDecimal(Math.abs(diff ?? 0), {
							...localeOpts,
							maximumFractionDigits: 1,
							minimumFractionDigits: 1
						})}
						{@const diffDirection =
							diff === null
								? null
								: diff > 0
									? m.wahl_compare_diff_higher_in({ side: 'A' }, localeOpts)
									: diff < 0
										? m.wahl_compare_diff_higher_in({ side: 'B' }, localeOpts)
										: m.wahl_compare_diff_equal(undefined, localeOpts)}
						<tr class="border-t border-rule/50" data-testid={`wahl-compare-row-${kurzname}`}>
							<td class="py-1">
								<span class="inline-flex items-center gap-1.5">
									<span
										class="inline-block h-2.5 w-2.5 rounded-sm border border-ink/10"
										style="background-color:{parteiColor(kurzname)};"
										aria-hidden="true"
									></span>
									<span class="text-ink">{kurzname}</span>
								</span>
							</td>
							<td
								class="px-2 text-right text-ink tabular-nums"
								data-testid={`wahl-compare-${kurzname}-a`}
							>
								{a !== null ? formatPct(a) : '–'}
							</td>
							<td
								class="px-2 text-right text-ink tabular-nums"
								data-testid={`wahl-compare-${kurzname}-b`}
							>
								{b !== null ? formatPct(b) : '–'}
							</td>
							<td
								class="text-right text-ink-muted tabular-nums"
								data-testid={`wahl-compare-${kurzname}-diff`}
								title={diff !== null
									? `${m.wahl_compare_diff_prefix(undefined, localeOpts)}: ${diffAbs} ${m.wahl_compare_diff_unit(undefined, localeOpts)} ${diffDirection}`
									: m.wahl_compare_diff_not_possible(undefined, localeOpts)}
							>
								{diff !== null ? `${diff > 0 ? '+' : diff < 0 ? '−' : '±'}${diffAbs}` : '–'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<p class="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
				{m.wahl_compare_footer_note()}
			</p>
		{/if}

		<EditorialDisclaimer variant="wahl-stimmenanteile" />

		<a
			href={localizedMethodikHref}
			data-testid="wahl-compare-methodik-link"
			class="hover:text-accent-strong inline-block font-mono text-xs text-accent underline underline-offset-2"
		>
			{m.wahl_compare_methodik_link()}
		</a>
	</section>
{/if}
