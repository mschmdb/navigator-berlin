import { describe, expect, it } from 'vitest';
import { buildPageTitle, firstFitting, PAGE_TITLE_MAX } from './page-title.js';

describe('buildPageTitle', () => {
	it('hängt die Marke an, wenn der Titel in 60 Zeichen passt', () => {
		expect(buildPageTitle('Methodik')).toBe('Methodik | navigator.berlin');
	});

	it('lässt die Marke weg, wenn sie die Grenze sprengt', () => {
		const core = 'a'.repeat(PAGE_TITLE_MAX - 10);
		expect(buildPageTitle(core)).toBe(core);
	});

	it('akzeptiert genau 60 Zeichen mit Marke', () => {
		const core = 'a'.repeat(PAGE_TITLE_MAX - ' | navigator.berlin'.length);
		const title = buildPageTitle(core);
		expect(title).toHaveLength(PAGE_TITLE_MAX);
		expect(title.endsWith('| navigator.berlin')).toBe(true);
	});

	it('behält einen zu langen Kerntitel vollständig', () => {
		const core = 'b'.repeat(90);
		expect(buildPageTitle(core)).toBe(core);
	});

	it('baut den Atlas-Titel mit Adresse', () => {
		expect(buildPageTitle('Alexanderplatz 1, 10178 Berlin')).toBe(
			'Alexanderplatz 1, 10178 Berlin | navigator.berlin'
		);
	});

	it('trimmt Leerraum im Kerntitel', () => {
		expect(buildPageTitle('  Lizenzen ')).toBe('Lizenzen | navigator.berlin');
	});
});

describe('firstFitting', () => {
	it('nimmt den ersten Kandidaten innerhalb der Grenze', () => {
		expect(firstFitting(['langer text', 'kurz'], 5)).toBe('kurz');
		expect(firstFitting(['ok', 'kurz'], 5)).toBe('ok');
	});

	it('fällt auf den letzten Kandidaten zurück, wenn keiner passt', () => {
		expect(firstFitting(['abcdefgh', 'abcdefg'], 3)).toBe('abcdefg');
	});
});
