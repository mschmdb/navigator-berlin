import { describe, expect, it } from 'vitest';
import {
	buildOgCardVdom,
	validateOgParams,
	type OgParams,
	OG_CARD_WIDTH,
	OG_CARD_HEIGHT
} from './og-card-renderer.js';

function paramsFromQuery(qs: string): URLSearchParams {
	return new URLSearchParams(qs);
}

describe('validateOgParams', () => {
	it('akzeptiert Adresse + Lat/Lng innerhalb Berlin', () => {
		const res = validateOgParams(
			paramsFromQuery(
				'address=Boxhagener%20Stra%C3%9Fe%2012&lat=52.5135&lng=13.4622&bezirk=Friedrichshain-Kreuzberg'
			)
		);
		expect(res.ok).toBe(true);
		if (!res.ok) throw new Error('expected ok');
		expect(res.data.address).toBe('Boxhagener Straße 12');
		expect(res.data.lat).toBeCloseTo(52.5135);
		expect(res.data.lng).toBeCloseTo(13.4622);
		expect(res.data.bezirk).toBe('Friedrichshain-Kreuzberg');
		expect(res.data.topLayers).toEqual([]);
	});

	it('parsed topLayers als Pipe-getrennte Liste', () => {
		const res = validateOgParams(
			paramsFromQuery(
				'address=Test&lat=52.5&lng=13.4&topLayers=Wohnlage%3A%20gut%7CL%C3%A4rm%3A%2065%20dB'
			)
		);
		expect(res.ok).toBe(true);
		if (!res.ok) throw new Error('expected ok');
		expect(res.data.topLayers).toEqual(['Wohnlage: gut', 'Lärm: 65 dB']);
	});

	it('lehnt Lat/Lng außerhalb Berlin ab', () => {
		const res = validateOgParams(
			paramsFromQuery('address=Test&lat=48.13&lng=11.58') // München
		);
		expect(res.ok).toBe(false);
		if (res.ok) throw new Error('expected error');
		expect(res.error).toMatch(/Berlin/);
	});

	it('lehnt fehlende Lat/Lng ab', () => {
		const res = validateOgParams(paramsFromQuery('address=Test'));
		expect(res.ok).toBe(false);
	});

	it('trimmt Adresse auf 200 Zeichen', () => {
		const longStr = 'X'.repeat(500);
		const res = validateOgParams(
			paramsFromQuery(`address=${encodeURIComponent(longStr)}&lat=52.5&lng=13.4`)
		);
		expect(res.ok).toBe(true);
		if (!res.ok) throw new Error('expected ok');
		expect(res.data.address.length).toBe(200);
	});

	it('limitiert topLayers auf 3 Einträge', () => {
		const res = validateOgParams(
			paramsFromQuery('address=Test&lat=52.5&lng=13.4&topLayers=a%7Cb%7Cc%7Cd%7Ce')
		);
		expect(res.ok).toBe(true);
		if (!res.ok) throw new Error('expected ok');
		expect(res.data.topLayers).toEqual(['a', 'b', 'c']);
	});

	it('lehnt nicht-numerische Lat/Lng ab', () => {
		const res = validateOgParams(paramsFromQuery('address=Test&lat=abc&lng=13.4'));
		expect(res.ok).toBe(false);
	});
});

describe('buildOgCardVdom', () => {
	const params: OgParams = {
		address: 'Boxhagener Straße 12',
		lat: 52.5135,
		lng: 13.4622,
		bezirk: 'Friedrichshain-Kreuzberg',
		topLayers: ['Wohnlage: gut', 'Lärm: 65 dB', 'ÖPNV: U-Bahn 220 m'],
		generatedDate: '2026-05-14'
	};

	it('liefert Root-Node mit fixer Größe', () => {
		const node = buildOgCardVdom(params);
		expect(node.type).toBe('div');
		const style = node.props.style as Record<string, unknown>;
		expect(style.width).toBe(OG_CARD_WIDTH);
		expect(style.height).toBe(OG_CARD_HEIGHT);
	});

	it('rendert Adress-Titel + Bezirk + Top-Layer im Tree', () => {
		const node = buildOgCardVdom(params);
		const serialized = JSON.stringify(node);
		expect(serialized).toContain('Boxhagener Straße 12');
		expect(serialized).toContain('Friedrichshain-Kreuzberg');
		expect(serialized).toContain('Wohnlage: gut');
		expect(serialized).toContain('Lärm: 65 dB');
		expect(serialized).toContain('navigator.berlin');
	});

	it('rendert Footer mit Stand-Datum', () => {
		const node = buildOgCardVdom(params);
		const serialized = JSON.stringify(node);
		expect(serialized).toContain('2026-05-14');
	});

	it('rendert Fallback ohne topLayers ohne crash', () => {
		const minimal: OgParams = {
			address: 'Berlin',
			lat: 52.5,
			lng: 13.4,
			topLayers: [],
			generatedDate: '2026-05-14'
		};
		const node = buildOgCardVdom(minimal);
		expect(node.type).toBe('div');
	});
});

describe('OG_CARD_WIDTH/HEIGHT', () => {
	it('entspricht 1200×630 (Twitter summary_large_image)', () => {
		expect(OG_CARD_WIDTH).toBe(1200);
		expect(OG_CARD_HEIGHT).toBe(630);
	});
});
