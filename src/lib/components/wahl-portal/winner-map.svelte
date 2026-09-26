<script lang="ts">
	import {
		getWahlPortalState,
		currentJahr,
		jahreForReihe,
		setJahr,
		setEbene
	} from '$lib/state/wahl-portal-context.svelte.js';
	import { stimmtypForReihe } from '$lib/utils/wahl-portal-url-state.js';
	import { m } from '$lib/paraglide/messages.js';
	import { wahlEbeneLabel, wahlWiederholungLabel } from '$lib/data/wahl-labels.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import { wahlSlugFromTypJahr, geoSlugForWahl } from '$lib/data/wahl-geo-mapping.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import AddressSearch from '$lib/components/atlas/address-search.svelte';
	import DataTableAlternative from '$lib/components/atlas/data-table-alternative.svelte';
	import WinnerMapLegende from './winner-map-legende.svelte';
	import WinnerMapTooltip from './winner-map-tooltip.svelte';
	import WinnerMapParteiTabs from './winner-map-partei-tabs.svelte';
	import ErgebnisPanel from './ergebnis-panel.svelte';
	import ZeitAnimation from './zeit-animation.svelte';
	import { WinnerMapController } from './internal/winner-map-maplibre.svelte.js';
	import { StimmbezirkLoader } from './internal/winner-map-stimmbezirk.svelte.js';
	import { AddressHighlight } from './internal/winner-map-address.svelte.js';
	import {
		bakeJahrProperties,
		bakeParteiJahrProperties,
		resolveZeitJahrOptions
	} from './internal/winner-map-expressions.js';
	import { ParteiModeState } from './internal/winner-map-partei-mode.svelte.js';
	import { KiezBezirkWinnersLoader } from './internal/winner-map-winners.svelte.js';
	import { KiezBezirkGeometryLoader } from './internal/winner-map-geometry.svelte.js';
	import { KbWinnersGate } from './internal/winner-map-kb-gate.svelte.js';
	import { SbWinnersGate } from './internal/winner-map-sb-gate.svelte.js';
	import {
		buildAnsichtAnnouncement,
		buildFigureLabel,
		buildWinnerTableColumns
	} from './internal/winner-map-labels.js';
	import {
		filterWinnersByJahr,
		joinWinnersToFeatures,
		joinStimmbezirkWinners,
		resolveAnzeigeEbene,
		buildTableRows,
		buildTakeawaySentence,
		aggregationHinweisText,
		deriveActiveWinnersState,
		deriveKarteVisibility,
		type WinnerFeatureCollection,
		type GebietFeatureCollection,
		type WinnerTableRow
	} from './internal/winner-map-data.js';

	type Props = {
		/** Injizierbar für Tests; Default = globales `fetch`. */
		fetchFn?: typeof fetch;
		/** Injizierbar für Tests; Default = Remote-Query `geocodeAddress`. */
		geocodeFn?: (q: string) => Promise<GeocodeSuggestion[]>;
		/** Injizierbar für Tests (Fake-MapLibre-Naht, Muster `trends-kapitel.svelte`). */
		mapFactory?: ConstructorParameters<typeof WinnerMapController>[0]['mapFactory'];
	};
	let { fetchFn = fetch, geocodeFn, mapFactory }: Props = $props();

	const portal = getWahlPortalState();
	const stimmtyp = $derived(stimmtypForReihe(portal.reihe));
	const jahr = $derived(currentJahr(portal));

	// Stimmbezirks-Geometrie existiert pro Wahl-Generation, nicht pro Jahr;
	// die Fallback-Leiter nutzt dieselbe Verfügbarkeit für kiez UND stimmbezirk.
	const wahlSlug = $derived(jahr !== null ? wahlSlugFromTypJahr(portal.reihe, jahr) : null);
	const stimmbezirkGeoSlug = $derived(wahlSlug ? geoSlugForWahl(wahlSlug) : null);
	// Vor dem ersten Auflösen von `jahr` ist die Verfügbarkeit unbekannt, kein Nein.
	const hasStimmbezirkGeo = $derived(jahr === null ? true : stimmbezirkGeoSlug !== null);

	/** Anzeige-Ebene nach Fallback-Leiter; `portal.ebene` bleibt unangetastet. */
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

	// Story 9: karten-lokaler Partei-Tab-Zustand, kein URL-State (Boundary).
	const parteiMode = new ParteiModeState();

	async function geocode(q: string): Promise<GeocodeSuggestion[]> {
		try {
			return await (geocodeFn ? geocodeFn(q) : geocodeAddress({ q }));
		} catch {
			return [];
		}
	}

	// Winners-Fetch (kiez/bezirk): eigene Klasse (Datei-Zeilenlimit).
	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop.
	const winnersLoader = new KiezBezirkWinnersLoader(fetchFn);
	// Fetch-Trigger + Response-Latch (Review-Fund #7).
	const kbGate = new KbWinnersGate({
		loader: winnersLoader,
		getReihe: () => portal.reihe,
		getStimmtyp: () => stimmtyp,
		getAnzeigeEbene: () => anzeigeEbene,
		getAktivePartei: () => parteiMode.aktivePartei
	});
	// ZWEI Effects: gemeinsames Lesen+Schreiben von `loader.response` in einem
	// einzigen Effect-Lauf löst eine Svelte-Endlosschleife aus.
	$effect(() => kbGate.triggerFetch());
	$effect(() => kbGate.updateEffectiveRows());

	const winnersForJahr = $derived(
		jahr !== null ? filterWinnersByJahr(kbGate.effectiveRows, jahr) : []
	);

	// Winners-Fetch (stimmbezirk), gecacht pro typ×stimmtyp×jahr(×partei).
	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop.
	const sbLoader = new StimmbezirkLoader(fetchFn);
	const sbGate = new SbWinnersGate({
		loader: sbLoader,
		getReihe: () => portal.reihe,
		getStimmtyp: () => stimmtyp,
		getJahr: () => jahr,
		getWahlSlug: () => wahlSlug,
		getAnzeigeEbene: () => anzeigeEbene,
		getAktivePartei: () => parteiMode.aktivePartei
	});
	$effect(() => sbGate.triggerFetch());
	$effect(() => sbGate.updateEffectiveRows());

	const activeWinners = $derived(
		deriveActiveWinnersState({
			isStimmbezirk: anzeigeEbene === 'stimmbezirk',
			sbStatus: sbLoader.winnersStatus,
			sbWinners: sbLoader.winnersResponse?.winners ?? [],
			kbStatus: winnersLoader.status,
			kbWinnersAll: winnersLoader.response?.winners ?? [],
			kbWinnersForJahr: winnersForJahr
		})
	);
	const activeWinnersStatus = $derived(activeWinners.status);
	const activeHasAnyWinners = $derived(activeWinners.hasAnyWinners);
	const repeatElection = $derived(activeWinners.repeatElection);

	/** Einmal true sobald die Karte zum ersten Mal zeigbar war, danach NIE
	 * mehr false (Boundary: nie destroy/re-mount bei Reihe/Jahr/Ebene-Wechsel). */
	let mapShown = $state(false);
	const readyToShow = $derived(
		activeWinnersStatus === 'loaded' && activeHasAnyWinners && jahr !== null
	);
	$effect(() => {
		if (readyToShow) mapShown = true;
	});

	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop.
	const geometryLoader = new KiezBezirkGeometryLoader(fetchFn);
	const geometry = $derived(geometryLoader.geometry);

	$effect(() => {
		// DB-los-Guard nur vor dem Erst-Zeigen; danach lädt jeder Wechsel nach.
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

	/** Kiez/Bezirk backen ALLE Jahre einmal als flache Properties (Jahr-
	 * Wechsel = `setPaintProperty`, kein `setData`); Stimmbezirk bleibt beim
	 * jahrweisen Join. Partei-Modus bakt via `bakeParteiJahrProperties`. */
	const joinedFc = $derived.by<GebietFeatureCollection | null>(() => {
		if (anzeigeEbene === 'stimmbezirk') {
			const geo = sbLoader.geometry;
			// Guard auch auf wahlSlug: gleicher geoSlug kann zu einer anderen
			// Reihe (anderes uwbId-Format) gehoeren als die aktuelle Auswahl.
			if (!geo || geo.geoSlug !== stimmbezirkGeoSlug || geo.wahlSlug !== wahlSlug) return null;
			return joinStimmbezirkWinners(geo.fc, geo.wahlSlug, sbGate.effectiveRows);
		}
		if (!geometry || geometry.ebene !== anzeigeEbene) return null;
		return parteiMode.aktivePartei
			? bakeParteiJahrProperties(geometry.fc, geometry.slugs, geometry.names, kbGate.effectiveRows)
			: bakeJahrProperties(geometry.fc, geometry.slugs, geometry.names, kbGate.effectiveRows);
	});

	/** Tabelle/Takeaway/Legende bleiben auf dem Pro-Jahr-Join (kein zweiter
	 * Baked-Lesepfad nötig, eine Ebene pro Frame ist billig genug). */
	const tableFc = $derived.by<WinnerFeatureCollection | null>(() => {
		if (anzeigeEbene === 'stimmbezirk') return joinedFc as WinnerFeatureCollection | null;
		if (!geometry || geometry.ebene !== anzeigeEbene) return null;
		return joinWinnersToFeatures(geometry.fc, geometry.slugs, geometry.names, winnersForJahr);
	});
	const tableRows = $derived<WinnerTableRow[]>(tableFc ? buildTableRows(tableFc) : []);

	// Zeit-Leiste (Review-Fund #8: im Partei-Modus unabhängig von Partei-Rows).
	const zeitJahrOptions = $derived(
		anzeigeEbene === 'stimmbezirk'
			? []
			: resolveZeitJahrOptions({
					reiheJahre: jahreForReihe(portal, portal.reihe),
					aktivePartei: parteiMode.aktivePartei,
					winnersAlleJahre: kbGate.effectiveRows
				})
	);
	// Anzeige-Jahr fuer die Karten-Paint: sofort bei jedem Slider-/Play-Schritt
	// aktualisiert (kein reiner Spiegel von `jahr`, deshalb kein `$derived`).
	// svelte-ignore state_referenced_locally
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
	// Review-Fund (i18n Block B): eigene Keys je Ebene mit fest eingebautem,
	// grammatisch korrektem Plural (kein `${label}e`-Anhängen mehr, das war
	// EN nicht uebertragbar), plus ein eigener Satz OHNE Jahreszahl statt des
	// vorherigen `jahr ?? 0` (der bei `jahr === null` faelschlich "0:" zeigte).
	// `fallbackActive` (siehe oben) gilt nur, wenn `anzeigeEbene` 'kiez' oder
	// 'bezirk' ist -- die Fallback-Leiter verlaesst 'stimmbezirk' nie zu einer
	// anderen Ebene.
	const fallbackHinweisText = $derived(
		anzeigeEbene === 'bezirk'
			? jahr !== null
				? m.wahl_portal_fallback_hinweis_bezirk_mit_jahr({ jahr })
				: m.wahl_portal_fallback_hinweis_bezirk_ohne_jahr()
			: jahr !== null
				? m.wahl_portal_fallback_hinweis_kiez_mit_jahr({ jahr })
				: m.wahl_portal_fallback_hinweis_kiez_ohne_jahr()
	);

	const tableColumns = buildWinnerTableColumns();

	// Rows der aktiven Quelle für die partei-relative Rampe/Texte (Review-
	// Fund #7: die LATCHED Rows, nicht die rohe Loader-Response).
	const activePartyRows = $derived(
		anzeigeEbene === 'stimmbezirk' ? sbGate.effectiveRows : kbGate.effectiveRows
	);
	const parteiRamp = $derived(parteiMode.ramp(activePartyRows));
	const parteiTexts = $derived(parteiMode.texts(activePartyRows, jahr, totalGebiete));

	// Achromatopsie-Muster-Toggle: flüchtig, kein URL/Storage.
	let patternsEnabled = $state(false);
	function togglePatterns(): void {
		patternsEnabled = !patternsEnabled;
	}

	// MapLibre-Hülle: Lifecycle in eigener Klasse (Datei-Zeilenlimit).
	// svelte-ignore state_referenced_locally -- mapFactory ist ein Test-/DI-Prop.
	const mapCtl = new WinnerMapController({
		getFc: () => joinedFc,
		getActiveJahr: () => (anzeigeEbene === 'stimmbezirk' ? null : paintJahr),
		getParteiRamp: () => parteiRamp,
		mapFactory
	});
	// Adress-Hervorhebung (Zustand + Handler): eigene Klasse, siehe Modul-Doc.
	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop.
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

	// Jahr-Wechsel auf kiez/bezirk faerbt nur um (setPaintProperty); Ebenen-
	// Wechsel WEG von kiez/bezirk setzt die jahr-gebundenen Paint-/Filter-
	// Zustände zurück (clearActiveJahr).
	$effect(() => {
		// Review-Fund #1: `parteiRamp` muss HIER synchron gelesen werden, sonst
		// repaintet ein Tab-Klick ohne Jahr-/Ebenen-Wechsel nicht (`setActiveJahr`
		// liest die Rampe nur über eine Closure, kein Effect-Dependency-Tracking).
		void parteiRamp;
		if (anzeigeEbene === 'stimmbezirk') {
			mapCtl.clearActiveJahr();
			mapCtl.setGenericRamp(parteiRamp);
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

	const ebeneLabel = $derived(wahlEbeneLabel(anzeigeEbene));
	// Review-Fund #6: aria-label + role=status-Announcement für den Tab-Wechsel.
	const figureLabel = $derived(
		buildFigureLabel({
			ebeneLabel,
			jahr,
			repeatElection,
			aktivePartei: parteiMode.aktivePartei
		})
	);
	const ansichtAnnouncement = $derived(buildAnsichtAnnouncement(parteiMode.aktivePartei));

	// Zustands-Fassade für den {#if}/{:else if}-Fall (steuert auch, ob Legende/
	// Tabelle unter der Karte gezeigt werden, siehe Markup).
	const visibility = $derived(
		deriveKarteVisibility({
			mapShown,
			winnersStatus: activeWinnersStatus,
			geometryStatus: activeGeometryStatus,
			hasAnyWinners: activeHasAnyWinners,
			jahrIsNull: jahr === null
		})
	);
</script>

<div class="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:items-start lg:gap-x-6 lg:gap-y-6">
	<figure
		class="space-y-3 lg:col-span-2 lg:col-start-1 lg:row-start-1"
		aria-label={figureLabel}
		data-testid="winner-map"
	>
		{#if repeatElection}
			<p data-testid="winner-map-wiederholung" class="font-mono text-xs text-ink-subtle">
				{wahlWiederholungLabel()}
			</p>
		{/if}

		{#if fallbackActive}
			<p
				data-testid="winner-map-fallback-hinweis"
				role="status"
				class="font-mono text-xs text-ink-subtle"
			>
				{fallbackHinweisText}
			</p>
		{/if}

		{#if mapShown && (activeWinnersStatus === 'error' || activeGeometryStatus === 'error' || !activeHasAnyWinners)}
			<p
				data-testid="winner-map-status-hinweis"
				role="status"
				class="font-mono text-xs text-ink-subtle"
			>
				{activeWinnersStatus === 'error' || activeGeometryStatus === 'error'
					? m.wahl_portal_status_hinweis_fehler()
					: m.wahl_portal_status_hinweis_keine_ergebnisse()}
			</p>
		{/if}

		{#if visibility.isErrorState}
			<p data-testid="winner-map-error" role="alert" class="font-serif text-ink-muted">
				{m.wahl_portal_wahldaten_error()}
			</p>
		{:else if visibility.isLoadingState}
			<p data-testid="winner-map-loading" class="font-serif text-ink-muted">
				{m.wahl_portal_winner_map_loading()}
			</p>
		{:else if visibility.isEmptyState}
			<p data-testid="winner-map-empty" class="font-serif text-ink-muted">
				{m.wahl_portal_wahl_ergebnisse_empty()}
			</p>
		{:else}
			<p
				data-testid="winner-map-takeaway"
				class="max-w-prose font-serif text-lg leading-relaxed text-ink tabular-nums"
			>
				{parteiTexts ? parteiTexts.takeaway : takeawayText}
			</p>

			<div class="max-w-md">
				<AddressSearch
					variant="header"
					{geocode}
					onSelect={handleAddressSelect}
					placeholder={m.wahl_portal_address_search_placeholder()}
				/>
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

			<WinnerMapParteiTabs
				aktivePartei={parteiMode.aktivePartei}
				onSelect={(p) => parteiMode.select(p)}
			/>
			<p class="sr-only" role="status" data-testid="winner-map-ansicht-status">
				{ansichtAnnouncement}
			</p>

			<div
				class="relative h-[420px] w-full overflow-hidden rounded border border-rule sm:h-[520px]"
			>
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

			<figcaption
				data-testid="winner-map-aggregation-hinweis"
				class="font-mono text-xs text-ink-subtle"
			>
				{aggregationHinweis}
				{m.wahl_portal_methodik_details_label()}
				<a
					href={localizedHref('/methodik/wahldaten')}
					class="hover:text-accent-strong text-accent underline underline-offset-2"
				>
					/methodik/wahldaten
				</a>
			</figcaption>
		{/if}
	</figure>

	<aside
		class="lg:sticky lg:top-[calc(var(--header-height,72px)+5.5rem)] lg:col-span-1 lg:col-start-3 lg:row-span-2 lg:row-start-1"
		data-testid="ergebnis-panel-slot"
	>
		<ErgebnisPanel
			{fetchFn}
			highlightedSlug={anzeigeEbene === 'stimmbezirk' ? null : addressHighlight.gebietSlug}
			highlightedName={anzeigeEbene === 'stimmbezirk' ? null : addressHighlight.gebietName}
			{anzeigeEbene}
		/>
	</aside>

	{#if visibility.showKarteInhalt}
		<div class="space-y-3 lg:col-span-2 lg:col-start-1 lg:row-start-2">
			<WinnerMapLegende
				parteien={occurringParteien}
				{patternsEnabled}
				onTogglePatterns={togglePatterns}
				titel={parteiTexts?.legendeTitel}
				rampeText={parteiTexts?.legendeRampeText}
			/>

			<DataTableAlternative
				columns={tableColumns}
				rows={tableRows}
				caption={parteiTexts
					? parteiTexts.tableCaption
					: jahr !== null
						? m.wahl_portal_sieger_table_caption_jahr({ jahr })
						: m.wahl_portal_sieger_table_caption()}
				toggleLabel={m.wahl_portal_data_table_toggle()}
				closeLabel={m.wahl_portal_data_table_close()}
			/>
		</div>
	{/if}
</div>
