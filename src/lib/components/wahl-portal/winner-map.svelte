<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		getWahlPortalState,
		currentJahr,
		jahreForReihe,
		setJahr,
		setEbene
	} from '$lib/state/wahl-portal-context.svelte.js';
	import { stimmtypForReihe, EBENE_LABELS } from '$lib/utils/wahl-portal-url-state.js';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import { wahlSlugFromTypJahr, geoSlugForWahl } from '$lib/data/wahl-geo-mapping.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import AddressSearch from '$lib/components/atlas/address-search.svelte';
	import DataTableAlternative, {
		type TableColumn
	} from '$lib/components/atlas/data-table-alternative.svelte';
	import WinnerMapLegende from './winner-map-legende.svelte';
	import WinnerMapTooltip from './winner-map-tooltip.svelte';
	import ErgebnisPanel from './ergebnis-panel.svelte';
	import ZeitAnimation from './zeit-animation.svelte';
	import { WinnerMapController } from './internal/winner-map-maplibre.svelte.js';
	import { StimmbezirkLoader } from './internal/winner-map-stimmbezirk.svelte.js';
	import { AddressHighlight } from './internal/winner-map-address.svelte.js';
	import { bakeJahrProperties, buildZeitJahrOptions } from './internal/winner-map-expressions.js';
	import { KiezBezirkWinnersLoader } from './internal/winner-map-winners.svelte.js';
	import { KiezBezirkGeometryLoader } from './internal/winner-map-geometry.svelte.js';
	import {
		filterWinnersByJahr,
		isRepeatElectionYear,
		joinWinnersToFeatures,
		joinStimmbezirkWinners,
		resolveAnzeigeEbene,
		buildTableRows,
		buildTakeawaySentence,
		aggregationHinweisText,
		formatAnteilPct,
		type WinnerFeatureCollection,
		type GebietFeatureCollection,
		type WinnerTableRow
	} from './internal/winner-map-data.js';

	type Props = {
		/** Injizierbar für Tests; Default = globales `fetch`. */
		fetchFn?: typeof fetch;
		/** Injizierbar für Tests; Default = Remote-Query `geocodeAddress`. */
		geocodeFn?: (q: string) => Promise<GeocodeSuggestion[]>;
	};
	let { fetchFn = fetch, geocodeFn }: Props = $props();

	const portal = getWahlPortalState();
	const stimmtyp = $derived(stimmtypForReihe(portal.reihe));
	const jahr = $derived(currentJahr(portal));

	// Stimmbezirks-Geometrie existiert pro Wahl-Generation, nicht pro Jahr
	// (Kiez-Aggregat/-Geometrie hängt an derselben Voraussetzung, siehe
	// docs/wahldaten-methodik.md „Kiez-Aggregat": ohne Stimmbezirks-Geometrie
	// gibt es auch kein Kiez-Aggregat für das Jahr -- die Fallback-Leiter
	// nutzt deshalb dieselbe Verfügbarkeit für beide Stufen und braucht dafür
	// keinen eigenen Kiez-Fetch).
	const wahlSlug = $derived(jahr !== null ? wahlSlugFromTypJahr(portal.reihe, jahr) : null);
	const stimmbezirkGeoSlug = $derived(wahlSlug ? geoSlugForWahl(wahlSlug) : null);
	// Vor dem ersten Auflösen von `jahr` (Wahl-Liste noch nicht geladen) ist die
	// Verfügbarkeit unbekannt, kein Nein -- sonst würde der Kaltstart kurz auf
	// die Fallback-Ebene rutschen (und deren Bulk-Winners unnötig fetchen),
	// bevor die Wahl-Liste überhaupt da ist.
	const hasStimmbezirkGeo = $derived(jahr === null ? true : stimmbezirkGeoSlug !== null);

	/** Anzeige-Ebene nach Fallback-Leiter; Nutzer-Wunsch (`portal.ebene`) bleibt unangetastet. */
	const anzeigeEbene = $derived(
		portal.ebene === 'stimmbezirk'
			? resolveAnzeigeEbene('stimmbezirk', {
					stimmbezirk: hasStimmbezirkGeo,
					kiez: hasStimmbezirkGeo,
					bezirk: true
				})
			: portal.ebene
	);
	const fallbackActive = $derived(portal.ebene === 'stimmbezirk' && anzeigeEbene !== 'stimmbezirk');

	async function geocode(q: string): Promise<GeocodeSuggestion[]> {
		try {
			return await (geocodeFn ? geocodeFn(q) : geocodeAddress({ q }));
		} catch {
			return [];
		}
	}

	// Winners-Fetch (kiez/bezirk): eigene Klasse (Datei-Zeilenlimit, Muster
	// StimmbezirkLoader). Story 5: wird nur aufgerufen, wenn die Anzeige-Ebene
	// kiez/bezirk ist -- direkt gewählt ODER Fallback-Ziel. Liefert ALLE Jahre
	// der Reihe (Story 7: Grundlage für `bakeJahrProperties`).
	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop,
	// über die Komponenten-Lebenszeit stabil (Muster sbLoader unten).
	const winnersLoader = new KiezBezirkWinnersLoader(fetchFn);

	$effect(() => {
		if (anzeigeEbene === 'kiez' || anzeigeEbene === 'bezirk') {
			const expectedReihe = portal.reihe;
			const expectedStimmtyp = stimmtyp;
			const expectedEbene = anzeigeEbene;
			void winnersLoader.load(
				expectedReihe,
				expectedStimmtyp,
				expectedEbene,
				() =>
					portal.reihe !== expectedReihe ||
					stimmtypForReihe(portal.reihe) !== expectedStimmtyp ||
					anzeigeEbene !== expectedEbene
			);
		}
	});

	const winnersForJahr = $derived(
		winnersLoader.response && jahr !== null
			? filterWinnersByJahr(winnersLoader.response.winners, jahr)
			: []
	);

	// Winners-Fetch (stimmbezirk), gecacht pro typ×stimmtyp×jahr (Story 5). ---
	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop,
	// über die Komponenten-Lebenszeit stabil (Muster winner-map-context-probe.svelte).
	const sbLoader = new StimmbezirkLoader(fetchFn);

	$effect(() => {
		if (anzeigeEbene === 'stimmbezirk' && jahr !== null && wahlSlug) {
			const expectedWahlSlug = wahlSlug;
			void sbLoader.loadWinners(
				portal.reihe,
				stimmtyp,
				jahr,
				() => wahlSlug !== expectedWahlSlug || anzeigeEbene !== 'stimmbezirk'
			);
		}
	});

	// Vereinheitlichte Sicht auf die aktive Datenquelle (stimmbezirk vs.
	// kiez/bezirk), damit Template/Ableitungen unten nicht doppelt verzweigen. ---
	const activeWinnersStatus = $derived(
		anzeigeEbene === 'stimmbezirk' ? sbLoader.winnersStatus : winnersLoader.status
	);
	const activeHasAnyWinners = $derived(
		anzeigeEbene === 'stimmbezirk'
			? (sbLoader.winnersResponse?.winners.length ?? 0) > 0
			: (winnersLoader.response?.winners.length ?? 0) > 0
	);
	const activeWinnersForJahr = $derived(
		anzeigeEbene === 'stimmbezirk' ? (sbLoader.winnersResponse?.winners ?? []) : winnersForJahr
	);
	const repeatElection = $derived(isRepeatElectionYear(activeWinnersForJahr));

	/**
	 * Einmal true sobald die Karte zum ersten Mal zeigbar war, danach NIE mehr
	 * false (Boundary/Live-Fund 19.09.: Reihe/Jahr/Ebene-Wechsel dürfen die
	 * bestehende Map-Instanz nur aktualisieren, niemals destroyen/aus dem DOM
	 * nehmen -- ein zwischenzeitlicher Lade-Status bei Cache-Miss der neuen
	 * Kombination darf den Karten-Branch nicht mehr aus dem `{#if}`
	 * herausfallen lassen).
	 */
	let mapShown = $state(false);
	const readyToShow = $derived(
		activeWinnersStatus === 'loaded' && activeHasAnyWinners && jahr !== null
	);
	$effect(() => {
		if (readyToShow) mapShown = true;
	});

	// Geometrie (kiez/bezirk): eigene Klasse (Datei-Zeilenlimit, Muster
	// KiezBezirkWinnersLoader). Kein Fetch ohne Winners-Daten (Boundary DB-los).
	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop,
	// über die Komponenten-Lebenszeit stabil (Muster winnersLoader/sbLoader).
	const geometryLoader = new KiezBezirkGeometryLoader(fetchFn);
	const geometry = $derived(geometryLoader.geometry);

	$effect(() => {
		// DB-los-Guard nur vor dem allerersten Zeigen der Karte (Boundary: kein
		// MapLibre-Init ohne Daten); danach lädt ein Ebenen-/Jahr-Wechsel die
		// Geometrie immer nach.
		if (!mapShown && !activeHasAnyWinners) return;
		if (anzeigeEbene === 'stimmbezirk') {
			if (stimmbezirkGeoSlug && wahlSlug) {
				const expectedGeoSlug = stimmbezirkGeoSlug;
				const expectedWahlSlug = wahlSlug;
				void sbLoader.loadGeometry(
					expectedGeoSlug,
					expectedWahlSlug,
					() => stimmbezirkGeoSlug !== expectedGeoSlug || anzeigeEbene !== 'stimmbezirk'
				);
			}
		} else {
			const expectedEbene = anzeigeEbene;
			void geometryLoader.load(expectedEbene, () => anzeigeEbene !== expectedEbene);
		}
	});

	const activeGeometryStatus = $derived(
		anzeigeEbene === 'stimmbezirk' ? sbLoader.geometryStatus : geometryLoader.status
	);

	/**
	 * Story 7: Kiez/Bezirk backen ALLE Jahre der Reihe einmal als flache
	 * Properties (`bakeJahrProperties`); ein Jahr-Wechsel ist danach nur noch
	 * `mapCtl.setActiveJahr` (`setPaintProperty`), kein erneutes `setData`.
	 * Stimmbezirk bleibt unveraendert beim jahrweisen Join (Boundary: nie
	 * Zeit-Animation dort, Zuschnitts-Wechsel zwischen Wahl-Generationen).
	 */
	const joinedFc = $derived.by<GebietFeatureCollection | null>(() => {
		if (anzeigeEbene === 'stimmbezirk') {
			const geo = sbLoader.geometry;
			// Guard auch auf wahlSlug: gleicher geoSlug kann zu einer anderen
			// Reihe (anderes uwbId-Format) gehoeren als die aktuelle Auswahl.
			if (!geo || geo.geoSlug !== stimmbezirkGeoSlug || geo.wahlSlug !== wahlSlug) return null;
			return joinStimmbezirkWinners(geo.fc, geo.wahlSlug, sbLoader.winnersResponse?.winners ?? []);
		}
		if (!geometry || geometry.ebene !== anzeigeEbene) return null;
		return bakeJahrProperties(
			geometry.fc,
			geometry.slugs,
			geometry.names,
			winnersLoader.response?.winners ?? []
		);
	});

	/** Tabelle/Takeaway/Legende bleiben auf dem bestehenden Pro-Jahr-Join
	 * (unveraendert): eine einzelne Ebene ist billig genug, dafuer keinen
	 * zweiten Baked-Lesepfad zu brauchen (Task 5: "Tooltip/Tabelle/Takeaway
	 * ueber JS-Zwilling bzw. bestehendes winnersForJahr"). */
	const tableFc = $derived.by<WinnerFeatureCollection | null>(() => {
		if (anzeigeEbene === 'stimmbezirk') return joinedFc as WinnerFeatureCollection | null;
		if (!geometry || geometry.ebene !== anzeigeEbene) return null;
		return joinWinnersToFeatures(geometry.fc, geometry.slugs, geometry.names, winnersForJahr);
	});
	const tableRows = $derived<WinnerTableRow[]>(tableFc ? buildTableRows(tableFc) : []);

	// Zeit-Animation (Story 7): reale Jahre mit Kiez/Bezirk-Daten, aufsteigend.
	// Schnittmenge mit `jahreForReihe` (Bestand `/api/wahl/list`): `setJahr`
	// akzeptiert nur Jahre daraus -- ein Nur-Winners-Jahr ohne Gegenstück in
	// der Wahl-Liste würde sonst still verworfen und der paintJahr-Effect die
	// Karte auf das vorherige Jahr zurückreißen.
	const zeitJahrOptions = $derived.by(() => {
		if (anzeigeEbene === 'stimmbezirk') return [];
		const gueltigeJahre = new Set(jahreForReihe(portal, portal.reihe).map((w) => w.jahr));
		return buildZeitJahrOptions(winnersLoader.response?.winners ?? []).filter((o) =>
			gueltigeJahre.has(o.jahr)
		);
	});
	// Anzeige-Jahr fuer die Karten-Paint (Story 7): sofort bei jedem
	// Slider-/Play-Schritt aktualisiert, unabhaengig vom gedrosselten
	// Portal-Commit; extern (Steuerleiste-Chip, Reihen-Wechsel) folgt `jahr`
	// ueber den Effect direkt darunter (der Initialwert hier ist bewusst nur
	// der Kaltstart-Wert vor dem ersten Effect-Lauf).
	// svelte-ignore state_referenced_locally
	// Kein reiner Spiegel von `jahr`: handleZeitDisplayJahr schreibt paintJahr
	// zwischen zwei `jahr`-Aenderungen unabhaengig (Slider/Play), ein
	// `$derived` kann das nicht abbilden.
	// eslint-disable-next-line svelte/prefer-writable-derived
	let paintJahr = $state<number | null>(jahr);
	$effect(() => {
		paintJahr = jahr;
	});
	function handleZeitDisplayJahr(j: number): void {
		paintJahr = j;
	}
	function handleZeitCommitJahr(j: number): void {
		setJahr(portal, j);
	}
	function handleZurKiez(): void {
		setEbene(portal, 'kiez');
	}
	const totalGebiete = $derived(
		anzeigeEbene === 'stimmbezirk'
			? (sbLoader.geometry?.fc.features.length ?? 0)
			: (geometry?.fc.features.length ?? 0)
	);
	const takeawayText = $derived(buildTakeawaySentence(tableRows, totalGebiete));
	const occurringParteien = $derived(
		Array.from(new Set(tableRows.map((r) => r.partei))).sort((a, b) => a.localeCompare(b, 'de'))
	);
	const aggregationHinweis = $derived(aggregationHinweisText(anzeigeEbene));
	const fallbackHinweisText = $derived(
		`${jahr}: keine Stimmbezirks-Daten, Karte zeigt ${anzeigeEbene === 'bezirk' ? 'Bezirke' : 'Kieze'}.`
	);

	const tableColumns: TableColumn<WinnerTableRow>[] = [
		{ key: 'gebiet', label: 'Gebiet', sortable: true, accessor: (r) => r.gebiet },
		{ key: 'partei', label: 'Partei', sortable: true, accessor: (r) => r.partei },
		{
			key: 'anteil',
			label: 'Anteil',
			sortable: true,
			accessor: (r) => r.anteil,
			format: (v) => formatAnteilPct(Number(v))
		}
	];

	// Achromatopsie-Muster-Toggle: flüchtig, kein URL/Storage. -----------
	let patternsEnabled = $state(false);
	function togglePatterns(): void {
		patternsEnabled = !patternsEnabled;
	}

	// MapLibre-Hülle: Lifecycle in eigener Klasse (Datei-Zeilenlimit). --------
	const mapCtl = new WinnerMapController({
		getFc: () => joinedFc,
		getActiveJahr: () => (anzeigeEbene === 'stimmbezirk' ? null : paintJahr)
	});
	// Adress-Hervorhebung (Zustand + Handler): eigene Klasse, siehe Modul-Doc.
	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop,
	// über die Komponenten-Lebenszeit stabil (Muster sbLoader oben).
	const addressHighlight = new AddressHighlight({
		getAnzeigeEbene: () => anzeigeEbene,
		getJoinedFc: () => joinedFc,
		sbLoader,
		mapCtl,
		fetchFn
	});

	$effect(() => {
		mapCtl.ensureMap(joinedFc);
	});

	// Story 7: Jahr-Wechsel auf kiez/bezirk faerbt nur um (setPaintProperty),
	// kein setData -- nie auf Stimmbezirk (Boundary). Ein Ebenen-Wechsel WEG
	// von kiez/bezirk muss die jahr-gebundenen Paint-/Filter-/Tooltip-Zustände
	// zuruecksetzen, sonst bleibt die Stimmbezirks-Karte auf den zuletzt
	// gemalten `w_<jahr>_*`-Keys stehen (leer/neutral, Tooltip ohne Partei).
	$effect(() => {
		if (anzeigeEbene === 'stimmbezirk') {
			mapCtl.clearActiveJahr();
		} else if (paintJahr !== null) {
			mapCtl.setActiveJahr(paintJahr);
		}
	});

	$effect(() => {
		mapCtl.setPatternsEnabled(patternsEnabled, occurringParteien);
	});

	$effect(() => {
		void anzeigeEbene;
		addressHighlight.reset();
	});

	async function handleAddressSelect(s: GeocodeSuggestion): Promise<void> {
		await addressHighlight.select(s);
	}

	$effect(() => {
		return () => mapCtl.destroy();
	});

	const ebeneLabel = $derived(EBENE_LABELS[anzeigeEbene]);
	const figureLabel = $derived(
		`Karte der stärksten Partei je Gebiet, Ebene ${ebeneLabel}${jahr !== null ? `, ${jahr}` : ''}${repeatElection ? ' (Wiederholungswahl)' : ''}`
	);

	// Zustands-Fassade für den {#if}/{:else if}-Fall (Story 6: dieselben Flags
	// entscheiden jetzt auch, ob Legende/Tabelle unter der Karte gezeigt werden,
	// die per Grid-Reihenfolge unter dem Ergebnis-Panel liegen -- siehe Markup).
	const isErrorState = $derived(
		!mapShown && (activeWinnersStatus === 'error' || activeGeometryStatus === 'error')
	);
	const isLoadingState = $derived(!isErrorState && !mapShown && activeWinnersStatus !== 'loaded');
	const isEmptyState = $derived(
		!isErrorState && !isLoadingState && !mapShown && (!activeHasAnyWinners || jahr === null)
	);
	const showKarteInhalt = $derived(!isErrorState && !isLoadingState && !isEmptyState);
