<script lang="ts">
	/**
	 * Story 9, Kapitel „Stärkste und schwächste Gebiete" (CAP-7): SVG-Mini-Karte
	 * pro `FINDER_PARTIES`-Partei (7, Direktive Matze -- keine „Sonstige"-Mini,
	 * Boundary Sonstige-frei), gemeinsamer Kartenausschnitt (`geo-svg.ts`),
	 * gewähltes Jahr der Reihe (`currentJahr`, respektiert einen Nutzer-
	 * Override), Kiez-Ebene. Kein MapLibre (Boundary: 3 GL-Kontexte laufen
	 * schon) -- pure SVG-Pfade aus derselben Projektion.
	 *
	 * Review-Fund #10: EIN fehlgeschlagener/hängender Partei-Request darf
	 * nicht alle 7 Minis ausblenden -- jede Mini-Karte trägt ihren eigenen
	 * Lade-/Fehler-/Erfolgs-Zustand, der Kapitel-weite Error-Zustand gilt nur,
	 * wenn ALLE Parteien scheitern oder die Geometrie fehlt.
	 */
	import { resolve } from '$app/paths';
	import { getWahlPortalState, currentJahr } from '$lib/state/wahl-portal-context.svelte.js';
	import { stimmtypForReihe } from '$lib/utils/wahl-portal-url-state.js';
	import { FINDER_PARTIES } from '$lib/components/atlas/internal/kiez-finder-engine.js';
	import DataTableAlternative, {
		type TableColumn
	} from '$lib/components/atlas/data-table-alternative.svelte';
	import { KiezBezirkGeometryLoader } from './internal/winner-map-geometry.svelte.js';
	import { SmallMultiplesLoaders } from './internal/small-multiples-loaders.svelte.js';
	import type { LoadStatus } from './internal/winner-map-winners.svelte.js';
	import { computeBounds, buildProjection, pathD } from './internal/geo-svg.js';
	import { parteiAnteilSpanne } from './internal/winner-map-expressions.js';
	import {
		buildPartyMiniMap,
		buildSmallMultiplesTableRow,
		type KiezPathCell,
		type PartyMiniMap,
		type SmallMultiplesTableRow
	} from './internal/small-multiples-data.js';
	import {
		aggregationHinweisText,
		filterWinnersByJahr,
		formatAnteilPct
	} from './internal/winner-map-data.js';

	type Props = {
		/** Injizierbar für Tests; Default = globales `fetch`. */
		fetchFn?: typeof fetch;
	};
	let { fetchFn = fetch }: Props = $props();

	const KEIN_ANTEIL = -1;
	const MINI_SIZE = 220;

	const portal = getWahlPortalState();
	const stimmtyp = $derived(stimmtypForReihe(portal.reihe));
	const jahr = $derived(currentJahr(portal));

	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop.
	const geometryLoader = new KiezBezirkGeometryLoader(fetchFn);
	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop.
	const loaders = new SmallMultiplesLoaders(fetchFn);

	$effect(() => {
		void geometryLoader.load('kiez', () => false);
	});

	$effect(() => {
		const expectedReihe = portal.reihe;
		const expectedStimmtyp = stimmtyp;
		void loaders.loadAll(
			expectedReihe,
			expectedStimmtyp,
			() => portal.reihe !== expectedReihe || stimmtypForReihe(portal.reihe) !== expectedStimmtyp
		);
	});

	const geometry = $derived(geometryLoader.geometry);
	const projection = $derived.by(() =>
		geometry
			? buildProjection(computeBounds(geometry.fc), { width: MINI_SIZE, height: MINI_SIZE })
			: null
	);
	const geometryCells = $derived.by<KiezPathCell[]>(() => {
		if (!geometry || !projection) return [];
		return geometry.fc.features.map((f, i) => ({
			slug: geometry.slugs[i] ?? '',
			name: geometry.names[i] ?? '',
			path: pathD(f, projection)
		}));
	});

	interface MiniSlot {
		readonly partei: string;
		readonly status: LoadStatus;
		/** `null` solange die Partei lädt oder fehlgeschlagen ist. */
		readonly mini: PartyMiniMap | null;
	}

	// Review-Fund #3/#20: `spanne` ist REIHEN-weit (alle geladenen Jahre der
	// Partei), nicht nur die des angezeigten Jahres -- macht Karte und Minis
	// deckungsgleich UND Jahre in der Zeit-Animation der Karte vergleichbar.
	const miniSlots = $derived<MiniSlot[]>(
		FINDER_PARTIES.map((partei) => {
			const status = loaders.statusFor(partei);
			if (status !== 'loaded') return { partei, status, mini: null };
			const allRows = loaders.byPartei[partei].response?.winners ?? [];
			const rowsForJahr = jahr !== null ? filterWinnersByJahr(allRows, jahr) : [];
			const spanne = parteiAnteilSpanne(allRows);
			return {
				partei,
				status,
				mini: buildPartyMiniMap(partei, geometryCells, rowsForJahr, spanne)
			};
		})
	);
	const loadedMinis = $derived(
		miniSlots.map((s) => s.mini).filter((m): m is PartyMiniMap => m !== null)
	);
	const tableRows = $derived<SmallMultiplesTableRow[]>(
		loadedMinis.map(buildSmallMultiplesTableRow)
	);

	const isError = $derived(geometryLoader.status === 'error' || loaders.allFailed);
	const isLoading = $derived(!isError && geometryLoader.status !== 'loaded');
	const allPartiesEmpty = $derived(loaders.allLoaded && loadedMinis.every((m) => !m.hasData));
	const isEmpty = $derived(
		!isError && !isLoading && (geometryCells.length === 0 || jahr === null || allPartiesEmpty)
	);
	const showInhalt = $derived(!isError && !isLoading && !isEmpty);

	// Review-Fund #11: die Anzahl der TATSÄCHLICH gematchten Kieze (über alle
	// geladenen Parteien der Reihe), nicht die Gesamtzahl der Geometrie-Zellen
	// (die zählt auch Kieze ohne jeden Partei-Match mit).
	const matchedKiezCount = $derived(
		new Set(
			loadedMinis.flatMap((mini) => mini.cells.filter((c) => c.anteil !== null).map((c) => c.slug))
		).size
	);

	const takeawayText = $derived(
		jahr !== null
			? `Je Partei der stärkste und der schwächste Anteil unter ${matchedKiezCount} Berliner Kiezen, Wahl ${jahr}.`
			: ''
	);
	// Alle Minis teilen dieselbe Wahl-Reihe/Lizenz -- die erste geladene
	// Response reicht für die Datenstand-Zeile.
	const datenstand = $derived(
		FINDER_PARTIES.map((p) => loaders.byPartei[p].response).find((r) => r) ?? null
	);

	function anteilLabel(anteil: number | null): string {
		return anteil === null ? 'keine Daten' : formatAnteilPct(anteil);
	}

	function miniAriaLabel(partei: string, status: LoadStatus, mini: PartyMiniMap | null): string {
		if (status === 'error') return `Mini-Karte ${partei}: Daten konnten nicht geladen werden`;
		if (!mini) return `Mini-Karte ${partei}: lädt …`;
		if (!mini.hasData) return `Mini-Karte ${partei}: keine Daten für diese Wahl-Reihe`;
		return `Mini-Karte ${partei}: stärkster Kiez ${mini.staerkste?.name} mit ${anteilLabel(mini.staerkste?.anteil ?? null)}, schwächster Kiez ${mini.schwaechste?.name} mit ${anteilLabel(mini.schwaechste?.anteil ?? null)}`;
	}

	const tableColumns: TableColumn<SmallMultiplesTableRow>[] = [
		{ key: 'partei', label: 'Partei', sortable: true, accessor: (r) => r.partei },
		{
			key: 'staerkster',
			label: 'Stärkster Kiez',
			sortable: true,
			accessor: (r) => r.staerksterKiez
		},
		{
			key: 'staerksterAnteil',
			label: 'Anteil (stärkster)',
			sortable: true,
			accessor: (r) => r.staerksterAnteil ?? KEIN_ANTEIL,
			format: (v) => (Number(v) < 0 ? 'keine Daten' : formatAnteilPct(Number(v)))
		},
		{
			key: 'schwaechster',
			label: 'Schwächster Kiez',
			sortable: true,
			accessor: (r) => r.schwaechsterKiez
		},
		{
			key: 'schwaechsterAnteil',
			label: 'Anteil (schwächster)',
			sortable: true,
			accessor: (r) => r.schwaechsterAnteil ?? KEIN_ANTEIL,
			format: (v) => (Number(v) < 0 ? 'keine Daten' : formatAnteilPct(Number(v)))
		}
	];
