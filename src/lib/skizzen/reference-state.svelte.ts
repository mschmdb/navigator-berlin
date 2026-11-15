import { page } from '$app/state';
import { replaceState } from '$app/navigation';
import { SvelteMap, SvelteURL } from 'svelte/reactivity';
import { parseReference, serializeReference, type ReferenceParseContext } from './reference';
import type { ReferenceChoice } from './types';
import type { WahlBundle, WahlEbene } from './wahl-types';

export type Lesart = 'erzaehlen' | 'zahlen';

/** Bezugspunkt und Lesart im URL (`?vs=…&lesart=zahlen`), damit ein Vergleich teilbar bleibt. */
export class SkizzeState {
	choice = $state<ReferenceChoice>({ kind: 'berlin', slug: null });
	mode = $state<Lesart>('erzaehlen');

	constructor(ctx: () => ReferenceParseContext) {
		const url = page.url;
		this.choice = parseReference(url.searchParams.get('vs'), ctx());
		this.mode = url.searchParams.get('lesart') === 'zahlen' ? 'zahlen' : 'erzaehlen';
	}

	setChoice(c: ReferenceChoice) {
		this.choice = c;
		this.sync();
	}

	setMode(m: Lesart) {
		this.mode = m;
		this.sync();
	}

	private sync() {
		const url = new SvelteURL(page.url);
		const vs = serializeReference(this.choice);
		if (vs) url.searchParams.set('vs', vs);
		else url.searchParams.delete('vs');
		if (this.mode === 'zahlen') url.searchParams.set('lesart', 'zahlen');
		else url.searchParams.delete('lesart');
		// Gleiche Seite, nur Query-Parameter: kein Routenwechsel, darum kein resolve().
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		replaceState(url, page.state);
	}
}

/** Wahl-Zeitreihen frei gewählter Vergleichsgebiete, einmal geladen und gemerkt. */
export class WahlCache {
	#cache = new SvelteMap<string, WahlBundle>();
	current = $state<WahlBundle | null>(null);

	async load(ebene: Exclude<WahlEbene, 'berlin'>, slug: string) {
		const key = `${ebene}:${slug}`;
		const hit = this.#cache.get(key);
		if (hit) {
			this.current = hit;
			return;
		}
		this.current = null;
		const res = await fetch(`/demo/skizze-wahl?ebene=${ebene}&slug=${encodeURIComponent(slug)}`);
		if (!res.ok) return;
		const bundle = (await res.json()) as WahlBundle;
		this.#cache.set(key, bundle);
		this.current = bundle;
	}
}
