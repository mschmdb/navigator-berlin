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

	it('Story 12: rendert ohne subtext-Prop keinen Subtext-Block', async () => {
		render(KapitelSection, { id: 'y', title: 'Y', testid: 'y-section' });
		const subtext = page.getByTestId('y-section-subtext');
		await expect.element(subtext).not.toBeInTheDocument();
	});

	it('Story 12: rendert den subtext als <p> zwischen Überschrift und Inhalt', async () => {
		render(KapitelSection, {
			id: 'karte',
			title: 'Karte',
			testid: 'wahl-portal-chapter-karte',
			subtext: 'Erklär-Satz zum Kapitel.'
		});
		const subtext = page.getByTestId('wahl-portal-chapter-karte-subtext');
		await expect.element(subtext).toHaveTextContent('Erklär-Satz zum Kapitel.');
		const el = (await subtext.element()) as HTMLElement;
		expect(el.tagName).toBe('P');
	});
});
