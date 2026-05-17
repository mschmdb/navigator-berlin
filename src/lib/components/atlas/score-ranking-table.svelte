<!--
	Story 2.9b T2: Ranking-Table mit Sort + View-Toggle.

	Phase-1 DE-only. Hairline-Tabelle ohne Vertikal-Linien (UX-DR43).
	Sort + View-State im URL via replaceState; Page-Daten kommen einmalig
	vom Server-Loader weil die Route prerendered=true ist (statisches HTML,
	keine erneute Server-Anfrage).

	Stigma-Disziplin (Memory feedback_no_lebenswert + project_compare_
	editorial_profiles): Default-Sort ist composite ohne „beste/schlechteste"-
	Sprache; Soziale-Lage als Spalten-Wert erlaubt, Sortier-Button funktioniert
	technisch, aber Disclaimer-Banner wird sichtbar wenn aktiv.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import type { RankingRow } from '$lib/data/ranking-types.js';

	// Bei Prerender (SSR statischer Build) wirft SvelteKit beim Zugriff auf
	// url.searchParams. URL-State (sort/dir/view) ist nur browser-relevant —
	// auf dem Server-Render starten alle mit Default, Client hydratiert.
	const EMPTY_SEARCH = new URLSearchParams();
	function searchParams(): URLSearchParams {
		return browser ? page.url.searchParams : EMPTY_SEARCH;
	}

	interface Props {
		readonly kieze: readonly RankingRow[];
		readonly bezirke: readonly RankingRow[];
	}

	const { kieze, bezirke }: Props = $props();

	type NumericSortKey =
		| 'composite'
		| 'ruheLuft'
		| 'gruen'
		| 'mobilitaet'
		| 'sozialeLage'
		| 'versorgung';
	type StringSortKey = 'name' | 'bezirk';
	type SortKey = NumericSortKey | StringSortKey;
	type SortDir = 'asc' | 'desc';
	type View = 'kieze' | 'bezirke';

	const NUMERIC_SORT_KEYS: readonly NumericSortKey[] = [
		'composite',
		'ruheLuft',
		'gruen',
		'mobilitaet',
		'sozialeLage',
		'versorgung'
	];
	const STRING_SORT_KEYS: readonly StringSortKey[] = ['name', 'bezirk'];
	const ALL_SORT_KEYS: readonly SortKey[] = [...NUMERIC_SORT_KEYS, ...STRING_SORT_KEYS];

	const COLUMN_LABEL: Record<SortKey, string> = {
		name: 'Name',
		bezirk: 'Bezirk',
		composite: 'Score',
		ruheLuft: 'Ruhe & Luft',
		gruen: 'Grün',
		mobilitaet: 'Mobilität',
		sozialeLage: 'Soziale Lage',
		versorgung: 'Versorgung'
	};

	function isNumericSortKey(key: SortKey): key is NumericSortKey {
		return (NUMERIC_SORT_KEYS as readonly string[]).includes(key);
	}

	function readSort(params: URLSearchParams): SortKey {
		const raw = params.get('sort');
		return ALL_SORT_KEYS.includes(raw as SortKey) ? (raw as SortKey) : 'composite';
	}
	function readDir(params: URLSearchParams): SortDir {
		return params.get('dir') === 'asc' ? 'asc' : 'desc';
	}
	function readView(params: URLSearchParams): View {
		return params.get('view') === 'bezirke' ? 'bezirke' : 'kieze';
	}

	const sortKey = $derived<SortKey>(readSort(searchParams()));
	const sortDir = $derived<SortDir>(readDir(searchParams()));
	const view = $derived<View>(readView(searchParams()));

	const rowsForView = $derived<readonly RankingRow[]>(view === 'kieze' ? kieze : bezirke);

	const collator = new Intl.Collator('de-DE', { sensitivity: 'base' });

	function compareString(a: string | null, b: string | null, dir: SortDir): number {
		if (!a && !b) return 0;
		if (!a) return 1;
		if (!b) return -1;
		const cmp = collator.compare(a, b);
		return dir === 'asc' ? cmp : -cmp;
	}

	const sortedRows = $derived.by<readonly RankingRow[]>(() => {
		const arr = [...rowsForView];
		arr.sort((a, b) => {
			if (sortKey === 'name') {
				return compareString(a.displayName, b.displayName, sortDir);
			}
			if (sortKey === 'bezirk') {
				return compareString(a.bezirkName, b.bezirkName, sortDir);
			}
			const av = a[sortKey];
			const bv = b[sortKey];
			if (av === null && bv === null) return 0;
			if (av === null) return 1;
			if (bv === null) return -1;
			return sortDir === 'asc' ? av - bv : bv - av;
		});
		return arr;
	});

	function applyParams(updates: Record<string, string | null>): void {
		const params = new URLSearchParams(searchParams());
		for (const [key, value] of Object.entries(updates)) {
			if (value === null) params.delete(key);
			else params.set(key, value);
		}
		const query = params.toString();
		const url = query.length > 0 ? `${page.url.pathname}?${query}` : page.url.pathname;
		void goto(url, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function toggleSort(key: SortKey): void {
		if (key === sortKey) {
			applyParams({ dir: sortDir === 'desc' ? 'asc' : 'desc' });
		} else {
			applyParams({ sort: key, dir: isNumericSortKey(key) ? 'desc' : 'asc' });
		}
	}

	function switchView(next: View): void {
		// Bezirke-view hat keine Bezirk-Spalte; falls aktiv: Sort auf Default zurücksetzen.
		if (next === 'bezirke' && sortKey === 'bezirk') {
			applyParams({ view: next, sort: 'composite', dir: 'desc' });
		} else {
			applyParams({ view: next });
		}
	}

	function formatScore(value: number | null): string {
		if (value === null || !Number.isFinite(value)) return '–';
		return Math.round(value).toString();
	}

	function detailHref(row: RankingRow): string {
		return view === 'kieze' ? `/kiez/${row.slug}` : `/bezirk/${row.slug}`;
	}

	/**
	 * Score-Pill-Mapping (Story 2.9b + Story 1.31 Color-Family-System).
	 *
	 * 4 Buckets quer durch divergent rot → orange → hellgrün → grün, auf Basis
	 * der existierenden Choropleth-Familie-Tokens (`--scale-last-*` Vermillion,
	 * `--state-warning` Bernstein, `--scale-gut-*` Grün). Color-Mix-Tints
	 * landen weich auf dem Cloud-Dancer-Background ohne Knall.
	 *
	 * Wichtig: Soziale-Lage-Spalte BEKOMMT KEINE Pille (Stigma-Schutz, Story
	 * 1.31 Strukturell-Family — Memory `project_compare_editorial_profiles`).
	 */
	type ScoreBucket = 0 | 1 | 2 | 3 | 4;
	function scoreBucket(value: number | null): ScoreBucket {
		if (value === null || !Number.isFinite(value)) return 0;
		if (value >= 70) return 4;
		if (value >= 50) return 3;
		if (value >= 30) return 2;
		return 1;
	}
	function pillClass(value: number | null, neutral = false): string {
		const base = 'inline-block min-w-[2.25rem] rounded px-2 py-0.5 text-center font-mono tabular-nums';
		if (neutral) return `${base} text-ink`;
		const bucket = scoreBucket(value);
		if (bucket === 0) return `${base} text-ink-muted`;
		return `${base} score-pill-${bucket} text-ink`;
	}
	const cellPadding = 'py-3 pr-3';

	const sozialActive = $derived(sortKey === 'sozialeLage');

	const sortDirLabel = $derived.by(() => {
		if (sortKey === 'name' || sortKey === 'bezirk') {
			return sortDir === 'asc' ? '· A → Z' : '· Z → A';
		}
		return sortDir === 'desc' ? '· hoch → niedrig' : '· niedrig → hoch';
	});

	const nameColumnLabel = $derived(view === 'kieze' ? 'Kiez' : 'Bezirk');

	function headerButtonClass(active: boolean): string {
		const base =
			'inline-flex items-center gap-1 whitespace-nowrap font-mono text-[11px] uppercase tracking-wider hover:text-ink';
		return active ? `${base} text-ink` : `${base} text-ink-subtle`;
	}
</script>

<section data-testid="score-ranking" class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-3" role="radiogroup" aria-label="Ranking-Ansicht wechseln">
		<div class="inline-flex rounded border border-rule" role="presentation">
			<button
				type="button"
				role="radio"
				aria-checked={view === 'kieze'}
				data-testid="ranking-view-kieze"
				class="px-4 py-2 font-mono text-xs uppercase tracking-wider {view === 'kieze' ? 'bg-ink text-bg' : 'text-ink hover:bg-bg-soft'}"
				onclick={() => switchView('kieze')}
			>
				{kieze.length} Kieze
			</button>
			<button
				type="button"
				role="radio"
				aria-checked={view === 'bezirke'}
				data-testid="ranking-view-bezirke"
				class="px-4 py-2 font-mono text-xs uppercase tracking-wider border-l border-rule {view === 'bezirke' ? 'bg-ink text-bg' : 'text-ink hover:bg-bg-soft'}"
				onclick={() => switchView('bezirke')}
			>
				{bezirke.length} Bezirke
			</button>
		</div>
		<p class="font-mono text-xs text-ink-subtle">
			Sortiert nach <span class="font-semibold text-ink">{COLUMN_LABEL[sortKey]}</span>
			{sortDirLabel}
		</p>
	</div>

	{#if sozialActive}
		<aside
			data-testid="ranking-soziale-disclaimer"
			class="rounded border border-rule bg-bg-soft px-4 py-3 font-serif text-sm text-ink-muted"
			role="note"
		>
			Soziale Lage ist ein Aggregat des Berliner Monitoring Soziale Stadtentwicklung. Sie
			beschreibt Verteilung, nicht Wertung einzelner Adressen oder Personen.
		</aside>
	{/if}

	<div class="overflow-x-auto" data-testid="ranking-table-wrapper">
		<table class="w-full font-sans text-sm" data-testid="ranking-table">
			<thead>
				<tr class="border-b border-rule text-left align-bottom">
					<th
						class="whitespace-nowrap py-2 pr-3 font-mono text-[11px] uppercase tracking-wider text-ink-subtle"
						scope="col"
					>
						Rang
					</th>
					<th class="whitespace-nowrap py-2 pr-3 align-bottom" scope="col">
						<button
							type="button"
							data-testid="ranking-sort-name"
							class={headerButtonClass(sortKey === 'name')}
							aria-pressed={sortKey === 'name'}
							onclick={() => toggleSort('name')}
						>
							{nameColumnLabel}
							{#if sortKey === 'name'}
								<span aria-hidden="true">{sortDir === 'desc' ? '↓' : '↑'}</span>
							{/if}
						</button>
					</th>
					{#if view === 'kieze'}
						<th class="whitespace-nowrap py-2 pr-3 align-bottom" scope="col">
							<button
								type="button"
								data-testid="ranking-sort-bezirk"
								class={headerButtonClass(sortKey === 'bezirk')}
								aria-pressed={sortKey === 'bezirk'}
								onclick={() => toggleSort('bezirk')}
							>
								Bezirk
								{#if sortKey === 'bezirk'}
									<span aria-hidden="true">{sortDir === 'desc' ? '↓' : '↑'}</span>
								{/if}
							</button>
						</th>
					{/if}
					{#each NUMERIC_SORT_KEYS as key (key)}
						<th class="whitespace-nowrap py-2 pr-3 align-bottom" scope="col">
							<button
								type="button"
								data-testid={`ranking-sort-${key}`}
								class={headerButtonClass(sortKey === key)}
								aria-pressed={sortKey === key}
								onclick={() => toggleSort(key)}
							>
								{COLUMN_LABEL[key]}
								{#if sortKey === key}
									<span aria-hidden="true">{sortDir === 'desc' ? '↓' : '↑'}</span>
								{/if}
							</button>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each sortedRows as row, index (row.slug)}
					<tr class="border-b border-rule align-top">
						<td class="py-3 pr-3 font-mono text-xs text-ink-subtle">{index + 1}</td>
						<th scope="row" class="py-3 pr-3 text-left font-semibold text-ink">
							<a class="text-ink hover:text-accent hover:underline" href={detailHref(row)}>
								{row.displayName}
							</a>
						</th>
						{#if view === 'kieze'}
							<td class="py-3 pr-3 font-mono text-xs text-ink-muted">
								{row.bezirkName ?? '–'}
							</td>
						{/if}
						<td class={cellPadding}><span class={pillClass(row.composite)}>{formatScore(row.composite)}</span></td>
						<td class={cellPadding}><span class={pillClass(row.ruheLuft)}>{formatScore(row.ruheLuft)}</span></td>
						<td class={cellPadding}><span class={pillClass(row.gruen)}>{formatScore(row.gruen)}</span></td>
						<td class={cellPadding}><span class={pillClass(row.mobilitaet)}>{formatScore(row.mobilitaet)}</span></td>
						<td class={cellPadding}>
							<span class="{pillClass(row.sozialeLage, true)} {sozialActive ? 'font-semibold' : ''}">
								{formatScore(row.sozialeLage)}
							</span>
						</td>
						<td class={cellPadding}><span class={pillClass(row.versorgung)}>{formatScore(row.versorgung)}</span></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<dl
		class="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 font-mono text-[11px] uppercase tracking-wider text-ink-subtle"
		data-testid="ranking-legend"
	>
		<dt class="text-ink-muted">Skala:</dt>
		<dd class="flex items-center gap-2">
			<span class="score-pill-1 inline-block size-4 rounded-sm" aria-hidden="true"></span> &lt; 30
		</dd>
		<dd class="flex items-center gap-2">
			<span class="score-pill-2 inline-block size-4 rounded-sm" aria-hidden="true"></span> 30 – 49
		</dd>
		<dd class="flex items-center gap-2">
			<span class="score-pill-3 inline-block size-4 rounded-sm" aria-hidden="true"></span> 50 – 69
		</dd>
		<dd class="flex items-center gap-2">
			<span class="score-pill-4 inline-block size-4 rounded-sm" aria-hidden="true"></span> 70 – 100
		</dd>
		<dd class="text-ink-muted">Soziale Lage: neutral (kein Farbverlauf)</dd>
	</dl>
</section>

<style>
	/*
	 * Re-use Story-1.31 Choropleth-Family-Tokens:
	 *  - rot/orange-Spektrum: --scale-last-5 (Vermillion) + --state-warning (Bernstein)
	 *  - grün-Spektrum: --scale-gut-3..5
	 * Color-Mix-Tints landen weich auf Cloud-Dancer (--bg #ECEAE0).
	 * Dunkler Ink-Text bleibt SC-1.4.3-konform auf den Tints.
	 */
	.score-pill-1 {
		background-color: color-mix(in srgb, var(--scale-last-5, #8c2a14) 28%, var(--bg, #ecead0));
	}
	.score-pill-2 {
		background-color: color-mix(in srgb, var(--state-warning, #9e5520) 30%, var(--bg, #ecead0));
	}
	.score-pill-3 {
		background-color: color-mix(in srgb, var(--scale-gut-3, #4f7153) 32%, var(--bg, #ecead0));
	}
	.score-pill-4 {
		background-color: color-mix(in srgb, var(--scale-gut-5, #1f5a2e) 35%, var(--bg, #ecead0));
	}
</style>
