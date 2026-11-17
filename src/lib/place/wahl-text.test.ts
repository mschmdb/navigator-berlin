import { describe, expect, it } from 'vitest';
import { partyName, wahlFacts, wahlSentences } from './wahl-text';
import type { WahlPunkt } from './wahl-types';

const p = (jahr: number, partei: string, anteil: number): WahlPunkt => ({
	jahr,
	partei,
	farbe: '#000',
	anteil
});

const cw = [
	p(2011, 'CDU', 18.2),
	p(2011, 'SPD', 31.6),
	p(2011, 'GRÜNE', 19),
	p(2026, 'CDU', 25.1),
	p(2026, 'SPD', 19.4),
	p(2026, 'GRÜNE', 20.2),
	p(2026, 'Sonstige', 30)
];
const fk = [p(2026, 'CDU', 9.2), p(2026, 'GRÜNE', 30.4), p(2026, 'SPD', 12)];
const de = { wahl: 'agh' as const, name: 'Charlottenburg-Wilmersdorf', locale: 'de' as const };

describe('partyName', () => {
	it('adds the article and knows plural parties', () => {
		expect(partyName('CDU', 'de')).toEqual({ name: 'die CDU', pronoun: 'sie', plural: false });
		expect(partyName('GRÜNE', 'de')).toEqual({ name: 'die Grünen', pronoun: 'sie', plural: true });
		expect(partyName('BSW', 'de')).toEqual({ name: 'das BSW', pronoun: 'es', plural: false });
		expect(partyName('GRÜNE', 'en')).toEqual({ name: 'the Greens', pronoun: 'they', plural: true });
	});
	it('keeps unknown names without an article', () => {
		expect(partyName('Tierschutzpartei', 'de')).toEqual({
			name: 'Tierschutzpartei',
			pronoun: 'sie',
			plural: false
		});
	});
});

describe('wahlFacts', () => {
	it('ignores „Sonstige“ when it has the largest share', () => {
		expect(wahlFacts(cw, fk)?.leaders.map((l) => l.partei)).toEqual(['CDU']);
	});
	it('finds the largest gain and loss since the first election', () => {
		const f = wahlFacts(cw, fk);
		expect(f?.firstJahr).toBe(2011);
		expect(f?.gain).toEqual({ partei: 'CDU', diff: 7 });
		expect(f?.loss).toEqual({ partei: 'SPD', diff: -12 });
	});
	it('detects a tie on the rounded shares', () => {
		const f = wahlFacts(
			[p(2025, 'GRÜNE', 24.2), p(2025, 'Die Linke', 23.8), p(2025, 'SPD', 10)],
			[]
		);
		expect(f?.leaders.map((l) => l.partei)).toEqual(['GRÜNE', 'Die Linke']);
	});
	it('returns null without data', () => {
		expect(wahlFacts([], fk)).toBeNull();
	});
});

describe('wahlSentences (DE)', () => {
	it('names the election, adds articles and the winner of the reference', () => {
		expect(wahlSentences(wahlFacts(cw, fk), { ...de, ref: 'Friedrichshain-Kreuzberg' })).toEqual([
			'Bei der Abgeordnetenhauswahl 2026 wurde die CDU in Charlottenburg-Wilmersdorf mit 25 % stärkste Kraft.',
			'In Friedrichshain-Kreuzberg holte sie 9 %, dort lagen die Grünen mit 30 % vorn.',
			'Seit 2011 hat die CDU hier 7 Prozentpunkte gewonnen, die SPD hat 12 verloren.'
		]);
	});
	it('uses plural verbs for the Greens', () => {
		const own = [p(2026, 'GRÜNE', 30.4), p(2026, 'CDU', 9)];
		expect(wahlSentences(wahlFacts(own, cw), { ...de, name: 'X', ref: 'Y' })).toEqual([
			'Bei der Abgeordnetenhauswahl 2026 wurden die Grünen in X mit 30 % stärkste Kraft.',
			'In Y holten sie 20 %, dort lag die CDU mit 25 % vorn.'
		]);
	});
	it('says so when the same party leads in both places', () => {
		const ref = [p(2026, 'CDU', 18.4), p(2026, 'SPD', 15)];
		expect(wahlSentences(wahlFacts(cw, ref), { ...de, ref: 'ganz Berlin' })[1]).toBe(
			'In ganz Berlin wurde sie mit 18 % ebenfalls stärkste Kraft.'
		);
	});
	it('handles a tie', () => {
		const own = [p(2025, 'GRÜNE', 24.2), p(2025, 'Die Linke', 23.8)];
		expect(wahlSentences(wahlFacts(own, []), { ...de, wahl: 'btw', name: 'X', ref: 'Y' })).toEqual([
			'Bei der Bundestagswahl 2025 lagen in X die Grünen und die Linke mit je 24 % gleichauf vorn.'
		]);
	});
	it('skips the reference sentence when the reference lacks that year', () => {
		const ref = [p(2021, 'CDU', 18)];
		expect(wahlSentences(wahlFacts(cw, ref), { ...de, ref: 'Y' })).toHaveLength(2);
	});
	it('skips the change sentence for a single election and small shifts', () => {
		const own = [p(2021, 'CDU', 20), p(2026, 'CDU', 21), p(2021, 'SPD', 10), p(2026, 'SPD', 9.4)];
		expect(wahlSentences(wahlFacts(own, []), { ...de, name: 'X', ref: 'Y' })).toHaveLength(1);
	});
	it('names only the gain when no party lost much', () => {
		const own = [p(2021, 'CDU', 20), p(2026, 'CDU', 26), p(2021, 'SPD', 10), p(2026, 'SPD', 10)];
		expect(wahlSentences(wahlFacts(own, []), { ...de, name: 'X', ref: 'Y' })[1]).toBe(
			'Seit 2021 hat die CDU hier 6 Prozentpunkte gewonnen.'
		);
	});
});

describe('wahlSentences (EN)', () => {
	it('reads naturally in English', () => {
		expect(
			wahlSentences(wahlFacts(cw, fk), {
				...de,
				locale: 'en',
				ref: 'Friedrichshain-Kreuzberg'
			})
		).toEqual([
			'In the 2026 Abgeordnetenhaus election, the CDU came first in Charlottenburg-Wilmersdorf with 25%.',
			'In Friedrichshain-Kreuzberg it won 9%, and the Greens came first there with 30%.',
			'Since 2011 the CDU has gained 7 percentage points here, and the SPD has lost 12.'
		]);
	});
});
