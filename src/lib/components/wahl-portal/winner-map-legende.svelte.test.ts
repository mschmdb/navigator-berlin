import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import WinnerMapLegende, { patternPreviewStyle } from './winner-map-legende.svelte';
import { parteiColor } from '$lib/data/partei-farben.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

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

	// Review-Fund (i18n Block B): "Sonstige" ist eine Anzeige-, keine
	// Daten-Schluessel-Uebersetzung -- `data-testid`/`data-partei` bleiben
	// "Sonstige", nur der sichtbare Text wird zu "Other".
	it('zeigt "Sonstige" unter en als "Other" an, data-testid bleibt "Sonstige"', async () => {
		overwriteGetLocale(() => 'en');
		render(WinnerMapLegende, {
			parteien: ['Sonstige'],
			patternsEnabled: false,
			onTogglePatterns: () => {}
		});
		const swatchLi = page.getByTestId('winner-map-swatch-Sonstige');
		await expect.element(swatchLi).toBeInTheDocument();
		const container = (await swatchLi.element()) as HTMLElement;
		expect(container.parentElement?.textContent).toContain('Other');
		expect(container.parentElement?.textContent).not.toContain('Sonstige');
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
		// SPD-Pattern ist 'solid' -- Review-Fund #15: der Swatch bekommt jetzt
		// ebenfalls einen background-image-Zwilling (kein Vollflächen-Rest mehr).
		expect(swatch.getAttribute('style')).toContain('gradient');
	});

	it('Review-Fund #15: patternPreviewStyle("solid", …) enthält einen gradient-Zwilling statt reiner Flächenfarbe', () => {
		const style = patternPreviewStyle('solid', '#A50C1A');
		expect(style).toContain('gradient');
		expect(style).toContain('#A50C1A');
	});

	it('Review-Fund #16: patternPreviewStyle unterscheidet diagonal von diagonal-reverse (Streifen-Richtung)', () => {
		const diagonal = patternPreviewStyle('diagonal', '#7A6500');
		const diagonalReverse = patternPreviewStyle('diagonal-reverse', '#8C2057');
		expect(diagonal).toContain('45deg');
		expect(diagonalReverse).toContain('135deg');
		expect(diagonal).not.toBe(diagonalReverse);
	});

	it('rendert den Anteils-Rampen-Hinweis', async () => {
		render(WinnerMapLegende, {
			parteien: ['SPD'],
			patternsEnabled: false,
			onTogglePatterns: () => {}
		});
		await expect.element(page.getByTestId('winner-map-legende-rampe')).toBeInTheDocument();
	});

	it('Story 9: titel/rampeText-Props überschreiben die Sieger-Texte (Partei-Modus)', async () => {
		render(WinnerMapLegende, {
			parteien: ['CDU'],
			patternsEnabled: false,
			onTogglePatterns: () => {},
			titel: 'Anteil CDU',
			rampeText: 'Deckkraft nach Anteil: 10,0 % = niedrige Deckkraft, ab 50,0 % volle Deckkraft.'
		});
		await expect.element(page.getByText('Anteil CDU')).toBeInTheDocument();
		await expect.element(page.getByTestId('winner-map-legende-rampe')).toHaveTextContent('10,0 %');
	});
});
