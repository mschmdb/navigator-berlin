import { COLORS } from './colors.js';
import { hasPinIcon } from './pin-icon-mapping.js';
import { pinImageId } from './pin-sprite-renderer.js';

export type StyleProfile =
	| 'boundary'
	| 'choropleth-brw'
	| 'choropleth-belastung-3'
	| 'choropleth-versorgung-3'
	| 'choropleth-status-3'
	| 'choropleth-mehrfach'
	| 'choropleth-pet'
	| 'choropleth-wohnlage-3'
	| 'choropleth-mss-12'
	| 'choropleth-kiez-score-ordinal-4'
	| 'choropleth-kiez-score-soziale-lage'
	| 'polygon-highlight'
	| 'polygon-outline-soft'
	| 'point'
	| 'point-wohnlage'
	| 'point-ubahn'
	| 'point-sbahn'
	| 'point-tram'
	| 'point-bus'
	| 'point-bildung'
	| 'point-gesundheit'
	| 'point-freizeit'
	| 'line-radverkehr'
	| 'line-rail-ubahn'
	| 'line-rail-tram'
	| 'line-rail-sbahn'
	| 'line-fahrradstrasse';

export interface MapLibreLayerSpec {
	id: string;
	type: 'line' | 'fill' | 'circle' | 'symbol';
	source: string;
	paint?: Record<string, unknown>;
	layout?: Record<string, unknown>;
}

// Story 1.15: Pin-Icon-Layer (type=symbol) fuer 12 Point-Layer mit Lucide-Icons.
// Sprite-Image wird zur Laufzeit per map.addImage(pinImageId(slug), ...) registriert.
function buildPinSymbolSpec(slug: string, sourceId: string): MapLibreLayerSpec {
	return {
		id: `navigator-layer-${slug}`,
		type: 'symbol',
		source: sourceId,
		layout: {
			'icon-image': pinImageId(slug),
			// Native Pin = 28px; geschrumpft: ~11px <Zoom 11, ~14px Zoom 13, ~17px Zoom 16.
			'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.4, 13, 0.5, 16, 0.6],
			'icon-allow-overlap': true,
			'icon-ignore-placement': true,
			'icon-anchor': 'center'
		}
	};
}

export interface BuildOptions {
	reducedMotion?: boolean;
}

// Hardcoded Profile-Map. Phase-2: `styleProfile`-Field im Manifest (Story 1.3 Re-Run).
// Slug-Set hier MUSS mit `static/layers/MANIFEST.json` synchron sein.
export const LAYER_STYLE_PROFILE: Record<string, StyleProfile> = {
	// A: Boundaries
	bezirke: 'boundary',
	ortsteile: 'boundary',
	plz: 'boundary',
	// B: Wohn-Daten
	bodenrichtwerte: 'choropleth-brw',
	'wohnlagen-2024': 'choropleth-wohnlage-3',
	'milieuschutz-erhaltungsmiete': 'polygon-outline-soft',
	'milieuschutz-staedtebau': 'polygon-outline-soft',
	'mss-gesamtindex-2025': 'choropleth-mss-12',
	// C: Umwelt — Umweltatlas-Indikatoren
	'laerm-2023': 'choropleth-belastung-3',
	'luft-2023': 'choropleth-belastung-3',
	'bioklima-2023': 'choropleth-belastung-3',
	'gruenversorgung-2023': 'choropleth-versorgung-3',
	'umweltgerechtigkeit-2023': 'choropleth-mehrfach',
	// C: Umwelt — Klimaanalyse 2022
	'klima-pet-2022': 'choropleth-pet',
	'klima-kaltlufteinwirkbereich-2022': 'polygon-highlight',
	'klima-leitbahnkorridor-2022': 'polygon-highlight',
	// C: Umwelt — Gruenanlagen
	gruenanlagen: 'polygon-outline-soft',
	// D: Memorial
	stolpersteine: 'point',
	trinkbrunnen: 'point',
	// E: Soziale Infrastruktur
	'kitas-2024': 'point-bildung',
	'schulen-2024': 'point-bildung',
	'einschulbereiche-2024': 'polygon-outline-soft',
	'krankenhaeuser-plan': 'point-gesundheit',
	'krankenhaeuser-weitere': 'point-gesundheit',
	'sportanlagen-2024': 'point-freizeit',
	spielplaetze: 'polygon-outline-soft',
	schwimmbaeder: 'point-freizeit',
	// F: Mobilität
	'radverkehrsnetz-2025': 'line-radverkehr',
	'fahrradstrassen-2024': 'line-fahrradstrasse',
	'ubahn-stationen': 'point-ubahn',
	'sbahn-stationen': 'point-sbahn',
	'tram-haltestellen': 'point-tram',
	'bus-haltestellen': 'point-bus',
	'ubahn-netz': 'line-rail-ubahn',
	'tram-netz': 'line-rail-tram',
	'sbahn-netz': 'line-rail-sbahn',
	// G: Kiez-Score (Story 1.28)
	'kiez-score-ruhe-luft': 'choropleth-kiez-score-ordinal-4',
	'kiez-score-gruen': 'choropleth-kiez-score-ordinal-4',
	'kiez-score-mobilitaet': 'choropleth-kiez-score-ordinal-4',
	'kiez-score-soziale-lage': 'choropleth-kiez-score-soziale-lage',
	'kiez-score-versorgung': 'choropleth-kiez-score-ordinal-4'
};

