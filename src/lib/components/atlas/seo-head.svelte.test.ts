import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SeoHead from './seo-head.svelte';

/**
 * SeoHead renders into `<svelte:head>`, which appends to `document.head`.
 * We query `document.head` directly and clean up after each test.
 */
function getHeadHtml(): string {
	return document.head.innerHTML;
}

function queryHead(selector: string): Element | null {
	return document.head.querySelector(selector);
}

function queryAllHead(selector: string): Element[] {
	return Array.from(document.head.querySelectorAll(selector));
}

afterEach(() => {
	// vitest-browser-svelte unmounts the component but `<svelte:head>` cleanup
	// is tied to that lifecycle, so we additionally clear known tags added by tests.
	for (const sel of [
		'link[rel="canonical"]',
		'link[rel="alternate"]',
		'meta[name="description"]',
		'meta[name="robots"]',
		'meta[property^="og:"]',
		'meta[name^="twitter:"]'
	]) {
		for (const node of queryAllHead(sel)) node.remove();
	}
	// Reset any title set by SeoHead so subsequent tests start clean.
	const titles = document.head.querySelectorAll('title');
	for (let i = titles.length - 1; i > 0; i--) titles[i].remove();
});

describe('SeoHead', () => {
	it('rendert title-Tag aus title-Prop', async () => {
		render(SeoHead, {
			title: 'Methodik · navigator.berlin',
			description: 'Datenmethodik',
			pathname: '/methodik',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		expect(document.title).toBe('Methodik · navigator.berlin');
	});

	it('rendert meta-description', async () => {
		render(SeoHead, {
			title: 'Lizenzen',
			description: 'Lizenzen der Daten und Software.',
			pathname: '/lizenzen',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		const desc = queryHead('meta[name="description"]') as HTMLMetaElement | null;
		expect(desc?.content).toBe('Lizenzen der Daten und Software.');
	});

	it('rendert canonical ohne Query-Params', async () => {
		render(SeoHead, {
			title: 'Root',
			description: 'desc',
			pathname: '/?bbox=13.3,52.5,13.5,52.6&layers=bezirke',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		const canonical = queryHead('link[rel="canonical"]') as HTMLLinkElement | null;
		expect(canonical?.href).toBe('https://navigator.berlin/');
	});

	it('rendert hreflang-Cluster mit de + x-default (Phase 1 DE-only)', async () => {
		render(SeoHead, {
			title: 'Methodik',
			description: 'desc',
			pathname: '/methodik',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		const alternates = queryAllHead('link[rel="alternate"]') as HTMLLinkElement[];
		const hreflangs = alternates.map((el) => el.getAttribute('hreflang'));
		expect(hreflangs).toContain('de');
		expect(hreflangs).toContain('x-default');
		// Phase 1: no EN link
		expect(hreflangs).not.toContain('en');
	});

	it('rendert keine OG-Tags wenn ogImage fehlt', async () => {
		render(SeoHead, {
			title: 't',
			description: 'd',
			pathname: '/methodik',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		expect(queryHead('meta[property="og:image"]')).toBeNull();
	});

	it('rendert OG-Tags + twitter-Card wenn ogImage gesetzt', async () => {
		render(SeoHead, {
			title: 'Root',
			description: 'Lead description',
			pathname: '/',
			origin: 'https://navigator.berlin',
			ogImage: 'https://navigator.berlin/og/root.png'
		});
		await new Promise((r) => setTimeout(r, 10));
		const ogImage = queryHead('meta[property="og:image"]') as HTMLMetaElement | null;
		expect(ogImage?.content).toBe('https://navigator.berlin/og/root.png');
		const ogTitle = queryHead('meta[property="og:title"]') as HTMLMetaElement | null;
		expect(ogTitle?.content).toBe('Root');
		const twitterCard = queryHead('meta[name="twitter:card"]') as HTMLMetaElement | null;
		expect(twitterCard?.content).toBe('summary_large_image');
	});

	it('canonical ist auf root "/" (kein abgeschnittenes Pathname)', async () => {
		render(SeoHead, {
			title: 'Root',
			description: 'd',
			pathname: '/',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		const canonical = queryHead('link[rel="canonical"]') as HTMLLinkElement | null;
		expect(canonical?.href).toBe('https://navigator.berlin/');
	});

	it('rendert meta-robots NICHT wenn noindex=false (default)', async () => {
		render(SeoHead, {
			title: 'Public',
			description: 'd',
			pathname: '/methodik',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		expect(queryHead('meta[name="robots"]')).toBeNull();
	});

	it('rendert meta-robots noindex,nofollow wenn noindex=true (Story 5.9 AC-9)', async () => {
		render(SeoHead, {
			title: 'Dev',
			description: 'd',
			pathname: '/_dev/wortmarke',
			origin: 'https://navigator.berlin',
			noindex: true
		});
		await new Promise((r) => setTimeout(r, 10));
		const robots = queryHead('meta[name="robots"]') as HTMLMetaElement | null;
		expect(robots?.content).toBe('noindex,nofollow');
	});
});
