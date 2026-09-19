import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import PortalSteuerleiste from './portal-steuerleiste.svelte';

const JAHR_OPTIONS = [
	{ jahr: 2023, isRepeatElection: true },
	{ jahr: 2021, isRepeatElection: false }
];

function baseProps() {
	return {
		reihe: 'agh' as const,
		jahr: 2021,
		ebene: 'kiez' as const,
		jahrOptions: JAHR_OPTIONS,
		onReiheChange: vi.fn(),
		onJahrChange: vi.fn(),
		onEbeneChange: vi.fn()
	};
}

describe('PortalSteuerleiste', () => {
	it('rendert alle drei Radiogroups (Reihe, Jahr, Ebene)', async () => {
		render(PortalSteuerleiste, baseProps());
		await expect.element(page.getByTestId('portal-steuerleiste')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-reihe')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-jahr')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-ebene')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-reihe-btw')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-reihe-agh')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-reihe-bvv')).toBeInTheDocument();
	});

	it('markiert die aktuelle Reihe/Ebene als aria-checked', async () => {
		render(PortalSteuerleiste, baseProps());
		const agh = (await page.getByTestId('steuerleiste-reihe-agh').element()) as HTMLElement;
		const btw = (await page.getByTestId('steuerleiste-reihe-btw').element()) as HTMLElement;
		expect(agh.getAttribute('aria-checked')).toBe('true');
		expect(btw.getAttribute('aria-checked')).toBe('false');
		const kiez = (await page.getByTestId('steuerleiste-ebene-kiez').element()) as HTMLElement;
		expect(kiez.getAttribute('aria-checked')).toBe('true');
	});

	it('zeigt Wiederholungswahl-Flag als eigenen Chip-Marker', async () => {
		render(PortalSteuerleiste, baseProps());
		await expect
			.element(page.getByTestId('steuerleiste-jahr-2023-wiederholung'))
			.toBeInTheDocument();
		const el = page.getByTestId('steuerleiste-jahr-2021-wiederholung');
		await expect.element(el).not.toBeInTheDocument();
	});

	it('Klick auf Reihe/Jahr/Ebene ruft die jeweiligen Callbacks', async () => {
		const props = baseProps();
		render(PortalSteuerleiste, props);
		await page.getByTestId('steuerleiste-reihe-btw').click();
		expect(props.onReiheChange).toHaveBeenCalledWith('btw');
		await page.getByTestId('steuerleiste-jahr-2023').click();
		expect(props.onJahrChange).toHaveBeenCalledWith(2023);
		await page.getByTestId('steuerleiste-ebene-bezirk').click();
		expect(props.onEbeneChange).toHaveBeenCalledWith('bezirk');
	});

	it('ArrowRight auf Ebene-Gruppe wechselt Fokus und feuert onEbeneChange', async () => {
		const props = baseProps();
		render(PortalSteuerleiste, props);
		const kiez = page.getByTestId('steuerleiste-ebene-kiez');
		await kiez.click();
		await (
			await kiez.element()
		).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		expect(props.onEbeneChange).toHaveBeenCalledWith('bezirk');
	});

	it('disabled sperrt Reihe/Ebene und zeigt aria-disabled', async () => {
		const props = { ...baseProps(), disabled: true };
		render(PortalSteuerleiste, props);
		const btw = (await page.getByTestId('steuerleiste-reihe-btw').element()) as HTMLElement;
		expect(btw.getAttribute('aria-disabled')).toBe('true');
		await page.getByTestId('steuerleiste-reihe-btw').click({ force: true });
		expect(props.onReiheChange).not.toHaveBeenCalled();
	});

	it('zeigt Leer-Hinweis wenn keine Jahr-Optionen vorhanden sind (DB-los)', async () => {
		render(PortalSteuerleiste, { ...baseProps(), jahrOptions: [] });
		await expect.element(page.getByTestId('steuerleiste-jahr-empty')).toBeInTheDocument();
		const jahrGroup = page.getByTestId('steuerleiste-jahr');
		await expect.element(jahrGroup).not.toBeInTheDocument();
	});
});
