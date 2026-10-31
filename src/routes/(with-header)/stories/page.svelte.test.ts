import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { StoryEntry } from '$lib/content/stories/types.js';
import Page from './+page.svelte';

const translated: StoryEntry = {
	slug: 'neu',
	filePath: '/_content/stories/2026-10-31-neu.md',
	frontmatter: {
		title: 'Neu',
		title_en: 'New',
		summary: 'Kurztext neu.',
		summary_en: 'Summary new.',
		date: '2026-10-31'
	},
	body: ''
};
const deOnly: StoryEntry = {
	slug: 'alt',
	filePath: '/_content/stories/2026-10-01-alt.md',
	frontmatter: { title: 'Alt', summary: 'Kurztext alt.', date: '2026-10-01' },
	body: ''
};

function root(): Element {
	return document.querySelector('[data-testid="stories-index-page"]')!;
}
function squash(el: Element | null): string {
	return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('stories/+page.svelte · DE', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('zeigt eine h1, den Einleitungssatz und die Beiträge als echte Liste', async () => {
		render(Page, { data: { entries: [translated, deOnly] } as never });
		await new Promise((r) => setTimeout(r, 20));
		expect(root().querySelectorAll('h1')).toHaveLength(1);
		expect(squash(root().querySelector('h1'))).toBe('Berlin Data Stories');
		expect(squash(root().querySelector('header p'))).toContain('Bilder mit einer Aussage');
		const list = root().querySelector('ul')!;
		expect(list.querySelectorAll(':scope > li')).toHaveLength(2);
		const links = [...list.querySelectorAll('[data-testid="stories-entry-link"]')];
		expect(links.map((a) => [squash(a), a.getAttribute('href')])).toEqual([
			['Neu', '/stories/neu'],
			['Alt', '/stories/alt']
		]);
		expect(squash(list.querySelector('time'))).toBe('31. Oktober 2026');
		expect(document.title).toBe('Berlin Data Stories | navigator.berlin');
	});

	it('Canonical zeigt auf /stories, auch wenn die Subdomain-Wurzel rendert', async () => {
		render(Page, { data: { entries: [translated] } as never });
		await new Promise((r) => setTimeout(r, 20));
		const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
		expect(canonical.endsWith('/stories')).toBe(true);
	});

	it('Blog-JSON-LD und Breadcrumb sind vorhanden', () => {
		render(Page, { data: { entries: [translated] } as never });
		const blog = JSON.parse(
			document.querySelector('[data-testid="stories-index-jsonld"]')!.textContent!
		);
		expect(blog['@type']).toBe('Blog');
		expect(blog.blogPost).toHaveLength(1);
		expect(
			document.querySelector('[data-testid="stories-index-breadcrumb-jsonld"]')
		).not.toBeNull();
	});

	it('leer: Hinweis statt leerer Liste', () => {
		render(Page, { data: { entries: [] } as never });
		expect(root().querySelector('ul')).toBeNull();
		expect(squash(root().querySelector('[data-testid="stories-empty"]'))).toBe(
			'Noch keine Beiträge.'
		);
	});
});

describe('stories/+page.svelte · EN', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('Blog-JSON-LD: übersetzter Beitrag ohne Body ist en-US, DE-only ist de-DE', () => {
		overwriteGetLocale(() => 'en');
		const stripped = [
			{ ...translated, hasEnglishBody: true },
			{ ...deOnly, hasEnglishBody: false }
		];
		render(Page, { data: { entries: stripped } as never });
		const blog = JSON.parse(
			document.querySelector('[data-testid="stories-index-jsonld"]')!.textContent!
		);
		expect(blog.blogPost[0].inLanguage).toBe('en-US');
		expect(blog.blogPost[1].inLanguage).toBe('de-DE');
	});

	it('Beitrag hat genau einen Link', () => {
		render(Page, { data: { entries: [translated] } as never });
		expect(root().querySelectorAll('[data-testid="stories-entry"] a')).toHaveLength(1);
	});

	it('übersetzter Beitrag englisch, Beitrag ohne EN mit lang="de" und /en-Links', () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { entries: [translated, deOnly] } as never });
		const items = [...root().querySelectorAll('[data-testid="stories-entry"]')];
		expect(squash(items[0]!.querySelector('h2'))).toBe('New');
		expect(items[0]!.querySelector('[lang]')).toBeNull();
		expect(items[0]!.querySelector('a')?.getAttribute('href')).toBe('/en/stories/neu');
		expect(squash(items[0]!.querySelector('time'))).toBe('31 October 2026');
		expect(items[1]!.querySelector('h2')?.getAttribute('lang')).toBe('de');
		expect(items[1]!.querySelector('p')?.getAttribute('lang')).toBe('de');
		expect(root().querySelector('ul')?.getAttribute('aria-label')).toBe('Posts');
	});
});

describe('stories/+page.svelte · Vorschau', () => {
	const withPreview: StoryEntry = {
		...translated,
		frontmatter: { ...translated.frontmatter, preview: 'punkt-linie-kiez-bezirke' }
	};
	const preview = {
		slug: 'mitte',
		name: 'Mitte',
		kennzahlen: {
			slug: 'mitte',
			gruen: 0.5,
			altbauAnteil: 0.4,
			laermDb: 50,
			bewohnerProKm2: 3000,
			haltestelle400mAnteil: 0.95,
			clubs: 3
		}
	};

	it('zeigt die Miniatur nur bei Beiträgen mit preview, dekorativ und ohne zusätzlichen Tab-Stopp', () => {
		render(Page, { data: { entries: [withPreview, deOnly], preview } as never });
		const items = root().querySelectorAll('[data-testid="stories-entry"]');
		const thumb = items[0]!.querySelector('[data-testid="stories-entry-preview"]')!;
		expect(thumb).not.toBeNull();
		expect(thumb.getAttribute('href')).toBe('/stories/neu');
		expect(thumb.getAttribute('tabindex')).toBe('-1');
		expect(thumb.getAttribute('aria-hidden')).toBe('true');
		expect(thumb.querySelector('svg')).not.toBeNull();
		expect(thumb.querySelectorAll('[tabindex]')).toHaveLength(0);
		expect(items[1]!.querySelector('[data-testid="stories-entry-preview"]')).toBeNull();
	});

	it('zeigt ohne Vorschau-Daten keine Miniatur', () => {
		render(Page, { data: { entries: [withPreview], preview: null } as never });
		expect(root().querySelector('[data-testid="stories-entry-preview"]')).toBeNull();
	});
});

describe('stories/+page.svelte · OG-Bild', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('setzt das Stories-Bild mit Alt-Text und im JSON-LD', async () => {
		render(Page, { data: { entries: [translated], preview: null } as never });
		await new Promise((r) => setTimeout(r, 20));
		const meta = (p: string): string | null =>
			document.querySelector(`meta[property="${p}"]`)?.getAttribute('content') ?? null;
		expect(meta('og:image')).toContain('/og/page/stories.png');
		expect(meta('og:image:alt')).toContain('Komposition');
		const ld = JSON.parse(
			document.querySelector('[data-testid="stories-index-jsonld"]')!.textContent!
		) as { image: string };
		expect(ld.image).toContain('/og/page/stories.png');
	});

	it('EN: Alt-Text englisch', async () => {
		overwriteGetLocale(() => 'en');
		render(Page, { data: { entries: [translated], preview: null } as never });
		await new Promise((r) => setTimeout(r, 20));
		expect(
			document.querySelector('meta[property="og:image:alt"]')?.getAttribute('content')
		).toContain('composition');
	});
});
