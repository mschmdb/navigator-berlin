/**
 * Punkt-Specs der Choroplethen-Sekundärdarstellung (Multi-Layer-Kartenfarben).
 *
 * Einheitliche Grammatik für ALLE LOR-Choroplethen, nicht nur die Scores:
 * Als Zweit-Layer rendert ein Choropleth abgestufte Quadrat-Symbole, ein
 * Symbol pro Fläche, Größe = ordinale Stufe der benannten Größe (mehr Lärm =
 * größer, mehr Grünversorgung = größer), Farbe = dunkler Anker seiner
 * Familie bzw. Dimension. Quadrat statt Kreis ist die Form-Grammatik der
 * Karte: Quadrat = Flächen-Aggregat, Kreis/Pin = konkreter Ort.
 *
 * PET fehlt bewusst: PMTiles lassen client-seitig keine Label-Punkte zu,
 * PMTiles-Choroplethen sind deshalb immer die Fläche, nie sekundär.
 */

import { COLORS } from './colors.js';
import { rampForSlug, SCORE_DOT_SIZES, SCORE_SLUGS } from './dimension-ramps.js';

export interface ChoroplethDotSpec {
	/** Farbe des Quadrat-Sprites: dunkler Familien- bzw. Dimensions-Anker. */
	readonly imageColor: string;
	/** MapLibre-Expression für icon-size (Faktor auf die Sprite-Basisgröße). */
	readonly sizeExpression: unknown[];
	/**
	 * Größenfaktoren in der Reihenfolge der Legenden-Items des Profils, damit
	 * die Legende exakt die Kartengrößen zeigt.
	 */
	readonly legendFactors: readonly number[];
}

function stepByValue(sizes: readonly [number, number, number, number]): unknown[] {
	const [s1, s2, s3, s4] = sizes;
	return ['step', ['to-number', ['get', 'value'], -1], s1, 0, s1, 26, s2, 51, s3, 76, s4];
}

function matchKategorie(
	pairs: readonly (readonly [string, number])[],
	fallback: number
): unknown[] {
	return ['match', ['get', 'kategorie'], ...pairs.flat(), fallback];
}

const BELASTUNG_3: ChoroplethDotSpec = {
	imageColor: COLORS.scaleLast5,
	sizeExpression: matchKategorie(
		[
			['gering', 0.4],
			['mittel', 0.65],
			['hoch', 1]
		],
		0.4
	),
	legendFactors: [0.4, 0.65, 1]
};

const SPEC_BY_SLUG: Record<string, ChoroplethDotSpec> = {
	'laerm-2023': BELASTUNG_3,
	'luft-2023': BELASTUNG_3,
	'bioklima-2023': BELASTUNG_3,
	'gruenversorgung-2023': {
		imageColor: COLORS.scaleGut5,
		sizeExpression: matchKategorie(
			[
				['gut', 1],
				['mittel', 0.65],
				['schlecht', 0.4]
			],
			0.4
		),
		// Legenden-Reihenfolge des Profils: gut, mittel, schlecht.
		legendFactors: [1, 0.65, 0.4]
	},
	'umweltgerechtigkeit-2023': {
		imageColor: COLORS.scaleLast5,
		sizeExpression: matchKategorie(
			[
				['keine starke Belastung', 0.3],
				['einfach', 0.45],
				['zweifach', 0.6],
				['dreifach', 0.75],
				['vierfach', 0.9],
				['fünffach', 1]
			],
			0.3
		),
		legendFactors: [0.3, 0.45, 0.6, 0.75, 0.9, 1]
	},
	'mss-gesamtindex-2025': {
		// Status-Index als ordinale Stufe, Strukturell-Indigo, keine Wertung.
		imageColor: COLORS.scaleStrukturell5,
		sizeExpression: [
			'match',
			['get', 'si_v'],
			'sehr niedrig',
			0.4,
			'niedrig',
			0.6,
			'mittel',
			0.8,
			'hoch',
			1,
			0.4
		],
		// Legenden-Reihenfolge: sehr niedrig, niedrig, mittel, hoch.
		legendFactors: [0.4, 0.6, 0.8, 1]
	},
	'wohnlagen-2024': {
		imageColor: COLORS.scaleStrukturell5,
		sizeExpression: ['match', ['get', 'wol_mode'], 'einfach', 0.45, 'mittel', 0.7, 'gut', 1, 0.45],
		legendFactors: [0.45, 0.7, 1]
	},
	'einwohner-dichte-2024': {
		imageColor: COLORS.scaleStrukturell5,
		sizeExpression: [
			'step',
			['to-number', ['get', 'dichte'], 0],
			0.3,
			5000,
			0.45,
			10000,
			0.6,
			16000,
			0.8,
			24000,
			1
		],
		legendFactors: [0.3, 0.45, 0.6, 0.8, 1]
	},
	bodenrichtwerte: {
		imageColor: COLORS.scaleStrukturell5,
		sizeExpression: ['step', ['to-number', ['get', 'brw'], 0], 0.4, 100, 0.6, 1000, 0.8, 10000, 1],
		// Legenden-Reihenfolge des BRW-Gradients: 10, 100, 1.000, 10.000 €/m².
		legendFactors: [0.4, 0.6, 0.8, 1]
	}
};

/** Punkt-Spec eines Choroplethen; null für alles ohne Sekundär-Punkte. */
export function dotSpecForSlug(slug: string): ChoroplethDotSpec | null {
	const ramp = rampForSlug(slug);
	if (ramp) {
		return {
			imageColor: ramp[4],
			sizeExpression: stepByValue(SCORE_DOT_SIZES),
			legendFactors: [...SCORE_DOT_SIZES]
		};
	}
	return SPEC_BY_SLUG[slug] ?? null;
}

/** MapLibre-Image-ID des Quadrat-Sprites (Namensschema aus der Score-Phase). */
export function choroplethDotImageId(slug: string): string {
	return `navigator-score-dot-${slug}`;
}

/** Alle Punkt-fähigen Choroplethen, für die MapLibre-Sprite-Registrierung. */
export const DOT_CAPABLE_SLUGS: readonly string[] = [...SCORE_SLUGS, ...Object.keys(SPEC_BY_SLUG)];
