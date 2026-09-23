import { describe, it, expect } from 'vitest';
import {
	PARTEI_SEED,
	SONSTIGE_KURZNAME,
	buildAliasIndex,
	resolveParteiKurzname
} from './partei-seed.js';

describe('partei-seed', () => {
	it('definiert mindestens die 9 Major-Parteien + Sonstige', () => {
		const kurz = PARTEI_SEED.map((p) => p.kurzname);
		expect(kurz).toContain('SPD');
		expect(kurz).toContain('CDU');
		expect(kurz).toContain('GRÜNE');
		expect(kurz).toContain('AfD');
		expect(kurz).toContain('Die Linke');
		expect(kurz).toContain('BSW');
		expect(kurz).toContain(SONSTIGE_KURZNAME);
	});

	it('AfD hat firstSeenYear=2013', () => {
		const afd = PARTEI_SEED.find((p) => p.kurzname === 'AfD');
		expect(afd?.firstSeenYear).toBe(2013);
	});

	it('BSW hat firstSeenYear=2024', () => {
		const bsw = PARTEI_SEED.find((p) => p.kurzname === 'BSW');
		expect(bsw?.firstSeenYear).toBe(2024);
	});

	it('Die Linke fängt PDS + Linkspartei.PDS + DIE LINKE als Alias', () => {
		expect(resolveParteiKurzname('PDS')).toBe('Die Linke');
		expect(resolveParteiKurzname('Linkspartei.PDS')).toBe('Die Linke');
		expect(resolveParteiKurzname('DIE LINKE')).toBe('Die Linke');
		expect(resolveParteiKurzname('Linke')).toBe('Die Linke');
	});

	it('GRÜNE fängt B-90/GRÜNE + Bündnis 90/Die Grünen', () => {
		expect(resolveParteiKurzname("B'90/GRÜNE")).toBe('GRÜNE');
		expect(resolveParteiKurzname('Bündnis 90/Die Grünen')).toBe('GRÜNE');
		expect(resolveParteiKurzname('Die Grünen')).toBe('GRÜNE');
	});

	it('fängt die AGH26/BVV26-DSB-Legendennamen (Story: Ingest AGH/BVV 2026)', () => {
		expect(resolveParteiKurzname('Christlich Demokratische Union Deutschlands')).toBe('CDU');
		expect(resolveParteiKurzname('Sozialdemokratische Partei Deutschlands')).toBe('SPD');
		expect(resolveParteiKurzname('BÜNDNIS 90/DIE GRÜNEN')).toBe('GRÜNE');
		expect(resolveParteiKurzname('Die Linke')).toBe('Die Linke');
		expect(resolveParteiKurzname('Alternative für Deutschland')).toBe('AfD');
		expect(resolveParteiKurzname('Freie Demokratische Partei')).toBe('FDP');
		expect(resolveParteiKurzname('Bündnis Sahra Wagenknecht - Vernunft und Gerechtigkeit')).toBe(
			'BSW'
		);
	});

	it('PARTEI MENSCH KLIMA TIERSCHUTZ und Volt Deutschland fallen auf Sonstige (unter 3 %)', () => {
		expect(resolveParteiKurzname('PARTEI MENSCH KLIMA TIERSCHUTZ')).toBe(SONSTIGE_KURZNAME);
		expect(resolveParteiKurzname('Volt Deutschland')).toBe(SONSTIGE_KURZNAME);
	});

	it('matched case-insensitive', () => {
		expect(resolveParteiKurzname('spd')).toBe('SPD');
		expect(resolveParteiKurzname('cdu')).toBe('CDU');
	});

	it('unbekannte Parteien fallen auf Sonstige zurück', () => {
		expect(resolveParteiKurzname('Tierschutzpartei')).toBe(SONSTIGE_KURZNAME);
		expect(resolveParteiKurzname('PIRATEN')).toBe(SONSTIGE_KURZNAME);
		expect(resolveParteiKurzname('MLPD')).toBe(SONSTIGE_KURZNAME);
	});

	it('ignoriert Whitespace und Empty', () => {
		expect(resolveParteiKurzname('  SPD  ')).toBe('SPD');
		expect(resolveParteiKurzname('')).toBe(SONSTIGE_KURZNAME);
	});

	it('buildAliasIndex liefert konsistente Map', () => {
		const index = buildAliasIndex();
		expect(index.get('spd')).toBe('SPD');
		expect(index.get('pds')).toBe('Die Linke');
		expect(index.get('übrige')).toBe(SONSTIGE_KURZNAME);
	});
});
