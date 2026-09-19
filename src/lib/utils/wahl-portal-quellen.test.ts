import { describe, expect, it } from 'vitest';
import { deriveQuellen } from './wahl-portal-quellen.js';

describe('deriveQuellen', () => {
	it('liefert leeres Array für leere Eingabe', () => {
		expect(deriveQuellen([])).toEqual([]);
	});

	it('dedupliziert identische Quelle+Lizenz-Kombinationen', () => {
		const out = deriveQuellen([
			{ sourceName: 'Bundeswahlleiterin', license: 'dl-de/by-2-0' },
			{ sourceName: 'Bundeswahlleiterin', license: 'dl-de/by-2-0' }
		]);
		expect(out).toEqual([{ name: 'Bundeswahlleiterin', license: 'dl-de/by-2-0' }]);
	});

	it('behält unterschiedliche Lizenzen derselben Quelle getrennt', () => {
		const out = deriveQuellen([
			{ sourceName: 'X', license: 'dl-de/by-2-0' },
			{ sourceName: 'X', license: 'dl-de/zero-2-0' }
		]);
		expect(out).toHaveLength(2);
	});

	it('sortiert alphabetisch nach Name (de)', () => {
		const out = deriveQuellen([
			{ sourceName: 'Amt für Statistik Berlin-Brandenburg', license: 'dl-de/by-2-0' },
			{ sourceName: 'Bundeswahlleiterin', license: 'dl-de/by-2-0' }
		]);
		expect(out.map((q) => q.name)).toEqual([
			'Amt für Statistik Berlin-Brandenburg',
			'Bundeswahlleiterin'
		]);
	});
});
