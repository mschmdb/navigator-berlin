import { describe, expect, it } from 'vitest';
import {
	buildOgImageUrl,
	buildOgDescription,
	DEFAULT_OG_IMAGE_PATH,
	type OgImageInput
} from './og-image-url.js';

const BASE = 'https://navigator.berlin';

const FULL: OgImageInput = {
	address: 'Boxhagener Straße 12, 10245 Berlin',
	lat: 52.5135,
	lng: 13.4622,
	bezirk: 'Friedrichshain-Kreuzberg',
	topLayers: ['Wohnlage: gut', 'Lärm: hoch', 'ÖPNV: U-Bahn 220 m']
};

describe('buildOgImageUrl', () => {
	it('produziert absoluten Pfad zum OG-Endpoint mit allen Query-Params', () => {
		const url = buildOgImageUrl(FULL, BASE);
		expect(url.startsWith('https://navigator.berlin/api/og/share?')).toBe(true);
		const parsed = new URL(url);
		expect(parsed.searchParams.get('address')).toBe('Boxhagener Straße 12, 10245 Berlin');
		expect(parsed.searchParams.get('lat')).toBe('52.5135');
		expect(parsed.searchParams.get('lng')).toBe('13.4622');
		expect(parsed.searchParams.get('bezirk')).toBe('Friedrichshain-Kreuzberg');
		expect(parsed.searchParams.get('topLayers')).toBe(
			'Wohnlage: gut|Lärm: hoch|ÖPNV: U-Bahn 220 m'
		);
	});

	it('fällt auf default-OG zurück wenn keine Adresse', () => {
		const url = buildOgImageUrl(null, BASE);
		expect(url).toBe(`${BASE}${DEFAULT_OG_IMAGE_PATH}`);
	});

	it('limitiert topLayers im URL auf 3', () => {
		const url = buildOgImageUrl({ ...FULL, topLayers: ['a', 'b', 'c', 'd', 'e'] }, BASE);
		const parsed = new URL(url);
		expect(parsed.searchParams.get('topLayers')?.split('|').length).toBe(3);
	});

	it('strippt trailing slash von baseUrl', () => {
		const url = buildOgImageUrl(FULL, `${BASE}/`);
		expect(url.startsWith(`${BASE}/api/og/share?`)).toBe(true);
	});

	it('lässt bezirk weg wenn nicht gesetzt', () => {
		const url = buildOgImageUrl({ ...FULL, bezirk: undefined }, BASE);
		const parsed = new URL(url);
		expect(parsed.searchParams.has('bezirk')).toBe(false);
	});
});

describe('buildOgDescription', () => {
	it('fasst Top-3-Layer als Komma-Separated zusammen', () => {
		const text = buildOgDescription(FULL);
		expect(text).toContain('Wohnlage: gut');
		expect(text).toContain('Lärm: hoch');
		expect(text).toContain('ÖPNV: U-Bahn 220 m');
	});

	it('Fallback ohne topLayers', () => {
		const text = buildOgDescription({ ...FULL, topLayers: [] });
		expect(text).toMatch(/Daten zur Adresse/);
		expect(text.length).toBeGreaterThan(0);
	});

	it('liefert leeren String für null-Input', () => {
		expect(buildOgDescription(null)).toBe('');
	});
});

describe('DEFAULT_OG_IMAGE_PATH', () => {
	it('zeigt auf statisches Default-Image', () => {
		expect(DEFAULT_OG_IMAGE_PATH).toBe('/og/page/home.png');
	});
});
