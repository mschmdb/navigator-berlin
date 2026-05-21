import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import InspectorLevelToggle from './inspector-level-toggle.svelte';

describe('InspectorLevelToggle', () => {
	it('rendert radiogroup mit 4 Stufen', async () => {
		render(InspectorLevelToggle, {
			currentLevel: 'address',
			kiezAvailable: true,
			bezirkAvailable: true,
			onSelect: () => {}
		});
		await expect.element(page.getByTestId('inspector-level-toggle')).toBeInTheDocument();
		await expect.element(page.getByTestId('level-toggle-address')).toBeInTheDocument();
		await expect.element(page.getByTestId('level-toggle-kiez')).toBeInTheDocument();
		await expect.element(page.getByTestId('level-toggle-bezirk')).toBeInTheDocument();
		await expect.element(page.getByTestId('level-toggle-berlin')).toBeInTheDocument();
	});

	it('aria-checked nur auf currentLevel', async () => {
		render(InspectorLevelToggle, {
			currentLevel: 'bezirk',
			kiezAvailable: true,
			bezirkAvailable: true,
			onSelect: () => {}
		});
		const bezirk = (await page.getByTestId('level-toggle-bezirk').element()) as HTMLElement;
		const address = (await page.getByTestId('level-toggle-address').element()) as HTMLElement;
		expect(bezirk.getAttribute('aria-checked')).toBe('true');
		expect(address.getAttribute('aria-checked')).toBe('false');
	});

	it('Klick auf aktivierbaren Level ruft onSelect', async () => {
		const onSelect = vi.fn();
		render(InspectorLevelToggle, {
			currentLevel: 'address',
			kiezAvailable: true,
			bezirkAvailable: true,
			onSelect
		});
		await page.getByTestId('level-toggle-kiez').click();
		expect(onSelect).toHaveBeenCalledWith('kiez');
	});

	it('nicht-auflösbarer Level ist aria-disabled und ruft onSelect NICHT', async () => {
		const onSelect = vi.fn();
		render(InspectorLevelToggle, {
			currentLevel: 'address',
			kiezAvailable: false,
			bezirkAvailable: false,
			onSelect
		});
		const kiez = (await page.getByTestId('level-toggle-kiez').element()) as HTMLElement;
		expect(kiez.getAttribute('aria-disabled')).toBe('true');
		// force: true umgeht den a11y-Disabled-Guard der Test-Lib, um zu prüfen, dass
		// die Komponente selbst den Klick auf aria-disabled abfängt (select() early-return).
		await page.getByTestId('level-toggle-kiez').click({ force: true });
		expect(onSelect).not.toHaveBeenCalled();
	});

	it('address + berlin immer aktivierbar trotz fehlender Slugs', async () => {
		const onSelect = vi.fn();
		render(InspectorLevelToggle, {
			currentLevel: 'address',
			kiezAvailable: false,
			bezirkAvailable: false,
			onSelect
		});
		const berlin = (await page.getByTestId('level-toggle-berlin').element()) as HTMLElement;
		expect(berlin.getAttribute('aria-disabled')).toBe('false');
		await page.getByTestId('level-toggle-berlin').click();
		expect(onSelect).toHaveBeenCalledWith('berlin');
	});
});
