import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ErrorFeedbackMailto from './error-feedback-mailto.svelte';

describe('error-feedback-mailto.svelte', () => {
	it('rendert "Fehler im Eintrag?"-Text', async () => {
		render(ErrorFeedbackMailto, { layerSlug: 'x', layerName: 'X' });
		const a = (await page.getByTestId('error-feedback-mailto').element()) as HTMLAnchorElement;
		expect(a.textContent).toMatch(/Fehler im Eintrag/);
	});

	it('href startet mit mailto:hey@navigator.berlin', async () => {
		render(ErrorFeedbackMailto, { layerSlug: 'x', layerName: 'X' });
		const a = (await page.getByTestId('error-feedback-mailto').element()) as HTMLAnchorElement;
		expect(a.getAttribute('href')).toMatch(/^mailto:hey@navigator\.berlin/);
	});

	it('href enthält Layer-Subject URL-encoded', async () => {
		render(ErrorFeedbackMailto, {
			layerSlug: 'mietspiegel-wohnlage',
			layerName: 'Mietspiegel Wohnlage'
		});
		const a = (await page.getByTestId('error-feedback-mailto').element()) as HTMLAnchorElement;
		expect(a.getAttribute('href')).toContain(
			'subject=Fehler%20im%20Eintrag%3A%20Mietspiegel%20Wohnlage'
		);
	});

	it('Body enthält displayName + lat/lng wenn Props gesetzt', async () => {
		render(ErrorFeedbackMailto, {
			layerSlug: 'mietspiegel-wohnlage',
			layerName: 'Mietspiegel',
			displayName: 'Boxhagener Straße 12',
			lat: 52.5,
			lng: 13.4,
			fetchedAt: '2024-09-15',
			sourceUrl: 'https://example.org'
		});
		const a = (await page.getByTestId('error-feedback-mailto').element()) as HTMLAnchorElement;
		const decoded = decodeURIComponent(a.getAttribute('href') ?? '');
		expect(decoded).toContain('Adresse: Boxhagener Straße 12');
		expect(decoded).toContain('Lat,Lng: 52.5,13.4');
		expect(decoded).toContain('Datenstand: 2024-09-15');
		expect(decoded).toContain('Quelle: https://example.org');
	});

	it('Lucide Mail-Icon vorhanden', async () => {
		render(ErrorFeedbackMailto, { layerSlug: 'x', layerName: 'X' });
		const link = (await page.getByTestId('error-feedback-mailto').element()) as HTMLElement;
		expect(link.querySelector('svg')).not.toBeNull();
	});

	it('Tertiary-Link-Style accent + underline + text-sm + font-sans', async () => {
		render(ErrorFeedbackMailto, { layerSlug: 'x', layerName: 'X' });
		const a = (await page.getByTestId('error-feedback-mailto').element()) as HTMLElement;
		expect(a.className).toMatch(/text-accent/);
		expect(a.className).toMatch(/underline/);
		expect(a.className).toMatch(/text-sm/);
		expect(a.className).toMatch(/font-sans/);
	});

	it('aria-label beschreibt Layer-Kontext', async () => {
		render(ErrorFeedbackMailto, { layerSlug: 'x', layerName: 'Mietspiegel' });
		const a = (await page.getByTestId('error-feedback-mailto').element()) as HTMLElement;
		expect(a.getAttribute('aria-label')).toMatch(/Fehler.+Mietspiegel.+melden/);
	});
});
