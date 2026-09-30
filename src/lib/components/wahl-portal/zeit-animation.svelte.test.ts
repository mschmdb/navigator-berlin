import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import ZeitAnimation from './zeit-animation.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const JAHR_OPTIONS = [
	{ jahr: 2016, isRepeatElection: false },
	{ jahr: 2021, isRepeatElection: false },
	{ jahr: 2023, isRepeatElection: true }
];

describe('zeit-animation.svelte', () => {
	it('zeigt auf Stimmbezirk einen Hinweis + Zur-Kiez-Button statt Play/Slider', async () => {
		const onZurKiez = vi.fn();
		render(ZeitAnimation, {
			ebene: 'stimmbezirk',
			jahrOptions: JAHR_OPTIONS,
			jahr: 2023,
			onDisplayJahr: vi.fn(),
			onCommitJahr: vi.fn(),
			onZurKiez
		});
		await expect.element(page.getByTestId('zeit-animation-hinweis')).toBeInTheDocument();
		await expect.element(page.getByTestId('zeit-animation-play')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('zeit-animation-slider')).not.toBeInTheDocument();
		await page.getByTestId('zeit-animation-zur-kiez-button').click();
		expect(onZurKiez).toHaveBeenCalledOnce();
	});

	it('zeigt auf kiez Play-Button (aria-pressed) und Slider (aria-valuetext) mit Wiederholungs-Flag', async () => {
		render(ZeitAnimation, {
			ebene: 'kiez',
			jahrOptions: JAHR_OPTIONS,
			jahr: 2023,
			onDisplayJahr: vi.fn(),
			onCommitJahr: vi.fn(),
			onZurKiez: vi.fn()
		});
		const playButton = page.getByTestId('zeit-animation-play');
		await expect.element(playButton).toHaveAttribute('aria-pressed', 'false');

		const slider = page.getByTestId('zeit-animation-slider');
		await expect.element(slider).toHaveAttribute('aria-valuetext', '2023 Wiederholungswahl');
		await expect.element(page.getByTestId('zeit-animation-wiederholung')).toBeInTheDocument();
	});

	// Review-Fund (i18n Block B): "·W" war ein hartcodiertes Literal, jetzt
	// eine Message -- EN zeigt "·R" statt "·W".
	it('EN: Wiederholungswahl-Chip-Marker zeigt "·R" statt "·W"', async () => {
		overwriteGetLocale(() => 'en');
		render(ZeitAnimation, {
			ebene: 'kiez',
			jahrOptions: JAHR_OPTIONS,
			jahr: 2023,
			onDisplayJahr: vi.fn(),
			onCommitJahr: vi.fn(),
			onZurKiez: vi.fn()
		});
		await expect.element(page.getByTestId('zeit-animation-wiederholung')).toHaveTextContent('·R');
	});

	it('Play-Klick setzt aria-pressed und ruft onDisplayJahr/onCommitJahr für die nächsten Jahre', async () => {
		vi.useFakeTimers();
		const onDisplayJahr = vi.fn();
		const onCommitJahr = vi.fn();
		render(ZeitAnimation, {
			ebene: 'kiez',
			jahrOptions: JAHR_OPTIONS,
			jahr: 2016,
			onDisplayJahr,
			onCommitJahr,
			onZurKiez: vi.fn()
		});
		await page.getByTestId('zeit-animation-play').click();
		await expect
			.element(page.getByTestId('zeit-animation-play'))
			.toHaveAttribute('aria-pressed', 'true');

		await vi.advanceTimersByTimeAsync(1500);
		expect(onDisplayJahr).toHaveBeenCalledWith(2021);
		expect(onCommitJahr).toHaveBeenCalledWith(2021);

		await vi.advanceTimersByTimeAsync(1500);
		expect(onDisplayJahr).toHaveBeenCalledWith(2023);
		// Auto-Pause am letzten Jahr.
		await expect
			.element(page.getByTestId('zeit-animation-play'))
			.toHaveAttribute('aria-pressed', 'false');
		vi.useRealTimers();
	});

	it('zeigt unter der Zeit-Leiste den Wechsel-Outline-Hinweis', async () => {
		render(ZeitAnimation, {
			ebene: 'kiez',
			jahrOptions: JAHR_OPTIONS,
			jahr: 2023,
			onDisplayJahr: vi.fn(),
			onCommitJahr: vi.fn(),
			onZurKiez: vi.fn()
		});
		await expect
			.element(page.getByTestId('zeit-animation-wechsel-hinweis'))
			.toHaveTextContent('Gestrichelte Kontur');
	});

	it('Reduced Motion: zeigt einen Schritt-weiter-Button statt Play/Pause-aria-pressed-Semantik', async () => {
		const matchMediaMock = vi.fn().mockReturnValue({
			matches: true,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		});
		vi.stubGlobal('matchMedia', matchMediaMock);
		const onDisplayJahr = vi.fn();
		render(ZeitAnimation, {
			ebene: 'kiez',
			jahrOptions: JAHR_OPTIONS,
			jahr: 2016,
			onDisplayJahr,
			onCommitJahr: vi.fn(),
			onZurKiez: vi.fn()
		});
		const button = page.getByTestId('zeit-animation-play');
		await expect.element(button).toHaveAttribute('aria-label', 'Ein Jahr weiter');
		await expect.element(button).not.toHaveAttribute('aria-pressed');
		await button.click();
		expect(onDisplayJahr).toHaveBeenCalledWith(2021);
		vi.unstubAllGlobals();
	});

	it('Slider-Drag ruft onDisplayJahr sofort auf, `change` flusht den gedrosselten Commit', async () => {
		const onDisplayJahr = vi.fn();
		const onCommitJahr = vi.fn();
		render(ZeitAnimation, {
			ebene: 'kiez',
			jahrOptions: JAHR_OPTIONS,
			jahr: 2016,
			onDisplayJahr,
			onCommitJahr,
			onZurKiez: vi.fn()
		});
		const slider = page.getByTestId('zeit-animation-slider');
		const el = (await slider.element()) as HTMLInputElement;
		el.value = '1';
		el.dispatchEvent(new Event('input', { bubbles: true }));
		expect(onDisplayJahr).toHaveBeenCalledWith(2021);
		el.dispatchEvent(new Event('change', { bubbles: true }));
		expect(onCommitJahr).toHaveBeenCalledWith(2021);
	});
});
