import { describe, expect, it } from 'vitest';
import {
	compareLayerValues,
	getCompareProfile,
	LAYER_COMPARE_PROFILE,
	type CompareResult
} from './layer-compare.js';

describe('LAYER_COMPARE_PROFILE', () => {
	it('deckt alle 34 Manifest-Slugs aus Story 1.27 ab', () => {
		const requiredSlugs = [
			'bezirke',
			'ortsteile',
			'plz',
			'bodenrichtwerte',
			'wohnlagen-2024',
			'milieuschutz-erhaltungsmiete',
			'milieuschutz-staedtebau',
			'laerm-2023',
			'luft-2023',
			'bioklima-2023',
			'gruenversorgung-2023',
			'umweltgerechtigkeit-2023',
			'klima-pet-2022',
			'klima-kaltlufteinwirkbereich-2022',
			'klima-leitbahnkorridor-2022',
			'stolpersteine',
			'kitas-2024',
			'schulen-2024',
			'einschulbereiche-2024',
			'krankenhaeuser-plan',
			'krankenhaeuser-weitere',
			'sportanlagen-2024',
			'spielplaetze',
			'schwimmbaeder',
			'gruenanlagen',
			'trinkbrunnen',
			'ubahn-stationen',
			'sbahn-stationen',
			'tram-haltestellen',
			'bus-haltestellen',
			'radverkehrsnetz-2025',
			'fahrradstrassen-2024'
		];
		for (const slug of requiredSlugs) {
			expect(LAYER_COMPARE_PROFILE[slug], `Slug ${slug} fehlt im Profile-Mapping`).toBeDefined();
		}
	});

	it('getCompareProfile fällt auf "categorical-neutral" zurück bei unbekanntem Slug (kein Throw)', () => {
		expect(getCompareProfile('unbekannter-layer-xyz')).toBe('categorical-neutral');
	});
});

describe('compareLayerValues — numeric-lower-better (Lärm-dB, PET)', () => {
	it('A < B (Lärm-dB) → a-better mit Delta-Label "weniger"', () => {
		const r = compareLayerValues('laerm-den', 55, 70);
		expect(r.direction).toBe('a-better');
		expect(r.deltaLabel).toMatch(/15.*dB.*weniger/i);
	});

	it('A > B (Lärm-dB) → b-better', () => {
		const r = compareLayerValues('laerm-night', 70, 55);
		expect(r.direction).toBe('b-better');
	});

	it('A == B → equal (ohne Delta-Label)', () => {
		const r = compareLayerValues('laerm-den', 60, 60);
		expect(r.direction).toBe('equal');
	});

	it('Diff <0.5 → equal (Rundungs-Toleranz)', () => {
		const r = compareLayerValues('laerm-den', 60.1, 60.4);
		expect(r.direction).toBe('equal');
	});

	it('A null → not-comparable', () => {
		const r = compareLayerValues('laerm-den', null, 60);
		expect(r.direction).toBe('not-comparable');
	});

	it('laerm-2023 kategorisch (gering/mittel) → ordinal-lower-better, a-better', () => {
		const r = compareLayerValues('laerm-2023', { kategorie: 'gering' }, { kategorie: 'mittel' });
		expect(r.direction).toBe('a-better');
	});

	it('PET-Wert in Objekt-Shape { pet14h }', () => {
		const r = compareLayerValues('klima-pet-2022', { pet14h: 32 }, { pet14h: 38 });
		expect(r.direction).toBe('a-better');
		expect(r.deltaLabel).toMatch(/6.*°C.*weniger/);
	});

	it('PET 38 vs 32 → b-better', () => {
		const r = compareLayerValues('klima-pet-2022', { pet14h: 38 }, { pet14h: 32 });
		expect(r.direction).toBe('b-better');
	});
});

describe('compareLayerValues — numeric-no-judgment (Bodenrichtwerte)', () => {
	it('A=8000 €/m², B=5500 €/m² → not-comparable mit Delta-Label', () => {
		const r = compareLayerValues(
			'bodenrichtwerte',
			{ richtwert: 8000, nutzung: 'W' },
			{ richtwert: 5500, nutzung: 'W' }
		);
		expect(r.direction).toBe('not-comparable');
		expect(r.deltaLabel).toMatch(/2.500.*€\/m²/);
		expect(r.advisory).toMatch(/teurere Miete|Bewertung/i);
	});

	it('gleiche Werte → equal', () => {
		const r = compareLayerValues(
			'bodenrichtwerte',
			{ richtwert: 5500 },
			{ richtwert: 5500 }
		);
		expect(r.direction).toBe('equal');
	});

	it('Bodenrichtwert mit anderem Key-Name `eur_qm` funktioniert auch', () => {
		const r = compareLayerValues(
			'bodenrichtwerte',
			{ eur_qm: 8000 },
			{ eur_qm: 5500 }
		);
		expect(r.direction).toBe('not-comparable');
		expect(r.deltaLabel).toMatch(/2.500/);
	});
});

