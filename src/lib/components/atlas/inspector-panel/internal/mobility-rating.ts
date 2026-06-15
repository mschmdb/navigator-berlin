import type { NearestStop, Modus } from './nearest-oepnv-stop.js';
import type { SeverityLevel } from './value-severity-mapping.js';

export type MobilityRatingKey = 'top' | 'gut' | 'solide' | 'ausreichend' | 'schwach' | 'keine';

export interface MobilityRating {
	key: MobilityRatingKey;
	label: string;
	severity: SeverityLevel;
	score: number;
}

// Theoretisches Maximum: rapid 4 + tram 2 + bus 1.5. "Sehr gut" ab Score 4.
export const MOBILITY_SCORE_MAX = 7.5;
export const MOBILITY_SCORE_TOP_THRESHOLD = 4;

export interface MobilityRatingOptions {
	/** When true, allow upgrading "keine" to "schwach" if soft stops exist (Story 1.21). */
	isResidential?: boolean;
}

const LABEL: Record<MobilityRatingKey, string> = {
	top: 'Sehr gut angebunden',
	gut: 'Gut angebunden',
	solide: 'Solide angebunden',
	ausreichend: 'Ausreichend angebunden',
	schwach: 'Schwach angebunden',
	keine: 'Nicht angebunden'
};

const SEVERITY: Record<MobilityRatingKey, SeverityLevel> = {
	top: 'success',
	gut: 'success',
	solide: 'success-soft',
	ausreichend: 'neutral',
	schwach: 'warning',
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

function hardStop(stop: NearestStop | null): NearestStop | null {
	return stop && !stop.soft ? stop : null;
}

function anySoftStop(nearest: Record<Modus, NearestStop | null>): boolean {
	return (
		!!nearest.ubahn?.soft || !!nearest.sbahn?.soft || !!nearest.tram?.soft || !!nearest.bus?.soft
	);
}

function minDistance(stops: Array<NearestStop | null>): number | null {
	let min = Infinity;
	for (const s of stops) {
		if (s && s.distanceM < min) min = s.distanceM;
	}
	return Number.isFinite(min) ? min : null;
}

export function getMobilityRating(
	nearest: Record<Modus, NearestStop | null>,
	options: MobilityRatingOptions = {}
): MobilityRating {
	const rapid = minDistance([hardStop(nearest.ubahn), hardStop(nearest.sbahn)]);
	const tram = hardStop(nearest.tram)?.distanceM ?? null;
	const bus = hardStop(nearest.bus)?.distanceM ?? null;

	const score = rapidScore(rapid) + tramScore(tram) + busScore(bus);

	if (score === 0) {
		if (options.isResidential && anySoftStop(nearest)) {
			return rating('schwach', 0);
		}
		return rating('keine', 0);
	}
	if (score >= 4) return rating('top', score);
	if (score >= 2.5) return rating('gut', score);
	if (score >= 1.5) return rating('solide', score);
	return rating('ausreichend', score);
}
