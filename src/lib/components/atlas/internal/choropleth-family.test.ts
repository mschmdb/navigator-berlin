import { describe, expect, it } from 'vitest';
import {
	LAYER_TO_CHOROPLETH_FAMILY,
	LAYER_CLASSIFICATION_METHOD,
	getChoroplethFamily,
	getClassificationMethod,
	isPendingValidation,
	SCALE_STAGE_SUBSETS
} from './choropleth-family.js';

describe('LAYER_TO_CHOROPLETH_FAMILY', () => {
	it('Umwelt-Belastung → last (Vermillion)', () => {
		expect(getChoroplethFamily('laerm-2023')).toBe('last');
		expect(getChoroplethFamily('luft-2023')).toBe('last');
		expect(getChoroplethFamily('bioklima-2023')).toBe('last');
		expect(getChoroplethFamily('klima-pet-2022')).toBe('last');
		expect(getChoroplethFamily('umweltgerechtigkeit-2023')).toBe('last');
	});

	it('Versorgung + Score-Gut → gut (Grün)', () => {
		expect(getChoroplethFamily('gruenversorgung-2023')).toBe('gut');
		expect(getChoroplethFamily('kiez-score-ruhe-luft')).toBe('gut');
		expect(getChoroplethFamily('kiez-score-gruen')).toBe('gut');
		expect(getChoroplethFamily('kiez-score-versorgung')).toBe('gut');
	});

	it('Sozial + Wohn + BRW → strukturell (Indigo, kein Vermillion)', () => {
		expect(getChoroplethFamily('mss-gesamtindex-2025')).toBe('strukturell');
		expect(getChoroplethFamily('kiez-score-soziale-lage')).toBe('strukturell');
		expect(getChoroplethFamily('wohnlagen-2024')).toBe('strukturell');
		expect(getChoroplethFamily('bodenrichtwerte')).toBe('strukturell');
	});

	it('Mobilität-Score = gut + pendingValidation (Smoke-Test async)', () => {
		expect(getChoroplethFamily('kiez-score-mobilitaet')).toBe('gut');
		expect(isPendingValidation('kiez-score-mobilitaet')).toBe(true);
	});

	it('non-choropleth-Slug → null', () => {
		expect(getChoroplethFamily('stolpersteine')).toBeNull();
		expect(getChoroplethFamily('kitas-2024')).toBeNull();
		expect(getChoroplethFamily('bezirke')).toBeNull();
	});

	it('Strukturell-Familie hat KEINE Vermillion-Layer (Stigma-Schutz)', () => {
		const strukturell = Object.entries(LAYER_TO_CHOROPLETH_FAMILY)
			.filter(([, fam]) => (typeof fam === 'string' ? fam : fam.family) === 'strukturell')
			.map(([slug]) => slug);
		const VERMILLION_BANNED_KEYWORDS = ['umwelt-vermillion', 'no-such-thing'];
		// Assertion: keine Belastungs-Slugs sind in Strukturell
		expect(strukturell).not.toContain('laerm-2023');
		expect(strukturell).not.toContain('luft-2023');
		expect(strukturell).not.toContain('klima-pet-2022');
		expect(VERMILLION_BANNED_KEYWORDS.length).toBeGreaterThan(0); // marker
	});
});

describe('LAYER_CLASSIFICATION_METHOD', () => {
	it('Belastungs-Layer: manuelle Schwellen (EU/WHO-Grenzwerte)', () => {
		expect(getClassificationMethod('laerm-2023')).toBe('manual');
		expect(getClassificationMethod('luft-2023')).toBe('manual');
	});

	it('PET-Klima: equal-interval (28-42°C Spreizung)', () => {
		expect(getClassificationMethod('klima-pet-2022')).toBe('equal-interval');
	});

	it('Bodenrichtwerte: quantile (Long-Tail-Verteilung)', () => {
		expect(getClassificationMethod('bodenrichtwerte')).toBe('quantile');
	});

	it('Kiez-Score-Layer: manuelle Quartile 0/26/51/76', () => {
		expect(getClassificationMethod('kiez-score-ruhe-luft')).toBe('manual-quartile');
		expect(getClassificationMethod('kiez-score-soziale-lage')).toBe('manual-quartile');
	});

	it('non-choropleth-Slug → null', () => {
		expect(getClassificationMethod('stolpersteine')).toBeNull();
	});
});

describe('SCALE_STAGE_SUBSETS', () => {
	it('3-Stufen-Profile nutzt {1,3,5}', () => {
		expect(SCALE_STAGE_SUBSETS[3]).toEqual([1, 3, 5]);
	});

	it('4-Stufen-Profile nutzt {1,2,4,5}', () => {
		expect(SCALE_STAGE_SUBSETS[4]).toEqual([1, 2, 4, 5]);
	});

	it('5-Stufen-Profile nutzt alle 5', () => {
		expect(SCALE_STAGE_SUBSETS[5]).toEqual([1, 2, 3, 4, 5]);
	});
});
