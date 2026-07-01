import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import KuehleOrteCard from './kuehle-orte-card.svelte';

describe('kuehle-orte-card.svelte', () => {
	it('Detail-Bereich zeigt einen Opt-out-Mailto-Link mit aria-label (Review-Fix)', async () => {
		render(KuehleOrteCard, { layerName: 'Kühle Orte', address: null, index: null });
		await page.getByTestId('card-details-toggle').click();
		const link = (await page.getByTestId('card-opt-out').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')?.startsWith('mailto:')).toBe(true);
		expect(link.getAttribute('aria-label')).toBeTruthy();
	});
});
