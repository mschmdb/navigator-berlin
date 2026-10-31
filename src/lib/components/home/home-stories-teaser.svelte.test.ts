import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { StoryEntry } from '$lib/content/stories/types.js';
import HomeStoriesTeaser from './home-stories-teaser.svelte';

const mk = (slug: string, date: string, title: string, withPreview = true): StoryEntry => ({
	slug,
	filePath: `/_content/stories/${date}-${slug}.md`,
	frontmatter: {
		title,
		title_en: `${title} EN`,
		summary: `Summary ${title}.`,
		summary_en: `Summary ${title} EN.`,
		date,
		...(withPreview ? { preview: 'punkt-linie-kiez-bezirke' as const } : {})
	},
	body: ''
});
const entries = [mk('neu', '2026-11-02', 'Neu'), mk('alt', '2026-10-31', 'Alt', false)];
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
const stories = { entries, preview };

afterEach(() => overwriteGetLocale(() => 'de'));

const root = (): Element => document.querySelector('[data-testid="home-stories-teaser"]')!;

describe('home-stories-teaser.svelte', () => {
	it('zeigt Überschrift, einen Satz und den Link zur Übersicht', () => {
		render(HomeStoriesTeaser, { stories });
		expect(root().querySelector('h2')?.textContent).toBe('Berlin Data Stories');
		expect(root().querySelectorAll(':scope > div > p')).toHaveLength(1);
		const all = [...root().querySelectorAll('a')].find(
			(a) => a.getAttribute('href') === '/stories'
		)!;
		expect(all.textContent?.trim()).toBe('Alle Data Stories');
	});

	it('listet die Beiträge in der gelieferten Reihenfolge mit Datum, Titel und Summary', () => {
		render(HomeStoriesTeaser, { stories });
		const items = root().querySelectorAll('[data-testid="stories-entry"]');
		expect([...items].map((i) => i.getAttribute('data-slug'))).toEqual(['neu', 'alt']);
		expect(items[0]!.querySelector('h3 a')?.getAttribute('href')).toBe('/stories/neu');
		expect(items[0]!.textContent).toContain('Summary Neu.');
		expect(items[0]!.querySelector('time')?.getAttribute('datetime')).toBe('2026-11-02');
	});

	it('zeigt die Miniatur statisch und nur bei Beiträgen mit preview', () => {
		render(HomeStoriesTeaser, { stories });
		const items = root().querySelectorAll('[data-testid="stories-entry"]');
		const thumb = items[0]!.querySelector('[data-testid="stories-entry-preview"]')!;
		expect(thumb.getAttribute('aria-hidden')).toBe('true');
		expect(thumb.querySelector('svg')).not.toBeNull();
		expect(root().querySelectorAll('[tabindex]:not([tabindex="-1"])')).toHaveLength(0);
		expect(items[1]!.querySelector('[data-testid="stories-entry-preview"]')).toBeNull();
	});

	it('hat einen Titel-Link pro Eintrag im Tab-Pfad und keine Kachel', () => {
		render(HomeStoriesTeaser, { stories });
		const titleLinks = root().querySelectorAll('[data-testid="stories-entry-link"]');
		expect(titleLinks).toHaveLength(2);
		expect(root().className).not.toMatch(/\brounded\b/);
	});

	it('EN: Texte und Links tragen das /en-Präfix', () => {
		overwriteGetLocale(() => 'en');
		render(HomeStoriesTeaser, { stories });
		const hrefs = [...root().querySelectorAll('a')].map((a) => a.getAttribute('href'));
		expect(hrefs).toContain('/en/stories');
		expect(hrefs).toContain('/en/stories/neu');
		expect(root().textContent).toContain('All Data Stories');
		expect(root().querySelector('h3')?.textContent).toContain('Neu EN');
	});

	it('rendert ohne Beiträge nichts', () => {
		render(HomeStoriesTeaser, { stories: { entries: [], preview: null } });
		expect(document.querySelector('[data-testid="home-stories-teaser"]')).toBeNull();
	});
});
