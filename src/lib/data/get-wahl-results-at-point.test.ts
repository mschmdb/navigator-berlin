import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
	getWahlResultsAtPoint,
	_resetWahlResultsCache,
	type WahlResultsAtPoint
} from './get-wahl-results-at-point.js';

const samplePayload: WahlResultsAtPoint = {
	point: { lat: 52.5219, lng: 13.4132 },
	location: { bezirkSlug: 'mitte', kiezSlug: 'alexanderplatz' },
	wahlbezirks: {
		'bt25': { uwbId: '101', bezirkCode: '01' }
	},
	wahlen: [],
	sparklines: []
};

beforeEach(() => {
	_resetWahlResultsCache();
});

describe('getWahlResultsAtPoint', () => {
	it('liefert null für non-Berlin Koordinaten', async () => {
		const fn = vi.fn();
		const result = await getWahlResultsAtPoint(52.4, 13.06, fn as unknown as typeof fetch);
		expect(result).toBeNull();
		expect(fn).not.toHaveBeenCalled();
	});

	it('liefert Payload für Berlin-Koordinaten', async () => {
		const fn = vi.fn(async () => new Response(JSON.stringify(samplePayload), { status: 200 }));
		const result = await getWahlResultsAtPoint(52.5219, 13.4132, fn as unknown as typeof fetch);
		expect(result).not.toBeNull();
		expect(result?.location.kiezSlug).toBe('alexanderplatz');
	});

	it('cached Request für gleiche Koordinaten', async () => {
		const fn = vi.fn(async () => new Response(JSON.stringify(samplePayload), { status: 200 }));
		await getWahlResultsAtPoint(52.5219, 13.4132, fn as unknown as typeof fetch);
		await getWahlResultsAtPoint(52.5219, 13.4132, fn as unknown as typeof fetch);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('cached null bei Fetch-Fehler', async () => {
		const fn = vi.fn(async () => new Response('error', { status: 500 }));
		const a = await getWahlResultsAtPoint(52.5219, 13.4132, fn as unknown as typeof fetch);
		const b = await getWahlResultsAtPoint(52.5219, 13.4132, fn as unknown as typeof fetch);
		expect(a).toBeNull();
		expect(b).toBeNull();
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('catched fetch-Exception graceful', async () => {
		const fn = vi.fn(async () => {
			throw new Error('network');
		});
		const result = await getWahlResultsAtPoint(52.5219, 13.4132, fn as unknown as typeof fetch);
		expect(result).toBeNull();
	});

	it('baut URL mit lat+lng-Query-Params', async () => {
		const fn = vi.fn(async () => new Response(JSON.stringify(samplePayload), { status: 200 }));
		await getWahlResultsAtPoint(52.5219, 13.4132, fn as unknown as typeof fetch);
		expect(fn).toHaveBeenCalledWith(expect.stringContaining('lat=52.5219'));
		expect(fn).toHaveBeenCalledWith(expect.stringContaining('lng=13.4132'));
	});
});
