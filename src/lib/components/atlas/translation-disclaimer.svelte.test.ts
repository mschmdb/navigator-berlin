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

	// Entscheidung Matze 26.09. 21:06 (i18n Block B): eine echt übersetzte
	// Seite (effectiveLocale === pageLocale, z. B. /en/berlin-wahlen) zeigt
	// KEINEN Übersetzungs-Hinweis mehr -- die vormalige `translated`-Variante
	// entfiel ersatzlos, siehe ADR-005.
	it('rendert nichts wenn EN-Seite EN-Content liefert (Block B: kein Hinweis auf übersetzten Seiten)', async () => {
		const { container } = render(TranslationDisclaimer, {
			props: { effectiveLocale: 'en', pageLocale: 'en' }
		});
		expect(container.querySelector('[data-testid="translation-disclaimer"]')).toBeNull();
	});

	// Texte kommen aus einer Paraglide-Message (messages/de.json), nicht aus
	// hartcodiertem Englisch -- Block A zeigt den Disclaimer zwar nie unter
	// pageLocale=de (Master-Source rendert null), aber die Message selbst
	// muss trotzdem für die Basis-Locale existieren + korrekt sein.
	it('Disclaimer-Text ist über eine Paraglide-Message lokalisiert (de-Fassung existiert)', async () => {
		// pageLocale=de rendert nie (Master-Source), also über effectiveLocale
		// !== pageLocale einen anderen Nicht-Basis-Fall simulieren ist hier
		// nicht nötig -- die Locale-Fähigkeit wird stattdessen direkt an der
		// Message-Funktion geprüft.
		const { m } = await import('$lib/paraglide/messages.js');
		expect(m.disclaimer_fallback_to_base(undefined, { locale: 'de' })).toBe(
			'Diese Seite wird auf Deutsch angezeigt, weil die englische Übersetzung noch nicht verfügbar ist.'
		);
	});

	it('rendert optionalen Link auf andere Locale-Variante (Fallback-Fall)', async () => {
		const { container } = render(TranslationDisclaimer, {
			props: {
				effectiveLocale: 'de',
				pageLocale: 'en',
				alternateLocaleHref: '/layer/laerm-2023'
			}
		});
		const link = container.querySelector('[data-testid="translation-disclaimer-alt-link"]');
		expect(link).not.toBeNull();
		expect(link?.getAttribute('href')).toBe('/layer/laerm-2023');
	});

	// Review-Fund: der "Read in German"-Link zeigt immer auf die Basis-Locale
	// -- `hreflang` muss das ebenfalls sagen (N-Locale-faehig: `baseLocale`
	// aus dem Runtime, kein hartcodiertes `'de'`).
	it('der Alt-Link traegt hreflang="de" (Basis-Locale)', async () => {
		const { container } = render(TranslationDisclaimer, {
			props: {
				effectiveLocale: 'de',
				pageLocale: 'en',
				alternateLocaleHref: '/layer/laerm-2023'
			}
		});
		const link = container.querySelector('[data-testid="translation-disclaimer-alt-link"]');
		expect(link?.getAttribute('hreflang')).toBe('de');
	});

	// spec-i18n-teiluebersetzung-banner.md: eine Teil-Route (Rahmen übersetzt,
	// Content noch nicht) zeigt die `partial`-Variante statt `fallback-to-base`
	// -- auch wenn `effectiveLocale !== pageLocale` (Content-Locale bleibt ja
	// bewusst DE, das Register wird für diese Routen NICHT angefasst).
	describe('partial-Variante (Teil-Übersetzungs-Banner)', () => {
		it('rendert partial statt fallback-to-base, wenn partial=true', async () => {
			const { container } = render(TranslationDisclaimer, {
				props: { effectiveLocale: 'de', pageLocale: 'en', partial: true }
			});
			const el = container.querySelector('[data-testid="translation-disclaimer"]');
			expect(el).not.toBeNull();
			expect(el?.getAttribute('data-variant')).toBe('partial');
			expect(el?.textContent).toContain('Some content on this page is only available in German.');
		});

		it('ohne partial-Prop bleibt es beim fallback-to-base-Text (Default false)', async () => {
			const { container } = render(TranslationDisclaimer, {
				props: { effectiveLocale: 'de', pageLocale: 'en' }
			});
			const el = container.querySelector('[data-testid="translation-disclaimer"]');
			expect(el?.getAttribute('data-variant')).toBe('fallback-to-base');
		});

		it('partial=true auf einer echt übersetzten Seite (effectiveLocale === pageLocale) rendert weiterhin nichts', async () => {
			const { container } = render(TranslationDisclaimer, {
				props: { effectiveLocale: 'en', pageLocale: 'en', partial: true }
			});
			expect(container.querySelector('[data-testid="translation-disclaimer"]')).toBeNull();
		});

		it('der "Read in German"-Alt-Link bleibt auch bei partial erhalten', async () => {
			const { container } = render(TranslationDisclaimer, {
				props: {
					effectiveLocale: 'de',
					pageLocale: 'en',
					partial: true,
					alternateLocaleHref: '/kiez/alexanderplatz'
				}
			});
			const link = container.querySelector('[data-testid="translation-disclaimer-alt-link"]');
			expect(link).not.toBeNull();
			expect(link?.textContent).toBe('Read in German');
		});

		it('die DE-Fassung von disclaimer_partial_translation existiert', async () => {
			const { m } = await import('$lib/paraglide/messages.js');
			expect(m.disclaimer_partial_translation(undefined, { locale: 'de' })).toBe(
				'Einzelne Inhalte auf dieser Seite sind nur auf Deutsch verfügbar.'
			);
		});
	});
});
