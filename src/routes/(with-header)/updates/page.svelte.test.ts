import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { UpdateEntry } from '$lib/content/updates/types.js';
import Page from './+page.svelte';

function makeEntry(
	slug: string,
	date: string,
	title: string,
	en = false,
	category: UpdateEntry['frontmatter']['category'] = 'feature'
): UpdateEntry {
	return {
		slug,
		filePath: `/_content/updates/${date}-${slug}.md`,
		frontmatter: {
			title_de: title,
			summary_de: `Zusammenfassung ${title}.`,
			...(en ? { title_en: `${title} EN`, summary_en: `Summary ${title} EN.` } : {}),
			date,
			category,
			lang: 'de'
		},
		body: `Body ${title}.`,
		...(en ? { bodyEn: `English ${title}.` } : {})
	};
}

const entries: UpdateEntry[] = [
	makeEntry('a', '2026-05-15', 'Alpha', true),
	makeEntry('b', '2026-04-01', 'Beta')
];

function root(): Element {
	return document.querySelector('[data-testid="updates-index-page"]')!;
}
function squash(el: Element): string {
	return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Im Test-Browser ist `page.url.origin` der String "null", nur der Pfad zählt. */
function pathOf(url: string): string {
	return url.replace(/^null/, '');
}

function metaDescription(): string | null | undefined {
	return document.querySelector('meta[name="description"]')?.getAttribute('content');
}

describe('updates/+page.svelte · DE-Wortlaut (i18n C4d)', () => {
	it('zeigt Titel, Kopf, Feedback, Liste und Links wie vor der Übersetzung', async () => {
		render(Page, { data: { entries } as never });
		await new Promise((r) => setTimeout(r, 20));
		expect(document.title).toBe('Updates - Berlin in Daten - navigator.berlin');
		expect(metaDescription()).toBe(
			'Was sich an navigator.berlin verändert: neue Daten, Features und Methodik-Änderungen. Mit RSS und Atom.'
		);
		expect(squash(root().querySelector('header')!)).toBe(
			'Updates Daten-Refreshes, Feature-Releases und Methodik-Änderungen. Abonnieren via RSS, Atom oder JSON Feed.'
		);
		expect(squash(root().querySelector('[data-testid="updates-filter-feedback"]')!)).toBe(
			'Alle Kategorien aktiv. 2 Einträge.'
		);
		const list = root().querySelector('[data-testid="updates-list"]')!;
		expect(list.getAttribute('aria-label')).toBe('Update-Einträge');
		expect(squash(list)).toBe(
			'15. Mai 2026 Feature Alpha Zusammenfassung Alpha. Mehr lesen1. April 2026 Feature Beta Zusammenfassung Beta. Mehr lesen'
		);
		expect([...root().querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
			'/updates/rss.xml',
			'/updates/atom.xml',
			'/updates/feed.json',
			'/updates/a',
			'/updates/a',
			'/updates/b',
			'/updates/b'
		]);
		expect(root().querySelector('[lang]')).toBeNull();
	});

	it('Blog-JSON-LD und Breadcrumb bleiben deutsch', async () => {
		render(Page, { data: { entries } as never });
		const blog = JSON.parse(
			document.querySelector('[data-testid="updates-index-jsonld"]')!.textContent!
		);
		expect(blog.description).toBe('Daten-Updates, Features, Methodik-Änderungen.');
		expect(blog.inLanguage).toBe('de-DE');
		expect(blog.blogPost[0].headline).toBe('Alpha');
		const crumbs = JSON.parse(
			document.querySelector('[data-testid="updates-index-breadcrumb-jsonld"]')!.textContent!
		);
		expect(
			crumbs.itemListElement.map((i: { name: string; item: string }) => [i.name, pathOf(i.item)])
		).toEqual([
			['Berlin', '/'],
			['Updates', '/updates']
		]);
	});
});

describe('updates/+page.svelte · EN (i18n C4d)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	function renderEn(): void {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { entries } as never });
	}

	it('Kopf, Feedback und Meta sind englisch, Feed-Links bleiben', async () => {
		renderEn();
		await new Promise((r) => setTimeout(r, 20));
		expect(document.title).toBe('Updates - Berlin in data - navigator.berlin');
		expect(metaDescription()).toBe(
			'What is changing at navigator.berlin: new data, features and methodology changes. With RSS and Atom.'
		);
		expect(squash(root().querySelector('header')!)).toBe(
			'Updates Data refreshes, feature releases and methodology changes. Subscribe via RSS, Atom or JSON Feed.'
		);
		expect(squash(root().querySelector('[data-testid="updates-filter-feedback"]')!)).toBe(
			'All categories active. 2 entries.'
		);
		expect(root().querySelector('[data-testid="updates-list"]')?.getAttribute('aria-label')).toBe(
			'Update entries'
		);
		const hrefs = [...root().querySelectorAll('header a')].map((a) => a.getAttribute('href'));
		expect(hrefs).toEqual(['/updates/rss.xml', '/updates/atom.xml', '/updates/feed.json']);
	});

	it('Karten: übersetzter Eintrag englisch, Eintrag ohne EN mit lang="de"', () => {
		renderEn();
		const cards = root().querySelectorAll('[data-testid="updates-entry-card"]');
		expect(squash(cards[0]!)).toBe('15 May 2026 Feature Alpha EN Summary Alpha EN. Read more');
		expect(cards[0]!.querySelector('[lang]')).toBeNull();
		expect(squash(cards[1]!)).toBe('1 April 2026 Feature Beta Zusammenfassung Beta. Read more');
		expect(cards[1]!.querySelectorAll('[lang="de"]')).toHaveLength(2);
		const hrefs = [...cards].flatMap((c) =>
			[...c.querySelectorAll('a')].map((a) => a.getAttribute('href'))
		);
		expect(hrefs).toEqual(['/en/updates/a', '/en/updates/a', '/en/updates/b', '/en/updates/b']);
	});

	it('Blog-JSON-LD und Breadcrumb in der Seiten-Locale', () => {
		renderEn();
		const blog = JSON.parse(
			document.querySelector('[data-testid="updates-index-jsonld"]')!.textContent!
		);
		expect(blog.inLanguage).toBe('en-US');
		expect(blog.description).toBe('Data updates, features and methodology changes.');
		expect(blog.blogPost[0].headline).toBe('Alpha EN');
		expect(pathOf(blog.url)).toBe('/en/updates');
		const crumbs = JSON.parse(
			document.querySelector('[data-testid="updates-index-breadcrumb-jsonld"]')!.textContent!
		);
		expect(
			crumbs.itemListElement.map((i: { name: string; item: string }) => [i.name, pathOf(i.item)])
		).toEqual([
			['Berlin', '/en/'],
			['Updates', '/en/updates']
		]);
	});
});

