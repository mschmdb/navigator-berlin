import { describe, expect, it } from 'vitest';
import {
	DEFAULT_URL_STATE,
	parseUrlState,
	serializeUrlState,
	urlStateHref,
	type QuadrateUrlState
} from './url-state';

const parse = (href: string) => parseUrlState(new URL(href, 'https://navigator.berlin/stories/x'));

describe('parseUrlState', () => {
	it('liefert ohne Parameter die Defaults', () => {
		expect(parse('')).toEqual(DEFAULT_URL_STATE);
	});

	it('Defaults der Gesamtansicht entsprechen der Vorlage', () => {
		expect(DEFAULT_URL_STATE.gesamt).toEqual({
			wahl: 'agh',
			jahre: null,
			bezirke: null,
			sort: 'alpha',
			schwelle: 5,
			hervorheben: null,
			papier: false,
			zahlen: true,
			nurGrau: false,
			reihenfolge: 'fixed'
		});
		expect(DEFAULT_URL_STATE.zeit).toEqual({
			bezirk: 'friedrichshain-kreuzberg',
			wahl: 'agh'
		});
		expect(DEFAULT_URL_STATE.kapitel).toBeNull();
	});

	it('liest Deep-Links aus der Einleitung', () => {
		const p = parse('?hl=piraten#s6');
		expect(p.gesamt.hervorheben).toBe('piraten');
		expect(p.kapitel).toBe(6);
		expect(parse('?hl=fdp#s6').gesamt.hervorheben).toBe('fdp');
	});

	it('liest alle Parameter der Gesamtansicht', () => {
		const p = parse(
			'?wahl=both&y=a2011,b2013&bz=02,01&sort=turnout&thr=3&hl=linke&paper=1&nums=0&ng=1&ord=size'
		);
		expect(p.gesamt).toEqual({
			wahl: 'both',
			jahre: ['a2011', 'b2013'],
			bezirke: ['01', '02'],
			sort: 'turnout',
			schwelle: 3,
			hervorheben: 'linke',
			papier: true,
			zahlen: false,
			nurGrau: true,
			reihenfolge: 'size'
		});
	});

	it('liest Bezirk und Wahl für Kapitel 5', () => {
		const p = parse('?bezirk=neukoelln&wahl5=btw#s5');
		expect(p.zeit).toEqual({ bezirk: 'neukoelln', wahl: 'btw' });
		expect(p.kapitel).toBe(5);
	});

	it('fällt bei ungültigen Werten auf Defaults zurück, ohne Fehler', () => {
		const p = parse(
			'?wahl=eu&y=x1999,,a2012&bz=13,00,abc&sort=zufall&thr=abc&hl=rest&paper=ja&nums=nein&ng=2&ord=wild&bezirk=hamburg&wahl5=both#s9'
		);
		expect(p).toEqual(DEFAULT_URL_STATE);
	});

	it('klemmt die Schwelle auf 0 bis 10 und rundet', () => {
		expect(parse('?thr=42').gesamt.schwelle).toBe(10);
		expect(parse('?thr=-3').gesamt.schwelle).toBe(0);
		expect(parse('?thr=2.6').gesamt.schwelle).toBe(3);
		expect(parse('?thr=0').gesamt.schwelle).toBe(0);
		expect(parse('?thr=').gesamt.schwelle).toBe(5);
	});

	it('verwirft Hervorheben für unbekannte Parteien', () => {
		expect(parse('?hl=xyz').gesamt.hervorheben).toBeNull();
		expect(parse('?hl=').gesamt.hervorheben).toBeNull();
	});

	it('Sortierung nach Partei braucht eine hervorgehobene Partei', () => {
		expect(parse('?sort=party').gesamt.sort).toBe('nr');
		expect(parse('?sort=party&hl=spd').gesamt.sort).toBe('party');
	});

	it('filtert ungültige Jahre und Bezirke heraus und dedupliziert', () => {
		const p = parse('?y=a2026,zz,a2026,b2025&bz=05,05,99');
		expect(p.gesamt.jahre).toEqual(['a2026', 'b2025']);
		expect(p.gesamt.bezirke).toEqual(['05']);
	});

	it('behandelt die vollständige Jahresliste wie keine Auswahl', () => {
		const alle = 'a2011,a2016,a2021,a2023,a2026,b2013,b2017,b2021,b2025';
		expect(parse(`?y=${alle}`).gesamt.jahre).toBeNull();
		const alleBz = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).join(',');
		expect(parse(`?bz=${alleBz}`).gesamt.bezirke).toBeNull();
	});

	it('liest alle sechs Kapitel-Anker und ignoriert fremde Anker', () => {
		for (let n = 1; n <= 6; n++) expect(parse(`#s${n}`).kapitel).toBe(n);
		expect(parse('#s0').kapitel).toBeNull();
		expect(parse('#top').kapitel).toBeNull();
		expect(parse('#s66').kapitel).toBeNull();
	});
});

