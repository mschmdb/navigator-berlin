import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import Harness from './compare-row-harness.svelte';
import type { LayerHit } from '$lib/data';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

function hit(slug: string, value: unknown): LayerHit {
	return {
		layer: slug,
		value,
		source: 'https://daten.odis-berlin.de',
		updatedAt: '2025-06-01T00:00:00Z',
		license: 'dl-de/zero-2-0'
	};
}

describe('compare-row.svelte', () => {
	it('rendert th + 2 td-Zellen mit Layer-Name', async () => {
		render(Harness, {
			slug: 'laerm-den',
			layerName: 'Straßenlärm',
			hitA: hit('laerm-den', 55),
			hitB: hit('laerm-den', 70)
		});
		const row = (await page.getByTestId('compare-row').element()) as HTMLElement;
		const th = row.querySelector('th[scope="row"]');
		expect(th?.textContent?.trim()).toBe('Straßenlärm');
		expect(row.querySelectorAll('td')).toHaveLength(2);
	});

	it('A günstiger (lower Lärm) → diff-arrow-a + data-direction="a-better"', async () => {
		render(Harness, {
			slug: 'laerm-den',
			layerName: 'Straßenlärm',
			hitA: hit('laerm-den', 55),
			hitB: hit('laerm-den', 70)
		});
		const row = (await page.getByTestId('compare-row').element()) as HTMLElement;
		expect(row.getAttribute('data-direction')).toBe('a-better');
		await expect.element(page.getByTestId('diff-arrow-a')).toBeInTheDocument();
	});

	it('B günstiger → ArrowUp in B-Zelle (diff-arrow-b)', async () => {
		render(Harness, {
			slug: 'laerm-den',
			layerName: 'Straßenlärm',
			hitA: hit('laerm-den', 70),
			hitB: hit('laerm-den', 55)
		});
		const row = (await page.getByTestId('compare-row').element()) as HTMLElement;
		expect(row.getAttribute('data-direction')).toBe('b-better');
		await expect.element(page.getByTestId('diff-arrow-b')).toBeInTheDocument();
	});

	it('gleicher Wert → diff-equal-a', async () => {
		render(Harness, {
			slug: 'laerm-den',
			layerName: 'Straßenlärm',
			hitA: hit('laerm-den', 60),
			hitB: hit('laerm-den', 60)
		});
		const row = (await page.getByTestId('compare-row').element()) as HTMLElement;
		expect(row.getAttribute('data-direction')).toBe('equal');
	});

	it('Layer nur in A → B-Zelle zeigt en-dash mit aria-label "Keine Daten verfügbar"', async () => {
		render(Harness, {
			slug: 'laerm-den',
			layerName: 'Straßenlärm',
			hitA: hit('laerm-den', 55),
			hitB: null
		});
		const row = (await page.getByTestId('compare-row').element()) as HTMLElement;
		const cells = row.querySelectorAll('td');
		const bCellText = cells[1]?.textContent ?? '';
		expect(bCellText).toMatch(/–/);
		const bDash = cells[1]?.querySelector('[aria-label="Keine Daten verfügbar"]');
		expect(bDash).not.toBeNull();
	});

	it('Stolpersteine zeigt advisory + delta-label, NIE a-better/b-better', async () => {
		render(Harness, {
			slug: 'stolpersteine',
			layerName: 'Stolpersteine',
			hitA: hit('stolpersteine', 3),
			hitB: hit('stolpersteine', 8)
		});
		const row = (await page.getByTestId('compare-row').element()) as HTMLElement;
		expect(row.getAttribute('data-direction')).toBe('not-comparable');
		const delta = (await page.getByTestId('compare-delta-label').element()) as HTMLElement;
		expect(delta.textContent).toMatch(/3.*vs.*8/);
		const adv = (await page.getByTestId('compare-advisory').element()) as HTMLElement;
		expect(adv.textContent).toMatch(/Erinnerungs|Würde/i);
	});

	it('Bodenrichtwert zeigt delta-label + advisory ohne a/b-better', async () => {
		render(Harness, {
			slug: 'bodenrichtwerte',
			layerName: 'Bodenrichtwert',
			hitA: hit('bodenrichtwerte', { richtwert: 8000 }),
			hitB: hit('bodenrichtwerte', { richtwert: 5500 })
		});
		const row = (await page.getByTestId('compare-row').element()) as HTMLElement;
		expect(row.getAttribute('data-direction')).toBe('not-comparable');
		await expect.element(page.getByTestId('compare-advisory')).toBeInTheDocument();
	});

	it('Layer-Namens-th hat scope="row" (a11y)', async () => {
		render(Harness, {
			slug: 'laerm-den',
			layerName: 'Straßenlärm',
			hitA: hit('laerm-den', 55),
			hitB: hit('laerm-den', 70)
		});
		const row = (await page.getByTestId('compare-row').element()) as HTMLElement;
		const th = row.querySelector('th');
		expect(th?.getAttribute('scope')).toBe('row');
	});

	// i18n Block B3c: EN-Locale schaltet Aria-Labels, Delta-Label und "keine
	// Daten"-Text auf Englisch um.
	describe('i18n Block B3c (EN)', () => {
		it('A günstiger: Aria-Label + Delta-Label englisch', async () => {
			overwriteGetLocale(() => 'en');
			render(Harness, {
				slug: 'laerm-den',
				layerName: 'Straßenlärm',
				hitA: hit('laerm-den', 55),
				hitB: hit('laerm-den', 70)
			});
			const cellA = (await page.getByTestId('compare-row').element()) as HTMLElement;
			const groupA = cellA.querySelector('[role="group"]');
			expect(groupA?.getAttribute('aria-label')).toBe('Address A is better for Straßenlärm');
			const delta = (await page.getByTestId('compare-delta-label').element()) as HTMLElement;
			expect(delta.textContent).toMatch(/15.*dB.*less/i);
		});

		it('fehlender Wert: "No data available" statt "Keine Daten verfügbar"', async () => {
			overwriteGetLocale(() => 'en');
			render(Harness, {
				slug: 'laerm-den',
				layerName: 'Straßenlärm',
				hitA: hit('laerm-den', 55),
				hitB: null
			});
			const row = (await page.getByTestId('compare-row').element()) as HTMLElement;
			const bDash = row
				.querySelectorAll('td')[1]
				?.querySelector('[aria-label="No data available"]');
			expect(bDash).not.toBeNull();
		});

		it('A ungünstiger (worse): Aria-Label englisch', async () => {
			overwriteGetLocale(() => 'en');
			render(Harness, {
				slug: 'laerm-den',
				layerName: 'Straßenlärm',
				hitA: hit('laerm-den', 70),
				hitB: hit('laerm-den', 55)
			});
			const row = (await page.getByTestId('compare-row').element()) as HTMLElement;
			const groupA = row.querySelector('[role="group"]');
			expect(groupA?.getAttribute('aria-label')).toBe('Address A is worse for Straßenlärm');
		});

		it('gleicher Wert (equal): Aria-Label englisch', async () => {
			overwriteGetLocale(() => 'en');
			render(Harness, {
				slug: 'laerm-den',
				layerName: 'Straßenlärm',
				hitA: hit('laerm-den', 60),
				hitB: hit('laerm-den', 60)
			});
			const row = (await page.getByTestId('compare-row').element()) as HTMLElement;
			const groupA = row.querySelector('[role="group"]');
			expect(groupA?.getAttribute('aria-label')).toBe('Address A and B are equal for Straßenlärm');
		});

		it('not-comparable (kategorisch, unterschiedlich): Aria-Label englisch', async () => {
			overwriteGetLocale(() => 'en');
			render(Harness, {
				slug: 'bezirke',
				layerName: 'Bezirke',
				hitA: hit('bezirke', 'Mitte'),
				hitB: hit('bezirke', 'Pankow')
			});
			const row = (await page.getByTestId('compare-row').element()) as HTMLElement;
			expect(row.getAttribute('data-direction')).toBe('not-comparable');
			const groupA = row.querySelector('[role="group"]');
			expect(groupA?.getAttribute('aria-label')).toBe('Bezirke, comparison not possible');
		});

		it('ValueChip-Aria-Label trägt die englische Severity-Beschreibung', async () => {
			overwriteGetLocale(() => 'en');
			render(Harness, {
				slug: 'laerm-den',
				layerName: 'Straßenlärm',
				hitA: hit('laerm-den', 55),
				hitB: hit('laerm-den', 70)
			});
			const chip = (await page.getByTestId('value-chip').first().element()) as HTMLElement;
			expect(chip.getAttribute('aria-label')).toMatch(/elevated exposure/);
		});
	});
});
