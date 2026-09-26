import { describe, expect, it } from 'vitest';
import type { Bundle, LayerMetadata } from '$lib/data';
import {
	filterLayers,
	groupLayersByBundle,
	getLayerDisplayName,
	bundleLabel,
	BUNDLE_ORDER,
	LAYER_EXPLAIN_DE,
	BUNDLE_LABEL_DE
} from './layer-palette-filter.js';

function makeLayer(
	slug: string,
	bundle: LayerMetadata['bundleGroup'],
	overrides: Partial<LayerMetadata> = {}
): LayerMetadata {
	return {
		slug,
		filename: `${slug}.deadbeef.geojson`,
		sourceUrl: 'https://example.org/source',
		fetchedAt: '2026-01-01T00:00:00.000Z',
		license: 'dl-de/zero-2-0',
		sha256: 'a'.repeat(64),
		bundleGroup: bundle,
		zoomThresholds: { min: 8, max: 14 },
		geometryType: 'Polygon',
		featureCount: 1,
		...overrides
	};
}

const LAYERS: LayerMetadata[] = [
	makeLayer('bezirke', 'A: Boundaries'),
	makeLayer('plz', 'A: Boundaries'),
	makeLayer('bodenrichtwerte', 'B: Wohn-Daten'),
	makeLayer('laerm-2023', 'C: Umwelt'),
	makeLayer('stolpersteine', 'D: Memorial')
];

describe('filterLayers', () => {
	it('leere Query liefert alle Layer', () => {
		expect(filterLayers(LAYERS, '')).toHaveLength(LAYERS.length);
		expect(filterLayers(LAYERS, '   ')).toHaveLength(LAYERS.length);
	});

	it('matched auf Slug-Substring case-insensitive', () => {
		const out = filterLayers(LAYERS, 'BEZ');
		expect(out.map((l) => l.slug)).toEqual(['bezirke']);
	});

	it('matched auf Display-Name (LAYER_EXPLAIN_DE)', () => {
		const out = filterLayers(LAYERS, 'lärm');
		expect(out.map((l) => l.slug)).toEqual(['laerm-2023']);
	});

	it('matched substring auf Postleitzahlen → plz', () => {
		const out = filterLayers(LAYERS, 'postl');
		expect(out.map((l) => l.slug)).toEqual(['plz']);
	});

	it('matched Synonym „Lärm" auf laerm-2023', () => {
		const out = filterLayers(LAYERS, 'lärm');
		expect(out.map((l) => l.slug)).toContain('laerm-2023');
	});

	it('matched Synonym „laerm" ohne Umlaut auf laerm-2023 (NFD-Toleranz)', () => {
		const out = filterLayers(LAYERS, 'laerm');
		expect(out.map((l) => l.slug)).toContain('laerm-2023');
	});

	// i18n Block B3a: mit { locale: 'en' } matcht die Suche gegen den englischen
	// Display-Namen ("Noise Pollution 2023"), nicht nur gegen den DE-Namen.
	it('matched EN-Display-Namen mit { locale: "en" }', () => {
		const out = filterLayers(LAYERS, 'noise', { locale: 'en' });
		expect(out.map((l) => l.slug)).toEqual(['laerm-2023']);
	});
});

describe('groupLayersByBundle', () => {
	it('gruppiert nach Bundle in BUNDLE_ORDER-Reihenfolge', () => {
		const groups = groupLayersByBundle(LAYERS);
		expect(groups.map((g) => g.bundle)).toEqual([
			'A: Boundaries',
			'B: Wohn-Daten',
			'C: Umwelt',
			'D: Memorial'
		]);
	});

	it('innerhalb Bundle alphabetisch nach Display-Name', () => {
		const groups = groupLayersByBundle(LAYERS);
		expect(groups[0].layers.map((l) => l.slug)).toEqual(['bezirke', 'plz']);
	});

	it('blendet leere Bundles aus', () => {
		const subset = LAYERS.slice(0, 2);
		const groups = groupLayersByBundle(subset);
		expect(groups).toHaveLength(1);
		expect(groups[0].bundle).toBe('A: Boundaries');
	});

	it('blendet Layer mit mapRelevant=false aus (Story 1.28, z.B. lor-planungsraum)', () => {
		const layers: LayerMetadata[] = [
			makeLayer('bezirke', 'A: Boundaries'),
			makeLayer('lor-planungsraum', 'A: Boundaries', { mapRelevant: false }),
			makeLayer('plz', 'A: Boundaries')
		];
		const groups = groupLayersByBundle(layers);
		expect(groups).toHaveLength(1);
		expect(groups[0].layers.map((l) => l.slug)).toEqual(['bezirke', 'plz']);
	});

	it('liefert EN-Bundle-Label mit { locale: "en" }', () => {
		const groups = groupLayersByBundle(LAYERS, { locale: 'en' });
		expect(groups[1].label).toBe('B · Housing data');
	});
});

