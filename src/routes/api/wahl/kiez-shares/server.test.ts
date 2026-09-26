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
		expect(body.vorlaeufig).toBe(false);
		expect(body.source_updated_at).toBeNull();
		expect(body.source_name).toBeNull();
	});
});

describe.skipIf(!process.env.DATABASE_URL)('GET /api/wahl/kiez-shares mit Datenbank', () => {
	afterAll(async () => {
		await closeDb();
	});

	it('liefert für AGH 2026 den Vorläufig-Status, Stand und Quelle der Wahl', async () => {
		const res = await call('?election=2026-agh-zweitstimme');
		const body = await res.json();
		if (body.shares.length === 0) return;
		expect(body.vorlaeufig).toBe(true);
		expect(body.source_updated_at).toMatch(/^2026-09-2\dT\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(body.source_name).toBe('Landeswahlleiterin Berlin');
	});

	it('liefert für BTW 2025 kein Vorläufig-Flag', async () => {
		const res = await call('?election=2025-btw-zweitstimme');
		const body = await res.json();
		if (body.shares.length === 0) return;
		expect(body.vorlaeufig).toBe(false);
		expect(body.source_name).toBe('Bundeswahlleiterin');
	});
});
