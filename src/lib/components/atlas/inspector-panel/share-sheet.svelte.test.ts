import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import ShareSheet from './share-sheet.svelte';

const PERMALINK = 'https://navigator.berlin/?address=13.4622,52.5135';
const LLM_TEXT = '# Boxhagener Straße 12\n\n- Test data\n';

let clipboardSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
	clipboardSpy = vi.fn(async () => undefined);
	Object.defineProperty(navigator, 'clipboard', {
		value: { writeText: clipboardSpy },
		configurable: true
	});
});

afterEach(() => {
	vi.restoreAllMocks();
	overwriteGetLocale(() => 'de');
});

function defaultProps() {
	return {
		open: true,
		onClose: () => {},
		permalinkUrl: PERMALINK,
		llmExportText: LLM_TEXT,
		ogImageUrl: null,
		addressName: 'Boxhagener Straße 12',
		variant: 'popover' as const
	};
}

describe('share-sheet.svelte', () => {
	it('rendert Sheet mit Dialog-Rolle', async () => {
		render(ShareSheet, defaultProps());
		await expect.element(page.getByTestId('share-sheet')).toBeInTheDocument();
		const dialog = (await page.getByTestId('share-sheet').element()) as HTMLElement;
		expect(dialog.getAttribute('role')).toBe('dialog');
		expect(dialog.getAttribute('aria-modal')).toBe('true');
	});

	it('rendert Permalink + KI + Drucken-Optionen', async () => {
		render(ShareSheet, defaultProps());
		await expect.element(page.getByTestId('share-option-permalink')).toBeInTheDocument();
		await expect.element(page.getByTestId('share-option-llm')).toBeInTheDocument();
		await expect.element(page.getByTestId('share-option-print')).toBeInTheDocument();
	});

	it('versteckt Native-Share wenn navigator.share fehlt', async () => {
		render(ShareSheet, defaultProps());
		await expect.element(page.getByTestId('share-option-native')).not.toBeInTheDocument();
	});

	it('rendert nicht wenn open=false', async () => {
		render(ShareSheet, { ...defaultProps(), open: false });
		await expect.element(page.getByTestId('share-sheet')).not.toBeInTheDocument();
	});

	it('Permalink-Click ruft clipboard.writeText mit permalinkUrl', async () => {
		render(ShareSheet, defaultProps());
		await page.getByTestId('share-option-permalink').click();
		expect(clipboardSpy).toHaveBeenCalledWith(PERMALINK);
	});

	it('Permalink-Click swappt Icon + Label zu "kopiert"', async () => {
		render(ShareSheet, defaultProps());
		await page.getByTestId('share-option-permalink').click();
		const btn = (await page.getByTestId('share-option-permalink').element()) as HTMLElement;
		expect(btn.textContent).toMatch(/kopiert/i);
	});

	it('KI-Kopieren ruft clipboard.writeText mit llmExportText + zeigt Token-Approximation', async () => {
		render(ShareSheet, defaultProps());
		await page.getByTestId('share-option-llm').click();
		expect(clipboardSpy).toHaveBeenCalledWith(LLM_TEXT);
		const subtext = (await page.getByTestId('share-option-llm-tokens').element()) as HTMLElement;
		expect(subtext.textContent).toMatch(/≈/);
	});

	it('Esc-Key ruft onClose', async () => {
		let closed = false;
		render(ShareSheet, { ...defaultProps(), onClose: () => (closed = true) });
		const sheet = (await page.getByTestId('share-sheet').element()) as HTMLElement;
		sheet.focus();
		sheet.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(closed).toBe(true);
	});

	it('aria-live Region kommuniziert Feedback', async () => {
		render(ShareSheet, defaultProps());
		const live = (await page.getByTestId('share-sheet-live').element()) as HTMLElement;
		expect(live.getAttribute('aria-live')).toBe('polite');
	});

	it('OG-Preview wenn ogImageUrl gesetzt', async () => {
		render(ShareSheet, { ...defaultProps(), ogImageUrl: 'https://example.com/og.png' });
		const img = (await page.getByTestId('share-og-preview').element()) as HTMLImageElement;
		expect(img.src).toContain('og.png');
		expect(img.getAttribute('loading')).toBe('lazy');
		expect(img.getAttribute('alt')).toMatch(/Boxhagener/);
	});

	it('OG-Preview ausgeblendet ohne ogImageUrl', async () => {
		render(ShareSheet, defaultProps());
		await expect.element(page.getByTestId('share-og-preview')).not.toBeInTheDocument();
	});

	// i18n Block B3b
	it('lang="en": Titel, Optionen und Token-Approximation englisch', async () => {
		render(ShareSheet, { ...defaultProps(), lang: 'en' });
		await expect.element(page.getByText('Share', { exact: true })).toBeInTheDocument();
		await expect
			.element(page.getByTestId('share-option-permalink'))
			.toHaveTextContent('Copy permalink');
		await expect.element(page.getByTestId('share-option-llm')).toHaveTextContent('Copy for AI');
		await expect.element(page.getByTestId('share-option-print')).toHaveTextContent('Print');
	});

	it('rendert englisch über den Default-Pfad (getLocale())', async () => {
		overwriteGetLocale(() => 'en');
		render(ShareSheet, defaultProps());
		await expect.element(page.getByText('Share', { exact: true })).toBeInTheDocument();
	});

	it('KI-Kopieren englisch zeigt Live-Region-Text mit Token-Approximation', async () => {
		render(ShareSheet, { ...defaultProps(), lang: 'en' });
		await page.getByTestId('share-option-llm').click();
		const live = (await page.getByTestId('share-sheet-live').element()) as HTMLElement;
		expect(live.textContent).toMatch(/LLM markdown copied/);
	});

	// Review-Fund: `formatDecimal` ohne `minimumFractionDigits` liess die
	// Nachkommastelle bei runden Tausendern verschwinden ("≈ 2k Tokens" statt
	// vormals "≈ 2,0k Tokens" via `.toFixed(1)`).
	it('Token-Approximation > 1000 zeigt DE eine Nachkommastelle ("2,0k")', async () => {
		const bigText = 'x'.repeat(8000); // 8000 Zeichen / 4 = 2000 Tokens exakt
		render(ShareSheet, { ...defaultProps(), llmExportText: bigText });
		const subtext = (await page.getByTestId('share-option-llm-tokens').element()) as HTMLElement;
		expect(subtext.textContent).toContain('2,0k');
	});

	it('Token-Approximation > 1000 zeigt EN eine Nachkommastelle ("2.0k")', async () => {
		const bigText = 'x'.repeat(8000);
		render(ShareSheet, { ...defaultProps(), llmExportText: bigText, lang: 'en' });
		const subtext = (await page.getByTestId('share-option-llm-tokens').element()) as HTMLElement;
		expect(subtext.textContent).toContain('2.0k');
	});
});