describe('getLayerDisplayName', () => {
	it('liefert Slug-Fallback für unbekannten Slug', () => {
		expect(getLayerDisplayName('unknown')).toBe('unknown');
	});

	it('liefert deutschen Namen für bekannten Slug', () => {
		expect(getLayerDisplayName('bodenrichtwerte')).toBe('Bodenrichtwerte (EUR/m²)');
	});

	it('liefert "S-Bahn-Netz" für sbahn-netz (Story 1.13)', () => {
		expect(getLayerDisplayName('sbahn-netz')).toBe('S-Bahn-Netz');
	});

	// i18n Block B3a: ohne `opts.locale` bleibt DE (Boundary), auch wenn eine
	// EN-URL-Locale aktiv ist -- Aufrufer auf der übersetzten Kartenoberfläche
	// übergeben `{ locale: 'en' }` explizit.
	it('liefert DE ohne opts, EN mit { locale: "en" }', () => {
		expect(getLayerDisplayName('bodenrichtwerte')).toBe('Bodenrichtwerte (EUR/m²)');
		expect(getLayerDisplayName('bodenrichtwerte', { locale: 'de' })).toBe(
			'Bodenrichtwerte (EUR/m²)'
		);
		expect(getLayerDisplayName('bodenrichtwerte', { locale: 'en' })).toBe(
			'Standard land values (EUR/m²)'
		);
	});

	it('liefert Slug-Fallback für unbekannten Slug auch mit EN-Locale', () => {
		expect(getLayerDisplayName('unknown', { locale: 'en' })).toBe('unknown');
	});

	// Review-Fund: `LAYER_NAME_MESSAGE[slug]`/`LAYER_EXPLAIN_DE[slug]` ohne Guard
	// träfe bei diesen Slugs `Object.prototype` (Funktion bzw. `[object
	// Object]`-Methode) statt "kein Eintrag" -- `slug` kann aus `?layers=`
	// kommen, also aus nicht vertrauenswürdiger Nutzereingabe.
	it('Prototype-Pollution-Guard: constructor/toString/hasOwnProperty liefern den Slug selbst zurück', () => {
		expect(getLayerDisplayName('constructor')).toBe('constructor');
		expect(getLayerDisplayName('toString')).toBe('toString');
		expect(getLayerDisplayName('hasOwnProperty')).toBe('hasOwnProperty');
		expect(getLayerDisplayName('__proto__')).toBe('__proto__');
		expect(getLayerDisplayName('constructor', { locale: 'en' })).toBe('constructor');
	});

	// Versprochener Paritätstest (Review-Fund): jeder LAYER_EXPLAIN_DE-Eintrag
	// muss über den Resolver 1:1 DE zurückkommen (keine Drift zwischen der
	// DE-Referenz-Konstante und den Message-Keys) und eine echte EN-Message haben.
	it('Parität: getLayerDisplayName(slug) === LAYER_EXPLAIN_DE[slug], EN-Message vorhanden', () => {
		for (const slug of Object.keys(LAYER_EXPLAIN_DE)) {
			expect(getLayerDisplayName(slug)).toBe(LAYER_EXPLAIN_DE[slug]);
			const en = getLayerDisplayName(slug, { locale: 'en' });
			expect(en).toBeTruthy();
		}
	});
});

describe('bundleLabel', () => {
	it('liefert DE ohne opts, EN mit { locale: "en" }', () => {
		expect(bundleLabel('B: Wohn-Daten')).toBe('B · Wohn-Daten');
		expect(bundleLabel('B: Wohn-Daten', { locale: 'en' })).toBe('B · Housing data');
	});

	// Versprochener Paritätstest (Review-Fund), analog zu LAYER_EXPLAIN_DE oben.
	it('Parität: bundleLabel(bundle) === BUNDLE_LABEL_DE[bundle], EN-Message vorhanden', () => {
		for (const bundle of Object.keys(BUNDLE_LABEL_DE) as Bundle[]) {
			expect(bundleLabel(bundle)).toBe(BUNDLE_LABEL_DE[bundle]);
			expect(bundleLabel(bundle, { locale: 'en' })).toBeTruthy();
		}
	});
});

describe('BUNDLE_ORDER', () => {
	it('ist A → J (G = Kiez-Score, H = Wahldaten, I = Demografie, J = Kultur)', () => {
		expect(BUNDLE_ORDER).toEqual([
			'A: Boundaries',
			'B: Wohn-Daten',
			'C: Umwelt',
			'D: Memorial',
			'E: Soziale Infrastruktur',
			'F: Mobilität',
			'G: Kiez-Score',
			'H: Wahldaten',
			'I: Demografie',
			'J: Kultur'
		]);
	});
});
