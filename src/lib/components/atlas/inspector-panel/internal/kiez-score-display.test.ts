import { describe, expect, it } from 'vitest';
import {
	scaleFor,
	scaleForOverall,
	dimensionLabel,
	kiezScoreScaleLabel,
	DIMENSION_LABELS_DE
} from './kiez-score-display.js';

describe('scaleFor', () => {
	it('mappt 0-25 auf gering/warning', () => {
		expect(scaleFor(0, 'ruhe-luft')).toEqual({
			id: 'gering',
			label: 'gering',
			severity: 'warning'
		});
		expect(scaleFor(25, 'gruen-hitze')).toEqual({
			id: 'gering',
			label: 'gering',
			severity: 'warning'
		});
	});
	it('mappt 26-50 auf mittel/neutral', () => {
		expect(scaleFor(40, 'mobilitaet')).toEqual({
			id: 'mittel',
			label: 'mittel',
			severity: 'neutral'
		});
	});
	it('mappt 51-75 auf hoch/success-soft', () => {
		expect(scaleFor(60, 'gruen-hitze')).toEqual({
			id: 'hoch',
			label: 'hoch',
			severity: 'success-soft'
		});
	});
	it('mappt 76-100 auf sehr hoch/success', () => {
		expect(scaleFor(100, 'ruhe-luft')).toEqual({
			id: 'sehr-hoch',
			label: 'sehr hoch',
			severity: 'success'
		});
	});
	it('liefert null bei null/NaN', () => {
		expect(scaleFor(null, 'ruhe-luft')).toBeNull();
		expect(scaleFor(Number.NaN, 'ruhe-luft')).toBeNull();
	});
	it('Wohnschutz: positiv-eindeutige Severity (Schutz vorhanden = success)', () => {
		expect(scaleFor(20, 'wohnschutz')).toEqual({
			id: 'gering',
			label: 'gering',
			severity: 'warning'
		});
		expect(scaleFor(80, 'wohnschutz')).toEqual({
			id: 'sehr-hoch',
			label: 'sehr hoch',
			severity: 'success'
		});
	});

	it('Kriminalität (Story 14.4): immer neutrale Severity, kein grün/orange Gut-Signal', () => {
		// Magnitude, kein Gut-Maß (ADR-019): weder niedrige noch hohe Werte werden gut/schlecht gefärbt.
		expect(scaleFor(5, 'kriminalitaet')).toEqual({
			id: 'gering',
			label: 'gering',
			severity: 'neutral'
		});
		expect(scaleFor(50, 'kriminalitaet')).toEqual({
			id: 'mittel',
			label: 'mittel',
			severity: 'neutral'
		});
		expect(scaleFor(95, 'kriminalitaet')).toEqual({
			id: 'sehr-hoch',
			label: 'sehr hoch',
			severity: 'neutral'
		});
	});

	// i18n Block B3a: ohne `opts.locale` bleibt DE (Boundary), explizites
	// `{ locale: 'en' }` liefert das englische Skalen-Label.
	it('liefert DE ohne locale-Angabe, EN mit { locale: "en" }', () => {
		expect(scaleFor(0, 'ruhe-luft')?.label).toBe('gering');
		expect(scaleFor(0, 'ruhe-luft', { locale: 'de' })?.label).toBe('gering');
		expect(scaleFor(0, 'ruhe-luft', { locale: 'en' })?.label).toBe('low');
		expect(scaleFor(100, 'ruhe-luft', { locale: 'en' })?.label).toBe('very high');
	});
});

describe('scaleForOverall', () => {
	it('liefert dieselbe id/severity-Logik wie scaleFor, locale-fähig', () => {
		expect(scaleForOverall(10)).toEqual({ id: 'gering', label: 'gering', severity: 'warning' });
		expect(scaleForOverall(10, { locale: 'en' })).toEqual({
			id: 'gering',
			label: 'low',
			severity: 'warning'
		});
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

describe('dimensionLabel', () => {
	it('liefert DE ohne opts (Boundary Spec i18n B3a), matched DIMENSION_LABELS_DE', () => {
		for (const dim of Object.keys(DIMENSION_LABELS_DE) as (keyof typeof DIMENSION_LABELS_DE)[]) {
			expect(dimensionLabel(dim)).toBe(DIMENSION_LABELS_DE[dim]);
		}
	});

	it('liefert EN mit { locale: "en" }', () => {
		expect(dimensionLabel('ruhe-luft', { locale: 'en' })).toBe('Quiet & air');
		expect(dimensionLabel('kriminalitaet', { locale: 'en' })).toBe('Recorded crime');
	});
});

describe('kiezScoreScaleLabel', () => {
	it('DE ohne opts, EN mit { locale: "en" }', () => {
		expect(kiezScoreScaleLabel('sehr-hoch')).toBe('sehr hoch');
		expect(kiezScoreScaleLabel('sehr-hoch', { locale: 'en' })).toBe('very high');
	});
});
