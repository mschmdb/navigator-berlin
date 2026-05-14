import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { Volume2 } from '@lucide/svelte';
import ValueChip from './value-chip.svelte';

describe('value-chip.svelte', () => {
	it('rendert mit severity="success"', async () => {
		render(ValueChip, { severity: 'success', value: 'gut', layerName: 'Wohnlage' });
		const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
		expect(chip.getAttribute('data-severity')).toBe('success');
		expect(chip.textContent).toMatch(/gut/);
	});

	it('rendert mit severity="success-soft"', async () => {
		render(ValueChip, { severity: 'success-soft', value: 'mittel-gut', layerName: 'X' });
		const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
		expect(chip.getAttribute('data-severity')).toBe('success-soft');
	});

	it('rendert mit severity="neutral"', async () => {
		render(ValueChip, { severity: 'neutral', value: 'mittel', layerName: 'X' });
		const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
		expect(chip.getAttribute('data-severity')).toBe('neutral');
	});

	it('rendert mit severity="warning"', async () => {
		render(ValueChip, { severity: 'warning', value: 'mittel', layerName: 'X' });
		const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
		expect(chip.getAttribute('data-severity')).toBe('warning');
	});

	it('rendert mit severity="danger"', async () => {
		render(ValueChip, { severity: 'danger', value: 'hoch', layerName: 'X' });
		const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
		expect(chip.getAttribute('data-severity')).toBe('danger');
	});

	it('Touch-Target Height ≥ 32px (min-h-8)', async () => {
		render(ValueChip, { severity: 'neutral', value: 'mittel', layerName: 'X' });
		const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
		expect(chip.className).toMatch(/min-h-8/);
	});

	it('aria-label kombiniert LayerName + Wert + Severity-Beschreibung', async () => {
		render(ValueChip, {
			severity: 'danger',
			value: 'hoch',
			layerName: 'Lärmbelastung'
		});
		const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
		const ariaLabel = chip.getAttribute('aria-label') ?? '';
		expect(ariaLabel).toMatch(/Lärmbelastung/);
		expect(ariaLabel).toMatch(/hoch/);
		expect(ariaLabel).toMatch(/(hohe|kritisch|stark)/i);
	});

	it('Unit-Prop wird neben Wert gerendert', async () => {
		render(ValueChip, { severity: 'warning', value: 65, unit: 'dB', layerName: 'Lärm' });
		const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
		expect(chip.textContent).toMatch(/65/);
		expect(chip.textContent).toMatch(/dB/);
	});

	it('Numerische Werte erhalten tabular-nums', async () => {
		render(ValueChip, { severity: 'warning', value: 65, unit: 'dB', layerName: 'Lärm' });
		const valueEl = (await page.getByTestId('value-chip-value').element()) as HTMLElement;
		expect(valueEl.className).toMatch(/tabular-nums/);
	});

	it('Icon-Slot wird gerendert wenn icon-Prop gesetzt', async () => {
		render(ValueChip, {
			severity: 'warning',
			value: 'mittel',
			layerName: 'Lärm',
			icon: Volume2
		});
		await expect.element(page.getByTestId('value-chip-icon')).toBeInTheDocument();
	});

	it('Kein Icon wenn icon-Prop nicht gesetzt', async () => {
		render(ValueChip, { severity: 'warning', value: 'mittel', layerName: 'Lärm' });
		await expect.element(page.getByTestId('value-chip-icon')).not.toBeInTheDocument();
	});

	it('role=status für aria-live-Update', async () => {
		render(ValueChip, { severity: 'success', value: 'gut', layerName: 'X' });
		const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
		expect(chip.getAttribute('role')).toBe('status');
	});
});
