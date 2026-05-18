<script lang="ts">
	import EditorialDisclaimer from '../editorial-disclaimer.svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
	import { parteiColor } from '$lib/data/partei-farben.js';
	import type {
		WahlResultsAtPoint,
		WahlResultBundle,
		Top5Entry,
		LevelKey
	} from '$lib/data/get-wahl-results-at-point.js';

	type Props = {
		resultsA: WahlResultsAtPoint | null;
		resultsB: WahlResultsAtPoint | null;
		methodikHref?: string;
	};

	let { resultsA, resultsB, methodikHref = '/methodik/wahldaten' }: Props = $props();

	type Wahltyp = 'btw' | 'agh' | 'bvv';

	const TYP_LABELS: Record<Wahltyp, string> = {
		btw: 'Bundestag',
		agh: 'Abgeordnetenhaus',
		bvv: 'BVV'
	};

	const LEVEL_LABELS: Record<LevelKey, string> = {
		stimmbezirk: 'Stimmbezirk',
		kiez: 'Kiez',
		bezirk: 'Bezirk',
		berlin: 'Berlin gesamt'
	};

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
		return all.filter(
			(lvl) => bundleA?.levels[lvl]?.available || bundleB?.levels[lvl]?.available
		);
	});

	$effect(() => {
		if (availableLevels.length === 0) return;
		if (!availableLevels.includes(selectedLevel)) {
			selectedLevel = availableLevels.includes('stimmbezirk')
				? 'stimmbezirk'
				: availableLevels[0];
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
			return (
				bundleA?.uwbId !== null &&
				bundleA?.uwbId !== undefined &&
				bundleA.uwbId === bundleB?.uwbId
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

	function formatPct(n: number): string {
		return `${(n * 100).toFixed(1).replace('.', ',')} %`;
	}

	function anteilForPartei(top: Top5Entry[], kurzname: string): number | null {
		const m = top.find((e) => e.kurzname === kurzname);
		return m ? m.anteil : null;
	}

	function anteilForPartieFull(side: 'a' | 'b', kurzname: string): number | null {
		return anteilForPartei(side === 'a' ? topAFull : topBFull, kurzname);
	}

	const visible = $derived(
		featureFlags.wahlSection &&
			(topA.length > 0 || topB.length > 0) &&
			availableTypen.length > 0
	);
</script>

{#if visible && jahr !== null}
	<section data-testid="wahl-compare-block" class="space-y-3">
		<h3
			class="font-mono text-xs uppercase tracking-wide text-ink-muted border-t border-rule pt-4"
			data-testid="wahl-compare-header"
		>
			Wahlverhalten · Vergleich
		</h3>

		<div
			role="tablist"
			aria-label="Wahltyp"
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

		{#if availableLevels.length > 1}
			<div
				role="radiogroup"
				aria-label="Ebene"
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

		<p class="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
			{TYP_LABELS[selectedTyp]} {jahr} · Ebene {LEVEL_LABELS[selectedLevel]} · {defaultStimmtyp === 'einstimme'
				? 'Stimme'
				: defaultStimmtyp === 'zweitstimme'
					? 'Zweitstimme'
					: 'Erststimme'}
		</p>

		{#if sameAggregat && selectedLevel !== 'berlin'}
			<p
				class="font-serif italic text-xs text-ink-muted border-l-2 border-ink/30 pl-2"
				data-testid="wahl-compare-same-aggregat"
			>
				{selectedLevel === 'stimmbezirk'
					? 'Beide Adressen liegen im selben Stimmbezirk · Werte identisch auf dieser Ebene'
					: selectedLevel === 'kiez'
						? 'Beide Adressen liegen im selben Kiez · für Adress-Unterschiede die Ebene Stimmbezirk wählen'
						: 'Beide Adressen liegen im selben Bezirk · für feinere Unterschiede die Ebene Kiez oder Stimmbezirk wählen'}
			</p>
		{/if}

		{#if topA.length === 0 && topB.length === 0}
			<p data-testid="wahl-compare-empty" class="font-mono text-xs text-ink-muted">
				Keine Kiez-Wahl-Daten für diesen Wahltyp.
			</p>
		{:else}
			{@const allParteien = Array.from(
				new Set([...topA.map((e) => e.kurzname), ...topB.map((e) => e.kurzname)])
			)}
			<table
				class="w-full font-mono text-xs"
				data-testid="wahl-compare-table"
			>
				<thead>
					<tr class="text-[10px] uppercase tracking-wide text-ink-muted">
						<th class="text-left pb-1">Partei</th>
						<th class="text-right pb-1 px-2">A</th>
						<th class="text-right pb-1 px-2">B</th>
						<th class="text-right pb-1">Diff</th>
					</tr>
				</thead>
				<tbody>
					{#each allParteien as kurzname (kurzname)}
						{@const a = anteilForPartieFull('a', kurzname)}
						{@const b = anteilForPartieFull('b', kurzname)}
						{@const diff = a !== null && b !== null ? (a - b) * 100 : null}
						<tr
							class="border-t border-rule/50"
							data-testid={`wahl-compare-row-${kurzname}`}
						>
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
								class="text-right tabular-nums px-2 text-ink"
								data-testid={`wahl-compare-${kurzname}-a`}
							>
								{a !== null ? formatPct(a) : '–'}
							</td>
							<td
								class="text-right tabular-nums px-2 text-ink"
								data-testid={`wahl-compare-${kurzname}-b`}
							>
								{b !== null ? formatPct(b) : '–'}
							</td>
							<td
								class="text-right tabular-nums text-ink-muted"
								data-testid={`wahl-compare-${kurzname}-diff`}
								title={diff !== null
									? `Differenz A−B: ${Math.abs(diff).toFixed(1).replace('.', ',')} Prozent-Punkte ${diff > 0 ? 'höher in A' : diff < 0 ? 'höher in B' : 'gleich'}`
									: 'Vergleich nicht möglich'}
							>
								{diff !== null
									? `${diff > 0 ? '+' : diff < 0 ? '−' : '±'}${Math.abs(diff).toFixed(1).replace('.', ',')}`
									: '–'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<p class="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
				Diff in Prozent-Punkten (A minus B). Top-5 je Adresse zusammengeführt.
			</p>
		{/if}

		<EditorialDisclaimer variant="wahl-stimmenanteile" />

		<a
			href={methodikHref}
			data-testid="wahl-compare-methodik-link"
			class="inline-block font-mono text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
		>
			Methodik · Wahldaten
		</a>
	</section>
{/if}
