import { describe, it, expect } from 'vitest';
import {
	wahl,
	wahlTypEnum,
	wahlStimmtypEnum,
	stimmbezirk,
	partei,
	parteiAlias,
	ergebnis,
	wahlAggregatKiez,
	wahlAggregatBezirk,
	wahlAggregatBerlin
} from './index.js';
import * as rootSchema from '../index.js';

describe('schema/wahl (Story 6.0 AC-1)', () => {
	it('exportiert alle 8 Wahl-Tabellen über schema/index', () => {
		expect(rootSchema.wahl).toBe(wahl);
		expect(rootSchema.stimmbezirk).toBe(stimmbezirk);
		expect(rootSchema.partei).toBe(partei);
		expect(rootSchema.parteiAlias).toBe(parteiAlias);
		expect(rootSchema.ergebnis).toBe(ergebnis);
		expect(rootSchema.wahlAggregatKiez).toBe(wahlAggregatKiez);
		expect(rootSchema.wahlAggregatBezirk).toBe(wahlAggregatBezirk);
		expect(rootSchema.wahlAggregatBerlin).toBe(wahlAggregatBerlin);
	});

	it('wahl-Tabelle hat die definierten Spalten', () => {
		const cols = Object.keys(wahl).filter((k) => !k.startsWith('_'));
		expect(cols).toContain('id');
		expect(cols).toContain('jahr');
		expect(cols).toContain('typ');
		expect(cols).toContain('stimmtyp');
		expect(cols).toContain('isRepeatElection');
		expect(cols).toContain('parentElectionId');
		expect(cols).toContain('sourceUrl');
		expect(cols).toContain('license');
		expect(cols).toContain('sourceUpdatedAt');
		expect(cols).toContain('computedAt');
	});

	it('wahl-Enums haben die erwarteten Werte', () => {
		expect(wahlTypEnum.enumValues).toEqual(['btw', 'agh', 'bvv']);
		expect(wahlStimmtypEnum.enumValues).toEqual(['erststimme', 'zweitstimme', 'einstimme']);
	});

	it('stimmbezirk hat Composite-uwbId (wahlkreis + wahlbezirk) als Felder', () => {
		const cols = Object.keys(stimmbezirk).filter((k) => !k.startsWith('_'));
		expect(cols).toContain('wahlId');
		expect(cols).toContain('uwbId');
		expect(cols).toContain('wahlkreis');
		expect(cols).toContain('wahlbezirk');
		expect(cols).toContain('bezirkCode');
		expect(cols).toContain('bezirksart');
	});

	it('partei + partei_alias modellieren Naming-Drift', () => {
		const parteiCols = Object.keys(partei).filter((k) => !k.startsWith('_'));
		expect(parteiCols).toContain('kurzname');
		expect(parteiCols).toContain('vollname');
		expect(parteiCols).toContain('farbeHex');
		expect(parteiCols).toContain('firstSeenYear');
		expect(parteiCols).toContain('lastSeenYear');

		const aliasCols = Object.keys(parteiAlias).filter((k) => !k.startsWith('_'));
		expect(aliasCols).toContain('parteiId');
		expect(aliasCols).toContain('aliasLabel');
		expect(aliasCols).toContain('jahr');
	});

	it('ergebnis enthält Briefwahl-Aggregat-Flag', () => {
		const cols = Object.keys(ergebnis).filter((k) => !k.startsWith('_'));
		expect(cols).toContain('wahlId');
		expect(cols).toContain('uwbId');
		expect(cols).toContain('parteiId');
		expect(cols).toContain('stimmen');
		expect(cols).toContain('anteil');
		expect(cols).toContain('istBriefwahlAggregat');
	});

	it('wahl_aggregat_kiez hat kiez_slug-Partition', () => {
		const cols = Object.keys(wahlAggregatKiez).filter((k) => !k.startsWith('_'));
		expect(cols).toContain('wahlId');
		expect(cols).toContain('kiezSlug');
		expect(cols).toContain('parteiId');
		expect(cols).toContain('stimmen');
		expect(cols).toContain('anteil');
		expect(cols).toContain('computedAt');
	});

	it('wahl_aggregat_bezirk hat bezirk_slug-Partition', () => {
		const cols = Object.keys(wahlAggregatBezirk).filter((k) => !k.startsWith('_'));
		expect(cols).toContain('bezirkSlug');
	});

	it('wahl_aggregat_berlin ist Berlin-Total (kein Slug)', () => {
		const cols = Object.keys(wahlAggregatBerlin).filter((k) => !k.startsWith('_'));
		expect(cols).toContain('wahlId');
		expect(cols).toContain('parteiId');
		expect(cols).not.toContain('kiezSlug');
		expect(cols).not.toContain('bezirkSlug');
	});
});
