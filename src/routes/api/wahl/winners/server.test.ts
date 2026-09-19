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
});
