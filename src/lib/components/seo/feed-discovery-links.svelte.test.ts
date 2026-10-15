import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale, type Locale } from '$lib/paraglide/runtime';
import FeedDiscoveryLinks from './feed-discovery-links.svelte';

afterEach(() => {
	for (const node of document.head.querySelectorAll('link[rel="alternate"]')) node.remove();
	overwriteGetLocale(() => 'de');
});

async function renderFeedLinks(locale: Locale): Promise<HTMLLinkElement[]> {
	overwriteGetLocale(() => locale);
	render(FeedDiscoveryLinks, { origin: 'https://navigator.berlin/' });
	await new Promise((r) => setTimeout(r, 10));
	return Array.from(
		document.head.querySelectorAll('link[rel="alternate"][type]')
	) as HTMLLinkElement[];
}

describe('FeedDiscoveryLinks', () => {
	it('DE: drei Feed-Links ohne hreflang, Titel ohne Sprachzusatz', async () => {
		const links = await renderFeedLinks('de');
		expect(links.map((l) => l.getAttribute('href'))).toEqual([
			'https://navigator.berlin/updates/rss.xml',
			'https://navigator.berlin/updates/atom.xml',
			'https://navigator.berlin/updates/feed.json'
		]);
		for (const l of links) expect(l.hasAttribute('hreflang')).toBe(false);
		expect(links.map((l) => l.title)).toEqual([
			'Navigator Berlin Updates (RSS)',
			'Navigator Berlin Updates (Atom)',
			'Navigator Berlin Updates (JSON Feed)'
		]);
	});

	it('EN: ohne hreflang, Titel nennen die deutsche Sprache der Feeds', async () => {
		const links = await renderFeedLinks('en');
		for (const l of links) {
			expect(l.hasAttribute('hreflang')).toBe(false);
			expect(l.title).toContain('German');
		}
	});
});
