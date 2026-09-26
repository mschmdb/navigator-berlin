import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import HomeWahlTeaser from './home-wahl-teaser.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('home-wahl-teaser', () => {
	it('verlinkt die 2026er-AGH/BVV-Wahlen (Matze-Entscheidung 23.09., 2A)', async () => {
		render(HomeWahlTeaser);
		await expect
			.element(page.getByTestId('home-wahl-card-2026-agh-zweitstimme'))
			.toBeInTheDocument();
		await expect.element(page.getByTestId('home-wahl-card-2026-bvv')).toBeInTheDocument();
	});

	it('behält den BTW25-Zweitstimme-Link', async () => {
		render(HomeWahlTeaser);
		await expect
			.element(page.getByTestId('home-wahl-card-2025-btw-zweitstimme'))
			.toBeInTheDocument();
	});

	it('zeigt die aktuelle Wahlenzahl (23) im Übersichts-Link', async () => {
		render(HomeWahlTeaser);
		await expect.element(page.getByTestId('home-wahl-teaser-all')).toHaveTextContent('23');
	});

	it('DE: Kartentitel + Quelle-Zeile byte-identisch zum Alt-Verhalten', async () => {
		render(HomeWahlTeaser);
		await expect
			.element(page.getByTestId('home-wahl-card-2026-agh-zweitstimme'))
			.toHaveTextContent('Abgeordnetenhaus 2026');
		await expect
			.element(page.getByTestId('home-wahl-card-2026-agh-zweitstimme'))
			.toHaveTextContent('Quelle Landeswahlleiterin Berlin');
		await expect
			.element(page.getByTestId('home-wahl-card-2026-bvv'))
			.toHaveTextContent('BVV-Wahl 2026');
		await expect
			.element(page.getByTestId('home-wahl-card-2025-btw-zweitstimme'))
			.toHaveTextContent('Bundestagswahl 2025');
	});

	// i18n Block B2: Karten-Titel/Quelle bauen auf den Wahl-Labels aus Block B
	// auf (wahlReiheLabel/wahlTypLabel/sourceDisplayLabel), keine eigene
	// Uebersetzung noetig.
	it('EN: Kartentitel + Quelle-Zeile englisch', async () => {
		overwriteGetLocale(() => 'en');
		render(HomeWahlTeaser);
		await expect
			.element(page.getByTestId('home-wahl-card-2026-agh-zweitstimme'))
			.toHaveTextContent('House of Representatives 2026');
		await expect
			.element(page.getByTestId('home-wahl-card-2026-agh-zweitstimme'))
			.toHaveTextContent('Source Berlin State Election Commissioner (Landeswahlleiterin Berlin)');
		await expect
			.element(page.getByTestId('home-wahl-card-2026-bvv'))
			.toHaveTextContent('District Assembly (BVV) election 2026');
		await expect
			.element(page.getByTestId('home-wahl-card-2025-btw-zweitstimme'))
			.toHaveTextContent('Bundestag election 2025');
		await expect.element(page.getByTestId('home-wahl-teaser-all')).toHaveTextContent(
			'All 23 elections'
		);
		const link = (await page
			.getByTestId('home-wahl-card-2026-bvv')
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/en/berlin-wahlen/2026-bvv');
	});
});