const TRANSITION_MS = 200;

export function getStyleProfile(slug: string): StyleProfile {
	return LAYER_STYLE_PROFILE[slug] ?? 'boundary';
}

export function getTransitionDurationMs(options: BuildOptions = {}): number {
	return options.reducedMotion ? 0 : TRANSITION_MS;
}

export interface LegendItem {
	readonly color: string;
	readonly label: string;
}

export interface LegendSpec {
	readonly kind: 'categorical' | 'gradient' | 'line' | 'point';
	readonly items: readonly LegendItem[];
	/** Nur für gradient: Min/Max-Label am Rand. */
	readonly range?: readonly [string, string];
}

const LEGEND_BY_PROFILE: Record<StyleProfile, LegendSpec> = {
	boundary: {
		kind: 'line',
		items: [{ color: COLORS.accent, label: 'Grenze' }]
	},
	'choropleth-brw': {
		// Story 1.31: BRW = Strukturell (Indigo). Bodenwerte sind ökonomisches Faktum,
		// kein moralisches Urteil (kein Rot für „teuer"). Quantile-Klassifikation für Long-Tail.
		kind: 'gradient',
		items: [
			{ color: COLORS.scaleStrukturell1, label: '10 €/m²' },
			{ color: COLORS.scaleStrukturell2, label: '100' },
			{ color: COLORS.scaleStrukturell4, label: '1.000' },
			{ color: COLORS.scaleStrukturell5, label: '10.000' }
		],
		range: ['niedrig', 'hoch']
	},
	'choropleth-belastung-3': {
		// Story 1.31: Last-Familie (Vermillion). Umwelt-Schaden ist Schaden, kein Stigma.
		kind: 'categorical',
		items: [
			{ color: COLORS.scaleLast1, label: 'gering' },
			{ color: COLORS.scaleLast3, label: 'mittel' },
			{ color: COLORS.scaleLast5, label: 'hoch' }
		]
	},
	'choropleth-versorgung-3': {
		// Story 1.31: Gut-Familie (Grün). Hell→dunkel = besser.
		// Achtung Richtung: Versorgung-3 hat „schlecht" als dunkelsten Wert (originale Logik
		// invertiert). Wir lassen die Kategorial-Mapping-Reihenfolge bestehen, swappen aber Hue.
		kind: 'categorical',
		items: [
			{ color: COLORS.scaleGut5, label: 'gut' },
			{ color: COLORS.scaleGut3, label: 'mittel' },
			{ color: COLORS.scaleLast4, label: 'schlecht' }
		]
	},
	'choropleth-status-3': {
		kind: 'categorical',
		items: [
			{ color: COLORS.chartCat3, label: 'hoher Status' },
			{ color: COLORS.chartCat5, label: 'mittlerer Status' },
			{ color: COLORS.vermillion, label: 'niedriger Status' }
		]
	},
	'choropleth-mehrfach': {
		// Story 1.31: Last-Familie 5-stufig. Vermillion für Umweltgerechtigkeit-Mehrfach-Belastung.
		kind: 'categorical',
		items: [
			{ color: COLORS.scaleLast1, label: 'keinfach' },
			{ color: COLORS.scaleLast2, label: 'einfach' },
			{ color: COLORS.scaleLast3, label: 'zweifach' },
			{ color: COLORS.scaleLast4, label: 'dreifach' },
			{ color: COLORS.scaleLast5, label: 'vierfach' }
		]
	},
	'choropleth-pet': {
		// Story 1.31: Last-Gradient (Vermillion). Equal-Interval 28-42°C.
		kind: 'gradient',
		items: [
			{ color: COLORS.scaleLast1, label: '28 °C' },
			{ color: COLORS.scaleLast2, label: '34' },
			{ color: COLORS.scaleLast4, label: '38' },
			{ color: COLORS.scaleLast5, label: '42' }
		],
		range: ['kühl', 'heiß']
	},
	'choropleth-wohnlage-3': {
		// Story 1.31: Mietspiegel-Wohnlage = Strukturell (Indigo). „Stufe, keine Wertung".
		kind: 'categorical',
		items: [
			{ color: COLORS.scaleStrukturell1, label: 'einfach' },
			{ color: COLORS.scaleStrukturell3, label: 'mittel' },
			{ color: COLORS.scaleStrukturell5, label: 'gut' }
		]
	},
	'choropleth-mss-12': {
		// Story 1.31: MSS = Strukturell (Indigo). Status × Dynamik bleibt Hue+Opacity-Combo,
		// aber Hue ist Indigo-Sequenz statt vermillion-bunte-Matrix.
		kind: 'categorical',
		items: [
			{ color: COLORS.scaleStrukturell1, label: 'Status sehr niedrig' },
			{ color: COLORS.scaleStrukturell2, label: 'Status niedrig' },
			{ color: COLORS.scaleStrukturell4, label: 'Status mittel' },
			{ color: COLORS.scaleStrukturell5, label: 'Status hoch' }
		]
	},
	'choropleth-kiez-score-ordinal-4': {
		// Story 1.31: Kiez-Score-Gut-Layer (Ruhe-Luft/Grün/Versorgung/Mobilität) = Gut-Familie (Grün).
		// Hell→dunkel = besser. Stage-Subset 4 = {1,2,4,5}.
		kind: 'categorical',
		items: [
			{ color: COLORS.scaleGut1, label: 'gering' },
			{ color: COLORS.scaleGut2, label: 'mittel' },
			{ color: COLORS.scaleGut4, label: 'hoch' },
			{ color: COLORS.scaleGut5, label: 'sehr hoch' }
		]
	},
	'choropleth-kiez-score-soziale-lage': {
		// Story 1.31: Kiez-Score-Soziale-Lage = Strukturell (Indigo). Stage-Subset 4 = {1,2,4,5}.
		// Kein Rot-Grün, keine Severity-Wertung. „Stufe, keine Wertung".
		kind: 'categorical',
		items: [
			{ color: COLORS.scaleStrukturell1, label: 'Status sehr niedrig' },
			{ color: COLORS.scaleStrukturell2, label: 'Status niedrig' },
			{ color: COLORS.scaleStrukturell4, label: 'Status mittel' },
			{ color: COLORS.scaleStrukturell5, label: 'Status hoch' }
		]
	},
	'polygon-highlight': {
		kind: 'categorical',
		items: [{ color: COLORS.chartCat3, label: 'betroffen' }]
	},
	'polygon-outline-soft': {
		kind: 'categorical',
		items: [{ color: COLORS.accentSoft, label: 'Fläche' }]
	},
	point: {
		kind: 'point',
		items: [{ color: COLORS.accent, label: 'Standort' }]
	},
	'point-wohnlage': {
		kind: 'point',
		items: [
			{ color: COLORS.chartCat3, label: 'gut' },
			{ color: COLORS.chartCat5, label: 'mittel' },
			{ color: COLORS.vermillion, label: 'einfach' }
		]
	},
	'point-ubahn': {
		kind: 'point',
		items: [{ color: COLORS.indigo, label: 'U-Bahn-Station' }]
	},
	'point-sbahn': {
		kind: 'point',
		items: [{ color: COLORS.chartCat3, label: 'S-Bahn-Station' }]
	},
	'point-tram': {
		kind: 'point',
		items: [{ color: COLORS.vermillion, label: 'Tram-Haltestelle' }]
	},
	'point-bus': {
		kind: 'point',
		items: [{ color: COLORS.chartCat5, label: 'Bus-Haltestelle' }]
	},
	'point-bildung': {
		kind: 'point',
		items: [{ color: COLORS.chartCat4, label: 'Bildungs-Standort' }]
	},
	'point-gesundheit': {
		kind: 'point',
		items: [{ color: COLORS.vermillion, label: 'Gesundheits-Standort' }]
	},
	'point-freizeit': {
		kind: 'point',
		items: [{ color: COLORS.chartCat3, label: 'Freizeit-Standort' }]
	},
	'line-radverkehr': {
		kind: 'line',
		items: [
			{ color: COLORS.vermillion, label: 'Radvorrangnetz' },
			{ color: COLORS.chartCat3, label: 'Ergänzungsnetz' }
		]
	},
	'line-rail-ubahn': {
		kind: 'line',
		items: [{ color: COLORS.indigo, label: 'U-Bahn-Trasse' }]
	},
	'line-rail-tram': {
		kind: 'line',
		items: [{ color: COLORS.vermillion, label: 'Tram-Trasse' }]
	},
	'line-rail-sbahn': {
		kind: 'line',
		items: [{ color: COLORS.mobilitySbahn, label: 'S-Bahn-Trasse' }]
	},
	'line-fahrradstrasse': {
		kind: 'line',
		items: [{ color: COLORS.chartCat3, label: 'Fahrradstraße' }]
	}
};

