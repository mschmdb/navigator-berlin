import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getClimateSeries, _resetClimateCache } from './get-climate-series.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dahlem = JSON.parse(
	readFileSync(join(__dirname, './__fixtures__/mini-climate-dahlem.json'), 'utf-8')
);

beforeEach(() => _resetClimateCache());
afterEach(() => vi.restoreAllMocks());

describe('getClimateSeries', () => {
	it('laed Bundle via /climate/dahlem-00403.json', async () => {
		const fn = vi.fn(async (url: string) => {
			expect(url).toBe('/climate/dahlem-00403.json');
			return new Response(JSON.stringify(dahlem), { status: 200 });
		});
		const data = await getClimateSeries('00403', fn as unknown as typeof fetch);
		expect(data.stationId).toBe('00403');
		expect(data.summerDays).toHaveLength(2);
	});

	it('cached, kein Re-Fetch', async () => {
		const fn = vi.fn(async () => new Response(JSON.stringify(dahlem), { status: 200 }));
		await getClimateSeries('00403', fn as unknown as typeof fetch);
		await getClimateSeries('00403', fn as unknown as typeof fetch);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('wirft bei unbekannter Station-ID', async () => {
		const fn = vi.fn(async () => new Response('', { status: 404 }));
		await expect(getClimateSeries('99999', fn as unknown as typeof fetch)).rejects.toThrow(
			/Unknown station/
		);
	});

	it('wirft bei HTTP-Error', async () => {
		const fn = vi.fn(async () => new Response('', { status: 500 }));
		await expect(getClimateSeries('00403', fn as unknown as typeof fetch)).rejects.toThrow(/500/);
	});
});
