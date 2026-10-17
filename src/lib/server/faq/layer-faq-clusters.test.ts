import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	LAYER_FAQ_SLUGS,
	layerFaqClusters,
	templateAppliesToTarget
} from './layer-faq-clusters.js';

const manifest = JSON.parse(
	readFileSync(join(process.cwd(), 'static/layers/MANIFEST.json'), 'utf8')
) as { layers: { slug: string }[] };
const manifestSlugs = new Set(manifest.layers.map((l) => l.slug));

describe('layerFaqClusters (#99)', () => {
	it('ordnet Lärm, PET und Trinkbrunnen verschiedene Cluster zu', () => {
		expect(layerFaqClusters('laerm-2023')).toEqual(['laerm']);
		expect(layerFaqClusters('klima-pet-2022')).toEqual(['klima']);
		expect(layerFaqClusters('trinkbrunnen')).toEqual([]);
	});

	it('liefert für Layer ohne passenden Cluster eine leere Liste', () => {
		expect(layerFaqClusters('stolpersteine')).toEqual([]);
		expect(layerFaqClusters('unbekannter-layer')).toEqual([]);
	});

	it('kennt nur Slugs, die es im Manifest gibt', () => {
		expect(LAYER_FAQ_SLUGS.length).toBeGreaterThan(0);
		for (const slug of LAYER_FAQ_SLUGS) expect(manifestSlugs.has(slug)).toBe(true);
	});

	it('gibt Netz-Layern keine Haltedichte-Fragen', () => {
		for (const slug of ['ubahn-netz', 'sbahn-netz', 'tram-netz']) {
			expect(layerFaqClusters(slug)).toEqual([]);
		}
	});
});

describe('templateAppliesToTarget (#99)', () => {
	it('lässt Layer-Templates nur für passende Layer-Cluster zu', () => {
		expect(templateAppliesToTarget({ pageType: 'layer', slug: 'laerm-2023' }, 'laerm')).toBe(true);
		expect(templateAppliesToTarget({ pageType: 'layer', slug: 'trinkbrunnen' }, 'laerm')).toBe(
			false
		);
		expect(templateAppliesToTarget({ pageType: 'layer', slug: 'klima-pet-2022' }, 'oepnv')).toBe(
			false
		);
	});

	it('filtert Bezirk und Kiez nicht nach Cluster', () => {
		expect(templateAppliesToTarget({ pageType: 'kiez', slug: 'mitte' }, 'laerm')).toBe(true);
		expect(templateAppliesToTarget({ pageType: 'bezirk', slug: 'mitte' }, 'wohnen')).toBe(true);
	});
});
