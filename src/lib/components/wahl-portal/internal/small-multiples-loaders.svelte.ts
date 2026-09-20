/**
 * Story 9 (Small Multiples): lädt die Partei-Anteile aller `FINDER_PARTIES`
 * parallel -- je Partei EIN `KiezBezirkWinnersLoader` (eigenes `.response`),
 * alle teilen sich über den Modul-Cache in `winner-map-winners.svelte.ts`
 * (Key `typ-stimmtyp-kiez-partei`) denselben Request/dieselbe Response wie
 * ein evtl. bereits offener Partei-Tab an der Winner-Map (Design Notes:
 * „Small Multiples teilen sich diese Responses mit den Tabs").
 */
import { FINDER_PARTIES } from '$lib/components/atlas/internal/kiez-finder-engine.js';
import { KiezBezirkWinnersLoader, type LoadStatus } from './winner-map-winners.svelte.js';

type FinderParty = (typeof FINDER_PARTIES)[number];

export class SmallMultiplesLoaders {
	// Review-Fund #23: `Record<string, …>` verliert die Union der 7
	// `FINDER_PARTIES`-Kurznamen (jeder String-Zugriff wäre erlaubt); der
	// enge Record-Typ hält Aufrufer wie `small-multiples.svelte` an die
	// tatsächlich existierenden Keys gebunden.
	readonly byPartei: Record<FinderParty, KiezBezirkWinnersLoader>;

	constructor(fetchFn: typeof fetch) {
		this.byPartei = Object.fromEntries(
			FINDER_PARTIES.map((p) => [p, new KiezBezirkWinnersLoader(fetchFn)])
		) as Record<FinderParty, KiezBezirkWinnersLoader>;
	}

	loadAll(typ: string, stimmtyp: string, isStale: () => boolean): Promise<void[]> {
		return Promise.all(
			FINDER_PARTIES.map((partei) =>
				this.byPartei[partei].load(typ, stimmtyp, 'kiez', isStale, partei)
			)
		);
	}

	statusen(): LoadStatus[] {
		return FINDER_PARTIES.map((p) => this.byPartei[p].status);
	}

	/** Status EINER Partei (Review-Fund #10: Aufrufer rendert pro Mini-Karte
	 * einen eigenen Lade-/Fehler-/Erfolgs-Zustand statt eines Alles-oder-
	 * Nichts-Kapitel-Zustands). */
	statusFor(partei: FinderParty): LoadStatus {
		return this.byPartei[partei].status;
	}

	get allLoaded(): boolean {
		return this.statusen().every((s) => s === 'loaded');
	}

	get anyError(): boolean {
		return this.statusen().some((s) => s === 'error');
	}

	/** Review-Fund #10: ein Kapitel-weiter Error-Zustand ist nur gerechtfertigt,
	 * wenn ALLE Parteien scheitern -- eine einzelne fehlgeschlagene Partei
	 * bekommt stattdessen eine eigene Fehler-Kachel (siehe `small-multiples
	 * .svelte`), die restlichen 6 Minis bleiben nutzbar. */
	get allFailed(): boolean {
		return this.statusen().every((s) => s === 'error');
	}
}
