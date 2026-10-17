<script lang="ts">
	/**
	 * Story 11 (Sankey-Rework, ersetzt Story 8): je Wahl der Reihe eine Spalte,
	 * Knoten = Parteien untereinander (Wiederholungs-Merge-Regel gilt), Bänder
	 * = gebündelte Partei→Partei-Übergänge (ein Band je Paar, Bandbreite =
	 * Anzahl Gebiete). Grafik seit #127 mit LayerChart `Sankey` in echten
	 * Pixeln (`internal/sankey-chart.svelte`, Eingabe aus
	 * `internal/sankey-layout.ts`), Daten-Konstruktion rein in
	 * `internal/sankey-graph.ts`, Tooltip/Highlight in
	 * `internal/sankey-tooltip.svelte`/`internal/sankey-interaction.ts`, auf
	 * schmalen Bildschirmen zusätzlich die Übergangs-Liste.
	 *
	 * Matze-Direktive 20.09., REVIDIERT 12:07: eine erste Gebiets-Spalte
	 * (ein Band je Gebiet) machte die Kiez-Ansicht im Live-Test unlesbar
	 * (143 Einzel-Bänder, „jetzt ist es nicht benutzbar"). Das gebündelte
	 * Partei→Partei-Modell (Story 8) bleibt, NUR das Rendering wechselt auf
	 * `d3-sankey` mit Tooltips/Hover-Highlight. Der Erklär-Satz unten und die
	 * Knoten-Tooltips beantworten „Wo sind die anderen Parteien?" weiterhin
	 * direkt in der Grafik (Sieger-Semantik).
	 *
	 * Datenquelle: dieselbe Bulk-Winners-Response wie Karte/Wechsel-Kapitel
	 * (`KiezBezirkWinnersLoader`, Modul-Cache) -- keine neue Server-API, kein
	 * Geometrie-Load (REVISION 12:07: war nur für die Gebiets-Spalte nötig).
	 */
	import { getWahlPortalState } from '$lib/state/wahl-portal-context.svelte.js';
	import { stimmtypForReihe } from '$lib/utils/wahl-portal-url-state.js';
	import { m } from '$lib/paraglide/messages.js';
	import {
		wahlEbeneLabel,
		sourceDisplayLabel,
		licenseDisplayLabel
	} from '$lib/data/wahl-labels.js';
	import DataTableAlternative, {
		type TableColumn
	} from '$lib/components/atlas/data-table-alternative.svelte';
	import { KiezBezirkWinnersLoader } from './internal/winner-map-winners.svelte.js';
	import { nextRadioIndex } from './internal/radiogroup-keyboard.js';
	import { buildSankeyGraph } from './internal/sankey-graph.js';
	import { buildUebergangsGruppen } from './internal/sankey-liste.js';
	import SankeyChart from './internal/sankey-chart.svelte';
	import SankeyUebergaengeListe from './internal/sankey-uebergaenge-liste.svelte';
	import { SankeyInteractionState } from './internal/sankey-interaction-state.svelte.js';
	import { kiezCoverageHinweisText } from './internal/trends-map-data.js';

	type SankeyEbene = 'kiez' | 'bezirk';
	const EBENEN: readonly SankeyEbene[] = ['kiez', 'bezirk'];

	type Props = {
		/** Injizierbar für Tests; Default = globales `fetch` (Muster wechsel-kapitel.svelte). */
		fetchFn?: typeof fetch;
		/** Story 12: der Sankey rendert seit dem Umzug ins eigene „Übergänge"-
		 * Kapitel immer eigenständig, `+page.svelte` übergibt dieses Prop nicht
		 * mehr explizit -- Default `true` greift dort immer. Bleibt als reine
		 * DI-Naht bestehen, falls eine künftige Einbettung die Fußnote wieder
		 * unterdrücken muss. */
		showCoverageHinweis?: boolean;
	};
	let { fetchFn = fetch, showCoverageHinweis = true }: Props = $props();

	/** Zitat aus `docs/wahldaten-methodik.md` (Kernsatz, reihe-generisch). Als
	 * `$derived` statt Modul-Konstante: Auswertung beim Aufruf (i18n Block B). */
	const wiederholungsSatz = $derived(m.wahl_portal_sankey_wiederholungs_satz());
	/** Sieger-Semantik-Erklärung (Matze-Direktive 20.09.): beantwortet „Wo sind
	 * die anderen Parteien?" direkt in der Grafik, siehe Knoten-Tooltip für die
	 * konkreten Zahlen je Partei/Jahr. */
	const erklaerungsSatz = $derived(m.wahl_portal_sankey_erklaerung());

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
	const graph = $derived(buildSankeyGraph(rows));
	const uebergangsGruppen = $derived(buildUebergangsGruppen(graph));

	const winnersStatus = $derived(winnersLoader.status);
	const isError = $derived(winnersStatus === 'error');
	const isLoading = $derived(!isError && winnersStatus !== 'loaded');
	const isEmpty = $derived(
		!isError && !isLoading && (rows.length === 0 || graph.links.length === 0)
	);
	const showInhalt = $derived(!isError && !isLoading && !isEmpty);

	const totalGebiete = $derived(graph.totalGebiete);
	const anzahlSpalten = $derived(graph.spalten.length);
	const jahresSpanneText = $derived(
		anzahlSpalten === 0
			? ''
			: anzahlSpalten === 1
				? `${graph.spalten[0].jahr}`
				: m.wahl_portal_sankey_jahresspanne({
						von: graph.spalten[0].jahr,
						bis: graph.spalten[anzahlSpalten - 1].jahr
					})
	);
	/** Sprechendes aria-label (Ebene, Jahres-Spanne, Gebietszahl) statt eines
	 * generischen Textes -- einzige Stelle, `figure` verliert ihr eigenes
	 * (Review Triage Log #4/#19: dedupe figure+svg). */
	const figureLabel = $derived(
		m.wahl_portal_sankey_figure_label({
			ebene: wahlEbeneLabel(ebene),
			spanne: jahresSpanneText,
			total: totalGebiete
		})
	);

	const takeawayText = $derived(
		m.wahl_portal_sankey_takeaway({
			anzahl: anzahlSpalten,
			ebene: wahlEbeneLabel(ebene),
			total: totalGebiete
		})
	);

	interface SankeyTableRow {
		readonly von: string;
		readonly nach: string;
		readonly jahr: number;
		readonly anzahl: number;
	}

	const tableRows = $derived<SankeyTableRow[]>(
		graph.links
			.map((l) => ({ von: l.von, nach: l.nach, jahr: l.jahr, anzahl: l.value }))
			.sort((a, b) => a.jahr - b.jahr || b.anzahl - a.anzahl || a.von.localeCompare(b.von, 'de'))
	);

	const tableColumns: TableColumn<SankeyTableRow>[] = [
		{ key: 'von', label: m.wahl_portal_spalte_von(), sortable: true, accessor: (r) => r.von },
		{ key: 'nach', label: m.wahl_portal_spalte_nach(), sortable: true, accessor: (r) => r.nach },
		{ key: 'jahr', label: m.wahl_portal_spalte_jahr(), sortable: true, accessor: (r) => r.jahr },
		{
			key: 'anzahl',
			label: m.wahl_portal_spalte_gebiete(),
			sortable: true,
			accessor: (r) => r.anzahl
		}
	];

	const interaction = new SankeyInteractionState();

	// Interaktions-Reset bei Graph-Wechsel (Review Triage Log #6): ohne diesen
	// Reset überlebt der Hover-/Dimm-Zustand einen Ebenen-/Reihen-Wechsel --
	// neue Bänder starten gedimmt bzw. der Tooltip zeigt noch die alten Zahlen.
	$effect(() => {
		void graph;
		interaction.reset();
	});