</script>

<div class="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start lg:gap-x-6 lg:gap-y-6">
<figure
	class="space-y-3 lg:col-start-1 lg:col-span-2 lg:row-start-1"
	aria-label={figureLabel}
	data-testid="winner-map"
>
	{#if repeatElection}
		<p data-testid="winner-map-wiederholung" class="font-mono text-xs text-ink-subtle">
			Wiederholungswahl
		</p>
	{/if}

	{#if fallbackActive}
		<p data-testid="winner-map-fallback-hinweis" role="status" class="font-mono text-xs text-ink-subtle">
			{fallbackHinweisText}
		</p>
	{/if}

	{#if mapShown && (activeWinnersStatus === 'error' || activeGeometryStatus === 'error' || !activeHasAnyWinners)}
		<p data-testid="winner-map-status-hinweis" role="status" class="font-mono text-xs text-ink-subtle">
			{activeWinnersStatus === 'error' || activeGeometryStatus === 'error'
				? 'Aktualisierung fehlgeschlagen, die Karte zeigt den letzten Stand.'
				: 'Für diese Auswahl liegen keine Gebiets-Ergebnisse vor.'}
		</p>
	{/if}

	{#if isErrorState}
		<p data-testid="winner-map-error" role="alert" class="font-serif text-ink-muted">
			Wahl-Daten konnten nicht geladen werden.
		</p>
	{:else if isLoadingState}
		<p data-testid="winner-map-loading" class="font-serif text-ink-muted">
			Lädt Wahl-Ergebnisse …
		</p>
	{:else if isEmptyState}
		<p data-testid="winner-map-empty" class="font-serif text-ink-muted">
			Für diese Auswahl liegen noch keine Wahl-Ergebnisse vor.
		</p>
	{:else}
		<p data-testid="winner-map-takeaway" class="max-w-prose font-serif text-lg leading-relaxed text-ink">
			{takeawayText}
		</p>

		<div class="max-w-md">
			<AddressSearch variant="header" {geocode} onSelect={handleAddressSelect} />
			{#if addressHighlight.hint}
				<p
					aria-live="polite"
					data-testid="winner-map-address-hint"
					class="mt-1 font-mono text-xs text-ink-subtle"
				>
					{addressHighlight.hint}
				</p>
			{/if}
		</div>

		<div class="relative h-[420px] w-full overflow-hidden rounded border border-rule sm:h-[520px]">
			<div
				bind:this={mapCtl.container}
				role="img"
				aria-label={figureLabel}
				data-testid="winner-map-canvas"
				data-highlighted-slug={mapCtl.highlightedSlug ?? undefined}
				class="h-full w-full"
			></div>
			<WinnerMapTooltip
				visible={mapCtl.tooltipVisible}
				pos={mapCtl.tooltipPos}
				data={mapCtl.tooltipData}
				{jahr}
				{repeatElection}
			/>
		</div>

		{#if jahr !== null}
			<ZeitAnimation
				ebene={anzeigeEbene}
				jahrOptions={zeitJahrOptions}
				{jahr}
				onDisplayJahr={handleZeitDisplayJahr}
				onCommitJahr={handleZeitCommitJahr}
				onZurKiez={handleZurKiez}
			/>
		{/if}

		<figcaption data-testid="winner-map-aggregation-hinweis" class="font-mono text-xs text-ink-subtle">
			{aggregationHinweis} Details:
			<a
				href={resolve('/methodik/wahldaten')}
				class="hover:text-accent-strong text-accent underline underline-offset-2"
			>
				/methodik/wahldaten
			</a>
		</figcaption>
	{/if}
</figure>

<aside
	class="lg:col-start-3 lg:col-span-1 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24"
	data-testid="ergebnis-panel-slot"
>
	<ErgebnisPanel
		{fetchFn}
		highlightedSlug={anzeigeEbene === 'stimmbezirk' ? null : addressHighlight.gebietSlug}
		highlightedName={anzeigeEbene === 'stimmbezirk' ? null : addressHighlight.gebietName}
		{anzeigeEbene}
	/>
</aside>

{#if showKarteInhalt}
	<div class="space-y-3 lg:col-start-1 lg:col-span-2 lg:row-start-2">
		<WinnerMapLegende
			parteien={occurringParteien}
			{patternsEnabled}
			onTogglePatterns={togglePatterns}
		/>

		<DataTableAlternative
			columns={tableColumns}
			rows={tableRows}
			caption={`Stärkste Partei je Gebiet${jahr !== null ? `, ${jahr}` : ''}`}
		/>
	</div>
{/if}
</div>
