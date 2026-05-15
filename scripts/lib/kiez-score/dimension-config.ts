import type { DimensionConfig } from './types.js';

export const RUHE_LUFT_CONFIG: DimensionConfig = {
	dimension: 'ruhe-luft',
	layers: [
		{ layer: 'laerm-2023', weight: 0.4, normalize: { kind: 'ordinal-3', field: 'kategorie' } },
		{ layer: 'luft-2023', weight: 0.4, normalize: { kind: 'ordinal-3', field: 'kategorie' } },
		{ layer: 'bioklima-2023', weight: 0.2, normalize: { kind: 'ordinal-3', field: 'kategorie' } }
	],
	fallback: {
		layer: 'umweltgerechtigkeit-2023',
		weight: 1.0,
		normalize: { kind: 'ordinal-3', field: 'kategorie' }
	}
};

export const GRUEN_CONFIG: DimensionConfig = {
	dimension: 'gruen',
	layers: [
		{
			layer: 'gruenversorgung-2023',
			weight: 0.6,
			normalize: { kind: 'ordinal-4', field: 'kategorie' }
		},
		{
			layer: 'klima-kaltlufteinwirkbereich-2022',
			weight: 0.2,
			normalize: { kind: 'presence' }
		},
		{
			layer: 'klima-leitbahnkorridor-2022',
			weight: 0.2,
			normalize: { kind: 'presence' }
		}
	]
};

export const MOBILITAET_DISTANCE_THRESHOLD_M = 1000;

export const MOBILITAET_CONFIG: DimensionConfig = {
	dimension: 'mobilitaet',
	layers: [
		{
			layer: 'oepnv-ubahn',
			weight: 0.35,
			normalize: { kind: 'mode-distance', mode: 'ubahn', threshold: MOBILITAET_DISTANCE_THRESHOLD_M }
		},
		{
			layer: 'oepnv-sbahn',
			weight: 0.25,
			normalize: { kind: 'mode-distance', mode: 'sbahn', threshold: MOBILITAET_DISTANCE_THRESHOLD_M }
		},
		{
			layer: 'oepnv-tram',
			weight: 0.2,
			normalize: { kind: 'mode-distance', mode: 'tram', threshold: MOBILITAET_DISTANCE_THRESHOLD_M }
		},
		{
			layer: 'oepnv-bus',
			weight: 0.1,
			normalize: { kind: 'mode-distance', mode: 'bus', threshold: MOBILITAET_DISTANCE_THRESHOLD_M }
		},
		{
			layer: 'radverkehr-presence',
			weight: 0.1,
			normalize: {
				kind: 'presence-any-of',
				layers: ['radverkehrsnetz-2025', 'fahrradstrassen-2024']
			}
		}
	]
};

export const SOZIALE_LAGE_CONFIG: DimensionConfig = {
	dimension: 'soziale-lage',
	layers: [
		{
			layer: 'mss-gesamtindex-2025',
			weight: 1.0,
			normalize: { kind: 'mss-status-4', field: 'si_v' }
		}
	],
	intrinsicGuard: (raw: unknown): boolean => {
		if (!raw || typeof raw !== 'object') return false;
		const obj = raw as Record<string, unknown>;
		return obj.kom === 'gültig';
	}
};

export const VERSORGUNG_CONFIG: DimensionConfig = {
	dimension: 'versorgung',
	layers: [
		{
			layer: 'kitas-2024',
			weight: 0.25,
			normalize: { kind: 'poi-distance', threshold: 500 }
		},
		{
			layer: 'schulen-2024',
			weight: 0.25,
			normalize: { kind: 'poi-distance', threshold: 800 }
		},
		{
			layer: 'krankenhaeuser-plan',
			weight: 0.2,
			normalize: { kind: 'poi-distance', threshold: 2000 }
		},
		{
			layer: 'spielplaetze',
			weight: 0.15,
			normalize: { kind: 'poi-distance', threshold: 400 }
		},
		{
			layer: 'gruenanlagen',
			weight: 0.15,
			normalize: { kind: 'poi-distance', threshold: 600 }
		}
	]
};

export const DIMENSION_CONFIGS = [
	RUHE_LUFT_CONFIG,
	GRUEN_CONFIG,
	MOBILITAET_CONFIG,
	SOZIALE_LAGE_CONFIG,
	VERSORGUNG_CONFIG
] as const;
