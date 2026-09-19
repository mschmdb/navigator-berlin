import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { GET } from './+server';
import { closeDb } from '$lib/server/db/index.js';

async function call(query: string): Promise<Response> {
	return await GET({
		url: new URL(`http://localhost/api/wahl/analytik${query}`)
	} as Parameters<typeof GET>[0]);
}

describe('GET /api/wahl/analytik', () => {
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
		await expect(call('?ebene=bezirk&typ=agh&stimmtyp=zweitstimme')).rejects.toMatchObject({
			status: 400
		});
		await expect(call('?ebene=kiez&typ=quatsch&stimmtyp=zweitstimme')).rejects.toMatchObject({
			status: 400
		});
	});

	it('liefert ohne Datenbank 200 mit leerer Gebiete-Liste, nie 5xx', async () => {
		const res = await call('?ebene=kiez&typ=agh&stimmtyp=zweitstimme');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.gebiete).toEqual([]);
		expect(body.license).toBeNull();
	});
});
