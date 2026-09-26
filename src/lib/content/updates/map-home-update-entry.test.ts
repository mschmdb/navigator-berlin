import { describe, expect, it } from 'vitest';
import { mapHomeUpdateEntry } from './map-home-update-entry.js';
import type { UpdateEntry } from './types.js';

/**
 * i18n Block B2 Review-Fund: `mapHomeUpdateEntry` war vorher inline im
 * `.map()`-Callback von `+page.server.ts#loadUpdates`, ungetestet. Extrahiert
 * als pure Funktion, hier gegen alle 4 Kombinationen + alle 6
 * Kategorie-Labels getestet.
 */
function makeEntry(overrides: Partial<UpdateEntry['frontmatter']> = {}): UpdateEntry {
	return {
		slug: 'kiez-finder',
		filePath: '/_content/updates/2026-08-22-kiez-finder.md',
		body: '',
		frontmatter: {
			title_de: 'Kiez-Finder: Sag der Karte, was du suchst',
			summary_de: 'Neun Regler statt Suchfeld.',
			date: '2026-08-22',
			category: 'feature',
			lang: 'de',
			...overrides
		}
	};
}

describe('mapHomeUpdateEntry', () => {
	it('en, title_en/summary_en vorhanden: nutzt EN, kein Fallback-Flag', () => {
		const entry = makeEntry({ title_en: 'Kiez Finder: tell the map', summary_en: 'Nine sliders.' });
		const result = mapHomeUpdateEntry(entry, 'en');
		expect(result.title).toBe('Kiez Finder: tell the map');
		expect(result.titleIsDeFallback).toBe(false);
		expect(result.summary).toBe('Nine sliders.');
		expect(result.summaryIsDeFallback).toBe(false);
	});

	it('en, title_en/summary_en fehlen: DE-Fallback, Fallback-Flag true', () => {
		const entry = makeEntry();
		const result = mapHomeUpdateEntry(entry, 'en');
		expect(result.title).toBe('Kiez-Finder: Sag der Karte, was du suchst');
		expect(result.titleIsDeFallback).toBe(true);
		expect(result.summary).toBe('Neun Regler statt Suchfeld.');
		expect(result.summaryIsDeFallback).toBe(true);
	});

	// Review-Fund: ein leerer/nur-Whitespace `title_en`/`summary_en` zählt
	// NICHT als vorhanden (sonst rendert ein leerer Titel statt DE-Fallback).
	it('en, title_en/summary_en leer/nur Whitespace: DE-Fallback, Fallback-Flag true', () => {
		const entry = makeEntry({ title_en: '   ', summary_en: '' });
		const result = mapHomeUpdateEntry(entry, 'en');
		expect(result.title).toBe('Kiez-Finder: Sag der Karte, was du suchst');
		expect(result.titleIsDeFallback).toBe(true);
		expect(result.summary).toBe('Neun Regler statt Suchfeld.');
		expect(result.summaryIsDeFallback).toBe(true);
	});

	it('de: ignoriert title_en/summary_en auch wenn vorhanden, Fallback-Flag immer false', () => {
		const entry = makeEntry({ title_en: 'EN title', summary_en: 'EN summary' });
		const result = mapHomeUpdateEntry(entry, 'de');
		expect(result.title).toBe('Kiez-Finder: Sag der Karte, was du suchst');
		expect(result.titleIsDeFallback).toBe(false);
		expect(result.summary).toBe('Neun Regler statt Suchfeld.');
		expect(result.summaryIsDeFallback).toBe(false);
	});

	it('categoryLabel: de bleibt der rohe Slug, en aller 6 Kategorien übersetzt', () => {
		const cases: Array<[UpdateEntry['frontmatter']['category'], string]> = [
			['daten-update', 'Data update'],
			['feature', 'Feature'],
			['methodik', 'Methodology'],
			['datenquelle', 'Data source'],
			['lizenz', 'Licence'],
			['presse', 'Press']
		];
		for (const [category, expectedEn] of cases) {
			const entry = makeEntry({ category });
			expect(mapHomeUpdateEntry(entry, 'de').categoryLabel).toBe(category);
			expect(mapHomeUpdateEntry(entry, 'en').categoryLabel).toBe(expectedEn);
		}
	});
});
