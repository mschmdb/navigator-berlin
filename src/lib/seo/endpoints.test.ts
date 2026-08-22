import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Manifest } from '$lib/data/types.js';

const fixtureManifest: Manifest = {
	schemaVersion: 1,
	generatedAt: '2026-05-16T07:03:25.286Z',
	layers: [
		{
			slug: 'bezirke',
			filename: 'bezirke.c8a6e03b.geojson',
			sourceUrl: 'https://example.com/bezirke.geojson',
			fetchedAt: '2026-05-16T06:56:28.400Z',
			license: 'dl-de/zero-2-0',
			sha256: 'abc',
			bundleGroup: 'A: Boundaries',
			zoomThresholds: { min: 8, max: 12 },
			geometryType: 'Polygon',
			featureCount: 12
		},
		{
			slug: 'klima-pet',
			filename: 'klima-pet.cafebabe.geojson',
			sourceUrl: 'https://example.com/klima-pet.geojson',
			fetchedAt: '2026-04-15T00:00:00.000Z',
			license: 'dl-de/by-2-0',
			sha256: 'ghi',
			bundleGroup: 'C: Umwelt',
			zoomThresholds: { min: 10, max: 16 },
			geometryType: 'Polygon',
			featureCount: 5000
		}
	]
};

vi.mock('$lib/data/manifest.js', () => ({
	loadManifest: vi.fn(async () => fixtureManifest)
}));

interface RequestEventLike {
	url: URL;
	fetch: typeof fetch;
	setHeaders: (headers: Record<string, string>) => void;
}

function makeEvent(
	urlString: string,
	params: Record<string, string> = {}
): RequestEventLike & {
	params: Record<string, string>;
} {
	return {
		url: new URL(urlString),
		params,
		fetch: globalThis.fetch,
		setHeaders: () => {}
	};
}

beforeEach(() => {
	vi.resetModules();
});

// Die Erst-Imports der Route-Module ziehen den halben App-Graph durch die
// Vite-Transform; unter Suite-Volllast dauert das gelegentlich über 5 s.
// Der lange Timeout deckt die Transform-Zeit, nicht die Logik.
describe('routes/robots.txt/+server.ts', () => {
	it('returns User-agent + Sitemap with correct content-type', { timeout: 20_000 }, async () => {
		const mod = await import('../../routes/robots.txt/+server.js');
		const response = await mod.GET(
			makeEvent('https://navigator.berlin/robots.txt') as Parameters<typeof mod.GET>[0]
		);
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toMatch(/text\/plain/i);
		const body = await response.text();
		expect(body).toContain('User-agent: *');
		expect(body).toContain('Allow: /');
		expect(body).toContain('Sitemap: https://navigator.berlin/sitemap.xml');
	});
});

describe('routes/sitemap.xml/+server.ts (index)', () => {
	it(
		'returns sitemap-index XML referencing sitemap-de.xml only (phase 1 DE-only)',
		{ timeout: 20_000 },
		async () => {
			const mod = await import('../../routes/sitemap.xml/+server.js');
			const response = await mod.GET(
				makeEvent('https://navigator.berlin/sitemap.xml') as Parameters<typeof mod.GET>[0]
			);
			expect(response.status).toBe(200);
			expect(response.headers.get('content-type')).toMatch(/(application\/xml|text\/xml)/i);
			const body = await response.text();
			expect(body).toContain('<sitemapindex');
			expect(body).toContain('https://navigator.berlin/sitemap-de.xml');
			expect(body).not.toContain('sitemap-en.xml');
		}
	);
});

describe('routes/sitemap-de.xml/+server.ts (DE)', () => {
	it('returns sitemap-DE with static pages + layer routes', { timeout: 20_000 }, async () => {
		const mod = await import('../../routes/sitemap-de.xml/+server.js');
		const response = await mod.GET(
			makeEvent('https://navigator.berlin/sitemap-de.xml') as Parameters<typeof mod.GET>[0]
		);
		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toContain('<urlset');
		expect(body).toContain('https://navigator.berlin/');
		expect(body).toContain('https://navigator.berlin/methodik');
		expect(body).toContain('https://navigator.berlin/lizenzen');
		expect(body).toContain('https://navigator.berlin/layer/bezirke');
		expect(body).toContain('https://navigator.berlin/layer/klima-pet');
	});

	it('has prerender = true so it is built statically', { timeout: 20_000 }, async () => {
		const mod = await import('../../routes/sitemap-de.xml/+server.js');
		expect(mod.prerender).toBe(true);
	});
});
