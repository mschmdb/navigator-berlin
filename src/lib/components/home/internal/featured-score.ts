/** Voll-Score eines Featured-Kiez für den Live-Ring auf der Landing. */
export interface HomeFeaturedScore {
	readonly slug: string;
	readonly displayName: string;
	readonly composite: number | null;
	readonly ruheLuft: number | null;
	readonly gruenHitze: number | null;
	readonly mobilitaet: number | null;
	readonly versorgung: number | null;
	readonly wohnschutz: number | null;
	/** Deep-Link auf die Karte am Kiez-Centroid (address=lng,lat&q=name). */
	readonly exploreHref: string;
}

export interface KiezScoreRowLike {
	readonly slug: string;
	readonly composite: number | null;
	readonly ruheLuft: number | null;
	readonly gruenHitze: number | null;
	readonly mobilitaet: number | null;
	readonly versorgung: number | null;
	readonly wohnschutz: number | null;
}

/**
 * #102: Der Hero zeigt die Kiez-Werte aus `kiez_score`, also dieselbe Quelle wie Rangliste
 * und Kiez-Seite. Vorher kam der Wert vom Punkt-Score am Kiez-Mittelpunkt und wich ab
 * (Südliche Luisenstadt 67 statt 64, Mobilität 21 statt 33).
 */
export function buildFeaturedScore(
	row: KiezScoreRowLike,
	displayName: string,
	centroid: readonly [number, number]
): HomeFeaturedScore {
	const lng = centroid[0].toFixed(5);
	const lat = centroid[1].toFixed(5);
	return {
		slug: row.slug,
		displayName,
		composite: row.composite,
		ruheLuft: row.ruheLuft,
		gruenHitze: row.gruenHitze,
		mobilitaet: row.mobilitaet,
		versorgung: row.versorgung,
		wohnschutz: row.wohnschutz,
		exploreHref: `/explore?address=${lng},${lat}&q=${encodeURIComponent(displayName)}`
	};
}
