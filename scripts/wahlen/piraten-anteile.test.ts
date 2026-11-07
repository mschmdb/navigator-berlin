import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { closeDb, getDb } from '../../src/lib/server/db/index.js';

// #179: Daten-Test gegen die eingespielte Datenbank. Prüfwerte aus den
// amtlichen Dateien (DL_BE_AB2011.xlsx, DL_BE_EE_WB_AH2016.xlsx,
// btw13_wbz.zip), Anteil = PIRATEN / gültige Zweitstimmen.

type Typ = 'agh' | 'btw';

async function piratenAnteilBezirk(jahr: number, typ: Typ, bezirkSlug: string): Promise<number> {
	const rows = await getDb().execute<{ anteil: number }>(sql`
		SELECT a.anteil
		FROM wahl_aggregat_bezirk a
		JOIN wahl w ON w.id = a.wahl_id
		JOIN partei p ON p.id = a.partei_id
		WHERE w.jahr = ${jahr} AND w.typ = ${typ} AND w.stimmtyp = 'zweitstimme'
			AND p.kurzname = 'PIRATEN' AND a.bezirk_slug = ${bezirkSlug}
	`);
	return Number(rows[0]?.anteil ?? 0);
}

async function piratenAnteilBerlin(jahr: number, typ: Typ): Promise<number> {
	const rows = await getDb().execute<{ anteil: number }>(sql`
		SELECT a.anteil
		FROM wahl_aggregat_berlin a
		JOIN wahl w ON w.id = a.wahl_id
		JOIN partei p ON p.id = a.partei_id
		WHERE w.jahr = ${jahr} AND w.typ = ${typ} AND w.stimmtyp = 'zweitstimme'
			AND p.kurzname = 'PIRATEN'
	`);
	return Number(rows[0]?.anteil ?? 0);
}

describe.skipIf(!process.env.DATABASE_URL)('#179 Piraten-Anteile in der Datenbank', () => {
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
});
