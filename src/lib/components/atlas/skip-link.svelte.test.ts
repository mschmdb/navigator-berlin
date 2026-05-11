import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SkipLink from './skip-link.svelte';

describe('skip-link.svelte', () => {
	it('rendert als <a href="#main"> mit deutschem Default-Label', async () => {
		render(SkipLink, {});
		const link = page.getByRole('link', { name: 'Zum Hauptinhalt springen' });
		await expect.element(link).toBeInTheDocument();
		const el = (await link.element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toBe('#main');
	});

	it('hat sr-only Default + focus-visible:not-sr-only', async () => {
		render(SkipLink, {});
		const link = page.getByRole('link');
		const el = (await link.element()) as HTMLAnchorElement;
		expect(el.className).toMatch(/sr-only/);
		expect(el.className).toMatch(/focus-visible:not-sr-only/);
	});

	it('hat outline-focus-Ring fuer Focus-Visible-State', async () => {
		render(SkipLink, {});
		const el = (await page.getByRole('link').element()) as HTMLAnchorElement;
		expect(el.className).toMatch(/focus-visible:outline-focus/);
	});
});
