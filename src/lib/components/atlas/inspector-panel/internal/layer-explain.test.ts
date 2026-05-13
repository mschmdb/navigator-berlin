import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	LAYER_EXPLAIN_DE,
	explainLayer,
	getLayerExplain,
	getLayerExternalLink,
	type LayerExplain
} from './layer-explain.js';

const MANIFEST_PATH = fileURLToPath(
	new URL('../../../../../../static/layers/MANIFEST.json', import.meta.url)
);

interface ManifestSlim {
	layers: { slug: string }[];
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as ManifestSlim;
const manifestSlugs = manifest.layers.map((l) => l.slug);

const MAX_SHORT_LENGTH = 80;
const MAX_LONG_LENGTH = 400;

describe('LAYER_EXPLAIN_DE coverage-guard', () => {
	it('hat Entry für JEDEN Manifest-Slug', () => {
		const missing = manifestSlugs.filter((slug) => !(slug in LAYER_EXPLAIN_DE));
		expect(missing, `Manifest-Slugs ohne LAYER_EXPLAIN_DE-Entry: ${missing.join(', ')}`).toEqual(
			[]
		);
	});

	it('short ≤ 80 Zeichen pro Manifest-Slug', () => {
		const tooLong = manifestSlugs
			.filter((s) => s in LAYER_EXPLAIN_DE)
			.map((slug) => {
				const e = LAYER_EXPLAIN_DE[slug];
				return { slug, len: e.short.length };
			})
			.filter((x) => x.len > MAX_SHORT_LENGTH);
		expect(tooLong, `Slugs mit short > 80 Zeichen: ${JSON.stringify(tooLong)}`).toEqual([]);
	});

	it('long ≤ 400 Zeichen pro Manifest-Slug', () => {
		const tooLong = manifestSlugs
			.filter((s) => s in LAYER_EXPLAIN_DE)
			.map((slug) => {
				const e = LAYER_EXPLAIN_DE[slug];
				return { slug, len: e.long.length };
			})
			.filter((x) => x.len > MAX_LONG_LENGTH);
		expect(tooLong, `Slugs mit long > 400 Zeichen: ${JSON.stringify(tooLong)}`).toEqual([]);
	});

	it('long ist immer länger oder gleich short (Progressive-Disclosure-Invariant)', () => {
		const violations = manifestSlugs
			.filter((s) => s in LAYER_EXPLAIN_DE)
			.filter((slug) => {
				const e = LAYER_EXPLAIN_DE[slug];
				return e.long.length < e.short.length;
			});
		expect(violations, `Slugs mit long < short: ${violations.join(', ')}`).toEqual([]);
	});
});

describe('getLayerExplain(slug, kind)', () => {
	it('liefert short-Text für bekannten Slug', () => {
		const slug = manifestSlugs[0];
		expect(getLayerExplain(slug, 'short')).toBe(LAYER_EXPLAIN_DE[slug].short);
	});

	it('liefert long-Text für bekannten Slug', () => {
		const slug = manifestSlugs[0];
		expect(getLayerExplain(slug, 'long')).toBe(LAYER_EXPLAIN_DE[slug].long);
	});

	it('leerer String für unbekannten Slug', () => {
		expect(getLayerExplain('does-not-exist-xyz', 'short')).toBe('');
		expect(getLayerExplain('does-not-exist-xyz', 'long')).toBe('');
	});
});

describe('explainLayer (Legacy-Helper, Back-Compat)', () => {
	it('liefert short-Text für bekannten Slug (Drop-In-Replacement)', () => {
		const slug = manifestSlugs[0];
		expect(explainLayer(slug)).toBe(LAYER_EXPLAIN_DE[slug].short);
	});

	it('liefert leeren String für unbekannten Slug', () => {
		expect(explainLayer('unknown-xyz')).toBe('');
	});
});

describe('LayerExplain optional fields', () => {
	it('mindestens 1 Manifest-Layer hat unit (Wohnlagen oder Bodenrichtwerte)', () => {
		const withUnit = manifestSlugs.filter((s) => LAYER_EXPLAIN_DE[s]?.unit !== undefined);
		expect(withUnit.length).toBeGreaterThan(0);
	});

	it('mindestens 1 Manifest-Layer hat valueScaleExplain (z.B. Wohnlage 1-5)', () => {
		const withScale = manifestSlugs.filter(
			(s) => LAYER_EXPLAIN_DE[s]?.valueScaleExplain !== undefined
		);
		expect(withScale.length).toBeGreaterThan(0);
	});
});

describe('getLayerExternalLink (Legacy von Story 1.10d)', () => {
	it('liefert Mietspiegel-Link für wohnlagen-2024', () => {
		const link = getLayerExternalLink('wohnlagen-2024');
		expect(link?.href).toBe('https://mietspiegel.berlin.de/');
		expect(link?.label).toMatch(/Mietspiegel/);
	});

	it('null für Layer ohne External-Link', () => {
		expect(getLayerExternalLink('bezirke')).toBeNull();
	});
});

describe('Type-Shape', () => {
	it('Eintrag exposed short + long als string', () => {
		const e: LayerExplain = LAYER_EXPLAIN_DE[manifestSlugs[0]];
		expect(typeof e.short).toBe('string');
		expect(typeof e.long).toBe('string');
	});
});
