<script lang="ts">
	/**
	 * Story 8 (Trends/Sankey): Herzstück des Trends-Kapitels -- ein
	 * selbstgebauter SVG-Sankey über die Wahljahre der effektiven
	 * Legislatur-Reihe. Spalten = Jahre, Knoten = Parteien in Partei-Farbe,
	 * Bandbreite = Anzahl Gebiete je Partei-Übergang (gebündelt, NIE pro
	 * Gebiet). Kiez/Bezirk sind hier kapitel-lokal togglebar (Direktive:
	 * "Sankey-Ebene ist kapitel-lokal", unabhängig vom globalen Ebenen-Toggle).
	 *
	 * Datenquelle: dieselbe Bulk-Winners-Response wie Karte/Wechsel-Kapitel
	 * (`KiezBezirkWinnersLoader`, Modul-Cache) -- keine neue Server-API.
	 * Eigenbau-SVG (kein `d3-sankey`, kein layerchart, siehe Design Notes der
	 * Story): Knoten-Rechtecke + kubische Bézier-Bänder aus `sankey-layout.ts`.
	 */
	import { getWahlPortalState } from '$lib/state/wahl-portal-context.svelte.js';
	import { stimmtypForReihe } from '$lib/utils/wahl-portal-url-state.js';
	import { parteiColor } from '$lib/data/partei-farben.js';
	import DataTableAlternative, {
		type TableColumn
	} from '$lib/components/atlas/data-table-alternative.svelte';
	import { KiezBezirkWinnersLoader } from './internal/winner-map-winners.svelte.js';
	import { nextRadioIndex } from './internal/radiogroup-keyboard.js';
	import {
		computeUebergaengeFromRows,
		effectiveJahreFromRows,
		parteiAnzahlProJahrFromRows
	} from './internal/wechsel-data.js';
	import { computeSankeyLayout } from './internal/sankey-layout.js';
	import { KIEZ_COVERAGE_HINWEIS } from './internal/trends-map-data.js';

	type SankeyEbene = 'kiez' | 'bezirk';
	const EBENEN: readonly SankeyEbene[] = ['kiez', 'bezirk'];
	const EBENE_LABELS: Record<SankeyEbene, string> = { kiez: 'Kiez', bezirk: 'Bezirk' };

	/** Seitlicher Rand für die Knoten-Labels (Partei-Kurzname), die links der
	 * ersten und rechts aller weiteren Spalten aus dem Knoten-Rechteck
	 * herausragen (Review Triage Log #4: Farbe allein ist kein Label). */
	const LABEL_MARGIN = 90;
	/** Ab dieser Knoten-Höhe (px) passt ein Label ohne Überlapp zum Nachbarn. */
	const LABEL_MIN_HEIGHT = 10;

	type Props = {
		/** Injizierbar für Tests; Default = globales `fetch` (Muster wechsel-kapitel.svelte). */
		fetchFn?: typeof fetch;
		/** Trends-Kapitel bettet den Sankey ein und zeigt die Coverage-Fußnote
		 * bereits selbst -- doppelte Anzeige auf dem Schirm vermeiden
		 * (Review Triage Log #3). Default `true` (Sankey rendert eigenständig). */
		showCoverageHinweis?: boolean;
	};
	let { fetchFn = fetch, showCoverageHinweis = true }: Props = $props();

	/** Zitat aus `docs/wahldaten-methodik.md` Z. 258 (Kernsatz, reihe-generisch). */
	const WIEDERHOLUNGS_SATZ =
		'Eine Wiederholungswahl ersetzt ihre Eltern-Wahl an deren Position in der Reihe, statt einen eigenen Slot zu belegen (Wiederholungswahl-Regel, siehe Methodik).';

	const portal = getWahlPortalState();
	const stimmtyp = $derived(stimmtypForReihe(portal.reihe));

	let ebene = $state<SankeyEbene>('kiez');
	let ebeneButtons: HTMLButtonElement[] = $state([]);

	function onEbeneKeydown(event: KeyboardEvent, index: number): void {
		const next = nextRadioIndex(event.key, index, EBENEN.length);
		if (next === null) return;
		event.preventDefault();
		ebeneButtons[next]?.focus();
		ebene = EBENEN[next];
	}

	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop.
	const winnersLoader = new KiezBezirkWinnersLoader(fetchFn);

	$effect(() => {
		const expectedReihe = portal.reihe;
		const expectedStimmtyp = stimmtyp;
		const expectedEbene = ebene;
		void winnersLoader.load(
			expectedReihe,
			expectedStimmtyp,
			expectedEbene,
			() =>
				portal.reihe !== expectedReihe ||
				stimmtypForReihe(portal.reihe) !== expectedStimmtyp ||
				ebene !== expectedEbene
		);
	});

	const response = $derived(winnersLoader.response);
	const rows = $derived(response?.winners ?? []);
	const spalten = $derived(effectiveJahreFromRows(rows));
	const uebergaenge = $derived(computeUebergaengeFromRows(rows));
	const parteiAnzahlProJahr = $derived(parteiAnzahlProJahrFromRows(rows));
	const layout = $derived(
		computeSankeyLayout(spalten, uebergaenge, parteiAnzahlProJahr, { width: 640, height: 320 })
	);

	const status = $derived(winnersLoader.status);
	const isError = $derived(status === 'error');
	const isLoading = $derived(!isError && status !== 'loaded');
	const isEmpty = $derived(!isError && !isLoading && (rows.length === 0 || layout.bands.length === 0));
	const showInhalt = $derived(!isError && !isLoading && !isEmpty);

	/** Anzahl Gebiete: distinct `gebiet_slug` mit `jahr !== null` -- nicht mehr
	 * aus `columns[0]`, das Gebiete untererfasst, deren Datenhistorie erst in
	 * einer späteren Spalte beginnt (Review Triage Log #1/#3). */
	const totalGebiete = $derived(
		new Set(rows.filter((r) => r.jahr !== null).map((r) => r.gebiet_slug)).size
	);
	const anzahlSpalten = $derived(layout.columns.length);
	const jahresSpanneText = $derived(
		anzahlSpalten === 0
			? ''
			: anzahlSpalten === 1
				? `${layout.columns[0].jahr}`
				: `${layout.columns[0].jahr} bis ${layout.columns[anzahlSpalten - 1].jahr}`
	);
	/** Sprechendes aria-label (Ebene, Jahres-Spanne, Gebietszahl) statt eines
	 * generischen Textes -- einzige Stelle, `figure` verliert ihr eigenes
	 * (Review Triage Log #4/#19: dedupe figure+svg). */
	const figureLabel = $derived(
		`Sankey der Partei-Übergänge, Ebene ${EBENE_LABELS[ebene]}, ${jahresSpanneText}, ${totalGebiete} Gebiete`
	);

	const takeawayText = $derived(
		`Sankey über ${anzahlSpalten} Wahljahre (Ebene ${EBENE_LABELS[ebene]}): ${totalGebiete} Gebiete, Bandbreite = Anzahl Gebiete je Partei-Übergang.`
	);

	interface SankeyTableRow {
		readonly von: string;
		readonly nach: string;
		readonly jahr: number;
		readonly anzahl: number;
	}

	const tableRows = $derived<SankeyTableRow[]>(
		[...layout.bands]
			.map((b) => ({ von: b.von, nach: b.nach, jahr: b.nachJahr, anzahl: b.anzahl }))
			.sort((a, b) => a.jahr - b.jahr || b.anzahl - a.anzahl || a.von.localeCompare(b.von, 'de'))
	);

	const tableColumns: TableColumn<SankeyTableRow>[] = [
		{ key: 'von', label: 'Von', sortable: true, accessor: (r) => r.von },
		{ key: 'nach', label: 'Nach', sortable: true, accessor: (r) => r.nach },
		{ key: 'jahr', label: 'Jahr', sortable: true, accessor: (r) => r.jahr },
		{ key: 'anzahl', label: 'Gebiete', sortable: true, accessor: (r) => r.anzahl }
	];
