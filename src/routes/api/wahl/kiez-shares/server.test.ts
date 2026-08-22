import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { GET } from './+server';
import { closeDb } from '$lib/server/db/index.js';

async function call(query: string): Promise<Response> {
	return await GET({
		url: new URL(`http://localhost/api/wahl/kiez-shares${query}`)
	} as Parameters<typeof GET>[0]);
}

describe('GET /api/wahl/kiez-shares', () => {
	const originalUrl = process.env.DATABASE_URL;
	beforeAll(() => {
		delete process.env.DATABASE_URL;
	});
	afterAll(async () => {
		if (originalUrl !== undefined) process.env.DATABASE_URL = originalUrl;
		await closeDb();
	});

	it('validiert den election-Param', async () => {
		await expect(call('?election=quatsch')).rejects.toMatchObject({ status: 400 });
		await expect(call('')).rejects.toMatchObject({ status: 400 });
	});

	it('liefert ohne Datenbank 200 mit leerer Liste', async () => {
		const res = await call('?election=2025-btw-zweitstimme');
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.election).toBe('2025-btw-zweitstimme');
		expect(body.shares).toEqual([]);
	});
});
