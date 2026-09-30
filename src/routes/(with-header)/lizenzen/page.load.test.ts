import { afterEach, describe, expect, it, vi } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { Manifest } from '$lib/data';

const sampleManifest: Manifest = {
	schemaVersion: 1,
	generatedAt: '2026-05-13T10:00:00.000Z',
	layers: [
		{
			slug: 'laerm-2023',
			filename: 'laerm-2023.geojson',
			sourceUrl: 'https://gdi.berlin.de/wfs/ua',
			fetchedAt: '2026-05-12T10:00:00.000Z',
			sourceUpdatedAt: '2024-01-01T00:00:00.000Z',
			license: 'dl-de/zero-2-0',
			sha256: 'a'.repeat(64),
			bundleGroup: 'C: Umwelt',
			zoomThresholds: { min: 9, max: 18 },
			geometryType: 'Polygon',
			featureCount: 542
		}
	]
};

vi.mock('$lib/data/manifest.js', () => ({
	loadManifest: async () => sampleManifest
}));

const { load } = await import('./+page.js');

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

// i18n Block D1 (spec-i18n-d1-register-sitemap.md): das DataCatalog-JSON-LD auf
// `/lizenzen` (prerendert pro Locale) folgt der Seiten-Locale. Name, Beschreibung
// und Behörde kommen in `getLocale()`, die Dataset-URLs zeigen auf `/en/layer/...`.
type CatalogRef = {
	name: string;
	description: string;
	urlPath: string;
	creatorName?: string;
};

async function loadCatalog(): Promise<CatalogRef[]> {
	const data = (await load({
		fetch: globalThis.fetch,
		url: new URL('https://navigator.berlin/lizenzen')
	} as unknown as Parameters<typeof load>[0])) as { catalogDatasets: CatalogRef[] };
	return data.catalogDatasets;
}

describe('lizenzen +page.ts load · catalogDatasets folgen der Seiten-Locale (Block D1)', () => {
	it('EN: name/description/creatorName englisch, urlPath mit /en-Präfix', async () => {
		overwriteGetLocale(() => 'en');
		const laerm = (await loadCatalog()).find((d) => d.urlPath === '/en/layer/laerm-2023');
		expect(laerm).toBeDefined();
		expect(laerm?.name).toBe('Noise pollution 2023');
		expect(laerm?.description).toMatch(/Noise pollution in the area/);
		expect(laerm?.creatorName).toMatch(/Senate Department/);
	});

	it('DE: name/description/creatorName deutsch, urlPath ohne Präfix', async () => {
		overwriteGetLocale(() => 'de');
		const laerm = (await loadCatalog()).find((d) => d.urlPath === '/layer/laerm-2023');
		expect(laerm).toBeDefined();
		expect(laerm?.name).toBe('Lärmbelastung 2023');
		expect(laerm?.description).toMatch(/Kategorisierte Lärm-Gesamtbelastung/);
		expect(laerm?.creatorName).toMatch(/Senatsverwaltung/);
	});

	it('DE und EN liefern gleich viele Datasets mit derselben urlPath-Menge (modulo /en)', async () => {
		overwriteGetLocale(() => 'de');
		const de = await loadCatalog();
		overwriteGetLocale(() => 'en');
		const en = await loadCatalog();
		expect(en).toHaveLength(de.length);
		expect(new Set(en.map((d) => d.urlPath.replace(/^\/en/, '')))).toEqual(
			new Set(de.map((d) => d.urlPath))
		);
	});
});
