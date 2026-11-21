import { page, type ReadonlyURL } from '$app/state';
import { goto } from '$app/navigation';
import { SvelteMap, SvelteURL } from 'svelte/reactivity';
import { parseReference, serializeReference, type ReferenceParseContext } from './reference';
import type { ReferenceChoice } from './types';
import type { WahlBundle, WahlEbene } from './wahl-types';
import { pointsFromSeries, seriesUrl } from './wahl-api';

export type Lesart = 'erzaehlen' | 'zahlen';

/**
 * Die URL mit `vs` und `lesart`. Die Auswahl schreibt per shallow `goto`, dann steht sie in
 * `page.shallow.url`. Nach Zurück auf so einen Eintrag zeigt `page.url` die Ausgangs-URL.
 */
function currentUrl(): ReadonlyURL {
	return page.shallow?.url ?? page.url;
}

/** Bezugspunkt und Lesart im URL (`?vs=…&lesart=zahlen`), damit ein Vergleich teilbar bleibt. */
export class PlaceViewState {
	choice = $state<ReferenceChoice>({ kind: 'berlin', slug: null });
	mode = $state<Lesart>('erzaehlen');

	#ctx: () => ReferenceParseContext;

	constructor(ctx: () => ReferenceParseContext) {
		this.#ctx = ctx;
	}

	/**
	 * Nur im Browser aufrufen (in einem $effect): Die Seiten sind vorgerendert, dort gibt es keine
	 * Query-Parameter. Auch nach Client-Navigation, dieselbe Komponente kann einen anderen Ort zeigen.
	 */
	readPage() {
		const url = currentUrl();
		this.choice = parseReference(url.searchParams.get('vs'), this.#ctx());
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
		const url = new SvelteURL(currentUrl().href);
		const vs = serializeReference(this.choice);
		if (vs) url.searchParams.set('vs', vs);
		else url.searchParams.delete('vs');
		if (this.mode === 'zahlen') url.searchParams.set('lesart', 'zahlen');
		else url.searchParams.delete('lesart');
		// Gleiche Seite, nur Query-Parameter: kein Routenwechsel, darum kein resolve().
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(url, { shallow: true, replace: true, state: page.state });
	}
}

/** Wahl-Zeitreihen frei gewählter Vergleichsgebiete, einmal geladen und gemerkt. */
export class WahlCache {
	#cache = new SvelteMap<string, WahlBundle>();
	#wanted = $state<string | null>(null);
	failed = $state(false);

	/** Nur die Daten des zuletzt gewünschten Gebiets; eine langsame ältere Antwort zählt nicht. */
	get current(): WahlBundle | null {
		return this.#wanted ? (this.#cache.get(this.#wanted) ?? null) : null;
	}

	async load(ebene: Exclude<WahlEbene, 'berlin'>, slug: string) {
		const key = `${ebene}:${slug}`;
		this.#wanted = key;
		this.failed = false;
		if (this.#cache.has(key)) return;
		try {
			const [btw, agh, bvv] = await Promise.all(
				(['btw', 'agh', 'bvv'] as const).map(async (typ) => {
					const res = await fetch(seriesUrl(typ, ebene, slug));
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					return pointsFromSeries(await res.json());
				})
			);
			this.#cache.set(key, { btw, agh, bvv });
		} catch {
			if (this.#wanted === key) this.failed = true;
		}
	}
}
