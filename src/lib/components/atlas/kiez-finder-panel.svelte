<script lang="ts">
	import { X, RotateCcw, Sparkles, GripVertical } from '@lucide/svelte';
	import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
	import { PARTEI_FARBEN, type ParteiKurzname } from '$lib/data/partei-farben.js';
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

	const PARTEIEN = Object.keys(PARTEI_FARBEN).filter(
		(p) => p !== 'Sonstige' && p !== 'CSU' && p !== 'FREIE WÄHLER'
	) as ParteiKurzname[];

	async function rebuildCollection(): Promise<void> {
		if (!base) return;
		const metrics = { ...base.metrics };
		if (weights.partei !== 0) {
			if (!sharesCache) sharesCache = await loadShares(ELECTION);
			metrics.m_partei = buildParteiMetric(sharesCache, base.plrIds, partei);
		}
		collection = buildFinderCollection(base.plrFc, metrics);
		if (!map) return;
		if (!map.getSource(FINDER_SOURCE_ID)) {
			map.addSource(FINDER_SOURCE_ID, { type: 'geojson', data: collection });
		} else {
			(map.getSource(FINDER_SOURCE_ID) as { setData?: (d: unknown) => void }).setData?.(collection);
		}
	}

	let rafId: number | null = null;
	function applyWeights(): void {
		if (rafId !== null) return;
		rafId = requestAnimationFrame(() => {
			rafId = null;
			void paint();
		});
	}

	async function paint(): Promise<void> {
		if (!map || !base) return;
		if (!hasActiveWeights(weights)) {
			if (map.getLayer(FINDER_LAYER_ID)) map.removeLayer(FINDER_LAYER_ID);
			top = [];
			return;
		}
		if (!collection || (weights.partei !== 0 && !collection.features[0]?.properties?.m_partei)) {
			await rebuildCollection();
		}
		if (!collection || !map) return;
		// Quelle sicherstellen: das Panel kann mounten, bevor die Map bereit
		// war; dann lief rebuildCollection ohne Quelle und addLayer fiele um.
		if (!map.getSource(FINDER_SOURCE_ID)) {
			map.addSource(FINDER_SOURCE_ID, { type: 'geojson', data: collection });
		}
		// Kontrast-Spreizung über die reale Verteilung: alle 542 Fits sind für
		// die Top-Liste ohnehin berechnet.
		const allResults = topResults(collection, weights, collection.features.length);
		const domain = fitDomain(allResults.map((r) => r.fit));
		const expression = fitColorExpression(weights, domain);
		if (!map.getLayer(FINDER_LAYER_ID)) {
			map.addLayer({
				id: FINDER_LAYER_ID,
				type: 'fill',
				source: FINDER_SOURCE_ID,
				paint: {
					'fill-color': expression,
					'fill-opacity': 0.72,
					'fill-outline-color': '#ECEAE0'
				}
			});
			map.moveLayer(FINDER_LAYER_ID);
		} else {
			map.setPaintProperty(FINDER_LAYER_ID, 'fill-color', expression);
		}
		top = allResults.slice(0, 5);
	}

	function setWeight(key: keyof FinderWeights, value: number): void {
		weights = { ...weights, [key]: value };
		applyWeights();
	}

	async function onParteiChange(next: ParteiKurzname): Promise<void> {
		partei = next;
		collection = null;
		await rebuildCollection();
		applyWeights();
	}

	function reset(): void {
		weights = neutralWeights();
		applyWeights();
	}

	function teardown(): void {
		if (!map) return;
		if (map.getLayer(FINDER_LAYER_ID)) map.removeLayer(FINDER_LAYER_ID);
		if (map.getSource(FINDER_SOURCE_ID)) map.removeSource(FINDER_SOURCE_ID);
	}

	$effect(() => {
		let cancelled = false;
		void (async () => {
			try {
				base = await loadData();
				if (cancelled) return;
				await rebuildCollection();
				loading = false;
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

	// Drag: Pointer am Kopf verschiebt das Panel (Viewport-geklemmt).
	let dx = $state(0);
	let dy = $state(0);
	let dragging: { startX: number; startY: number; baseX: number; baseY: number } | null = null;
	let panelEl = $state<HTMLElement | null>(null);

	function onDragStart(event: PointerEvent): void {
		dragging = { startX: event.clientX, startY: event.clientY, baseX: dx, baseY: dy };
		window.addEventListener('pointermove', onDragMove);
		window.addEventListener('pointerup', onDragEnd, { once: true });
	}
	function onDragMove(event: PointerEvent): void {
		if (!dragging) return;
		const rect = panelEl?.getBoundingClientRect();
		let nextX = dragging.baseX + event.clientX - dragging.startX;
		let nextY = dragging.baseY + event.clientY - dragging.startY;
		if (rect) {
			const minX = dragging.baseX - rect.left + 8;
			const minY = dragging.baseY - rect.top + 8;
			nextX = Math.max(minX, nextX);
			nextY = Math.max(minY, nextY);
		}
		dx = nextX;
		dy = nextY;
	}
	function onDragEnd(): void {
		dragging = null;
		window.removeEventListener('pointermove', onDragMove);
	}

	function onKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') onClose?.();
	}

	/** Tastatur-Alternative zum Drag: Pfeiltasten verschieben in 16-px-Schritten. */
	function onHandleKeydown(event: KeyboardEvent): void {
		const step = 16;
		if (event.key === 'ArrowLeft') dx -= step;
		else if (event.key === 'ArrowRight') dx += step;
		else if (event.key === 'ArrowUp') dy -= step;
		else if (event.key === 'ArrowDown') dy += step;
		else return;
		event.preventDefault();
	}

	function stufenText(value: number, low: string, high: string): string {
		if (value === 0) return 'egal';
		const grad = Math.abs(value) === 2 ? 'möglichst' : 'eher';
		return `${grad} ${value < 0 ? low : high}`;
	}
	void STUFEN_BIPOLAR;
</script>

<div
	bind:this={panelEl}
	data-testid="finder-panel"
	role="dialog"
	aria-label="Kiez-Finder: Sag der Karte, was du suchst"
	tabindex="-1"
	onkeydown={onKeydown}
	class="absolute top-4 right-4 z-40 flex max-h-[calc(100%-2rem)] w-80 flex-col overflow-hidden rounded-sm border border-rule bg-bg-elevated/95 shadow-xl backdrop-blur-sm"
	style:transform="translate({dx}px, {dy}px)"
>
	<header class="flex items-center gap-2 border-b border-rule px-3 py-2 select-none">
		<button
			type="button"
			data-testid="finder-drag-handle"
			aria-label="Panel verschieben (ziehen oder Pfeiltasten)"
			onpointerdown={onDragStart}
			onkeydown={onHandleKeydown}
			class="cursor-grab p-0.5 text-ink-subtle hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
		>
			<GripVertical size={14} aria-hidden="true" />
		</button>
		<Sparkles size={14} aria-hidden="true" class="text-accent" />
		<h2 class="flex-1 font-sans text-sm font-medium text-ink">Kiez-Finder</h2>
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

	<div class="flex-1 overflow-y-auto px-3 py-2">
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
								<span class="truncate font-serif text-xs text-ink">{result.name}</span>
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
				Die Passung ist deine Gewichtung aus offenen Daten, keine Bewertung von Nachbarschaften oder
				Menschen. Wahlverhalten: Zweitstimmen BTW 2025 (Bundeswahlleiterin).
			</p>
		{/if}
	</div>
</div>

<style>
	.finder-range {
		accent-color: var(--accent, #2a3f7c);
		height: 1.1rem;
	}
</style>
