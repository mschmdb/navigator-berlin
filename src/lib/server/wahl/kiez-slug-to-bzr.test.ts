import { describe, expect, it } from 'vitest';
import { loadKiezSlugToBzrId } from './kiez-slug-to-bzr.js';

describe('loadKiezSlugToBzrId', () => {
	it('mappt alle 143 Kiez-Slugs auf BZR_IDs, inkl. Heerstraße-Disambiguierung', async () => {
		const map = await loadKiezSlugToBzrId(process.cwd());
		expect(map.size).toBe(143);
		expect(map.get('regierungsviertel')).toBe('011002');
		expect(map.get('heerstrasse-spandau')).toMatch(/^05/);
		expect(map.get('heerstrasse-charlottenburg-wilmersdorf')).toMatch(/^04/);
	});

	it('liefert eine leere Map ohne GeoJSONs', async () => {
		expect((await loadKiezSlugToBzrId('/nonexistent')).size).toBe(0);
	});
});
