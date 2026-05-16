import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TranslationDisclaimer from './translation-disclaimer.svelte';

describe('TranslationDisclaimer · Phase-1-Stub', () => {
	it('rendert nichts wenn effectiveLocale === pageLocale (DE-on-DE)', async () => {
		const { container } = render(TranslationDisclaimer, {
			props: { effectiveLocale: 'de', pageLocale: 'de' }
		});
		expect(container.querySelector('[data-testid="translation-disclaimer"]')).toBeNull();
	});

	it('rendert Fallback-Hinweis wenn EN-Seite DE-Content liefert', async () => {
		const { container } = render(TranslationDisclaimer, {
			props: { effectiveLocale: 'de', pageLocale: 'en' }
		});
		const el = container.querySelector('[data-testid="translation-disclaimer"]');
		expect(el).not.toBeNull();
		expect(el?.getAttribute('data-variant')).toBe('en-fallback-to-de');
	});

	it('rendert Standard-Disclaimer wenn EN-Seite EN-Content liefert', async () => {
		const { container } = render(TranslationDisclaimer, {
			props: { effectiveLocale: 'en', pageLocale: 'en' }
		});
		const el = container.querySelector('[data-testid="translation-disclaimer"]');
		expect(el).not.toBeNull();
		expect(el?.getAttribute('data-variant')).toBe('en-translated');
	});

	it('rendert optionalen Link auf andere Locale-Variante', async () => {
		const { container } = render(TranslationDisclaimer, {
			props: {
				effectiveLocale: 'en',
				pageLocale: 'en',
				alternateLocaleHref: '/layer/laerm-2023'
			}
		});
		const link = container.querySelector('[data-testid="translation-disclaimer-alt-link"]');
		expect(link).not.toBeNull();
		expect(link?.getAttribute('href')).toBe('/layer/laerm-2023');
	});
});
