<script lang="ts">
	/**
	 * Story 7 (Zeit-Animation mit Wechsel-Markierung), Kapitel „Wechsel"
	 * (CAP-4): eigene Kiez-Karte (Färbung nach Wechsel-Häufigkeit der
	 * stärksten Kraft: 0 neutral / 1 / 2+) + kompakte Liste (Gebiet, Jahr,
	 * von -> nach). Von/Nach kommen client-seitig aus der bereits
	 * existierenden Bulk-Winners-Response (`/api/wahl/winners?ebene=kiez`),
	 * keine neue Server-API (Boundary).
	 *
	 * Bewusst immer Kiez-Ebene (unabhängig vom Ebenen-Toggle der Winner-Map):
	 * Wechsel brauchen eine über alle Jahre stabile Geometrie, die nur
	 * Kiez/Bezirk haben -- Task-Vorgabe ist Kiez.
	 */
	import { getWahlPortalState } from '$lib/state/wahl-portal-context.svelte.js';
	import { stimmtypForReihe } from '$lib/utils/wahl-portal-url-state.js';
	import DataTableAlternative, {
		type TableColumn
	} from '$lib/components/atlas/data-table-alternative.svelte';
	import { KiezBezirkWinnersLoader } from './internal/winner-map-winners.svelte.js';
	import { KiezBezirkGeometryLoader } from './internal/winner-map-geometry.svelte.js';
	import { WechselMapController } from './internal/wechsel-kapitel-maplibre.svelte.js';
	import {
		computeWechselFromRows,
		sortWechselEntriesForDisplay,
		wechselCountByGebiet
	} from './internal/wechsel-data.js';
	import {
		buildNameBySlugMap,
		buildWechselFeatureCollection,
		buildWechselTableRows,
		WECHSEL_FARBE_STUFE_1,
		WECHSEL_FARBE_STUFE_2_PLUS,
		WECHSEL_FILL_OPACITY,
		WECHSEL_NEUTRAL_FARBE,
		type WechselTableRow
	} from './internal/wechsel-map-data.js';

	type Props = {
		/** Injizierbar für Tests; Default = globales `fetch`. */
		fetchFn?: typeof fetch;
	};
	let { fetchFn = fetch }: Props = $props();

	const FIGURE_LABEL = 'Karte der Kieze nach Anzahl der Wechsel der stärksten Kraft';
	const DISCLOSURE_LIMIT = 20;

	const portal = getWahlPortalState();
	const stimmtyp = $derived(stimmtypForReihe(portal.reihe));

	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop,
	// über die Komponenten-Lebenszeit stabil (Muster winner-map.svelte).
	const winnersLoader = new KiezBezirkWinnersLoader(fetchFn);
	// svelte-ignore state_referenced_locally
	const geometryLoader = new KiezBezirkGeometryLoader(fetchFn);

	$effect(() => {
		const expectedReihe = portal.reihe;
		const expectedStimmtyp = stimmtyp;
		void winnersLoader.load(
			expectedReihe,
			expectedStimmtyp,
			'kiez',
			() => portal.reihe !== expectedReihe || stimmtypForReihe(portal.reihe) !== expectedStimmtyp
		);
	});

	$effect(() => {
		void geometryLoader.load('kiez', () => false);
	});

	const rows = $derived(winnersLoader.response?.winners ?? []);
	const wechselEntries = $derived(computeWechselFromRows(rows));
	const countsBySlug = $derived(wechselCountByGebiet(wechselEntries));

	const geometry = $derived(geometryLoader.geometry);
	const nameBySlug = $derived(
		buildNameBySlugMap(geometry?.slugs ?? [], geometry?.names ?? [])
	);
	const entriesWithName = $derived(
		wechselEntries.map((e) => ({ ...e, gebietName: nameBySlug.get(e.gebietSlug) ?? e.gebietSlug }))
	);
	const sortedEntries = $derived(sortWechselEntriesForDisplay(entriesWithName, countsBySlug));

	const wechselFc = $derived.by(() => {
		if (!geometry) return null;
		return buildWechselFeatureCollection(geometry.fc, geometry.slugs, geometry.names, countsBySlug);
	});
	const tableRows = $derived<WechselTableRow[]>(wechselFc ? buildWechselTableRows(wechselFc) : []);
	const totalGebiete = $derived(geometry?.fc.features.length ?? 0);
	const gebieteMitWechsel = $derived(new Set(wechselEntries.map((e) => e.gebietSlug)).size);

	// Geometrie-Fehler darf nur dann zum Fehlerhinweis führen, wenn es
	// überhaupt Winners-Daten gibt: Boundary "DB-los/leer" zeigt weiter den
	// Leer-Hinweis, auch wenn die (dafür unnötige) Geometrie fehlschlägt.
	const winnersStatus = $derived(winnersLoader.status);
	const geometryStatus = $derived(geometryLoader.status);
	const isError = $derived(
		winnersStatus === 'error' || (rows.length > 0 && geometryStatus === 'error')
	);
	const isLoading = $derived(
		!isError && (winnersStatus !== 'loaded' || (rows.length > 0 && geometryStatus !== 'loaded'))
	);
	const isEmpty = $derived(!isError && !isLoading && rows.length === 0);
	const showInhalt = $derived(!isError && !isLoading && !isEmpty);

	const takeawayText = $derived(
		wechselEntries.length === 0
			? 'Für diese Auswahl gab es keinen Wechsel der stärksten Kraft.'
			: `${gebieteMitWechsel} von ${totalGebiete} Kiezen ${gebieteMitWechsel === 1 ? 'wechselte' : 'wechselten'} mindestens einmal die stärkste Kraft.`
	);

	let showAll = $state(false);
	const visibleEntries = $derived(showAll ? sortedEntries : sortedEntries.slice(0, DISCLOSURE_LIMIT));

	const tableColumns: TableColumn<WechselTableRow>[] = [
		{ key: 'gebiet', label: 'Gebiet', sortable: true, accessor: (r) => r.gebiet },
		{ key: 'anzahl', label: 'Wechsel', sortable: true, accessor: (r) => r.anzahl }
	];

	const mapCtl = new WechselMapController({ getFc: () => wechselFc });
	$effect(() => {
		mapCtl.ensureMap(wechselFc);
	});
	$effect(() => {
		return () => mapCtl.destroy();
	});
