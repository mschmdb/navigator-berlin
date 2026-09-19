import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { GET } from './+server';
import { closeDb } from '$lib/server/db/index.js';

async function call(query: string): Promise<Response> {
	return await GET({
		url: new URL(`http://localhost/api/wahl/series${query}`)
	} as Parameters<typeof GET>[0]);
}

describe('GET /api/wahl/series', () => {
	const originalUrl = process.env.DATABASE_URL;
	beforeAll(() => {
		delete process.env.DATABASE_URL;
	});
	afterAll(async () => {
		if (originalUrl !== undefined) process.env.DATABASE_URL = originalUrl;
		await closeDb();
	});

	it('validiert die Query-Parameter', async () => {
		await expect(call('')).rejects.toMatchObject({ status: 400 });
		await expect(
			call('?typ=quatsch&stimmtyp=zweitstimme&ebene=kiez&gebiet=x')
		).rejects.toMatchObject({ status: 400 });
		await expect(call('?typ=agh&stimmtyp=zweitstimme&ebene=stadt&gebiet=x')).rejects.toMatchObject({
			status: 400
		});
		await expect(call('?typ=agh&stimmtyp=zweitstimme&ebene=kiez')).rejects.toMatchObject({
			status: 400
		});
	});

	it('liefert ohne Datenbank 200 mit leeren Punkten', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=kiez&gebiet=mitte-zentrum');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.points).toEqual([]);
		expect(body.coverage_ab).toBeNull();
		expect(body.license).toBeNull();
	});

	it('ebene=berlin: liefert ohne Datenbank 200 mit leeren Punkten, gebiet optional', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=berlin');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.points).toEqual([]);
		expect(body.gebiet).toBe('berlin');
	});
});

// Defensiv gegen lokales Postgres (Muster wahl-queries.test.ts): grünt auch
// ohne Daten, prüft mit Daten die Matrix-Fälle „Zeitreihe", „coverage_ab"
// und „unbekanntes Gebiet → 404 nur wenn die Reihe Daten hat".
describe('GET /api/wahl/series (mit lokaler DB)', () => {
	beforeAll(() => {
		process.env.DATABASE_URL =
			process.env.DATABASE_URL ?? 'postgres://app:app@127.0.0.1:5432/navigator_dev';
	});
	afterAll(async () => {
		await closeDb();
	});

	it('liefert Punkte mit Flags, coverage_ab und 404 für unbekanntes Gebiet', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=kiez&gebiet=adlershof');
		expect(res.status).toBe(200);
		const body = await res.json();
		if (body.points.length === 0) return;
		expect(typeof body.coverage_ab).toBe('number');
		expect(body.coverage_ab).toBeGreaterThanOrEqual(2016);
		const point = body.points[0];
		expect(point).toMatchObject({
			jahr: expect.any(Number),
			partei: expect.any(String),
			anteil: expect.any(Number)
		});
		expect(body.points.some((p: { is_repeat_election: boolean }) => p.is_repeat_election)).toBe(
			true
		);
		await expect(
			call('?typ=agh&stimmtyp=zweitstimme&ebene=kiez&gebiet=gibt-es-nicht')
		).rejects.toMatchObject({ status: 404 });
	});

	it('ebene=berlin: liefert die Zeitreihe für Berlin gesamt, AGH 2023 CDU ≈ 0.282, kein 404', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=berlin');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.gebiet).toBe('berlin');
		if (body.points.length === 0) return;
		const cdu2023 = body.points.find(
			(p: { jahr: number; partei: string }) => p.jahr === 2023 && p.partei === 'CDU'
		);
		if (cdu2023) expect(cdu2023.anteil).toBeCloseTo(0.282, 2);
	});
});
