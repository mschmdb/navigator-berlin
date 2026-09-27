import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import EditorialDisclaimer, { DISCLAIMER_TEXTS_DE } from './editorial-disclaimer.svelte';
import type { DisclaimerVariant } from './internal/editorial-types.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('editorial-disclaimer.svelte', () => {
	it('rendert legal-Variant-Text', async () => {
		render(EditorialDisclaimer, { variant: 'legal' });
		const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(el.textContent).toMatch(/Ersetzt keine rechtliche Aussage/);
		expect(el.getAttribute('data-variant')).toBe('legal');
	});

	it('rendert historic-Variant-Text', async () => {
		render(EditorialDisclaimer, { variant: 'historic' });
		const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(el.textContent).toMatch(/Historischer Stand/);
	});

	it('rendert seasonal-Variant-Text mit Mai–Oktober', async () => {
		render(EditorialDisclaimer, { variant: 'seasonal' });
		const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(el.textContent).toMatch(/Mai/);
		expect(el.textContent).toMatch(/Oktober/);
	});

	it('rendert source-Variant-Text', async () => {
		render(EditorialDisclaimer, { variant: 'source' });
		const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(el.textContent).toMatch(/zitierter Quelle|Nicht algorithmisch/);
	});

	it('nutzt Plex-Serif-Italic + text-sm + ink-muted', async () => {
		render(EditorialDisclaimer, { variant: 'legal' });
		const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(el.className).toMatch(/font-serif/);
		expect(el.className).toMatch(/italic/);
		expect(el.className).toMatch(/text-sm/);
		expect(el.className).toMatch(/text-ink-muted/);
	});

	it('rendert sourceUrl als Link wenn übergeben', async () => {
		render(EditorialDisclaimer, {
			variant: 'legal',
			sourceUrl: 'https://www.berlin.de/mietspiegel/'
		});
		const link = (await page.getByTestId('disclaimer-source-link').element()) as HTMLAnchorElement;
		expect(link.href).toBe('https://www.berlin.de/mietspiegel/');
		expect(link.getAttribute('rel')).toMatch(/noopener/);
		expect(link.getAttribute('target')).toBe('_blank');
	});

	it('kein Source-Link wenn sourceUrl fehlt', async () => {
		render(EditorialDisclaimer, { variant: 'legal' });
		await expect.element(page.getByTestId('disclaimer-source-link')).not.toBeInTheDocument();
	});

	it('customText überschreibt Variant-Default', async () => {
		render(EditorialDisclaimer, { variant: 'legal', customText: 'Mein eigener Hinweis.' });
		const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(el.textContent).toMatch(/Mein eigener Hinweis/);
		expect(el.textContent).not.toMatch(/Ersetzt keine rechtliche Aussage/);
	});

	it('id-Prop wird gesetzt für aria-describedby-Verknüpfung', async () => {
		render(EditorialDisclaimer, { variant: 'legal', id: 'disclaimer-mietspiegel' });
		const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(el.id).toBe('disclaimer-mietspiegel');
	});

	describe('Compare-Variants (Story 1.27)', () => {
		it('compare-stolperstein → Erinnerung-Würde-Hinweis', async () => {
			render(EditorialDisclaimer, { variant: 'compare-stolperstein' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/Erinnerung an NS-Opfer/);
			expect(el.textContent).toMatch(/kein Wohn-Bewertungs-Kriterium/);
			expect(el.getAttribute('data-variant')).toBe('compare-stolperstein');
		});

		it('compare-mietspiegel → Wohnlage-ist-keine-Wohnqualität-Hinweis', async () => {
			render(EditorialDisclaimer, { variant: 'compare-mietspiegel' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/Mietspiegel-Wohnlage/);
			expect(el.textContent).toMatch(/Wohnqualität|nicht „schlechter"/);
		});

		it('compare-bodenrichtwerte → ohne-Bewertung-Hinweis', async () => {
			render(EditorialDisclaimer, { variant: 'compare-bodenrichtwerte' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/Bodenrichtwert/);
			expect(el.textContent).toMatch(/ohne Bewertung|Differenz/);
		});

		it('compare-stigma-footer → Aggregat-Hinweis (statistische Mittel)', async () => {
			render(EditorialDisclaimer, { variant: 'compare-stigma-footer' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/Aggregierte Daten|statistische Mittel/);
			expect(el.textContent).toMatch(/individuelle Wohnsituationen/);
		});
	});

	describe('MSS-Variants (Story 1.30)', () => {
		it('mss-aggregat → Aggregat-Hinweis ohne Bewertung', async () => {
			render(EditorialDisclaimer, { variant: 'mss-aggregat' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/Planungsraum|Aggregat/);
			expect(el.textContent).toMatch(/Einzelne Adressen|nicht abgebildet/);
			expect(el.getAttribute('data-variant')).toBe('mss-aggregat');
		});

		it('compare-mss-aggregat → Bewertungs-Schutz-Hinweis', async () => {
			render(EditorialDisclaimer, { variant: 'compare-mss-aggregat' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/Stufe|ohne Bewertung/);
			expect(el.textContent).toMatch(/Niedriger Status|nicht.*schlechter Kiez/i);
		});
	});

	describe('Kiez-Score-Variant (Story 1.28)', () => {
		it('kiez-score-explainer nennt MSS-Anteil + scope-Schnitte', async () => {
			render(EditorialDisclaimer, { variant: 'kiez-score-explainer' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/Umwelt- & Infrastruktur-Score/);
			expect(el.textContent).toMatch(/Sozialstruktur/);
			expect(el.textContent).toMatch(/Bezahlbarkeit/);
			expect(el.getAttribute('data-variant')).toBe('kiez-score-explainer');
		});
	});

	describe('Wahl-Portal-Variant (Story 3, Portal-Skeleton /berlin-wahlen)', () => {
		it('wahl-portal-footnote → deskriptiv-ohne-Ranking-Hinweis', async () => {
			render(EditorialDisclaimer, { variant: 'wahl-portal-footnote' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/deskriptiv/);
			expect(el.textContent).toMatch(/kein Ranking/);
			expect(el.getAttribute('data-variant')).toBe('wahl-portal-footnote');
		});
	});

	// Review-Fund (i18n Block B): `wahl-portal-stimmenanteile` (Wahl-Detail-
	// seite) ist eine EIGENE Variante, getrennt von `wahl-stimmenanteile`
	// (Kiez-Inspector/Compare-Modus) -- beide teilten sich vorher denselben
	// Key, wodurch der Inspector/Compare-Disclaimer auf `/en/...` faelschlich
	// englisch wurde.
	describe('Wahl-Portal-Stimmenanteile-Variant vs. geteilte wahl-stimmenanteile-Variant', () => {
		it('wahl-portal-stimmenanteile (Detailseite) zeigt den korrigierten Briefwahl-Hinweis', async () => {
			render(EditorialDisclaimer, { variant: 'wahl-portal-stimmenanteile' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/anteilig nach Wahlberechtigten geschätzt/);
			expect(el.textContent).not.toMatch(/ausgeschlossen/);
			expect(el.getAttribute('data-variant')).toBe('wahl-portal-stimmenanteile');
		});

		it('wahl-stimmenanteile (Inspector/Compare, Story 17) nennt Briefstimmen als enthalten und den Kiez-Wert als Schätzung', async () => {
			render(EditorialDisclaimer, { variant: 'wahl-stimmenanteile' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/Briefstimmen sind auf allen Ebenen enthalten/);
			expect(el.textContent).toMatch(/Briefwahl-Gruppe/);
			expect(el.textContent).toMatch(/Schätzung, keine amtliche Aufteilung/);
			expect(el.textContent).not.toMatch(/ausgeschlossen/);
			expect(el.getAttribute('data-variant')).toBe('wahl-stimmenanteile');
		});
	});

	// spec-i18n-teiluebersetzung-banner.md: `wahl-stimmenanteile` lief bis
	// hierher hart ueber `DISCLAIMER_TEXTS_DE`, jetzt ueber eine eigene
	// Message (`disclaimer_wahl_stimmenanteile`) -- DE-Wortlaut bleibt Zeichen
	// fuer Zeichen wie oben (Story 17 / `main` a253e14), EN kommt neu dazu.
	describe('i18n Teil-Übersetzung (Block B): wahl-stimmenanteile EN, kein lang-Override', () => {
		it('wahl-stimmenanteile zeigt auf EN-Locale den englischen Text, gleiche Fakten wie DE', async () => {
			overwriteGetLocale(() => 'en');
			render(EditorialDisclaimer, { variant: 'wahl-stimmenanteile' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/Postal votes are included at every level/);
			expect(el.textContent).toMatch(/postal-vote group/);
			expect(el.textContent).toMatch(/an estimate, not an official breakdown/);
			expect(el.getAttribute('lang')).toBeNull();
		});

		it('customText bekommt KEIN lang-Override auf EN-Locale', async () => {
			overwriteGetLocale(() => 'en');
			render(EditorialDisclaimer, { variant: 'legal', customText: 'My own note.' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.getAttribute('lang')).toBeNull();
		});
	});

	// i18n Block C1: die vormals hart deutschen 16 Varianten (vorher
	// `DISCLAIMER_TEXTS_DE`) laufen jetzt ebenfalls ueber Paraglide-Messages.
	// Kein `lang="de"`-Override mehr noetig (Boundary Spec i18n C1: "ohne
	// lang=de" auf `/en/explore`), weil nichts mehr hart deutsch ist.
	describe('i18n Block C1: vormals DISCLAIMER_TEXTS_DE-Varianten sind jetzt uebersetzt', () => {
		it('legal zeigt auf EN-Locale den englischen Text ohne lang-Override', async () => {
			overwriteGetLocale(() => 'en');
			render(EditorialDisclaimer, { variant: 'legal' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/Not legal advice/);
			expect(el.getAttribute('lang')).toBeNull();
		});

		it('legal zeigt auf DE-Locale weiterhin den unveraenderten DE-Text ohne lang-Attribut', async () => {
			render(EditorialDisclaimer, { variant: 'legal' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/Ersetzt keine rechtliche Aussage/);
			expect(el.getAttribute('lang')).toBeNull();
		});

		it('kuehle-orte zeigt auf EN-Locale den englischen Text', async () => {
			overwriteGetLocale(() => 'en');
			render(EditorialDisclaimer, { variant: 'kuehle-orte' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/not a replacement for public authorities/);
			expect(el.getAttribute('lang')).toBeNull();
		});

		it('"Quelle ansehen" ist auf EN-Locale "View source", ohne eigenes lang-Attribut', async () => {
			overwriteGetLocale(() => 'en');
			render(EditorialDisclaimer, {
				variant: 'legal',
				sourceUrl: 'https://example.invalid/quelle'
			});
			const label = page.getByTestId('disclaimer-source-link').getByText('View source');
			await expect.element(label).toBeInTheDocument();
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.getAttribute('lang')).toBeNull();
		});

		it('"Quelle ansehen" bleibt auf DE-Locale unveraendert', async () => {
			render(EditorialDisclaimer, {
				variant: 'legal',
				sourceUrl: 'https://example.invalid/quelle'
			});
			const label = page.getByTestId('disclaimer-source-link').getByText('Quelle ansehen');
			await expect.element(label).toBeInTheDocument();
		});
	});

	// Review-Fund (i18n Block C1): Blanket-Probe ueber ALLE 19 Varianten statt
	// nur Stichproben -- DE-Text muss exakt `DISCLAIMER_TEXTS_DE[variant]`
	// entsprechen (Boundary: "DE unveraendert"), EN-Text muss nicht-leer sein
	// und sich von DE unterscheiden.
	describe('i18n Block C1 Review-Fund: alle Varianten, DE exakt + EN nicht-leer/unterschiedlich', () => {
		const ALL_VARIANTS = Object.keys(DISCLAIMER_TEXTS_DE) as DisclaimerVariant[];

		it.each(ALL_VARIANTS)(
			'%s: DE-Text === DISCLAIMER_TEXTS_DE, EN-Text nicht-leer und != DE',
			async (variant) => {
				const deRender = render(EditorialDisclaimer, { variant });
				const deEl = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
				const deText = deEl.textContent?.trim();
				expect(deText, `${variant}: DE-Text`).toBe(DISCLAIMER_TEXTS_DE[variant]);
				deRender.unmount();

				overwriteGetLocale(() => 'en');
				const enRender = render(EditorialDisclaimer, { variant });
				const enEl = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
				const enText = enEl.textContent?.trim();
				expect(enText, `${variant}: EN-Text ist leer`).not.toBe('');
				expect(enText, `${variant}: EN-Text == DE-Text`).not.toBe(deText);
				enRender.unmount();
			}
		);
	});

	// Review-Fund (i18n Block C1): unbekannter Variant-Wert (z.B. Laufzeit-Daten
	// statt des TS-Unions) rendert leeren Text statt zu werfen.
	describe('i18n Block C1 Review-Fund: unbekannte Variante', () => {
		it('rendert leeren Text statt zu werfen, wenn DISCLAIMER_MESSAGE[variant] fehlt', async () => {
			const unknownVariant = 'does-not-exist' as unknown as DisclaimerVariant;
			expect(() => render(EditorialDisclaimer, { variant: unknownVariant })).not.toThrow();
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent?.trim()).toBe('');
		});
	});
});
