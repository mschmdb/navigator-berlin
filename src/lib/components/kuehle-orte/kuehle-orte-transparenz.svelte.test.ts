import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import KuehleOrteTransparenz from './kuehle-orte-transparenz.svelte';

describe('KuehleOrteTransparenz (Story 16.4)', () => {
	it('rendert die drei Quellen-Namen', async () => {
		render(KuehleOrteTransparenz);
		await expect.element(page.getByText('OpenStreetMap', { exact: true })).toBeInTheDocument();
		await expect
			.element(page.getByText('Redaktionelle Anreicherung', { exact: true }))
			.toBeInTheDocument();
		await expect
			.element(page.getByText('Deutscher Wetterdienst', { exact: true }))
			.toBeInTheDocument();
	});

	it('verlinkt /lizenzen für die volle Lizenz-Übersicht', async () => {
		render(KuehleOrteTransparenz);
		const link = (await page.getByTestId('transparenz-lizenzen-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toContain('/lizenzen');
	});

	it('Opt-out-Link ist mailto mit aria-label', async () => {
		render(KuehleOrteTransparenz);
		const link = (await page.getByTestId('kuehle-orte-opt-out').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')?.startsWith('mailto:')).toBe(true);
		expect(link.getAttribute('aria-label')).toBeTruthy();
	});
});
