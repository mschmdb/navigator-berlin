<script lang="ts">
	/**
	 * Story 8, Kapitel „Trends" (CAP-5 + CAP-8): Kiez-Choropleth mit Toggle
	 * Trend|Volatilität (Partei-Chips für Trend). Trend/Volatilität kommen NUR
	 * aus `/api/wahl/analytik` (Kiez-only, kein Bezirk-Toggle an dieser Karte
	 * -- Boundary: die API liefert bewusst nur `ebene=kiez`).
	 *
	 * Story 12: der Sankey „Wahljahre im Übergang" zog in ein eigenes Kapitel
	 * um (`+page.svelte`, Section `uebergaenge`) -- er versteckte sich hier
	 * vorher als Unterabschnitt ohne eigenen Nav-Eintrag.
	 */
	import { m } from '$lib/paraglide/messages.js';
	import { getWahlPortalState } from '$lib/state/wahl-portal-context.svelte.js';
	import { stimmtypForReihe } from '$lib/utils/wahl-portal-url-state.js';
	import { sourceDisplayLabel, licenseDisplayLabel } from '$lib/data/wahl-labels.js';
	import { formatPercentagePointsDelta, type LocaleFormatOptions } from '$lib/i18n/format.js';
	import { parteiColor } from '$lib/data/partei-farben.js';
	import { FINDER_PARTIES } from '$lib/components/atlas/internal/kiez-finder-engine.js';
	import DataTableAlternative, {
		type TableColumn
	} from '$lib/components/atlas/data-table-alternative.svelte';
	import { AnalytikLoader } from './internal/trends-analytik.svelte.js';
	import { KiezBezirkGeometryLoader } from './internal/winner-map-geometry.svelte.js';
	import { nextRadioIndex } from './internal/radiogroup-keyboard.js';
	import {
		bakeTrendsProperties,
		type BakedTrendsFeatureCollection
	} from './internal/trends-map-expressions.js';
	import {
		NEUTRAL_OPACITY,
		TrendsMapController,
		type TrendsMapControllerOptions
	} from './internal/trends-kapitel-maplibre.svelte.js';
	import { blendOverBasemap } from './internal/wechsel-map-data.js';
	import {
		buildTrendsFeatureCollection,
		buildTrendsTableRows,
		buildTrendTakeaway,
		buildVolatilitaetTakeaway,
		kiezCoverageHinweisText,
		TREND_FALLEND_DUNKEL,
		TREND_FALLEND_HELL,
		TREND_NEUTRAL_FARBE,
		TREND_STEIGEND_DUNKEL,
		TREND_STEIGEND_HELL,
		TRENDS_FILL_OPACITY,
		buildVolatilitaetLegende,
		volatilitaetTerzileFor,
		TREND_SCHWELLE_LEICHT,
		TREND_SCHWELLE_STARK,
		type TrendsGebietInput,
		type TrendsToggle,
		type TrendsTableRow
	} from './internal/trends-map-data.js';

	interface LegendeEintrag {
		readonly label: string;
		readonly farbe: string;
		/** Default `TRENDS_FILL_OPACITY`; „Keine Daten" nutzt die Karten-
		 * Deckkraft für Gebiete ohne Analytik-Eintrag (`NEUTRAL_OPACITY`). */
		readonly opacity?: number;
	}

	function swatchStyle(farbe: string, opacity: number): string {
		const [r, g, b] = blendOverBasemap(farbe, opacity);
		return `background-color: rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)});`;
	}

	/** Signierter Schwellen-Wert (z. B. `−1,0`/`+0,2`) ohne die `Pp.`/`pp`-Einheit
	 * -- die Legende haengt ihre eigene Einheit „Pp./Jahr" an (Delegiert an
	 * `formatPercentagePointsDelta`: echtes Minuszeichen + Locale-Dezimaltrennzeichen
	 * bleiben dadurch identisch zur zentralen Formatierung, nur die Einheit
	 * unterscheidet sich vom Pp.-Bestandsformat). */
	function schwellenWert(value: number, opts?: LocaleFormatOptions): string {
		return formatPercentagePointsDelta(value, opts).replace(/\s?(Pp\.|pp)$/, '');
	}

	/** Wie `schwellenWert`, aber ohne Vorzeichen (fuer die „Stabil"-Zeile mit `±`). */
	function bareSchwellenWert(value: number, opts?: LocaleFormatOptions): string {
		return schwellenWert(value, opts).replace(/^[+−]/, '');
	}

	type Props = {
		/** Injizierbar für Tests; Default = globales `fetch`. */
		fetchFn?: typeof fetch;
		/** Injizierbar für Tests (Fake-MapLibre-Naht, Muster
		 * `trends-kapitel-maplibre.svelte.test.ts`) -- ohne diesen Haken lief die
		 * Verdrahtung Toggle/Chip -> `setPaintProperty` in keinem
		 * Komponenten-Test (Review Triage Log #14). */
		mapFactory?: TrendsMapControllerOptions['mapFactory'];
	};
	let { fetchFn = fetch, mapFactory }: Props = $props();

	function figureLabel(toggleWert: TrendsToggle): string {
		return toggleWert === 'trend'
			? m.wahl_portal_figure_label_trend()
			: m.wahl_portal_figure_label_volatilitaet();
	}

	const portal = getWahlPortalState();
	const stimmtyp = $derived(stimmtypForReihe(portal.reihe));

	let toggle = $state<TrendsToggle>('trend');
	let aktivePartei = $state<string>(FINDER_PARTIES[0]);
	let toggleButtons: HTMLButtonElement[] = $state([]);
	let parteiButtons: HTMLButtonElement[] = $state([]);

	const TOGGLE_WERTE: readonly TrendsToggle[] = ['trend', 'volatilitaet'];

	function toggleLabel(toggleWert: TrendsToggle): string {
		return toggleWert === 'trend'
			? m.wahl_portal_toggle_trend()
			: m.wahl_portal_toggle_volatilitaet();
	}

	function onToggleKeydown(event: KeyboardEvent, index: number): void {
		const next = nextRadioIndex(event.key, index, TOGGLE_WERTE.length);
		if (next === null) return;
		event.preventDefault();
		toggleButtons[next]?.focus();
		toggle = TOGGLE_WERTE[next];
	}

	function onParteiKeydown(event: KeyboardEvent, index: number): void {
		if (toggle !== 'trend') return;
		const next = nextRadioIndex(event.key, index, FINDER_PARTIES.length);
		if (next === null) return;
		event.preventDefault();
		parteiButtons[next]?.focus();
		aktivePartei = FINDER_PARTIES[next];
	}

	// svelte-ignore state_referenced_locally -- fetchFn ist ein Test-/DI-Prop.
	const analytikLoader = new AnalytikLoader(fetchFn);
	// svelte-ignore state_referenced_locally
	const geometryLoader = new KiezBezirkGeometryLoader(fetchFn);

	$effect(() => {
		const expectedTyp = portal.reihe;
		const expectedStimmtyp = stimmtyp;
		void analytikLoader.load(
			expectedTyp,
			expectedStimmtyp,
			() => portal.reihe !== expectedTyp || stimmtypForReihe(portal.reihe) !== expectedStimmtyp
		);
	});

	$effect(() => {
		void geometryLoader.load('kiez', () => false);
	});

	const gebiete = $derived(analytikLoader.response?.gebiete ?? []);
	const gebieteBySlug = $derived(
		new Map<string, TrendsGebietInput>(gebiete.map((g) => [g.kiez_slug, g]))
	);
	const geometry = $derived(geometryLoader.geometry);

	const thinFc = $derived.by(() => {
		if (!geometry) return null;
		return buildTrendsFeatureCollection(
			geometry.fc,
			geometry.slugs,
			geometry.names,
			gebieteBySlug,
			toggle,
			aktivePartei
		);
	});
	const bakedFc = $derived.by<BakedTrendsFeatureCollection | null>(() => {
		if (!geometry) return null;
		return bakeTrendsProperties(
			geometry.fc,
			geometry.slugs,
			geometry.names,
			gebieteBySlug,
			FINDER_PARTIES
		);
	});

	/** Legenden datengetrieben (Review Triage Log #7/#8): Labels nennen die
	 * Klassifizierungs-Schwellen, Swatch-Farben kommen aus `blendOverBasemap`
	 * (dieselbe Blend-Herleitung wie die Karte, statt CSS-`opacity` über den
	 * Seitengrund -- das zeigte vorher eine andere Farbe als die Karte).
	 * `$derived` statt Modul-Konstante: Labels lesen `getLocale()` beim Aufruf
	 * (i18n Block B, keine Texte als Modul-Konstanten). */
	const TREND_LEGENDE = $derived<readonly LegendeEintrag[]>([
		{
			label: m.wahl_portal_trend_legende_ab({
				label: m.wahl_portal_trend_label_stark_fallend(),
				wert: schwellenWert(-TREND_SCHWELLE_STARK)
			}),
			farbe: TREND_FALLEND_DUNKEL
		},
		{
			label: m.wahl_portal_trend_legende_ab({
				label: m.wahl_portal_trend_label_leicht_fallend(),
				wert: schwellenWert(-TREND_SCHWELLE_LEICHT)
			}),
			farbe: TREND_FALLEND_HELL
		},
		{
			label: m.wahl_portal_trend_legende_stabil({ wert: bareSchwellenWert(TREND_SCHWELLE_LEICHT) }),
			farbe: TREND_NEUTRAL_FARBE
		},
		{
			label: m.wahl_portal_trend_legende_ab({
				label: m.wahl_portal_trend_label_leicht_steigend(),
				wert: schwellenWert(TREND_SCHWELLE_LEICHT)
			}),
			farbe: TREND_STEIGEND_HELL
		},
		{
			label: m.wahl_portal_trend_legende_ab({
				label: m.wahl_portal_trend_label_stark_steigend(),
				wert: schwellenWert(TREND_SCHWELLE_STARK)
			}),
			farbe: TREND_STEIGEND_DUNKEL
		},
		{
			label: m.wahl_portal_keine_daten_label(),
			farbe: TREND_NEUTRAL_FARBE,
			opacity: NEUTRAL_OPACITY
		}
	]);

	/** Klassen = Drittel der Kieze dieser Reihe; Karte und Legende nutzen
	 * dieselben Terzile (`volatilitaetTerzileFor`). */
	const volatilitaetLegende = $derived<readonly LegendeEintrag[]>(
		buildVolatilitaetLegende(
			volatilitaetTerzileFor(gebieteBySlug, geometry?.slugs ?? []),
			thinFc?.features.some((f) => f.properties.hat_daten === 0) ?? false
		).map((e) => ({
			label: e.label,
			farbe: e.farbe,
			opacity: e.keineDaten ? NEUTRAL_OPACITY : undefined
		}))
	);

	const tableRows = $derived<TrendsTableRow[]>(thinFc ? buildTrendsTableRows(thinFc, toggle) : []);
	const takeawayText = $derived(
		thinFc
			? toggle === 'trend'
				? buildTrendTakeaway(thinFc, aktivePartei)
				: buildVolatilitaetTakeaway(thinFc)
			: ''
	);

	const analytikStatus = $derived(analytikLoader.status);
	const geometryStatus = $derived(geometryLoader.status);
	/** Ein Geometrie-Fehler zählt IMMER als Fehler, unabhängig von `gebiete.length`
	 * -- vorher verschwand ein Geometrie-Fehler bei leerer Analytik hinter dem
	 * `isEmpty`-Zweig ("noch keine Daten" statt Fehler, Review Triage Log #11).
	 * `'idle'` (Loader noch nicht gestartet) zählt nicht als Fehler. */
	const isError = $derived(analytikStatus === 'error' || geometryStatus === 'error');
	const isLoading = $derived(
		!isError && (analytikStatus !== 'loaded' || (gebiete.length > 0 && geometryStatus !== 'loaded'))
	);
	const isEmpty = $derived(!isError && !isLoading && gebiete.length === 0);
	const showInhalt = $derived(!isError && !isLoading && !isEmpty);

	const response = $derived(analytikLoader.response);

	// svelte-ignore state_referenced_locally -- mapFactory ist ein Test-/DI-Prop.
	const mapCtl = new TrendsMapController({
		getFc: () => bakedFc,
		getToggle: () => toggle,
		getAktivePartei: () => aktivePartei,
		mapFactory
	});
	$effect(() => {
		mapCtl.ensureMap(bakedFc);
	});
	$effect(() => {
		// Liest toggle/aktivePartei, damit der Effect bei jedem Chip-/Toggle-
		// Wechsel erneut läuft (AC: setPaintProperty, kein neuer Request).
		void toggle;
		void aktivePartei;
		mapCtl.repaint();
	});
	$effect(() => {
		return () => mapCtl.destroy();
	});

	const tableColumns: TableColumn<TrendsTableRow>[] = [
		{
			key: 'gebiet',
			label: m.wahl_portal_spalte_gebiet(),
			sortable: true,
			accessor: (r) => r.gebiet
		},
		{ key: 'wert', label: m.wahl_portal_spalte_wert(), sortable: true, accessor: (r) => r.wert }
	];
