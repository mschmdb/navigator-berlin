import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	JAHRE,
	NAMED_PARTIES,
	ORDER,
	REST_INDEX,
	WAHL_TYPEN,
	parteiZiel,
	wahlSlug
} from './parteien';
import type { StoriesWahlData } from './types';

const data = JSON.parse(readFileSync('static/data/stories-wahl.json', 'utf-8')) as StoriesWahlData;

describe('Parteischlüssel', () => {
	it('Reihenfolge alphabetisch, Grau zuletzt', () => {
		expect(ORDER).toEqual([
			'afd',
			'bsw',
			'cdu',
			'fdp',
			'gruene',
			'linke',
			'piraten',
			'spd',
			'rest'
		]);
		expect(ORDER[REST_INDEX]).toBe('rest');
	});

	it('benannte Parteien sind ORDER ohne Grau', () => {
		expect(NAMED_PARTIES).toEqual(ORDER.slice(0, REST_INDEX));
	});
});

describe('Wahltypen und Jahre', () => {
	it('decken genau die Wahlen der Datenbasis ab', () => {
		const ausDaten = data.wahlen.map((w) => `${w.typ}${w.jahr}`);
		const ausKonstanten = WAHL_TYPEN.flatMap((t) => JAHRE[t].map((j) => `${t}${j}`));
		expect(ausKonstanten).toEqual(ausDaten);
	});

	it('wahlSlug trifft die Slugs der Datenbasis', () => {
		for (const w of data.wahlen) expect(wahlSlug(w.typ, w.jahr)).toBe(w.slug);
	});

	it('wahlSlug liefert null für Jahre ohne Wahl', () => {
		expect(wahlSlug('agh', 2013)).toBeNull();
		expect(wahlSlug('btw', 2011)).toBeNull();
	});
});

describe('parteiZiel', () => {
	it.each([
		['AfD', 'afd'],
		['BSW', 'bsw'],
		['CDU', 'cdu'],
		['FDP', 'fdp'],
		['GRÜNE', 'gruene'],
		['Die Linke', 'linke'],
		['PIRATEN', 'piraten'],
		['SPD', 'spd']
	] as const)('%s → %s', (kurzname, key) => {
		expect(parteiZiel(kurzname)).toBe(key);
	});

	it('Freie Wähler landen im eigenen Grau-Topf', () => {
		expect(parteiZiel('FREIE WÄHLER')).toBe('fw');
	});

	it('Tierschutzpartei landet im eigenen Grau-Topf', () => {
		expect(parteiZiel('Tierschutzpartei')).toBe('tier');
	});

	it.each(['Sonstige', 'Die PARTEI', ''])('%s ohne Schlüssel landet in Sonstige', (kurzname) => {
		expect(parteiZiel(kurzname)).toBe('sonst');
	});

	it('Objekt-Prototyp-Namen landen nicht versehentlich bei einer Partei', () => {
		expect(parteiZiel('toString')).toBe('sonst');
		expect(parteiZiel('__proto__')).toBe('sonst');
	});

	it('ordnet jeden Kurznamen der Datenbasis bewusst zu', () => {
		const kurznamen = new Set(
			data.bezirke.flatMap((b) =>
				Object.values(b.wahlen).flatMap((w) => w.parteien.map((p) => p.kurzname))
			)
		);
		const ohneSchluessel = [...kurznamen].filter((k) => parteiZiel(k) === 'sonst').sort();
		expect(ohneSchluessel).toEqual(['Sonstige']);
	});
});
