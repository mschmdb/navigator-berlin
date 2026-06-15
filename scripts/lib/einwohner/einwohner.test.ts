import { describe, expect, it } from 'vitest';
import {
	aggregateEinwohner,
	bucketAltersjahre,
	computeDichte,
	computeQuotienten,
	joinEinwohnerToLor,
	type EinwohnerRow
} from './einwohner.js';

function row(lorId: string, gesamt: number, ages: Record<string, number>): EinwohnerRow {
	return { lorId, gesamt, ages };
}

describe('bucketAltersjahre', () => {
	it('summiert Kinder 0-6 aus E_EU1 + E_E1U6', () => {
		const b = bucketAltersjahre({ E_EU1: 37, E_E1U6: 128 });
		expect(b.kinder0bis6).toBe(165);
	});

	it('summiert Kinder 6-12 aus den Einzeljahr-Spalten', () => {
		const b = bucketAltersjahre({ E_E06_07: 18, E_E07_08: 22, E_E08_10: 55, E_E10_12: 52 });
		expect(b.kinder6bis12).toBe(147);
	});

	it('summiert Senioren 65+ aus E_E65U80 + E_E80U110', () => {
		const b = bucketAltersjahre({ E_E65U80: 455, E_E80U110: 262 });
		expect(b.senioren65plus).toBe(717);
	});

	it('fehlende Spalten zählen als 0, kein Crash', () => {
		const b = bucketAltersjahre({});
		expect(b).toEqual({ kinder0bis6: 0, kinder6bis12: 0, senioren65plus: 0 });
	});
});

describe('computeDichte', () => {
	it('rechnet Einwohner pro km² aus m²-Fläche', () => {
		// 3580 EW auf 0.5 km² (500.000 m²) = 7160 EW/km²
		expect(computeDichte(3580, 500_000)).toBeCloseTo(7160, 5);
	});

	it('GROESSE_M2 = 0 liefert null', () => {
		expect(computeDichte(3580, 0)).toBeNull();
	});

	it('fehlende Fläche (null) liefert null', () => {
		expect(computeDichte(3580, null)).toBeNull();
	});

	it('negative oder NaN Einwohner liefern null', () => {
		expect(computeDichte(-5, 500_000)).toBeNull();
		expect(computeDichte(Number.NaN, 500_000)).toBeNull();
	});
});

describe('computeQuotienten', () => {
	// u18 = 10+40+50+20 = 120, erw = 100+300+80 = 480, alt = 60+40 = 100, gesamt 700
	const ages = {
		E_EU1: 10,
		E_E1U6: 40,
		E_E6U15: 50,
		E_E15U18: 20,
		E_E18U25: 100,
		E_E25U55: 300,
		E_E55U65: 80,
		E_E65U80: 60,
		E_E80U110: 40
	};

	it('rechnet Jugend- + Altenquotient je 100 Erwerbsfähige', () => {
		const q = computeQuotienten(ages, 700);
		expect(q.jugendquotient).toBeCloseTo(25, 1); // 120/480*100
		expect(q.altenquotient).toBeCloseTo(20.8, 1); // 100/480*100
	});

	it('rechnet Erwerbsanteil in Prozent der Gesamtbevölkerung', () => {
		const q = computeQuotienten(ages, 700);
		expect(q.erwerbsanteil).toBeCloseTo(68.6, 1); // 480/700*100
	});

	it('keine Erwerbsbevölkerung liefert null statt Division durch 0', () => {
		const q = computeQuotienten({ E_EU1: 5 }, 5);
		expect(q.jugendquotient).toBeNull();
		expect(q.altenquotient).toBeNull();
	});

	it('gesamt 0 liefert erwerbsanteil null', () => {
		const q = computeQuotienten({}, 0);
		expect(q.erwerbsanteil).toBeNull();
	});
});

