<script lang="ts">
	/**
	 * Story 11 (Sankey-Rework, ersetzt Story 8): je Wahl der Reihe eine Spalte,
	 * Knoten = Parteien untereinander (Wiederholungs-Merge-Regel gilt), Bänder
	 * = gebündelte Partei→Partei-Übergänge (ein Band je Paar, Bandbreite =
	 * Anzahl Gebiete). Layout mit `d3-sankey` (lazy, eigener Chunk,
	 * `internal/sankey-d3.svelte.ts`), Daten-Konstruktion rein in
	 * `internal/sankey-graph.ts`, Tooltip/Highlight in
	 * `internal/sankey-tooltip.svelte`/`internal/sankey-interaction.ts`.
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
	import { wahlEbeneLabel, sourceDisplayLabel, licenseDisplayLabel } from '$lib/data/wahl-labels.js';
	import { parteiColor } from '$lib/data/partei-farben.js';
	import DataTableAlternative, {
		type TableColumn
	} from '$lib/components/atlas/data-table-alternative.svelte';
	import { KiezBezirkWinnersLoader } from './internal/winner-map-winners.svelte.js';
	import { nextRadioIndex } from './internal/radiogroup-keyboard.js';
	import { buildSankeyGraph } from './internal/sankey-graph.js';
	import { parteiDisplayName } from './internal/winner-map-data.js';
	import {
		SankeyD3Controller,
		computeSankeyDimensions,
		type SankeyD3ControllerOptions
	} from './internal/sankey-d3.svelte.js';
	import SankeyTooltip from './internal/sankey-tooltip.svelte';
	import { columnXByJahrFromNodes, isLinkDimmed, linkKey } from './internal/sankey-interaction.js';
	import { SankeyInteractionState } from './internal/sankey-interaction-state.svelte.js';
	import { kiezCoverageHinweisText } from './internal/trends-map-data.js';

	type SankeyEbene = 'kiez' | 'bezirk';
	const EBENEN: readonly SankeyEbene[] = ['kiez', 'bezirk'];

	/** Seitlicher Rand für die Partei-Kurzname-Labels rechts jeder Spalte. */
	const LABEL_MARGIN = 90;
	/** Ab dieser Knoten-Höhe (px) passt ein Label ohne Überlapp zum Nachbarn. */
	const LABEL_MIN_HEIGHT = 10;

	type Props = {
		/** Injizierbar für Tests; Default = globales `fetch` (Muster wechsel-kapitel.svelte). */
		fetchFn?: typeof fetch;
		/** Story 12: der Sankey rendert seit dem Umzug ins eigene „Übergänge"-
		 * Kapitel immer eigenständig, `+page.svelte` übergibt dieses Prop nicht
		 * mehr explizit -- Default `true` greift dort immer. Bleibt als reine
		 * DI-Naht bestehen, falls eine künftige Einbettung die Fußnote wieder
		 * unterdrücken muss. */
		showCoverageHinweis?: boolean;
		/** Injizierbar für Tests (Test-Naht, Muster `winner-map-maplibre.svelte.ts`
		 * `mapFactory`) -- Default = echter `import('d3-sankey')`. */
		sankeyFactory?: SankeyD3ControllerOptions['d3SankeyFactory'];
	};
	let { fetchFn = fetch, showCoverageHinweis = true, sankeyFactory }: Props = $props();

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
	// svelte-ignore state_referenced_locally -- sankeyFactory ist ein Test-/DI-Prop.
	const d3Controller = new SankeyD3Controller({ d3SankeyFactory: sankeyFactory });

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
	const dimensions = $derived(computeSankeyDimensions(graph.spalten.length));

	$effect(() => {
		void d3Controller.compute(graph, dimensions);
	});
	// Layout an seinen Graph gebunden (Review Triage Log #1): bei einem
	// Cache-Treffer setzt der Winners-Loader `response` synchron, `graph`
	// ändert sich also sofort -- ohne diesen Abgleich würde kurzzeitig das
	// ALTE Layout gegen den NEUEN Graph rendern (Jahres-Labels auf x=0,
	// Tooltip mischt Ebenen). `isLoading` unten greift dadurch auch beim
	// Cache-Treffer, nicht nur beim Erstlauf.
	const layout = $derived(d3Controller.layoutFor === graph ? d3Controller.layout : null);

	const parteiNodes = $derived(layout?.nodes ?? []);
	const parteiBaende = $derived(layout?.links ?? []);
	const columnXByJahr = $derived(columnXByJahrFromNodes(parteiNodes));

	const winnersStatus = $derived(winnersLoader.status);
	const isError = $derived(winnersStatus === 'error' || d3Controller.error);
	const isLoading = $derived(
		!isError && (winnersStatus !== 'loaded' || (graph.links.length > 0 && !layout))
	);
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
		interaction.onLinkLeave();
		interaction.onNodeLeave();
	});