describe('updates/+page.svelte · Singular und Feed-Kennzeichnung (i18n C4d)', () => {
	const mixed: UpdateEntry[] = [
		makeEntry('a', '2026-05-15', 'Alpha', true, 'presse'),
		makeEntry('b', '2026-04-01', 'Beta', true, 'presse'),
		makeEntry('c', '2026-03-01', 'Gamma', true, 'feature')
	];

	afterEach(() => {
		overwriteGetLocale(() => 'de');
		history.replaceState(null, '', location.pathname);
	});

	function feedback(): string {
		return squash(root().querySelector('[data-testid="updates-filter-feedback"]')!);
	}

	async function renderWith(
		locale: 'de' | 'en',
		query: string,
		list: UpdateEntry[]
	): Promise<void> {
		overwriteGetLocale(() => locale);
		history.replaceState(null, '', `${location.pathname}${query}`);
		render(Page, { data: { entries: list } as never });
		await new Promise((r) => setTimeout(r, 30));
	}

	it.each([
		['de', 'Alle Kategorien aktiv. 1 Eintrag.'],
		['en', 'All categories active. 1 entry.']
	] as const)('%s: genau ein Eintrag ohne Filter nutzt den Singular', async (locale, expected) => {
		await renderWith(locale, '', [mixed[0]!]);
		expect(feedback()).toBe(expected);
	});

	it('EN: Feed-Links, Feed-Head-Links tragen hreflang="de"', async () => {
		await renderWith('en', '', mixed);
		const feedLinks = [...root().querySelectorAll('header a')];
		expect(feedLinks).toHaveLength(3);
		expect(feedLinks.every((a) => a.getAttribute('hreflang') === 'de')).toBe(true);
		const headLinks = document.head.querySelectorAll('link[rel="alternate"][type*="xml"]');
		expect(headLinks.length).toBeGreaterThan(0);
		for (const l of headLinks) expect(l.getAttribute('hreflang')).toBe('de');
	});

	it('DE: Feed-Links tragen kein hreflang', async () => {
		await renderWith('de', '', mixed);
		expect(root().querySelectorAll('header a[hreflang]')).toHaveLength(0);
	});
});