describe('joinEinwohnerToLor', () => {
	const rows = [
		row('01100101', 3580, { E_EU1: 37, E_E1U6: 128, E_E65U80: 455, E_E80U110: 262 }),
		row('01100102', 2000, { E_EU1: 10, E_E1U6: 40 })
	];

	it('erzeugt pro CSV-Zeile einen LorEinwohnerRecord mit Buckets + Dichte', () => {
		const out = joinEinwohnerToLor(rows, [
			{ plrId: '01100101', areaM2: 500_000 },
			{ plrId: '01100102', areaM2: 1_000_000 }
		]);
		expect(out).toHaveLength(2);
		const a = out.find((r) => r.plrId === '01100101')!;
		expect(a.gesamt).toBe(3580);
		expect(a.kinder0bis6).toBe(165);
		expect(a.senioren65plus).toBe(717);
		expect(a.dichtePro_km2).toBeCloseTo(7160, 5);
	});

	it('LOR ohne Flächen-Match bekommt dichtePro_km2 null, kein Crash', () => {
		const out = joinEinwohnerToLor(rows, [{ plrId: '01100101', areaM2: null }]);
		const a = out.find((r) => r.plrId === '01100101')!;
		expect(a.dichtePro_km2).toBeNull();
		expect(a.gesamt).toBe(3580);
	});

	it('ist deterministisch nach plrId sortiert', () => {
		const out = joinEinwohnerToLor(
			[rows[1], rows[0]],
			[
				{ plrId: '01100101', areaM2: 500_000 },
				{ plrId: '01100102', areaM2: 1_000_000 }
			]
		);
		expect(out.map((r) => r.plrId)).toEqual(['01100101', '01100102']);
	});
});

describe('aggregateEinwohner', () => {
	// Zwei PLR in derselben Gruppe (Prefix 0110):
	// A 3580 EW auf 0.5 km² (Dichte 7160), B 2000 EW auf 1.0 km² (Dichte 2000).
	const rows = [
		row('01100101', 3580, { E_EU1: 37, E_E1U6: 128, E_E65U80: 455, E_E80U110: 262 }),
		row('01100201', 2000, { E_EU1: 10, E_E1U6: 40 })
	];
	const areaByPlr = new Map<string, number | null>([
		['01100101', 500_000],
		['01100201', 1_000_000]
	]);

	it('dichte ist flächengewichtet (Σgesamt/Σfläche), nicht der Mittelwert der PLR-Dichten', () => {
		const out = aggregateEinwohner(rows, areaByPlr, (id) => id.slice(0, 4));
		const g = out.get('0110')!;
		// 5580 EW / 1.5 km² = 3720, NICHT (7160+2000)/2 = 4580
		expect(g.dichtePro_km2).toBeCloseTo(3720, 5);
		expect(g.gesamt).toBe(5580);
	});

	it('summiert Altersbänder über die Gruppe + leitet Quotienten daraus ab', () => {
		const out = aggregateEinwohner(rows, areaByPlr, (id) => id.slice(0, 4));
		const g = out.get('0110')!;
		expect(g.kinder0bis6).toBe(215); // 37+128+10+40
		expect(g.senioren65plus).toBe(717); // 455+262
	});

	it('teilt nach groupKey in mehrere Gruppen', () => {
		const out = aggregateEinwohner(rows, areaByPlr, (id) => id.slice(0, 6));
		expect([...out.keys()].sort()).toEqual(['011001', '011002']);
	});

	it('groupKey null schließt die Zeile aus', () => {
		const out = aggregateEinwohner(rows, areaByPlr, (id) => (id === '01100101' ? null : '011002'));
		expect(out.has('011002')).toBe(true);
		expect(out.get('011002')!.gesamt).toBe(2000);
	});

	it('Gruppe ohne bekannte Fläche liefert dichtePro_km2 null, kein Crash', () => {
		const out = aggregateEinwohner(rows, new Map(), (id) => id.slice(0, 4));
		expect(out.get('0110')!.dichtePro_km2).toBeNull();
		expect(out.get('0110')!.gesamt).toBe(5580);
	});
});
