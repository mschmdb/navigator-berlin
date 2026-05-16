import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
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
