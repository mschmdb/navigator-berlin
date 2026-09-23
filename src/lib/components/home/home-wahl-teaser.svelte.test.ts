import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import HomeWahlTeaser from './home-wahl-teaser.svelte';

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
});
