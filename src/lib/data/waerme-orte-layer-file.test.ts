import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface ManifestEntry {
	slug: string;
	filename: string;
	featureCount: number;
	geometryType: string;
}

describe('MANIFEST-Layerdatei waerme-orte (#71)', () => {
	const manifest = JSON.parse(
		readFileSync(resolve(process.cwd(), 'static/layers/MANIFEST.json'), 'utf-8')
	) as { layers: ManifestEntry[] };
	const entry = manifest.layers.find((l) => l.slug === 'waerme-orte');

	it('hat einen MANIFEST-Eintrag', () => {
		expect(entry).toBeDefined();
	});

	it('Layerdatei existiert, featureCount stimmt und alle Features sind Points', () => {
		const file = JSON.parse(
			readFileSync(resolve(process.cwd(), 'static/layers', entry!.filename), 'utf-8')
		) as { features: { geometry: { type: string } }[] };
		expect(file.features.length).toBe(entry!.featureCount);
		expect(file.features.length).toBeGreaterThan(0);
		expect(file.features.every((f) => f.geometry.type === 'Point')).toBe(true);
	});
});
