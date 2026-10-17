import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import LayerCard from './layer-card.svelte';
import type { LayerHit } from '$lib/data';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const hit: LayerHit = {
	layer: 'laerm-2023',
	value: { plr_id: '01100101', plr_name: 'Stülerstraße', kategorie: 'gering' },
	source: '',
	updatedAt: '',
	license: 'dl-de/by-2-0'
};

describe('LayerCard', () => {
	it('zeigt Adress-Wert-Chip', async () => {
		render(LayerCard, { hit, layerName: 'Lärmbelastung 2023', contextRows: [] });
		await expect.element(page.getByTestId('value-chip')).toBeInTheDocument();
	});

	it('rendert vorgebaute Kontext-Zeilen (label + text)', async () => {
		render(LayerCard, {
			hit,
			layerName: 'Lärmbelastung 2023',
			contextRows: [
				{ id: 'kiez', label: 'Parkviertel', text: 'meist mittel (66.7%)' },
				{ id: 'bezirk', label: 'Mitte', text: 'meist hoch (53.1%)' },
				{ id: 'berlin', label: 'Berlin', text: 'meist mittel (50%)' }
			]
		});
		const card = (await page.getByTestId('layer-card').element()) as HTMLElement;
		expect(card.textContent).toContain('Parkviertel');
		expect(card.textContent).toContain('meist mittel (66.7%)');
	});

	it('Kontext-Zeile mit Stufe: Punkt in Stufenfarbe, aria-hidden (GH-88)', async () => {
		render(LayerCard, {
			hit,
			layerName: 'Lärmbelastung 2023',
			contextRows: [
				{ id: 'kiez', label: 'Parkviertel', text: 'meist hoch, 50 %', severity: 'danger' },
				{ id: 'laerm-db', label: 'Lärm-Mittel (Kiez)', text: '56 dB (L_DEN)' }
			]
		});
		const card = (await page.getByTestId('layer-card').element()) as HTMLElement;
		const dots = card.querySelectorAll('[data-testid="context-severity-dot"]');
		expect(dots).toHaveLength(1);
		const dot = dots[0] as HTMLElement;
		expect(dot.getAttribute('aria-hidden')).toBe('true');
		expect(dot.dataset.severity).toBe('danger');
		expect(dot.className).toMatch(/bg-severity-danger(\s|$)/);
	});

	it('langer Kontext-Wert bricht nicht um, das Label gibt Platz ab', async () => {
		// Komponententests laden kein Tailwind-CSS, darum Klassen statt Geometrie prüfen.
		render(LayerCard, {
			hit,
			layerName: 'Umweltgerechtigkeit 2023',
			contextRows: [
				{
					id: 'berlin',
					label: 'Berlin',
					text: 'meist keine starke Belastung, 34,5 %',
					severity: 'success'
				}
			]
		});
		const card = (await page.getByTestId('layer-card').element()) as HTMLElement;
		const dl = card.querySelector('dl') as HTMLElement;
		expect(dl.className).toMatch(/grid-cols-\[minmax\(0,1fr\)_auto\]/);
		const dt = card.querySelector('dt') as HTMLElement;
		expect(dt.className).toMatch(/min-w-0/);
		expect(dt.className).not.toMatch(/\btruncate\b/);
		const dd = card.querySelector('dd') as HTMLElement;
		expect(dd.className).toMatch(/whitespace-nowrap/);
		expect(dd.className).toMatch(/tabular-nums/);
	});

	it('Titel, Stufen-Badge und Auge liegen auf einer Mittelachse (GH-88)', async () => {
		// Komponententests laden kein Tailwind-CSS, darum Klassen statt Geometrie prüfen.
		render(LayerCard, {
			hit,
			layerName: 'Lärmbelastung 2023',
			contextRows: [],
			onToggleLayer: () => {}
		});
		const toggle = (await page.getByTestId('map-toggle').element()) as HTMLElement;
		const header = toggle.parentElement as HTMLElement;
		expect(header.className).toMatch(/(^|\s)items-center(\s|$)/);
		const chipWrap = ((await page.getByTestId('value-chip').element()) as HTMLElement)
			.parentElement as HTMLElement;
		expect(chipWrap.className).not.toMatch(/(^|\s)(pt|mt|-my|-mt)-/);
		expect(toggle.className).not.toMatch(/(^|\s)-my-/);
		expect(toggle.className).toMatch(/size-\(--target-min\)/);
	});

	it('ohne Kontext-Zeilen: nur Chip, keine dl', async () => {
		render(LayerCard, { hit, layerName: 'Lärmbelastung 2023', contextRows: [] });
		await expect.element(page.getByTestId('value-chip')).toBeInTheDocument();
		const card = (await page.getByTestId('layer-card').element()) as HTMLElement;
		expect(card.querySelector('dl')).toBeNull();
	});

	it('POI ohne Chip: Name prominent + Adresse als Kontext', async () => {
		const kita: LayerHit = {
			layer: 'kitas-2024',
			value: { e_name: 'Kita Sonnenschein', e_strasse: 'Musterstraße', e_hnr: '1' },
			source: '',
			updatedAt: '',
			license: 'dl-de/by-2-0'
		};
		render(LayerCard, { hit: kita, layerName: 'Kindertagesstätten', contextRows: [] });
		await expect.element(page.getByTestId('poi-value')).toHaveTextContent('Kita Sonnenschein');
		const card = (await page.getByTestId('layer-card').element()) as HTMLElement;
		expect(card.textContent).toContain('Musterstraße 1');
		expect(card.querySelector('[data-testid="value-chip"]')).toBeNull();
	});

	it('no-coverage: zeigt "Daten nicht vorhanden" statt Wert', async () => {
		const miss: LayerHit = {
			layer: 'kitas-2024',
			value: null,
			reason: 'no-coverage',
			source: '',
			updatedAt: '',
			license: 'dl-de/by-2-0'
		};
		render(LayerCard, { hit: miss, layerName: 'Kindertagesstätten', contextRows: [] });
		const card = (await page.getByTestId('layer-card').element()) as HTMLElement;
		expect(card.textContent).toContain('Daten nicht vorhanden');
		expect(card.querySelector('[data-testid="poi-value"]')).toBeNull();
	});

	// i18n Block B3a Task 3: DE hat KEINEN URL-Präfix (Boundary), vormals
	// `/de/layer/...` (301-Umweg-Bug).
	it('Titel-Link hat bei lang: "de" keinen /de/-Präfix', async () => {
		render(LayerCard, { hit, layerName: 'Lärmbelastung 2023', contextRows: [], lang: 'de' });
		const link = (await page.getByTestId('layer-card-title-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/layer/laerm-2023');
	});

	it('Titel-Link nutzt /en/-Präfix bei lang: "en"', async () => {
		render(LayerCard, {
			hit,
			layerName: 'Noise pollution 2023',
			contextRows: [],
			lang: 'en'
		});
		const link = (await page.getByTestId('layer-card-title-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/en/layer/laerm-2023');
	});

	// i18n Block B3b
	it('lang="en": no-coverage-Text + Map-Toggle-Titel englisch', async () => {
		const miss: LayerHit = {
			layer: 'kitas-2024',
			value: null,
			reason: 'no-coverage',
			source: '',
			updatedAt: '',
			license: 'dl-de/by-2-0'
		};
		render(LayerCard, {
			hit: miss,
			layerName: 'Kindergartens',
			contextRows: [],
			lang: 'en',
			onToggleLayer: () => {}
		});
		const card = (await page.getByTestId('layer-card').element()) as HTMLElement;
		expect(card.textContent).toContain('No data available');
		await expect.element(page.getByTestId('card-details-toggle')).not.toBeInTheDocument();
		const toggle = (await page.getByTestId('map-toggle').element()) as HTMLButtonElement;
		expect(toggle.getAttribute('title')).toBe('Show on map');
	});

	it('rendert englisch über den Default-Pfad (getLocale())', async () => {
		overwriteGetLocale(() => 'en');
		render(LayerCard, { hit, layerName: 'Noise pollution 2023', contextRows: [] });
		const link = (await page.getByTestId('layer-card-title-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/en/layer/laerm-2023');
	});
});