</script>

<div class="flex flex-col gap-3" data-testid="sankey-wahljahre">
	<div class="flex flex-col gap-1.5">
		<span id="sankey-ebene-label" class="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
			Sankey-Ebene
		</span>
		<div
			role="radiogroup"
			aria-labelledby="sankey-ebene-label"
			data-testid="sankey-ebene"
			class="flex flex-wrap gap-1"
		>
			{#each EBENEN as value, i (value)}
				{@const checked = ebene === value}
				<button
					bind:this={ebeneButtons[i]}
					role="radio"
					type="button"
					data-testid={`sankey-ebene-${value}`}
					aria-checked={checked}
					tabindex={checked ? 0 : -1}
					onclick={() => (ebene = value)}
					onkeydown={(e) => onEbeneKeydown(e, i)}
					class="rounded border border-ink px-2.5 py-1 font-mono text-xs transition-colors"
					class:bg-ink={checked}
					class:text-bg={checked}
					class:bg-bg={!checked}
					class:text-ink={!checked}
					class:hover:bg-bg-muted={!checked}
				>
					{EBENE_LABELS[value]}
				</button>
			{/each}
		</div>
	</div>

	{#if isError}
		<p data-testid="sankey-wahljahre-error" role="alert" class="font-serif text-ink-muted">
			Wahl-Daten konnten nicht geladen werden.
		</p>
	{:else if isLoading}
		<p data-testid="sankey-wahljahre-loading" class="font-serif text-ink-muted">Lädt Wahljahre …</p>
	{:else if isEmpty}
		<p data-testid="sankey-wahljahre-empty" class="font-serif text-ink-muted">
			Für diese Auswahl liegen noch keine Übergänge zwischen Wahljahren vor.
		</p>
	{:else if showInhalt}
		<p
			data-testid="sankey-wahljahre-takeaway"
			class="max-w-prose font-serif text-lg leading-relaxed text-ink tabular-nums"
		>
			{takeawayText}
		</p>

		<figure data-testid="sankey-wahljahre-figure" class="space-y-3">
			<svg
				role="img"
				aria-label={figureLabel}
				data-testid="sankey-wahljahre-svg"
				viewBox={`${-LABEL_MARGIN} 0 ${layout.width + LABEL_MARGIN * 2} ${layout.height + 24}`}
				class="h-auto w-full"
			>
				{#each layout.bands as band (`${band.vonJahr}-${band.von}-${band.nachJahr}-${band.nach}`)}
					<path
						d={band.path}
						fill={parteiColor(band.von)}
						fill-opacity="0.5"
						data-testid="sankey-band"
						data-von={band.von}
						data-nach={band.nach}
						data-anzahl={band.anzahl}
					>
						<title>{`${band.von} → ${band.nach}: ${band.anzahl} Gebiete`}</title>
					</path>
				{/each}
				{#each layout.columns as column, columnIndex (column.jahr)}
					{#each column.nodes as node (`${node.jahr}-${node.partei}`)}
						<rect
							x={node.x}
							y={node.y}
							width={layout.nodeWidth}
							height={Math.max(node.height, 1)}
							fill={parteiColor(node.partei)}
							data-testid="sankey-node"
							data-jahr={node.jahr}
							data-partei={node.partei}
							data-anzahl={node.anzahl}
						>
							<title>{`${node.partei} (${node.jahr}): ${node.anzahl} Gebiete`}</title>
						</rect>
						{#if node.height >= LABEL_MIN_HEIGHT}
							<text
								x={columnIndex === 0 ? node.x - 6 : node.x + layout.nodeWidth + 6}
								y={node.y + node.height / 2}
								text-anchor={columnIndex === 0 ? 'end' : 'start'}
								dominant-baseline="middle"
								class="fill-ink font-mono text-[10px]"
								data-testid="sankey-node-label"
							>
								{node.partei}
							</text>
						{/if}
					{/each}
					<text
						x={column.x + layout.nodeWidth / 2}
						y={layout.height + 18}
						text-anchor="middle"
						class="fill-ink font-mono text-[11px] tabular-nums"
						data-testid="sankey-column-label"
					>
						{column.jahr}{column.istWiederholung ? ' ·W' : ''}
					</text>
				{/each}
			</svg>
		</figure>

		<DataTableAlternative columns={tableColumns} rows={tableRows} caption="Partei-Übergänge nach Jahr" />

		{#if response}
			<p data-testid="sankey-wahljahre-datenstand" class="font-mono text-xs text-ink-subtle tabular-nums">
				Datenstand: {response.source_name ?? 'unbekannte Quelle'}
				{#if response.license}
					· Lizenz {response.license}
				{/if}
			</p>
		{/if}
		<p data-testid="sankey-wahljahre-footnote-wiederholung" class="font-mono text-xs text-ink-subtle">
			{WIEDERHOLUNGS_SATZ}
		</p>
		{#if ebene === 'kiez' && showCoverageHinweis}
			<p data-testid="sankey-wahljahre-footnote-coverage" class="font-mono text-xs text-ink-subtle">
				{KIEZ_COVERAGE_HINWEIS}
			</p>
		{/if}
	{/if}
</div>
