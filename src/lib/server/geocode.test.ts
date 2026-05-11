import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { proxyNominatim, _resetGeocodeCache } from './geocode.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandenburger = JSON.parse(
	readFileSync(join(__dirname, './__fixtures__/nominatim-brandenburger.json'), 'utf-8')
);

const fetchMock = (response: unknown) =>
	vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
		new Response(JSON.stringify(response), { status: 200 })
	);

beforeEach(() => {
	_resetGeocodeCache();
});
afterEach(() => {
	vi.restoreAllMocks();
});

describe('proxyNominatim', () => {
	it('mappt NominatimResult zu GeocodeSuggestion', async () => {
		const fn = fetchMock(brandenburger);
		const out = await proxyNominatim('Brandenburger', 'de', fn as unknown as typeof fetch);
		expect(out.length).toBeGreaterThan(0);
		const tor = out.find((s) => s.displayName.includes('Brandenburger Tor'));
		expect(tor).toBeDefined();
		expect(tor?.lat).toBeCloseTo(52.5162746);
		expect(tor?.lng).toBeCloseTo(13.3777041);
		expect(tor?.bezirk).toBe('Mitte');
		expect(tor?.postcode).toBe('10117');
		expect(tor?.bbox).toEqual([13.377, 52.5158, 13.3784, 52.5167]);
	});

	it('addresstype Whitelist priorisiert: road vor tourism', async () => {
		const fn = fetchMock(brandenburger);
		const out = await proxyNominatim('Brandenburger', 'de', fn as unknown as typeof fetch);
		const road = out.findIndex((s) => s.addresstype === 'road');
		const tourism = out.findIndex((s) => s.addresstype === 'tourism');
		expect(road).toBeGreaterThanOrEqual(0);
		expect(tourism).toBeGreaterThanOrEqual(0);
		expect(road).toBeLessThan(tourism);
	});

	it('filtert Suggestions ausserhalb Berlin-Bbox raus (Muenchen)', async () => {
		const fn = fetchMock(brandenburger);
		const out = await proxyNominatim('Brandenburger', 'de', fn as unknown as typeof fetch);
		expect(out.find((s) => s.displayName.includes('Muenchen'))).toBeUndefined();
	});

	it('cached, kein Re-Fetch beim 2. Aufruf', async () => {
		const fn = fetchMock(brandenburger);
		await proxyNominatim('Brandenburger', 'de', fn as unknown as typeof fetch);
		await proxyNominatim('Brandenburger', 'de', fn as unknown as typeof fetch);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('Cache-Key beruecksichtigt lang (de vs en separater Cache)', async () => {
		const fn = fetchMock(brandenburger);
		await proxyNominatim('Brandenburger', 'de', fn as unknown as typeof fetch);
		await proxyNominatim('Brandenburger', 'en', fn as unknown as typeof fetch);
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('Request-URL enthaelt Berlin-Bbox + bounded=1', async () => {
		const fn = fetchMock(brandenburger);
		await proxyNominatim('Brandenburger', 'de', fn as unknown as typeof fetch);
		const call = fn.mock.calls[0]?.[0] as string;
		expect(call).toContain('viewbox=13.0883%2C52.6755%2C13.7611%2C52.3382');
		expect(call).toContain('bounded=1');
		expect(call).toContain('q=Brandenburger');
	});

	it('Request hat User-Agent header', async () => {
		const fn = fetchMock(brandenburger);
		await proxyNominatim('Brandenburger', 'de', fn as unknown as typeof fetch);
		const init = fn.mock.calls[0]?.[1] as RequestInit;
		const headers = init.headers as Record<string, string>;
		expect(headers['User-Agent']).toContain('navigator.berlin');
	});

	it('Max 10 Suggestions zurueck', async () => {
		const many = Array.from({ length: 20 }, (_, i) => ({
			...brandenburger[0],
			place_id: i,
			osm_id: i,
			display_name: `Result ${i}, Mitte, Berlin`,
			lat: '52.52',
			lon: '13.40'
		}));
		const fn = fetchMock(many);
		const out = await proxyNominatim('test', 'de', fn as unknown as typeof fetch);
		expect(out.length).toBeLessThanOrEqual(10);
	});

	it('wirft bei HTTP-Error', async () => {
		const fn = vi.fn(async () => new Response('Server error', { status: 503 }));
		await expect(
			proxyNominatim('test', 'de', fn as unknown as typeof fetch)
		).rejects.toThrow(/503/);
	});
});
