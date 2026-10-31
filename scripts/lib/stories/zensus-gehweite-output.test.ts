import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Output {
	records: { plrId: string; einwohner: number; einwohnerMitHaltestelle: number }[];
}

const out = JSON.parse(readFileSync('static/data/zensus-gehweite-lor.json', 'utf-8')) as Output;

describe('static/data/zensus-gehweite-lor.json', () => {
	it('hat 542 Planungsräume', () => {
		expect(out.records).toHaveLength(542);
	});

	it('hat pro Planungsraum höchstens so viele Einwohner mit Haltestelle wie Einwohner', () => {
		for (const r of out.records) {
			expect(r.einwohnerMitHaltestelle, r.plrId).toBeGreaterThanOrEqual(0);
			expect(r.einwohnerMitHaltestelle, r.plrId).toBeLessThanOrEqual(r.einwohner);
		}
	});

	it('hat berlinweit einen Haltestellen-Anteil über 80 %', () => {
		const gesamt = out.records.reduce((s, r) => s + r.einwohner, 0);
		const mit = out.records.reduce((s, r) => s + r.einwohnerMitHaltestelle, 0);
		expect(gesamt).toBeGreaterThan(0);
		expect(mit / gesamt).toBeGreaterThan(0.8);
	});
});
