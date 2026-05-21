/**
 * Story 8.2a · Layer-Aggregat-Strategie-Registry (ADR-014 Abschnitt 3).
 *
 * Pro Inspector-Layer: Aggregat-Typ + Member-Modus + zu aggregierender Property-Key.
 *
 * Member-Modus:
 * - `plr`: Source-Features sind bereits 1:1 LOR-Planungsräume (`plr_id`). Zuordnung
 *   zu Kiez/Bezirk via LOR-Hierarchie (Prefix), KEIN Spatial-Intersect nötig.
 * - `spatial`: Freie Geometrie, Zuordnung via Repräsentativ-Punkt bzw. Flächen-Intersect.
 *
 * Daten-getriebene Abweichung von der Story-Annahme: `luft-2023` und `bioklima-2023`
 * liefern eine ordinale `kategorie` (hoch/mittel/gering), KEINEN numerischen Wert.
 * Daher ordinal-distribution statt numeric-median. Einziger echter numeric-median-Layer
 * ist `klima-pet-2022` (Feld `pet14h`).
 */

export type AggregateType =
	| 'numeric-median'
	| 'ordinal-distribution'
	| 'coverage-share'
	| 'area-share'
	| 'point-density'
	| 'not-aggregatable';

export type MemberMode = 'plr' | 'spatial';

export interface LayerStrategy {
	readonly type: AggregateType;
	/** Nur für berechnete Typen (numeric/ordinal/coverage/area) gesetzt. */
	readonly memberMode?: MemberMode;
	/** Property-Key der den aggregierten Wert trägt (numeric/ordinal). */
	readonly valueKey?: string;
	/** Stigma-Lock: keine Severity-Wertung beim Konsum (ADR-014 Abschnitt 5). */
	readonly neutral?: boolean;
}

export const LAYER_STRATEGY: Record<string, LayerStrategy> = {
	// PLR-keyed ordinale Belastungs-/Kategorie-Layer (542 Features, plr_id).
	'laerm-2023': { type: 'ordinal-distribution', memberMode: 'plr', valueKey: 'kategorie' },
	'luft-2023': { type: 'ordinal-distribution', memberMode: 'plr', valueKey: 'kategorie' },
	'bioklima-2023': { type: 'ordinal-distribution', memberMode: 'plr', valueKey: 'kategorie' },
	'gruenversorgung-2023': {
		type: 'ordinal-distribution',
		memberMode: 'plr',
		valueKey: 'kategorie'
	},
	'umweltgerechtigkeit-2023': {
		type: 'ordinal-distribution',
		memberMode: 'plr',
		valueKey: 'kategorie',
		neutral: true
	},
	'wohnlagen-2024': {
		type: 'ordinal-distribution',
		memberMode: 'plr',
		valueKey: 'wol_mode',
		neutral: true
	},
	'mss-gesamtindex-2025': {
		type: 'ordinal-distribution',
		memberMode: 'plr',
		valueKey: 'si_v',
		neutral: true
	},

	// Numeric-median (Raster, spatial).
	'klima-pet-2022': { type: 'numeric-median', memberMode: 'spatial', valueKey: 'pet14h' },

	// Coverage-share (Flächenanteil mit Treffer, spatial intersect).
	'klima-kaltlufteinwirkbereich-2022': { type: 'coverage-share', memberMode: 'spatial' },
	'klima-leitbahnkorridor-2022': { type: 'coverage-share', memberMode: 'spatial' },
	'milieuschutz-erhaltungsmiete': { type: 'coverage-share', memberMode: 'spatial' },
	'milieuschutz-staedtebau': { type: 'coverage-share', memberMode: 'spatial' },
	'denkmal-2024': { type: 'coverage-share', memberMode: 'spatial' },

	// Area-share (Grün-/Spielflächen-Anteil, spatial intersect).
	gruenanlagen: { type: 'area-share', memberMode: 'spatial' },
	spielplaetze: { type: 'area-share', memberMode: 'spatial' },

	// Nicht aggregierbar (methodisch verboten, ADR-014).
	bodenrichtwerte: { type: 'not-aggregatable' }
};

/** Default-Strategie aus dem Geometrie-Typ für Layer ohne expliziten Eintrag. */
export function strategyForGeometry(geometryType: string): LayerStrategy {
	if (geometryType === 'Point') return { type: 'point-density' };
	return { type: 'not-aggregatable' };
}

export function getLayerStrategy(slug: string, geometryType: string): LayerStrategy {
	return LAYER_STRATEGY[slug] ?? strategyForGeometry(geometryType);
}

/** Layer die tatsächlich vorberechnet werden (alles außer point-density/not-aggregatable). */
export function isPrecomputed(strategy: LayerStrategy): boolean {
	return (
		strategy.type !== 'point-density' && strategy.type !== 'not-aggregatable'
	);
}
