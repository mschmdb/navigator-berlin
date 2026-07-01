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
