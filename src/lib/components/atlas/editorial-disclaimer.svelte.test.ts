import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import EditorialDisclaimer from './editorial-disclaimer.svelte';

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
			expect(el.textContent).toMatch(/Kiez-Score/);
			expect(el.textContent).toMatch(/Soziale Lage/);
			expect(el.textContent).toMatch(/Bezahlbarkeit/);
			expect(el.getAttribute('data-variant')).toBe('kiez-score-explainer');
		});
	});
});
