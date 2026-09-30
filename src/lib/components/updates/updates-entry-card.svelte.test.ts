import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import UpdatesEntryCard from './updates-entry-card.svelte';
import type { UpdateEntry } from '$lib/content/updates/types.js';

const entry: UpdateEntry = {
	slug: 'launch',
	filePath: '/_content/updates/2026-05-15-launch.md',
	frontmatter: {
		title_de: 'Launch · Test',
		summary_de: 'Erster Eintrag.',
		date: '2026-05-15',
		category: 'feature',
		lang: 'de'
	},
	body: 'Body'
};

describe('updates-entry-card.svelte', () => {
	it('rendert Title als h2', async () => {
		render(UpdatesEntryCard, { entry });
		await expect.element(page.getByRole('heading', { level: 2 })).toBeInTheDocument();
		await expect.element(page.getByText('Launch · Test')).toBeInTheDocument();
	});

	it('rendert formatiertes Datum', async () => {
		render(UpdatesEntryCard, { entry });
		await expect.element(page.getByText('15. Mai 2026')).toBeInTheDocument();
	});

	it('rendert Category-Badge mit Label', async () => {
		render(UpdatesEntryCard, { entry });
		const badge = page.getByTestId('category-badge');
		await expect.element(badge).toBeInTheDocument();
		await expect.element(badge).toHaveTextContent('Feature');
	});

	it('Detail-Link zeigt auf /updates/{slug}', async () => {
		render(UpdatesEntryCard, { entry });
		const link = page.getByTestId('entry-link');
		const el = (await link.element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toBe('/updates/launch');
	});

	it('rendert Summary', async () => {
		render(UpdatesEntryCard, { entry });
		await expect.element(page.getByText('Erster Eintrag.')).toBeInTheDocument();
	});
});

describe('updates-entry-card.svelte · DE-Wortlaut (i18n C4d)', () => {
	it('zeigt Mehr-lesen-Link, Datum und Badge auf Deutsch ohne lang-Attribute', async () => {
		render(UpdatesEntryCard, { entry });
		const card = document.querySelector('[data-testid="updates-entry-card"]')!;
		expect(card.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'15. Mai 2026 Feature Launch · Test Erster Eintrag. Mehr lesen'
		);
		expect(card.querySelector('[lang]')).toBeNull();
	});
});

describe('updates-entry-card.svelte · EN (i18n C4d)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	const enEntry: UpdateEntry = {
		...entry,
		frontmatter: { ...entry.frontmatter, title_en: 'Launch test', summary_en: 'First entry.' },
		bodyEn: 'English body.'
	};

	it('zeigt Titel, Summary, Datum, Badge, Link und Mehr-lesen englisch', () => {
		overwriteGetLocale(() => 'en');
		render(UpdatesEntryCard, { entry: enEntry });
		const card = document.querySelector('[data-testid="updates-entry-card"]')!;
		expect(card.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'15 May 2026 Feature Launch test First entry. Read more'
		);
		expect(card.querySelector('[lang]')).toBeNull();
		for (const a of card.querySelectorAll('a')) {
			expect(a.getAttribute('href')).toBe('/en/updates/launch');
		}
	});

	it('Eintrag ohne EN-Felder: DE-Titel und DE-Summary tragen lang="de"', () => {
		overwriteGetLocale(() => 'en');
		render(UpdatesEntryCard, { entry });
		const card = document.querySelector('[data-testid="updates-entry-card"]')!;
		expect(card.querySelector('h2')?.getAttribute('lang')).toBe('de');
		expect(card.querySelector('p[lang="de"]')?.textContent?.trim()).toBe('Erster Eintrag.');
		expect(card.querySelectorAll('[lang]')).toHaveLength(2);
	});

	it('nur Titel übersetzt: nur die Summary trägt lang="de"', () => {
		overwriteGetLocale(() => 'en');
		const partial: UpdateEntry = {
			...entry,
			frontmatter: { ...entry.frontmatter, title_en: 'Launch test' }
		};
		render(UpdatesEntryCard, { entry: partial });
		const card = document.querySelector('[data-testid="updates-entry-card"]')!;
		expect(card.querySelector('h2')?.hasAttribute('lang')).toBe(false);
		expect(card.querySelectorAll('[lang="de"]')).toHaveLength(1);
	});
});
