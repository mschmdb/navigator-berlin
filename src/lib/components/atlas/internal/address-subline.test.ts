import { describe, expect, it } from 'vitest';
import type { GeocodeSuggestion } from '$lib/data';
import {
	extractPrimaryName,
	extractStreetName,
	formatAddressSubline
} from './address-subline.js';

function makeAddr(overrides: Partial<GeocodeSuggestion> = {}): GeocodeSuggestion {
	return {
		id: 'x',
		displayName: 'Carl-Leid-Weg, Wedding, Berlin, 13351, Germany',
		lat: 52.5,
		lng: 13.4,
		type: 'street',
		addresstype: 'street',
		...overrides
	};
}

describe('extractStreetName', () => {
	it('extrahiert „Carl-Leid-Weg" aus displayName ohne Hausnummer', () => {
		const addr = makeAddr({ displayName: 'Carl-Leid-Weg, Wedding, Berlin, 13351, Germany' });
		expect(extractStreetName(addr)).toBe('Carl-Leid-Weg');
	});

	it('extrahiert „Boxhagener Str. 12" mit Hausnummer aus displayName', () => {
		const addr = makeAddr({
			displayName: 'Boxhagener Straße 12, Friedrichshain, Berlin, 10245, Germany'
		});
		expect(extractStreetName(addr)).toBe('Boxhagener Straße 12');
	});

	it('liefert displayName-Prefix wenn keine Komma-Struktur', () => {
		const addr = makeAddr({ displayName: 'Alexanderplatz' });
		expect(extractStreetName(addr)).toBe('Alexanderplatz');
	});

	it('handled Hausnummer mit Komma-Subteil korrekt (Straße 12a)', () => {
		const addr = makeAddr({
			displayName: 'Karl-Marx-Allee 99a, Mitte, Berlin, 10243, Germany'
		});
		expect(extractStreetName(addr)).toBe('Karl-Marx-Allee 99a');
	});

	it('Fallback auf gesamten displayName wenn leer', () => {
		const addr = makeAddr({ displayName: '' });
		expect(extractStreetName(addr)).toBe('');
	});
});

describe('extractPrimaryName', () => {
	it('liefert erstes Segment vor Komma getrimmt', () => {
		expect(extractPrimaryName('Carl-Leid-Weg, Wedding, Berlin')).toBe('Carl-Leid-Weg');
	});

	it('toleriert undefined + empty string', () => {
		expect(extractPrimaryName(undefined)).toBe('');
		expect(extractPrimaryName('')).toBe('');
	});

	it('liefert displayName-Prefix wenn keine Komma-Struktur', () => {
		expect(extractPrimaryName('Alexanderplatz')).toBe('Alexanderplatz');
	});

	it('kombiniert Hausnummer-first mit Strassen-Segment zu „Strasse Hausnr"', () => {
		expect(extractPrimaryName('34, Arndtstraße, Bergmannkiez, Berlin')).toBe('Arndtstraße 34');
	});

	it('kombiniert Hausnummer mit Buchstaben-Suffix (19a)', () => {
		expect(extractPrimaryName('19a, Schonensche Straße, Vinetakiez, Berlin')).toBe(
			'Schonensche Straße 19a'
		);
	});

	it('lässt POI-Namen unverändert', () => {
		expect(
			extractPrimaryName('Hochschule für Technik und Wirtschaft, Campus, Berlin')
		).toBe('Hochschule für Technik und Wirtschaft');
	});
});

describe('formatAddressSubline', () => {
	it('rendert kiez · bezirk · plz', () => {
		const addr = makeAddr({
			kiez: 'Afrikanisches Viertel',
			bezirk: 'Wedding',
			postcode: '13351'
		});
		expect(formatAddressSubline(addr)).toBe('Afrikanisches Viertel · Wedding · 13351');
	});

	it('blendet fehlende Parts aus', () => {
		const addr = makeAddr({ bezirk: 'Wedding', postcode: '13351' });
		expect(formatAddressSubline(addr)).toBe('Wedding · 13351');
	});

	it('liefert empty-string wenn alle Parts fehlen', () => {
		const addr = makeAddr({});
		expect(formatAddressSubline(addr)).toBe('');
	});

	it('liefert nur Bezirk wenn nur Bezirk gesetzt', () => {
		const addr = makeAddr({ bezirk: 'Wedding' });
		expect(formatAddressSubline(addr)).toBe('Wedding');
	});
});
