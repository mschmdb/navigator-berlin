import type { NearestStop, Modus } from './nearest-oepnv-stop.js';
import type { SeverityLevel } from './value-severity-mapping.js';

export type MobilityRatingKey =
	| 'top'
	| 'gut'
	| 'solide'
	| 'ausreichend'
	| 'keine';

export interface MobilityRating {
	key: MobilityRatingKey;
	label: string;
	severity: SeverityLevel;
	score: number;
}

const LABEL: Record<MobilityRatingKey, string> = {
	top: 'Sehr gut angebunden',
	gut: 'Gut angebunden',
	solide: 'Solide angebunden',
	ausreichend: 'Ausreichend angebunden',
	keine: 'Nicht angebunden'
};

const SEVERITY: Record<MobilityRatingKey, SeverityLevel> = {
	top: 'success',
	gut: 'success',
	solide: 'success-soft',
	ausreichend: 'neutral',
	keine: 'danger'
};

function rapidScore(distance: number | null): number {
	if (distance === null) return 0;
	if (distance <= 300) return 4;
	if (distance <= 500) return 3;
	if (distance <= 600) return 2;
	return 0;
}

function tramScore(distance: number | null): number {
	if (distance === null) return 0;
	if (distance <= 300) return 2;
	if (distance <= 600) return 1;
	return 0;
}

function busScore(distance: number | null): number {
	if (distance === null) return 0;
	if (distance <= 300) return 1.5;
	if (distance <= 600) return 1;
	return 0;
}

function rating(key: MobilityRatingKey, score: number): MobilityRating {
	return { key, label: LABEL[key], severity: SEVERITY[key], score };
}

function minDistance(stops: Array<NearestStop | null>): number | null {
	let min = Infinity;
	for (const s of stops) {
		if (s && s.distanceM < min) min = s.distanceM;
	}
	return Number.isFinite(min) ? min : null;
}

export function getMobilityRating(
	nearest: Record<Modus, NearestStop | null>
): MobilityRating {
	const rapid = minDistance([nearest.ubahn, nearest.sbahn]);
	const tram = nearest.tram?.distanceM ?? null;
	const bus = nearest.bus?.distanceM ?? null;

	const score = rapidScore(rapid) + tramScore(tram) + busScore(bus);

	if (score === 0) return rating('keine', score);
	if (score >= 4) return rating('top', score);
	if (score >= 2.5) return rating('gut', score);
	if (score >= 1.5) return rating('solide', score);
	return rating('ausreichend', score);
}
