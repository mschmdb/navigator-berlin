import { describe, expect, it } from 'vitest';
import {
	parseArgs,
	extractLocFromXml,
	fetchSitemapUrls,
	buildIndexNowPayload
} from './indexnow-ping.js';

describe('parseArgs', () => {
	it('default: kein dry, kein limit', () => {
		expect(parseArgs([])).toEqual({ dry: false, limit: null });
	});

	it('--dry setzt dry true', () => {
		expect(parseArgs(['--dry'])).toEqual({ dry: true, limit: null });
	});

	it('--limit=5 setzt limit', () => {
		expect(parseArgs(['--limit=5'])).toEqual({ dry: false, limit: 5 });
	});

	it('ignoriert ungueltigen --limit-Wert', () => {
		expect(parseArgs(['--limit=abc'])).toEqual({ dry: false, limit: null });
	});
});

describe('extractLocFromXml', () => {
	it('extrahiert URLs aus <loc>-Tags', () => {
		const xml = `<?xml version="1.0"?>
			<urlset>
				<url><loc>https://navigator.berlin/</loc></url>
				<url><loc>https://navigator.berlin/methodik</loc></url>
			</urlset>`;
		expect(extractLocFromXml(xml)).toEqual([
			'https://navigator.berlin/',
			'https://navigator.berlin/methodik'
		]);
	});

	it('toleriert Whitespace + Newlines im loc-Tag', () => {
		const xml = `<sitemap><loc>
			https://navigator.berlin/sitemap-de.xml
		</loc></sitemap>`;
		expect(extractLocFromXml(xml)).toEqual(['https://navigator.berlin/sitemap-de.xml']);
	});

	it('leeres Array bei leerem XML', () => {
		expect(extractLocFromXml('<?xml?><x/>')).toEqual([]);
	});
});

describe('fetchSitemapUrls', () => {
	it('folgt Sitemap-Index zu Sub-Sitemaps', async () => {
		const calls: string[] = [];
		const mockFetch = async (url: string | URL | Request): Promise<Response> => {
			const u = String(url);
			calls.push(u);
			if (u.endsWith('/sitemap.xml')) {
				return new Response(
					`<sitemapindex><sitemap><loc>https://x.test/sitemap-de.xml</loc></sitemap></sitemapindex>`,
					{ status: 200 }
				);
			}
			return new Response(
				`<urlset><url><loc>https://x.test/a</loc></url><url><loc>https://x.test/b</loc></url></urlset>`,
				{ status: 200 }
			);
		};
		const urls = await fetchSitemapUrls('https://x.test', mockFetch as typeof fetch);
		expect(urls.sort()).toEqual(['https://x.test/a', 'https://x.test/b']);
		expect(calls).toContain('https://x.test/sitemap.xml');
		expect(calls).toContain('https://x.test/sitemap-de.xml');
	});

	it('liefert flache Liste wenn kein sitemapindex', async () => {
		const mockFetch = async (): Promise<Response> => {
			return new Response(
				`<urlset><url><loc>https://x.test/single</loc></url></urlset>`,
				{ status: 200 }
			);
		};
		const urls = await fetchSitemapUrls('https://x.test', mockFetch as typeof fetch);
		expect(urls).toEqual(['https://x.test/single']);
	});

	it('skipt failende Sub-Sitemaps', async () => {
		const mockFetch = async (url: string | URL | Request): Promise<Response> => {
			const u = String(url);
			if (u.endsWith('/sitemap.xml')) {
				return new Response(
					`<sitemapindex>
						<sitemap><loc>https://x.test/sitemap-a.xml</loc></sitemap>
						<sitemap><loc>https://x.test/sitemap-b.xml</loc></sitemap>
					</sitemapindex>`,
					{ status: 200 }
				);
			}
			if (u.includes('sitemap-a.xml')) {
				return new Response(`<urlset><url><loc>https://x.test/a1</loc></url></urlset>`, {
					status: 200
				});
			}
			return new Response('not found', { status: 404 });
		};
		const urls = await fetchSitemapUrls('https://x.test', mockFetch as typeof fetch);
		expect(urls).toEqual(['https://x.test/a1']);
	});
});

describe('buildIndexNowPayload', () => {
	it('konstruiert vollstaendiges Payload', () => {
		const payload = buildIndexNowPayload({
			host: 'navigator.berlin',
			key: 'abc123',
			urls: ['https://navigator.berlin/', 'https://navigator.berlin/methodik']
		});
		expect(payload).toEqual({
			host: 'navigator.berlin',
			key: 'abc123',
			keyLocation: 'https://navigator.berlin/abc123.txt',
			urlList: ['https://navigator.berlin/', 'https://navigator.berlin/methodik']
		});
	});
});
