// Story 16.2: DWD-Hitzewarnung. Flüchtige Laufzeit-Daten, kein Build-Layer.
export type HeatLevel = 'stark' | 'extrem';

export interface HeatWarning {
	level: HeatLevel;
	/** „Starke Hitze" / „Extreme Hitze". */
	label: string;
	/** DWD-Headline/Kurzinfo. */
	headline: string;
	/** Pflicht-Attribution (GeoNutzV/DWD). */
	source: string;
	sourceUrl: string;
}

// Issue #60: DWD-Kältewarnungen (Frost, Glätte, Schnee) ab Stufe 2.
export type ColdEvent =
	| 'strenger-frost'
	| 'markante-glaette'
	| 'glatteis'
	| 'extremes-glatteis'
	| 'schneefall'
	| 'starker-schneefall'
	| 'extrem-starker-schneefall'
	| 'schneeverwehung'
	| 'starke-schneeverwehung'
	| 'extrem-starke-schneeverwehung';

export type ColdLevel = 2 | 3 | 4;

export interface ColdWarning {
	event: ColdEvent;
	/** DWD-Warnstufe 2 bis 4. */
	level: ColdLevel;
	/** DWD-Headline (getrimmt), `null` bei fehlender oder leerer Headline. */
	headline: string | null;
	/** Pflicht-Attribution (GeoNutzV/DWD). */
	source: string;
	sourceUrl: string;
}
