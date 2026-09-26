import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import KartenSteuerung from './karten-steuerung.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const JAHR_OPTIONS = [
	{ jahr: 2023, isRepeatElection: true },
	{ jahr: 2021, isRepeatElection: false }
];

function baseProps() {
	return {
		jahr: 2021,
		ebene: 'kiez' as const,
		jahrOptions: JAHR_OPTIONS,
		onJahrChange: vi.fn(),
		onEbeneChange: vi.fn()
	};
}

describe('KartenSteuerung', () => {
	it('rendert Jahr- und Ebenen-Radiogroup (Testid-Kontrakt aus portal-steuerleiste)', async () => {
		render(KartenSteuerung, baseProps());
		await expect.element(page.getByTestId('karten-steuerung')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-jahr')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-ebene')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-jahr-2023')).toBeInTheDocument();
		await expect.element(page.getByTestId('steuerleiste-ebene-bezirk')).toBeInTheDocument();
	});

	it('markiert das aktuelle Jahr/die aktuelle Ebene als aria-checked', async () => {
		render(KartenSteuerung, baseProps());
		const jahr2021 = (await page.getByTestId('steuerleiste-jahr-2021').element()) as HTMLElement;
		expect(jahr2021.getAttribute('aria-checked')).toBe('true');
		const kiez = (await page.getByTestId('steuerleiste-ebene-kiez').element()) as HTMLElement;
		expect(kiez.getAttribute('aria-checked')).toBe('true');
	});

	it('zeigt Wiederholungswahl-Flag als eigenen Chip-Marker', async () => {
		render(KartenSteuerung, baseProps());
		await expect
			.element(page.getByTestId('steuerleiste-jahr-2023-wiederholung'))
			.toBeInTheDocument();
		const el = page.getByTestId('steuerleiste-jahr-2021-wiederholung');
		await expect.element(el).not.toBeInTheDocument();
	});

	// Review-Fund (i18n Block B): "·W" war ein hartcodiertes Literal, jetzt
	// eine Message -- EN zeigt "·R" statt "·W".
	it('EN: Wiederholungswahl-Chip-Marker zeigt "·R" statt "·W"', async () => {
		overwriteGetLocale(() => 'en');
		render(KartenSteuerung, baseProps());
		await expect
			.element(page.getByTestId('steuerleiste-jahr-2023-wiederholung'))
			.toHaveTextContent('·R');
	});

	it('Klick auf Jahr/Ebene ruft die jeweiligen Callbacks', async () => {
		const props = baseProps();
		render(KartenSteuerung, props);
		await page.getByTestId('steuerleiste-jahr-2023').click();
		expect(props.onJahrChange).toHaveBeenCalledWith(2023);
		await page.getByTestId('steuerleiste-ebene-bezirk').click();
		expect(props.onEbeneChange).toHaveBeenCalledWith('bezirk');
	});

	it('ArrowRight auf Ebene-Gruppe wechselt Fokus und feuert onEbeneChange', async () => {
		const props = baseProps();
		render(KartenSteuerung, props);
		const kiez = page.getByTestId('steuerleiste-ebene-kiez');
		await kiez.click();
		await (
			await kiez.element()
		).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		expect(props.onEbeneChange).toHaveBeenCalledWith('bezirk');
	});

	it('disabled sperrt Ebene und zeigt aria-disabled', async () => {
		const props = { ...baseProps(), disabled: true };
		render(KartenSteuerung, props);
		const bezirk = (await page.getByTestId('steuerleiste-ebene-bezirk').element()) as HTMLElement;
		expect(bezirk.getAttribute('aria-disabled')).toBe('true');
		await page.getByTestId('steuerleiste-ebene-bezirk').click({ force: true });
		expect(props.onEbeneChange).not.toHaveBeenCalled();
	});

	it('zeigt Leer-Hinweis wenn keine Jahr-Optionen vorhanden sind (DB-los)', async () => {
		render(KartenSteuerung, { ...baseProps(), jahrOptions: [] });
		await expect.element(page.getByTestId('steuerleiste-jahr-empty')).toBeInTheDocument();
		const jahrGroup = page.getByTestId('steuerleiste-jahr');
		await expect.element(jahrGroup).not.toBeInTheDocument();
	});
});
