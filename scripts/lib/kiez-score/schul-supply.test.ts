import { describe, expect, it } from 'vitest';
import type { Feature } from 'geojson';
import { classifySchulart, splitSchulenByArt } from './schul-supply.js';

describe('classifySchulart', () => {
	it('Grundschule → grundschule', () => {
		expect(classifySchulart('Grundschule')).toBe('grundschule');
	});
	it('weiterführende Arten → weiterfuehrend', () => {
		expect(classifySchulart('Integrierte Sekundarschule')).toBe('weiterfuehrend');
		expect(classifySchulart('Gymnasium')).toBe('weiterfuehrend');
		expect(classifySchulart('Gemeinschaftsschule')).toBe('weiterfuehrend');
	});
	it('unbekannt / leer / null → weiterfuehrend (sicherer Default)', () => {
		expect(classifySchulart('')).toBe('weiterfuehrend');
		expect(classifySchulart(undefined)).toBe('weiterfuehrend');
		expect(classifySchulart(null)).toBe('weiterfuehrend');
		expect(classifySchulart('Irgendwas Neues')).toBe('weiterfuehrend');
	});
});

function school(schulart: string | null): Feature {
	return {
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [13.4, 52.5] },
		properties: schulart === null ? {} : { schulart }
	};
}

describe('splitSchulenByArt', () => {
	it('teilt Features nach Schulart in zwei Listen', () => {
		const { grundschule, weiterfuehrend } = splitSchulenByArt([
			school('Grundschule'),
			school('Gymnasium'),
			school('Grundschule'),
			school('Integrierte Sekundarschule'),
			school(null)
		]);
		expect(grundschule).toHaveLength(2);
		expect(weiterfuehrend).toHaveLength(3);
	});
});
