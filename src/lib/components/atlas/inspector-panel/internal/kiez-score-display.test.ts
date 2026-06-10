import { describe, expect, it } from 'vitest';
import { scaleFor, DIMENSION_LABELS_DE } from './kiez-score-display.js';

describe('scaleFor', () => {
	it('mappt 0-25 auf gering/warning', () => {
		expect(scaleFor(0, 'ruhe-luft')).toEqual({ label: 'gering', severity: 'warning' });
		expect(scaleFor(25, 'gruen-hitze')).toEqual({ label: 'gering', severity: 'warning' });
	});
	it('mappt 26-50 auf mittel/neutral', () => {
		expect(scaleFor(40, 'mobilitaet')).toEqual({ label: 'mittel', severity: 'neutral' });
	});
	it('mappt 51-75 auf hoch/success-soft', () => {
		expect(scaleFor(60, 'gruen-hitze')).toEqual({ label: 'hoch', severity: 'success-soft' });
	});
	it('mappt 76-100 auf sehr hoch/success', () => {
		expect(scaleFor(100, 'ruhe-luft')).toEqual({ label: 'sehr hoch', severity: 'success' });
	});
	it('liefert null bei null/NaN', () => {
		expect(scaleFor(null, 'ruhe-luft')).toBeNull();
		expect(scaleFor(Number.NaN, 'ruhe-luft')).toBeNull();
	});
	it('Wohnschutz: positiv-eindeutige Severity (Schutz vorhanden = success)', () => {
		expect(scaleFor(20, 'wohnschutz')).toEqual({ label: 'gering', severity: 'warning' });
		expect(scaleFor(80, 'wohnschutz')).toEqual({ label: 'sehr hoch', severity: 'success' });
	});

	it('Kriminalität (Story 14.4): immer neutrale Severity, kein grün/orange Gut-Signal', () => {
		// Magnitude, kein Gut-Maß (ADR-019): weder niedrige noch hohe Werte werden gut/schlecht gefärbt.
		expect(scaleFor(5, 'kriminalitaet')).toEqual({ label: 'gering', severity: 'neutral' });
		expect(scaleFor(50, 'kriminalitaet')).toEqual({ label: 'mittel', severity: 'neutral' });
		expect(scaleFor(95, 'kriminalitaet')).toEqual({ label: 'sehr hoch', severity: 'neutral' });
	});
});

describe('DIMENSION_LABELS_DE', () => {
	it('liefert deutsche Labels für alle 5 Dimensionen', () => {
		expect(DIMENSION_LABELS_DE['ruhe-luft']).toBe('Ruhe & Luft');
		expect(DIMENSION_LABELS_DE['gruen-hitze']).toBe('Grün & Hitze');
		expect(DIMENSION_LABELS_DE.mobilitaet).toBe('Mobilität');
		expect(DIMENSION_LABELS_DE.versorgung).toBe('Versorgung');
		expect(DIMENSION_LABELS_DE.wohnschutz).toBe('Wohnschutz');
	});
});
