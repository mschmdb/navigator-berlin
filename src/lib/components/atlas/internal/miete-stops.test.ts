import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MIETE_STOPS } from './miete-stops.js';

interface ManifestFile {
	layers: { slug: string; filename: string }[];
}

function quantile(sorted: readonly number[], q: number): number {
	const i = q * (sorted.length - 1);
	const lo = Math.floor(i);
	const hi = Math.min(lo + 1, sorted.length - 1);
	return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

describe('MIETE_STOPS', () => {
	it('entsprechen den auf 0,1 gerundeten Quintilen der generierten Planungsraum-Werte', () => {
		const manifest = JSON.parse(
			readFileSync('static/layers/MANIFEST.json', 'utf-8')
		) as ManifestFile;
		const entry = manifest.layers.find((l) => l.slug === 'zensus-bestandsmiete-2022');
		expect(entry).toBeDefined();
		const fc = JSON.parse(readFileSync(`static/layers/${entry!.filename}`, 'utf-8')) as {
			features: { properties: { miete: number | null } }[];
		};
		const values = fc.features
			.map((f) => f.properties.miete)
			.filter((v): v is number => v !== null)
			.sort((a, b) => a - b);
		const expected = [0, 0.2, 0.4, 0.6, 0.8].map((q) => Math.round(quantile(values, q) * 10) / 10);
		expect([...MIETE_STOPS]).toEqual(expected);
	});

	it('steigen streng monoton', () => {
		for (let i = 1; i < MIETE_STOPS.length; i++) {
			expect(MIETE_STOPS[i]).toBeGreaterThan(MIETE_STOPS[i - 1]);
		}
	});
});