export function getLegendSpec(slug: string): LegendSpec {
	const profile = getStyleProfile(slug);
	return LEGEND_BY_PROFILE[profile];
}

export function buildLayerSpec(
	slug: string,
	sourceId: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_options: BuildOptions = {}
): MapLibreLayerSpec[] {
	const profile = getStyleProfile(slug);
	const id = `navigator-layer-${slug}`;

	// Story 1.15: Pin-Icon-Layer haben Vorrang vor Circle-Profilen.
	if (hasPinIcon(slug)) {
		return [buildPinSymbolSpec(slug, sourceId)];
	}

	switch (profile) {
		case 'boundary':
			return [
				{
					id,
					type: 'line',
					source: sourceId,
					paint: {
						'line-color': COLORS.accent,
						'line-width': 1.25,
						'line-opacity': 0.85
					}
				}
			];
		case 'choropleth-brw':
			// Story 1.31: BRW = Strukturell-Indigo, Quantile-Klassifikation für Long-Tail.
			// Log10-Stops bleiben (näherungsweise Quantile-Effekt für 0.6-60000 EUR/m²).
			return [
				{
					id,
					type: 'fill',
					source: sourceId,
					paint: {
						'fill-color': [
							'interpolate',
							['linear'],
							['log10', ['max', ['to-number', ['get', 'brw'], 1], 1]],
							1,
							COLORS.scaleStrukturell1,
							2,
							COLORS.scaleStrukturell2,
							3,
							COLORS.scaleStrukturell4,
							4,
							COLORS.scaleStrukturell5
						],
						'fill-opacity': 0.55,
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'choropleth-belastung-3':
			// Story 1.31: Last-Familie Vermillion. Stage-Subset 3 = {1,3,5}.
			return [
				{
					id,
					type: 'fill',
					source: sourceId,
					paint: {
						'fill-color': [
							'match',
							['get', 'kategorie'],
							'gering',
							COLORS.scaleLast1,
							'mittel',
							COLORS.scaleLast3,
							'hoch',
							COLORS.scaleLast5,
							COLORS.bg
						],
						'fill-opacity': 0.55,
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'choropleth-versorgung-3':
			// Story 1.31: Gut-Familie (Grün) für „gut/mittel", Last für „schlecht" (Mangelversorgung).
			return [
				{
					id,
					type: 'fill',
					source: sourceId,
					paint: {
						'fill-color': [
							'match',
							['get', 'kategorie'],
							'gut',
							COLORS.scaleGut5,
							'mittel',
							COLORS.scaleGut3,
							'schlecht',
							COLORS.scaleLast4,
							COLORS.bg
						],
						'fill-opacity': 0.55,
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'choropleth-status-3':
			// Sozial: `kategorie` ∈ {hoher/mittlerer/niedriger Status-Index}.
			return [
				{
					id,
					type: 'fill',
					source: sourceId,
					paint: {
						'fill-color': [
							'match',
							['get', 'kategorie'],
							'hoher Status-Index',
							COLORS.chartCat3,
							'mittlerer Status-Index',
							COLORS.chartCat5,
							'niedriger Status-Index',
							COLORS.vermillion,
							COLORS.bg
						],
						'fill-opacity': 0.55,
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'choropleth-mehrfach':
			// Story 1.31: Last-Familie 5-stufig (Vermillion). Umweltgerechtigkeit-Mehrfachbelastung.
			return [
				{
					id,
					type: 'fill',
					source: sourceId,
					paint: {
						'fill-color': [
							'match',
							['get', 'kategorie'],
							'keinfach',
							COLORS.scaleLast1,
							'einfach',
							COLORS.scaleLast2,
							'zweifach',
							COLORS.scaleLast3,
							'dreifach',
							COLORS.scaleLast4,
							'vierfach',
							COLORS.scaleLast5,
							COLORS.bg
						],
						'fill-opacity': 0.6,
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'point':
			return [
				{
					id,
					type: 'circle',
					source: sourceId,
					paint: {
						'circle-color': COLORS.accent,
						'circle-radius': 4,
						'circle-stroke-color': COLORS.bg,
						'circle-stroke-width': 1
					}
				}
			];
		case 'choropleth-wohnlage-3':
			// Story 1.31: Mietspiegel-Wohnlage = Strukturell (Indigo). „Stufe, keine Wertung".
			return [
				{
					id,
					type: 'fill',
					source: sourceId,
					paint: {
						'fill-color': [
							'match',
							['get', 'wol_mode'],
							'einfach',
							COLORS.scaleStrukturell1,
							'mittel',
							COLORS.scaleStrukturell3,
							'gut',
							COLORS.scaleStrukturell5,
							COLORS.scaleStrukturell1
						],
						'fill-opacity': 0.55,
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'choropleth-mss-12':
			// Story 1.31: MSS = Strukturell (Indigo-Sequenz). Status = Hue, Dynamik = Opacity bleibt.
			return [
				{
					id,
					type: 'fill',
					source: sourceId,
					paint: {
						'fill-color': [
							'match',
							['get', 'si_v'],
							'hoch',
							COLORS.scaleStrukturell5,
							'mittel',
							COLORS.scaleStrukturell4,
							'niedrig',
							COLORS.scaleStrukturell2,
							'sehr niedrig',
							COLORS.scaleStrukturell1,
							COLORS.bg
						],
						'fill-opacity': [
							'match',
							['get', 'di_v'],
							'positiv',
							0.7,
							'stabil',
							0.55,
							'negativ',
							0.4,
							0.18
						],
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'choropleth-pet':
			// Story 1.31: Last-Familie (Vermillion). Equal-Interval 28-42°C.
			return [
				{
					id,
					type: 'fill',
					source: sourceId,
					paint: {
						'fill-color': [
							'interpolate',
							['linear'],
							['to-number', ['get', 'pet14h'], 30],
							28,
							COLORS.scaleLast1,
							34,
							COLORS.scaleLast2,
							38,
							COLORS.scaleLast4,
							42,
							COLORS.scaleLast5
						],
						'fill-opacity': 0.55,
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'polygon-highlight':
			return [
				{
					id,
					type: 'fill',
					source: sourceId,
					paint: {
						'fill-color': COLORS.chartCat3,
						'fill-opacity': 0.45,
						'fill-outline-color': COLORS.chartCat3
					}
				}
			];
		case 'polygon-outline-soft':
			return [
				{
					id,
					type: 'fill',
					source: sourceId,
					paint: {
						'fill-color': COLORS.accentSoft,
						'fill-opacity': 0.35,
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'point-wohnlage':
			// Mietspiegel-Wohnlage: einfach/mittel/gut. Vermillion → Cloud-Dancer → Green.
			return [
				{
					id,
					type: 'circle',
					source: sourceId,
					paint: {
						'circle-color': [
							'match',
							['get', 'wol'],
							'einfach',
							COLORS.vermillion,
							'mittel',
							COLORS.chartCat5,
							'gut',
							COLORS.chartCat3,
							COLORS.accentSoft
						],
						'circle-radius': 3,
						'circle-stroke-color': COLORS.bg,
						'circle-stroke-width': 0.5
					}
				}
			];
		case 'point-ubahn':
			return [
				{
					id,
					type: 'circle',
					source: sourceId,
					paint: {
						'circle-color': COLORS.indigo,
						'circle-radius': 5,
						'circle-stroke-color': COLORS.bg,
						'circle-stroke-width': 1.5
					}
				}
			];
		case 'point-sbahn':
			return [
				{
					id,
					type: 'circle',
					source: sourceId,
					paint: {
						'circle-color': COLORS.chartCat3,
						'circle-radius': 5,
						'circle-stroke-color': COLORS.bg,
						'circle-stroke-width': 1.5
					}
				}
			];
		case 'point-tram':
			return [
				{
					id,
					type: 'circle',
					source: sourceId,
					paint: {
						'circle-color': COLORS.vermillion,
						'circle-radius': 4,
						'circle-stroke-color': COLORS.bg,
						'circle-stroke-width': 1
					}
				}
			];
		case 'point-bus':
			return [
				{
					id,
					type: 'circle',
					source: sourceId,
					paint: {
						'circle-color': COLORS.chartCat5,
						'circle-radius': 3,
						'circle-stroke-color': COLORS.bg,
						'circle-stroke-width': 0.5
					}
				}
			];
		case 'point-bildung':
			return [
				{
					id,
					type: 'circle',
					source: sourceId,
					paint: {
						'circle-color': COLORS.chartCat4,
						'circle-radius': 4,
						'circle-stroke-color': COLORS.bg,
						'circle-stroke-width': 1
					}
				}
			];
		case 'point-gesundheit':
			return [
				{
					id,
					type: 'circle',
					source: sourceId,
					paint: {
						'circle-color': COLORS.vermillion,
						'circle-radius': 5,
						'circle-stroke-color': COLORS.bg,
						'circle-stroke-width': 1.5
					}
				}
			];
		case 'point-freizeit':
			return [
				{
					id,
					type: 'circle',
					source: sourceId,
					paint: {
						'circle-color': COLORS.chartCat3,
						'circle-radius': 4,
						'circle-stroke-color': COLORS.bg,
						'circle-stroke-width': 1
					}
				}
			];
		case 'line-radverkehr':
			return [
				{
					id,
					type: 'line',
					source: sourceId,
					paint: {
						'line-color': [
							'match',
							['get', 'ist_radvorrangnetz'],
							'Radvorrangnetz',
							COLORS.vermillion,
							COLORS.chartCat3
						],
						'line-width': 2,
						'line-opacity': 0.85
					}
				}
			];
		case 'line-rail-ubahn':
			return [
				{
					id,
					type: 'line',
					source: sourceId,
					paint: {
						'line-color': COLORS.indigo,
						'line-width': 1.5,
						'line-opacity': 0.7
					}
				}
			];
		case 'line-rail-tram':
			return [
				{
					id,
					type: 'line',
					source: sourceId,
					paint: {
						'line-color': COLORS.vermillion,
						'line-width': 1.25,
						'line-opacity': 0.7
					}
				}
			];
		case 'line-rail-sbahn':
			return [
				{
					id,
					type: 'line',
					source: sourceId,
					paint: {
						'line-color': COLORS.mobilitySbahn,
						'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 13, 2, 16, 3],
						'line-opacity': 0.85
					}
				}
			];
		case 'line-fahrradstrasse':
			return [
				{
					id,
					type: 'line',
					source: sourceId,
					paint: {
						'line-color': COLORS.chartCat3,
						'line-width': 2.5,
						'line-opacity': 0.85
					}
				}
			];
		case 'choropleth-kiez-score-ordinal-4':
			// Story 1.31: Gut-Familie (Grün). Hell→dunkel = besser. Stage-Subset 4 = {1,2,4,5}.
			return [
				{
					id,
					type: 'fill',
					source: sourceId,
					paint: {
						'fill-color': [
							'step',
							['to-number', ['get', 'value'], -1],
							COLORS.bg,
							0,
							COLORS.scaleGut1,
							26,
							COLORS.scaleGut2,
							51,
							COLORS.scaleGut4,
							76,
							COLORS.scaleGut5
						],
						'fill-opacity': 0.55,
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'choropleth-kiez-score-soziale-lage':
			// Story 1.31: Strukturell-Familie (Indigo). „Stufe, keine Wertung".
			return [
				{
					id,
					type: 'fill',
					source: sourceId,
					paint: {
						'fill-color': [
							'step',
							['to-number', ['get', 'value'], -1],
							COLORS.bg,
							0,
							COLORS.scaleStrukturell1,
							26,
							COLORS.scaleStrukturell2,
							51,
							COLORS.scaleStrukturell4,
							76,
							COLORS.scaleStrukturell5
						],
						'fill-opacity': 0.55,
						'fill-outline-color': COLORS.accent
					}
				}
			];
	}
}
