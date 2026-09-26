import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Page from './+page.svelte';

describe('Hitze-Home (Spin-off-Route)', () => {
	it('hat genau ein h1 mit dem Hitze-Titel', async () => {
		render(Page, { data: { warning: null } });
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent('Hitze-Navigator Berlin');
	});

	it('CTA führt auf den Kühle-Orte-Explorer-Deep-Link', async () => {
		render(Page, { data: { warning: null } });
		await expect
			.element(page.getByTestId('hitze-cta'))
			.toHaveAttribute('href', '/explore?layers=kuehle-orte&mode=hitze');
	});

	it('gerenderter Text enthält keine em-dashes (U+2014)', async () => {
		render(Page, { data: { warning: null } });
		const text = (await page.getByTestId('hitze-landing').element()).textContent ?? '';
		expect(text.includes('—')).toBe(false);
	});

	// i18n Block B2 Review-Fund: die Hitze-Subdomain rerouted `/` intern auf
	// diese Seite, ohne die URL zu ändern (`page.url.pathname` bleibt `/`).
	// `/` ist seit i18n Block B2 für `en` registriert (Startseite) -- SeoHead
	// muss hier trotzdem den LOGISCHEN Pfad `/hitze` verwenden (nicht
	// übersetzt), sonst würde diese inhaltlich andere Seite fälschlich einen
	// `en`-hreflang-Alternate bekommen.
	it('hreflang-Cluster übernimmt NICHT die Home-Registrierung von "/" (kein en-Alternate)', async () => {
		render(Page, { data: { warning: null } });
		await new Promise((r) => setTimeout(r, 20));
		expect(document.head.querySelector('link[rel="alternate"][hreflang="en"]')).toBeNull();
	});
});
