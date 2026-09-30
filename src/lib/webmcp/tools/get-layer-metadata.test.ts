import { afterEach, describe, it, expect } from 'vitest';
import { createGetLayerMetadataTool } from './get-layer-metadata.js';
import type { LayerMetadata } from '$lib/data';
import type { LayerMethodology } from '$lib/data/layer-methodology.js';
import { getLayerMethodology } from '$lib/data/layer-methodology.js';
import { overwriteGetLocale } from '$lib/paraglide/runtime';

const FIXTURE_LAYER: LayerMetadata = {
	slug: 'wohnlagen-2024',
	filename: 'wohnlagen-2024.foo.geojson',
	sourceUrl: 'https://example.com/wohnlagen.json',
	fetchedAt: '2024-12-01',
	sourceUpdatedAt: '2024-06-01',
	license: 'dl-de/by-2-0',
	sha256: 'abc',
	bundleGroup: 'B: Wohn-Daten',
	zoomThresholds: { min: 9, max: 17 },
	geometryType: 'Polygon',
	featureCount: 12345
};

const FIXTURE_METHODOLOGY: LayerMethodology = {
	calculation: 'Wohnlagen aus Berliner Mietspiegel 2024',
	aggregationLevel: 'block',
	relatedLayers: ['wohnlagen-2024'],
	authority: 'ODIS Berlin'
};

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('get-layer-metadata tool', () => {
	// i18n Block C2 (spec-i18n-c2-layer-methodik.md): der Tool-Handler ruft
	// `deps.getLayerMethodology(input.slug)` bewusst ohne Locale-Arg auf
	// (Boundary: "WebMCP bleibt DE"). Dieser Test verdrahtet die ECHTE
	// `getLayerMethodology` statt einer Fixture, damit ein versehentliches
	// Durchreichen von `input.locale`/`defaultLocale()` in die Dependency
	// hier auffliegt (Fixtures würden das nicht bemerken, weil sie die
	// Locale ohnehin ignorieren). Die separate Mount-Wiring
	// (`mount.ts` -> `registerWebMcpServer`) deckt `mount.test.ts` ab.
	it('liefert DE-Methodik auch wenn die Seiten-Locale "en" ist (Boundary: WebMCP bleibt DE)', async () => {
		overwriteGetLocale(() => 'en');
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => ({ ...FIXTURE_LAYER, slug: 'laerm-2023' }),
			getLayerMethodology,
			loadManifest: async () => undefined,
			defaultLocale: () => 'en'
		});
		const out = (await tool.handler({ slug: 'laerm-2023' })) as Record<string, unknown>;
		const methodology = out.methodology as Record<string, unknown>;
		expect(methodology.summary).toMatch(/Gesamtverkehrslärm aus Straßen-/);
		expect(methodology.summary).not.toMatch(/Total traffic noise from road/);
	});

	// Composite-Authority mit OSM-Suffix (`stolpersteine`): der Suffix ist
	// seit C2 selbst locale-fähig (`AUTHORITY_SUFFIX_OSM_ODBL`) -- dieser
	// Test stellt sicher, dass auch der zusammengesetzte String unter einer
	// EN-Seiten-Locale komplett DE bleibt, nicht nur der Basis-Teil.
	it('Authority inkl. OSM-Suffix bleibt DE auch unter EN-Seiten-Locale', async () => {
		overwriteGetLocale(() => 'en');
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => ({ ...FIXTURE_LAYER, slug: 'stolpersteine' }),
			getLayerMethodology,
			loadManifest: async () => undefined,
			defaultLocale: () => 'en'
		});
		const out = (await tool.handler({ slug: 'stolpersteine' })) as Record<string, unknown>;
		const methodology = out.methodology as Record<string, unknown>;
		expect(methodology.authority).toMatch(/OpenStreetMap-Contributors \(ODbL 1\.0\)/);
		expect(methodology.authority).not.toMatch(/OpenStreetMap contributors/);
	});

	it('hat snake_case-name', () => {
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => FIXTURE_LAYER,
			getLayerMethodology: () => null,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de'
		});
		expect(tool.name).toBe('get_layer_metadata');
	});

	it('mappt Felder + license_url + methodology', async () => {
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => FIXTURE_LAYER,
			getLayerMethodology: () => FIXTURE_METHODOLOGY,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de'
		});
		const out = await tool.handler({ slug: 'wohnlagen-2024' });
		expect(out).toMatchObject({
			slug: 'wohnlagen-2024',
			bundle: 'B: Wohn-Daten',
			geometry_type: 'Polygon',
			feature_count: 12345,
			source_url: 'https://example.com/wohnlagen.json',
			updated_at: '2024-06-01',
			license: 'dl-de/by-2-0',
			license_url: 'https://www.govdata.de/dl-de/by-2-0',
			methodology: {
				summary: 'Wohnlagen aus Berliner Mietspiegel 2024',
				aggregation_level: 'block',
				source_layers: ['wohnlagen-2024']
			}
		});
		const methodology = (out as Record<string, unknown>).methodology as Record<string, unknown>;
		expect(methodology.authority).toBe('ODIS Berlin');
	});

	it('liefert null für methodology wenn keine vorhanden', async () => {
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => FIXTURE_LAYER,
			getLayerMethodology: () => null,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de'
		});
		const out = (await tool.handler({ slug: 'wohnlagen-2024' })) as Record<string, unknown>;
		expect(out.methodology).toBeNull();
	});

	it('Fallback auf fetchedAt bei fehlendem sourceUpdatedAt', async () => {
		const withoutSourceUpdated: LayerMetadata = {
			...FIXTURE_LAYER,
			sourceUpdatedAt: undefined
		};
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => withoutSourceUpdated,
			getLayerMethodology: () => null,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de'
		});
		const out = (await tool.handler({ slug: 'wohnlagen-2024' })) as Record<string, unknown>;
		expect(out.updated_at).toBe('2024-12-01');
	});

	it('graceful auf Unknown-Layer-Throw: returnt strukturierten Error (GH-Issue #7 follow-up 2)', async () => {
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => {
				throw new Error('Unknown layer: social-status');
			},
			getLayerMethodology: () => null,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de'
		});
		const out = (await tool.handler({ slug: 'social-status' })) as Record<string, unknown>;
		expect(out.error).toBe('layer_not_found');
		expect(out.slug).toBe('social-status');
		expect(typeof out.hint).toBe('string');
	});

	it('Nicht-Unknown-Layer-Errors werden weiter propagiert', async () => {
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => {
				throw new Error('Network down');
			},
			getLayerMethodology: () => null,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de'
		});
		await expect(tool.handler({ slug: 'whatever' })).rejects.toThrow('Network down');
	});
});
