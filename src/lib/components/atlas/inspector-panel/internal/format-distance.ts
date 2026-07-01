/**
 * Distanz in Nutzer-Sprache: unter 1 km in Metern, darüber in Kilometern mit deutschem
 * Dezimalkomma. Geteilt von kuehle-orte-card und in-deiner-naehe, damit die beiden Flächen
 * nicht auseinanderdriften.
 */
export function formatDistanceDe(m: number): string {
	if (m < 1000) return `${m} m`;
	return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}
