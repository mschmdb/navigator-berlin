import { describe, expect, it } from 'vitest';
import raw from '../../../../static/data/stories-wahl.json';
import {
	alleEinblenden,
	bezirkAn,
	grauSpanne,
	grauTabelle,
	hatAusgeblendet,
	jahrAn,
	sichtbareJahre,
	sortiereBezirke,
	statusZahlen,
	toggleBezirk,
	toggleHervorheben,
	toggleJahr,
	wahlTypen,
	wandMasse
} from './gesamt';
import type { StoriesWahlData } from './types';
import { DEFAULT_URL_STATE, type GesamtState } from './url-state';

const data = raw as unknown as StoriesWahlData;
const S0: GesamtState = DEFAULT_URL_STATE.gesamt;
const with_ = (p: Partial<GesamtState>): GesamtState => ({ ...S0, ...p });
const NRN = data.bezirke.map((b) => b.nr);

describe('wahlTypen', () => {
	it('liefert eine oder beide Wahlarten in fester Reihenfolge', () => {
		expect(wahlTypen('agh')).toEqual(['agh']);
		expect(wahlTypen('btw')).toEqual(['btw']);
		expect(wahlTypen('both')).toEqual(['agh', 'btw']);
	});
});

describe('Jahre und Bezirke ein- und ausblenden', () => {
	it('zeigt ohne Auswahl alle Jahre und Bezirke', () => {
		expect(sichtbareJahre(S0, 'agh')).toEqual([2011, 2016, 2021, 2023, 2026]);
		expect(sichtbareJahre(S0, 'btw')).toEqual([2013, 2017, 2021, 2025]);
		expect(bezirkAn(S0, '05')).toBe(true);
		expect(hatAusgeblendet(S0)).toBe(false);
	});

	it('blendet eine Wahl aus und wieder ein, AGH 2021 und BTW 2021 bleiben getrennt', () => {
		const s1 = toggleJahr(S0, 'agh', 2021);
		expect(jahrAn(s1, 'agh', 2021)).toBe(false);
		expect(jahrAn(s1, 'btw', 2021)).toBe(true);
		expect(sichtbareJahre(s1, 'agh')).toEqual([2011, 2016, 2023, 2026]);
		expect(hatAusgeblendet(s1)).toBe(true);
		const s2 = toggleJahr(s1, 'agh', 2021);
		expect(s2.jahre).toBeNull();
		expect(hatAusgeblendet(s2)).toBe(false);
	});

	it('blendet einen Bezirk aus und mit dem letzten Klick wieder alle ein', () => {
		const s1 = toggleBezirk(S0, '02', NRN);
		expect(bezirkAn(s1, '02')).toBe(false);
		expect(s1.bezirke).toHaveLength(11);
		expect(toggleBezirk(s1, '02', NRN).bezirke).toBeNull();
	});

	it('erlaubt, alle Bezirke auszublenden', () => {
		let s = S0;
		for (const nr of NRN) s = toggleBezirk(s, nr, NRN);
		expect(s.bezirke).toEqual([]);
		expect(NRN.some((nr) => bezirkAn(s, nr))).toBe(false);
	});

	it('„Alles einblenden“ setzt nur Jahre und Bezirke zurück', () => {
		const s = with_({ jahre: ['a2011'], bezirke: ['01'], schwelle: 3, hervorheben: 'spd' });
		expect(alleEinblenden(s)).toEqual(with_({ schwelle: 3, hervorheben: 'spd' }));
	});
});

describe('toggleHervorheben', () => {
	it('hebt eine Partei hervor und mit dem zweiten Klick wieder auf', () => {
		const s1 = toggleHervorheben(S0, 'piraten');
		expect(s1.hervorheben).toBe('piraten');
		expect(toggleHervorheben(s1, 'piraten').hervorheben).toBeNull();
		expect(toggleHervorheben(s1, 'spd').hervorheben).toBe('spd');
	});

	it('fällt ohne Partei von der Partei-Sortierung auf „Nach Nummer“ zurück', () => {
		const s = with_({ hervorheben: 'spd', sort: 'party' });
		expect(toggleHervorheben(s, 'spd').sort).toBe('nr');
		expect(toggleHervorheben(s, 'cdu').sort).toBe('party');
	});
});

describe('sortiereBezirke', () => {
	const nrs = (s: GesamtState): string[] => sortiereBezirke(data.bezirke, s).map((b) => b.nr);

	it('sortiert standardmäßig nach Alphabet', () => {
		expect(sortiereBezirke(data.bezirke, S0).map((b) => b.name)).toEqual([
			'Charlottenburg-Wilmersdorf',
			'Friedrichshain-Kreuzberg',
			'Lichtenberg',
			'Marzahn-Hellersdorf',
			'Mitte',
			'Neukölln',
			'Pankow',
			'Reinickendorf',
			'Spandau',
			'Steglitz-Zehlendorf',
			'Tempelhof-Schöneberg',
			'Treptow-Köpenick'
		]);
	});

	it('sortiert nach Nummer', () => {
		expect(nrs(with_({ sort: 'nr' }))).toEqual(NRN);
	});

	it('sortiert nach Wahlbeteiligung der letzten sichtbaren Wahl, höchste zuerst', () => {
		const order = nrs(with_({ sort: 'turnout' }));
		expect(order[0]).toBe('06');
		expect(order.at(-1)).toBe('05');
	});

	it('sortiert nach Anteil der hervorgehobenen Partei in der letzten sichtbaren Wahl', () => {
		const s = with_({ sort: 'party', hervorheben: 'piraten', jahre: ['a2011'] });
		const order = nrs(s);
		expect(order[0]).toBe('02');
		expect(order.at(-1)).toBe('06');
	});

	it('bricht Gleichstand nach Nummer, z. B. Piraten 2026 überall ohne Stimmen', () => {
		expect(nrs(with_({ sort: 'party', hervorheben: 'piraten' }))).toEqual(NRN);
	});

	it('verändert die Eingabe nicht', () => {
		const before = data.bezirke.map((b) => b.nr);
		sortiereBezirke(data.bezirke, S0);
		expect(data.bezirke.map((b) => b.nr)).toEqual(before);
	});
});

