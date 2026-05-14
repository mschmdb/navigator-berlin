import { describe, expect, it } from 'vitest';
import {
	approximateTokens,
	buildLlmExportMarkdown,
	type LlmExportInput
} from './llm-export-builder.js';
import type { LayerHit, LayerMetadata, ClimateStation, ClimateData } from '$lib/data';
import type {
	NearestStop,
	Modus
} from '$lib/components/atlas/inspector-panel/internal/nearest-oepnv-stop.js';
import type { MobilityRating } from '$lib/components/atlas/inspector-panel/internal/mobility-rating.js';

const ADDRESS = {
	displayName: 'Boxhagener Straße 12, 10245 Berlin',
	lat: 52.5135,
	lng: 13.4622,
	bezirk: 'Friedrichshain-Kreuzberg',
	postcode: '10245'
};

const PERMALINK =
	'https://navigator.berlin/?address=13.46220,52.51350&q=Boxhagener+Stra%C3%9Fe+12&layers=wohnlagen-2024,laerm-2023';

const GENERATED_AT = '2026-05-14T08:30:00.000Z';

const META: LayerMetadata[] = [
	{
		slug: 'bezirke',
		filename: 'bezirke.geojson',
		sourceUrl: 'https://daten.berlin.de/odis-bezirke',
		fetchedAt: '2026-04-01T00:00:00.000Z',
		license: 'dl-de/zero-2-0',
		sha256: 'abc',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 0, max: 22 },
		geometryType: 'MultiPolygon',
		featureCount: 12
	},
	{
		slug: 'wohnlagen-2024',
		filename: 'wohnlagen-2024.geojson',
		sourceUrl: 'https://mietspiegel.berlin.de/',
		fetchedAt: '2026-04-01T00:00:00.000Z',
		license: 'dl-de/by-2-0',
		sha256: 'def',
		bundleGroup: 'B: Wohn-Daten',
		zoomThresholds: { min: 8, max: 22 },
		geometryType: 'Polygon',
		featureCount: 540
	},
	{
		slug: 'laerm-2023',
		filename: 'laerm-2023.geojson',
		sourceUrl: 'https://daten.berlin.de/umweltatlas-2023',
		fetchedAt: '2026-04-01T00:00:00.000Z',
		license: 'dl-de/zero-2-0',
		sha256: 'ghi',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 6, max: 22 },
		geometryType: 'Polygon',
		featureCount: 540
	},
	{
		slug: 'stolpersteine',
		filename: 'stolpersteine.geojson',
		sourceUrl: 'https://www.stolpersteine-berlin.de/',
		fetchedAt: '2026-04-01T00:00:00.000Z',
		license: 'ODbL 1.0',
		sha256: 'jkl',
		bundleGroup: 'D: Memorial',
		zoomThresholds: { min: 14, max: 22 },
		geometryType: 'Point',
		featureCount: 9500
	},
	{
		slug: 'bodenrichtwerte',
		filename: 'bodenrichtwerte.geojson',
		sourceUrl: 'https://www.berlin.de/gutachterausschuss/',
		fetchedAt: '2026-04-01T00:00:00.000Z',
		license: 'dl-de/by-2-0',
		sha256: 'mno',
		bundleGroup: 'B: Wohn-Daten',
		zoomThresholds: { min: 8, max: 22 },
		geometryType: 'Polygon',
		featureCount: 5400
	}
];

