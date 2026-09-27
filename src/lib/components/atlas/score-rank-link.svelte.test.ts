import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import ScoreRankLink from './score-rank-link.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('score-rank-link.svelte', () => {
	it('verlinkt Kieze-View auf die Score-Übersicht', async () => {
		render(ScoreRankLink, { rang: 12, total: 143, view: 'kieze' });
		const link = (await page.getByTestId('score-rank-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/umwelt-infrastruktur-score');
	});

	it('verlinkt Bezirke-View mit view-Param', async () => {
		render(ScoreRankLink, { rang: 3, total: 12, view: 'bezirke' });
		const link = (await page.getByTestId('score-rank-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/umwelt-infrastruktur-score?view=bezirke');
	});

	it('zeigt Rang-Text wenn rang vorhanden', async () => {
		render(ScoreRankLink, { rang: 12, total: 143, view: 'kieze' });
		const link = (await page.getByTestId('score-rank-link').element()) as HTMLElement;
		expect(link.textContent).toContain('12');
		expect(link.textContent).toContain('143');
	});

	it('zeigt Fallback-Text wenn rang null', async () => {
		render(ScoreRankLink, { rang: null, total: 0, view: 'kieze' });
		const link = (await page.getByTestId('score-rank-link').element()) as HTMLElement;
		expect(link.textContent).toMatch(/vergleichen/i);
		expect(link.textContent).not.toMatch(/Platz/);
	});

	// i18n Block B4a
	describe('opts.locale (EN)', () => {
		it('zeigt englischen Rang-Text + /en-Href', async () => {
			overwriteGetLocale(() => 'en');
			render(ScoreRankLink, { rang: 12, total: 143, view: 'kieze' });
			const link = (await page.getByTestId('score-rank-link').element()) as HTMLAnchorElement;
			expect(link.textContent).toContain('Rank 12 of 143');
			expect(link.getAttribute('href')).toBe('/en/umwelt-infrastruktur-score');
		});

		it('zeigt englischen Fallback-Text ohne Rang', async () => {
			overwriteGetLocale(() => 'en');
			render(ScoreRankLink, { rang: null, total: 0, view: 'kieze' });
			const link = (await page.getByTestId('score-rank-link').element()) as HTMLElement;
			expect(link.textContent).toMatch(/compare/i);
		});

		it('Bezirke-View behält den view-Query-Param unter /en', async () => {
			overwriteGetLocale(() => 'en');
			render(ScoreRankLink, { rang: 3, total: 12, view: 'bezirke' });
			const link = (await page.getByTestId('score-rank-link').element()) as HTMLAnchorElement;
			const href = link.getAttribute('href') ?? '';
			expect(href).toMatch(/^\/en\/umwelt-infrastruktur-score/);
			expect(href).toContain('view=bezirke');
		});
	});
});
