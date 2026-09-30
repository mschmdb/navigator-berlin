/**
 * Story 11 (Sankey-Rework): reaktiver Lazy-Layout-Controller für
 * `d3-sankey` (Boundary: „d3-sankey macht ausschließlich das Layout",
 * eigener Chunk, lazy `await import('d3-sankey')`, kein Eintrag in
 * `optimizeDeps.include`). Die eigentliche Layout-Berechnung
 * (`computeSankeyLayoutWithModule`) lebt in `sankey-d3-layout.ts` (plain
 * `.ts`, kein `svelte/prefer-svelte-reactivity`-Konflikt mit ihren internen
 * `Map`-Lookups) -- dieser Controller hält nur noch den reaktiven Zustand
 * und lädt das Modul lazy.
 */
import type { SankeyGraph } from './sankey-graph.js';
import {
	computeSankeyLayoutWithModule,
	type D3SankeyModule,
	type SankeyDimensions,
	type SankeyLayoutResult
} from './sankey-d3-layout.js';

export type {
	D3SankeyModule,
	SankeyDimensions,
	SankeyLayoutResult,
	SankeyPositionedLink,
	SankeyPositionedNode
} from './sankey-d3-layout.js';
export { computeSankeyDimensions, computeSankeyLayoutWithModule } from './sankey-d3-layout.js';

export interface SankeyD3ControllerOptions {
	/** Injizierbar für Tests (Test-Naht, Muster `winner-map-maplibre.svelte.ts`
	 * `mapFactory`) -- Default = echter `import('d3-sankey')`. */
	readonly d3SankeyFactory?: () => Promise<D3SankeyModule>;
}

async function defaultD3SankeyFactory(): Promise<D3SankeyModule> {
	return import('d3-sankey');
}

/**
 * Reaktiver Controller ums Layout: hält den zuletzt berechneten Zustand
 * (`layout`, Svelte-Rune) und lädt `d3-sankey` lazy beim ersten `compute()`.
 * Stale-Guard über einen internen Zähler statt externem `isStale()`-Callback
 * (anders als die Loader-Klassen): der Controller ist alleiniger Besitzer
 * seines Tokens, ein späterer `compute()`-Aufruf gewinnt immer.
 *
 * `layoutFor` bindet `layout` an seinen Ursprungs-Graph (Review Triage Log
 * #1): bei einem Cache-Treffer setzt der Winners-Loader `response` synchron,
 * `graph` ändert sich also SOFORT, während `compute()` noch läuft/aussteht --
 * ohne diese Bindung würde die Komponente kurzzeitig das alte Layout gegen
 * den neuen Graph rendern (Jahres-Labels auf x=0, Tooltip mischt Ebenen).
 * Beide Felder werden IMMER atomar zusammen gesetzt, auch im Leer-Pfad.
 */
export class SankeyD3Controller {
	layout = $state<SankeyLayoutResult | null>(null);
	/** `$state.raw`, NICHT `$state`: Svelte proxied `$state`-Objekte tief, ein
	 * gelesenes `layoutFor` wäre dann nie `===` zum rohen `graph`-Objekt der
	 * Komponente (Referenzvergleich ist der ganze Zweck dieses Feldes). */
	layoutFor = $state.raw<SankeyGraph | null>(null);
	/** true nach einer rejectenden Factory (z. B. Chunk-404 nach Deploy,
	 * offline) -- kein Throw nach außen, die Komponente zeigt stattdessen den
	 * bestehenden Fehler-Zustand (Review Triage Log #2). */
	error = $state(false);

	#factory: () => Promise<D3SankeyModule>;
	#token = 0;

	constructor(options: SankeyD3ControllerOptions = {}) {
		this.#factory = options.d3SankeyFactory ?? defaultD3SankeyFactory;
	}

	async compute(graph: SankeyGraph, dimensions: SankeyDimensions): Promise<void> {
		const myToken = ++this.#token;
		this.error = false;
		if (graph.nodes.length === 0) {
			this.layout = { nodes: [], links: [], width: dimensions.width, height: dimensions.height };
			this.layoutFor = graph;
			return;
		}
		try {
			const mod = await this.#factory();
			if (myToken !== this.#token) return;
			this.layout = computeSankeyLayoutWithModule(mod, graph, dimensions);
			this.layoutFor = graph;
		} catch {
			if (myToken !== this.#token) return;
			this.error = true;
		}
	}
}
