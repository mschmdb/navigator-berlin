import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { closeDb, getDb } from '../../src/lib/server/db/index.js';

// #179: Daten-Test gegen die eingespielte Datenbank. Prüfwerte aus den
// amtlichen Dateien (DL_BE_AB2011.xlsx, DL_BE_EE_WB_AH2016.xlsx,
// DL_BE_AGHBVV2021.xlsx, btw13_wbz.zip, Datenexport AGH 2026),
// Anteil = Stimmen der Partei / gültige Stimmen.

type Typ = 'agh' | 'btw' | 'bvv';
type Stimmtyp = 'zweitstimme' | 'einstimme';
type Wahl = { jahr: number; typ: Typ; stimmtyp?: Stimmtyp };

async function anteil(kurzname: string, w: Wahl, bezirkSlug?: string): Promise<number> {
	const stimmtyp = w.stimmtyp ?? 'zweitstimme';
	const rows = bezirkSlug
		? await getDb().execute<{ anteil: number }>(sql`
			SELECT a.anteil
			FROM wahl_aggregat_bezirk a
			JOIN wahl wa ON wa.id = a.wahl_id
			JOIN partei p ON p.id = a.partei_id
			WHERE wa.jahr = ${w.jahr} AND wa.typ = ${w.typ} AND wa.stimmtyp = ${stimmtyp}
				AND p.kurzname = ${kurzname} AND a.bezirk_slug = ${bezirkSlug}
		`)
		: await getDb().execute<{ anteil: number }>(sql`
			SELECT a.anteil
			FROM wahl_aggregat_berlin a
			JOIN wahl wa ON wa.id = a.wahl_id
			JOIN partei p ON p.id = a.partei_id
			WHERE wa.jahr = ${w.jahr} AND wa.typ = ${w.typ} AND wa.stimmtyp = ${stimmtyp}
				AND p.kurzname = ${kurzname}
		`);
	return Number(rows[0]?.anteil ?? 0);
}

const piratenAnteilBezirk = (jahr: number, typ: Typ, bezirkSlug: string) =>
	anteil('PIRATEN', { jahr, typ }, bezirkSlug);
const piratenAnteilBerlin = (jahr: number, typ: Typ) => anteil('PIRATEN', { jahr, typ });

describe.skipIf(!process.env.DATABASE_URL)(
	'#179 Piraten- und Tierschutzpartei-Anteile in der Datenbank',
	() => {
		afterAll(async () => {
			await closeDb();
		});

		it('AGH 2011: Friedrichshain-Kreuzberg 14,7 %, Berlin 8,90 %', async () => {
			expect(await piratenAnteilBezirk(2011, 'agh', 'friedrichshain-kreuzberg')).toBeCloseTo(
				0.147,
				3
			);
			expect(await piratenAnteilBerlin(2011, 'agh')).toBeCloseTo(0.089, 3);
		});

		it('AGH 2016: Berlin 1,73 %', async () => {
			expect(await piratenAnteilBerlin(2016, 'agh')).toBeCloseTo(0.0173, 3);
		});

		it('BTW 2013: Berlin 3,58 %, Friedrichshain-Kreuzberg 6,1 %', async () => {
			expect(await piratenAnteilBerlin(2013, 'btw')).toBeCloseTo(0.0358, 3);
			expect(await piratenAnteilBezirk(2013, 'btw', 'friedrichshain-kreuzberg')).toBeCloseTo(
				0.061,
				3
			);
		});

		it('BVV 2021: Tierschutzpartei Marzahn-Hellersdorf 5,0 %, Berlin 3,08 %', async () => {
			const bvv21 = { jahr: 2021, typ: 'bvv', stimmtyp: 'einstimme' } as const;
			expect(await anteil('Tierschutzpartei', bvv21, 'marzahn-hellersdorf')).toBeCloseTo(0.0501, 3);
			expect(await anteil('Tierschutzpartei', bvv21)).toBeCloseTo(0.0308, 3);
		});

		it('AGH 2026: Tierschutzpartei unter neuem Namen, Berlin 2,12 %', async () => {
			expect(await anteil('Tierschutzpartei', { jahr: 2026, typ: 'agh' })).toBeCloseTo(0.0212, 3);
		});

		it('AGH 2011: Anteile je Bezirk summieren sich weiter auf 100 %', async () => {
			const rows = await getDb().execute<{ bezirk_slug: string; summe: number }>(sql`
			SELECT a.bezirk_slug, SUM(a.anteil)::float AS summe
			FROM wahl_aggregat_bezirk a
			JOIN wahl w ON w.id = a.wahl_id
			WHERE w.jahr = 2011 AND w.typ = 'agh' AND w.stimmtyp = 'zweitstimme'
			GROUP BY a.bezirk_slug
		`);
			expect(rows.length).toBe(12);
			for (const r of rows) expect(Number(r.summe), r.bezirk_slug).toBeCloseTo(1, 4);
		});
	}
);
