import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import EditorialDisclaimer from './editorial-disclaimer.svelte';

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
	describe('i18n Teil-Übersetzung: wahl-stimmenanteile + lang="de" an DISCLAIMER_TEXTS_DE-Varianten', () => {
		it('wahl-stimmenanteile zeigt auf EN-Locale den englischen Text, gleiche Fakten wie DE', async () => {
			overwriteGetLocale(() => 'en');
			render(EditorialDisclaimer, { variant: 'wahl-stimmenanteile' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.textContent).toMatch(/Postal votes are included at every level/);
			expect(el.textContent).toMatch(/postal-vote group/);
			expect(el.textContent).toMatch(/an estimate, not an official breakdown/);
			expect(el.getAttribute('lang')).toBeNull();
		});

		it('eine DISCLAIMER_TEXTS_DE-Variante (z. B. legal) bekommt lang="de" auf EN-Locale', async () => {
			overwriteGetLocale(() => 'en');
			render(EditorialDisclaimer, { variant: 'legal' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.getAttribute('lang')).toBe('de');
		});

		it('dieselbe Variante hat auf DE-Locale KEIN lang-Attribut', async () => {
			render(EditorialDisclaimer, { variant: 'legal' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.getAttribute('lang')).toBeNull();
		});

		it('lokalisierte Varianten (wahl-portal-footnote, wahl-portal-stimmenanteile, wahl-stimmenanteile) bekommen KEIN lang="de" auf EN', async () => {
			overwriteGetLocale(() => 'en');
			const footnoteRender = render(EditorialDisclaimer, { variant: 'wahl-portal-footnote' });
			const footnote = footnoteRender.container.querySelector(
				'[data-testid="editorial-disclaimer"]'
			);
			expect(footnote?.getAttribute('lang')).toBeNull();

			const stimmenanteileRender = render(EditorialDisclaimer, {
				variant: 'wahl-portal-stimmenanteile'
			});
			const stimmenanteile = stimmenanteileRender.container.querySelector(
				'[data-testid="editorial-disclaimer"]'
			);
			expect(stimmenanteile?.getAttribute('lang')).toBeNull();

			const wahlStimmenanteileRender = render(EditorialDisclaimer, {
				variant: 'wahl-stimmenanteile'
			});
			const wahlStimmenanteile = wahlStimmenanteileRender.container.querySelector(
				'[data-testid="editorial-disclaimer"]'
			);
			expect(wahlStimmenanteile?.getAttribute('lang')).toBeNull();
		});

		// Review-Fund: "Quelle ansehen" ist hartcodiertes Deutsch, unabhaengig
		// von `variant` -- auf einer lokalisierten Variante (Absatz selbst hat
		// kein `lang="de"`) braucht das Label ein eigenes `lang="de"`.
		it('"Quelle ansehen" bekommt lang="de" auf einer lokalisierten Variante unter EN, der Absatz selbst nicht', async () => {
			overwriteGetLocale(() => 'en');
			render(EditorialDisclaimer, {
				variant: 'wahl-portal-footnote',
				sourceUrl: 'https://example.invalid/quelle'
			});
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.getAttribute('lang')).toBeNull();
			const label = el.querySelector('[data-testid="disclaimer-source-link"] span');
			expect(label?.getAttribute('lang')).toBe('de');
		});

		it('"Quelle ansehen" bekommt lang="de" bei customText unter EN', async () => {
			overwriteGetLocale(() => 'en');
			render(EditorialDisclaimer, {
				variant: 'legal',
				customText: 'My own note.',
				sourceUrl: 'https://example.invalid/quelle'
			});
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.getAttribute('lang')).toBeNull();
			const label = el.querySelector('[data-testid="disclaimer-source-link"] span');
			expect(label?.getAttribute('lang')).toBe('de');
		});

		it('"Quelle ansehen" hat KEIN eigenes lang, wenn der Absatz schon lang="de" traegt (DISCLAIMER_TEXTS_DE auf EN)', async () => {
			overwriteGetLocale(() => 'en');
			render(EditorialDisclaimer, {
				variant: 'legal',
				sourceUrl: 'https://example.invalid/quelle'
			});
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.getAttribute('lang')).toBe('de');
			const label = el.querySelector('[data-testid="disclaimer-source-link"] span');
			expect(label?.getAttribute('lang')).toBeNull();
		});

		it('customText bekommt KEIN lang-Override auf EN-Locale', async () => {
			overwriteGetLocale(() => 'en');
			render(EditorialDisclaimer, { variant: 'legal', customText: 'My own note.' });
			const el = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
			expect(el.getAttribute('lang')).toBeNull();
		});
	});
});
