import { describe, expect, it } from 'vitest';
import { SOURCES } from './sources.js';

describe('SOURCES waerme-orte (#71)', () => {
	const source = SOURCES.find((s) => s.slug === 'waerme-orte');

	it('ist als lokale Punkt-Quelle mit ODbL-Lizenz registriert', () => {
		expect(source).toBeDefined();
		expect(source?.kind).toBe('local');
		expect(source?.localPath).toBe('static/data/waerme-orte.geojson');
		expect(source?.buildStep).toBe('scripts/build-waerme-orte.ts');
		expect(source?.license).toBe('ODbL 1.0');
		expect(source?.simplifyProfile).toBe('point');
	});

	it('gehört wie kuehle-orte zum Umwelt-Bundle', () => {
		const kuehle = SOURCES.find((s) => s.slug === 'kuehle-orte');
		expect(source?.bundleGroup).toBe(kuehle?.bundleGroup);
	});
});
