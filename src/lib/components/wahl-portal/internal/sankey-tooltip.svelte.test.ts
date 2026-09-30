import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SankeyTooltip from './sankey-tooltip.svelte';

describe('sankey-tooltip.svelte', () => {
	it('rendert nichts wenn visible=false', async () => {
		render(SankeyTooltip, {
			visible: false,
			pos: { x: 0, y: 0 },
			content: { title: 'SPD → GRÜNE', detail: '2023: 3 Gebiete' }
		});
		await expect.element(page.getByTestId('sankey-tooltip')).not.toBeInTheDocument();
	});

	it('rendert nichts ohne content', async () => {
		render(SankeyTooltip, { visible: true, pos: { x: 0, y: 0 }, content: null });
		await expect.element(page.getByTestId('sankey-tooltip')).not.toBeInTheDocument();
	});

	it('zeigt Titel und Detail-Zeile', async () => {
		render(SankeyTooltip, {
			visible: true,
			pos: { x: 10, y: 20 },
			content: { title: 'SPD → GRÜNE', detail: '2023: 3 Gebiete' }
		});
		await expect.element(page.getByTestId('sankey-tooltip-title')).toHaveTextContent('SPD → GRÜNE');
		await expect
			.element(page.getByTestId('sankey-tooltip-detail'))
			.toHaveTextContent('2023: 3 Gebiete');
	});

	it('Detail-Zeile ist optional', async () => {
		render(SankeyTooltip, {
			visible: true,
			pos: { x: 0, y: 0 },
			content: { title: 'Hansaviertel' }
		});
		await expect
			.element(page.getByTestId('sankey-tooltip-title'))
			.toHaveTextContent('Hansaviertel');
		await expect.element(page.getByTestId('sankey-tooltip-detail')).not.toBeInTheDocument();
	});

	it('positioniert relativ zum Cursor mit 12px-Offset', async () => {
		render(SankeyTooltip, {
			visible: true,
			pos: { x: 100, y: 50 },
			content: { title: 'X' }
		});
		const el = (await page.getByTestId('sankey-tooltip').element()) as HTMLElement;
		expect(el.style.left).toBe('112px');
		expect(el.style.top).toBe('62px');
	});

	it('trägt role=tooltip und aria-live=polite', async () => {
		render(SankeyTooltip, { visible: true, pos: { x: 0, y: 0 }, content: { title: 'X' } });
		await expect.element(page.getByTestId('sankey-tooltip')).toHaveAttribute('role', 'tooltip');
		await expect.element(page.getByTestId('sankey-tooltip')).toHaveAttribute('aria-live', 'polite');
	});
});
