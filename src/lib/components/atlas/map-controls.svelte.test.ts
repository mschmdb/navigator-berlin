import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MapControls from './map-controls.svelte';

describe('map-controls.svelte', () => {
	it('rendert 4 Pan-Buttons + 2 Zoom-Buttons', async () => {
		render(MapControls, {});
		await expect.element(page.getByRole('button', { name: /Norden/i })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Sueden|Süden/i })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Westen/i })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Osten/i })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Hineinzoomen/i })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /Herauszoomen/i })).toBeInTheDocument();
	});

	it('Pan-Button feuert onPan(direction)', async () => {
		const onPan = vi.fn();
		render(MapControls, { onPan });
		await page.getByRole('button', { name: /Norden/i }).click();
		expect(onPan).toHaveBeenCalledWith('north');
		await page.getByRole('button', { name: /Osten/i }).click();
		expect(onPan).toHaveBeenCalledWith('east');
		await page.getByRole('button', { name: /Sueden|Süden/i }).click();
		expect(onPan).toHaveBeenCalledWith('south');
		await page.getByRole('button', { name: /Westen/i }).click();
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

	it('Touch-Target ≥ 44px', async () => {
		render(MapControls, {});
		const btn = (await page
			.getByRole('button', { name: /Norden/i })
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
});
