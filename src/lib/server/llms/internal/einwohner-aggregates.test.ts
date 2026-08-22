import { describe, expect, it } from 'vitest';
import { loadEinwohnerAggregates } from './einwohner-aggregates.js';

describe('loadEinwohnerAggregates', () => {
	it('liest slug-gekeyte Kiez- und Bezirks-Einwohner aus dem Demografie-Payload', async () => {
		const agg = await loadEinwohnerAggregates(process.cwd());
		expect(agg.kiez.get('regierungsviertel')).toBe(13637);
		expect(agg.bezirk.get('mitte')).toBeGreaterThan(300000);
		expect(agg.kiez.size).toBe(143);
		expect(agg.bezirk.size).toBe(12);
	});

	it('liefert leere Maps für ein Verzeichnis ohne Payload', async () => {
		const agg = await loadEinwohnerAggregates('/nonexistent-root');
		expect(agg.kiez.size).toBe(0);
		expect(agg.bezirk.size).toBe(0);
	});
});
