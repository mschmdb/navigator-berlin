import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ScoreBar from './score-bar.svelte';

describe('score-bar.svelte', () => {
	it('DE-Default: sr-only-Tabelle zeigt "Wert"/"Median"', async () => {
		render(ScoreBar, { value: 24, layerName: 'Test', anchorValue: 20 });
		const table = (await page.getByTestId('score-bar-table').element()) as HTMLElement;
		expect(table.textContent).toContain('Wert');
		expect(table.textContent).toContain('Median');
	});

	// i18n Block B3b: Label-Props mit DE-Default (Fundament), Aufrufer (`klima-pet-card.svelte`)
	// übergibt lokalisierte Werte. Review-Fund: `anchorLabel: 'Median'` ist DE/EN
	// identisch und wurde zudem nie assertet -- "Average" beweist die Übergabe.
	it('valueLabel/anchorLabel-Props überschreiben den DE-Default', async () => {
		render(ScoreBar, {
			value: 24,
			layerName: 'Test',
			anchorValue: 20,
			valueLabel: 'Value',
			anchorLabel: 'Average'
		});
		const table = (await page.getByTestId('score-bar-table').element()) as HTMLElement;
		expect(table.textContent).toContain('Value');
		expect(table.textContent).toContain('Average');
		expect(table.textContent).not.toContain('Wert');
		expect(table.textContent).not.toContain('Median');
	});
});
