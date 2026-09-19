import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import KapitelSection from './kapitel-section.svelte';
import KapitelSectionWithTakeawayProbe from './internal/kapitel-section-takeaway-probe.svelte';

describe('KapitelSection', () => {
	it('rendert section mit id, aria-labelledby und h2-Überschrift', async () => {
		render(KapitelSection, { id: 'karte', title: 'Karte', testid: 'wahl-portal-chapter-karte' });
		const section = page.getByTestId('wahl-portal-chapter-karte');
		await expect.element(section).toBeInTheDocument();
		const el = (await section.element()) as HTMLElement;
		expect(el.id).toBe('karte');
		expect(el.getAttribute('aria-labelledby')).toBe('karte-h');
		await expect
			.element(page.getByRole('heading', { level: 2, name: 'Karte' }))
			.toBeInTheDocument();
	});

	it('rendert ohne takeaway/children-Snippet keinen Takeaway-Block', async () => {
		render(KapitelSection, { id: 'x', title: 'X', testid: 'x-section' });
		const takeaway = page.getByTestId('x-section-takeaway');
		await expect.element(takeaway).not.toBeInTheDocument();
	});

	it('rendert Takeaway- und Content-Snippet wenn übergeben', async () => {
		render(KapitelSectionWithTakeawayProbe);
		await expect.element(page.getByTestId('probe-section-takeaway')).toHaveTextContent('Kurzsatz');
		await expect.element(page.getByTestId('probe-section-body')).toBeInTheDocument();
	});
});