const HITS: LayerHit[] = [
	{
		layer: 'bezirke',
		value: 'Friedrichshain-Kreuzberg',
		source: 'ODIS Berlin',
		updatedAt: '2026-01-01',
		license: 'dl-de/zero-2-0'
	},
	{
		layer: 'wohnlagen-2024',
		value: { wol_mode: 'gut', plr_name: 'Boxhagener Platz', count_total: 24 },
		source: 'Mietspiegel Berlin 2024',
		updatedAt: '2024-05-01',
		license: 'dl-de/by-2-0'
	},
	{
		layer: 'laerm-2023',
		value: { kategorie: 'hoch', plr_name: 'Boxhagener Platz' },
		source: 'Berliner Umweltatlas 2023',
		updatedAt: '2023-08-01',
		license: 'dl-de/zero-2-0'
	},
	{
		layer: 'stolpersteine',
		value: { person: 'Erna Beispiel' },
		source: 'stolpersteine-berlin.de',
		updatedAt: '2024-01-01',
		license: 'ODbL 1.0'
	},
	{
		layer: 'bodenrichtwerte',
		value: { brw: 4500, nutzung: 'Wohnen' },
		source: 'Gutachterausschuss Berlin',
		updatedAt: '2025-12-01',
		license: 'dl-de/by-2-0'
	}
];

const CLIMATE_STATION: ClimateStation = {
	id: '00403',
	name: 'Berlin-Dahlem',
	coordinates: [13.301, 52.4537],
	firstYear: 1950
};

function climateSeriesFixture(): ClimateData {
	const summerDays: { year: number; count: number }[] = [];
	const frostDays: { year: number; count: number }[] = [];
	const hotDays: { year: number; count: number }[] = [];
	const annualMeanTemp: { year: number; temp: number }[] = [];
	for (let year = 1950; year <= 2025; year++) {
		const inOld = year >= 1961 && year <= 1990;
		const inNew = year >= 1991 && year <= 2020;
		summerDays.push({ year, count: inOld ? 30 : inNew ? 38 : year < 1961 ? 25 : 45 });
		frostDays.push({ year, count: inOld ? 50 : inNew ? 40 : year < 1961 ? 55 : 32 });
		hotDays.push({ year, count: inOld ? 5 : inNew ? 11 : year < 1961 ? 3 : 18 });
		annualMeanTemp.push({ year, temp: inOld ? 9.5 : inNew ? 10.5 : year < 1961 ? 9.2 : 11.4 });
	}
	return {
		stationId: '00403',
		name: 'Berlin-Dahlem',
		coordinates: [13.301, 52.4537],
		elevation: 51,
		firstYear: 1950,
		summerDays,
		frostDays,
		hotDays,
		annualMeanTemp
	};
}

const CLIMATE_SERIES: ClimateData = climateSeriesFixture();

const NEAREST_STOPS: Record<Modus, NearestStop | null> = {
	ubahn: { name: 'U Frankfurter Tor', lat: 52.515, lng: 13.464, distanceM: 220, walkingMin: 3 },
	sbahn: null,
	tram: { name: 'Boxhagener Straße', lat: 52.514, lng: 13.461, distanceM: 130, walkingMin: 2 },
	bus: { name: 'Boxhagener Platz', lat: 52.512, lng: 13.460, distanceM: 95, walkingMin: 2 }
};

const RATING: MobilityRating = {
	key: 'top',
	label: 'Sehr gut angebunden',
	severity: 'success',
	score: 6
};

function fullInput(): LlmExportInput {
	return {
		address: ADDRESS,
		permalinkUrl: PERMALINK,
		generatedAt: GENERATED_AT,
		layerHits: HITS,
		layerMeta: META,
		climate: { station: CLIMATE_STATION, series: CLIMATE_SERIES },
		oepnv: { nearest: NEAREST_STOPS, rating: RATING }
	};
}

describe('approximateTokens', () => {
	it('teilt Zeichenanzahl durch 4 mit Aufrundung', () => {
		expect(approximateTokens('')).toBe(0);
		expect(approximateTokens('abcd')).toBe(1);
		expect(approximateTokens('abcde')).toBe(2);
		expect(approximateTokens('a'.repeat(9))).toBe(3);
	});
});

describe('buildLlmExportMarkdown — Header', () => {
	it('enthält Adresse, Lat/Lng, Bezirk, Permalink, Stand', () => {
		const md = buildLlmExportMarkdown(fullInput());
		expect(md).toContain('# Boxhagener Straße 12, 10245 Berlin');
		expect(md).toContain('52.51350');
		expect(md).toContain('13.46220');
		expect(md).toContain('Friedrichshain-Kreuzberg');
		expect(md).toContain(PERMALINK);
		expect(md).toContain('2026-05-14');
	});
});

