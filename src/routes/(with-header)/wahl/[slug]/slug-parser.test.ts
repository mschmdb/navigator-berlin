import { describe, it, expect } from 'vitest';
import { parseWahlSlug, buildWahlSlug } from './slug-utils.js';

describe('parseWahlSlug', () => {
	it('parsed BTW-Slug mit Stimmtyp', () => {
		expect(parseWahlSlug('2025-btw-zweitstimme')).toEqual({
			jahr: 2025,
			typ: 'btw',
			stimmtyp: 'zweitstimme'
		});
		expect(parseWahlSlug('2017-btw-erststimme')).toEqual({
			jahr: 2017,
			typ: 'btw',
			stimmtyp: 'erststimme'
		});
	});

	it('parsed AGH-Slug mit Stimmtyp', () => {
		expect(parseWahlSlug('2023-agh-zweitstimme')).toEqual({
			jahr: 2023,
			typ: 'agh',
			stimmtyp: 'zweitstimme'
		});
	});

	it('parsed BVV-Slug ohne Stimmtyp (einstimme implizit)', () => {
		expect(parseWahlSlug('2023-bvv')).toEqual({
			jahr: 2023,
			typ: 'bvv',
			stimmtyp: 'einstimme'
		});
		expect(parseWahlSlug('2011-bvv')).toEqual({
			jahr: 2011,
			typ: 'bvv',
			stimmtyp: 'einstimme'
		});
	});

	it('default zweitstimme bei BTW/AGH ohne Stimmtyp', () => {
		expect(parseWahlSlug('2025-btw')).toEqual({
			jahr: 2025,
			typ: 'btw',
			stimmtyp: 'zweitstimme'
		});
		expect(parseWahlSlug('2023-agh')).toEqual({
			jahr: 2023,
			typ: 'agh',
			stimmtyp: 'zweitstimme'
		});
	});

	it('rejected BVV mit Stimmtyp', () => {
		expect(parseWahlSlug('2023-bvv-erststimme')).toBeNull();
		expect(parseWahlSlug('2023-bvv-zweitstimme')).toBeNull();
	});

	it('rejected BTW/AGH mit einstimme', () => {
		expect(parseWahlSlug('2025-btw-einstimme')).toBeNull();
		expect(parseWahlSlug('2023-agh-einstimme')).toBeNull();
	});

	it('rejected invalid Slugs', () => {
		expect(parseWahlSlug('25-btw')).toBeNull();
		expect(parseWahlSlug('2025-ew-zweitstimme')).toBeNull();
		expect(parseWahlSlug('btw-2025')).toBeNull();
		expect(parseWahlSlug('')).toBeNull();
		expect(parseWahlSlug('2025-btw-foo')).toBeNull();
	});
});

describe('buildWahlSlug', () => {
	it('BTW Erststimme', () => {
		expect(buildWahlSlug({ jahr: 2025, typ: 'btw', stimmtyp: 'erststimme' })).toBe(
			'2025-btw-erststimme'
		);
	});

	it('BTW Zweitstimme', () => {
		expect(buildWahlSlug({ jahr: 2017, typ: 'btw', stimmtyp: 'zweitstimme' })).toBe(
			'2017-btw-zweitstimme'
		);
	});

	it('BVV ohne Stimmtyp im Slug', () => {
		expect(buildWahlSlug({ jahr: 2023, typ: 'bvv', stimmtyp: 'einstimme' })).toBe('2023-bvv');
	});

	it('Round-trip parse↔build konsistent', () => {
		const slugs = ['2025-btw-zweitstimme', '2017-btw-erststimme', '2023-agh-zweitstimme', '2023-bvv'];
		for (const slug of slugs) {
			const parsed = parseWahlSlug(slug);
			expect(parsed).not.toBeNull();
			expect(buildWahlSlug(parsed!)).toBe(slug);
		}
	});
});
