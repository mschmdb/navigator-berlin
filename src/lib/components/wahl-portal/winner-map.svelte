<script lang="ts">
	import type { FeatureCollection } from 'geojson';
	import { resolve } from '$app/paths';
	import { getWahlPortalState, currentJahr } from '$lib/state/wahl-portal-context.svelte.js';
	import { stimmtypForReihe, EBENE_LABELS } from '$lib/utils/wahl-portal-url-state.js';
	import { loadManifest } from '$lib/data/manifest.js';
	import { fetchLayer } from '$lib/data/internal/layer-fetch.js';
	import { resolveSpatialLevel } from '$lib/data/resolve-spatial-level.js';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import { wahlSlugFromTypJahr, geoSlugForWahl } from '$lib/data/wahl-geo-mapping.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import AddressSearch from '$lib/components/atlas/address-search.svelte';
	import DataTableAlternative, {
		type TableColumn
	} from '$lib/components/atlas/data-table-alternative.svelte';
	import WinnerMapLegende from './winner-map-legende.svelte';
	import WinnerMapTooltip from './winner-map-tooltip.svelte';
	import { WinnerMapController } from './internal/winner-map-maplibre.svelte.js';
	import { StimmbezirkLoader } from './internal/winner-map-stimmbezirk.svelte.js';
	import {
		filterWinnersByJahr,
		isRepeatElectionYear,
		buildKiezSlugsForFeatures,
		bezirkSlugsForFeatures,
		kiezNamesForFeatures,
		bezirkNamesForFeatures,
		joinWinnersToFeatures,
		joinStimmbezirkWinners,
		resolveAnzeigeEbene,
		buildTableRows,
		buildTakeawaySentence,
		aggregationHinweisText,
		formatAnteilPct,
		type WinnerApiRow,
		type WinnerFeatureCollection,
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

	// Winners-Fetch (kiez/bezirk), gecacht pro Reihe×Ebene (AC: genau EIN
	// Request je Kombination). Story 5: wird nur noch aufgerufen, wenn die
	// Anzeige-Ebene kiez/bezirk ist -- direkt gewählt ODER Fallback-Ziel. ---
	interface WinnersApiResponse {
		readonly winners: WinnerApiRow[];
	}
	type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

	// Plain Record statt Map: bewusst nicht-reaktiver Request-Cache.
	const winnersCache: Record<string, WinnersApiResponse> = {};
	let winnersResponse = $state<WinnersApiResponse | null>(null);
	let winnersStatus = $state<LoadStatus>('idle');

	async function loadWinners(typ: string, st: string, eb: 'kiez' | 'bezirk'): Promise<void> {
		const key = `${typ}-${st}-${eb}`;
		const cached = winnersCache[key];
		if (cached) {
			winnersResponse = cached;
			winnersStatus = 'loaded';
			return;
		}
		winnersStatus = 'loading';
		try {
			const url = `/api/wahl/winners?typ=${typ}&stimmtyp=${st}&ebene=${eb}`;
			const res = await fetchFn(url);
			if (!res.ok) throw new Error(`status ${res.status}`);
			const data = (await res.json()) as WinnersApiResponse;
			if (!Array.isArray(data?.winners)) throw new Error('malformed winners response');
			winnersCache[key] = data;
			// Stale-Guard: gegen die tatsächlich angezeigte Ebene (Fallback-Ziel
			// kann von portal.ebene abweichen, siehe anzeigeEbene).
			if (typ !== portal.reihe || st !== stimmtypForReihe(portal.reihe) || eb !== anzeigeEbene) {
				return;
			}
			winnersResponse = data;
			winnersStatus = 'loaded';
		} catch {
			if (typ !== portal.reihe || eb !== anzeigeEbene) return;
			winnersStatus = 'error';
		}
	}

	$effect(() => {
		if (anzeigeEbene === 'kiez' || anzeigeEbene === 'bezirk') {
			void loadWinners(portal.reihe, stimmtyp, anzeigeEbene);
		}
	});

	const winnersForJahr = $derived(
		winnersResponse && jahr !== null ? filterWinnersByJahr(winnersResponse.winners, jahr) : []
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
		anzeigeEbene === 'stimmbezirk' ? sbLoader.winnersStatus : winnersStatus
	);
	const activeHasAnyWinners = $derived(
		anzeigeEbene === 'stimmbezirk'
			? (sbLoader.winnersResponse?.winners.length ?? 0) > 0
			: (winnersResponse?.winners.length ?? 0) > 0
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

	// Geometrie, gecacht pro Ebene (kiez/bezirk) bzw. pro geo_slug (stimmbezirk).
	// Kein Fetch ohne Winners-Daten (Boundary DB-los). ---
	interface GeometryState {
		readonly ebene: 'kiez' | 'bezirk';
		readonly fc: FeatureCollection;
		readonly slugs: string[];
		readonly names: string[];
	}
	const geometryCache: Record<string, GeometryState> = {};
	let geometry = $state<GeometryState | null>(null);
	let geometryStatus = $state<LoadStatus>('idle');

	async function loadGeometry(ebene: 'kiez' | 'bezirk'): Promise<void> {
		const cached = geometryCache[ebene];
		if (cached) {
			geometry = cached;
			geometryStatus = 'loaded';
			return;
		}
		geometryStatus = 'loading';
		try {
			const manifest = await loadManifest(fetchFn);
			const bezirkeLayer = manifest.layers.find((l) => l.slug === 'bezirke');
			if (!bezirkeLayer) throw new Error('bezirke-Layer fehlt im Manifest');
			const bezirkeFc = await fetchLayer(bezirkeLayer.filename, fetchFn);
			let next: GeometryState;
			if (ebene === 'bezirk') {
				next = {
					ebene,
					fc: bezirkeFc,
					slugs: bezirkSlugsForFeatures(bezirkeFc),
					names: bezirkNamesForFeatures(bezirkeFc)
				};
			} else {
				const kiezLayer = manifest.layers.find((l) => l.slug === 'lor-bezirksregion');
				if (!kiezLayer) throw new Error('lor-bezirksregion-Layer fehlt im Manifest');
				const kiezFc = await fetchLayer(kiezLayer.filename, fetchFn);
				next = {
					ebene,
					fc: kiezFc,
					slugs: buildKiezSlugsForFeatures(kiezFc, bezirkeFc),
					names: kiezNamesForFeatures(kiezFc, bezirkeFc)
				};
			}
			geometryCache[ebene] = next;
			// Stale-Guard analog loadWinners: gegen die tatsächlich angezeigte Ebene.
			if (ebene !== anzeigeEbene) return;
			geometry = next;
			geometryStatus = 'loaded';
		} catch {
			if (ebene !== anzeigeEbene) return;
			geometryStatus = 'error';
		}
	}

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
			void loadGeometry(anzeigeEbene);
		}
	});

	const activeGeometryStatus = $derived(
		anzeigeEbene === 'stimmbezirk' ? sbLoader.geometryStatus : geometryStatus
	);

	const joinedFc = $derived.by<WinnerFeatureCollection | null>(() => {
		if (anzeigeEbene === 'stimmbezirk') {
			const geo = sbLoader.geometry;
			// Guard auch auf wahlSlug: gleicher geoSlug kann zu einer anderen
			// Reihe (anderes uwbId-Format) gehoeren als die aktuelle Auswahl.
			if (!geo || geo.geoSlug !== stimmbezirkGeoSlug || geo.wahlSlug !== wahlSlug) return null;
			return joinStimmbezirkWinners(geo.fc, geo.wahlSlug, sbLoader.winnersResponse?.winners ?? []);
		}
		// Nur joinen, wenn die geladene Geometrie zur Anzeige-Ebene gehoert;
		// sonst mischt ein Wechsel uebergangsweise alte Flaechen mit neuen
		// Winners (alles unmatched -> neutrale Blitz-Karte).
		if (!geometry || geometry.ebene !== anzeigeEbene) return null;
		return joinWinnersToFeatures(geometry.fc, geometry.slugs, geometry.names, winnersForJahr);
	});
	const tableRows = $derived<WinnerTableRow[]>(joinedFc ? buildTableRows(joinedFc) : []);
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
	const mapCtl = new WinnerMapController({ getFc: () => joinedFc });
	let addressHint = $state<string | null>(null);

	$effect(() => {
		mapCtl.ensureMap(joinedFc);
	});

	$effect(() => {
		mapCtl.setPatternsEnabled(patternsEnabled, occurringParteien);
	});

	// Anzeige-Ebenen-Wechsel invalidiert eine evtl. aktive Adress-Hervorhebung
	// (das hervorgehobene Feature gehört zur alten Geometrie/Ebene).
	$effect(() => {
		void anzeigeEbene;
		addressHint = null;
		mapCtl.highlight(joinedFc, null);
	});

	async function handleAddressSelect(s: GeocodeSuggestion): Promise<void> {
		if (anzeigeEbene === 'stimmbezirk') {
			if (sbLoader.geometryStatus !== 'loaded' || !sbLoader.geometry) {
				addressHint = 'Karte lädt noch, bitte gleich erneut versuchen.';
				return;
			}
			const uwbId = sbLoader.resolveAddress(s.lat, s.lng);
			if (!uwbId) {
				addressHint = 'Für diese Adresse liegt kein Gebiet in Berlin vor.';
				mapCtl.highlight(joinedFc, null);
				return;
			}
			addressHint = `Stimmbezirk ${uwbId} hervorgehoben.`;
			mapCtl.highlight(joinedFc, uwbId);
			return;
		}

		let ctx;
		try {
			ctx = await resolveSpatialLevel(s.lat, s.lng, fetchFn);
		} catch {
			addressHint = 'Adresse konnte nicht aufgelöst werden.';
			return;
		}
		const slug = anzeigeEbene === 'bezirk' ? ctx.bezirkSlug : ctx.kiezSlug;
		const name = anzeigeEbene === 'bezirk' ? ctx.bezirkName : ctx.kiezName;
		if (!slug) {
			addressHint = 'Für diese Adresse liegt kein Gebiet in Berlin vor.';
			mapCtl.highlight(joinedFc, null);
			return;
		}
		addressHint = name ? `${name} hervorgehoben.` : null;
		mapCtl.highlight(joinedFc, slug);
	}

	$effect(() => {
		return () => mapCtl.destroy();
	});

	const ebeneLabel = $derived(EBENE_LABELS[anzeigeEbene]);
	const figureLabel = $derived(
		`Karte der stärksten Partei je Gebiet, Ebene ${ebeneLabel}${jahr !== null ? `, ${jahr}` : ''}${repeatElection ? ' (Wiederholungswahl)' : ''}`
	);
