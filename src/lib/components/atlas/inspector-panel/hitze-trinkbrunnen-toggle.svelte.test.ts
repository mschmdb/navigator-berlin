import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import HitzeTrinkbrunnenToggle from './hitze-trinkbrunnen-toggle.svelte';
import { featureToTrinkbrunnen, type Trinkbrunnen } from '$lib/data/get-trinkbrunnen-index.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const brunnen: Trinkbrunnen[] = [
	featureToTrinkbrunnen({
		type: 'Feature',
		id: 1,
		geometry: { type: 'Point', coordinates: [13.406, 52.521] },
		properties: { name: 'Nah-Brunnen', fee: 'no', bottle: 'yes' }
	})
];

describe('HitzeTrinkbrunnenToggle', () => {
	it('Klick auf den Toggle meldet den trinkbrunnen-Slug', async () => {
		const onToggleLayer = vi.fn();
		render(HitzeTrinkbrunnenToggle, { isActive: false, onToggleLayer });
		await page.getByTestId('trinkbrunnen-map-toggle').click();
		expect(onToggleLayer).toHaveBeenCalledWith('trinkbrunnen');
	});

	it('aria-pressed spiegelt den aktiven Zustand', async () => {
		render(HitzeTrinkbrunnenToggle, { isActive: true, onToggleLayer: () => {} });
		const btn = (await page.getByTestId('trinkbrunnen-map-toggle').element()) as HTMLButtonElement;
		expect(btn.getAttribute('aria-pressed')).toBe('true');
	});

	it('zeigt klaren Text-Button je nach Zustand', async () => {
		render(HitzeTrinkbrunnenToggle, { isActive: false, onToggleLayer: () => {} });
		await expect.element(page.getByText('Trinkbrunnen einblenden')).toBeInTheDocument();
	});

	it('aktiv zeigt Ausblenden-Label', async () => {
		render(HitzeTrinkbrunnenToggle, { isActive: true, onToggleLayer: () => {} });
		await expect.element(page.getByText('Trinkbrunnen ausblenden')).toBeInTheDocument();
	});

	it('ohne onToggleLayer kein Toggle-Button', async () => {
		render(HitzeTrinkbrunnenToggle, { isActive: false });
		await expect.element(page.getByTestId('trinkbrunnen-map-toggle')).not.toBeInTheDocument();
	});

	it('zeigt den nächsten Brunnen mit Navi-Links bei address + index', async () => {
		render(HitzeTrinkbrunnenToggle, {
			isActive: false,
			onToggleLayer: () => {},
			address: { lat: 52.52, lng: 13.405 },
			index: brunnen
		});
		await expect.element(page.getByTestId('trinkbrunnen-nearest')).toBeInTheDocument();
		await expect.element(page.getByText('Nächster: Nah-Brunnen')).toBeInTheDocument();
		const g = (await page
			.getByRole('link', { name: /Google Maps/ })
			.element()) as HTMLAnchorElement;
		expect(g.getAttribute('href')).toContain('google.com/maps');
	});

	it('ohne address keine Nächster-Zeile', async () => {
		render(HitzeTrinkbrunnenToggle, { isActive: false, onToggleLayer: () => {}, index: brunnen });
		await expect.element(page.getByTestId('trinkbrunnen-nearest')).not.toBeInTheDocument();
	});

	// i18n Block B3b
	it('lang="en": Heading, Nächster-Zeile, Badges und Toggle-Label englisch', async () => {
		render(HitzeTrinkbrunnenToggle, {
			isActive: false,
			onToggleLayer: () => {},
			address: { lat: 52.52, lng: 13.405 },
			index: brunnen,
			lang: 'en'
		});
		await expect
			.element(page.getByRole('heading', { name: 'Drinking fountains' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Nearest: Nah-Brunnen')).toBeInTheDocument();
		await expect.element(page.getByText('bottle refill')).toBeInTheDocument();
		await expect.element(page.getByText('Show drinking fountains')).toBeInTheDocument();
	});

	it('rendert englisch über den Default-Pfad (getLocale())', async () => {
		overwriteGetLocale(() => 'en');
		render(HitzeTrinkbrunnenToggle, { isActive: true, onToggleLayer: () => {} });
		await expect.element(page.getByText('Hide drinking fountains')).toBeInTheDocument();
	});

	// i18n Block C1: `explain.short` ist jetzt selbst locale-fähig (Messages)
	// -- kein `lang="de"`-Override mehr auf EN.
	it('explain.short zeigt EN-Text ohne lang-Attribut bei lang="en"', async () => {
		const { container } = render(HitzeTrinkbrunnenToggle, {
			isActive: false,
			onToggleLayer: () => {},
			lang: 'en'
		});
		const explain = container.querySelector('[data-testid="hitze-trinkbrunnen-toggle"] > p');
		expect(explain?.textContent).toMatch(/Public drinking fountain/);
		expect(explain?.getAttribute('lang')).toBeNull();
	});

	it('explain.short hat KEIN lang-Attribut auf DE', async () => {
		const { container } = render(HitzeTrinkbrunnenToggle, {
			isActive: false,
			onToggleLayer: () => {}
		});
		const explain = container.querySelector('[data-testid="hitze-trinkbrunnen-toggle"] > p');
		expect(explain?.getAttribute('lang')).toBeNull();
	});
});
