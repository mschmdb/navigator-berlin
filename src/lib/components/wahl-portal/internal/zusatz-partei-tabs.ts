/**
 * #179: Zusatz-Tabs über der Winner-Map. Die 7 Basis-Tabs (`FINDER_PARTIES`)
 * bleiben fix (Vorgabe Matze: keine Tab-Flut). Dazu kommt jede weitere Partei,
 * die in der gewählten Wahl berlinweit die Schwelle erreicht und ein Farb-Token
 * hat (ohne Token lehnt `/api/wahl/winners` die Partei ab).
 */
import { FINDER_PARTIES } from '$lib/components/atlas/internal/kiez-finder-engine.js';
import { TOKEN_PARTEIEN } from '$lib/data/partei-farben.js';

export const ZUSATZ_TAB_SCHWELLE = 0.05;

export interface ParteiAnteil {
	readonly partei: string;
	readonly anteil: number;
}

const BASIS = new Set<string>(FINDER_PARTIES);
const MIT_TOKEN = new Set<string>(TOKEN_PARTEIEN);

/** Zusatz-Parteien in Anteils-Reihenfolge (absteigend). */
export function zusatzParteiTabs(berlinRows: readonly ParteiAnteil[]): string[] {
	return berlinRows
		.filter(
			(r) => r.anteil >= ZUSATZ_TAB_SCHWELLE && !BASIS.has(r.partei) && MIT_TOKEN.has(r.partei)
		)
		.sort((a, b) => b.anteil - a.anteil)
		.map((r) => r.partei);
}
