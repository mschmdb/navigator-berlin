import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import MetaFooter from './meta-footer.svelte';
import { META_LINKS, META_LINK_GROUPS, metaLinkLabel } from './internal/meta-links.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

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

// i18n Block B2, Entscheidung 1A: Shell (Footer) ist auf jeder /en-Seite
// englisch, auch auf nicht uebersetzten. Datenschluessel bleibt `group.id`
// ('sonstiges'), nicht der (jetzt englische) Titel-Text.
describe('meta-footer.svelte · EN', () => {
	it('enthaelt alle 7 Meta-Links englisch + lokalisierte Ziele', async () => {
		overwriteGetLocale(() => 'en');
		render(MetaFooter, {});
		for (const name of [
			'Methodology',
			'Updates',
			'Legal notice',
			'Privacy',
			'Licences',
			'Architecture',
			'Contact'
		]) {
			await expect.element(page.getByRole('link', { name })).toBeInTheDocument();
		}
		const methodik = page.getByRole('link', { name: 'Methodology' });
		const el = (await methodik.element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toBe('/en/methodik');
	});

	it('Kontakt-Link (EN: Contact) bleibt mailto', async () => {
		overwriteGetLocale(() => 'en');
		render(MetaFooter, {});
		const link = page.getByRole('link', { name: 'Contact' });
		const el = (await link.element()) as HTMLAnchorElement;
		expect(el.getAttribute('href')).toMatch(/^mailto:/);
	});

	it('Footer-Navigation-Gruppentitel sind englisch', async () => {
		overwriteGetLocale(() => 'en');
		render(MetaFooter, {});
		await expect.element(page.getByText('Explore')).toBeInTheDocument();
		await expect.element(page.getByText('Transparency')).toBeInTheDocument();
		await expect.element(page.getByText('Other')).toBeInTheDocument();
	});

	// Review-Fund: Loop über ALLE META_LINKS statt Stichprobe -- deckt auch
	// "Elections"/"Cool places during heat" ab, die vorher in keinem Test
	// vorkamen.
	it('compact-Variant: jeder META_LINKS-Eintrag ist englisch + zeigt auf /en/…', async () => {
		overwriteGetLocale(() => 'en');
		render(MetaFooter, { variant: 'compact' });
		for (const link of META_LINKS) {
			const label = metaLinkLabel(link.id, { locale: 'en' });
			const el = (await page.getByRole('link', { name: label }).element()) as HTMLAnchorElement;
			expect(el.getAttribute('href')).toBe(`/en${link.href}`);
		}
	});

	// Review-Fund: Full-Variante inkl. "Atlas" (nur in META_LINK_GROUPS, nicht
	// in der flachen META_LINKS-Liste -- vorher ungetestet).
	it('full-Variant: jeder META_LINK_GROUPS-Eintrag (inkl. "Atlas") ist englisch + zeigt auf /en/…', async () => {
		overwriteGetLocale(() => 'en');
		render(MetaFooter, {});
		for (const group of META_LINK_GROUPS) {
			for (const link of group.links) {
				const label = metaLinkLabel(link.id, { locale: 'en' });
				const el = (await page.getByRole('link', { name: label }).element()) as HTMLAnchorElement;
				expect(el.getAttribute('href')).toBe(`/en${link.href}`);
			}
		}
	});
});
