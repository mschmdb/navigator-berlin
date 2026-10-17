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
			slug: 'lor-bezirksregion',
			filename: 'lor-bezirksregion.9479b010.geojson',
			sourceUrl: 'https://example.com/lor.geojson',
			fetchedAt: '2026-05-16T06:56:28.400Z',
			license: 'dl-de/zero-2-0',
			sha256: 'lor',
			bundleGroup: 'A: Boundaries',
			zoomThresholds: { min: 10, max: 14 },
			geometryType: 'Polygon',
			featureCount: 143
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
		'i18n Block A: returns sitemap-index XML referencing both sitemap-de.xml and sitemap-en.xml',
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
			expect(body).toContain('https://navigator.berlin/sitemap-en.xml');
		}
	);

	it(
		'S5: lastmod je Teil-Sitemap = jüngstes lastmod ihrer Einträge, nicht new Date()',
		{ timeout: 20_000 },
		async () => {
			const index = await import('../../routes/sitemap.xml/+server.js');
			const de = await import('../../routes/sitemap-de.xml/+server.js');
			const en = await import('../../routes/sitemap-en.xml/+server.js');
			const indexBody = await (
				await index.GET(
					makeEvent('https://navigator.berlin/sitemap.xml') as Parameters<typeof index.GET>[0]
				)
			).text();
			const sitemaps = { de, en };
			for (const locale of ['de', 'en'] as const) {
				const mod = sitemaps[locale];
				const event = makeEvent(`https://navigator.berlin/sitemap-${locale}.xml`);
				const body = await (await mod.GET(event as never)).text();
				const dates = [...body.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
				expect(dates.length).toBeGreaterThan(0);
				const latest = dates.reduce((a, b) => (Date.parse(b) > Date.parse(a) ? b : a));
				const block = new RegExp(
					`<loc>https://navigator.berlin/sitemap-${locale}.xml</loc>\\s*<lastmod>([^<]+)</lastmod>`
				).exec(indexBody);
				expect(block?.[1]).toBe(latest);
			}
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
		// Story 16: Flag-Verdrahtung am echten Handler (featureFlags.wahlPortal=true seit 1A).
		expect(body).toContain('/berlin-wahlen');
		expect(body).toContain('<urlset');
		expect(body).toContain('https://navigator.berlin/');
		expect(body).toContain('https://navigator.berlin/methodik');
		expect(body).toContain('https://navigator.berlin/lizenzen');
		expect(body).toContain('https://navigator.berlin/layer/bezirke');
		expect(body).toContain('https://navigator.berlin/layer/klima-pet');
	});

	it(
		'S5: statische Seiten tragen kein lastmod, Kiez/Bezirk nicht das Grenzlayer-Datum',
		{ timeout: 20_000 },
		async () => {
			const mod = await import('../../routes/sitemap-de.xml/+server.js');
			const body = await (
				await mod.GET(
					makeEvent('https://navigator.berlin/sitemap-de.xml') as Parameters<typeof mod.GET>[0]
				)
			).text();
			const urlBlock = (loc: string) =>
				new RegExp(`<url>\\s*<loc>${loc}</loc>[\\s\\S]*?</url>`).exec(body)?.[0] ?? '';
			for (const path of ['/', '/methodik', '/lizenzen', '/kiez-score']) {
				const block = urlBlock(`https://navigator.berlin${path}`);
				expect(block, path).not.toBe('');
				expect(block, path).not.toContain('<lastmod>');
			}
			// Grenzlayer-fetchedAt der Fixture-Manifest darf keinem Kiez/Bezirk zugeordnet sein.
			const kiezBlocks = body.match(
				/<url>\s*<loc>https:\/\/navigator\.berlin\/kiez\/[^<]+<\/loc>[\s\S]*?<\/url>/g
			);
			expect(kiezBlocks?.length).toBeGreaterThan(100);
			expect(kiezBlocks?.some((b) => b.includes('2026-05-16T06:56:28.400Z'))).toBe(false);
			expect(kiezBlocks?.every((b) => b.includes('<lastmod>'))).toBe(true);
			const bezirkBlocks = body.match(
				/<url>\s*<loc>https:\/\/navigator\.berlin\/bezirk\/[^<]+<\/loc>[\s\S]*?<\/url>/g
			);
			expect(bezirkBlocks).toHaveLength(12);
			expect(bezirkBlocks?.some((b) => b.includes('2026-05-16'))).toBe(false);
		}
	);

	it('has prerender = true so it is built statically', { timeout: 20_000 }, async () => {
		const mod = await import('../../routes/sitemap-de.xml/+server.js');
		expect(mod.prerender).toBe(true);
	});

	// Review-Fund: die vorherigen Tests prüften nur den echten Flag-Wert
	// (aktuell true) -- hier beide Zustände am echten Handler, gemockt statt
	// vom aktuellen `featureFlags.wahlPortal`-Wert abhängig zu sein.
	it('enthält /berlin-wahlen wenn featureFlags.wahlPortal=true', { timeout: 20_000 }, async () => {
		vi.doMock('$lib/data/feature-flags.js', () => ({ featureFlags: { wahlPortal: true } }));
		const mod = await import('../../routes/sitemap-de.xml/+server.js');
		const response = await mod.GET(
			makeEvent('https://navigator.berlin/sitemap-de.xml') as Parameters<typeof mod.GET>[0]
		);
		const body = await response.text();
		expect(body).toContain('https://navigator.berlin/berlin-wahlen</loc>');
	});

	it(
		'enthält KEINE /berlin-wahlen-Portalseite wenn featureFlags.wahlPortal=false',
		{
			timeout: 20_000
		},
		async () => {
			vi.doMock('$lib/data/feature-flags.js', () => ({ featureFlags: { wahlPortal: false } }));
			const mod = await import('../../routes/sitemap-de.xml/+server.js');
			const response = await mod.GET(
				makeEvent('https://navigator.berlin/sitemap-de.xml') as Parameters<typeof mod.GET>[0]
			);
			const body = await response.text();
			// Nur der Portal-Hauptseiten-Eintrag hängt am Flag -- die einzelnen
			// /berlin-wahlen/<slug>-Detailseiten (WAHL_DETAIL_SOURCE) sind
			// unabhängig davon vorhanden, sobald `wahlen`-Daten existieren.
			expect(body).not.toContain('https://navigator.berlin/berlin-wahlen</loc>');
		}
	);

	// Review-Fund: `sourceUpdatedAt` (Story 16 `lastmod`-Fallback-Logik) war am
	// echten Sitemap-Handler ungetestet.
	it(
		'nutzt sourceUpdatedAt als lastmod für die Wahl-Detailseite (echter Handler, gemockte DB)',
		{
			timeout: 20_000
		},
		async () => {
			const originalDatabaseUrl = process.env.DATABASE_URL;
			process.env.DATABASE_URL = 'postgres://test/test';
			vi.doMock('$lib/server/db/queries/wahl/get-wahl-list.js', () => ({
				getWahlList: vi.fn(async () => [
					{
						id: 1,
						jahr: 2026,
						typ: 'bvv',
						stimmtyp: 'einstimme',
						isRepeatElection: false,
						parentElectionId: null,
						sourceUrl: 'https://www.wahlen-berlin.de/wahlen/BE2026/x.csv',
						license: 'dl-de/by-2-0',
						vorlaeufig: true,
						sourceUpdatedAt: new Date('2026-09-20T23:55:55.000Z')
					}
				])
			}));
			try {
				const mod = await import('../../routes/sitemap-de.xml/+server.js');
				const response = await mod.GET(
					makeEvent('https://navigator.berlin/sitemap-de.xml') as Parameters<typeof mod.GET>[0]
				);
				const body = await response.text();
				expect(body).toContain('https://navigator.berlin/berlin-wahlen/2026-bvv</loc>');
				expect(body).toContain('<lastmod>2026-09-20T23:55:55.000Z</lastmod>');
			} finally {
				if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
				else process.env.DATABASE_URL = originalDatabaseUrl;
			}
		}
	);
});

