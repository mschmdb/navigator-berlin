import { describe, expect, it } from 'vitest';
import { sha256Hex, hashedFilename, shortHash } from './hash.js';

describe('hash', () => {
	it('sha256Hex liefert 64-char lowercase hex', () => {
		const hex = sha256Hex(Buffer.from('hello'));
		expect(hex).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
		expect(hex).toMatch(/^[0-9a-f]{64}$/);
	});

	it('shortHash kuerzt auf 8 chars', () => {
		expect(shortHash('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')).toBe(
			'2cf24dba'
		);
	});

	it('hashedFilename pattern {slug}.{sha8}.geojson', () => {
		const buf = Buffer.from('{"type":"FeatureCollection","features":[]}');
		const name = hashedFilename('bezirke', buf);
		expect(name).toMatch(/^bezirke\.[0-9a-f]{8}\.geojson$/);
	});

	it('hashedFilename deterministisch fuer gleichen Input', () => {
		const buf = Buffer.from('{"type":"FeatureCollection","features":[]}');
		expect(hashedFilename('bezirke', buf)).toBe(hashedFilename('bezirke', buf));
	});

	it('hashedFilename unterschiedlich bei Content-Change', () => {
		const a = hashedFilename('bezirke', Buffer.from('a'));
		const b = hashedFilename('bezirke', Buffer.from('b'));
		expect(a).not.toBe(b);
	});

	it('hashedFilename respektiert custom Extension', () => {
		const name = hashedFilename('stations', Buffer.from('x'), 'json');
		expect(name).toMatch(/^stations\.[0-9a-f]{8}\.json$/);
	});
});
