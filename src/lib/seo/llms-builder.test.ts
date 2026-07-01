import { describe, it, expect } from 'vitest';
import type { Manifest } from '$lib/data/types.js';
import {
	buildLlmsTxt,
	buildLlmsFullTxt,
	collectLlmsSourceEntries,
	type LlmsBezirkEntry,
	type LlmsKiezEntry,
	type LlmsLayerEntry,
	type LlmsSourceContext
} from './llms-builder.js';

const fixtureManifest: Manifest = {
	schemaVersion: 1,
	generatedAt: '2026-05-16T07:03:25.286Z',
	layers: [
		{
			slug: 'laerm-2023',
			filename: 'laerm-2023.abc.geojson',
			sourceUrl: 'https://example.com/laerm.geojson',
			fetchedAt: '2026-05-16T06:56:28.400Z',
			sourceUpdatedAt: '2023-09-15',
			license: 'dl-de/zero-2-0',
			sha256: 'abc',
			bundleGroup: 'C: Umwelt',
			zoomThresholds: { min: 8, max: 12 },
			geometryType: 'Polygon',
			featureCount: 542
		},
		{
			slug: 'bezirke',
			filename: 'bezirke.def.geojson',
			sourceUrl: 'https://example.com/bezirke.geojson',
			fetchedAt: '2026-05-16T06:56:28.400Z',
			license: 'dl-de/zero-2-0',
			sha256: 'def',
			bundleGroup: 'A: Boundaries',
			zoomThresholds: { min: 8, max: 12 },
			geometryType: 'Polygon',
			featureCount: 12
		}
	]
};

const fixtureBezirke: LlmsBezirkEntry[] = [
	{ slug: 'mitte', name: 'Mitte', markdown: '## Bezirk Mitte\n\nDaten.' },
	{ slug: 'pankow', name: 'Pankow', markdown: '## Bezirk Pankow\n\nDaten.' }
];

const fixtureKieze: LlmsKiezEntry[] = [
	{
		slug: 'boxhagener-kiez',
		name: 'Boxhagener Kiez',
		bezirkSlug: 'friedrichshain-kreuzberg',
		markdown: '## Kiez Boxi\n\nDaten.',
		topRank: 1
	},
	{
		slug: 'helmholtzkiez',
		name: 'Helmholtzkiez',
		bezirkSlug: 'pankow',
		markdown: '## Kiez Helmi\n\nDaten.',
		topRank: 2
	}
];

const fixtureLayer: LlmsLayerEntry[] = [
	{
		slug: 'laerm-2023',
		name: 'Lärm 2023',
		short: 'Tages-Lärmpegel',
		markdown: '## Layer Lärm 2023\n\nDaten.'
	}
];

const ctx: LlmsSourceContext = {
	origin: 'https://navigator.berlin',
	locale: 'de',
	manifest: fixtureManifest,
	buildTimestamp: '2026-05-16T07:00:00.000Z',
	bezirke: fixtureBezirke,
	kieze: fixtureKieze,
	layer: fixtureLayer
};

describe('collectLlmsSourceEntries', () => {
	it('returns entries with absolute URLs starting with origin', () => {
		const entries = collectLlmsSourceEntries(ctx);
		for (const e of entries) {
			expect(e.loc.startsWith('https://navigator.berlin')).toBe(true);
		}
	});

	it('includes static pages (root, methodik, lizenzen)', () => {
		const urls = collectLlmsSourceEntries(ctx).map((e) => e.loc);
		expect(urls).toContain('https://navigator.berlin/');
		expect(urls).toContain('https://navigator.berlin/methodik');
		expect(urls).toContain('https://navigator.berlin/lizenzen');
	});

	it('includes one entry per layer from manifest', () => {
		const urls = collectLlmsSourceEntries(ctx).map((e) => e.loc);
		expect(urls).toContain('https://navigator.berlin/layer/laerm-2023');
		expect(urls).toContain('https://navigator.berlin/layer/bezirke');
	});

	it('includes one entry per Bezirk', () => {
		const urls = collectLlmsSourceEntries(ctx).map((e) => e.loc);
		expect(urls).toContain('https://navigator.berlin/bezirk/mitte');
		expect(urls).toContain('https://navigator.berlin/bezirk/pankow');
	});

	it('includes one entry per Kiez', () => {
		const urls = collectLlmsSourceEntries(ctx).map((e) => e.loc);
		expect(urls).toContain('https://navigator.berlin/kiez/boxhagener-kiez');
		expect(urls).toContain('https://navigator.berlin/kiez/helmholtzkiez');
	});
});

