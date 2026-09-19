import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { GET } from './+server';
import { closeDb } from '$lib/server/db/index.js';

async function call(query: string): Promise<Response> {
	return await GET({
		url: new URL(`http://localhost/api/wahl/similar-kieze${query}`)
	} as Parameters<typeof GET>[0]);
}

describe('GET /api/wahl/similar-kieze', () => {
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
		await expect(call('?kiez=mitte-zentrum&typ=quatsch')).rejects.toMatchObject({ status: 400 });
		await expect(call('?typ=btw')).rejects.toMatchObject({ status: 400 });
	});

	it('liefert ohne Datenbank 200 mit leerer Liste + Hinweis', async () => {
		const res = await call('?kiez=mitte-zentrum&typ=btw');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.results).toEqual([]);
		expect(body.hint).toBe('no_data_for_kiez');
		expect(body.license).toBeNull();
	});
});
