import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import SkipLink from './skip-link.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

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

	// i18n Block B2, Entscheidung 1A: Shell (inkl. Skip-Link) ist auf JEDER
	// /en-Seite englisch, auch auf nicht uebersetzten -- kein DE-Default-Prop
	// wie bei den geteilten Content-Bausteinen (address-search, KiezScoreRing).
	it('EN: rendert den englischen Default-Text ohne explizites Prop', async () => {
		overwriteGetLocale(() => 'en');
		render(SkipLink, {});
		const link = page.getByRole('link', { name: 'Skip to main content' });
		await expect.element(link).toBeInTheDocument();
	});
});
