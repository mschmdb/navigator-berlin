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
	import { page } from '$app/state';
	import type { RankingRow } from '$lib/data/ranking-types.js';

	interface Props {
		readonly kieze: readonly RankingRow[];
		readonly bezirke: readonly RankingRow[];
	}

	const { kieze, bezirke }: Props = $props();

	type SortKey =
		| 'composite'
		| 'ruheLuft'
		| 'gruen'
		| 'mobilitaet'
		| 'sozialeLage'
		| 'versorgung';
	type SortDir = 'asc' | 'desc';
	type View = 'kieze' | 'bezirke';

	const SORT_KEYS: readonly SortKey[] = [
		'composite',
		'ruheLuft',
		'gruen',
		'mobilitaet',
		'sozialeLage',
		'versorgung'
	];

	const COLUMN_LABEL: Record<SortKey, string> = {
		composite: 'Score',
		ruheLuft: 'Ruhe & Luft',
		gruen: 'Grün',
		mobilitaet: 'Mobilität',
		sozialeLage: 'Soziale Lage',
		versorgung: 'Versorgung'
	};

	function readSort(params: URLSearchParams): SortKey {
		const raw = params.get('sort');
		return SORT_KEYS.includes(raw as SortKey) ? (raw as SortKey) : 'composite';
	}
	function readDir(params: URLSearchParams): SortDir {
		return params.get('dir') === 'asc' ? 'asc' : 'desc';
	}
	function readView(params: URLSearchParams): View {
		return params.get('view') === 'bezirke' ? 'bezirke' : 'kieze';
	}

	const sortKey = $derived<SortKey>(readSort(page.url.searchParams));
	const sortDir = $derived<SortDir>(readDir(page.url.searchParams));
	const view = $derived<View>(readView(page.url.searchParams));

	const rowsForView = $derived<readonly RankingRow[]>(view === 'kieze' ? kieze : bezirke);

	const sortedRows = $derived.by<readonly RankingRow[]>(() => {
		const arr = [...rowsForView];
		arr.sort((a, b) => {
			const av = a[sortKey];
			const bv = b[sortKey];
			if (av === null && bv === null) return 0;
			if (av === null) return 1; // nulls always to the end
			if (bv === null) return -1;
			return sortDir === 'asc' ? av - bv : bv - av;
		});
		return arr;
	});

	function applyParams(updates: Record<string, string | null>): void {
		const params = new URLSearchParams(page.url.searchParams);
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
			applyParams({ sort: key, dir: 'desc' });
		}
	}

	function switchView(next: View): void {
		applyParams({ view: next });
	}

	function formatScore(value: number | null): string {
		if (value === null || !Number.isFinite(value)) return '–';
		return Math.round(value).toString();
	}

	function detailHref(row: RankingRow): string {
		return view === 'kieze' ? `/kiez/${row.slug}` : `/bezirk/${row.slug}`;
	}

	const sozialActive = $derived(sortKey === 'sozialeLage');
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
			{sortDir === 'desc' ? '· hoch → niedrig' : '· niedrig → hoch'}
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
				<tr class="border-b border-rule text-left">
					<th class="py-2 pr-3 font-semibold" scope="col">Rang</th>
					<th class="py-2 pr-3 font-semibold" scope="col">
						{view === 'kieze' ? 'Kiez' : 'Bezirk'}
					</th>
					{#if view === 'kieze'}
						<th class="py-2 pr-3 font-semibold" scope="col">Bezirk</th>
					{/if}
					{#each SORT_KEYS as key (key)}
						<th class="py-2 pr-3 font-semibold" scope="col">
							<button
								type="button"
								data-testid={`ranking-sort-${key}`}
								class="inline-flex items-center gap-1 font-semibold {sortKey === key ? 'text-ink' : 'text-ink-muted'} hover:text-ink"
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
						<td class="py-3 pr-3 font-mono text-ink">{formatScore(row.composite)}</td>
						<td class="py-3 pr-3 font-mono text-ink">{formatScore(row.ruheLuft)}</td>
						<td class="py-3 pr-3 font-mono text-ink">{formatScore(row.gruen)}</td>
						<td class="py-3 pr-3 font-mono text-ink">{formatScore(row.mobilitaet)}</td>
						<td class="py-3 pr-3 font-mono text-ink {sozialActive ? 'font-semibold' : ''}">
							{formatScore(row.sozialeLage)}
						</td>
						<td class="py-3 pr-3 font-mono text-ink">{formatScore(row.versorgung)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
