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
	/** Beendet alle Ladezustände, laufende Antworten verfallen. */
	cancel(): void;
	isCurrent(token: number): boolean;
}

export function createInspectorLoads(target: InspectorLoadTarget): InspectorLoads {
	let generation = 0;

	return {
		begin({ keepStale }) {
			generation += 1;
			if (!keepStale) {
				target.kiezScore = null;
				target.wahlResults = null;
				target.kiezLaermDb = null;
				target.climateSeries = null;
			}
			target.inspectorPending = { score: true, wahl: true, laerm: true, climate: true };
			return generation;
		},
		settle(token, key, apply) {
			if (token !== generation) return false;
			apply();
			target.inspectorPending = { ...target.inspectorPending, [key]: false };
			return true;
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