describe('compareLayerValues — Wohnlage/Mietspiegel categorical-neutral (Editorial-Würde)', () => {
	it('Wohnlage A=gut, B=mittel → not-comparable (keine Hierarchie-Wertung)', () => {
		const r = compareLayerValues('wohnlagen-2024', { wol_mode: 'gut' }, { wol_mode: 'mittel' });
		expect(r.direction).toBe('not-comparable');
	});

	it('Wohnlage gleich → equal', () => {
		const r = compareLayerValues('wohnlagen-2024', { wol_mode: 'gut' }, { wol_mode: 'gut' });
		expect(r.direction).toBe('equal');
	});

	it('Mietspiegel-Wohnlage A=mittel, B=mittel → equal (kein Pfeil-Trigger)', () => {
		const r = compareLayerValues(
			'mietspiegel-wohnlage',
			{ wol_mode: 'mittel' },
			{ wol_mode: 'mittel' }
		);
		expect(r.direction).toBe('equal');
	});

	it('Mietspiegel-Wohnlage A=mittel, B=einfach → not-comparable', () => {
		const r = compareLayerValues(
			'mietspiegel-wohnlage',
			{ wol_mode: 'mittel' },
			{ wol_mode: 'einfach' }
		);
		expect(r.direction).toBe('not-comparable');
	});
});

describe('compareLayerValues — ordinal-higher-better (Grün)', () => {
	it('Grünversorgung A=sehr hoch, B=gering → a-better (höher besser)', () => {
		const r = compareLayerValues(
			'gruenversorgung-2023',
			{ kategorie: 'sehr hoch' },
			{ kategorie: 'gering' }
		);
		expect(r.direction).toBe('a-better');
	});

	it('Grünversorgung mit Roh-Daten gut/schlecht (vor Story 1.22 Mapping) wird harmonisiert', () => {
		const r = compareLayerValues(
			'gruenversorgung-2023',
			{ kategorie: 'sehr gut' },
			{ kategorie: 'schlecht' }
		);
		expect(r.direction).toBe('a-better');
	});
});

describe('compareLayerValues — ordinal-lower-better (Luft, Bioklima, Umweltgerechtigkeit)', () => {
	it('Luft A=gering, B=hoch → a-better', () => {
		const r = compareLayerValues('luft-2023', { kategorie: 'gering' }, { kategorie: 'hoch' });
		expect(r.direction).toBe('a-better');
	});

	it('Bioklima A=hoch, B=gering → b-better', () => {
		const r = compareLayerValues('bioklima-2023', { kategorie: 'hoch' }, { kategorie: 'gering' });
		expect(r.direction).toBe('b-better');
	});

	it('Umweltgerechtigkeit A=keine, B=dreifach → a-better', () => {
		const r = compareLayerValues(
			'umweltgerechtigkeit-2023',
			{ kategorie: 'keine' },
			{ kategorie: 'dreifach' }
		);
		expect(r.direction).toBe('a-better');
	});

	it('Umweltgerechtigkeit gleich → equal', () => {
		const r = compareLayerValues(
			'umweltgerechtigkeit-2023',
			{ kategorie: 'einfach' },
			{ kategorie: 'einfach' }
		);
		expect(r.direction).toBe('equal');
	});
});

describe('compareLayerValues — categorical-neutral (Bezirke, Milieuschutz)', () => {
	it('Bezirke gleicher Name → equal', () => {
		const r = compareLayerValues('bezirke', 'Mitte', 'Mitte');
		expect(r.direction).toBe('equal');
	});

	it('Bezirke unterschiedlich → not-comparable (keine Bewertung)', () => {
		const r = compareLayerValues('bezirke', 'Mitte', 'Pankow');
		expect(r.direction).toBe('not-comparable');
	});

	it('Milieuschutz A vorhanden, B null → not-comparable mit Advisory (Schutz ambivalent)', () => {
		const r = compareLayerValues(
			'milieuschutz-erhaltungsmiete',
			{ name: 'Karl-Marx-Allee' },
			null
		);
		expect(r.direction).toBe('not-comparable');
		expect(r.advisory).toMatch(/Schutz|ambivalent/i);
	});
});

