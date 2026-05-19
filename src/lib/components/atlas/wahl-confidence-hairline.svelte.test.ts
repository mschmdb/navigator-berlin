import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import WahlConfidenceHairline from './wahl-confidence-hairline.svelte';

describe('wahl-confidence-hairline', () => {
	it('rendert nichts bei visible=false', async () => {
		render(WahlConfidenceHairline, { visible: false });
		await expect.element(page.getByTestId('wahl-confidence-hairline')).not.toBeInTheDocument();
	});

	it('rendert Hairline-Span bei visible=true', async () => {
		render(WahlConfidenceHairline, { visible: true });
		await expect.element(page.getByTestId('wahl-confidence-hairline')).toBeInTheDocument();
	});

	it('Default-Width 6px', async () => {
		render(WahlConfidenceHairline, { visible: true });
		const el = page.getByTestId('wahl-confidence-hairline');
		await expect.element(el).toHaveStyle({ width: '6px' });
	});

	it('Width-Prop angewendet', async () => {
		render(WahlConfidenceHairline, { visible: true, width: 10 });
		await expect
			.element(page.getByTestId('wahl-confidence-hairline'))
			.toHaveStyle({ width: '10px' });
	});

	it('aria-hidden=true (Hairline ist dekorativ, Erklärung im Marker)', async () => {
		render(WahlConfidenceHairline, { visible: true });
		await expect
			.element(page.getByTestId('wahl-confidence-hairline'))
			.toHaveAttribute('aria-hidden', 'true');
	});

	it('Tooltip-Title übernommen', async () => {
		render(WahlConfidenceHairline, {
			visible: true,
			tooltip: 'Custom-Hint'
		});
		await expect
			.element(page.getByTestId('wahl-confidence-hairline'))
			.toHaveAttribute('title', 'Custom-Hint');
	});
});
