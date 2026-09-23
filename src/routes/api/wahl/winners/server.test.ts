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
// Gruppen-Summe und "Jahr ohne Geometrie" (btw13/agh11/bvv11 -> geo_slug null).
describe('GET /api/wahl/winners ebene=stimmbezirk (mit lokaler DB)', () => {
	beforeAll(() => {
		process.env.DATABASE_URL =
			process.env.DATABASE_URL ?? 'postgres://app:app@127.0.0.1:5432/navigator_dev';
	});
	afterAll(async () => {
		await closeDb();
	});

	it('liefert Gruppen-Rows mit Gruppen-ID als gebiet_slug (Story 17: Briefwahl-Gruppen)', async () => {
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
		// gebiet_slug ist die Briefwahl-Gruppen-ID (AGH-Format `${bez}B${bwb}`,
		// z. B. "09B7P"), nicht mehr die einzelne Urnen-uwbId.
		expect(row.gebiet_slug).toMatch(/^\d{2}B\S+$/);
		// AGH 2023 ist die Wiederholungswahl: Flag + parent_slug muessen durchkommen.
		// Pre-existing Daten-Bug (Fix in Ingest-Story 15, Matze 19.09.):
		// parent_election_id zeigt stimmtyp-uebergreifend auf die Erststimmen-Row,
		// deshalb vorerst nur Praefix-Assertion statt exaktem Stimmtyp.
		expect(row.is_repeat_election).toBe(true);
		expect(row.parent_slug).toMatch(/^2021-agh-/);
	});

	it('Sieger-Modus liefert CDU als Gewinner für Gruppe 09B7P mit 26,5% (Spec-Beispiel AGH26, inkl. Briefwahl)', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=stimmbezirk&jahr=2026');
		expect(res.status).toBe(200);
		const body = await res.json();
		if (body.winners.length === 0) return;
		// Spec-Beispiel: Gruppe 09B7P (09W726 + 09W727 + 09B7P) -> CDU 26,5%.
		const gruppe7P = body.winners.find((w: { gebiet_slug: string }) => w.gebiet_slug === '09B7P');
		expect(gruppe7P).toBeDefined();
		expect(gruppe7P.partei).toBe('CDU');
		expect(gruppe7P.anteil).toBeCloseTo(0.265, 2);
	});

	it('partei=CDU liefert denselben Anteil für Gruppe 09B7P wie der Sieger-Modus (Review-Fund: Partei-Anteil auf Gruppen-Ebene war ungeprüft)', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=stimmbezirk&jahr=2026&partei=CDU');
		expect(res.status).toBe(200);
		const body = await res.json();
		if (body.winners.length === 0) return;
		const gruppe7P = body.winners.find((w: { gebiet_slug: string }) => w.gebiet_slug === '09B7P');
		expect(gruppe7P).toBeDefined();
		expect(gruppe7P.partei).toBe('CDU');
		expect(gruppe7P.anteil).toBeCloseTo(0.265, 2);
	});

	it('Partei-Anteile für Gruppe 09B7P summieren sich über alle FINDER_PARTIES auf < 100% (Rest ist Sonstige, nicht über partei-Filter abfragbar) und > 90%', async () => {
		const parteien = ['SPD', 'CDU', 'GRÜNE', 'FDP', 'AfD', 'Die Linke', 'BSW'];
		const results = await Promise.all(
			parteien.map((p) =>
				call(`?typ=agh&stimmtyp=zweitstimme&ebene=stimmbezirk&jahr=2026&partei=${encodeURIComponent(p)}`)
			)
		);
		const bodies = await Promise.all(results.map((r) => r.json()));
		if (bodies[0].winners.length === 0) return;
		let summe = 0;
		for (const body of bodies) {
			const gruppe7P = body.winners.find((w: { gebiet_slug: string }) => w.gebiet_slug === '09B7P');
			if (gruppe7P) summe += gruppe7P.anteil;
		}
		// Reale Werte (verifiziert): CDU 26,5 + AfD 25,6 + Linke 16,1 + GRÜNE
		// 9,4 + SPD 8,2 + BSW 7,0 + FDP 2,4 = 95,2 % (Rest 4,8 % Sonstige).
		expect(summe).toBeGreaterThan(0.9);
		expect(summe).toBeLessThan(1);
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

	it('ebene=stimmbezirk mit partei=CDU liefert nur CDU-Gruppen-Anteile', async () => {
		const res = await call('?typ=agh&stimmtyp=zweitstimme&ebene=stimmbezirk&jahr=2023&partei=CDU');
		expect(res.status).toBe(200);
		const body = await res.json();
		if (body.winners.length === 0) return;
		expect(body.winners.every((w: { partei: string }) => w.partei === 'CDU')).toBe(true);
		expect(body.winners[0].gebiet_slug).toMatch(/^\d{2}B\S+$/);
	});
});
