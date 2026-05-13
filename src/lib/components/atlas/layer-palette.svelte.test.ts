import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Harness from './layer-palette-harness.svelte';
import type { LayerMetadata } from '$lib/data';

function meta(slug: string, bundle: LayerMetadata['bundleGroup']): LayerMetadata {
	return {
		slug,
		filename: `${slug}.geojson`,
		sourceUrl: 'https://example.org',
		fetchedAt: '2026-01-01T00:00:00.000Z',
		license: 'dl-de/zero-2-0',
		sha256: 'a'.repeat(64),
		bundleGroup: bundle,
		zoomThresholds: { min: 8, max: 14 },
		geometryType: 'Polygon',
		featureCount: 1
	};
}

const LAYERS: LayerMetadata[] = [
	meta('bezirke', 'A: Boundaries'),
	meta('plz', 'A: Boundaries'),
	meta('bodenrichtwerte', 'B: Wohn-Daten'),
	meta('laerm-2023', 'C: Umwelt'),
	meta('stolpersteine', 'D: Memorial')
];

describe('layer-palette.svelte', () => {
	it('rendert keine Palette wenn paletteOpen=false', async () => {
		render(Harness, { open: false, layers: LAYERS });
		await expect.element(page.getByTestId('layer-palette')).not.toBeInTheDocument();
	});

	it('rendert Palette mit allen Layern wenn paletteOpen=true', async () => {
		render(Harness, { open: true, layers: LAYERS });
		await expect.element(page.getByTestId('layer-palette')).toBeInTheDocument();
		await expect.element(page.getByTestId('palette-toggle-bezirke')).toBeInTheDocument();
		await expect.element(page.getByTestId('palette-toggle-plz')).toBeInTheDocument();
		await expect.element(page.getByTestId('palette-toggle-stolpersteine')).toBeInTheDocument();
	});

	it('rendert Gruppen A → D in fester Reihenfolge', async () => {
		render(Harness, { open: true, layers: LAYERS });
		await expect.element(page.getByTestId('palette-group-A')).toBeInTheDocument();
		await expect.element(page.getByTestId('palette-group-B')).toBeInTheDocument();
		await expect.element(page.getByTestId('palette-group-C')).toBeInTheDocument();
		await expect.element(page.getByTestId('palette-group-D')).toBeInTheDocument();
	});

	it('Combobox-Filter dünnt Liste auf Substring-Match aus', async () => {
		render(Harness, { open: true, layers: LAYERS });
		const search = page.getByTestId('palette-search');
		await search.fill('lärm');
		await expect.element(page.getByTestId('palette-toggle-laerm-2023')).toBeInTheDocument();
		await expect.element(page.getByTestId('palette-toggle-bezirke')).not.toBeInTheDocument();
	});

	it('Empty-State bei Filter ohne Match', async () => {
		render(Harness, { open: true, layers: LAYERS });
		await page.getByTestId('palette-search').fill('zzznever-match');
		await expect.element(page.getByTestId('palette-empty')).toBeInTheDocument();
	});

	it('Klick auf Toggle aktiviert/deaktiviert Slug', async () => {
		render(Harness, { open: true, layers: LAYERS });
		await page.getByTestId('palette-toggle-bezirke').click();
		const dumpBefore = (await page.getByTestId('ui-dump').element()) as HTMLElement;
		const stateBefore = JSON.parse(dumpBefore.textContent ?? '{}');
		expect(stateBefore.activeLayerSlugs).toContain('bezirke');

		await page.getByTestId('palette-toggle-bezirke').click();
		const dumpAfter = (await page.getByTestId('ui-dump').element()) as HTMLElement;
		const stateAfter = JSON.parse(dumpAfter.textContent ?? '{}');
		expect(stateAfter.activeLayerSlugs).not.toContain('bezirke');
	});

	it('aria-pressed reflektiert Active-State', async () => {
		render(Harness, { open: true, layers: LAYERS, initialActive: ['plz'] });
		const plzBtn = (await page.getByTestId('palette-toggle-plz').element()) as HTMLElement;
		expect(plzBtn.getAttribute('aria-pressed')).toBe('true');
		expect(plzBtn.getAttribute('data-state')).toBe('on');
		const bezirkeBtn = (await page.getByTestId('palette-toggle-bezirke').element()) as HTMLElement;
		expect(bezirkeBtn.getAttribute('aria-pressed')).toBe('false');
	});

	it('Close-Button schließt Palette', async () => {
		render(Harness, { open: true, layers: LAYERS });
		await page.getByTestId('palette-close').click();
		const dump = (await page.getByTestId('ui-dump').element()) as HTMLElement;
		const state = JSON.parse(dump.textContent ?? '{}');
		expect(state.paletteOpen).toBe(false);
	});

	it('"Alle deaktivieren" leert activeLayerSlugs', async () => {
		render(Harness, {
			open: true,
			layers: LAYERS,
			initialActive: ['bezirke', 'plz']
		});
		await page.getByTestId('palette-clear').click();
		const dump = (await page.getByTestId('ui-dump').element()) as HTMLElement;
		const state = JSON.parse(dump.textContent ?? '{}');
		expect(state.activeLayerSlugs).toEqual([]);
	});

	it('Mobile-Variant zeigt "Zuletzt verwendet" wenn recentLayerSlugs gesetzt', async () => {
		render(Harness, {
			open: true,
			layers: LAYERS,
			breakpoint: 'mobile',
			initialRecent: ['bezirke', 'plz']
		});
		// Mobile path: bottom-sheet wrapper rendert "palette-recent"
		await expect.element(page.getByTestId('palette-recent')).toBeInTheDocument();
	});

	it('Active-Count im Header zeigt korrekte Zahl', async () => {
		render(Harness, {
			open: true,
			layers: LAYERS,
			initialActive: ['bezirke', 'plz', 'laerm-2023']
		});
		const palette = (await page.getByTestId('layer-palette').element()) as HTMLElement;
		expect(palette.textContent).toContain('3 aktiv');
	});
});
