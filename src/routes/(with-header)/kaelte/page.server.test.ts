import { describe, expect, it, vi } from 'vitest';
import type { ColdWarning } from '$lib/data/dwd-warnung.types.js';

const fetchMock = vi.fn<() => Promise<ColdWarning[]>>();
vi.mock('$lib/server/dwd-kaelte-warnings.js', () => ({
	fetchBerlinColdWarnings: () => fetchMock()
}));

import { load, prerender } from './+page.server.js';

const FROST: ColdWarning = {
	event: 'strenger-frost',
	level: 2,
	headline: 'Amtliche WARNUNG vor strengem Frost',
	source: 'Deutscher Wetterdienst (DWD)',
	sourceUrl: 'https://www.dwd.de/warnungen'
};

describe('kaelte load', () => {
	it('ist nicht prerendered', () => {
		expect(prerender).toBe(false);
	});

	it('liefert die aktiven Kältewarnungen', async () => {
		fetchMock.mockResolvedValueOnce([FROST]);
		const result = await load({} as never);
		expect(result).toEqual({ warnings: [FROST] });
	});

	it('liefert eine leere Liste ohne Warnung', async () => {
		fetchMock.mockResolvedValueOnce([]);
		expect(await load({} as never)).toEqual({ warnings: [] });
	});
});
