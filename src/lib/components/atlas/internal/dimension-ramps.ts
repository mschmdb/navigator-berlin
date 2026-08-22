/**
 * Dimension-Rampen für die Kiez-Score-Choroplethen (Multi-Layer-Kartenfarben).
 *
 * Vor diesem Modul teilten alle Score-Dimensionen die eine Gut-Grün-Rampe aus
 * Story 1.31. Zwei aktive Dimensionen waren farblich identisch, zusammen mit
 * den grünen Kaltluft-Highlights entstand der Grün-Matsch. Jetzt: Hue kodiert
 * die Dimension, Helligkeit den Wert. Hell→dunkel = besser bleibt als
 * Anti-Stigma-Richtung (ADR-015) erhalten.
 *
 * Erzeugt über `buildScaleFamily` (scripts/lib/check-scale-contrast.ts) aus
 * OKLCH-Endankern (L 0.42, C 0.11) mit gleichmäßig gespreizten Hues; der
 * Golden-Test in scripts/generate-dimension-ramps.test.ts hält Konstanten und
 * Generator synchron. Grenzen der Unterscheidbarkeit sind gemessen (Machado-
 * CVD-Simulation auf komposierte 0.55-Fills): gleiche Stufen verschiedener
 * Rampen sind unter Deuteranopie NICHT paarweise distinct, das ist mit 8 Hues
 * unerreichbar. Die Karte kompensiert strukturell: Die Kaskade rendert immer
 * nur eine Fläche, weitere Polygon-Layer werden Konturen (solid/gestrichelt),
 * Identität hängt an Hue + Linienstil + Legende, nie an Farbe allein.
 */

import { COLORS } from './colors.js';

export type DimensionRampKey =
	| 'gesamt'
	| 'ruhe-luft'
	| 'gruen-hitze'
	| 'mobilitaet'
	| 'versorgung'
	| 'wohnschutz'
	| 'kultur'
	| 'kriminalitaet';

export type Ramp = readonly [string, string, string, string, string];

const GUT: Ramp = [
	COLORS.scaleGut1,
	COLORS.scaleGut2,
	COLORS.scaleGut3,
	COLORS.scaleGut4,
	COLORS.scaleGut5
];

const STRUKTURELL: Ramp = [
	COLORS.scaleStrukturell1,
	COLORS.scaleStrukturell2,
	COLORS.scaleStrukturell3,
	COLORS.scaleStrukturell4,
	COLORS.scaleStrukturell5
];

export const DIMENSION_RAMPS: Record<DimensionRampKey, Ramp> = {
	// Grün bleibt die Score-Identität: Gesamt + Grün & Hitze auf der Gut-Rampe.
	gesamt: GUT,
	'gruen-hitze': GUT,
	// Eigene Hues: Blau 238, Violett 308, Ocker 85, Teal 193, Beere 350.
	// Endanker-L pro Hue so gesetzt, dass jede Rampe trotz des 3:1-Kontrast-Gates
	// (staucht den hellen Start) die Spannweite der Bestands-Familien erreicht
	// (ΔL ≈ 0.05 je Stufe). Rezept im Golden-Test.
	'ruhe-luft': ['#5C7281', '#47657B', '#325875', '#1C4B6F', '#003D69'],
	mobilitaet: ['#8C8197', '#806F90', '#755E8A', '#694C82', '#5E3A7B'],
	versorgung: ['#90856F', '#867557', '#7C663F', '#725626', '#684600'],
	wohnschutz: ['#577674', '#456A69', '#335F5D', '#1E5353', '#004848'],
	kultur: ['#977E89', '#906B7C', '#88576F', '#804462', '#772F55'],
	// ADR-019: Kriminalität bleibt Strukturell-Indigo, Magnitude ohne Wertung.
	kriminalitaet: STRUKTURELL
};

const SLUG_TO_KEY: Record<string, DimensionRampKey> = {
	'kiez-score-gesamt': 'gesamt',
	'kiez-score-ruhe-luft': 'ruhe-luft',
	'kiez-score-gruen-hitze': 'gruen-hitze',
	'kiez-score-mobilitaet': 'mobilitaet',
	'kiez-score-versorgung': 'versorgung',
	'kiez-score-wohnschutz': 'wohnschutz',
	'kiez-score-kultur': 'kultur',
	'kiez-score-kriminalitaet': 'kriminalitaet'
};

/** Rampe eines Score-Layers; null für alles, was beim Familien-System bleibt. */
export function rampForSlug(slug: string): Ramp | null {
	const key = SLUG_TO_KEY[slug];
	return key ? DIMENSION_RAMPS[key] : null;
}

/**
 * Kaltluft-Flächen (Einwirkbereich, Leitbahnkorridor): helles Cyan statt des
 * alten Score-Grüns chartCat3. Hell, damit die Fläche als Wash unter den
 * Choroplethen liest, kühl, weil Kaltluft. OKLCH L 0.72 / C 0.09 / H 215.
 */
export const KALTLUFT_HIGHLIGHT = '#5AB3C8';

/**
 * Punktsymbole der sekundären Score-Dimension: Basisgröße des Kreis-Sprites in
 * Pixeln und die vier icon-size-Faktoren nach Wert-Quartil (klein→groß =
 * besser). Abgestufte Symbole statt Konturnetz: Ein Liniennetz über 542
 * LOR-Flächen wird zum Gekritzel, ein Kreis pro Fläche bleibt lesbar.
 * Karte und Legende teilen diese Werte.
 */
export const SCORE_DOT_BASE_PX = 18;
export const SCORE_DOT_SIZES: readonly [number, number, number, number] = [0.33, 0.5, 0.72, 1];

/** MapLibre-Image-ID des Kreis-Sprites einer Score-Dimension. */
export function scoreDotImageId(slug: string): string {
	return `navigator-score-dot-${slug}`;
}
