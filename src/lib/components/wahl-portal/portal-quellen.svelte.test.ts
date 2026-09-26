import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import PortalQuellen from './portal-quellen.svelte';

describe('PortalQuellen', () => {
	it('rendert das Disclosure geschlossen mit Trigger-Text', async () => {
		render(PortalQuellen, { quellen: [] });
		await expect.element(page.getByTestId('portal-quellen-trigger')).toBeInTheDocument();
		await expect.element(page.getByTestId('portal-quellen-methodik-link')).toBeInTheDocument();
		await expect.element(page.getByTestId('portal-quellen-lizenzen-link')).toBeInTheDocument();
	});

	it('öffnet per Klick und listet Quelle+Lizenz', async () => {
		render(PortalQuellen, {
			quellen: [{ name: 'Bundeswahlleiterin', license: 'dl-de/by-2-0' }]
		});
		await page.getByTestId('portal-quellen-trigger').click();
		await expect
			.element(page.getByTestId('portal-quellen-item-Bundeswahlleiterin'))
			.toHaveTextContent('Datenlizenz Deutschland Namensnennung 2.0');
	});

	// Review-Fund (i18n Block B): Lizenz-Anzeige geht jetzt über
	// `licenseDisplayLabel` (ausgeschriebener Name statt Rohcode); das
	// API-Feld selbst (`quelle.license`) bleibt unveraendert.
	it('EN: zeigt den ausgeschriebenen Lizenz-Namen statt des Rohcodes', async () => {
		const { overwriteGetLocale } = await import('$lib/paraglide/runtime');
		overwriteGetLocale(() => 'en');
		try {
			render(PortalQuellen, {
				quellen: [{ name: 'Bundeswahlleiterin', license: 'dl-de/by-2-0' }]
			});
			await page.getByTestId('portal-quellen-trigger').click();
			await expect
				.element(page.getByTestId('portal-quellen-item-Bundeswahlleiterin'))
				.toHaveTextContent('Data licence Germany, attribution, version 2.0');
		} finally {
			overwriteGetLocale(() => 'de');
		}
	});

	it('zeigt Leer-Hinweis ohne Quellen', async () => {
		render(PortalQuellen, { quellen: [] });
		await page.getByTestId('portal-quellen-trigger').click();
		await expect.element(page.getByTestId('portal-quellen-empty')).toBeInTheDocument();
	});

	it('Links zeigen auf /methodik/wahldaten und /lizenzen', async () => {
		render(PortalQuellen, { quellen: [] });
		const methodik = (await page
			.getByTestId('portal-quellen-methodik-link')
			.element()) as HTMLAnchorElement;
		const lizenzen = (await page
			.getByTestId('portal-quellen-lizenzen-link')
			.element()) as HTMLAnchorElement;
		expect(methodik.getAttribute('href')).toBe('/methodik/wahldaten');
		expect(lizenzen.getAttribute('href')).toBe('/lizenzen');
	});
});
