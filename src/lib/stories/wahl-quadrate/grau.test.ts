import { describe, expect, it } from 'vitest';
import { derive, formatGreyLine, formatShare, greyCaption, sharesOf, type GreyNames } from './grau';
import { ORDER } from './parteien';
import fixtures from './fixtures/wahlen.json';

const NAMES: GreyNames = {
	afd: 'AfD',
	bsw: 'BSW',
	cdu: 'CDU',
	fdp: 'FDP',
	gruene: 'Grüne',
	linke: 'Die Linke',
	piraten: 'Piraten',
	spd: 'SPD',
	fw: 'Freie Wähler',
	tier: 'Tierschutzpartei'
};

const base = { sonst: 0.05, fw: 0 };

describe('derive', () => {
	it.each(fixtures.map((f) => ({ name: `${f.bezirk} ${f.wahl} ${f.jahr}`, f })))(
		'$name: Summe bleibt 100 % bei jeder Schwelle',
		({ f }) => {
			for (const thr of [0, 0.03, 0.05, 0.1]) {
				const d = derive(f, thr);
				const sum = ORDER.reduce((s, k) => s + d.disp[k], 0);
				expect(sum).toBeCloseTo(1, 6);
			}
		}
	);

	it('Partei genau auf der Schwelle bleibt farbig', () => {
		const d = derive({ raw: { spd: 0.05, cdu: 0.9 }, ...base }, 0.05);
		expect(d.disp.spd).toBe(0.05);
		expect(d.disp.rest).toBeCloseTo(0.05, 12);
	});

	it('Partei unter Schwelle wandert ins Grau und wird ab 0,5 % genannt', () => {
		const d = derive({ raw: { fdp: 0.046, bsw: 0.004, cdu: 0.9 }, ...base }, 0.05);
		expect(d.disp.fdp).toBe(0);
		expect(d.disp.bsw).toBe(0);
		expect(d.disp.rest).toBeCloseTo(0.1, 12);
		expect(d.small).toEqual([{ key: 'fdp', share: 0.046 }]);
	});

	it('Freie Wähler sind immer Grau und werden ab 0,5 % genannt', () => {
		const d = derive({ raw: { cdu: 0.9 }, sonst: 0.03, fw: 0.07 }, 0.05);
		expect(d.disp.rest).toBeCloseTo(0.1, 12);
		expect(d.small).toEqual([{ key: 'fw', share: 0.07 }]);
		expect(derive({ raw: { cdu: 0.9 }, sonst: 0.096, fw: 0.004 }, 0.05).small).toEqual([]);
	});

	it('Tierschutzpartei ist immer Grau und wird ab 0,5 % genannt', () => {
		const d = derive({ raw: { cdu: 0.9 }, sonst: 0.03, fw: 0, tier: 0.07 }, 0.05);
		expect(d.disp.rest).toBeCloseTo(0.1, 12);
		expect(d.small).toEqual([{ key: 'tier', share: 0.07 }]);
		const klein = derive({ raw: { cdu: 0.9 }, sonst: 0.096, fw: 0, tier: 0.004 }, 0.05);
		expect(klein.small).toEqual([]);
		expect(klein.disp.rest).toBeCloseTo(0.1, 12);
	});

	it('ohne Tierschutz-Anteil bleibt das Grau wie bisher', () => {
		const ohne = derive({ raw: { cdu: 0.9 }, sonst: 0.1, fw: 0 }, 0.05);
		expect(ohne.disp.rest).toBeCloseTo(0.1, 12);
		expect(ohne.small).toEqual([]);
	});

	it('genannte Kleinparteien absteigend sortiert', () => {
		const d = derive(
			{ raw: { fdp: 0.02, bsw: 0.031, afd: 0.01, cdu: 0.8 }, sonst: 0.129, fw: 0.01 },
			0.05
		);
		expect(d.small.map((s) => s.key)).toEqual(['bsw', 'fdp', 'afd', 'fw']);
	});

	it('Schwelle 0 zeigt jede Partei mit Stimmen', () => {
		const d = derive({ raw: { fdp: 0.001, cdu: 0.9 }, sonst: 0.099, fw: 0 }, 0);
		expect(d.disp.fdp).toBe(0.001);
		expect(d.small).toEqual([]);
	});

	it('top: die drei größten farbigen Parteien', () => {
		const d = derive({
			raw: { spd: 0.3, cdu: 0.25, gruene: 0.2, linke: 0.15, fdp: 0.04 },
			sonst: 0.06,
			fw: 0
		});
		expect(d.top.map((t) => t.key)).toEqual(['spd', 'cdu', 'gruene']);
	});

	it('Standardschwelle 5 %', () => {
		expect(derive({ raw: { fdp: 0.049, cdu: 0.9 }, sonst: 0.051, fw: 0 }).disp.fdp).toBe(0);
	});

	it('sharesOf liefert die Anteile in fester Reihenfolge', () => {
		const d = derive({ raw: { afd: 0.2, spd: 0.7 }, sonst: 0.1, fw: 0 });
		expect(sharesOf(d)).toEqual([0.2, 0, 0, 0, 0, 0, 0, 0.7, 0.1]);
	});
});

describe('greyCaption', () => {
	const d = derive({ raw: { fdp: 0.046, bsw: 0.031, cdu: 0.8 }, sonst: 0.053, fw: 0 }, 0.05);

	it('liefert gerundeten Grauanteil und genannte Parteien', () => {
		expect(greyCaption(d)).toEqual({
			percent: 13,
			parties: [
				{ key: 'fdp', share: 0.046 },
				{ key: 'bsw', share: 0.031 }
			]
		});
	});

	it('formatiert die deutsche Caption wie in der Vorgabe', () => {
		expect(formatGreyLine(d, NAMES, 'de')).toBe(
			'Grau 13 %: FDP 4,6 %, BSW 3,1 % und weitere kleine Parteien.'
		);
	});

	it('formatiert die englische Caption', () => {
		expect(formatGreyLine(d, NAMES, 'en')).toBe(
			'Grey 13%: FDP 4.6%, BSW 3.1% and other small parties.'
		);
	});

	it('nennt die Tierschutzpartei in der Caption', () => {
		const e = derive({ raw: { cdu: 0.9 }, sonst: 0.088, fw: 0, tier: 0.012 }, 0.05);
		expect(formatGreyLine(e, NAMES, 'de')).toBe(
			'Grau 10 %: Tierschutzpartei 1,2 % und weitere kleine Parteien.'
		);
	});

	it('ohne genannte Parteien nur der Grauanteil', () => {
		const e = derive({ raw: { cdu: 0.97 }, sonst: 0.03, fw: 0 });
		expect(formatGreyLine(e, NAMES, 'de')).toBe('Grau 3 %: weitere kleine Parteien.');
	});
});

describe('formatShare', () => {
	it('eine Nachkommastelle, Komma und geschütztes Leerzeichen im Deutschen', () => {
		expect(formatShare(0.2866, 'de')).toBe('28,7 %');
		expect(formatShare(0.2866, 'en')).toBe('28.7%');
	});
});
