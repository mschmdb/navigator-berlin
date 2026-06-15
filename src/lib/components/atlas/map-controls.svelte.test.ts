import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MapControls from './map-controls.svelte';

async function openCompass(): Promise<void> {
	await page.getByTestId('compass-trigger').click();
}

describe('map-controls.svelte', () => {
	it('rendert Compass-Trigger + 2 Zoom-Buttons direkt sichtbar (Story 1.31 AC-1)', async () => {
		render(MapControls, {});
		await expect.element(page.getByTestId('compass-trigger')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Hineinzoomen/i })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Herauszoomen/i })).toBeInTheDocument();
	});

	it('4 Pan-Buttons erst nach Compass-Klick verfügbar (Pop-Out)', async () => {
		render(MapControls, {});
		await openCompass();
		await expect.element(page.getByRole('menuitem', { name: /Norden/i })).toBeInTheDocument();
		await expect.element(page.getByRole('menuitem', { name: /Sueden|Süden/i })).toBeInTheDocument();
		await expect.element(page.getByRole('menuitem', { name: /Westen/i })).toBeInTheDocument();
		await expect.element(page.getByRole('menuitem', { name: /Osten/i })).toBeInTheDocument();
	});

	it('Pan-Button feuert onPan(direction)', async () => {
		const onPan = vi.fn();
		render(MapControls, { onPan });
		await openCompass();
		await page.getByRole('menuitem', { name: /Norden/i }).click();
		expect(onPan).toHaveBeenCalledWith('north');
		await page.getByRole('menuitem', { name: /Osten/i }).click();
		expect(onPan).toHaveBeenCalledWith('east');
		await page.getByRole('menuitem', { name: /Sueden|Süden/i }).click();
		expect(onPan).toHaveBeenCalledWith('south');
		await page.getByRole('menuitem', { name: /Westen/i }).click();
		expect(onPan).toHaveBeenCalledWith('west');
	});

	it('Zoom-Button feuert onZoom(delta)', async () => {
		const onZoom = vi.fn();
		render(MapControls, { onZoom });
		await page.getByRole('button', { name: /Hineinzoomen/i }).click();
		expect(onZoom).toHaveBeenCalledWith(1);
		await page.getByRole('button', { name: /Herauszoomen/i }).click();
		expect(onZoom).toHaveBeenCalledWith(-1);
	});

	it('Pan-Touch-Target ≥ 44px (Pop-Out-Buttons bleiben touch-safe)', async () => {
		render(MapControls, {});
		await openCompass();
		const btn = (await page
			.getByRole('menuitem', { name: /Norden/i })
			.element()) as HTMLButtonElement;
		const style = window.getComputedStyle(btn);
		const w = parseInt(style.width);
		const h = parseInt(style.height);
		expect(w).toBeGreaterThanOrEqual(44);
		expect(h).toBeGreaterThanOrEqual(44);
	});

	it('Container hat aria-label group', async () => {
		render(MapControls, {});
		await expect
			.element(page.getByRole('group', { name: /Karten-Steuerung/i }))
			.toBeInTheDocument();
	});

	it('Compass-Trigger hat aria-haspopup=menu + aria-expanded toggle', async () => {
		render(MapControls, {});
		const trigger = (await page.getByTestId('compass-trigger').element()) as HTMLButtonElement;
		expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		await trigger.click();
		const triggerAfter = (await page.getByTestId('compass-trigger').element()) as HTMLButtonElement;
		expect(triggerAfter.getAttribute('aria-expanded')).toBe('true');
	});
});