describe('serializeUrlState', () => {
	it('erzeugt für Defaults keine Parameter und keinen Anker', () => {
		const { search, hash } = serializeUrlState(DEFAULT_URL_STATE);
		expect(search).toBe('');
		expect(hash).toBe('');
	});

	it('schreibt nur abweichende Werte', () => {
		const state: QuadrateUrlState = {
			...DEFAULT_URL_STATE,
			gesamt: { ...DEFAULT_URL_STATE.gesamt, hervorheben: 'piraten' },
			kapitel: 6
		};
		expect(serializeUrlState(state)).toEqual({ search: '?hl=piraten', hash: '#s6' });
	});

	it('normalisiert Sortierung nach Partei ohne Hervorheben', () => {
		const state: QuadrateUrlState = {
			...DEFAULT_URL_STATE,
			gesamt: { ...DEFAULT_URL_STATE.gesamt, sort: 'party' }
		};
		expect(serializeUrlState(state).search).toBe('?sort=nr');
	});

	it('behält fremde Parameter aus der Basis-URL', () => {
		const base = new URLSearchParams('utm_source=bsky&hl=spd&thr=7');
		const { search } = serializeUrlState(DEFAULT_URL_STATE, base);
		expect(search).toBe('?utm_source=bsky');
	});

	it('ist symmetrisch: parse(serialize(state)) ergibt den Zustand', () => {
		const states: QuadrateUrlState[] = [
			DEFAULT_URL_STATE,
			{
				gesamt: {
					wahl: 'both',
					jahre: ['a2011', 'b2025'],
					bezirke: ['02', '11'],
					sort: 'party',
					schwelle: 0,
					hervorheben: 'bsw',
					papier: true,
					zahlen: false,
					nurGrau: true,
					reihenfolge: 'size'
				},
				zeit: { bezirk: 'spandau', wahl: 'btw' },
				kapitel: 5
			},
			{
				...DEFAULT_URL_STATE,
				gesamt: { ...DEFAULT_URL_STATE.gesamt, schwelle: 10, wahl: 'btw' },
				kapitel: 1
			}
		];
		for (const s of states) {
			const { search, hash } = serializeUrlState(s);
			expect(parse(search + hash)).toEqual(s);
		}
	});

	it('ist symmetrisch: serialize(parse(url)) ergibt dieselbe kanonische URL', () => {
		const url = '?wahl=btw&bz=01,03&thr=0&hl=cdu&bezirk=mitte&wahl5=btw#s5';
		const { search, hash } = serializeUrlState(parse(url));
		expect(search + hash).toBe(url.replace(/,/g, '%2C'));
	});
});

describe('urlStateHref', () => {
	it('baut relative Deep-Links', () => {
		const state: QuadrateUrlState = {
			...DEFAULT_URL_STATE,
			gesamt: { ...DEFAULT_URL_STATE.gesamt, hervorheben: 'fdp' },
			kapitel: 6
		};
		expect(urlStateHref(state)).toBe('?hl=fdp#s6');
	});

	it('liefert für Defaults einen leeren String', () => {
		expect(urlStateHref(DEFAULT_URL_STATE)).toBe('');
	});
});
