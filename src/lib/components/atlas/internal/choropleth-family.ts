// Story 1.31 AC-8/11: Zentrales Mapping aller Choropleth-Layer auf 3 Skalen-Familien.
// - last (Vermillion): Umwelt-Belastung. Umwelt-Schaden ist Schaden, kein Stigma.
// - gut (Grün): Versorgung/Score-Positiv. Hell→dunkel = besser.
// - strukturell (Indigo): Sozial/Wohn/Boden. Kategorial wertfrei.

export type ScaleFamily = 'last' | 'gut' | 'strukturell';

export interface FamilyWithFlags {
	readonly family: ScaleFamily;
	readonly pendingValidation?: boolean;
}

export type LayerFamilyMapping = ScaleFamily | FamilyWithFlags;

export const LAYER_TO_CHOROPLETH_FAMILY: Record<string, LayerFamilyMapping> = {
	// Last: Umwelt-Belastung (Vermillion ok, Schaden ist Schaden)
	'laerm-2023': 'last',
	'luft-2023': 'last',
	'bioklima-2023': 'last',
	'klima-pet-2022': 'last',
	'umweltgerechtigkeit-2023': 'last',
	// Gut: Versorgung + positiver Score (Grün)
	'gruenversorgung-2023': 'gut',
	'kiez-score-ruhe-luft': 'gut',
	'kiez-score-gruen-hitze': 'gut',
	'kiez-score-versorgung': 'gut',
	'kiez-score-wohnschutz': 'gut',
	// Mobilität: aktuell gut, pending Smoke-Test (Story 1.31 AC-9)
	'kiez-score-mobilitaet': { family: 'gut', pendingValidation: true },
	// Strukturell: Wertfrei (Sozial, Wohn, Boden)
	'mss-gesamtindex-2025': 'strukturell',
	'wohnlagen-2024': 'strukturell',
	bodenrichtwerte: 'strukturell'
};

function unwrapFamily(mapping: LayerFamilyMapping): ScaleFamily {
	return typeof mapping === 'string' ? mapping : mapping.family;
}

export function getChoroplethFamily(slug: string): ScaleFamily | null {
	const mapping = LAYER_TO_CHOROPLETH_FAMILY[slug];
	if (!mapping) return null;
	return unwrapFamily(mapping);
}

export function isPendingValidation(slug: string): boolean {
	const mapping = LAYER_TO_CHOROPLETH_FAMILY[slug];
	if (!mapping || typeof mapping === 'string') return false;
	return mapping.pendingValidation === true;
}

export type ClassificationMethod =
	| 'manual'
	| 'equal-interval'
	| 'quantile'
	| 'manual-quartile'
	| 'manual-categorical';

export const LAYER_CLASSIFICATION_METHOD: Record<string, ClassificationMethod> = {
	'laerm-2023': 'manual', // EU-Umgebungslärm-Richtlinie
	'luft-2023': 'manual', // WHO/EU-Grenzwerte
	'bioklima-2023': 'manual', // Umweltatlas-Kategorien
	'klima-pet-2022': 'equal-interval', // 28-42°C Spreizung
	'umweltgerechtigkeit-2023': 'manual', // keinfach..vierfach
	'gruenversorgung-2023': 'manual', // Umweltatlas-Kategorien
	'kiez-score-ruhe-luft': 'manual-quartile', // 0/26/51/76
	'kiez-score-gruen-hitze': 'manual-quartile',
	'kiez-score-mobilitaet': 'manual-quartile',
	'kiez-score-wohnschutz': 'manual-quartile',
	'kiez-score-versorgung': 'manual-quartile',
	'mss-gesamtindex-2025': 'manual-categorical', // si_v sehr niedrig..hoch
	'wohnlagen-2024': 'manual-categorical', // Mietspiegel-Stufen
	bodenrichtwerte: 'quantile' // Long-Tail 0.6-60000 EUR/m²
};

export function getClassificationMethod(slug: string): ClassificationMethod | null {
	return LAYER_CLASSIFICATION_METHOD[slug] ?? null;
}

// AC-10: Stage-Subsets für 3/4/5-stufige Profile (5 Tokens als Master).
export const SCALE_STAGE_SUBSETS: Record<3 | 4 | 5, readonly number[]> = {
	3: [1, 3, 5],
	4: [1, 2, 4, 5],
	5: [1, 2, 3, 4, 5]
};

export interface FamilyTokens {
	readonly last: readonly string[];
	readonly gut: readonly string[];
	readonly strukturell: readonly string[];
}

// Build-generated CSS-Variable-Names (5 Stufen pro Familie). Konsumenten lesen via getComputedStyle.
export const SCALE_TOKEN_NAMES: FamilyTokens = {
	last: ['--scale-last-1', '--scale-last-2', '--scale-last-3', '--scale-last-4', '--scale-last-5'],
	gut: ['--scale-gut-1', '--scale-gut-2', '--scale-gut-3', '--scale-gut-4', '--scale-gut-5'],
	strukturell: [
		'--scale-strukturell-1',
		'--scale-strukturell-2',
		'--scale-strukturell-3',
		'--scale-strukturell-4',
		'--scale-strukturell-5'
	]
};

// Fallback-Hex-Werte (gespiegelt aus app.css), für Build-Time-Rendering ohne CSSOM.
export const SCALE_TOKEN_VALUES: FamilyTokens = {
	last: ['#8F7972', '#90675B', '#905545', '#8F412E', '#8C2A14'],
	gut: ['#79887A', '#647C66', '#4F7153', '#396641', '#1F5A2E'],
	strukturell: ['#797D88', '#656E86', '#515E83', '#3D4F80', '#2A3F7C']
};

export function pickStages(family: ScaleFamily, count: 3 | 4 | 5): readonly string[] {
	const all = SCALE_TOKEN_VALUES[family];
	return SCALE_STAGE_SUBSETS[count].map((stage) => all[stage - 1]);
}
