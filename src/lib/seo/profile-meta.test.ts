import { describe, it, expect } from 'vitest';
import {
	BEZIRK_DESCRIPTION_MAX,
	buildBezirkMeta,
	buildKiezMeta,
	formatStichtag
} from './profile-meta.js';

const base = {
	einwohner: 292624,
	flaecheHa: 2033,
	stichtag: '2024-12-31',
	score: null,
	rang: null,
	quartil: null,
	total: 0
} as const;

describe('formatStichtag', () => {
	it('nennt bei 31.12. das Jahresende', () => {
		expect(formatStichtag('2024-12-31', 'de')).toBe('Stand Ende 2024');
		expect(formatStichtag('2024-12-31', 'en')).toBe('as of end of 2024');
	});

	it('nennt sonst das Datum', () => {
		expect(formatStichtag('2024-06-30', 'de')).toBe('Stand 30.6.2024');
		expect(formatStichtag('2024-06-30', 'en')).toBe('as of 30/06/2024');
	});

	it('liefert null ohne Stichtag', () => {
		expect(formatStichtag(null, 'de')).toBeNull();
	});
});

describe('buildBezirkMeta', () => {
	const input = {
		...base,
		name: 'Friedrichshain-Kreuzberg',
		score: 41.2,
		rang: 7,
		quartil: 3,
		total: 12
	};
	const noFacts = { einwohner: 0, flaecheHa: 0 } as const;
	const CTA_DE = 'Mieten, Lärm, Grün, Hitze, Milieuschutz und Kieze auf der Karte.';
	const CTA_EN = 'Rents, noise, green space, heat, Milieuschutz and Kieze on a map.';

	it('DE: Title nennt Bezirk, Zahlen, Kieze und Karte', () => {
		const { title } = buildBezirkMeta({ ...input, locale: 'de' });
		expect(title).toBe('Friedrichshain-Kreuzberg: Bezirk in Zahlen, Kieze und Karte');
	});

	it('EN: Title nennt Berlin district', () => {
		const { title } = buildBezirkMeta({ ...input, locale: 'en' });
		expect(title).toBe('Friedrichshain-Kreuzberg: Berlin district in numbers and map');
	});

	it('kurzer Name: Marke am Ende', () => {
		const { title } = buildBezirkMeta({ ...input, name: 'Mitte', locale: 'de' });
		expect(title).toBe('Mitte: Bezirk in Zahlen, Kieze und Karte | navigator.berlin');
	});

	it('langer Name: kurze Zeile statt Marke', () => {
		const name = 'Charlottenburg-Wilmersdorf';
		expect(buildBezirkMeta({ ...input, name, locale: 'de' }).title).toBe(
			'Charlottenburg-Wilmersdorf: Bezirk in Zahlen'
		);
		expect(buildBezirkMeta({ ...input, name, locale: 'en' }).title).toBe(
			'Charlottenburg-Wilmersdorf: Berlin district in numbers'
		);
	});

	it('DE: Description mit Fakten und Seiteninhalt', () => {
		const { description } = buildBezirkMeta({ ...input, locale: 'de' });
		expect(description).toBe(
			`Friedrichshain-Kreuzberg hat 292.624 Einwohner:innen auf 20,3 km² (Stand Ende 2024). ${CTA_DE}`
		);
		expect(description.length).toBeLessThanOrEqual(BEZIRK_DESCRIPTION_MAX);
	});

	it('EN: lokalisierte Zahlen und Seiteninhalt', () => {
		const { description } = buildBezirkMeta({ ...input, locale: 'en' });
		expect(description).toBe(
			`Friedrichshain-Kreuzberg has 292,624 residents across 20.3 km² (as of end of 2024). ${CTA_EN}`
		);
		expect(description.length).toBeLessThanOrEqual(BEZIRK_DESCRIPTION_MAX);
	});

	it('verspricht keine Wahlergebnisse (zeigt die Bezirksseite nicht)', () => {
		for (const locale of ['de', 'en'] as const) {
			const { description } = buildBezirkMeta({ ...input, ...noFacts, locale });
			expect(description).not.toMatch(/Wahl|election/i);
		}
	});

	it('ohne Fakten: Seiteninhalt, dann Score mit Rang', () => {
		const { description } = buildBezirkMeta({ ...input, ...noFacts, locale: 'de' });
		expect(description).toBe(`${CTA_DE} Kiez-Score 41 von 100, Platz 7 von 12 in Berlin.`);
	});

	it('unteres Viertel: kein Platz X', () => {
		const { description } = buildBezirkMeta({
			...input,
			...noFacts,
			rang: 12,
			quartil: 4,
			locale: 'de'
		});
		expect(description).toContain('unteres Viertel in Berlin');
		expect(description).not.toContain('Platz');
	});

	it('ohne Quartil: kein Rang (Anti-Stigma)', () => {
		const { description } = buildBezirkMeta({
			...input,
			...noFacts,
			rang: 12,
			quartil: null,
			locale: 'de'
		});
		expect(description).toContain('Kiez-Score 41 von 100.');
		expect(description).not.toContain('Platz');
	});

	it('ohne DB: kein Score-Satz', () => {
		const { description } = buildBezirkMeta({ ...base, name: 'Mitte', locale: 'de' });
		expect(description).not.toContain('Score');
		expect(description).toContain('Mitte hat 292.624 Einwohner:innen');
	});

	it('fehlende Fläche: Teil entfällt', () => {
		const { description } = buildBezirkMeta({ ...input, flaecheHa: 0, locale: 'de' });
		expect(description).toBe(
			`Friedrichshain-Kreuzberg hat 292.624 Einwohner:innen (Stand Ende 2024). ${CTA_DE}`
		);
	});

	it('fehlende Einwohner: kein "0 Einwohner:innen"', () => {
		const { description } = buildBezirkMeta({ ...input, einwohner: 0, locale: 'de' });
		expect(description).not.toContain('Einwohner');
		expect(description).toContain('Fläche von 20,3 km²');
	});

	it('ohne Stichtag: kein Klammerteil', () => {
		const { description } = buildBezirkMeta({ ...input, stichtag: null, locale: 'de' });
		expect(description).toContain('auf 20,3 km².');
		expect(description).not.toContain('Stand');
	});
});

