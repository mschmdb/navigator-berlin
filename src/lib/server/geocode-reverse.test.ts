import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { reverseGeocode, _resetGeocodeCache } from './geocode.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pariser = JSON.parse(
	readFileSync(join(__dirname, './__fixtures__/nominatim-reverse-pariser.json'), 'utf-8')
);

/* eslint-disable @typescript-eslint/no-unused-vars */
const fetchMock = (response: unknown, status = 200) =>
	vi.fn(
		async (_url: string | URL | Request, _init?: RequestInit) =>
			new Response(JSON.stringify(response), { status })
	);
/* eslint-enable @typescript-eslint/no-unused-vars */

beforeEach(() => _resetGeocodeCache());
afterEach(() => vi.restoreAllMocks());

describe('reverseGeocode', () => {
	it('mappt reverse-result zu GeocodeSuggestion', async () => {
		const fn = fetchMock(pariser);
		const out = await reverseGeocode(52.5163, 13.3777, 'de', fn as unknown as typeof fetch);
		expect(out).not.toBeNull();
		expect(out!.lat).toBeCloseTo(52.5163, 4);
		expect(out!.lng).toBeCloseTo(13.3777, 4);
		expect(out!.displayName).toContain('Pariser Platz');
		expect(out!.bezirk).toBe('Mitte');
		expect(out!.postcode).toBe('10117');
	});

	it('Request-URL nutzt reverse-Endpoint mit lat/lon/format/zoom', async () => {
		const fn = fetchMock(pariser);
		await reverseGeocode(52.5163, 13.3777, 'de', fn as unknown as typeof fetch);
		const call = fn.mock.calls[0]?.[0] as string;
		expect(call).toContain('/reverse');
		expect(call).toContain('lat=52.5163');
		expect(call).toContain('lon=13.3777');
		expect(call).toContain('format=jsonv2');
		expect(call).toContain('zoom=18');
	});

	it('Request hat User-Agent header', async () => {
		const fn = fetchMock(pariser);
		await reverseGeocode(52.5163, 13.3777, 'de', fn as unknown as typeof fetch);
		const init = fn.mock.calls[0]?.[1] as RequestInit;
		const headers = init.headers as Record<string, string>;
		expect(headers['User-Agent']).toContain('navigator.berlin');
	});

	it('outside Berlin → null', async () => {
		const out_of_berlin = { ...pariser, lat: '48.13', lon: '11.57' };
		const fn = fetchMock(out_of_berlin);
		const out = await reverseGeocode(48.13, 11.57, 'de', fn as unknown as typeof fetch);
		expect(out).toBeNull();
	});

	it('cached pro lat/lng/lang', async () => {
		const fn = fetchMock(pariser);
		await reverseGeocode(52.5163, 13.3777, 'de', fn as unknown as typeof fetch);
		await reverseGeocode(52.5163, 13.3777, 'de', fn as unknown as typeof fetch);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('Cache-Key differs by lang', async () => {
		const fn = fetchMock(pariser);
		await reverseGeocode(52.5163, 13.3777, 'de', fn as unknown as typeof fetch);
		await reverseGeocode(52.5163, 13.3777, 'en', fn as unknown as typeof fetch);
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('Cache-Key roundet lat/lng auf 5 Stellen (gleiches Tile)', async () => {
		const fn = fetchMock(pariser);
		await reverseGeocode(52.5163001, 13.3777001, 'de', fn as unknown as typeof fetch);
		await reverseGeocode(52.5163004, 13.3777002, 'de', fn as unknown as typeof fetch);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('HTTP-Error → wirft', async () => {
		const fn = vi.fn(async () => new Response('err', { status: 503 }));
		await expect(
			reverseGeocode(52.5163, 13.3777, 'de', fn as unknown as typeof fetch)
		).rejects.toThrow(/503/);
	});
});
