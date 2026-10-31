import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { StoryEntry } from '$lib/content/stories/types.js';
import Page from './+page.svelte';

const entry: StoryEntry = {
	slug: 'a',
	filePath: '/_content/stories/2026-10-31-a.md',
	frontmatter: {
		title: 'Alpha',
		title_en: 'Alpha EN',
		summary: 'Zusammenfassung.',
		summary_en: 'Summary EN.',
		date: '2026-10-31',
		series: 'Punkt, Linie, Kiez'
	},
	body: ''
};
const deOnly: StoryEntry = {
	...entry,
	frontmatter: { title: 'Alpha', summary: 'Zusammenfassung.', date: '2026-10-31' }
};

function root(): Element {
	return document.querySelector('[data-testid="stories-detail-page"]')!;
}
function squash(el: Element | null): string {
	return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}
function jsonLd(testid: string): Record<string, unknown> {
	return JSON.parse(document.querySelector(`[data-testid="${testid}"]`)!.textContent!);
}

describe('stories/[slug]/+page.svelte · DE', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('zeigt Breadcrumb, h1, Datum, Body und Rücklink', async () => {
		render(Page, {
			data: { entry, bodyHtml: '<p>Deutscher Body.</p>', bodyIsDeFallback: false } as never
		});
		await new Promise((r) => setTimeout(r, 20));
		expect(document.title).toBe('Alpha | navigator.berlin');
		expect(root().querySelectorAll('h1')).toHaveLength(1);
		const nav = root().querySelector('nav')!;
		expect(squash(nav)).toBe('Start › Data Stories › Alpha');
		expect([...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
			'/',
			'/stories'
		]);
		expect(squash(root().querySelector('header'))).toBe(
			'Alpha 31. Oktober 2026 Serie: Punkt, Linie, Kiez'
		);
		expect(squash(root().querySelector('[data-testid="stories-detail-body"]'))).toBe(
			'Deutscher Body.'
		);
		const back = root().querySelector('[data-testid="stories-back-link"]')!;
		expect(squash(back)).toBe('← Zurück zu den Data Stories');
		expect(back.getAttribute('href')).toBe('/stories');
		expect(root().querySelector('[lang]')).toBeNull();
	});

	it('BlogPosting und Breadcrumb tragen den Beitrag', () => {
		render(Page, { data: { entry, bodyHtml: '', bodyIsDeFallback: false } as never });
		const post = jsonLd('stories-detail-jsonld') as { headline: string; inLanguage: string };
		expect(post.headline).toBe('Alpha');
		expect(post.inLanguage).toBe('de-DE');
		const crumbs = jsonLd('stories-detail-breadcrumb-jsonld') as {
			itemListElement: { name: string }[];
		};
		expect(crumbs.itemListElement.map((i) => i.name)).toEqual(['Start', 'Data Stories', 'Alpha']);
	});
});

describe('stories/[slug]/+page.svelte · EN', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('übersetzter Beitrag: englisch, Links mit /en', () => {
		overwriteGetLocale(() => 'en');
		render(Page, {
			data: { entry, bodyHtml: '<p>English body.</p>', bodyIsDeFallback: false } as never
		});
		const nav = root().querySelector('nav')!;
		expect(squash(nav)).toBe('Home › Data Stories › Alpha EN');
		expect([...nav.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
			'/en/',
			'/en/stories'
		]);
		expect(squash(root().querySelector('header'))).toBe(
			'Alpha EN 31 October 2026 Series: Punkt, Linie, Kiez'
		);
		expect(root().querySelector('[lang]')).toBeNull();
		expect((jsonLd('stories-detail-jsonld') as { inLanguage: string }).inLanguage).toBe('en-US');
		expect(squash(root().querySelector('[data-testid="stories-back-link"]'))).toBe(
			'← Back to the Data Stories'
		);
	});

	it('Beitrag ohne EN: Titel und Body tragen lang="de", Rahmen bleibt englisch', () => {
		overwriteGetLocale(() => 'en');
		render(Page, {
			data: { entry: deOnly, bodyHtml: '<p>Deutscher Body.</p>', bodyIsDeFallback: true } as never
		});
		expect(root().querySelector('h1')?.getAttribute('lang')).toBe('de');
		expect(root().querySelector('[data-testid="stories-detail-body"]')?.getAttribute('lang')).toBe(
			'de'
		);
		expect(squash(root().querySelector('nav a'))).toBe('Home');
		expect((jsonLd('stories-detail-jsonld') as { inLanguage: string }).inLanguage).toBe('de-DE');
	});
});
