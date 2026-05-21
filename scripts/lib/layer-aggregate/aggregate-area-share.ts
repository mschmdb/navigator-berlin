import { round1, type AreaShareAggregate } from './types.js';

/**
 * Flächenanteil einer Nutzungsart (Grün-/Spielfläche) an der Ziel-Polygon-Fläche.
 * Gleiche Flächen-Mathematik wie coverage-share, semantisch eigener Typ
 * (Nutzungsanteil statt Belastungs-/Schutz-Abdeckung).
 */
export function aggregateAreaShare(
	featureAreaM2: number,
	polygonAreaM2: number
): AreaShareAggregate {
	if (polygonAreaM2 <= 0) {
		return { type: 'area-share', share: 0 };
	}
	const share = Math.max(0, Math.min(100, (featureAreaM2 / polygonAreaM2) * 100));
	return { type: 'area-share', share: round1(share) };
}
