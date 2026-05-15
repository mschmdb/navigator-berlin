import { describe, expect, it } from 'vitest';
import { scaleFor, DIMENSION_LABELS_DE } from './kiez-score-display.js';

describe('scaleFor', () => {
	it('mappt 0-25 auf gering/warning', () => {
		expect(scaleFor(0, 'ruhe-luft')).toEqual({ label: 'gering', severity: 'warning' });
		expect(scaleFor(25, 'gruen')).toEqual({ label: 'gering', severity: 'warning' });
	});
	it('mappt 26-50 auf mittel/neutral', () => {
		expect(scaleFor(40, 'mobilitaet')).toEqual({ label: 'mittel', severity: 'neutral' });
	});
	it('mappt 51-75 auf hoch/success-soft', () => {
		expect(scaleFor(60, 'gruen')).toEqual({ label: 'hoch', severity: 'success-soft' });
	});
	it('mappt 76-100 auf sehr hoch/success', () => {
		expect(scaleFor(100, 'ruhe-luft')).toEqual({ label: 'sehr hoch', severity: 'success' });
	});
	it('liefert null bei null/NaN', () => {
		expect(scaleFor(null, 'ruhe-luft')).toBeNull();
		expect(scaleFor(Number.NaN, 'ruhe-luft')).toBeNull();
	});
	it('Soziale Lage: severity hart neutral (Stigma-Schutz)', () => {
		expect(scaleFor(20, 'soziale-lage')).toEqual({ label: 'gering', severity: 'neutral' });
		expect(scaleFor(80, 'soziale-lage')).toEqual({ label: 'sehr hoch', severity: 'neutral' });
		expect(scaleFor(50, 'soziale-lage')).toEqual({ label: 'mittel', severity: 'neutral' });
	});
});

describe('DIMENSION_LABELS_DE', () => {
	it('liefert deutsche Labels für alle 5 Dimensionen', () => {
		expect(DIMENSION_LABELS_DE['ruhe-luft']).toBe('Ruhe & Luft');
		expect(DIMENSION_LABELS_DE.gruen).toBe('Grün');
		expect(DIMENSION_LABELS_DE.mobilitaet).toBe('Mobilität');
		expect(DIMENSION_LABELS_DE['soziale-lage']).toBe('Soziale Lage');
		expect(DIMENSION_LABELS_DE.versorgung).toBe('Versorgung');
	});
});
