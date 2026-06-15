import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildIndex } from './spatial-index.js';
import type { FeatureCollection } from 'geojson';

const __dirname = dirname(fileURLToPath(import.meta.url));
const bezirke = JSON.parse(
	readFileSync(join(__dirname, '../__fixtures__/mini-bezirke.geojson'), 'utf-8')
) as FeatureCollection;

describe('buildIndex (rbush)', () => {
	it('buildet Index aus Feature-Collection', () => {
		const idx = buildIndex(bezirke);
		expect(idx.all()).toHaveLength(2);
	});

	it('search liefert Kandidaten fuer Bbox in Mitte', () => {
		const idx = buildIndex(bezirke);
		const results = idx.search({ minX: 13.39, minY: 52.52, maxX: 13.4, maxY: 52.53 });
		expect(results).toHaveLength(1);
		expect(results[0].featureIndex).toBe(0);
	});

	it('search leer ausserhalb aller Bboxes', () => {
		const idx = buildIndex(bezirke);
		const results = idx.search({ minX: 1, minY: 1, maxX: 2, maxY: 2 });
		expect(results).toHaveLength(0);
	});

	it('IndexedFeature traegt featureIndex + minX/minY/maxX/maxY', () => {
		const idx = buildIndex(bezirke);
		const item = idx.all()[0];
		expect(typeof item.featureIndex).toBe('number');
		expect(typeof item.minX).toBe('number');
		expect(typeof item.maxX).toBe('number');
	});
});
