import { describe, expect, it } from 'vitest';
import { LAYER_SYNONYMS_DE, normalizeQueryNfd, matchSynonyms } from './layer-synonyms.js';

describe('normalizeQueryNfd', () => {
	it('strippt Umlaute (NFD-decompose + diacritic-remove)', () => {
		expect(normalizeQueryNfd('Lärm')).toBe('larm');
		expect(normalizeQueryNfd('Grün')).toBe('grun');
		expect(normalizeQueryNfd('Bär')).toBe('bar');
	});

	it('lowercased + trimmed', () => {
		expect(normalizeQueryNfd('  KITA  ')).toBe('kita');
	});

	it('empty-string-safe', () => {
		expect(normalizeQueryNfd('')).toBe('');
	});
});

describe('LAYER_SYNONYMS_DE map', () => {
	it('Kita-Begriffe → kitas-2024', () => {
		expect(LAYER_SYNONYMS_DE['kitas-2024']).toContain('kita');
	});

	it('Schule-Begriffe gibt mind. ein Mapping pro Schulen-Slug', () => {
		expect(LAYER_SYNONYMS_DE['schulen-2024']).toContain('schule');
	});

	it('Hitze → klima-pet-2022', () => {
		expect(LAYER_SYNONYMS_DE['klima-pet-2022']).toContain('hitze');
	});

	it('Sozial → mss-gesamtindex-2025', () => {
		expect(LAYER_SYNONYMS_DE['mss-gesamtindex-2025']).toContain('sozial');
	});

	it('Mietspiegel → wohnlagen-2024', () => {
		expect(LAYER_SYNONYMS_DE['wohnlagen-2024']).toContain('mietspiegel');
	});

	it('Park → gruenanlagen', () => {
		expect(LAYER_SYNONYMS_DE['gruenanlagen']).toContain('park');
	});

	it('Bus → bus-haltestellen', () => {
		expect(LAYER_SYNONYMS_DE['bus-haltestellen']).toContain('bus');
	});

	it('Rad → fahrradstrassen + radverkehrsnetz', () => {
		expect(LAYER_SYNONYMS_DE['radverkehrsnetz-2025']).toContain('rad');
		expect(LAYER_SYNONYMS_DE['fahrradstrassen-2024']).toContain('rad');
	});
});

describe('matchSynonyms', () => {
	it('„kita" findet kitas-2024', () => {
		expect(matchSynonyms('kita')).toContain('kitas-2024');
	});

	it('„Schule" findet schulen-2024 + einschulbereiche-2024', () => {
		const hits = matchSynonyms('schule');
		expect(hits).toContain('schulen-2024');
		expect(hits).toContain('einschulbereiche-2024');
	});

	it('„Hitze" findet klima-pet-2022', () => {
		expect(matchSynonyms('Hitze')).toContain('klima-pet-2022');
	});

	it('„Sozial" findet mss-gesamtindex-2025 + kiez-score-soziale-lage', () => {
		const hits = matchSynonyms('sozial');
		expect(hits).toContain('mss-gesamtindex-2025');
		expect(hits).toContain('kiez-score-soziale-lage');
	});

	it('„Mietspiegel" findet wohnlagen-2024', () => {
		expect(matchSynonyms('mietspiegel')).toContain('wohnlagen-2024');
	});

	it('unbekanntes Wort liefert leere Liste', () => {
		expect(matchSynonyms('xyzzy')).toEqual([]);
	});

	it('„gruen" ohne Umlaut findet gruenanlagen (NFD-Toleranz)', () => {
		expect(matchSynonyms('gruen')).toContain('gruenanlagen');
	});

	it('„laerm" ohne Umlaut findet laerm-2023 (NFD-Toleranz)', () => {
		expect(matchSynonyms('laerm')).toContain('laerm-2023');
	});

	it('Case-insensitive (BUS = bus = Bus)', () => {
		expect(matchSynonyms('BUS')).toContain('bus-haltestellen');
		expect(matchSynonyms('Bus')).toContain('bus-haltestellen');
	});

	it('Whitespace toleriert', () => {
		expect(matchSynonyms('  kita  ')).toContain('kitas-2024');
	});
});