</script>

<div class="flex flex-col gap-3" data-testid="sankey-wahljahre">
	<div class="flex flex-col gap-1.5">
		<span
			id="sankey-ebene-label"
			class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
		>
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
					class="rounded border border-ink px-2.5 py-1 font-mono text-xs transition-colors"
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
		<p data-testid="sankey-wahljahre-error" role="alert" class="font-serif text-ink-muted">
			{m.wahl_portal_wahldaten_error()}
		</p>
	{:else if isLoading}
		<p data-testid="sankey-wahljahre-loading" class="font-serif text-ink-muted">
			{m.wahl_portal_sankey_loading()}
		</p>
	{:else if isEmpty}
		<p data-testid="sankey-wahljahre-empty" class="font-serif text-ink-muted">
			{m.wahl_portal_sankey_empty()}
		</p>
	{:else if showInhalt && layout}
		<p
			data-testid="sankey-wahljahre-takeaway"
			class="max-w-prose font-serif text-lg leading-relaxed text-ink tabular-nums"
		>
			{takeawayText}
		</p>
		<p
			data-testid="sankey-wahljahre-erklaerung"
			class="max-w-prose font-mono text-xs text-ink-subtle"
		>
			{erklaerungsSatz}
		</p>

		<figure data-testid="sankey-wahljahre-figure" class="space-y-3">
			<div class="relative" bind:this={interaction.container}>
				<svg
					role="group"
					aria-label={figureLabel}
					data-testid="sankey-wahljahre-svg"
					viewBox={`${-LABEL_MARGIN} 0 ${layout.width + LABEL_MARGIN * 2} ${layout.height + 24}`}
					class="h-auto w-full"
				>
					{#each parteiBaende as band (linkKey(band))}
						{@const isHovered = linkKey(band) === interaction.hoveredLinkKey}
						{@const dimmed = isLinkDimmed(band, interaction.hoveredLinkKey)}
						<!-- Kein <title>-Kind: der native Browser-Tooltip legt sich sonst über
						     unseren eigenen sankey-tooltip (Live-Fund Matze, Screenshot). Die
						     Information tragen aria-label + der eigene Tooltip. -->
						<!-- Stroke statt Fill: `sankeyLinkHorizontal` liefert die MITTELLINIE
						     des Bandes, die Bandbreite kommt über stroke-width (d3-Konvention).
						     Ein gefüllter offener Pfad kollabiert bei horizontalen Übergängen
						     (gleiche Quell-/Ziel-Höhe) zur Haarlinie (Live-Fund Matze, BTW
						     2013→2017). -->
						<!-- role="img" statt "button": es gibt keine Aktion, nur Info (Review
						     Triage Log #3, WCAG 4.1.2 -- "button" ohne Enter/Space-Aktivierung
						     war irreführend). Escape schließt den Tooltip ohne Fokus-Verlust
						     (WCAG 1.4.13); pointercancel zusätzlich zu pointerleave fängt
						     abgebrochene Touch-/Pen-Gesten. tabindex + Hover-/Fokus-Handler auf
						     einem nicht-interaktiven `role="img"` sind hier bewusst: die Grafik
						     bietet Tooltip-bei-Fokus, keine Aktivierung -- der A11y-Linter kennt
						     dieses Muster nicht (svelte-ignore). -->
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<path
							d={band.path}
							fill="none"
							stroke={parteiColor(band.von)}
							stroke-width={Math.max(band.width, 1)}
							stroke-opacity={isHovered ? 0.85 : dimmed ? 0.15 : 0.5}
							class="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus motion-safe:transition-opacity motion-safe:duration-150"
							tabindex="0"
							role="img"
							aria-label={(band.value === 1
								? m.wahl_portal_sankey_band_aria_label_singular
								: m.wahl_portal_sankey_band_aria_label_plural)({
								von: parteiDisplayName(band.von),
								nach: parteiDisplayName(band.nach),
								value: band.value
							})}
							data-testid="sankey-band"
							data-von={band.von}
							data-nach={band.nach}
							data-anzahl={band.value}
							onpointermove={(e) => interaction.onLinkPointerMove(e, band)}
							onpointerleave={() => interaction.onLinkLeave()}
							onpointercancel={() => interaction.onLinkLeave()}
							onfocus={(e) => interaction.onLinkFocus(e, band)}
							onblur={() => interaction.onLinkLeave()}
							onkeydown={(e) => {
								if (e.key === 'Escape') interaction.onLinkLeave();
							}}
						/>
					{/each}
					{#each parteiNodes as node (node.id)}
						<!-- Kein <title>-Kind: der native Browser-Tooltip legt sich sonst über
						     unseren eigenen sankey-tooltip (Live-Fund Matze, Screenshot). Die
						     Information tragen aria-label + der eigene Tooltip. -->
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<rect
							x={node.x0}
							y={node.y0}
							width={node.x1 - node.x0}
							height={Math.max(node.y1 - node.y0, 1)}
							fill={node.farbe}
							tabindex="0"
							role="img"
							class="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
							aria-label={(node.anzahl === 1
								? m.wahl_portal_sankey_node_aria_label_singular
								: m.wahl_portal_sankey_node_aria_label_plural)({
								partei: parteiDisplayName(node.partei),
								jahr: node.jahr,
								anzahl: node.anzahl
							})}
							data-testid="sankey-node"
							data-jahr={node.jahr}
							data-partei={node.partei}
							data-anzahl={node.anzahl}
							onpointermove={(e) =>
								interaction.onNodePointerMove(e, node, graph.gebieteMitDatenByJahr)}
							onpointerleave={() => interaction.onNodeLeave()}
							onpointercancel={() => interaction.onNodeLeave()}
							onfocus={(e) => interaction.onNodeFocus(e, node, graph.gebieteMitDatenByJahr)}
							onblur={() => interaction.onNodeLeave()}
							onkeydown={(e) => {
								if (e.key === 'Escape') interaction.onNodeLeave();
							}}
						/>
						{#if node.y1 - node.y0 >= LABEL_MIN_HEIGHT}
							<!-- Erste Spalte: Label LINKS vom Knoten (Review Triage Log #4) --
							     nutzt den reservierten linken viewBox-Rand (-LABEL_MARGIN) und
							     liegt nicht auf den nach rechts abgehenden Bändern. Übrige
							     Spalten: Label rechts wie bisher. -->
							<text
								x={node.column === 0 ? node.x0 - 6 : node.x1 + 6}
								y={(node.y0 + node.y1) / 2}
								text-anchor={node.column === 0 ? 'end' : 'start'}
								dominant-baseline="middle"
								class="fill-ink font-mono text-[10px]"
								data-testid="sankey-node-label"
							>
								{parteiDisplayName(node.label)}
							</text>
						{/if}
					{/each}
					{#each graph.spalten as spalte (spalte.jahr)}
						<text
							x={columnXByJahr.get(spalte.jahr) ?? 0}
							y={layout.height + 18}
							text-anchor="middle"
							class="fill-ink font-mono text-[11px] tabular-nums"
							data-testid="sankey-column-label"
						>
							{spalte.jahr}{spalte.istWiederholung ? ` ${m.wahl_portal_wiederholung_kuerzel()}` : ''}
						</text>
					{/each}
				</svg>
				<SankeyTooltip
					visible={interaction.tooltipVisible}
					pos={interaction.tooltipPos}
					content={interaction.tooltipContent}
				/>
			</div>
		</figure>

		<DataTableAlternative
			columns={tableColumns}
			rows={tableRows}
			caption={m.wahl_portal_sankey_table_caption()}
			toggleLabel={m.wahl_portal_data_table_toggle()}
			closeLabel={m.wahl_portal_data_table_close()}
		/>

		{#if response}
			<p
				data-testid="sankey-wahljahre-datenstand"
				class="font-mono text-xs text-ink-subtle tabular-nums"
			>
				{m.wahl_portal_datenstand_label({ source: sourceDisplayLabel(response.source_name) })}
				{#if response.license}
					· {m.wahl_portal_lizenz_suffix({ license: licenseDisplayLabel(response.license) })}
				{/if}
			</p>
		{/if}
		<p
			data-testid="sankey-wahljahre-footnote-wiederholung"
			class="font-mono text-xs text-ink-subtle"
		>
			{wiederholungsSatz}
		</p>
		{#if ebene === 'kiez' && showCoverageHinweis}
			<p data-testid="sankey-wahljahre-footnote-coverage" class="font-mono text-xs text-ink-subtle">
				{kiezCoverageHinweisText()}
			</p>
		{/if}
	{/if}
</div>
