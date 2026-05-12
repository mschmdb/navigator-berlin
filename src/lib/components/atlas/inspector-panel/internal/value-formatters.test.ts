import { describe, expect, it } from 'vitest';
import { formatLayerValue } from './value-formatters.js';

describe('formatLayerValue', () => {
	it('null → "Daten nicht vorhanden"', () => {
		expect(formatLayerValue('bezirke', null)).toEqual({
			text: 'Daten nicht vorhanden',
			isNumeric: false
		});
	});

	it('undefined → Fallback', () => {
		expect(formatLayerValue('bezirke', undefined)).toEqual({
			text: 'Daten nicht vorhanden',
			isNumeric: false
		});
	});

	it('Mietspiegel-Wohnlage als String', () => {
		expect(formatLayerValue('mietspiegel-wohnlage', 'gut')).toEqual({
			text: 'gut',
			isNumeric: false
		});
	});

	it('Bodenrichtwerte numeric → "€/m²"', () => {
		expect(formatLayerValue('bodenrichtwerte', 4200)).toEqual({
			text: '4200 €/m²',
			isNumeric: true
		});
	});

	it('Lärm-Den → dB-Suffix', () => {
		expect(formatLayerValue('laerm-den', 65)).toEqual({
			text: '65 dB',
			isNumeric: true
		});
	});

	it('Lärm-Night → dB-Suffix', () => {
		expect(formatLayerValue('laerm-night', 50)).toEqual({
			text: '50 dB',
			isNumeric: true
		});
	});

	it('Solarpotenzial → "kWh/m²"', () => {
		expect(formatLayerValue('solarpotenzial', 900)).toEqual({
			text: '900 kWh/m²',
			isNumeric: true
		});
	});

	it('Stolpersteine mit person-Property → "Für {person}"', () => {
		expect(formatLayerValue('stolpersteine', { person: 'Anna Müller' })).toEqual({
			text: 'Für Anna Müller',
			isNumeric: false
		});
	});

	it('Stolpersteine ohne person → "Gedenkstein in der Nähe"', () => {
		expect(formatLayerValue('stolpersteine', { other: 'x' })).toEqual({
			text: 'Gedenkstein in der Nähe',
			isNumeric: false
		});
	});

	it('Bezirke → String', () => {
		expect(formatLayerValue('bezirke', 'Pankow')).toEqual({
			text: 'Pankow',
			isNumeric: false
		});
	});

	it('Trinkbrunnen → fixer Text', () => {
		expect(formatLayerValue('trinkbrunnen', { ok: true })).toEqual({
			text: 'Trinkbrunnen vor Ort',
			isNumeric: false
		});
	});

	it('Unbekannter slug + number → isNumeric=true', () => {
		expect(formatLayerValue('unknown-slug', 42)).toEqual({
			text: '42',
			isNumeric: true
		});
	});

	it('Unbekannter slug + string → isNumeric=false', () => {
		expect(formatLayerValue('unknown-slug', 'foo')).toEqual({
			text: 'foo',
			isNumeric: false
		});
	});

	it('Empty object {} → Fallback', () => {
		expect(formatLayerValue('bezirke', {})).toEqual({
			text: 'Daten nicht vorhanden',
			isNumeric: false
		});
	});
});
