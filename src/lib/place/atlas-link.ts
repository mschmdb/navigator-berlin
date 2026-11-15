/**
 * Query für „Auf der Karte ansehen“: Layer des Kapitels, Karte auf den Ort zentriert, Name in
 * der Suche. Dasselbe Format wie die bestehenden Deep-Links in den Atlas (`/explore?layers=…`).
 */
export function atlasQuery(
	layers: string,
	centroid: readonly [number, number],
	name: string
): string {
	const [lng, lat] = centroid;
	return new URLSearchParams({
		layers,
		address: `${lng.toFixed(4)},${lat.toFixed(4)}`,
		q: name
	}).toString();
}
