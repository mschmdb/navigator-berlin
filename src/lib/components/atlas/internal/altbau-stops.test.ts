import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALTBAU_STOPS } from './altbau-stops.js';

interface ManifestFile {
	layers: { slug: string; filename: string }[];
}

function quantile(sorted: readonly number[], q: number): number {
	const i = q * (sorted.length - 1);
	const lo = Math.floor(i);
	const hi = Math.min(lo + 1, sorted.length - 1);
	return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

describe('ALTBAU_STOPS', () => {
	it('entsprechen den auf ganze Prozent gerundeten Quintilen der generierten Planungsraum-Werte', () => {
		const manifest = JSON.parse(
			readFileSync('static/layers/MANIFEST.json', 'utf-8')
		) as ManifestFile;
		const entry = manifest.layers.find((l) => l.slug === 'zensus-altbau-anteil-2022');
		expect(entry).toBeDefined();
		const fc = JSON.parse(readFileSync(`static/layers/${entry!.filename}`, 'utf-8')) as {
			features: { properties: { altbau_anteil: number | null } }[];
		};
		const values = fc.features
			.map((f) => f.properties.altbau_anteil)
			.filter((v): v is number => v !== null)
			.sort((a, b) => a - b);
		const expected = [0, 0.2, 0.4, 0.6, 0.8].map((q) => Math.round(quantile(values, q)));
		expect([...ALTBAU_STOPS]).toEqual(expected);
	});

	it('steigen streng monoton (MapLibre-step verlangt aufsteigende Stops)', () => {
		for (let i = 1; i < ALTBAU_STOPS.length; i++) {
			expect(ALTBAU_STOPS[i]).toBeGreaterThan(ALTBAU_STOPS[i - 1]);
		}
	});
});
