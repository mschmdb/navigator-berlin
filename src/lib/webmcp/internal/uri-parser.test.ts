import { describe, it, expect } from 'vitest';
import { parseResourceUri } from './uri-parser.js';

describe('parseResourceUri', () => {
	it('parsed navigator://address/{slug}', () => {
		const result = parseResourceUri('navigator://address/brandenburger-tor');
		expect(result).toEqual({ type: 'address', ref: 'brandenburger-tor' });
	});

	it('parsed navigator://address/{coords}', () => {
		const result = parseResourceUri('navigator://address/52.5163,13.3777');
		expect(result).toEqual({ type: 'address', ref: '52.5163,13.3777' });
	});

	it('parsed navigator://layers/active', () => {
		const result = parseResourceUri('navigator://layers/active');
		expect(result).toEqual({ type: 'layers', ref: 'active' });
	});

	it('parsed navigator://bezirk/{slug}', () => {
		const result = parseResourceUri('navigator://bezirk/mitte');
		expect(result).toEqual({ type: 'bezirk', slug: 'mitte' });
	});

	it('parsed navigator://kiez/{slug}', () => {
		const result = parseResourceUri('navigator://kiez/regierungsviertel');
		expect(result).toEqual({ type: 'kiez', slug: 'regierungsviertel' });
	});

	it('liefert null bei falschem-scheme', () => {
		expect(parseResourceUri('https://example.com/foo')).toBeNull();
	});

	it('liefert null bei unbekanntem-type', () => {
		expect(parseResourceUri('navigator://unknown/foo')).toBeNull();
	});

	it('liefert null bei nicht-parsbarer-URI', () => {
		expect(parseResourceUri('garbage')).toBeNull();
	});

	it('liefert null bei layers mit unbekanntem-ref', () => {
		expect(parseResourceUri('navigator://layers/inactive')).toBeNull();
	});
});
