<script lang="ts">
	import { X, RotateCcw, SlidersHorizontal } from '@lucide/svelte';
	import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
	import { PARTEI_FARBEN, type ParteiKurzname } from '$lib/data/partei-farben.js';
	import { trackEvent } from '$lib/utils/plausible.js';
	import {
		publishUserFinderState,
		peekPendingAgentWeights,
		consumePendingAgentWeights,
		setFinderPanelActive,
		type FinderTopMatch
	} from '$lib/state/finder-bridge.svelte.js';
	import {
		buildFinderCollection,
		buildParteiMetric,
		type FinderBaseData,
		type KiezShareRow
	} from './internal/kiez-finder-data.js';
	import {
		FINDER_LAYER_ID,
		FINDER_SOURCE_ID,
		fitColorExpression,
		fitDomain,
		fitOpacityExpression,
		hasActiveWeights,
		neutralWeights,
		topResults,
		type FinderResult,
		type FinderWeights
	} from './internal/kiez-finder-engine.js';

	/** Minimaler Map-Ausschnitt, den das Panel braucht (testbar ohne MapLibre). */
	export interface FinderMapApi {
		getSource: (id: string) => unknown;
		addSource: (id: string, source: { type: 'geojson'; data: unknown }) => void;
		removeSource: (id: string) => void;
		getLayer: (id: string) => unknown;
		addLayer: (spec: Record<string, unknown>) => void;
		removeLayer: (id: string) => void;
		moveLayer: (id: string) => void;
		setPaintProperty: (id: string, prop: string, value: unknown) => void;
	}

	type Props = {
		map: FinderMapApi | null;
		/** Injektierbar für Tests; Default lädt die echten Quellen. */
		loadData?: () => Promise<FinderBaseData>;
		loadShares?: (election: string) => Promise<readonly KiezShareRow[]>;
		onClose?: () => void;
	};

	const ELECTION = '2025-btw-zweitstimme';

	async function defaultLoadData(): Promise<FinderBaseData> {
		const { loadFinderBaseData } = await import('./internal/kiez-finder-data.js');
		return loadFinderBaseData();
	}

	async function defaultLoadShares(election: string): Promise<readonly KiezShareRow[]> {
		const res = await fetch(`/api/wahl/kiez-shares?election=${election}`);
		if (!res.ok) return [];
		const body = (await res.json()) as { shares?: KiezShareRow[] };
		return body.shares ?? [];
	}

	let {
		map,
		loadData = defaultLoadData,
		loadShares = defaultLoadShares,
		onClose
	}: Props = $props();

	// Slider-Definitionen: Score-Dimensionen und Dichte bipolar, Nähe unipolar.
	const BIPOLAR = [
		{ key: 'ruheLuft', label: 'Ruhe & Luft', low: 'wenig', high: 'viel' },
		{ key: 'gruenHitze', label: 'Grün & Hitzeschutz', low: 'wenig', high: 'viel' },
		{ key: 'mobilitaet', label: 'Mobilität', low: 'wenig', high: 'viel' },
		{ key: 'versorgung', label: 'Versorgung', low: 'wenig', high: 'viel' },
		{ key: 'wohnschutz', label: 'Wohnschutz', low: 'wenig', high: 'viel' },
		{ key: 'kultur', label: 'Kulturangebot', low: 'wenig', high: 'viel' },
		{ key: 'dichte', label: 'Bebauung & Dichte', low: 'locker', high: 'dicht' }
	] as const;
	const UNIPOLAR = [
		{ key: 'sbahn', label: 'S-Bahn-Nähe', low: 'egal', high: 'nah' },
		{ key: 'partei', label: 'Wahlverhalten ähnlich', low: 'egal', high: 'ähnlich' }
	] as const;

	const STUFEN_BIPOLAR = ['möglichst wenig', 'eher wenig', 'egal', 'eher viel', 'möglichst viel'];

	let weights = $state<FinderWeights>(neutralWeights());
	let partei = $state<ParteiKurzname>('SPD');
	let loading = $state(true);
	let loadFailed = $state(false);
	let top = $state<FinderResult[]>([]);

	let base: FinderBaseData | null = null;
	let sharesCache: readonly KiezShareRow[] | null = null;
	let collection: FeatureCollection<Polygon | MultiPolygon> | null = null;
	// Für welche Partei m_partei tatsächlich gebaut wurde: die Collection
	// trägt IMMER ein m_partei-Property (Neutral-Fallback), dessen Existenz
	// sagt also nichts über geladene Daten aus.
	let loadedPartei: ParteiKurzname | null = null;

	const PARTEIEN = Object.keys(PARTEI_FARBEN).filter(
		(p) => p !== 'Sonstige' && p !== 'CSU' && p !== 'FREIE WÄHLER'
	) as ParteiKurzname[];

	async function rebuildCollection(): Promise<void> {
		if (!base) return;
		const metrics = { ...base.metrics };
		if (weights.partei !== 0) {
			if (!sharesCache) sharesCache = await loadShares(ELECTION);
			metrics.m_partei = buildParteiMetric(sharesCache, base.plrIds, partei);
			loadedPartei = partei;
		} else {
			loadedPartei = null;
		}
		collection = buildFinderCollection(base.plrFc, metrics, base.kiezNames);
		if (!map) return;
		if (!map.getSource(FINDER_SOURCE_ID)) {
			map.addSource(FINDER_SOURCE_ID, { type: 'geojson', data: collection });
		} else {
			(map.getSource(FINDER_SOURCE_ID) as { setData?: (d: unknown) => void }).setData?.(collection);
		}
	}

	let rafId: number | null = null;
	let fallbackId: ReturnType<typeof setTimeout> | null = null;

	function runPaint(): void {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		if (fallbackId !== null) {
			clearTimeout(fallbackId);
			fallbackId = null;
		}
		void paint();
	}

	/**
	 * Agent-Browser (ChatGPT Atlas, Automations-Chrome) fahren die Seite in
	 * einem versteckten Tab; dort feuert requestAnimationFrame nie. Ohne den
	 * Timeout-Fallback blieb die Top-Liste für die WebMCP-Tools dauerhaft
	 * leer (Prod-Bug 26.08.). Wer zuerst feuert, malt; der andere wird
	 * abgeräumt.
	 */
	function applyWeights(): void {
		if (rafId !== null || fallbackId !== null) return;
		rafId = requestAnimationFrame(runPaint);
		fallbackId = setTimeout(runPaint, 100);
	}

	/**
	 * Die Rangliste ist eine reine Funktion über die Finder-Kollektion und
	 * wird veröffentlicht, bevor die Karte ins Spiel kommt: die WebMCP-Tools
	 * sollen Treffer bekommen, auch wenn die MapLibre-Instanz fehlt oder
	 * noch nicht bereit ist. Das Einfärben passiert danach, sofern eine
	 * Karte da ist.
	 */
	async function paint(): Promise<void> {
		if (!base) return;
		if (!hasActiveWeights(weights)) {
			if (map?.getLayer(FINDER_LAYER_ID)) map.removeLayer(FINDER_LAYER_ID);
			top = [];
			publishUserFinderState(weights, [], { vomNutzer: false, party: partei });
			return;
		}
		if (!collection || (weights.partei !== 0 && loadedPartei !== partei)) {
			await rebuildCollection();
		}
		if (!collection) return;
		// Kontrast-Spreizung über die reale Verteilung: alle 542 Fits sind für
		// die Top-Liste ohnehin berechnet.
		const allResults = topResults(collection, weights, collection.features.length);
		top = allResults.slice(0, 5);
		publishUserFinderState(weights, alsMatches(top), { vomNutzer: false, party: partei });
		if (!map) return;
		// Quelle sicherstellen: das Panel kann mounten, bevor die Map bereit
		// war; dann lief rebuildCollection ohne Quelle und addLayer fiele um.
		if (!map.getSource(FINDER_SOURCE_ID)) {
			map.addSource(FINDER_SOURCE_ID, { type: 'geojson', data: collection });
		}
		const domain = fitDomain(allResults.map((r) => r.fit));
		const expression = fitColorExpression(weights, domain);
		const opacity = fitOpacityExpression(weights, domain);
		if (!map.getLayer(FINDER_LAYER_ID)) {
			map.addLayer({
				id: FINDER_LAYER_ID,
				type: 'fill',
				source: FINDER_SOURCE_ID,
				paint: {
					'fill-color': expression,
					'fill-opacity': opacity,
					'fill-outline-color': '#ECEAE0'
				}
			});
			map.moveLayer(FINDER_LAYER_ID);
		} else {
			map.setPaintProperty(FINDER_LAYER_ID, 'fill-color', expression);
			map.setPaintProperty(FINDER_LAYER_ID, 'fill-opacity', opacity);
		}
	}

	// Bridge-Spiegel (WebMCP-Kollaboration): Panel-Zustand für die Tools
	// sichtbar machen. vomNutzer=false hält die Quelle beim Agenten, wenn
	// nur der Paint die Top-Liste nachliefert.
	function alsMatches(results: FinderResult[]): FinderTopMatch[] {
		return results.map((r) => ({
			plrId: r.plrId,
			name: r.name,
			fit: r.fit,
			lng: r.lng,
			lat: r.lat
		}));
	}

	function setWeight(key: keyof FinderWeights, value: number): void {
		weights = { ...weights, [key]: value };
		publishUserFinderState(weights, alsMatches(top), { vomNutzer: true, party: partei });
		applyWeights();
	}

	// Agent-Schreibwünsche (set_finder_weights) anwenden, sobald sie da sind.
	$effect(() => {
		const pending = peekPendingAgentWeights();
		if (!pending) return;
		consumePendingAgentWeights();
		if (pending.party && pending.party !== partei) {
			partei = pending.party as ParteiKurzname;
			collection = null;
		}
		weights = { ...pending.weights };
		applyWeights();
	});

	// Panel-Sichtbarkeit für get_finder_state spiegeln.
	$effect(() => {
		setFinderPanelActive(true);
		return () => setFinderPanelActive(false);
	});

	async function onParteiChange(next: ParteiKurzname): Promise<void> {
		partei = next;
		collection = null;
		await rebuildCollection();
		applyWeights();
	}

	function reset(): void {
		weights = neutralWeights();
		publishUserFinderState(weights, [], { vomNutzer: true, party: partei });
		applyWeights();
	}

	/**
	 * Nutzungs-Event beim Verlassen: welche Kriterien aktiv waren, nicht
	 * welche Werte (und bewusst nie die gewählte Partei).
	 */
	function trackNutzung(): void {
		const aktive = (Object.keys(weights) as Array<keyof FinderWeights>).filter(
			(key) => weights[key] !== 0
		);
		if (aktive.length === 0) return;
		trackEvent('Finder', {
			action: 'nutzung',
			kriterien: aktive.join('+'),
			anzahl: aktive.length
		});
	}

	function teardown(): void {
		trackNutzung();
		if (!map) return;
		// Beim Seiten-Wechsel kann MapLibre die Map schon zerstört haben,
		// dann wirft jeder Style-Zugriff. Der Layer stirbt mit der Map,
		// aufräumen ist dann ohnehin überflüssig.
		try {
			if (map.getLayer(FINDER_LAYER_ID)) map.removeLayer(FINDER_LAYER_ID);
			if (map.getSource(FINDER_SOURCE_ID)) map.removeSource(FINDER_SOURCE_ID);
		} catch {
			// Map bereits removed: nichts zu tun.
		}
	}

	$effect(() => {
		let cancelled = false;
		void (async () => {
			try {
				base = await loadData();
				if (cancelled) return;
				await rebuildCollection();
				loading = false;
				// Agent-Gewichte können per Broadcast VOR dem Load angekommen
				// sein; der frühe paint() lief dann ins Leere. Einmal nachmalen
				// (No-op ohne aktive Gewichte).
				applyWeights();
			} catch {
				if (!cancelled) {
					loadFailed = true;
					loading = false;
				}
			}
		})();
		return () => {
			cancelled = true;
			teardown();
		};
	});

	function stufenText(value: number, low: string, high: string): string {
		if (value === 0) return 'egal';
		const grad = Math.abs(value) === 2 ? 'möglichst' : 'eher';
		return `${grad} ${value < 0 ? low : high}`;
	}
	void STUFEN_BIPOLAR;