describe('compareLayerValues — presence-neutral-positive (Kaltluft, Leitbahn, Radverkehr, Grünanlage)', () => {
	it('Kaltluft A vorhanden, B null → a-better (mit Versorgung besser)', () => {
		const r = compareLayerValues('klima-kaltlufteinwirkbereich-2022', { id: 1 }, null);
		expect(r.direction).toBe('a-better');
	});

	it('Leitbahn A null, B vorhanden → b-better', () => {
		const r = compareLayerValues('klima-leitbahnkorridor-2022', null, { id: 1 });
		expect(r.direction).toBe('b-better');
	});

	it('beide vorhanden → equal', () => {
		const r = compareLayerValues('radverkehrsnetz-2025', { id: 1 }, { id: 2 });
		expect(r.direction).toBe('equal');
	});

	it('beide null → equal', () => {
		const r = compareLayerValues('fahrradstrassen-2024', null, null);
		expect(r.direction).toBe('equal');
	});

	it('Trinkbrunnen presence-Profile', () => {
		const r = compareLayerValues('trinkbrunnen', { name: 'Brunnen 1' }, null);
		expect(r.direction).toBe('a-better');
	});
});

describe('compareLayerValues — distance-lower-better (POI distances, ÖPNV)', () => {
	it('Kita A 200m, B 800m → a-better', () => {
		const r = compareLayerValues('kitas-2024', { distanceM: 200 }, { distanceM: 800 });
		expect(r.direction).toBe('a-better');
		expect(r.deltaLabel).toMatch(/600.*m.*näher|600.*m.*weniger/i);
	});

	it('U-Bahn A 150m, B 600m → a-better', () => {
		const r = compareLayerValues('ubahn-stationen', { distanceM: 150 }, { distanceM: 600 });
		expect(r.direction).toBe('a-better');
	});

	it('Schule A=B → equal', () => {
		const r = compareLayerValues('schulen-2024', { distanceM: 300 }, { distanceM: 300 });
		expect(r.direction).toBe('equal');
	});

	it('Krankenhaus A null, B 500m → not-comparable (Distanz erforderlich für Vergleich)', () => {
		const r = compareLayerValues('krankenhaeuser-plan', null, { distanceM: 500 });
		expect(r.direction).toBe('not-comparable');
	});
});

describe('compareLayerValues — count-no-judgment (Stolpersteine)', () => {
	it('A=3, B=8 → not-comparable mit Count-Delta + Würde-Advisory', () => {
		const r = compareLayerValues('stolpersteine', 3, 8);
		expect(r.direction).toBe('not-comparable');
		expect(r.deltaLabel).toMatch(/3.*vs.*8/);
		expect(r.advisory).toMatch(/Erinnerungs|kein Wohn-Score|Würde/i);
	});

	it('Stolperstein-Objekt-Shape { count }', () => {
		const r = compareLayerValues('stolpersteine', { count: 5 }, { count: 2 });
		expect(r.direction).toBe('not-comparable');
		expect(r.deltaLabel).toMatch(/5.*vs.*2/);
	});

	it('beide null → not-comparable', () => {
		const r = compareLayerValues('stolpersteine', null, null);
		expect(r.direction).toBe('not-comparable');
		expect(r.advisory).toMatch(/Erinnerungs|kein Wohn-Score/i);
	});

	it('NIE direction "a-better" oder "b-better" (Würde-Garantie)', () => {
		const cases: Array<[unknown, unknown]> = [
			[0, 100],
			[100, 0],
			[1, 1]
		];
		for (const [a, b] of cases) {
			const r = compareLayerValues('stolpersteine', a, b);
			expect(r.direction).not.toBe('a-better');
			expect(r.direction).not.toBe('b-better');
		}
	});
});

describe('compareLayerValues — Edge-Cases + unbekannte Slugs', () => {
	it('unbekannter Slug → not-comparable (fallthrough categorical-neutral mit different values)', () => {
		const r = compareLayerValues('layer-existiert-nicht', 'A', 'B');
		expect(r.direction).toBe('not-comparable');
	});

	it('beide gleich (unbekannter Slug) → equal', () => {
		const r = compareLayerValues('layer-existiert-nicht', 'X', 'X');
		expect(r.direction).toBe('equal');
	});

	it('Result-Objekt hat KEINE direction-Mutation (Returnwerte sind eigene Objekte)', () => {
		const r1 = compareLayerValues('laerm-2023', 55, 70);
		const r2 = compareLayerValues('laerm-2023', 70, 55);
		expect(r1).not.toBe(r2);
		const sameAB = compareLayerValues('laerm-2023', 55, 70);
		expect(sameAB).not.toBe(r1);
	});

	it('CompareResult-Type ist serialisierbar (kein function/symbol)', () => {
		const r: CompareResult = compareLayerValues('laerm-2023', 55, 70);
		expect(() => JSON.parse(JSON.stringify(r))).not.toThrow();
	});
});
