import type { LayerHit } from './types.js';

const BEZIRKE_SLUG = 'bezirke';

/**
 * Story Brandenburg-Click-Guard: ein gültiger Berliner Punkt liefert einen
 * `bezirke`-LayerHit MIT non-null value (point-in-polygon-match). Außerhalb
 * der Berliner Landesgrenze liefert get-layers-at-point zwar einen bezirke-Hit
 * zurück, aber mit `value: null, reason: 'no-coverage'` (Polygon-Layer-Default).
 * Daher: Hit allein reicht nicht, value muss gesetzt sein.
 */
export function hasBerlinBezirkHit(hits: readonly LayerHit[]): boolean {
	for (const hit of hits) {
		if (hit.layer !== BEZIRKE_SLUG) continue;
		if (hit.value === null || hit.value === undefined) continue;
		if (hit.reason === 'no-coverage') continue;
		return true;
	}
	return false;
}
