/**
 * Stimmbezirks-Pendant zu `KbWinnersGate`: bündelt Fetch-Trigger +
 * Response-Latch (Review-Fund #7) für `StimmbezirkLoader.loadWinners`
 * (Datei-Zeilenlimit `winner-map.svelte`). `triggerFetch`/`updateEffectiveRows`
 * bleiben ZWEI Methoden für ZWEI getrennte `$effect`-Aufrufer (siehe
 * `KbWinnersGate`-Doc: eine Methode, die `loader.winnersResponse` im selben
 * Effect-Lauf schreibt UND liest, läuft in eine Svelte-Endlosschleife).
 */
import type { StimmbezirkLoader } from './winner-map-stimmbezirk.svelte.js';
import { rowsMatchAktivePartei } from './winner-map-partei-mode.svelte.js';
import type { WinnerApiRow } from './winner-map-data.js';
import type { WahlPortalEbene } from '$lib/utils/wahl-portal-url-state.js';

export interface SbWinnersGateDeps {
	readonly loader: StimmbezirkLoader;
	readonly getReihe: () => string;
	readonly getStimmtyp: () => string;
	readonly getJahr: () => number | null;
	readonly getWahlSlug: () => string | null;
	readonly getAnzeigeEbene: () => WahlPortalEbene;
	readonly getAktivePartei: () => string | null;
}

export class SbWinnersGate {
	/** Rows der zuletzt zur aktiven Partei PASSENDEN Response (Review-Fund #7). */
	effectiveRows = $state<readonly WinnerApiRow[]>([]);

	#deps: SbWinnersGateDeps;

	constructor(deps: SbWinnersGateDeps) {
		this.#deps = deps;
	}

	/** In einem eigenen `$effect` aufrufen: triggert den Fetch (nur
	 * stimmbezirk mit bekanntem Jahr/wahlSlug). */
	triggerFetch(): void {
		const {
			loader,
			getReihe,
			getStimmtyp,
			getJahr,
			getWahlSlug,
			getAnzeigeEbene,
			getAktivePartei
		} = this.#deps;
		const jahr = getJahr();
		const wahlSlug = getWahlSlug();
		if (getAnzeigeEbene() !== 'stimmbezirk' || jahr === null || !wahlSlug) return;
		const expectedWahlSlug = wahlSlug;
		const expectedPartei = getAktivePartei();
		void loader.loadWinners(
			getReihe(),
			getStimmtyp(),
			jahr,
			() =>
				getWahlSlug() !== expectedWahlSlug ||
				getAnzeigeEbene() !== 'stimmbezirk' ||
				getAktivePartei() !== expectedPartei,
			expectedPartei ?? undefined
		);
	}

	/** In einem eigenen `$effect` aufrufen: aktualisiert `effectiveRows`, wenn
	 * die aktuelle Loader-Response zur aktiven Partei passt. */
	updateEffectiveRows(): void {
		const { loader, getAktivePartei } = this.#deps;
		const rows = loader.winnersResponse?.winners ?? [];
		if (rowsMatchAktivePartei(rows, getAktivePartei())) this.effectiveRows = rows;
	}
}
