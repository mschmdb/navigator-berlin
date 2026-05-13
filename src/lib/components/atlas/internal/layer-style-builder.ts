import { COLORS } from './colors.js';

export type StyleProfile =
	| 'boundary'
	| 'choropleth-brw'
	| 'choropleth-belastung-3'
	| 'choropleth-versorgung-3'
	| 'choropleth-status-3'
	| 'choropleth-mehrfach'
	| 'choropleth-pet'
	| 'choropleth-wohnlage-3'
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
	| 'line-fahrradstrasse';

export interface MapLibreLayerSpec {
	id: string;
	type: 'line' | 'fill' | 'circle';
	source: string;
	paint?: Record<string, unknown>;
	layout?: Record<string, unknown>;
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
	'tram-netz': 'line-rail-tram'
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
		kind: 'gradient',
		items: [
			{ color: COLORS.accentSoft, label: '10 €/m²' },
			{ color: COLORS.chartCat6, label: '100' },
			{ color: COLORS.chartCat2, label: '1.000' },
			{ color: COLORS.vermillion, label: '10.000' }
		],
		range: ['niedrig', 'hoch']
	},
	'choropleth-belastung-3': {
		kind: 'categorical',
		items: [
			{ color: COLORS.accentSoft, label: 'gering' },
			{ color: COLORS.chartCat2, label: 'mittel' },
			{ color: COLORS.vermillion, label: 'hoch' }
		]
	},
	'choropleth-versorgung-3': {
		kind: 'categorical',
		items: [
			{ color: COLORS.chartCat3, label: 'gut' },
			{ color: COLORS.chartCat5, label: 'mittel' },
			{ color: COLORS.vermillion, label: 'schlecht' }
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
		kind: 'categorical',
		items: [
			{ color: COLORS.accentSoft, label: 'keinfach' },
			{ color: COLORS.chartCat6, label: 'einfach' },
			{ color: COLORS.chartCat5, label: 'zweifach' },
			{ color: COLORS.chartCat2, label: 'dreifach' },
			{ color: COLORS.vermillion, label: 'vierfach' }
		]
	},
	'choropleth-pet': {
		kind: 'gradient',
		items: [
			{ color: COLORS.chartCat6, label: '28 °C' },
			{ color: COLORS.chartCat5, label: '34' },
			{ color: COLORS.chartCat2, label: '38' },
			{ color: COLORS.vermillion, label: '42' }
		],
		range: ['kühl', 'heiß']
	},
	'choropleth-wohnlage-3': {
		kind: 'categorical',
		items: [
			{ color: COLORS.chartCat3, label: 'gut' },
			{ color: COLORS.chartCat5, label: 'mittel' },
			{ color: COLORS.vermillion, label: 'einfach' }
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
			// Bodenrichtwert EUR/m² · reale Range 0.6–60000, Median 500.
			// Logarithmische Stops für robuste Verteilung.
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
							1, // 10 EUR
							COLORS.accentSoft,
							2, // 100 EUR
							COLORS.chartCat6,
							3, // 1.000 EUR
							COLORS.chartCat2,
							4 // 10.000 EUR
							,
							COLORS.vermillion
						],
						'fill-opacity': 0.55,
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'choropleth-belastung-3':
			// Umweltatlas-Belastungs-Indikatoren (Laerm, Luft, Bioklima):
			// `kategorie` ∈ {gering, mittel, hoch}. Sequentiell Cloud-Dancer → Vermillion.
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
							COLORS.accentSoft,
							'mittel',
							COLORS.chartCat2,
							'hoch',
							COLORS.vermillion,
							COLORS.bg
						],
						'fill-opacity': 0.55,
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'choropleth-versorgung-3':
			// Gruenversorgung: `kategorie` ∈ {gut, mittel, schlecht}. Invertiert: gut=Indigo, schlecht=Vermillion.
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
							COLORS.chartCat3,
							'mittel',
							COLORS.chartCat5,
							'schlecht',
							COLORS.vermillion,
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
			// Umweltgerechtigkeit-Gesamt: `kategorie` ∈ {keinfach/einfach/zweifach/dreifach/vierfach}.
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
							COLORS.accentSoft,
							'einfach',
							COLORS.chartCat6,
							'zweifach',
							COLORS.chartCat5,
							'dreifach',
							COLORS.chartCat2,
							'vierfach',
							COLORS.vermillion,
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
			// Mietspiegel-Wohnlage Aggregat: `wol_mode` ∈ {einfach, mittel, gut, unbekannt}.
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
							COLORS.vermillion,
							'mittel',
							COLORS.chartCat5,
							'gut',
							COLORS.chartCat3,
							COLORS.accentSoft
						],
						'fill-opacity': 0.55,
						'fill-outline-color': COLORS.accent
					}
				}
			];
		case 'choropleth-pet':
			// PET 14 Uhr (gefühlte Temperatur, °C) — typischer Range ~28-42.
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
							COLORS.chartCat6,
							34,
							COLORS.chartCat5,
							38,
							COLORS.chartCat2,
							42,
							COLORS.vermillion
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
	}
}
