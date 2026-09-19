import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WinnerMapTooltip from './winner-map-tooltip.svelte';

describe('winner-map-tooltip.svelte', () => {
	it('rendert nichts wenn visible=false', async () => {
		render(WinnerMapTooltip, {
			visible: false,
			pos: { x: 0, y: 0 },
			data: { gebietName: 'Hansaviertel', partei: 'SPD', anteil: 0.4, hasWinner: true },
			jahr: 2023,
			repeatElection: false
		});
		await expect.element(page.getByTestId('winner-map-tooltip')).not.toBeInTheDocument();
	});

	it('zeigt Gebiet, Partei-Swatch, Anteil und Jahr bei gematchtem Gebiet', async () => {
		render(WinnerMapTooltip, {
			visible: true,
			pos: { x: 10, y: 20 },
			data: { gebietName: 'Hansaviertel', partei: 'SPD', anteil: 0.4, hasWinner: true },
			jahr: 2023,
			repeatElection: false
		});
		await expect.element(page.getByTestId('winner-map-tooltip-gebiet')).toHaveTextContent(
			'Hansaviertel'
		);
		await expect.element(page.getByTestId('winner-map-tooltip-partei')).toHaveTextContent('SPD');
		await expect.element(page.getByTestId('winner-map-tooltip-anteil')).toHaveTextContent('40,0 %');
		await expect.element(page.getByTestId('winner-map-tooltip-jahr')).toHaveTextContent('2023');
	});

	it('hängt den Wiederholungswahl-Hinweis an, wenn zutreffend', async () => {
		render(WinnerMapTooltip, {
			visible: true,
			pos: { x: 0, y: 0 },
			data: { gebietName: 'Hansaviertel', partei: 'SPD', anteil: 0.4, hasWinner: true },
			jahr: 2023,
			repeatElection: true
		});
		await expect
			.element(page.getByTestId('winner-map-tooltip-jahr'))
			.toHaveTextContent('Wiederholungswahl');
	});

	it('zeigt einen Leer-Hinweis für Gebiete ohne Winner-Match', async () => {
		render(WinnerMapTooltip, {
			visible: true,
			pos: { x: 0, y: 0 },
			data: { gebietName: 'Marienfelde Nord', partei: null, anteil: 0, hasWinner: false },
			jahr: 2023,
			repeatElection: false
		});
		await expect.element(page.getByTestId('winner-map-tooltip-empty')).toBeInTheDocument();
		await expect.element(page.getByTestId('winner-map-tooltip-partei')).not.toBeInTheDocument();
	});

	it('positioniert relativ zum Cursor mit 12px-Offset', async () => {
		render(WinnerMapTooltip, {
			visible: true,
			pos: { x: 100, y: 50 },
			data: { gebietName: 'X', partei: 'SPD', anteil: 0.4, hasWinner: true },
			jahr: null,
			repeatElection: false
		});
		const el = (await page.getByTestId('winner-map-tooltip').element()) as HTMLElement;
		expect(el.style.left).toBe('112px');
		expect(el.style.top).toBe('62px');
	});
});
