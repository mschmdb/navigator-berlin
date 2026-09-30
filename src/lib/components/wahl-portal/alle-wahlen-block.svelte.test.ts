import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AlleWahlenBlock from './alle-wahlen-block.svelte';
import type { AlleWahlenEntry } from '../../../routes/(with-header)/berlin-wahlen/+page.server.js';

function entry(overrides: Partial<AlleWahlenEntry>): AlleWahlenEntry {
	return {
		slug: '2025-btw-zweitstimme',
		jahr: 2025,
		typ: 'btw',
		stimmtyp: 'zweitstimme',
		isRepeatElection: false,
		...overrides
	};
}

describe('AlleWahlenBlock (Matze-Entscheidung 24.09., Intent-Gap „verwaiste Detailseiten")', () => {
	it('gruppiert nach Wahltyp und verlinkt jede Variante auf /berlin-wahlen/<slug>', async () => {
		const wahlen: AlleWahlenEntry[] = [
			entry({ slug: '2025-btw-zweitstimme', jahr: 2025, typ: 'btw', stimmtyp: 'zweitstimme' }),
			entry({ slug: '2025-btw-erststimme', jahr: 2025, typ: 'btw', stimmtyp: 'erststimme' }),
			entry({ slug: '2023-agh-zweitstimme', jahr: 2023, typ: 'agh', stimmtyp: 'zweitstimme' }),
			entry({ slug: '2023-bvv', jahr: 2023, typ: 'bvv', stimmtyp: 'einstimme' })
		];
		render(AlleWahlenBlock, { wahlen });

		await expect.element(page.getByTestId('alle-wahlen-gruppe-btw')).toBeInTheDocument();
		await expect.element(page.getByTestId('alle-wahlen-gruppe-agh')).toBeInTheDocument();
		await expect.element(page.getByTestId('alle-wahlen-gruppe-bvv')).toBeInTheDocument();

		const erststimmeLink = page.getByTestId('alle-wahlen-link-2025-btw-erststimme');
		await expect
			.element(erststimmeLink)
			.toHaveAttribute('href', '/berlin-wahlen/2025-btw-erststimme');
		const zweitstimmeLink = page.getByTestId('alle-wahlen-link-2025-btw-zweitstimme');
		await expect
			.element(zweitstimmeLink)
			.toHaveAttribute('href', '/berlin-wahlen/2025-btw-zweitstimme');
	});

	it('markiert Wiederholungswahlen', async () => {
		const wahlen: AlleWahlenEntry[] = [
			entry({
				slug: '2023-agh-zweitstimme',
				jahr: 2023,
				typ: 'agh',
				stimmtyp: 'zweitstimme',
				isRepeatElection: true
			})
		];
		render(AlleWahlenBlock, { wahlen });

		await expect
			.element(page.getByTestId('alle-wahlen-link-2023-agh-zweitstimme'))
			.toHaveTextContent('Wiederholung');
	});

	it('BVV-Links zeigen keinen Stimmtyp-Zusatz', async () => {
		const wahlen: AlleWahlenEntry[] = [
			entry({ slug: '2023-bvv', jahr: 2023, typ: 'bvv', stimmtyp: 'einstimme' })
		];
		render(AlleWahlenBlock, { wahlen });

		const link = page.getByTestId('alle-wahlen-link-2023-bvv');
		await expect.element(link).toHaveTextContent('2023');
		await expect.element(link).not.toHaveTextContent('Stimme');
	});

	it('Review-Fund: Leerzeichen um „·" stimmen (nicht „2023· Erststimme")', async () => {
		const wahlen: AlleWahlenEntry[] = [
			entry({
				slug: '2023-agh-erststimme',
				jahr: 2023,
				typ: 'agh',
				stimmtyp: 'erststimme',
				isRepeatElection: true
			})
		];
		render(AlleWahlenBlock, { wahlen });

		const link = page.getByTestId('alle-wahlen-link-2023-agh-erststimme');
		const el = (await link.element()) as HTMLElement;
		expect(el.textContent?.trim()).toBe('2023 · Erststimme · Wiederholung');
	});

	it('Review-Fund: Linkziel erfüllt WCAG-2.5.8-Mindesthöhe (min-h-6 = 24px)', async () => {
		const wahlen: AlleWahlenEntry[] = [entry({})];
		render(AlleWahlenBlock, { wahlen });

		const link = page.getByTestId('alle-wahlen-link-2025-btw-zweitstimme');
		const el = (await link.element()) as HTMLElement;
		expect(el.className).toContain('min-h-6');
	});

	it('rendert einen Leer-Hinweis ohne Wahl-Daten', async () => {
		render(AlleWahlenBlock, { wahlen: [] });
		await expect.element(page.getByTestId('alle-wahlen-empty')).toBeInTheDocument();
	});

	it('Anker-Container trägt id="alle-wahlen" für Deep-Links aus der Methodik-Seite', async () => {
		render(AlleWahlenBlock, { wahlen: [] });
		const container = document.getElementById('alle-wahlen');
		expect(container).not.toBeNull();
	});
});