describe('buildLlmExportMarkdown — Sections', () => {
	it('rendert Section-Headings nur für nicht-leere Sektionen', () => {
		const md = buildLlmExportMarkdown(fullInput());
		expect(md).toContain('## Boundaries');
		expect(md).toContain('## Wohn-Daten');
		expect(md).toContain('## Umwelt');
		expect(md).toContain('## Memorial');
		expect(md).not.toContain('## Soziale Infrastruktur');
	});

	it('rendert pro Layer-Hit: Value + short + long + Quelle + Lizenz', () => {
		const md = buildLlmExportMarkdown(fullInput());
		expect(md).toContain('Wohnlage überwiegend gut');
		expect(md).toMatch(/Wohnlagen-Bewertung im Berliner Mietspiegel 2024/);
		expect(md).toContain('Mietspiegel Berlin 2024');
		expect(md).toContain('dl-de/by-2-0');
	});

	it('hängt legal-Disclaimer bei mietspiegel/bodenrichtwerte-Layern an', () => {
		const md = buildLlmExportMarkdown(fullInput());
		expect(md).toMatch(/Ersetzt keine rechtliche Aussage/);
	});

	it('markiert Stolperstein-Hit mit neverMachineTranslate-Hint', () => {
		const md = buildLlmExportMarkdown(fullInput());
		expect(md).toMatch(/Editorial sensible, bitte nicht algorithmisch interpretieren/);
	});

	// Story 1.23: Reason-aufdröseln im LLM-Export
	it('Reason coverage-out-of-scope → "Datensatz deckt diese Lage nicht ab"', () => {
		const input: LlmExportInput = {
			...fullInput(),
			layerHits: [
				{
					layer: 'wohnlagen-2024',
					value: null,
					reason: 'coverage-out-of-scope',
					source: 'Mietspiegel Berlin 2024',
					updatedAt: '2024-05-01',
					license: 'dl-de/by-2-0'
				}
			]
		};
		const md = buildLlmExportMarkdown(input);
		expect(md).toMatch(/Mietspiegel-Wohnlage.*Datensatz deckt diese Lage nicht ab/i);
		expect(md).not.toMatch(/Mietspiegel-Wohnlage.*Daten nicht vorhanden/);
	});

	it('Reason out-of-concept → "Nicht ausgewiesen für diese Lage"', () => {
		const input: LlmExportInput = {
			...fullInput(),
			layerHits: [
				{
					layer: 'wohnlagen-2024',
					value: null,
					reason: 'out-of-concept',
					source: 'Mietspiegel Berlin 2024',
					updatedAt: '2024-05-01',
					license: 'dl-de/by-2-0'
				}
			]
		};
		const md = buildLlmExportMarkdown(input);
		expect(md).toMatch(/Nicht ausgewiesen für diese Lage/);
	});

	it('Reason no-coverage → "Daten nicht vorhanden" (Default-Wording)', () => {
		const input: LlmExportInput = {
			...fullInput(),
			layerHits: [
				{
					layer: 'wohnlagen-2024',
					value: null,
					reason: 'no-coverage',
					source: 'Mietspiegel Berlin 2024',
					updatedAt: '2024-05-01',
					license: 'dl-de/by-2-0'
				}
			]
		};
		const md = buildLlmExportMarkdown(input);
		expect(md).toMatch(/Daten nicht vorhanden/);
	});
});