describe('wandMasse', () => {
	it('passt fünf Quadrate am Desktop ein und deckelt bei 200 px', () => {
		const m = wandMasse(1500, false, S0);
		expect(m.quadrat).toBe(200);
		expect(m.abstand).toBe(52);
		expect(m.scrollt).toBe(false);
	});

	it('rechnet Name, Abstände und Rand für Außenbeschriftung ab', () => {
		// (1000 - 52 Rand - 180 Name - 4 * 52 Abstand) / 5 = 112
		expect(wandMasse(1000, false, S0).quadrat).toBe(112);
	});

	it('gibt ausgeblendeten Wahlen eine schmale Spalte', () => {
		// (1000 - 52 - 180 - 208 - 48) / 4 = 128
		expect(wandMasse(1000, false, with_({ jahre: JAHR_OHNE_A2011 })).quadrat).toBe(128);
	});

	it('scrollt am Desktop erst unter 100 px Kantenlänge', () => {
		const m = wandMasse(700, false, S0);
		expect(m.quadrat).toBe(100);
		expect(m.scrollt).toBe(true);
	});

	it('scrollt schmal nicht: 390 px Telefon mit Seitenrand', () => {
		const m = wandMasse(358, true, S0);
		expect(m.abstand).toBe(8);
		expect(m.quadrat).toBe(65);
		expect(m.scrollt).toBe(false);
	});

	it('nimmt bei beiden Wahlarten das engere Raster', () => {
		expect(wandMasse(1000, false, with_({ wahl: 'both' })).quadrat).toBe(112);
	});

	it('kommt ohne sichtbare Wahl und ohne Breite nicht ins Minus', () => {
		const leer = with_({ jahre: ['b2013'] });
		expect(wandMasse(1000, false, leer).quadrat).toBeGreaterThan(0);
		expect(wandMasse(0, true, S0).quadrat).toBeGreaterThan(0);
	});
});

const JAHR_OHNE_A2011 = ['a2016', 'a2021', 'a2023', 'a2026', 'b2013', 'b2017', 'b2021', 'b2025'];

describe('grauTabelle', () => {
	it('liefert je sichtbarer Wahl den berlinweiten Grauanteil und die benannten Parteien ab 1 %', () => {
		const rows = grauTabelle(data, 'agh', S0);
		expect(rows.map((r) => r.jahr)).toEqual([2011, 2016, 2021, 2023, 2026]);
		for (const r of rows) {
			expect(r.grau).toBeGreaterThan(0);
			expect(r.grau).toBeLessThan(0.5);
			for (const p of r.darin) expect(p.share).toBeGreaterThanOrEqual(0.01);
		}
		const y2016 = rows.find((r) => r.jahr === 2016)!;
		expect(y2016.darin.map((p) => p.key)).toContain('piraten');
	});

	it('folgt der Schwelle: bei 0 % steht nur Sonstiges im Grau', () => {
		const rows = grauTabelle(data, 'btw', with_({ schwelle: 0 }));
		for (const r of rows) expect(r.darin.filter((p) => p.key !== 'fw' && p.key !== 'tier')).toEqual([]);
	});

	it('lässt ausgeblendete Wahlen weg', () => {
		const rows = grauTabelle(data, 'agh', with_({ jahre: ['a2026'] }));
		expect(rows.map((r) => r.jahr)).toEqual([2026]);
		expect(grauTabelle(data, 'btw', with_({ jahre: ['a2026'] }))).toEqual([]);
	});
});

describe('grauSpanne', () => {
	it('liefert kleinsten und größten Grauanteil in ganzen Prozent über alle sichtbaren Wahlen', () => {
		const sp = grauSpanne(data, S0)!;
		expect(sp.lo).toBeLessThanOrEqual(sp.hi);
		expect(Number.isInteger(sp.lo)).toBe(true);
	});

	it('ist leer ohne sichtbare Wahl', () => {
		expect(grauSpanne(data, with_({ jahre: ['b2013'] }))).toBeNull();
	});
});

describe('statusZahlen', () => {
	it('zählt sichtbare Bezirke und Wahlen', () => {
		expect(statusZahlen(S0)).toEqual({ bezirke: 12, wahlen: 5 });
		expect(statusZahlen(with_({ wahl: 'both' }))).toEqual({ bezirke: 12, wahlen: 9 });
		expect(statusZahlen(with_({ bezirke: ['01'], jahre: ['a2011', 'b2013'] }))).toEqual({
			bezirke: 1,
			wahlen: 1
		});
	});
});