describe('buildKiezMeta', () => {
	const input = {
		...base,
		name: 'Reuterstraße',
		bezirk: 'Neukölln',
		einwohner: 8500,
		flaecheHa: 120,
		score: 41.4,
		rang: 57,
		quartil: 2,
		total: 143
	};

	it('DE: Title mit Bezirk und Score', () => {
		const { title } = buildKiezMeta({ ...input, locale: 'de' });
		expect(title).toBe('Reuterstraße (Neukölln): 8.500 Einwohner:innen');
	});

	it('DE: Description mit Fakt und Rang, Nutzen entfällt über 160 Zeichen', () => {
		const { description } = buildKiezMeta({ ...input, locale: 'de' });
		expect(description).toBe(
			'Reuterstraße hat 8.500 Einwohner:innen auf 1,2 km² (Stand Ende 2024). Kiez-Score 41 von 100, Platz 57 von 143 in Berlin.'
		);
	});

	it('Nutzen-Satz folgt, wenn er passt', () => {
		const { description } = buildKiezMeta({ ...input, name: 'Mitte', score: null, locale: 'de' });
		expect(description).toBe(
			'Mitte hat 8.500 Einwohner:innen auf 1,2 km² (Stand Ende 2024). Karte, Lärm, Miete, Grün und Wahlergebnisse je Kiez.'
		);
	});

	it('EN: Title und Description', () => {
		const { title, description } = buildKiezMeta({ ...input, locale: 'en' });
		expect(title).toBe('Reuterstraße (Neukölln): 8,500 residents, Kiez score 41');
		expect(description).toContain('Kiez score 41 of 100, rank 57 of 143 in Berlin.');
	});

	it('unteres Viertel: kein "Platz X von 143"', () => {
		const { description } = buildKiezMeta({ ...input, rang: 140, quartil: 4, locale: 'de' });
		expect(description).not.toMatch(/Platz \d+ von 143/);
		expect(description).toContain('unteres Viertel in Berlin');
	});

	it('ohne DB: Title ohne Score, Description ohne Score-Satz', () => {
		const { title, description } = buildKiezMeta({
			...input,
			score: null,
			rang: null,
			quartil: null,
			total: 0,
			locale: 'de'
		});
		expect(title).toBe('Reuterstraße (Neukölln): 8.500 Einwohner:innen');
		expect(description).not.toContain('Score');
		expect(description).toContain('Karte, Lärm');
	});

	it('ohne Bezirk: keine Klammer', () => {
		const { title } = buildKiezMeta({ ...input, bezirk: '', locale: 'de' });
		expect(title.startsWith('Reuterstraße: 8.500')).toBe(true);
		expect(title).not.toContain('(');
	});

	it('lange Namen: Title <= 80, Description <= 160', () => {
		for (const locale of ['de', 'en'] as const) {
			const { title, description } = buildKiezMeta({
				...input,
				name: 'Frankfurter Allee Nord und Umgebung',
				bezirk: 'Charlottenburg-Wilmersdorf',
				einwohner: 123456,
				locale
			});
			expect(title.length).toBeLessThanOrEqual(80);
			expect(description.length).toBeLessThanOrEqual(160);
		}
	});
});
