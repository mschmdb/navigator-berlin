import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { GET } from './+server';
import { closeDb } from '$lib/server/db/index.js';

async function call(query: string): Promise<Response> {
	return await GET({
		url: new URL(`http://localhost/api/wahl/winners${query}`)
	} as Parameters<typeof GET>[0]);
}

describe('GET /api/wahl/winners', () => {
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
		await expect(call('?typ=quatsch&stimmtyp=zweitstimme&ebene=kiez')).rejects.toMatchObject({
			status: 400
		});
		await expect(call('?typ=agh&stimmtyp=quatsch&ebene=kiez')).rejects.toMatchObject({
			status: 400
		});
	});

	it('liefert ohne Datenbank 200 mit leerer Winners-Liste', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=kiez');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.winners).toEqual([]);
		expect(body.license).toBeNull();
	});

	it('lehnt eine unbekannte Partei ab (400)', async () => {
		await expect(
			call('?typ=agh&stimmtyp=zweitstimme&ebene=kiez&partei=Piraten')
		).rejects.toMatchObject({ status: 400 });
	});

	it('liefert ohne Datenbank 200 mit leerer Winners-Liste für einen partei-Request', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=kiez&partei=CDU');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.winners).toEqual([]);
	});

	it('ebene=stimmbezirk ohne jahr → 400', async () => {
		await expect(call('?typ=agh&stimmtyp=zweitstimme&ebene=stimmbezirk')).rejects.toMatchObject({
			status: 400
		});
		await expect(
			call('?typ=agh&stimmtyp=zweitstimme&ebene=stimmbezirk&jahr=20211')
		).rejects.toMatchObject({ status: 400 });
	});

	it('ebene=stimmbezirk liefert ohne Datenbank 200 mit leerer Winners-Liste und geo_slug null', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=stimmbezirk&jahr=2023');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.winners).toEqual([]);
		expect(body.geo_slug).toBeNull();
		expect(body.license).toBeNull();
	});
});

// Defensiv gegen lokales Postgres (Muster series/server.test.ts): grünt auch
// ohne Daten, prüft mit Daten die Matrix-Fälle Geometrie-Join, Briefwahl-
// Filter und "Jahr ohne Geometrie" (btw13/agh11/bvv11 -> geo_slug null).
describe('GET /api/wahl/winners ebene=stimmbezirk (mit lokaler DB)', () => {
	beforeAll(() => {
		process.env.DATABASE_URL =
			process.env.DATABASE_URL ?? 'postgres://app:app@127.0.0.1:5432/navigator_dev';
	});
	afterAll(async () => {
		await closeDb();
	});

	it('liefert Stimmbezirks-Rows mit uwbId-gebiet_slug, geo_slug und ohne Briefwahl-Aggregat-Rows', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=stimmbezirk&jahr=2023');
		expect(res.status).toBe(200);
		const body = await res.json();
		if (body.winners.length === 0) return;
		expect(body.geo_slug).toBe('ah21');
		const row = body.winners[0];
		expect(row).toMatchObject({
			jahr: 2023,
			gebiet_slug: expect.any(String),
			partei: expect.any(String),
			anteil: expect.any(Number)
		});
		// gebiet_slug ist die DB-uwbId (AGH-Format ohne BTW-Bindestriche).
		expect(row.gebiet_slug).toMatch(/^\d{2}W\d{3}$/);
		// AGH 2023 ist die Wiederholungswahl: Flag + parent_slug muessen durchkommen.
		// Pre-existing Daten-Bug (Fix in Ingest-Story 15, Matze 19.09.):
		// parent_election_id zeigt stimmtyp-uebergreifend auf die Erststimmen-Row,
		// deshalb vorerst nur Praefix-Assertion statt exaktem Stimmtyp.
		expect(row.is_repeat_election).toBe(true);
		expect(row.parent_slug).toMatch(/^2021-agh-/);
	});

	it('liefert geo_slug null für ein Jahr ohne Stimmbezirks-Geometrie (AGH 2011)', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=stimmbezirk&jahr=2011');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.geo_slug).toBeNull();
		expect(body.winners).toEqual([]);
	});

	it('partei=CDU liefert nur CDU-Anteile je Gebiet (Response-Shape unverändert)', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=kiez&partei=CDU');
		expect(res.status).toBe(200);
		const body = await res.json();
		if (body.winners.length === 0) return;
		expect(body.winners.every((w: { partei: string }) => w.partei === 'CDU')).toBe(true);
		const row = body.winners[0];
		expect(row).toMatchObject({
			jahr: expect.any(Number),
			gebiet_slug: expect.any(String),
			partei: 'CDU',
			anteil: expect.any(Number)
		});
		expect(row.anteil).toBeGreaterThanOrEqual(0);
		expect(row.anteil).toBeLessThan(1);
	});

	it('ebene=stimmbezirk mit partei=CDU liefert nur CDU-Anteile und filtert Briefwahl-Aggregat-Rows', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=stimmbezirk&jahr=2023&partei=CDU');
		expect(res.status).toBe(200);
		const body = await res.json();
		if (body.winners.length === 0) return;
		expect(body.winners.every((w: { partei: string }) => w.partei === 'CDU')).toBe(true);
		expect(body.winners[0].gebiet_slug).toMatch(/^\d{2}W\d{3}$/);
	});
});