</script>

<section
	data-testid="finder-panel"
	class="flex h-full flex-col overflow-hidden bg-bg-elevated text-ink"
>
	<header
		class="sticky top-0 z-10 flex items-center gap-2 border-b border-rule bg-bg-elevated px-4 py-3"
	>
		<SlidersHorizontal size={16} aria-hidden="true" class="text-accent" />
		<h2 class="flex-1 font-serif text-lg leading-tight text-ink">Kiez-Finder</h2>
		<button
			type="button"
			data-testid="finder-close"
			aria-label="Kiez-Finder schließen"
			onclick={() => onClose?.()}
			class="hover:text-vermillion p-0.5 text-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
		>
			<X size={14} aria-hidden="true" />
		</button>
	</header>

	<div class="flex-1 overflow-y-auto px-4 py-3">
		{#if loading}
			<p class="py-6 text-center font-mono text-xs text-ink-muted" role="status">
				Daten werden geladen …
			</p>
		{:else if loadFailed}
			<p class="py-6 text-center font-mono text-xs text-ink-muted" role="alert">
				Daten nicht ladbar. Später erneut versuchen.
			</p>
		{:else}
			<p class="mb-2 font-serif text-xs leading-snug text-ink-muted">
				Verschiebe die Regler, die Karte färbt sich sofort: dunkel heißt hohe Passung.
			</p>

			{#each BIPOLAR as def (def.key)}
				<div class="mb-2">
					<div class="flex items-baseline justify-between">
						<label for={`finder-${def.key}`} class="font-sans text-xs text-ink">{def.label}</label>
						<span class="font-mono text-[10px] text-ink-subtle">
							{stufenText(weights[def.key], def.low, def.high)}
						</span>
					</div>
					<input
						id={`finder-${def.key}`}
						data-testid={`finder-slider-${def.key}`}
						type="range"
						min="-2"
						max="2"
						step="1"
						value={weights[def.key]}
						aria-label={`${def.label}: ${def.low} bis ${def.high}`}
						aria-valuetext={stufenText(weights[def.key], def.low, def.high)}
						oninput={(e) => setWeight(def.key, Number(e.currentTarget.value))}
						class="finder-range w-full"
					/>
				</div>
			{/each}

			{#each UNIPOLAR as def (def.key)}
				<div class="mb-2">
					<div class="flex items-baseline justify-between">
						<label for={`finder-${def.key}`} class="font-sans text-xs text-ink">{def.label}</label>
						<span class="font-mono text-[10px] text-ink-subtle">
							{weights[def.key] === 0
								? 'egal'
								: weights[def.key] === 1
									? `eher ${def.high}`
									: `möglichst ${def.high}`}
						</span>
					</div>
					<input
						id={`finder-${def.key}`}
						data-testid={`finder-slider-${def.key}`}
						type="range"
						min="0"
						max="2"
						step="1"
						value={weights[def.key]}
						aria-label={`${def.label}: ${def.low} bis ${def.high}`}
						oninput={(e) => setWeight(def.key, Number(e.currentTarget.value))}
						class="finder-range w-full"
					/>
				</div>
			{/each}

			{#if weights.partei > 0}
				<div class="mb-2 flex flex-wrap gap-1" role="group" aria-label="Partei wählen">
					{#each PARTEIEN as p (p)}
						<button
							type="button"
							data-testid={`finder-partei-${p}`}
							aria-pressed={partei === p}
							onclick={() => void onParteiChange(p)}
							class="rounded-sm border px-1.5 py-0.5 font-mono text-[10px] {partei === p
								? 'border-accent bg-accent text-bg'
								: 'border-rule text-ink-muted hover:text-ink'}"
						>
							{p}
						</button>
					{/each}
				</div>
			{/if}

			{#if top.length > 0}
				<div class="mt-3 border-t border-rule pt-2">
					<h3 class="mb-1 font-mono text-[10px] tracking-wider text-ink-subtle uppercase">
						Beste Passung
					</h3>
					<ol data-testid="finder-top-list" class="flex flex-col gap-0.5">
						{#each top as result (result.plrId)}
							<li class="flex items-baseline justify-between gap-2">
								<span class="min-w-0 truncate font-serif text-xs text-ink">
									{result.name}{#if result.kiez && result.kiez !== result.name}
										<span class="text-ink-subtle">· {result.kiez}</span>
									{/if}
								</span>
								<span class="tabular font-mono text-xs text-ink">{Math.round(result.fit)}</span>
							</li>
						{/each}
					</ol>
				</div>
			{/if}

			<div class="mt-3 flex items-center justify-between border-t border-rule pt-2">
				<button
					type="button"
					data-testid="finder-reset"
					onclick={reset}
					class="inline-flex items-center gap-1 font-mono text-[10px] tracking-wider text-ink-muted uppercase hover:text-ink"
				>
					<RotateCcw size={11} aria-hidden="true" />
					Zurücksetzen
				</button>
			</div>

			<p class="mt-2 font-serif text-[10px] leading-snug text-ink-subtle">
				Die Karte bewertet weder Nachbarschaften noch Menschen, sie zeigt nur, wie gut eine Gegend
				zu deinen Reglern passt. Wahlverhalten: Zweitstimmen BTW 2025 (Bundeswahlleiterin).
			</p>
		{/if}
	</div>
</section>

<style>
	.finder-range {
		accent-color: var(--accent, #2a3f7c);
		height: 1.1rem;
	}
</style>
