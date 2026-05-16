/**
 * Top-3-Stat-Card-Selector für Bezirks- und Kiez-OG-Bilder (Story 2.6 AC-3).
 *
 * User-Decision Variante A: fix 3 Werte je Page-Type (Lärm dominantCategory,
 * Klima PET, ÖPNV Stationen/km²) statt Top-3-mit-höchster-Abweichung. Vorteil
 * Determinismus und identischer Layout-Slot über alle Pages hinweg.
 *
 * Aggregat-Schema reflektiert Datenrealität: Lärm publiziert ordinal-kategoriale
 * Werte (nicht numerische dB), siehe `aggregate-types.ts`. PET und ÖPNV sind
 * numerisch. Fehlende Werte bekommen Placeholder „–" (en-dash, keine em-dash
 * per CLAUDE.md).
 *
 * Pure Function ohne IO. Verbraucher: `og-pipeline.ts` und `page-card-template.ts`.
 */

import type { BezirkStats } from '$lib/server/db/queries/get-bezirk-stats.js';
import type { KiezStats } from '$lib/server/db/queries/get-kiez-stats.js';

export interface Top3StatCard {
	readonly label: string;
	readonly value: string;
	readonly layer: string | null;
	readonly sourceUpdatedAt: string | null;
}

const PLACEHOLDER = '–';

export function formatLaermCategory(raw: string): string {
	if (raw.length === 0) return PLACEHOLDER;
	return raw[0].toUpperCase() + raw.slice(1);
}

export function formatPetValue(petCelsius: number): string {
	return `${petCelsius.toFixed(1)} °C`;
}

export function formatStopsPerKm2(stops: number): string {
	return `${stops.toFixed(1)}/km²`;
}

type AggregateLike = Pick<BezirkStats | KiezStats, 'laerm' | 'klima' | 'oepnv'>;

export function selectTopStatsForBezirkOrKiez(stats: AggregateLike): Top3StatCard[] {
	const laermCard: Top3StatCard = stats.laerm.dominantCategory
		? {
				label: 'Lärm',
				value: formatLaermCategory(stats.laerm.dominantCategory.value),
				layer: stats.laerm.dominantCategory.layer,
				sourceUpdatedAt: stats.laerm.dominantCategory.sourceUpdatedAt
			}
		: { label: 'Lärm', value: PLACEHOLDER, layer: null, sourceUpdatedAt: null };

	const petCard: Top3StatCard = stats.klima.meanPet
		? {
				label: 'PET',
				value: formatPetValue(stats.klima.meanPet.value),
				layer: stats.klima.meanPet.layer,
				sourceUpdatedAt: stats.klima.meanPet.sourceUpdatedAt
			}
		: { label: 'PET', value: PLACEHOLDER, layer: null, sourceUpdatedAt: null };

	const stopsCard: Top3StatCard = stats.oepnv.stopsPerKm2
		? {
				label: 'Stationen',
				value: formatStopsPerKm2(stats.oepnv.stopsPerKm2.value),
				layer: stats.oepnv.stopsPerKm2.layer,
				sourceUpdatedAt: stats.oepnv.stopsPerKm2.sourceUpdatedAt
			}
		: { label: 'Stationen', value: PLACEHOLDER, layer: null, sourceUpdatedAt: null };

	return [laermCard, petCard, stopsCard];
}
