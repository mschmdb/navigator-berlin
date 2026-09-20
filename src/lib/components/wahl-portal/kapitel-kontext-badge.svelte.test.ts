import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import KapitelKontextBadge from './kapitel-kontext-badge.svelte';

describe('KapitelKontextBadge', () => {
	it('rendert Reihe, Jahres-Bezug und Ebene durch Mittelpunkte getrennt', async () => {
		render(KapitelKontextBadge, {
			reiheLabel: 'Abgeordnetenhaus',
			jahreText: 'alle Wahljahre',
			ebeneText: 'Kiez-Ebene'
		});
		const badge = page.getByTestId('kapitel-kontext-badge');
		await expect.element(badge).toHaveTextContent('Abgeordnetenhaus · alle Wahljahre · Kiez-Ebene');
	});

	it('folgt dem Jahres-Bezug reaktiv (Extreme-Badge nennt das Karten-Jahr)', async () => {
		render(KapitelKontextBadge, {
			reiheLabel: 'Bundestag',
			jahreText: 'Wahl 2016',
			ebeneText: 'Kiez-Ebene'
		});
		const badge = page.getByTestId('kapitel-kontext-badge');
		await expect.element(badge).toHaveTextContent('Bundestag · Wahl 2016 · Kiez-Ebene');
	});

	it('rendert ohne Ebenen-Segment, wenn ebeneText fehlt (Review Triage Log #2: Sankey-eigener Ebenen-Toggle im Trends-Kapitel)', async () => {
		render(KapitelKontextBadge, {
			reiheLabel: 'Abgeordnetenhaus',
			jahreText: 'alle Wahljahre'
		});
		const badge = page.getByTestId('kapitel-kontext-badge');
		const el = (await badge.element()) as HTMLElement;
		expect(el.textContent?.trim()).toBe('Abgeordnetenhaus · alle Wahljahre');
	});

	it('rendert als reinen Text ohne zusätzliche ARIA-Attribute (A11y-Boundary)', async () => {
		render(KapitelKontextBadge, {
			reiheLabel: 'BVV',
			jahreText: 'alle Wahljahre',
			ebeneText: 'Kiez-Ebene'
		});
		const el = (await page.getByTestId('kapitel-kontext-badge').element()) as HTMLElement;
		expect(el.getAttribute('role')).toBeNull();
		expect(el.getAttribute('aria-label')).toBeNull();
	});
});
