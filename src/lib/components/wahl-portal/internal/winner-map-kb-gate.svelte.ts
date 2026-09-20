/**
 * Bündelt für den kiez/bezirk-Winners-Pfad den Fetch-Trigger (bestehendes
 * Loader-Muster) UND das Response-Latch (Review-Fund #7: eine Response wird
 * nur übernommen, wenn ihre Rows zur aktiven Partei passen) in EINER Klasse
 * (Datei-Zeilenlimit, Muster `WinnerMapController`/`AddressHighlight" --
 * Getter-Closures statt direkter State-Referenzen, weil die Klasse
 * außerhalb der reaktiven Component-Instanz lebt).
 *
 * `triggerFetch`/`updateEffectiveRows` bleiben ZWEI Methoden für ZWEI
 * getrennte `$effect`-Aufrufer in `winner-map.svelte`: eine Methode, die im
 * selben Effect-Lauf `loader.response` sowohl schreibt (via `loader.load`)
 * als auch liest, lässt Svelte in eine Endlosschleife laufen
 * (`effect_update_depth_exceeded`) -- derselbe Grund, aus dem das
 * Bestandsmuster (`winner-map.svelte` vor dieser Auslagerung) Fetch-Trigger
 * und Latch bereits als zwei separate Effects führte.
 */
import type { KiezBezirkWinnersLoader } from './winner-map-winners.svelte.js';
import { rowsMatchAktivePartei } from './winner-map-partei-mode.svelte.js';
import type { WinnerApiRow } from './winner-map-data.js';
import type { WahlPortalEbene } from '$lib/utils/wahl-portal-url-state.js';

export interface KbWinnersGateDeps {
	readonly loader: KiezBezirkWinnersLoader;
	readonly getReihe: () => string;
	readonly getStimmtyp: () => string;
	readonly getAnzeigeEbene: () => WahlPortalEbene;
	readonly getAktivePartei: () => string | null;
}

export class KbWinnersGate {
	/** Rows der zuletzt zur aktiven Partei PASSENDEN Response (Review-Fund #7). */
	effectiveRows = $state<readonly WinnerApiRow[]>([]);

	#deps: KbWinnersGateDeps;

	constructor(deps: KbWinnersGateDeps) {
		this.#deps = deps;
	}

	/** In einem eigenen `$effect` aufrufen: triggert den Fetch (nur kiez/bezirk). */
	triggerFetch(): void {
		const { loader, getReihe, getStimmtyp, getAnzeigeEbene, getAktivePartei } = this.#deps;
		const ebene = getAnzeigeEbene();
		if (ebene !== 'kiez' && ebene !== 'bezirk') return;
		const expectedReihe = getReihe();
		const expectedStimmtyp = getStimmtyp();
		const expectedEbene = ebene;
		const expectedPartei = getAktivePartei();
		void loader.load(
			expectedReihe,
			expectedStimmtyp,
			expectedEbene,
			() =>
				getReihe() !== expectedReihe ||
				getStimmtyp() !== expectedStimmtyp ||
				getAnzeigeEbene() !== expectedEbene ||
				getAktivePartei() !== expectedPartei,
			expectedPartei ?? undefined
		);
	}

	/** In einem eigenen `$effect` aufrufen: aktualisiert `effectiveRows`, wenn
	 * die aktuelle Loader-Response zur aktiven Partei passt. */
	updateEffectiveRows(): void {
		const { loader, getAktivePartei } = this.#deps;
		const rows = loader.response?.winners ?? [];
		if (rowsMatchAktivePartei(rows, getAktivePartei())) this.effectiveRows = rows;
	}
}
