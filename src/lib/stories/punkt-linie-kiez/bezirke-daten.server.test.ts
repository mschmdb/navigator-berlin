import { describe, expect, it } from 'vitest';
import { HOME_BEZIRKE } from '$lib/content/home-bezirke.js';
import raw from '../../../../static/data/stories-kennzahlen.json';
import { loadBezirkeDaten, parseBezirkeDaten, teaserBezirke } from './bezirke-daten.server';

describe('loadBezirkeDaten', () => {
	it('liefert 12 Bezirke mit Namen und Werten, ohne Kieze', () => {
		const daten = loadBezirkeDaten();
		expect(daten.bezirke).toHaveLength(12);
		expect(daten.bezirke.map((b) => b.slug)).toEqual(HOME_BEZIRKE.map((b) => b.slug));
		expect(daten.bezirke.find((b) => b.slug === 'neukoelln')?.name).toBe('Neukölln');
		expect(daten.bezirke[0]!.kennzahlen.slug).toBe(daten.bezirke[0]!.slug);
		expect(JSON.stringify(daten)).not.toContain('adlershof');
	});

	it('übernimmt die Quellen der JSON-Datei', () => {
		const names = loadBezirkeDaten().sources.map((s) => s.name);
		expect(names).toContain('Clubs (OpenStreetMap)');
		expect(names.length).toBeGreaterThan(3);
	});
});

describe('teaserBezirke', () => {
	it('nimmt die ersten vier Bezirke alphabetisch', () => {
		expect(teaserBezirke().map((b) => b.slug)).toEqual([
			'charlottenburg-wilmersdorf',
			'friedrichshain-kreuzberg',
			'lichtenberg',
			'marzahn-hellersdorf'
		]);
	});
});

describe('parseBezirkeDaten', () => {
	const withBezirk = (patch: Record<string, unknown>): unknown => ({
		...raw,
		bezirke: raw.bezirke.map((b, i) => (i === 0 ? { ...b, ...patch } : b))
	});

	it('nimmt die echten Daten an', () => {
		expect(parseBezirkeDaten(raw).bezirke).toHaveLength(12);
	});

	it('wirft bei Werten außerhalb des plausiblen Bereichs', () => {
		expect(() => parseBezirkeDaten(withBezirk({ gruen: 1.5 }))).toThrow();
		expect(() => parseBezirkeDaten(withBezirk({ altbauAnteil: -0.1 }))).toThrow();
		expect(() => parseBezirkeDaten(withBezirk({ clubs: 2.5 }))).toThrow();
		expect(() => parseBezirkeDaten(withBezirk({ clubs: -1 }))).toThrow();
		expect(() => parseBezirkeDaten(withBezirk({ bewohnerProKm2: -5 }))).toThrow();
		expect(() => parseBezirkeDaten(withBezirk({ laermDb: 5 }))).toThrow();
	});

	it('nimmt null als fehlenden Wert an', () => {
		expect(() => parseBezirkeDaten(withBezirk({ laermDb: null }))).not.toThrow();
	});
});

describe('loadBezirkeDaten Cache', () => {
	it('liefert dasselbe Objekt bei jedem Aufruf', () => {
		expect(loadBezirkeDaten()).toBe(loadBezirkeDaten());
	});
});
