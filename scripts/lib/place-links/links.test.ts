import { describe, expect, it } from 'vitest';
import { anchorIds, internalLinks, orphans } from './links';

describe('internalLinks', () => {
	it('keeps internal page links with anchors, drops external, mail and assets', () => {
		const html = `<a href="/kiez/rixdorf#gruen">x</a><a href="https://x.de">e</a>
			<a href="mailto:a@b.de">m</a><a href="/og/kiez/a.png">i</a><a href="#laerm">s</a>
			<a href="/en/kieze">k</a>`;
		expect(internalLinks(html, '/kiez/reuterstrasse')).toEqual([
			{ path: '/kiez/rixdorf', anchor: 'gruen' },
			{ path: '/kiez/reuterstrasse', anchor: 'laerm' },
			{ path: '/en/kieze', anchor: null }
		]);
	});
	it('resolves relative links against the page', () => {
		expect(
			internalLinks('<a href="./kiez/a">x</a><a href="../bezirk/b#gruen">y</a>', '/en/kieze')
		).toEqual([
			{ path: '/en/kiez/a', anchor: null },
			{ path: '/bezirk/b', anchor: 'gruen' }
		]);
	});
	it('decodes HTML entities in hrefs and drops the query for the route', () => {
		expect(internalLinks('<a href="/explore?layers=a&amp;q=b">x</a>', '/')).toEqual([
			{ path: '/explore', anchor: null }
		]);
	});
});

describe('anchorIds', () => {
	it('collects element ids', () => {
		expect(anchorIds('<section id="laerm"></section><h2 id="laerm-h">')).toEqual(
			new Set(['laerm', 'laerm-h'])
		);
	});
});

describe('orphans', () => {
	it('lists places without a link from an overview or from another place page', () => {
		const linkedFrom = new Map([
			['a', new Set(['/kieze', '/kiez/b'])],
			['b', new Set(['/kieze'])],
			['c', new Set(['/kiez/a'])]
		]);
		expect(orphans(['a', 'b', 'c', 'd'], linkedFrom, '/kieze', '/kiez/')).toEqual([
			{ slug: 'b', reason: 'kein Nachbar verlinkt' },
			{ slug: 'c', reason: 'fehlt in der Übersicht' },
			{ slug: 'd', reason: 'fehlt in der Übersicht' },
			{ slug: 'd', reason: 'kein Nachbar verlinkt' }
		]);
	});
});

import { slugsFromSitemap } from './links';

describe('slugsFromSitemap', () => {
	it('reads the place slugs from <loc> entries, not from alternates', () => {
		const xml = `<url><loc>https://x/kiez/a</loc><xhtml:link href="https://x/en/kiez/a"/></url>
			<url><loc>https://x/kiez/b</loc></url><url><loc>https://x/kieze</loc></url>`;
		expect(slugsFromSitemap(xml, '/kiez/')).toEqual(['a', 'b']);
		expect(slugsFromSitemap(xml, '/en/kiez/')).toEqual([]);
	});
});