// i18n Block A/B: EN-Sitemap existiert als eigener Endpoint. Block A ließ
// ihn wegen des leeren Übersetzungs-Registers leer; Block B registriert
// /berlin-wahlen + Detailseiten, der echte Handler liefert die jetzt.
describe('routes/sitemap-en.xml/+server.ts (EN)', () => {
	it(
		'returns a valid urlset containing /en/berlin-wahlen (wahlPortalEnabled=true seit Block A)',
		{
			timeout: 20_000
		},
		async () => {
			// Explizite Mocks statt auf Ambient-Zustand zu vertrauen: `vi.doMock`
			// aus früheren Tests dieser Datei (featureFlags.wahlPortal=false,
			// eine 2026-bvv-Wahlen-Fixture) bleibt sonst über `vi.resetModules()`
			// hinweg registriert und sickert in diesen Test durch (Review-Fund,
			// Muster wie die bestehenden sitemap-de.xml-Tests in dieser Datei).
			vi.doMock('$lib/data/feature-flags.js', () => ({ featureFlags: { wahlPortal: true } }));
			vi.doMock('$lib/server/db/queries/wahl/get-wahl-list.js', () => ({
				getWahlList: vi.fn(async () => [])
			}));
			const mod = await import('../../routes/sitemap-en.xml/+server.js');
			const response = await mod.GET(
				makeEvent('https://navigator.berlin/sitemap-en.xml') as Parameters<typeof mod.GET>[0]
			);
			expect(response.status).toBe(200);
			expect(response.headers.get('content-type')).toMatch(/(application\/xml|text\/xml)/i);
			const body = await response.text();
			expect(body).toContain('<urlset');
			expect(body).toContain('https://navigator.berlin/en/berlin-wahlen</loc>');
			// Block D1: Layer sind registriert, Impressum/Datenschutz nicht.
			expect(body).toContain('/en/layer/');
			expect(body).toContain('https://navigator.berlin/en/explore</loc>');
			expect(body).not.toContain('/en/impressum');
			expect(body).not.toContain('/en/datenschutz');
			expect(body).toMatch(/https:\/\/navigator\.berlin\/en\/bezirk\/[a-z-]+<\/loc>/);
			expect(body).toMatch(/https:\/\/navigator\.berlin\/en\/kiez\/[a-z0-9-]+<\/loc>/);
		}
	);

	it(
		'liefert /en/berlin-wahlen/<slug>-Detailseiten mit echter DB (gemockt)',
		{ timeout: 20_000 },
		async () => {
			const originalDatabaseUrl = process.env.DATABASE_URL;
			process.env.DATABASE_URL = 'postgres://test/test';
			vi.doMock('$lib/data/feature-flags.js', () => ({ featureFlags: { wahlPortal: true } }));
			vi.doMock('$lib/server/db/queries/wahl/get-wahl-list.js', () => ({
				getWahlList: vi.fn(async () => [
					{
						id: 1,
						jahr: 2025,
						typ: 'btw',
						stimmtyp: 'zweitstimme',
						isRepeatElection: false,
						parentElectionId: null,
						sourceUrl: 'https://www.bundeswahlleiterin.de/x.csv',
						license: 'dl-de/by-2-0',
						vorlaeufig: false,
						sourceUpdatedAt: null
					}
				])
			}));
			try {
				const mod = await import('../../routes/sitemap-en.xml/+server.js');
				const response = await mod.GET(
					makeEvent('https://navigator.berlin/sitemap-en.xml') as Parameters<typeof mod.GET>[0]
				);
				const body = await response.text();
				expect(body).toContain(
					'https://navigator.berlin/en/berlin-wahlen/2025-btw-zweitstimme</loc>'
				);
			} finally {
				if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
				else process.env.DATABASE_URL = originalDatabaseUrl;
			}
		}
	);

	it(
		'S5: strikter Build ohne DATABASE_URL bricht ab, lokaler Build (auch NODE_ENV=production) warnt',
		{ timeout: 20_000 },
		async () => {
			const originalDatabaseUrl = process.env.DATABASE_URL;
			delete process.env.DATABASE_URL;
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			try {
				vi.stubEnv('NAVIGATOR_STRICT_BUILD', '1');
				const mod = await import('../../routes/sitemap-en.xml/+server.js');
				const event = makeEvent('https://navigator.berlin/sitemap-en.xml') as Parameters<
					typeof mod.GET
				>[0];
				await expect(Promise.resolve(mod.GET(event))).rejects.toThrow(/DATABASE_URL/);

				vi.stubEnv('NAVIGATOR_STRICT_BUILD', '');
				vi.stubEnv('NODE_ENV', 'production');
				const response = await mod.GET(event);
				expect(response.status).toBe(200);
				expect(warn).toHaveBeenCalled();
			} finally {
				vi.unstubAllEnvs();
				warn.mockRestore();
				if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
				else process.env.DATABASE_URL = originalDatabaseUrl;
			}
		}
	);

	it('has prerender = true so it is built statically', { timeout: 20_000 }, async () => {
		const mod = await import('../../routes/sitemap-en.xml/+server.js');
		expect(mod.prerender).toBe(true);
	});
});

