import type { ClimateData, KiezScore } from '$lib/data';
import type { WahlResultsAtPoint } from '$lib/data/get-wahl-results-at-point.js';

/** Blöcke im Inspector, die nach einem Adresswechsel asynchron nachladen. */
export type InspectorLoadKey = 'score' | 'wahl' | 'laerm' | 'climate';

export type InspectorPending = Record<InspectorLoadKey, boolean>;

export const IDLE_PENDING: Readonly<InspectorPending> = Object.freeze({
	score: false,
	wahl: false,
	laerm: false,
	climate: false
});

/** Ausschnitt aus dem UiState, den der Lade-Ablauf anfasst. */
export interface InspectorLoadTarget {
	kiezScore: KiezScore | null;
	wahlResults: WahlResultsAtPoint | null;
	kiezLaermDb: number | null;
	climateSeries: ClimateData | null;
	inspectorPending: InspectorPending;
}

export interface InspectorLoads {
	/**
	 * Startet eine Ladefolge für eine neue Adresse und liefert ihr Token.
	 * `keepStale`: der Inspector war schon offen, die alten Werte bleiben
	 * stehen, bis die neuen da sind (kein Zusammenklappen, kein Flackern).
	 * Sonst werden sie geleert, damit keine fremde Adresse durchscheint.
	 */
	begin(opts: { keepStale: boolean }): number;
	/**
	 * Übernimmt eine Antwort nur, wenn sie zur aktuellen Ladefolge gehört.
	 * Ältere Antworten verwirft sie, auch wenn sie später ankommen.
	 */
	settle(token: number, key: InspectorLoadKey, apply: () => void): boolean;
	/** Wie `settle`, merkt sich zusätzlich die Wetterstation der Klima-Reihe. */
	settleClimate(token: number, stationId: string, series: ClimateData | null): boolean;
	/**
	 * Die stehende Klima-Reihe gehört zu dieser Station. Nur dann darf ein
	 * Wechsel sie ohne neue Anfrage übernehmen.
	 */
	hasClimateFor(stationId: string): boolean;
	/** Beendet alle Ladezustände, laufende Antworten verfallen. */
	cancel(): void;
	isCurrent(token: number): boolean;
}

export function createInspectorLoads(target: InspectorLoadTarget): InspectorLoads {
	let generation = 0;
	let climateStationId: string | null = null;

	function settle(token: number, key: InspectorLoadKey, apply: () => void): boolean {
		if (token !== generation) return false;
		apply();
		target.inspectorPending = { ...target.inspectorPending, [key]: false };
		return true;
	}

	return {
		begin({ keepStale }) {
			generation += 1;
			if (!keepStale) {
				climateStationId = null;
				target.kiezScore = null;
				target.wahlResults = null;
				target.kiezLaermDb = null;
				target.climateSeries = null;
			}
			target.inspectorPending = { score: true, wahl: true, laerm: true, climate: true };
			return generation;
		},
		settle,
		settleClimate(token, stationId, series) {
			return settle(token, 'climate', () => {
				target.climateSeries = series;
				climateStationId = series ? stationId : null;
			});
		},
		hasClimateFor(stationId) {
			return target.climateSeries !== null && climateStationId === stationId;
		},
		cancel() {
			generation += 1;
			target.inspectorPending = { ...IDLE_PENDING };
		},
		isCurrent(token) {
			return token === generation;
		}
	};
}

export type SettledValues = Pick<
	InspectorLoadTarget,
	'kiezScore' | 'wahlResults' | 'kiezLaermDb' | 'climateSeries'
>;

/**
 * Nur Werte, deren Antwort für die aktuelle Adresse schon da ist. Stehende
 * Altwerte (pending) werden `null`, damit Export und Textzeilen sie nicht als
 * aktuelle Werte ausgeben.
 */
export function settledValues(t: InspectorLoadTarget): SettledValues {
	const p = t.inspectorPending;
	return {
		kiezScore: p.score ? null : t.kiezScore,
		wahlResults: p.wahl ? null : t.wahlResults,
		kiezLaermDb: p.laerm ? null : t.kiezLaermDb,
		climateSeries: p.climate ? null : t.climateSeries
	};
}
