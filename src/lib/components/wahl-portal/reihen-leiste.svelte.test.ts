import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ReihenLeiste from './reihen-leiste.svelte';

function baseProps() {
	return {
		reihe: 'agh' as const,
		onReiheChange: vi.fn()
	};
}

describe('ReihenLeiste', () => {
	it('rendert die Reihe-Radiogroup mit den drei Wahl-Reihen-Testids (Testid-Kontrakt aus portal-steuerleiste)', async () => {
		render(ReihenLeiste, baseProps());
		await expect.element(page.getByTestId('steuerleiste-reihe')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-reihe-btw')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-reihe-agh')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-reihe-bvv')).toBeInTheDocument();
	});

	it('markiert die aktuelle Reihe als aria-checked', async () => {
		render(ReihenLeiste, baseProps());
		const agh = (await page.getByTestId('steuerleiste-reihe-agh').element()) as HTMLElement;
		const btw = (await page.getByTestId('steuerleiste-reihe-btw').element()) as HTMLElement;
		expect(agh.getAttribute('aria-checked')).toBe('true');
		expect(btw.getAttribute('aria-checked')).toBe('false');
	});

	it('Klick auf eine Reihe ruft onReiheChange', async () => {
		const props = baseProps();
		render(ReihenLeiste, props);
		await page.getByTestId('steuerleiste-reihe-btw').click();
		expect(props.onReiheChange).toHaveBeenCalledWith('btw');
	});

	it('ArrowRight wechselt Fokus und feuert onReiheChange', async () => {
		const props = baseProps();
		render(ReihenLeiste, props);
		const agh = page.getByTestId('steuerleiste-reihe-agh');
		await agh.click();
		await (
			await agh.element()
		).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		expect(props.onReiheChange).toHaveBeenCalledWith('bvv');
	});

	it('disabled sperrt die Reihe und zeigt aria-disabled', async () => {
		const props = { ...baseProps(), disabled: true };
		render(ReihenLeiste, props);
		const btw = (await page.getByTestId('steuerleiste-reihe-btw').element()) as HTMLElement;
		expect(btw.getAttribute('aria-disabled')).toBe('true');
		await page.getByTestId('steuerleiste-reihe-btw').click({ force: true });
		expect(props.onReiheChange).not.toHaveBeenCalled();
	});

	it('trägt die sticky-Klasse (Boundary: dauerhaft sichtbare Leiste; Layout-Verhalten deckt die E2E-Suite ab)', async () => {
		render(ReihenLeiste, baseProps());
		const el = (await page.getByTestId('reihen-leiste').element()) as HTMLElement;
		expect(el.className).toContain('sticky');
	});

	it('scrollt horizontal statt umzubrechen (Review Triage Log #1: Mobil-Overflow ab ~383px)', async () => {
		render(ReihenLeiste, baseProps());
		const leiste = (await page.getByTestId('reihen-leiste').element()) as HTMLElement;
		expect(leiste.className).toContain('overflow-x-auto');
		const radiogroup = (await page.getByTestId('steuerleiste-reihe').element()) as HTMLElement;
		expect(radiogroup.className).not.toContain('flex-wrap');
	});
});