describe('buildLlmExportMarkdown — Klima-Section', () => {
	it('enthält Stations-ID + Name + jüngste Werte für Heiße-Tage/Frost-Tage/Mittelwert', () => {
		const md = buildLlmExportMarkdown(fullInput());
		expect(md).toContain('## Klima');
		expect(md).toContain('Berlin-Dahlem');
		expect(md).toContain('00403');
		expect(md).toContain('Heiße Tage');
		expect(md).toContain('Frost-Tage');
		expect(md).toMatch(/Mittel(wert|temperatur)/i);
	});

	it('liefert Min/Max/Latest pro Klima-Indikator', () => {
		const md = buildLlmExportMarkdown(fullInput());
		expect(md).toMatch(/Heiße Tage.*Min:.*Max:.*Latest:/);
		expect(md).toMatch(/Frost-Tage.*Min:.*Max:.*Latest:/);
	});

	it('liefert Normalperioden-Mittel 1961–1990 + 1991–2020 pro Indikator', () => {
		const md = buildLlmExportMarkdown(fullInput());
		expect(md).toMatch(/Heiße Tage.*1961.1990.*5/);
		expect(md).toMatch(/Heiße Tage.*1991.2020.*11/);
		expect(md).toMatch(/Frost-Tage.*1961.1990.*50/);
		expect(md).toMatch(/Frost-Tage.*1991.2020.*40/);
	});

	it('Jahres-Mittelwert mit Normalperioden 9,5 °C bzw 10,5 °C', () => {
		const md = buildLlmExportMarkdown(fullInput());
		expect(md).toMatch(/Mittel.*1961.1990.*9,5.*°C/);
		expect(md).toMatch(/Mittel.*1991.2020.*10,5.*°C/);
	});

	it('skippt Klima-Section wenn keine Station angegeben', () => {
		const md = buildLlmExportMarkdown({ ...fullInput(), climate: null });
		expect(md).not.toContain('## Klima');
	});
});

describe('buildLlmExportMarkdown — Mobilität-Section', () => {
	it('rendert Rating + Stops mit Distanz + Geh-Minuten', () => {
		const md = buildLlmExportMarkdown(fullInput());
		expect(md).toContain('## Mobilität');
		expect(md).toContain('Sehr gut angebunden');
		expect(md).toContain('U Frankfurter Tor');
		expect(md).toContain('220');
		expect(md).toContain('3 min');
		expect(md).toContain('Boxhagener Platz');
	});

	it('skippt Mobilität-Section wenn kein oepnv', () => {
		const md = buildLlmExportMarkdown({ ...fullInput(), oepnv: null });
		expect(md).not.toContain('## Mobilität');
	});

	it('skippt Modi ohne Treffer', () => {
		const md = buildLlmExportMarkdown(fullInput());
		// sbahn = null → kein S-Bahn-Zeile
		expect(md).not.toMatch(/^- S-Bahn:/m);
	});

	it('markiert soft-Stops mit "schwach angebunden"-Hinweis (Story 1.21)', () => {
		const soft: Record<Modus, NearestStop | null> = {
			ubahn: null,
			sbahn: {
				name: 'S Karow',
				lat: 52.6,
				lng: 13.5,
				distanceM: 880,
				walkingMin: 12,
				soft: true
			},
			tram: null,
			bus: null
		};
		const md = buildLlmExportMarkdown({
			...fullInput(),
			oepnv: {
				nearest: soft,
				rating: {
					key: 'schwach',
					label: 'Schwach angebunden',
					severity: 'warning',
					score: 0
				}
			}
		});
		expect(md).toContain('Schwach angebunden');
		expect(md).toMatch(/S-Bahn:.*S Karow.*880.*12 min.*schwach/);
	});
});

describe('buildLlmExportMarkdown — Footer', () => {
	it('enthält Stolperstein-Würde-Hint immer, auch ohne Stolperstein-Hit', () => {
		const md = buildLlmExportMarkdown({ ...fullInput(), layerHits: [HITS[0]] });
		expect(md).toMatch(/Stolperstein-Würde/);
		expect(md).toMatch(/Quellen-Links bleiben verbindlich/);
	});
});

describe('buildLlmExportMarkdown — Determinismus', () => {
	it('liefert identischen Output bei identischem Input', () => {
		const a = buildLlmExportMarkdown(fullInput());
		const b = buildLlmExportMarkdown(fullInput());
		expect(a).toBe(b);
	});
});
