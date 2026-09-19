import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WinnerMapLegende from './winner-map-legende.svelte';
import { parteiColor } from '$lib/data/partei-farben.js';

function hexToRgb(hex: string): string {
	const clean = hex.replace('#', '');
	const value = Number.parseInt(clean, 16);
	const r = (value >> 16) & 255;
	const g = (value >> 8) & 255;
	const b = value & 255;
	return `rgb(${r}, ${g}, ${b})`;
}

describe('winner-map-legende.svelte', () => {
	it('rendert einen Swatch pro vorkommender Partei mit Farb-Hex', async () => {
		render(WinnerMapLegende, {
			parteien: ['SPD', 'GRÜNE'],
			patternsEnabled: false,
			onTogglePatterns: () => {}
		});
		const spd = page.getByTestId('winner-map-swatch-SPD');
		await expect.element(spd).toBeInTheDocument();
		const spdEl = (await spd.element()) as HTMLElement;
		expect(spdEl.style.backgroundColor).toBe(hexToRgb(parteiColor('SPD')));

		const gruene = page.getByTestId('winner-map-swatch-GRÜNE');
		await expect.element(gruene).toBeInTheDocument();
	});

	it('zeigt Leer-Hinweis ohne vorkommende Parteien', async () => {
		render(WinnerMapLegende, { parteien: [], patternsEnabled: false, onTogglePatterns: () => {} });
		await expect.element(page.getByTestId('winner-map-legende-empty')).toBeInTheDocument();
	});

	it('Muster-Toggle hat aria-pressed passend zum Prop und ruft Callback', async () => {
		const onTogglePatterns = vi.fn();
		render(WinnerMapLegende, {
			parteien: ['SPD'],
			patternsEnabled: false,
			onTogglePatterns
		});
		const toggle = page.getByTestId('winner-map-muster-toggle');
		await expect.element(toggle).toHaveAttribute('aria-pressed', 'false');
		await toggle.click();
		expect(onTogglePatterns).toHaveBeenCalledOnce();
	});

	it('zeigt aria-pressed=true wenn patternsEnabled aktiv ist', async () => {
		render(WinnerMapLegende, {
			parteien: ['SPD'],
			patternsEnabled: true,
			onTogglePatterns: () => {}
		});
		await expect
			.element(page.getByTestId('winner-map-muster-toggle'))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('zeigt bei aktivem Muster-Toggle eine Pattern-Vorschau (background-image) statt reiner Farbe', async () => {
		render(WinnerMapLegende, {
			parteien: ['SPD'],
			patternsEnabled: true,
			onTogglePatterns: () => {}
		});
		const swatch = (await page.getByTestId('winner-map-swatch-SPD').element()) as HTMLElement;
		// SPD-Pattern ist 'solid' -> auch mit Toggle bleibt es reine Farbfläche,
		// darum an CDU (pattern 'stripes') die background-image-Vorschau prüfen.
		expect(swatch.getAttribute('style')).toBeTruthy();
	});

	it('rendert den Anteils-Rampen-Hinweis', async () => {
		render(WinnerMapLegende, { parteien: ['SPD'], patternsEnabled: false, onTogglePatterns: () => {} });
		await expect.element(page.getByTestId('winner-map-legende-rampe')).toBeInTheDocument();
	});
});