</script>

{#if isError}
	<p data-testid="trends-kapitel-error" role="alert" class="font-serif text-ink-muted">
		{m.wahl_portal_wahldaten_error()}
	</p>
{:else if isLoading}
	<p data-testid="trends-kapitel-loading" class="font-serif text-ink-muted">
		{m.wahl_portal_trends_loading()}
	</p>
{:else if isEmpty}
	<p data-testid="trends-kapitel-empty" class="font-serif text-ink-muted">
		{m.wahl_portal_trends_empty()}
	</p>
{:else if showInhalt}
	<div data-testid="trends-kapitel" class="flex flex-col gap-6">
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-1.5">
				<span
					id="trends-toggle-label"
					class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
				>
					{m.wahl_portal_feld_ansicht()}
				</span>
				<div
					role="radiogroup"
					aria-labelledby="trends-toggle-label"
					data-testid="trends-kapitel-toggle"
					class="flex flex-wrap gap-1"
				>
					{#each TOGGLE_WERTE as value, i (value)}
						{@const checked = toggle === value}
						<button
							bind:this={toggleButtons[i]}
							role="radio"
							type="button"
							data-testid={`trends-kapitel-toggle-${value}`}
							aria-checked={checked}
							tabindex={checked ? 0 : -1}
							onclick={() => (toggle = value)}
							onkeydown={(e) => onToggleKeydown(e, i)}
							class="rounded border border-ink px-2.5 py-1 font-mono text-xs transition-colors"
							class:bg-ink={checked}
							class:text-bg={checked}
							class:bg-bg={!checked}
							class:text-ink={!checked}
							class:hover:bg-bg-muted={!checked}
						>
							{toggleLabel(value)}
						</button>
					{/each}
				</div>
			</div>

			<div class="flex flex-col gap-1.5">
				<span
					id="trends-partei-label"
					class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
				>
					{m.wahl_portal_spalte_partei()}
				</span>
				<div
					role="radiogroup"
					aria-labelledby="trends-partei-label"
					aria-describedby={toggle !== 'trend' ? 'trends-partei-hinweis' : undefined}
					data-testid="trends-kapitel-parteien"
					class="flex flex-wrap gap-1"
				>
					{#each FINDER_PARTIES as partei, i (partei)}
						{@const checked = aktivePartei === partei}
						{@const disabled = toggle !== 'trend'}
						<button
							bind:this={parteiButtons[i]}
							role="radio"
							type="button"
							data-testid={`trends-kapitel-partei-${partei}`}
							aria-checked={checked}
							aria-disabled={disabled}
							tabindex={checked ? 0 : -1}
							onclick={() => !disabled && (aktivePartei = partei)}
							onkeydown={(e) => onParteiKeydown(e, i)}
							class="rounded border px-2.5 py-1 font-mono text-xs transition-colors"
							style={`border-color: ${parteiColor(partei)};`}
							class:bg-ink={checked}
							class:text-bg={checked}
							class:bg-bg={!checked}
							class:text-ink={!checked}
							class:hover:bg-bg-muted={!disabled && !checked}
							class:opacity-40={disabled}
							class:cursor-not-allowed={disabled}
						>
							{partei}
						</button>
					{/each}
				</div>
				{#if toggle !== 'trend'}
					<p
						id="trends-partei-hinweis"
						data-testid="trends-kapitel-partei-hinweis"
						class="font-mono text-xs text-ink-subtle"
					>
						{m.wahl_portal_partei_auswahl_nur_trend()}
					</p>
				{/if}
			</div>
		</div>

		<p
			data-testid="trends-kapitel-takeaway"
			class="max-w-prose font-serif text-lg leading-relaxed text-ink tabular-nums"
		>
			{takeawayText}
		</p>

		<figure aria-label={figureLabel(toggle)} data-testid="trends-kapitel-figure" class="space-y-3">
			<div class="relative h-[360px] w-full overflow-hidden rounded border border-rule">
				<div
					bind:this={mapCtl.container}
					role="img"
					aria-label={figureLabel(toggle)}
					data-testid="trends-kapitel-canvas"
					class="h-full w-full"
				></div>
			</div>
		</figure>

		<ul
			aria-describedby={toggle === 'volatilitaet'
				? 'trends-kapitel-volatilitaet-hinweis'
				: undefined}
			data-testid="trends-kapitel-legende"
			class="flex flex-wrap gap-3 border border-rule bg-bg p-3 font-mono text-xs text-ink"
		>
			{#each toggle === 'trend' ? TREND_LEGENDE : volatilitaetLegende as eintrag (eintrag.label)}
				<li class="flex items-center gap-1.5">
					<span
						aria-hidden="true"
						class="inline-block h-3.5 w-3.5 rounded-sm border border-rule-strong"
						style={swatchStyle(eintrag.farbe, eintrag.opacity ?? TRENDS_FILL_OPACITY)}
					></span>
					{eintrag.label}
				</li>
			{/each}
		</ul>
		{#if toggle === 'volatilitaet'}
			<p
				id="trends-kapitel-volatilitaet-hinweis"
				data-testid="trends-kapitel-volatilitaet-hinweis"
				class="font-mono text-xs text-ink-subtle"
			>
				{m.wahl_portal_volatilitaet_erklaerung()}
			</p>
		{/if}

		{#if response}
			<p
				data-testid="trends-kapitel-datenstand"
				class="font-mono text-xs text-ink-subtle tabular-nums"
			>
				{m.wahl_portal_datenstand_label({ source: sourceDisplayLabel(response.source_name) })}
				{#if response.license}
					· {m.wahl_portal_lizenz_suffix({ license: licenseDisplayLabel(response.license) })}
				{/if}
			</p>
		{/if}
		<p data-testid="trends-kapitel-coverage-hinweis" class="font-mono text-xs text-ink-subtle">
			{kiezCoverageHinweisText()}
		</p>

		<DataTableAlternative
			columns={tableColumns}
			rows={tableRows}
			caption={m.wahl_portal_trends_table_caption()}
			toggleLabel={m.wahl_portal_data_table_toggle()}
			closeLabel={m.wahl_portal_data_table_close()}
		/>
	</div>
{/if}
