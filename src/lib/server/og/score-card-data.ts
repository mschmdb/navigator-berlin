/**
 * Score-Card-Daten für Bezirks- und Kiez-OG-Bilder (Story 2.6 Score-Layout-
 * Pivot 2026-05-16, ADR-015-Dimensionen seit Story 9.4). Hero-Composite + 5
 * Dimensions-Mini (Ruhe & Luft / Grün & Hitze / Mobilität / Versorgung / Wohnschutz).
 *
 * Alle Dimensionen sind positiv-eindeutig (ADR-015). Sozialstruktur ist kein
 * Score-Wert mehr, daher kein Stigma-Ausschluss nötig.
 *
 * Pure Function ohne IO.
 */

import type { BezirkScore } from '$lib/server/db/queries/get-bezirk-score.js';
import type { KiezScore } from '$lib/server/db/queries/get-kiez-score.js';

export interface ScoreDim {
	readonly label: string;
	readonly value: number | null;
}

export interface ScoreCardData {
	readonly composite: number | null;
	readonly dims: readonly ScoreDim[];
}

type ScoreLike = Pick<
	BezirkScore | KiezScore,
	'composite' | 'ruheLuft' | 'gruenHitze' | 'mobilitaet' | 'versorgung' | 'wohnschutz'
>;

const DIM_LABELS = {
	ruheLuft: 'Ruhe',
	gruenHitze: 'Grün & Hitze',
	mobilitaet: 'Mobilität',
	versorgung: 'Versorgung',
	wohnschutz: 'Wohnschutz'
} as const;

export function buildScoreCardData(score: ScoreLike | null | undefined): ScoreCardData {
	if (!score) {
		return {
			composite: null,
			dims: [
				{ label: DIM_LABELS.ruheLuft, value: null },
				{ label: DIM_LABELS.gruenHitze, value: null },
				{ label: DIM_LABELS.mobilitaet, value: null },
				{ label: DIM_LABELS.versorgung, value: null },
				{ label: DIM_LABELS.wohnschutz, value: null }
			]
		};
	}
	return {
		composite: typeof score.composite === 'number' ? score.composite : null,
		dims: [
			{ label: DIM_LABELS.ruheLuft, value: score.ruheLuft },
			{ label: DIM_LABELS.gruenHitze, value: score.gruenHitze },
			{ label: DIM_LABELS.mobilitaet, value: score.mobilitaet },
			{ label: DIM_LABELS.versorgung, value: score.versorgung },
			{ label: DIM_LABELS.wohnschutz, value: score.wohnschutz }
		]
	};
}

export function formatScoreValue(value: number | null | undefined): string {
	if (value === null || value === undefined || !Number.isFinite(value)) return '–';
	return Math.round(value).toString();
}
