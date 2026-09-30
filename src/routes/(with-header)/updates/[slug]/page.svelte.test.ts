import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { UpdateEntry } from '$lib/content/updates/types.js';
import Page from './+page.svelte';

const entry: UpdateEntry = {
	slug: 'a',
	filePath: '/_content/updates/2026-05-15-a.md',
	frontmatter: {
		title_de: 'Alpha',
		title_en: 'Alpha EN',
		summary_de: 'Zusammenfassung Alpha.',
		summary_en: 'Summary Alpha EN.',
		date: '2026-05-15',
		category: 'presse',
		tags: ['eins', 'zwei'],
		lang: 'de'
	},
	body: 'Deutscher Body.',
	bodyEn: 'English body.'
};

const deOnly: UpdateEntry = {
	...entry,
	frontmatter: {
		title_de: 'Alpha',
		summary_de: 'Zusammenfassung Alpha.',
		date: '2026-05-15',
		category: 'presse',
		tags: ['eins', 'zwei'],
		lang: 'de'
	},
	bodyEn: undefined
};

function root(): Element {
	return document.querySelector('[data-testid="updates-detail-page"]')!;
}
function squash(el: Element | null): string {
	return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}
function pathOf(url: string): string {
	return url.replace(/^null/, '');
}
function jsonLd(testid: string): Record<string, unknown> {
	return JSON.parse(document.querySelector(`[data-testid="${testid}"]`)!.textContent!);
}
function hrefs(el: Element): (string | null)[] {
	return [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'));
}

describe('updates/[slug]/+page.svelte · DE-Wortlaut (i18n C4d)', () => {
	it('zeigt Breadcrumb, Kopf, Body, Tags und Rücklink wie vor der Übersetzung', async () => {
		render(Page, {
			data: { entry, bodyHtml: '<p>Deutscher Body.</p>', bodyIsDeFallback: false } as never
		});
		await new Promise((r) => setTimeout(r, 20));
		expect(document.title).toBe('Alpha - Berlin in Daten - navigator.berlin');
		expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
			'Zusammenfassung Alpha.'
		);
		const nav = root().querySelector('nav')!;
		expect(nav.getAttribute('aria-label')).toBe('Brotkrumen');
		expect(squash(nav)).toBe('Start › Updates › Alpha');
		expect(hrefs(nav)).toEqual(['/', '/updates']);
		expect(squash(root().querySelector('[data-testid="updates-detail-title"]'))).toBe('Alpha');
		expect(squash(root().querySelector('header'))).toBe('Alpha 15. Mai 2026 Presse');
		expect(squash(root().querySelector('[data-testid="updates-detail-body"]'))).toBe(
			'Deutscher Body.'
		);
		expect(squash(root().querySelector('[data-testid="updates-detail-tags"]'))).toBe(
			'Tags einszwei'
		);
		const back = root().querySelector('[data-testid="updates-back-link"]')!;
		expect(squash(back)).toBe('← Zurück zur Update-Liste');
		expect(back.getAttribute('href')).toBe('/updates');
		expect(root().querySelector('[lang]')).toBeNull();
	});

	it('BlogPosting und Breadcrumb bleiben deutsch', () => {
		render(Page, { data: { entry, bodyHtml: '', bodyIsDeFallback: false } as never });
		const post = jsonLd('updates-detail-jsonld') as { headline: string; inLanguage: string };
		expect(post.headline).toBe('Alpha');
		expect(post.inLanguage).toBe('de-DE');
		const crumbs = jsonLd('updates-detail-breadcrumb-jsonld') as {
			itemListElement: { name: string; item: string }[];
		};
		expect(crumbs.itemListElement.map((i) => [i.name, pathOf(i.item)])).toEqual([
			['Berlin', '/'],
			['Updates', '/updates'],
			['Alpha', '/updates/a']
		]);
	});
});

describe('updates/[slug]/+page.svelte · EN (i18n C4d)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	function renderEn(e: UpdateEntry, bodyHtml: string): void {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { entry: e, bodyHtml, bodyIsDeFallback: !e.bodyEn } as never });
	}

	it('übersetzter Eintrag: alles englisch, ohne lang-Attribute', async () => {
		renderEn(entry, '<p>English body.</p>');
		await new Promise((r) => setTimeout(r, 20));
		expect(document.title).toBe('Alpha EN - Berlin in data - navigator.berlin');
		expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
			'Summary Alpha EN.'
		);
		const nav = root().querySelector('nav')!;
		expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
		expect(squash(nav)).toBe('Home › Updates › Alpha EN');
		expect(hrefs(nav)).toEqual(['/en/', '/en/updates']);
		expect(squash(root().querySelector('header'))).toBe('Alpha EN 15 May 2026 Press');
		expect(squash(root().querySelector('[data-testid="updates-detail-body"]'))).toBe(
			'English body.'
		);
		const back = root().querySelector('[data-testid="updates-back-link"]')!;
		expect(squash(back)).toBe('← Back to the updates list');
		expect(back.getAttribute('href')).toBe('/en/updates');
		// Nur die deutschen Tag-Slugs tragen lang="de".
		const langEls = [...root().querySelectorAll('[lang]')];
		expect(langEls.map((el) => el.tagName)).toEqual(['LI', 'LI']);
		expect(langEls.every((el) => el.getAttribute('lang') === 'de')).toBe(true);
		expect(squash(root().querySelector('[data-testid="updates-detail-tags"] p'))).toBe('Tags');
	});

	it('Eintrag ohne EN: Titel und Body tragen lang="de", Rahmen bleibt englisch', () => {
		renderEn(deOnly, '<p>Deutscher Body.</p>');
		expect(root().querySelector('h1')?.getAttribute('lang')).toBe('de');
		expect(root().querySelector('[data-testid="updates-detail-body"]')?.getAttribute('lang')).toBe(
			'de'
		);
		expect(root().querySelector('nav span.text-ink')?.getAttribute('lang')).toBe('de');
		expect(squash(root().querySelector('header'))).toBe('Alpha 15 May 2026 Press');
	});

	it('BlogPosting und Breadcrumb in der Seiten-Locale', () => {
		renderEn(entry, '');
		const post = jsonLd('updates-detail-jsonld') as {
			headline: string;
			description: string;
			inLanguage: string;
			mainEntityOfPage: { '@id': string };
		};
		expect(post.headline).toBe('Alpha EN');
		expect(post.description).toBe('Summary Alpha EN.');
		expect(post.inLanguage).toBe('en-US');
		expect(pathOf(post.mainEntityOfPage['@id'])).toBe('/en/updates/a');
		const crumbs = jsonLd('updates-detail-breadcrumb-jsonld') as {
			itemListElement: { name: string; item: string }[];
		};
		expect(crumbs.itemListElement.map((i) => [i.name, pathOf(i.item)])).toEqual([
			['Berlin', '/en/'],
			['Updates', '/en/updates'],
			['Alpha EN', '/en/updates/a']
		]);
	});

	it('BlogPosting ohne EN-Titel: inLanguage de-DE', () => {
		renderEn(deOnly, '');
		const post = jsonLd('updates-detail-jsonld') as { inLanguage: string };
		expect(post.inLanguage).toBe('de-DE');
	});
});
