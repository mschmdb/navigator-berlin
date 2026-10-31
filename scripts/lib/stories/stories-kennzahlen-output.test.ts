import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Row {
	slug: string;
	bezirkSlug?: string;
	[key: string]: unknown;
}
interface Output {
	schemaVersion: number;
	generatedAt: string;
	sources: { name: string; stand: string }[];
	bezirke: Row[];
	kieze: Row[];
}

const out = JSON.parse(readFileSync('static/data/stories-kennzahlen.json', 'utf-8')) as Output;
const KENNZAHLEN = [
	'bewohner',
	'bewohnerProKm2',
	'laermDb',
	'altbauAnteil',
	'hitze',
	'gruen',
	'clubs',
	'haltestelle400mAnteil'
];
const ANTEILE = ['altbauAnteil', 'hitze', 'gruen', 'haltestelle400mAnteil'];

describe('static/data/stories-kennzahlen.json', () => {
	it('hat 12 Bezirke und Quellen mit Stand', () => {
		expect(out.schemaVersion).toBe(1);
		expect(out.bezirke).toHaveLength(12);
		expect(out.sources.length).toBeGreaterThan(0);
		for (const s of out.sources) expect(s.stand).not.toBe('');
	});

	it('ordnet jeden Kiez einem bekannten Bezirk zu', () => {
		const bezirke = new Set(out.bezirke.map((b) => b.slug));
		expect(out.kieze.length).toBeGreaterThan(0);
		for (const k of out.kieze) expect(bezirke.has(k.bezirkSlug as string)).toBe(true);
	});

	it('füllt alle 8 Kennzahlen mit plausiblen Werten', () => {
		for (const row of [...out.kieze, ...out.bezirke]) {
			for (const key of KENNZAHLEN) expect(row[key], `${row.slug}.${key}`).not.toBeNull();
			expect(row.laermDb as number, row.slug).toBeGreaterThanOrEqual(30);
			expect(row.laermDb as number, row.slug).toBeLessThanOrEqual(90);
			expect(row.bewohnerProKm2 as number, row.slug).toBeGreaterThan(0);
		}
		for (const b of out.bezirke) {
			expect(b.haltestelle400mAnteil as number, b.slug).toBeGreaterThan(0.5);
		}
	});

	it('hat so viele Kieze wie der Altbau-Layer', () => {
		const manifest = JSON.parse(readFileSync('static/layers/MANIFEST.json', 'utf-8')) as {
			layers: { slug: string; filename: string }[];
		};
		const entry = manifest.layers.find((l) => l.slug === 'zensus-altbau-anteil-2022');
		const fc = JSON.parse(readFileSync(`static/layers/${entry!.filename}`, 'utf-8')) as {
			features: { properties: { kiez_slug: string } }[];
		};
		const distinct = new Set(fc.features.map((f) => f.properties.kiez_slug));
		expect(out.kieze).toHaveLength(distinct.size);
	});

	it('hält alle Anteile in [0, 1]', () => {
		for (const row of [...out.kieze, ...out.bezirke]) {
			for (const key of ANTEILE) {
				const v = row[key];
				if (v === null) continue;
				expect(v, `${row.slug}.${key}`).toBeGreaterThanOrEqual(0);
				expect(v, `${row.slug}.${key}`).toBeLessThanOrEqual(1);
			}
		}
	});

	it('enthält keine Planungsräume', () => {
		const text = JSON.stringify(out);
		expect(text).not.toMatch(/plrId|plr_id|PLR_ID/);
	});

	it('ist nach Slug sortiert', () => {
		for (const list of [out.kieze, out.bezirke]) {
			const slugs = list.map((r) => r.slug);
			expect(slugs).toEqual([...slugs].sort());
		}
	});
});
