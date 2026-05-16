/**
 * Score-Card-Daten für Bezirks- und Kiez-OG-Bilder (Story 2.6 Score-Layout-
 * Pivot 2026-05-16). Ersetzt für Bezirk/Kiez den Top-3-Stats-Layout durch
 * Hero-Composite + 4 Dimensions-Mini (Ruhe-Luft / Grün / Mobilität /
 * Versorgung).
 *
 * Soziale-Lage bewusst NICHT auf der OG-Card (Stigma-Schutz, User-Lock
 * 2026-05-16; Memory `feedback_no_lebenswert` + `project_compare_editorial_profiles`).
 * Sie bleibt auf Detail-Page sichtbar, aber nicht auf der teilbaren Card.
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

type ScoreLike = Pick<BezirkScore | KiezScore, 'composite' | 'ruheLuft' | 'gruen' | 'mobilitaet' | 'versorgung'>;

const DIM_LABELS = {
	ruheLuft: 'Ruhe',
	gruen: 'Grün',
	mobilitaet: 'Mobilität',
	versorgung: 'Versorgung'
} as const;

export function buildScoreCardData(score: ScoreLike | null | undefined): ScoreCardData {
	if (!score) {
		return {
			composite: null,
			dims: [
				{ label: DIM_LABELS.ruheLuft, value: null },
				{ label: DIM_LABELS.gruen, value: null },
				{ label: DIM_LABELS.mobilitaet, value: null },
				{ label: DIM_LABELS.versorgung, value: null }
			]
		};
	}
	return {
		composite: typeof score.composite === 'number' ? score.composite : null,
		dims: [
			{ label: DIM_LABELS.ruheLuft, value: score.ruheLuft },
			{ label: DIM_LABELS.gruen, value: score.gruen },
			{ label: DIM_LABELS.mobilitaet, value: score.mobilitaet },
			{ label: DIM_LABELS.versorgung, value: score.versorgung }
		]
	};
}

export function formatScoreValue(value: number | null | undefined): string {
	if (value === null || value === undefined || !Number.isFinite(value)) return '–';
	return Math.round(value).toString();
}