</script>

{#if isError}
	<p data-testid="wechsel-kapitel-error" role="alert" class="font-serif text-ink-muted">
		Wahl-Daten konnten nicht geladen werden.
	</p>
{:else if isLoading}
	<p data-testid="wechsel-kapitel-loading" class="font-serif text-ink-muted">Lädt Wechsel-Daten …</p>
{:else if isEmpty}
	<p data-testid="wechsel-kapitel-empty" class="font-serif text-ink-muted">
		Für diese Auswahl liegen noch keine Wahl-Ergebnisse vor.
	</p>
{:else if showInhalt}
	<p data-testid="wechsel-kapitel-takeaway" class="max-w-prose font-serif text-lg leading-relaxed text-ink">
		{takeawayText}
	</p>

	<figure aria-label={FIGURE_LABEL} data-testid="wechsel-kapitel-figure" class="space-y-3">
		<div class="relative h-[360px] w-full overflow-hidden rounded border border-rule">
			<div
				bind:this={mapCtl.container}
				role="img"
				aria-label={FIGURE_LABEL}
				data-testid="wechsel-kapitel-canvas"
				class="h-full w-full"
			></div>
		</div>
	</figure>

	<ul data-testid="wechsel-kapitel-legende" class="flex flex-wrap gap-3 border border-rule bg-bg p-3 font-mono text-xs text-ink">
		<li class="flex items-center gap-1.5">
			<span
				aria-hidden="true"
				class="inline-block h-3.5 w-3.5 rounded-sm border border-rule-strong"
				style={`background-color: ${WECHSEL_NEUTRAL_FARBE}; opacity: ${WECHSEL_FILL_OPACITY};`}
			></span>
			Kein Wechsel
		</li>
		<li class="flex items-center gap-1.5">
			<span
				aria-hidden="true"
				class="inline-block h-3.5 w-3.5 rounded-sm border border-rule-strong"
				style={`background-color: ${WECHSEL_FARBE_STUFE_1}; opacity: ${WECHSEL_FILL_OPACITY};`}
			></span>
			1 Wechsel
		</li>
		<li class="flex items-center gap-1.5">
			<span
				aria-hidden="true"
				class="inline-block h-3.5 w-3.5 rounded-sm border border-rule-strong"
				style={`background-color: ${WECHSEL_FARBE_STUFE_2_PLUS}; opacity: ${WECHSEL_FILL_OPACITY};`}
			></span>
			2 oder mehr Wechsel
		</li>
	</ul>

	<DataTableAlternative
		columns={tableColumns}
		rows={tableRows}
		caption="Kieze nach Anzahl der Wechsel der stärksten Kraft"
	/>

	{#if sortedEntries.length === 0}
		<p data-testid="wechsel-kapitel-liste-empty" class="font-mono text-xs text-ink-subtle">
			Kein Kiez wechselte die stärkste Kraft.
		</p>
	{:else}
		<ul
			id="wechsel-kapitel-liste"
			data-testid="wechsel-kapitel-liste"
			class="flex flex-col gap-1.5 font-mono text-xs text-ink"
		>
			{#each visibleEntries as entry (`${entry.gebietSlug}-${entry.jahr}`)}
				<li data-testid="wechsel-kapitel-eintrag">
					<span class="font-medium">{entry.gebietName}</span>, {entry.jahr}:
					<span data-testid="wechsel-kapitel-von">{entry.von}</span>
					→
					<span data-testid="wechsel-kapitel-nach">{entry.nach}</span>
				</li>
			{/each}
		</ul>
		{#if sortedEntries.length > DISCLOSURE_LIMIT}
			<button
				type="button"
				data-testid="wechsel-kapitel-mehr"
				aria-expanded={showAll}
				aria-controls="wechsel-kapitel-liste"
				onclick={() => (showAll = !showAll)}
				class="self-start rounded border border-ink px-2.5 py-1 font-mono text-xs text-ink transition-colors hover:bg-bg-muted"
			>
				{showAll ? 'Weniger anzeigen' : `Alle ${sortedEntries.length} Wechsel anzeigen`}
			</button>
		{/if}
	{/if}
{/if}
