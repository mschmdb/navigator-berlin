import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TranslationDisclaimer from './translation-disclaimer.svelte';

describe('TranslationDisclaimer', () => {
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
		expect(el?.getAttribute('data-variant')).toBe('fallback-to-base');
		// lang = URL-Locale (pageLocale), nicht die effektive Content-Locale.
		expect(el?.getAttribute('lang')).toBe('en');
		expect(el?.textContent).toContain(
			'This page is shown in German because the English translation is not yet available.'
		);
	});

	it('rendert Standard-Disclaimer wenn EN-Seite EN-Content liefert', async () => {
		const { container } = render(TranslationDisclaimer, {
			props: { effectiveLocale: 'en', pageLocale: 'en' }
		});
		const el = container.querySelector('[data-testid="translation-disclaimer"]');
		expect(el).not.toBeNull();
		expect(el?.getAttribute('data-variant')).toBe('translated');
		expect(el?.getAttribute('lang')).toBe('en');
		expect(el?.textContent).toContain(
			'Translated from German source. Original DE version remains authoritative.'
		);
	});

	// Texte kommen aus Paraglide-Messages (messages/de.json), nicht aus
	// hartcodiertem Englisch -- Block A zeigt den Disclaimer zwar nie unter
	// pageLocale=de (Master-Source rendert null), aber die Message selbst
	// muss trotzdem für die Basis-Locale existieren + korrekt sein.
	it('Disclaimer-Texte sind über Paraglide-Messages lokalisiert (de-Fassung existiert)', async () => {
		// pageLocale=de rendert nie (Master-Source), also über effectiveLocale
		// !== pageLocale einen anderen Nicht-Basis-Fall simulieren ist hier
		// nicht nötig -- die Locale-Fähigkeit wird stattdessen direkt an der
		// Message-Funktion geprüft.
		const { m } = await import('$lib/paraglide/messages.js');
		expect(m.disclaimer_fallback_to_base(undefined, { locale: 'de' })).toBe(
			'Diese Seite wird auf Deutsch angezeigt, weil die englische Übersetzung noch nicht verfügbar ist.'
		);
		expect(m.disclaimer_translated(undefined, { locale: 'de' })).toBe(
			'Übersetzt aus der deutschen Quelle. Die deutsche Originalversion bleibt maßgeblich.'
		);
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