describe('buildLlmsTxt', () => {
	it('starts with H1 "# navigator.berlin" per llmstxt.org spec', () => {
		const txt = buildLlmsTxt(ctx);
		expect(txt.split('\n')[0]).toBe('# navigator.berlin');
	});

	it('includes blockquote summary after H1', () => {
		const txt = buildLlmsTxt(ctx);
		expect(txt).toMatch(/\n>\s+.+/);
	});

	it('contains H2 sections for Methodik, Bezirke, Kieze, Daten-Layer', () => {
		const txt = buildLlmsTxt(ctx);
		expect(txt).toContain('## Methodik');
		expect(txt).toContain('## Bezirke');
		expect(txt).toContain('## Kieze');
		expect(txt).toContain('## Daten-Layer');
	});

	it('rendert statische Seiten inkl. /hitze als Bullets (## Seiten)', () => {
		const txt = buildLlmsTxt(ctx);
		expect(txt).toContain('## Seiten');
		expect(txt).toMatch(/-\s+\[Hitze-Navigator Berlin\]\(https:\/\/navigator\.berlin\/hitze\)/);
		expect(txt).toMatch(/-\s+\[Kühle Orte in Berlin\]\(https:\/\/navigator\.berlin\/kuehle-orte\)/);
	});

	it('renders each entry as bullet with markdown hyperlink + description', () => {
		const txt = buildLlmsTxt(ctx);
		// llmstxt.org Format: `- [name](url): description`
		expect(txt).toMatch(/-\s+\[Mitte\]\(https:\/\/navigator\.berlin\/bezirk\/mitte\)/);
		expect(txt).toMatch(
			/-\s+\[Boxhagener Kiez\]\(https:\/\/navigator\.berlin\/kiez\/boxhagener-kiez\)/
		);
		expect(txt).toMatch(/-\s+\[Lärm 2023\]\(https:\/\/navigator\.berlin\/layer\/laerm-2023\)/);
	});

	it('omits banned word "lebenswert"', () => {
		const txt = buildLlmsTxt(ctx);
		expect(txt.toLowerCase()).not.toContain('lebenswert');
	});

	it('has no em-dashes (U+2014)', () => {
		const txt = buildLlmsTxt(ctx);
		expect(txt).not.toContain('—');
	});
});

describe('buildLlmsFullTxt', () => {
	it('starts with site-intro H1', () => {
		const txt = buildLlmsFullTxt(ctx);
		expect(txt.split('\n')[0]).toBe('# navigator.berlin');
	});

	it('contains section markers between major blocks', () => {
		const txt = buildLlmsFullTxt(ctx);
		expect(txt).toContain('\n\n---\n\n');
	});

	it('contains all bezirk markdown blocks', () => {
		const txt = buildLlmsFullTxt(ctx);
		expect(txt).toContain('## Bezirk Mitte');
		expect(txt).toContain('## Bezirk Pankow');
	});

	it('contains kiez markdown blocks for top-ranked kieze only (Top-50 cap)', () => {
		const txt = buildLlmsFullTxt(ctx);
		expect(txt).toContain('## Kiez Boxi');
		expect(txt).toContain('## Kiez Helmi');
	});

	it('contains layer markdown blocks', () => {
		const txt = buildLlmsFullTxt(ctx);
		expect(txt).toContain('## Layer Lärm 2023');
	});

	it('lists overflow kieze as URL-only references at the end (Top-50-cap)', () => {
		const longKieze: LlmsKiezEntry[] = Array.from({ length: 55 }, (_, i) => ({
			slug: `kiez-${i}`,
			name: `Kiez ${i}`,
			bezirkSlug: 'mitte',
			markdown: `## Kiez ${i}\n\nDaten.`,
			topRank: i + 1
		}));
		const txt = buildLlmsFullTxt({ ...ctx, kieze: longKieze });
		// Top-50: full markdown
		expect(txt).toContain('## Kiez 0');
		expect(txt).toContain('## Kiez 49');
		// Overflow: URL-only ref-list, no full markdown body
		expect(txt).not.toContain('## Kiez 50');
		expect(txt).toContain('https://navigator.berlin/kiez/kiez-50');
		expect(txt).toContain('https://navigator.berlin/kiez/kiez-54');
	});

	it('has no banned word "lebenswert"', () => {
		const txt = buildLlmsFullTxt(ctx);
		expect(txt.toLowerCase()).not.toContain('lebenswert');
	});
});