// S5: echter Kiez, Erwartung unabhängig aus den Quelldateien berechnet.
describe('sitemap-{de,en}.xml: lastmod eines echten Kiez (reuterstrasse)', () => {
	async function expectedDates() {
		const { readFile } = await import('node:fs/promises');
		const { default: matter } = await import('gray-matter');
		const dir = 'src/lib/content/kiez-profile';
		const generatedAt = new Date(
			matter(await readFile(`${dir}/reuterstrasse.md`, 'utf-8')).data.generatedAt
		);
		const translatedAt = new Date(
			matter(await readFile(`${dir}/reuterstrasse.en.md`, 'utf-8')).data.translatedAt
		);
		const scores = await readFile('static/kiez-scores/kiez-scores.json', 'utf-8');
		const scoresAt = new Date(/"generatedAt":"([^"]+)"/.exec(scores.slice(0, 2048))?.[1] ?? '');
		return { generatedAt, translatedAt, scoresAt };
	}

	function lastmodOf(body: string, loc: string): string | undefined {
		const block = new RegExp(`<url>\\s*<loc>${loc}</loc>[\\s\\S]*?</url>`).exec(body)?.[0];
		return block ? /<lastmod>([^<]+)<\/lastmod>/.exec(block)?.[1] : undefined;
	}

	it(
		'DE = max(generatedAt, Scores-generatedAt), EN = max mit translatedAt',
		{ timeout: 20_000 },
		async () => {
			const { generatedAt, translatedAt, scoresAt } = await expectedDates();
			const de = await import('../../routes/sitemap-de.xml/+server.js');
			const en = await import('../../routes/sitemap-en.xml/+server.js');
			const deBody = await (
				await de.GET(makeEvent('https://navigator.berlin/sitemap-de.xml') as never)
			).text();
			const enBody = await (
				await en.GET(makeEvent('https://navigator.berlin/sitemap-en.xml') as never)
			).text();
			const deLastmod = lastmodOf(deBody, 'https://navigator.berlin/kiez/reuterstrasse');
			const enLastmod = lastmodOf(enBody, 'https://navigator.berlin/en/kiez/reuterstrasse');
			const max = (...dates: Date[]) => Math.max(...dates.map((d) => d.getTime()));
			expect(Date.parse(deLastmod ?? '')).toBe(max(generatedAt, scoresAt));
			expect(Date.parse(enLastmod ?? '')).toBe(max(generatedAt, translatedAt, scoresAt));
		}
	);
});
