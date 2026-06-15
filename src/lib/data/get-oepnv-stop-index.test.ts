import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getOepnvStopIndex, _resetOepnvStopIndexCache } from './get-oepnv-stop-index.js';
import type { OepnvStopIndex } from './get-oepnv-stop-index.js';

const SAMPLE: OepnvStopIndex = {
	ubahn: [{ name: 'Alex', lat: 52.52, lng: 13.41 }],
	sbahn: [{ name: 'Hbf', lat: 52.52, lng: 13.37 }],
	tram: [],
	bus: []
};

function fakeFetch(body: OepnvStopIndex, ok = true, status = 200) {
	return vi.fn().mockResolvedValue({
		ok,
		status,
		json: () => Promise.resolve(body)
	} as Response);
}

describe('getOepnvStopIndex', () => {
	beforeEach(() => {
		_resetOepnvStopIndexCache();
	});

	it('fetches /oepnv-stops-index.json on first call', async () => {
		const fetchFn = fakeFetch(SAMPLE);
		const data = await getOepnvStopIndex(fetchFn);
		expect(fetchFn).toHaveBeenCalledWith('/oepnv-stops-index.json');
		expect(data).toEqual(SAMPLE);
	});

	it('returns cached value on subsequent calls', async () => {
		const fetchFn = fakeFetch(SAMPLE);
		await getOepnvStopIndex(fetchFn);
		await getOepnvStopIndex(fetchFn);
		expect(fetchFn).toHaveBeenCalledTimes(1);
	});

	it('throws on non-ok response', async () => {
		const fetchFn = fakeFetch(SAMPLE, false, 500);
		await expect(getOepnvStopIndex(fetchFn)).rejects.toThrow(/HTTP 500/);
	});

	it('shares in-flight promise to avoid duplicate fetches', async () => {
		const fetchFn = fakeFetch(SAMPLE);
		const [a, b] = await Promise.all([getOepnvStopIndex(fetchFn), getOepnvStopIndex(fetchFn)]);
		expect(fetchFn).toHaveBeenCalledTimes(1);
		expect(a).toBe(b);
	});
});
