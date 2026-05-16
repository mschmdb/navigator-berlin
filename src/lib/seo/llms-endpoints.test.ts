/**
 * Story 2.8 AC-1 + AC-2 + AC-6: Endpoint-Smoke für /llms.txt + /llms-full.txt.
 *
 * Mockt loadManifest + DB-Layer (`$lib/server/llms/data-collector`) und ruft
 * GET-Handler direkt auf. Verifies Headers, Body-Shape, Cache-Control.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Manifest } from '$lib/data/types.js';

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
		}
	]
};

vi.mock('$lib/data/manifest.js', () => ({
	loadManifest: vi.fn(async () => fixtureManifest)
}));

// Mock DB-Collector um DB-Roundtrip auszuschalten (kein DATABASE_URL in CI)
vi.mock('$lib/server/llms/data-collector.js', () => ({
	collectLlmsData: vi.fn(async (manifest: Manifest) => ({
		bezirke: [{ slug: 'mitte', name: 'Mitte', markdown: '## Bezirk Mitte\n\nDaten.' }],
		kieze: [
			{
				slug: 'boxhagener-kiez',
				name: 'Boxhagener Kiez',
				bezirkSlug: 'friedrichshain-kreuzberg',
				markdown: '## Kiez Boxi\n\nDaten.',
				topRank: 1
			}
		],
		layer: manifest.layers.map((l) => ({
			slug: l.slug,
			name: l.slug,
			short: 'kurz',
			markdown: `## Layer ${l.slug}\n\nDaten.`
		}))
	}))
}));

interface RequestEventLike {
	url: URL;
	fetch: typeof fetch;
	setHeaders: (headers: Record<string, string>) => void;
}

function makeEvent(urlString: string): RequestEventLike {
	return {
		url: new URL(urlString),
		fetch: globalThis.fetch,
		setHeaders: () => {}
	};
}

beforeEach(() => {
	vi.resetModules();
});

describe('routes/llms.txt/+server.ts', () => {
	it('returns 200 with text/markdown content-type', async () => {
		const mod = await import('../../routes/llms.txt/+server.js');
		const response = await mod.GET(
			makeEvent('https://navigator.berlin/llms.txt') as Parameters<typeof mod.GET>[0]
		);
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toMatch(/text\/markdown/i);
	});

	it('sets Cache-Control: public, max-age=3600 (1h)', async () => {
		const mod = await import('../../routes/llms.txt/+server.js');
		const response = await mod.GET(
			makeEvent('https://navigator.berlin/llms.txt') as Parameters<typeof mod.GET>[0]
		);
		expect(response.headers.get('cache-control')).toMatch(/max-age=3600/);
	});

	it('body follows llmstxt.org spec: H1 site name + blockquote summary', async () => {
		const mod = await import('../../routes/llms.txt/+server.js');
		const response = await mod.GET(
			makeEvent('https://navigator.berlin/llms.txt') as Parameters<typeof mod.GET>[0]
		);
		const body = await response.text();
		expect(body.split('\n')[0]).toBe('# navigator.berlin');
		expect(body).toMatch(/\n>\s+.+/);
	});

	it('lists Bezirke, Kieze, Daten-Layer as H2 sections', async () => {
		const mod = await import('../../routes/llms.txt/+server.js');
		const response = await mod.GET(
			makeEvent('https://navigator.berlin/llms.txt') as Parameters<typeof mod.GET>[0]
		);
		const body = await response.text();
		expect(body).toContain('## Bezirke');
		expect(body).toContain('## Kieze');
		expect(body).toContain('## Daten-Layer');
		expect(body).toContain('https://navigator.berlin/bezirk/mitte');
		expect(body).toContain('https://navigator.berlin/kiez/boxhagener-kiez');
		expect(body).toContain('https://navigator.berlin/layer/laerm-2023');
	});

	it('has prerender = true so it is built statically', async () => {
		const mod = await import('../../routes/llms.txt/+server.js');
		expect(mod.prerender).toBe(true);
	});

	it('contains no banned word "lebenswert"', async () => {
		const mod = await import('../../routes/llms.txt/+server.js');
		const response = await mod.GET(
			makeEvent('https://navigator.berlin/llms.txt') as Parameters<typeof mod.GET>[0]
		);
		const body = await response.text();
		expect(body.toLowerCase()).not.toContain('lebenswert');
	});
});

describe('routes/llms-full.txt/+server.ts', () => {
	it('returns 200 with text/markdown content-type', async () => {
		const mod = await import('../../routes/llms-full.txt/+server.js');
		const response = await mod.GET(
			makeEvent('https://navigator.berlin/llms-full.txt') as Parameters<typeof mod.GET>[0]
		);
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toMatch(/text\/markdown/i);
	});

	it('sets Cache-Control: public, max-age=3600 (1h)', async () => {
		const mod = await import('../../routes/llms-full.txt/+server.js');
		const response = await mod.GET(
			makeEvent('https://navigator.berlin/llms-full.txt') as Parameters<typeof mod.GET>[0]
		);
		expect(response.headers.get('cache-control')).toMatch(/max-age=3600/);
	});

	it('body starts with site-intro H1 and contains section markers between blocks', async () => {
		const mod = await import('../../routes/llms-full.txt/+server.js');
		const response = await mod.GET(
			makeEvent('https://navigator.berlin/llms-full.txt') as Parameters<typeof mod.GET>[0]
		);
		const body = await response.text();
		expect(body.split('\n')[0]).toBe('# navigator.berlin');
		expect(body).toContain('\n---\n');
	});

	it('contains full Bezirks + Kiez + Layer markdown blocks', async () => {
		const mod = await import('../../routes/llms-full.txt/+server.js');
		const response = await mod.GET(
			makeEvent('https://navigator.berlin/llms-full.txt') as Parameters<typeof mod.GET>[0]
		);
		const body = await response.text();
		expect(body).toContain('## Bezirk Mitte');
		expect(body).toContain('## Kiez Boxi');
		expect(body).toContain('## Layer laerm-2023');
	});

	it('has prerender = true', async () => {
		const mod = await import('../../routes/llms-full.txt/+server.js');
		expect(mod.prerender).toBe(true);
	});
});
