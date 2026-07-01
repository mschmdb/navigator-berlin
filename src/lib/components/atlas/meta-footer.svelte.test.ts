import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import MetaFooter from './meta-footer.svelte';

describe('meta-footer.svelte', () => {
	it('rendert footer mit role=contentinfo', async () => {
		render(MetaFooter, {});
		const footer = page.getByRole('contentinfo');
		await expect.element(footer).toBeInTheDocument();
	});

	it('enthaelt alle 7 Meta-Links (Methodik, Updates, Impressum, Datenschutz, Lizenzen, Architektur, Kontakt)', async () => {
		render(MetaFooter, {});
		for (const name of [
			'Methodik',
			'Updates',
			'Impressum',
			'Datenschutz',
			'Lizenzen',
			'Architektur',
			'Kontakt'
		]) {
			await expect.element(page.getByRole('link', { name })).toBeInTheDocument();
		}
	});

	it('Updates-Link zeigt auf /updates (Story 2.13)', async () => {
		render(MetaFooter, {});
		const link = page.getByRole('link', { name: 'Updates' });
		const el = (await link.element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toBe('/updates');
	});

	it('Methodik-Link zeigt auf /methodik', async () => {
		render(MetaFooter, {});
		const link = page.getByRole('link', { name: 'Methodik' });
		const el = (await link.element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toBe('/methodik');
	});

	it('full-Variant hat Footer-Navigation', async () => {
		render(MetaFooter, {});
		await expect
			.element(page.getByRole('navigation', { name: 'Footer-Navigation' }))
			.toBeInTheDocument();
	});

	it('compact-Variant hat Meta-Navigation', async () => {
		render(MetaFooter, { variant: 'compact' });
		await expect
			.element(page.getByRole('navigation', { name: 'Meta-Navigation' }))
			.toBeInTheDocument();
	});

	it('rendert langSwitcher snippet wenn uebergeben', async () => {
		const langSwitcher = createRawSnippet(() => ({
			render: () => '<span data-testid="lang">DE | EN</span>'
		}));
		render(MetaFooter, { langSwitcher });
		await expect.element(page.getByTestId('lang')).toBeInTheDocument();
	});

	it('zeigt keinen langSwitcher wenn nicht uebergeben', async () => {
		render(MetaFooter, {});
		await expect.element(page.getByTestId('lang')).not.toBeInTheDocument();
	});

	it('MTC-Logo verlinkt auf mtc.berlin mit aria-label + Inline-SVG', async () => {
		render(MetaFooter, {});
		const link = (await page.getByTestId('footer-mtc-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('https://mtc.berlin');
		expect(link.getAttribute('aria-label')).toBe('mtc.berlin');
		expect(link.querySelector('svg')).not.toBeNull();
	});

	it('Kontakt-Link ist mailto', async () => {
		render(MetaFooter, {});
		const link = page.getByRole('link', { name: 'Kontakt' });
		const el = (await link.element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toMatch(/^mailto:/);
	});
});