</script>

{#if isError}
	<p data-testid="small-multiples-error" role="alert" class="font-serif text-ink-muted">
		Wahl-Daten konnten nicht geladen werden.
	</p>
{:else if isLoading}
	<p data-testid="small-multiples-loading" class="font-serif text-ink-muted">
		Lädt Partei-Anteile …
	</p>
{:else if isEmpty}
	<p data-testid="small-multiples-empty" class="font-serif text-ink-muted">
		Für diese Auswahl liegen noch keine Kiez-Daten vor.
	</p>
{:else if showInhalt}
	<div data-testid="small-multiples" class="flex flex-col gap-6">
		<p
			data-testid="small-multiples-takeaway"
			class="max-w-prose font-serif text-lg leading-relaxed text-ink tabular-nums"
		>
			{takeawayText}
		</p>

		<div class="grid grid-cols-2 gap-4 lg:grid-cols-4" data-testid="small-multiples-grid">
			{#each miniSlots as slot (slot.partei)}
				<figure class="flex flex-col gap-1.5" data-testid={`small-multiples-mini-${slot.partei}`}>
					{#if slot.status === 'error'}
						<div
							role="status"
							data-testid={`small-multiples-mini-${slot.partei}-error`}
							class="bg-bg-muted flex aspect-square w-full items-center justify-center border border-rule p-2 text-center font-mono text-xs text-ink-subtle"
						>
							Daten für {slot.partei} konnten nicht geladen werden.
						</div>
					{:else if !slot.mini}
						<div
							role="status"
							aria-label={`Mini-Karte ${slot.partei} lädt`}
							data-testid={`small-multiples-mini-${slot.partei}-loading`}
							class="bg-bg-muted aspect-square w-full animate-pulse border border-rule"
						></div>
					{:else}
						<svg
							viewBox={`0 0 ${projection?.width ?? 0} ${projection?.height ?? 0}`}
							role="img"
							aria-label={miniAriaLabel(slot.partei, slot.status, slot.mini)}
							class="w-full border border-rule bg-bg"
						>
							{#each slot.mini.cells as cell (cell.slug)}
								<path
									d={cell.path}
									fill={cell.farbe}
									fill-opacity={cell.opacity}
									stroke={cell.isStaerkste || cell.isSchwaechste
										? '#141414'
										: 'rgba(20,20,20,0.18)'}
									stroke-width={cell.isStaerkste || cell.isSchwaechste ? 1.5 : 0.5}
								/>
							{/each}
						</svg>
					{/if}
					<figcaption class="font-mono text-xs text-ink">
						<span class="font-semibold" style={`color: ${slot.mini?.farbe ?? ''};`}
							>{slot.partei}</span
						>
						{#if slot.mini?.hasData}
							<span class="block text-ink-subtle tabular-nums">
								Stärkster: {slot.mini.staerkste?.name} ({anteilLabel(
									slot.mini.staerkste?.anteil ?? null
								)})
							</span>
							<span class="block text-ink-subtle tabular-nums">
								Schwächster: {slot.mini.schwaechste?.name} ({anteilLabel(
									slot.mini.schwaechste?.anteil ?? null
								)})
							</span>
						{:else if slot.mini && !slot.mini.hasData}
							<span
								class="block text-ink-subtle"
								data-testid={`small-multiples-mini-${slot.partei}-keine-daten`}
							>
								Keine Daten für diese Wahl-Reihe.
							</span>
						{/if}
					</figcaption>
				</figure>
			{/each}
		</div>

		<DataTableAlternative
			columns={tableColumns}
			rows={tableRows}
			caption={`Stärkster/schwächster Kiez je Partei${jahr !== null ? `, ${jahr}` : ''}`}
		/>

		<p data-testid="small-multiples-methodik-hinweis" class="font-mono text-xs text-ink-subtle">
			{aggregationHinweisText('kiez')} Details:
			<a
				href={resolve('/methodik/wahldaten')}
				class="hover:text-accent-strong text-accent underline underline-offset-2"
			>
				/methodik/wahldaten
			</a>
		</p>

		{#if datenstand}
			<p
				data-testid="small-multiples-datenstand"
				class="font-mono text-xs text-ink-subtle tabular-nums"
			>
				Datenstand: {datenstand.source_name ?? 'unbekannte Quelle'}
				{#if datenstand.license}
					· Lizenz {datenstand.license}
				{/if}
			</p>
		{/if}
	</div>
{/if}