</script>

<div class="flex flex-col gap-3" data-testid="sankey-wahljahre">
	<div class="flex flex-col gap-1.5">
		<span id="sankey-ebene-label" class="text-dense-meta text-ink-muted">
			{m.wahl_portal_sankey_ebene_label()}
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
					class="rounded border border-ink px-2.5 py-1 text-xs transition-colors"
					class:bg-ink={checked}
					class:text-bg={checked}
					class:bg-bg={!checked}
					class:text-ink={!checked}
					class:hover:bg-bg-muted={!checked}
				>
					{wahlEbeneLabel(value)}
				</button>
			{/each}
		</div>
	</div>

	{#if isError}
		<p data-testid="sankey-wahljahre-error" role="alert" class="text-ink-muted">
			{m.wahl_portal_wahldaten_error()}
		</p>
	{:else if isLoading}
		<p data-testid="sankey-wahljahre-loading" class="text-ink-muted">
			{m.wahl_portal_sankey_loading()}
		</p>
	{:else if isEmpty}
		<p data-testid="sankey-wahljahre-empty" class="text-ink-muted">
			{m.wahl_portal_sankey_empty()}
		</p>
	{:else if showInhalt}
		<p
			data-testid="sankey-wahljahre-takeaway"
			class="max-w-prose text-lg leading-body text-ink tabular-nums"
		>
			{takeawayText}
		</p>
		<p data-testid="sankey-wahljahre-erklaerung" class="max-w-prose text-xs text-ink-subtle">
			{erklaerungsSatz}
		</p>

		<figure data-testid="sankey-wahljahre-figure" class="space-y-3">
			<SankeyChart {graph} {interaction} {figureLabel} />
		</figure>

		<div class="sm:hidden">
			<SankeyUebergaengeListe
				gruppen={uebergangsGruppen}
				selectedKey={interaction.selectedLinkKey}
				onToggle={(key) => interaction.toggleSelectedLink(key)}
			/>
		</div>

		<DataTableAlternative
			columns={tableColumns}
			rows={tableRows}
			caption={m.wahl_portal_sankey_table_caption()}
			toggleLabel={m.wahl_portal_data_table_toggle()}
			closeLabel={m.wahl_portal_data_table_close()}
		/>

		{#if response}
			<p data-testid="sankey-wahljahre-datenstand" class="text-xs text-ink-subtle tabular-nums">
				{m.wahl_portal_datenstand_label({ source: sourceDisplayLabel(response.source_name) })}
				{#if response.license}
					<span class="block"
						>{m.wahl_portal_lizenz_suffix({ license: licenseDisplayLabel(response.license) })}</span
					>
				{/if}
			</p>
		{/if}
		<p data-testid="sankey-wahljahre-footnote-wiederholung" class="text-xs text-ink-subtle">
			{wiederholungsSatz}
		</p>
		{#if ebene === 'kiez' && showCoverageHinweis}
			<p data-testid="sankey-wahljahre-footnote-coverage" class="text-xs text-ink-subtle">
				{kiezCoverageHinweisText()}
			</p>
		{/if}
	{/if}
</div>
