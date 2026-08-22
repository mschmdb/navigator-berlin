import { describe, expect, it } from 'vitest';
import { COLORS } from './colors.js';
import { DIMENSION_RAMPS, SCORE_DOT_SIZES } from './dimension-ramps.js';
import { choroplethDotImageId, dotSpecForSlug } from './choropleth-dots.js';

describe('dotSpecForSlug', () => {
	it('liefert für jeden Score-Layer Spec mit Dimension-Anker und Quartil-Größen', () => {
		const spec = dotSpecForSlug('kiez-score-ruhe-luft');
		expect(spec?.imageColor).toBe(DIMENSION_RAMPS['ruhe-luft'][4]);
		expect(spec?.sizeExpression).toEqual([
			'step',
			['to-number', ['get', 'value'], -1],
			SCORE_DOT_SIZES[0],
			0,
			SCORE_DOT_SIZES[0],
			26,
			SCORE_DOT_SIZES[1],
			51,
			SCORE_DOT_SIZES[2],
			76,
			SCORE_DOT_SIZES[3]
		]);
		expect(spec?.legendFactors).toEqual([...SCORE_DOT_SIZES]);
	});

	it('mappt kategoriale Belastungs-Layer auf drei Größen im Last-Anker', () => {
		for (const slug of ['laerm-2023', 'luft-2023', 'bioklima-2023']) {
			const spec = dotSpecForSlug(slug);
			expect(spec?.imageColor).toBe(COLORS.scaleLast5);
			expect(spec?.sizeExpression).toEqual([
				'match',
				['get', 'kategorie'],
				'gering',
				0.4,
				'mittel',
				0.65,
				'hoch',
				1,
				0.4
			]);
			expect(spec?.legendFactors).toEqual([0.4, 0.65, 1]);
		}
	});

	it('Grünversorgung: gut = groß, Legend-Reihenfolge folgt der Profil-Legende (gut zuerst)', () => {
		const spec = dotSpecForSlug('gruenversorgung-2023');
		expect(spec?.imageColor).toBe(COLORS.scaleGut5);
		expect(spec?.sizeExpression).toEqual([
			'match',
			['get', 'kategorie'],
			'gut',
			1,
			'mittel',
			0.65,
			'schlecht',
			0.4,
			0.4
		]);
		expect(spec?.legendFactors).toEqual([1, 0.65, 0.4]);
	});

	it('deckt die übrigen LOR-Choroplethen ab (mss, wohnlagen, dichte, brw, umweltgerechtigkeit)', () => {
		for (const slug of [
			'mss-gesamtindex-2025',
			'wohnlagen-2024',
			'einwohner-dichte-2024',
			'bodenrichtwerte',
			'umweltgerechtigkeit-2023'
		]) {
			const spec = dotSpecForSlug(slug);
			expect(spec).not.toBeNull();
			expect(spec?.legendFactors.length).toBeGreaterThanOrEqual(3);
		}
	});

	it('PET bleibt außen vor: PMTiles können keine Label-Punkte liefern', () => {
		expect(dotSpecForSlug('klima-pet-2022')).toBeNull();
	});

	it('Overlays, Boundaries und Punkt-Layer bekommen keine Dot-Specs', () => {
		for (const slug of [
			'klima-kaltlufteinwirkbereich-2022',
			'milieuschutz-erhaltungsmiete',
			'gruenanlagen',
			'bezirke',
			'ubahn-stationen',
			'unbekannt'
		]) {
			expect(dotSpecForSlug(slug)).toBeNull();
		}
	});
});

describe('choroplethDotImageId', () => {
	it('bleibt kompatibel zum bisherigen Score-Namensschema', () => {
		expect(choroplethDotImageId('laerm-2023')).toBe('navigator-score-dot-laerm-2023');
	});
});