</script>

<figure class="space-y-3" aria-label={figureLabel} data-testid="winner-map">
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

	{#if !mapShown && (activeWinnersStatus === 'error' || activeGeometryStatus === 'error')}
		<p data-testid="winner-map-error" role="alert" class="font-serif text-ink-muted">
			Wahl-Daten konnten nicht geladen werden.
		</p>
	{:else if !mapShown && activeWinnersStatus !== 'loaded'}
		<p data-testid="winner-map-loading" class="font-serif text-ink-muted">
			Lädt Wahl-Ergebnisse …
		</p>
	{:else if !mapShown && (!activeHasAnyWinners || jahr === null)}
		<p data-testid="winner-map-empty" class="font-serif text-ink-muted">
			Für diese Auswahl liegen noch keine Wahl-Ergebnisse vor.
		</p>
	{:else}
		<p data-testid="winner-map-takeaway" class="max-w-prose font-serif text-lg leading-relaxed text-ink">
			{takeawayText}
		</p>

		<div class="max-w-md">
			<AddressSearch variant="header" {geocode} onSelect={handleAddressSelect} />
			{#if addressHint}
				<p
					aria-live="polite"
					data-testid="winner-map-address-hint"
					class="mt-1 font-mono text-xs text-ink-subtle"
				>
					{addressHint}
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

		<figcaption data-testid="winner-map-aggregation-hinweis" class="font-mono text-xs text-ink-subtle">
			{aggregationHinweis} Details:
			<a
				href={resolve('/methodik/wahldaten')}
				class="hover:text-accent-strong text-accent underline underline-offset-2"
			>
				/methodik/wahldaten
			</a>
		</figcaption>

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
	{/if}
</figure>
