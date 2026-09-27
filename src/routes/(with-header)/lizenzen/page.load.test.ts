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

// i18n Block C2 (spec-i18n-c2-layer-methodik.md): das DataCatalog-JSON-LD auf
// `/lizenzen` (prerendert pro Locale) muss bis zur Registrierung vollständig
// DE bleiben (Boundary "B4b-Linie"), analog zu `/layer/[slug]`. Vor dem Fix
// lief `buildLayerDetail(layer.slug, getLocale(), manifest)` -- auf
// `/en/lizenzen` wären Name, Beschreibung und Behörde englisch ins JSON-LD
// durchgesickert.
describe('lizenzen +page.ts load · catalogDatasets bleiben DE (Boundary B4b)', () => {
	it('name/description/creatorName sind DE, auch wenn die Seiten-Locale "en" ist', async () => {
		overwriteGetLocale(() => 'en');
		const data = (await load({
			fetch: globalThis.fetch
		} as unknown as Parameters<typeof load>[0])) as {
			catalogDatasets: {
				name: string;
				description: string;
				urlPath: string;
				creatorName?: string;
			}[];
		};

		const laerm = data.catalogDatasets.find((d) => d.urlPath === '/layer/laerm-2023');
		expect(laerm).toBeDefined();
		expect(laerm?.name).toBe('Lärmbelastung 2023');
		expect(laerm?.description).toMatch(/Kategorisierte Lärm-Gesamtbelastung/);
		expect(laerm?.creatorName).toMatch(/Senatsverwaltung/);
		expect(laerm?.name).not.toMatch(/Noise/);
		expect(laerm?.description).not.toMatch(/Categorised overall noise pollution/);
		expect(laerm?.creatorName).not.toMatch(/Senate Department/);
	});

	it('name/description/creatorName sind identisch DE für locale "de" und "en" (Zeichen-für-Zeichen-Parität)', async () => {
		overwriteGetLocale(() => 'de');
		const de = (await load({
			fetch: globalThis.fetch
		} as unknown as Parameters<typeof load>[0])) as {
			catalogDatasets: { name: string; description: string; creatorName?: string }[];
		};
		overwriteGetLocale(() => 'en');
		const en = (await load({
			fetch: globalThis.fetch
		} as unknown as Parameters<typeof load>[0])) as {
			catalogDatasets: { name: string; description: string; creatorName?: string }[];
		};
		expect(en.catalogDatasets).toEqual(de.catalogDatasets);
	});
});
