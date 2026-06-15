import { describe, it, expect } from 'vitest';
import { buildWahlSitemapEntries, WAHL_DETAIL_SOURCE } from './wahl-detail-pages.js';
import type { Manifest } from '../../data/types.js';

const emptyManifest: Manifest = {
	schemaVersion: 1,
	generatedAt: '2026-01-01T00:00:00Z',
	layers: []
};

describe('buildWahlSitemapEntries', () => {
	it('liefert Entry pro Wahl mit korrektem Slug-Pattern', () => {
		const entries = buildWahlSitemapEntries({
			origin: 'https://navigator.berlin',
			wahlen: [
				{ jahr: 2025, typ: 'btw', stimmtyp: 'zweitstimme' },
				{ jahr: 2025, typ: 'btw', stimmtyp: 'erststimme' },
				{ jahr: 2023, typ: 'bvv', stimmtyp: 'einstimme' }
			]
		});
		expect(entries.map((e) => e.loc)).toEqual([
			'https://navigator.berlin/wahl/2025-btw-zweitstimme',
			'https://navigator.berlin/wahl/2025-btw-erststimme',
			'https://navigator.berlin/wahl/2023-bvv'
		]);
	});

	it('lastmod = Wahljahr-01-01, changefreq yearly, priority 0.7', () => {
		const entries = buildWahlSitemapEntries({
			origin: 'https://navigator.berlin',
			wahlen: [{ jahr: 2017, typ: 'btw', stimmtyp: 'zweitstimme' }]
		});
		expect(entries[0].lastmod).toBe('2017-01-01');
		expect(entries[0].changefreq).toBe('yearly');
		expect(entries[0].priority).toBe(0.7);
	});

	it('trimmt trailing slash aus origin', () => {
		const entries = buildWahlSitemapEntries({
			origin: 'https://navigator.berlin/',
			wahlen: [{ jahr: 2025, typ: 'btw', stimmtyp: 'zweitstimme' }]
		});
		expect(entries[0].loc).toBe('https://navigator.berlin/wahl/2025-btw-zweitstimme');
	});
});

describe('WAHL_DETAIL_SOURCE', () => {
	it('leeres Array für non-de locale', () => {
		const entries = WAHL_DETAIL_SOURCE({
			origin: 'https://navigator.berlin',
			locale: 'en',
			manifest: emptyManifest,
			buildTimestamp: '2026-01-01T00:00:00Z',
			wahlen: [{ jahr: 2025, typ: 'btw', stimmtyp: 'zweitstimme' }]
		});
		expect(entries).toEqual([]);
	});

	it('leeres Array bei fehlenden wahlen', () => {
		const entries = WAHL_DETAIL_SOURCE({
			origin: 'https://navigator.berlin',
			locale: 'de',
			manifest: emptyManifest,
			buildTimestamp: '2026-01-01T00:00:00Z'
		});
		expect(entries).toEqual([]);
	});

	it('liefert Entries für locale=de + wahlen', () => {
		const entries = WAHL_DETAIL_SOURCE({
			origin: 'https://navigator.berlin',
			locale: 'de',
			manifest: emptyManifest,
			buildTimestamp: '2026-01-01T00:00:00Z',
			wahlen: [
				{ jahr: 2025, typ: 'btw', stimmtyp: 'zweitstimme' },
				{ jahr: 2023, typ: 'bvv', stimmtyp: 'einstimme' }
			]
		});
		expect(entries).toHaveLength(2);
		expect(entries[0].loc).toContain('/wahl/2025-btw-zweitstimme');
		expect(entries[1].loc).toContain('/wahl/2023-bvv');
	});
});
