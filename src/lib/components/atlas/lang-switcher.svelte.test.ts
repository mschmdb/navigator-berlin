import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import LangSwitcher from './lang-switcher.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('LangSwitcher', () => {
	it('marks the current locale as aria-current text (not a link)', async () => {
		overwriteGetLocale(() => 'de');
		const { container } = render(LangSwitcher, { props: { currentPath: '/kiez/mitte' } });
		const current = container.querySelector('[data-testid="lang-switcher-current"]');
		expect(current).not.toBeNull();
		expect(current?.getAttribute('aria-current')).toBe('true');
		expect(current?.getAttribute('lang')).toBe('de');
	});

	it('renders every other locale as a full-reload link to the same path', async () => {
		overwriteGetLocale(() => 'de');
		const { container } = render(LangSwitcher, { props: { currentPath: '/kiez/mitte' } });
		const links = Array.from(
			container.querySelectorAll('[data-testid="lang-switcher-link"]')
		) as HTMLAnchorElement[];
		expect(links).toHaveLength(1);
		const enLink = links[0];
		expect(enLink.getAttribute('data-locale')).toBe('en');
		expect(enLink.getAttribute('lang')).toBe('en');
		expect(enLink.getAttribute('href')).toBe('/en/kiez/mitte');
		expect(enLink.hasAttribute('data-sveltekit-reload')).toBe(true);
	});

	it('link text is in the target language (Intl.DisplayNames)', async () => {
		overwriteGetLocale(() => 'de');
		const { container } = render(LangSwitcher, { props: { currentPath: '/' } });
		const enLink = container.querySelector('[data-testid="lang-switcher-link"]');
		expect(enLink?.textContent?.trim()).toBe('English');
	});

	it('flips current/link when the active locale is en', async () => {
		overwriteGetLocale(() => 'en');
		const { container } = render(LangSwitcher, { props: { currentPath: '/en/kiez/mitte' } });
		const current = container.querySelector('[data-testid="lang-switcher-current"]');
		expect(current?.getAttribute('lang')).toBe('en');
		const link = container.querySelector(
			'[data-testid="lang-switcher-link"]'
		) as HTMLAnchorElement | null;
		expect(link?.getAttribute('data-locale')).toBe('de');
		expect(link?.getAttribute('href')).toBe('/kiez/mitte');
	});

	it('the current-locale item carries an sr-only "current language" hint (Paraglide message)', async () => {
		overwriteGetLocale(() => 'de');
		const { container } = render(LangSwitcher, { props: { currentPath: '/kiez/mitte' } });
		const current = container.querySelector('[data-testid="lang-switcher-current"]');
		expect(current?.textContent).toContain('Aktuelle Sprache');
	});

	it('the sr-only hint is localized (en → "Current language")', async () => {
		overwriteGetLocale(() => 'en');
		const { container } = render(LangSwitcher, { props: { currentPath: '/en/kiez/mitte' } });
		const current = container.querySelector('[data-testid="lang-switcher-current"]');
		expect(current?.textContent).toContain('Current language');
	});

	// WCAG code review (2026-09-26): header/drawer and footer would otherwise
	// both render an identically-named <nav>, duplicating the landmark.
	describe('landmark prop', () => {
		it('default (true): renders a <nav> with a localized aria-label ("Sprache")', async () => {
			overwriteGetLocale(() => 'de');
			const { container } = render(LangSwitcher, { props: { currentPath: '/' } });
			const nav = container.querySelector('nav[data-testid="lang-switcher"]');
			expect(nav).not.toBeNull();
			expect(nav?.getAttribute('aria-label')).toBe('Sprache');
		});

		it('aria-label is localized to en ("Language")', async () => {
			overwriteGetLocale(() => 'en');
			const { container } = render(LangSwitcher, { props: { currentPath: '/en' } });
			const nav = container.querySelector('nav[data-testid="lang-switcher"]');
			expect(nav?.getAttribute('aria-label')).toBe('Language');
		});

		it('landmark=false: renders a plain <div>, no nav landmark, no aria-label', async () => {
			overwriteGetLocale(() => 'de');
			const { container } = render(LangSwitcher, {
				props: { currentPath: '/', landmark: false }
			});
			expect(container.querySelector('nav')).toBeNull();
			const wrapper = container.querySelector('[data-testid="lang-switcher"]');
			expect(wrapper?.tagName).toBe('DIV');
			expect(wrapper?.hasAttribute('aria-label')).toBe(false);
			// Links/current-item still render normally inside the non-landmark wrapper.
			expect(wrapper?.querySelector('[data-testid="lang-switcher-link"]')).not.toBeNull();
		});
	});

	// Security: a "//"-prefixed currentPath must never make the link resolve
	// against a foreign origin (code review, 2026-09-26).
	it('collapses a "//"-prefixed currentPath so the href never becomes protocol-relative', async () => {
		overwriteGetLocale(() => 'de');
		const { container } = render(LangSwitcher, {
			props: { currentPath: '//evil.example' }
		});
		const link = container.querySelector(
			'[data-testid="lang-switcher-link"]'
		) as HTMLAnchorElement | null;
		const href = link?.getAttribute('href') ?? '';
		expect(href.startsWith('//')).toBe(false);
		expect(href.startsWith('/')).toBe(true);
	});
});
