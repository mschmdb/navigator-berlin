import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import HomeUpdatesTeaser from './home-updates-teaser.svelte';

const items = [
	{
		slug: 'a',
		title: 'Titel DE',
		titleIsDeFallback: true,
		date: '2026-05-15',
		categoryLabel: 'Feature',
		summary: 'Summary DE',
		summaryIsDeFallback: true
	},
	{
		slug: 'b',
		title: 'Title EN',
		titleIsDeFallback: false,
		date: '2026-04-01',
		categoryLabel: 'Feature',
		summary: 'Summary EN',
		summaryIsDeFallback: false
	}
];

describe('home-updates-teaser.svelte · lang="de"-Fallback (i18n C4d)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('markiert nur Titel und Summary mit Fallback-Flag mit lang="de"', () => {
		overwriteGetLocale(() => 'en');
		render(HomeUpdatesTeaser, { items });
		const rows = document.querySelectorAll('[data-testid="home-updates-teaser"] li');
		const marked = (li: Element): string[] =>
			[...li.querySelectorAll('[lang="de"]')].map((el) => el.textContent?.trim() ?? '');
		expect(marked(rows[0]!)).toEqual(['Titel DE', 'Summary DE']);
		expect(marked(rows[1]!)).toEqual([]);
		expect(rows[1]!.querySelector('[lang]')).toBeNull();
	});

	it('Fallback nur beim Titel markiert nur den Titel', () => {
		overwriteGetLocale(() => 'en');
		render(HomeUpdatesTeaser, {
			items: [{ ...items[1]!, title: 'Titel DE', titleIsDeFallback: true }]
		});
		const marked = [...document.querySelectorAll('[lang="de"]')].map((el) =>
			el.textContent?.trim()
		);
		expect(marked).toEqual(['Titel DE']);
	});
});
