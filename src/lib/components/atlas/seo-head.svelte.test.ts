import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { TranslationRegisterEntry } from '$lib/seo/translation-register.js';
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
		'meta[property^="article:"]',
		'meta[name^="twitter:"]'
	]) {
		for (const node of queryAllHead(sel)) node.remove();
	}
	// Reset any title set by SeoHead so subsequent tests start clean.
	const titles = document.head.querySelectorAll('title');
	for (let i = titles.length - 1; i > 0; i--) titles[i].remove();
	overwriteGetLocale(() => 'de');
});

describe('SeoHead: ogType und article', () => {
	it('og:type ist standardmäßig website und es gibt genau ein og:type', async () => {
		render(SeoHead, {
			title: 't',
			description: 'd',
			pathname: '/methodik',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		const types = queryAllHead('meta[property="og:type"]') as HTMLMetaElement[];
		expect(types.map((t) => t.content)).toEqual(['website']);
		expect(queryHead('meta[property^="article:"]')).toBeNull();
	});

	it('rendert genau ein og:type=article und article:*-Properties', async () => {
		render(SeoHead, {
			title: 't',
			description: 'd',
			pathname: '/updates/launch',
			origin: 'https://navigator.berlin',
			ogType: 'article',
			article: {
				publishedTime: '2026-05-16',
				modifiedTime: '2026-06-01',
				section: 'feature',
				author: 'Matze Schmidbauer'
			}
		});
		await new Promise((r) => setTimeout(r, 10));
		const types = queryAllHead('meta[property="og:type"]') as HTMLMetaElement[];
		expect(types.map((t) => t.content)).toEqual(['article']);
		const content = (p: string) => (queryHead(`meta[property="${p}"]`) as HTMLMetaElement).content;
		expect(content('article:published_time')).toBe('2026-05-16');
		expect(content('article:modified_time')).toBe('2026-06-01');
		expect(content('article:section')).toBe('feature');
		expect(content('article:author')).toBe('Matze Schmidbauer');
	});

	it('lässt article:modified_time weg, wenn modifiedTime fehlt', async () => {
		render(SeoHead, {
			title: 't',
			description: 'd',
			pathname: '/updates/launch',
			origin: 'https://navigator.berlin',
			ogType: 'article',
			article: { publishedTime: '2026-05-16' }
		});
		await new Promise((r) => setTimeout(r, 10));
		expect(queryHead('meta[property="article:published_time"]')).not.toBeNull();
		expect(queryHead('meta[property="article:modified_time"]')).toBeNull();
	});
});

describe('SeoHead: article nur bei ogType article', () => {
	it('gibt keine article:*-Properties aus, wenn ogType website ist', async () => {
		render(SeoHead, {
			title: 't',
			description: 'd',
			pathname: '/methodik',
			origin: 'https://navigator.berlin',
			article: { publishedTime: '2026-05-16', section: 'feature' }
		});
		await new Promise((r) => setTimeout(r, 10));
		expect(queryHead('meta[property^="article:"]')).toBeNull();
	});
});

describe('SeoHead: Hitze-Subdomain', () => {
	it('Canonical, og:url und hreflang zeigen auf die Hauptdomain', async () => {
		render(SeoHead, {
			title: 'Hitze',
			description: 'Hitze',
			pathname: '/hitze',
			origin: 'https://hitze.navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		const hrefs = [
			queryHead('link[rel="canonical"]')?.getAttribute('href'),
			queryHead('meta[property="og:url"]')?.getAttribute('content'),
			...queryAllHead('link[rel="alternate"]').map((l) => l.getAttribute('href'))
		];
		expect(hrefs.length).toBeGreaterThan(2);
		for (const href of hrefs) expect(href).toMatch(/^https:\/\/navigator\.berlin\//);
	});
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
			pathname: '/impressum',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		const alternates = queryAllHead('link[rel="alternate"]') as HTMLLinkElement[];
		const hreflangs = alternates.map((el) => el.getAttribute('hreflang'));
		expect(hreflangs).toContain('de');
		expect(hreflangs).toContain('x-default');
		// unregistrierte Seite: kein EN-Link (/impressum bleibt dauerhaft DE)
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
			pathname: '/interne-vorschau',
			origin: 'https://navigator.berlin',
			noindex: true
		});
		await new Promise((r) => setTimeout(r, 10));
		const robots = queryHead('meta[name="robots"]') as HTMLMetaElement | null;
		expect(robots?.content).toBe('noindex,nofollow');
	});

	it('rendert og:locale = de_DE für die DE-Seite (default)', async () => {
		render(SeoHead, {
			title: 'Methodik',
			description: 'desc',
			pathname: '/impressum',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		const ogLocale = queryHead('meta[property="og:locale"]') as HTMLMetaElement | null;
		expect(ogLocale?.content).toBe('de_DE');
		expect(queryHead('meta[property="og:locale:alternate"]')).toBeNull();
	});

	// i18n Block A: jede nicht registrierte Nicht-Basis-Locale-Seite (hier
	// `/en/impressum`, bleibt dauerhaft DE) ist automatisch noindex,
	// unabhängig vom noindex-Prop.
	it('i18n Block A: EN-Seite ist automatisch noindex, weil sie nicht im Übersetzungs-Register steht (/impressum bleibt DE)', async () => {
		overwriteGetLocale(() => 'en');
		render(SeoHead, {
			title: 'Impressum',
			description: 'desc',
			pathname: '/en/impressum',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		const robots = queryHead('meta[name="robots"]') as HTMLMetaElement | null;
		expect(robots?.content).toBe('noindex,nofollow');
		// Content-Review-Fund: og:locale muss der EFFEKTIVEN Content-Locale
		// folgen, nicht der URL-Locale -- eine nicht-übersetzte /en-Seite zeigt
		// 1:1 DE-Content, og:locale darf das nicht als EN behaupten.
		const ogLocale = queryHead('meta[property="og:locale"]') as HTMLMetaElement | null;
		expect(ogLocale?.content).toBe('de_DE');
		expect(queryHead('meta[property="og:locale:alternate"]')).toBeNull();
		// Nicht übersetzt: kein hreflang-Paar (nur die self+x-default-Kombination
		// wäre vorhanden, aber die enthält kein "en", siehe hreflang.test.ts).
		const hreflangs = queryAllHead('link[rel="alternate"]').map((el) =>
			el.getAttribute('hreflang')
		);
		expect(hreflangs).not.toContain('en');
	});

	it('DE-Seite bleibt indexierbar, auch wenn en nicht übersetzt ist', async () => {
		overwriteGetLocale(() => 'de');
		render(SeoHead, {
			title: 'Impressum',
			description: 'desc',
			pathname: '/impressum',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		expect(queryHead('meta[name="robots"]')).toBeNull();
	});

	// Content-Review-Fund: eine nicht-übersetzte /en-Seite zeigt 1:1 DE-Content
	// -- ihr Canonical darf nicht auf sich selbst zeigen (das würde Google zwei
	// separate URLs für identischen Content melden), sondern auf die DE-URL.
	it('Canonical einer nicht-übersetzten EN-Seite zeigt auf die DE-URL', async () => {
		overwriteGetLocale(() => 'en');
		render(SeoHead, {
			title: 'Impressum',
			description: 'desc',
			pathname: '/en/impressum',
			origin: 'https://navigator.berlin'
		});
		await new Promise((r) => setTimeout(r, 10));
		const canonical = queryHead('link[rel="canonical"]') as HTMLLinkElement | null;
		expect(canonical?.href).toBe('https://navigator.berlin/impressum');
	});

	// Real register entry (injected via `registerEntries`, no module-mocking):
	// proves the full de+en+x-default hreflang triple, self-canonical, and
	// "no robots" on a genuinely translated EN page -- rendered end to end
	// through SeoHead itself, under both locales.
	describe('mit einem echten Registereintrag für /methodik (injiziert, kein Modul-Mock)', () => {
		const registerEntries: readonly TranslationRegisterEntry[] = [
			{ pathname: '/methodik', locale: 'en' }
		];

		it('unter de: hreflang de + en + x-default, self-canonical, kein robots', async () => {
			overwriteGetLocale(() => 'de');
			render(SeoHead, {
				title: 'Methodik',
				description: 'desc',
				pathname: '/methodik',
				origin: 'https://navigator.berlin',
				registerEntries
			});
			await new Promise((r) => setTimeout(r, 10));

			const hreflangs = queryAllHead('link[rel="alternate"]').map((el) => ({
				hreflang: el.getAttribute('hreflang'),
				href: el.getAttribute('href')
			}));
			expect(hreflangs).toContainEqual({
				hreflang: 'de',
				href: 'https://navigator.berlin/methodik'
			});
			expect(hreflangs).toContainEqual({
				hreflang: 'en',
				href: 'https://navigator.berlin/en/methodik'
			});
			expect(hreflangs).toContainEqual({
				hreflang: 'x-default',
				href: 'https://navigator.berlin/methodik'
			});

			const canonical = queryHead('link[rel="canonical"]') as HTMLLinkElement | null;
			expect(canonical?.href).toBe('https://navigator.berlin/methodik');
			expect(queryHead('meta[name="robots"]')).toBeNull();
		});

		it('unter en: hreflang de + en + x-default, self-canonical, kein robots', async () => {
			overwriteGetLocale(() => 'en');
			render(SeoHead, {
				title: 'Methodik',
				description: 'desc',
				pathname: '/en/methodik',
				origin: 'https://navigator.berlin',
				registerEntries
			});
			await new Promise((r) => setTimeout(r, 10));

			const hreflangs = queryAllHead('link[rel="alternate"]').map((el) => ({
				hreflang: el.getAttribute('hreflang'),
				href: el.getAttribute('href')
			}));
			expect(hreflangs).toContainEqual({
				hreflang: 'de',
				href: 'https://navigator.berlin/methodik'
			});
			expect(hreflangs).toContainEqual({
				hreflang: 'en',
				href: 'https://navigator.berlin/en/methodik'
			});
			expect(hreflangs).toContainEqual({
				hreflang: 'x-default',
				href: 'https://navigator.berlin/methodik'
			});

			const canonical = queryHead('link[rel="canonical"]') as HTMLLinkElement | null;
			expect(canonical?.href).toBe('https://navigator.berlin/en/methodik');
			expect(queryHead('meta[name="robots"]')).toBeNull();

			const ogLocale = queryHead('meta[property="og:locale"]') as HTMLMetaElement | null;
			expect(ogLocale?.content).toBe('en_US');
			const ogAlternates = queryAllHead('meta[property="og:locale:alternate"]').map(
				(el) => (el as HTMLMetaElement).content
			);
			expect(ogAlternates).toEqual(['de_DE']);
		});
	});
});
