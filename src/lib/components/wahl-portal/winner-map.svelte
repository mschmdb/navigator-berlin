<script lang="ts">
	import type { FeatureCollection } from 'geojson';
	import { resolve } from '$app/paths';
	import { getWahlPortalState, currentJahr } from '$lib/state/wahl-portal-context.svelte.js';
	import { stimmtypForReihe, EBENE_LABELS } from '$lib/utils/wahl-portal-url-state.js';
	import { loadManifest } from '$lib/data/manifest.js';
	import { fetchLayer } from '$lib/data/internal/layer-fetch.js';
	import { resolveSpatialLevel } from '$lib/data/resolve-spatial-level.js';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import AddressSearch from '$lib/components/atlas/address-search.svelte';
	import DataTableAlternative, {
		type TableColumn
	} from '$lib/components/atlas/data-table-alternative.svelte';
	import WinnerMapLegende from './winner-map-legende.svelte';
	import WinnerMapTooltip from './winner-map-tooltip.svelte';
	import { WinnerMapController } from './internal/winner-map-maplibre.svelte.js';
	import {
		filterWinnersByJahr,
		isRepeatElectionYear,
		buildKiezSlugsForFeatures,
		bezirkSlugsForFeatures,
		kiezNamesForFeatures,
		bezirkNamesForFeatures,
		joinWinnersToFeatures,
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

	async function geocode(q: string): Promise<GeocodeSuggestion[]> {
		try {
			return await (geocodeFn ? geocodeFn(q) : geocodeAddress({ q }));
		} catch {
			return [];
		}
	}

	// Winners-Fetch, gecacht pro Reihe×Ebene (AC: genau EIN Request je Kombination). ---
	interface WinnersApiResponse {
		readonly winners: WinnerApiRow[];
	}
	type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

	// Plain Record statt Map: bewusst nicht-reaktiver Request-Cache.
	const winnersCache: Record<string, WinnersApiResponse> = {};
	let winnersResponse = $state<WinnersApiResponse | null>(null);
	let winnersStatus = $state<LoadStatus>('idle');

	async function loadWinners(typ: string, st: string, eb: string): Promise<void> {
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
			// Stale-Guard: bei schnellem Reihe/Ebene-Wechsel darf eine langsame
			// alte Response die neuere Auswahl nicht ueberschreiben.
			if (typ !== portal.reihe || st !== stimmtypForReihe(portal.reihe) || eb !== portal.ebene) {
				return;
			}
			winnersResponse = data;
			winnersStatus = 'loaded';
		} catch {
			if (typ !== portal.reihe || eb !== portal.ebene) return;
			winnersStatus = 'error';
		}
	}

	$effect(() => {
		void loadWinners(portal.reihe, stimmtyp, portal.ebene);
	});

	const winnersForJahr = $derived(
		winnersResponse && jahr !== null ? filterWinnersByJahr(winnersResponse.winners, jahr) : []
	);
	const hasAnyWinners = $derived((winnersResponse?.winners.length ?? 0) > 0);
	const repeatElection = $derived(isRepeatElectionYear(winnersForJahr));

	/**
	 * Einmal true sobald die Karte zum ersten Mal zeigbar war, danach NIE mehr
	 * false (Boundary/Live-Fund 19.09.: Reihe/Jahr/Ebene-Wechsel dürfen die
	 * bestehende Map-Instanz nur aktualisieren, niemals destroyen/aus dem DOM
	 * nehmen -- ein zwischenzeitlicher `winnersStatus==='loading'` bei
	 * Cache-Miss der neuen Reihe×Ebene-Kombination darf den Karten-Branch
	 * nicht mehr aus dem `{#if}` herausfallen lassen).
	 */
	let mapShown = $state(false);
	const readyToShow = $derived(winnersStatus === 'loaded' && hasAnyWinners && jahr !== null);
	$effect(() => {
		if (readyToShow) mapShown = true;
	});

	// Geometrie, gecacht pro Ebene. Kein Fetch ohne Winners-Daten (Boundary DB-los). ---
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
			// Stale-Guard analog loadWinners.
			if (ebene !== portal.ebene) return;
			geometry = next;
			geometryStatus = 'loaded';
		} catch {
			if (ebene !== portal.ebene) return;
			geometryStatus = 'error';
		}
	}

	$effect(() => {
		// DB-los-Guard nur vor dem allerersten Zeigen der Karte (Boundary: kein
		// MapLibre-Init ohne Daten); danach lädt ein Ebenen-Wechsel die
		// Geometrie immer nach, auch wenn die neue Reihe×Ebene-Kombination
		// zufällig 0 Winners-Rows hat (sonst Geometrie/Ebene-Mismatch).
		if (!mapShown && !hasAnyWinners) return;
		void loadGeometry(portal.ebene);
	});

	const joinedFc = $derived<WinnerFeatureCollection | null>(
		// Nur joinen, wenn die geladene Geometrie zur aktuellen Ebene gehoert;
		// sonst mischt ein Ebenen-Wechsel uebergangsweise alte Flaechen mit
		// neuen Winners (alles unmatched -> neutrale Blitz-Karte).
		geometry && geometry.ebene === portal.ebene
			? joinWinnersToFeatures(geometry.fc, geometry.slugs, geometry.names, winnersForJahr)
			: null
	);
	const tableRows = $derived<WinnerTableRow[]>(joinedFc ? buildTableRows(joinedFc) : []);
	const totalGebiete = $derived(geometry?.fc.features.length ?? 0);
	const takeawayText = $derived(buildTakeawaySentence(tableRows, totalGebiete));
	const occurringParteien = $derived(
		Array.from(new Set(tableRows.map((r) => r.partei))).sort((a, b) => a.localeCompare(b, 'de'))
	);
	const aggregationHinweis = $derived(aggregationHinweisText(portal.ebene));

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

	// Ebene-Wechsel invalidiert eine evtl. aktive Adress-Hervorhebung (das
	// hervorgehobene Feature gehört zur alten Geometrie/Ebene).
	$effect(() => {
		void portal.ebene;
		addressHint = null;
		mapCtl.highlight(joinedFc, null);
	});

	async function handleAddressSelect(s: GeocodeSuggestion): Promise<void> {
		let ctx;
		try {
			ctx = await resolveSpatialLevel(s.lat, s.lng, fetchFn);
		} catch {
			addressHint = 'Adresse konnte nicht aufgelöst werden.';
			return;
		}
		const slug = portal.ebene === 'bezirk' ? ctx.bezirkSlug : ctx.kiezSlug;
		const name = portal.ebene === 'bezirk' ? ctx.bezirkName : ctx.kiezName;
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

	const ebeneLabel = $derived(EBENE_LABELS[portal.ebene]);
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

	{#if mapShown && (winnersStatus === 'error' || geometryStatus === 'error' || !hasAnyWinners)}
		<p data-testid="winner-map-status-hinweis" role="status" class="font-mono text-xs text-ink-subtle">
			{winnersStatus === 'error' || geometryStatus === 'error'
				? 'Aktualisierung fehlgeschlagen, die Karte zeigt den letzten Stand.'
				: 'Für diese Auswahl liegen keine Gebiets-Ergebnisse vor.'}
		</p>
	{/if}

	{#if !mapShown && (winnersStatus === 'error' || geometryStatus === 'error')}
		<p data-testid="winner-map-error" role="alert" class="font-serif text-ink-muted">
			Wahl-Daten konnten nicht geladen werden.
		</p>
	{:else if !mapShown && winnersStatus !== 'loaded'}
		<p data-testid="winner-map-loading" class="font-serif text-ink-muted">
			Lädt Wahl-Ergebnisse …
		</p>
	{:else if !mapShown && (!hasAnyWinners || jahr === null)}
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
