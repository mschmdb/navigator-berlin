import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MapLegend from './map-legend.svelte';
import type { LayerMetadata } from '$lib/data';
import { dotSpecForSlug } from './internal/choropleth-dots.js';
import { SCORE_DOT_BASE_PX } from './internal/dimension-ramps.js';

function meta(slug: string, opts: Partial<LayerMetadata> = {}): LayerMetadata {
	return {
		slug,
		filename: `${slug}.geojson`,
		sourceUrl: 'https://gdi.berlin.de/services/wfs/example',
		fetchedAt: '2026-01-01T00:00:00.000Z',
		license: 'dl-de/zero-2-0',
		sha256: 'a'.repeat(64),
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 8, max: 14 },
		geometryType: 'Polygon',
		featureCount: 1,
		...opts
	};
}

describe('map-legend.svelte', () => {
	it('rendert nicht wenn activeLayerSlugs leer', async () => {
		const { container } = render(MapLegend, { activeLayerSlugs: [] });
		expect(container.querySelector('[data-testid="map-legend"]')).toBeNull();
	});

	it('rendert categorical-Legend für choropleth-belastung-3 (laerm-2023)', async () => {
		render(MapLegend, { activeLayerSlugs: ['laerm-2023'] });
		await expect.element(page.getByTestId('map-legend')).toBeInTheDocument();
		await expect.element(page.getByTestId('legend-laerm-2023')).toBeInTheDocument();
		await expect.element(page.getByText('Lärmbelastung 2023')).toBeInTheDocument();
		await expect.element(page.getByText('gering', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('mittel', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('hoch', { exact: true })).toBeInTheDocument();
	});

	it('rendert gradient-Legend mit Range-Labels (choropleth-pet)', async () => {
		render(MapLegend, { activeLayerSlugs: ['klima-pet-2022'] });
		await expect.element(page.getByText('Gefühlte Temperatur 2022')).toBeInTheDocument();
		await expect.element(page.getByText('kühl', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('heiß', { exact: true })).toBeInTheDocument();
	});

	it('rendert Wohnlage-Choropleth (3 Klassen)', async () => {
		render(MapLegend, { activeLayerSlugs: ['wohnlagen-2024'] });
		await expect.element(page.getByText('Mietspiegel-Wohnlage 2024')).toBeInTheDocument();
		await expect.element(page.getByText('gut', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('mittel', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('einfach', { exact: true })).toBeInTheDocument();
	});

	it('mehrere Layer → mehrere Legenden-Sektionen', async () => {
		render(MapLegend, { activeLayerSlugs: ['bezirke', 'laerm-2023', 'ubahn-stationen'] });
		await expect.element(page.getByTestId('legend-bezirke')).toBeInTheDocument();
		await expect.element(page.getByTestId('legend-laerm-2023')).toBeInTheDocument();
		await expect.element(page.getByTestId('legend-ubahn-stationen')).toBeInTheDocument();
	});

	it('ÖPNV-Layer rendert point-marker', async () => {
		render(MapLegend, { activeLayerSlugs: ['sbahn-stationen'] });
		await expect.element(page.getByText('S-Bahn-Station', { exact: true })).toBeInTheDocument();
	});

	it('Pin-Layer rendert das Karten-Icon in der Legende (kuehle-orte Schneeflocke)', async () => {
		render(MapLegend, { activeLayerSlugs: ['kuehle-orte'] });
		const marker = (await page.getByTestId('legend-icon-kuehle-orte').element()) as HTMLElement;
		const svg = marker.querySelector('svg');
		expect(svg).not.toBeNull();
		expect(svg?.getAttribute('stroke')).toBe('#0277BD');
	});

	// Story 1.16 AC-3: Legend-Expand-Panel
	describe('Story 1.16 Expand-Panel', () => {
		it('Layer-Section ist standardmäßig kollabiert (details closed)', async () => {
			const m = [meta('laerm-2023')];
			render(MapLegend, { activeLayerSlugs: ['laerm-2023'], manifestLayers: m });
			const det = (await page
				.getByTestId('legend-details-laerm-2023')
				.element()) as HTMLDetailsElement;
			expect(det.open).toBe(false);
		});

		it('Klick auf Summary expandiert Panel mit long-Explain', async () => {
			const m = [meta('laerm-2023')];
			render(MapLegend, { activeLayerSlugs: ['laerm-2023'], manifestLayers: m });
			await page.getByTestId('legend-summary-laerm-2023').click();
			const expand = (await page.getByTestId('legend-expand-laerm-2023').element()) as HTMLElement;
			expect(expand.textContent).toMatch(/Lärm-Gesamtbelastung/);
		});

		it('Expand zeigt Source-URL als Link', async () => {
			const m = [meta('laerm-2023', { sourceUrl: 'https://gdi.berlin.de/services/wfs/ua' })];
			render(MapLegend, { activeLayerSlugs: ['laerm-2023'], manifestLayers: m });
			await page.getByTestId('legend-summary-laerm-2023').click();
			const link = (await page
				.getByTestId('legend-source-link-laerm-2023')
				.element()) as HTMLAnchorElement;
			expect(link.href).toBe('https://gdi.berlin.de/services/wfs/ua');
			expect(link.target).toBe('_blank');
		});

		it('Expand zeigt License-Label (gekürzt)', async () => {
			const m = [meta('laerm-2023', { license: 'dl-de/zero-2-0' })];
			render(MapLegend, { activeLayerSlugs: ['laerm-2023'], manifestLayers: m });
			await page.getByTestId('legend-summary-laerm-2023').click();
			const lic = (await page.getByTestId('legend-license-laerm-2023').element()) as HTMLElement;
			expect(lic.textContent).toMatch(/dl-de\/zero/);
		});

		it('Expand zeigt valueScaleExplain falls vorhanden (klima-pet-2022)', async () => {
			const m = [meta('klima-pet-2022')];
			render(MapLegend, { activeLayerSlugs: ['klima-pet-2022'], manifestLayers: m });
			await page.getByTestId('legend-summary-klima-pet-2022').click();
			const scale = (await page
				.getByTestId('legend-scale-klima-pet-2022')
				.element()) as HTMLElement;
			expect(scale.textContent).toMatch(/32 °C|extrem heiß/);
		});

		it('Expand zeigt Mehr-erfahren-Link auf /lang/layer/slug', async () => {
			const m = [meta('laerm-2023')];
			render(MapLegend, { activeLayerSlugs: ['laerm-2023'], manifestLayers: m, lang: 'de' });
			await page.getByTestId('legend-summary-laerm-2023').click();
			const link = (await page
				.getByTestId('legend-more-link-laerm-2023')
				.element()) as HTMLAnchorElement;
			expect(link.getAttribute('href')).toBe('/de/layer/laerm-2023');
		});

		it('Zweiter Click auf Summary kollabiert wieder', async () => {
			const m = [meta('laerm-2023')];
			render(MapLegend, { activeLayerSlugs: ['laerm-2023'], manifestLayers: m });
			const summary = page.getByTestId('legend-summary-laerm-2023');
			await summary.click();
			await summary.click();
			const det = (await page
				.getByTestId('legend-details-laerm-2023')
				.element()) as HTMLDetailsElement;
			expect(det.open).toBe(false);
		});

		it('Multi-Expand: zwei Layer gleichzeitig offen', async () => {
			const m = [meta('laerm-2023'), meta('luft-2023')];
			render(MapLegend, { activeLayerSlugs: ['laerm-2023', 'luft-2023'], manifestLayers: m });
			await page.getByTestId('legend-summary-laerm-2023').click();
			await page.getByTestId('legend-summary-luft-2023').click();
			const a = (await page
				.getByTestId('legend-details-laerm-2023')
				.element()) as HTMLDetailsElement;
			const b = (await page
				.getByTestId('legend-details-luft-2023')
				.element()) as HTMLDetailsElement;
			expect(a.open).toBe(true);
			expect(b.open).toBe(true);
		});
	});

	// Story 1.14 AC-1, AC-3, AC-4
	describe('Story 1.14 Eye/Remove/Cascade/Limit', () => {
		it('Eye-Toggle nicht im DOM ohne onToggleHidden-Callback (Backward-Compat)', async () => {
			render(MapLegend, { activeLayerSlugs: ['laerm-2023'] });
			await expect.element(page.getByTestId('legend-eye-laerm-2023')).not.toBeInTheDocument();
		});

		it('Remove-Button nicht im DOM ohne onRemove-Callback (Backward-Compat)', async () => {
			render(MapLegend, { activeLayerSlugs: ['laerm-2023'] });
			await expect.element(page.getByTestId('legend-remove-laerm-2023')).not.toBeInTheDocument();
		});

		it('Eye-Toggle ruft onToggleHidden mit Slug auf', async () => {
			let toggled: string | null = null;
			render(MapLegend, {
				activeLayerSlugs: ['laerm-2023'],
				onToggleHidden: (slug: string) => {
					toggled = slug;
				}
			});
			await page.getByTestId('legend-eye-laerm-2023').click();
			expect(toggled).toBe('laerm-2023');
		});

		it('Remove-Button ruft onRemove mit Slug auf', async () => {
			let removed: string | null = null;
			render(MapLegend, {
				activeLayerSlugs: ['laerm-2023'],
				onRemove: (slug: string) => {
					removed = slug;
				}
			});
			await page.getByTestId('legend-remove-laerm-2023').click();
			expect(removed).toBe('laerm-2023');
		});

		it('hiddenSlugs setzt aria-pressed=true auf Eye-Toggle', async () => {
			render(MapLegend, {
				activeLayerSlugs: ['laerm-2023'],
				hiddenSlugs: ['laerm-2023'],
				onToggleHidden: () => {}
			});
			const btn = (await page.getByTestId('legend-eye-laerm-2023').element()) as HTMLElement;
			expect(btn.getAttribute('aria-pressed')).toBe('true');
		});

		it('hiddenSlugs markiert Section data-hidden=true', async () => {
			render(MapLegend, {
				activeLayerSlugs: ['laerm-2023'],
				hiddenSlugs: ['laerm-2023'],
				onToggleHidden: () => {}
			});
			const sec = (await page.getByTestId('legend-laerm-2023').element()) as HTMLElement;
			expect(sec.getAttribute('data-hidden')).toBe('true');
		});

		it('Eye-Button hat aria-label das Toggle-Status reflektiert', async () => {
			render(MapLegend, {
				activeLayerSlugs: ['laerm-2023'],
				onToggleHidden: () => {}
			});
			const btn = (await page.getByTestId('legend-eye-laerm-2023').element()) as HTMLElement;
			expect(btn.getAttribute('aria-label')?.toLowerCase()).toMatch(/ausblenden|hide/);
		});

		it('Variant-Badge nur für Outline-Varianten, fill bleibt unbeschriftet', async () => {
			const variants = new Map<string, 'fill' | 'outline' | 'outline-dash'>([
				['laerm-2023', 'fill'],
				['wohnlagen-2024', 'outline'],
				['klima-pet-2022', 'outline-dash']
			]);
			render(MapLegend, {
				activeLayerSlugs: ['laerm-2023', 'wohnlagen-2024', 'klima-pet-2022'],
				cascadeVariants: variants
			});
			// fill = Normalzustand → kein Badge (kein verwirrendes "gefüllt")
			await expect.element(page.getByTestId('legend-variant-laerm-2023')).not.toBeInTheDocument();
			const b = (await page.getByTestId('legend-variant-wohnlagen-2024').element()) as HTMLElement;
			const c = (await page.getByTestId('legend-variant-klima-pet-2022').element()) as HTMLElement;
			expect(b.getAttribute('data-variant')).toBe('outline');
			expect(c.getAttribute('data-variant')).toBe('outline-dash');
		});

		it('cascadeVariants rendert KEIN Variant-Badge fuer non-polygon-Slugs', async () => {
			const variants = new Map<string, 'fill' | 'outline' | 'outline-dash'>();
			render(MapLegend, {
				activeLayerSlugs: ['ubahn-netz', 'kitas-2024'],
				cascadeVariants: variants
			});
			await expect.element(page.getByTestId('legend-variant-ubahn-netz')).not.toBeInTheDocument();
			await expect.element(page.getByTestId('legend-variant-kitas-2024')).not.toBeInTheDocument();
		});

		it('showLimitWarning rendert aria-live Footer', async () => {
			render(MapLegend, {
				activeLayerSlugs: ['laerm-2023'],
				showLimitWarning: true
			});
			const w = page.getByTestId('legend-limit-warning');
			await expect.element(w).toBeInTheDocument();
			const el = (await w.element()) as HTMLElement;
			expect(el.getAttribute('aria-live')).toBe('polite');
		});

		it('showLimitWarning false rendert keinen Footer', async () => {
			render(MapLegend, {
				activeLayerSlugs: ['laerm-2023'],
				showLimitWarning: false
			});
			await expect.element(page.getByTestId('legend-limit-warning')).not.toBeInTheDocument();
		});
	});
});

describe('map-legend · Score-Kontur mit Wert-Breite', () => {
	it('rendert die Sekundär-Swatches eines Choroplethen als wachsende Quadrate in Kartengröße', async () => {
		const variants = new Map<string, 'fill' | 'outline' | 'outline-dash'>([
			['kiez-score-gesamt', 'fill'],
			['kiez-score-ruhe-luft', 'outline']
		]);
		render(MapLegend, {
			activeLayerSlugs: ['kiez-score-gesamt', 'kiez-score-ruhe-luft'],
			cascadeVariants: variants
		});
		const entry = (await page.getByTestId('legend-kiez-score-ruhe-luft').element()) as HTMLElement;
		const dots = Array.from(entry.querySelectorAll('li span.rounded-sm'));
		expect(dots).toHaveLength(4);
		const spec = dotSpecForSlug('kiez-score-ruhe-luft')!;
		const sizes = dots.map((el) => parseFloat((el as HTMLElement).style.width));
		expect(sizes).toEqual(spec.legendFactors.map((f) => Math.round(SCORE_DOT_BASE_PX * f)));
		// Farbe = Sprite-Farbe des Dot-Specs (Browser gibt rgb() zurück).
		const anchorHex = spec.imageColor;
		const rgb = `rgb(${[1, 3, 5].map((i) => parseInt(anchorHex.slice(i, i + 2), 16)).join(', ')})`;
		for (const el of dots) {
			expect((el as HTMLElement).style.background).toContain(rgb);
		}
	});

	it('lässt Fill-Swatches unverändert gefüllt', async () => {
		const variants = new Map<string, 'fill' | 'outline' | 'outline-dash'>([
			['kiez-score-gesamt', 'fill']
		]);
		render(MapLegend, { activeLayerSlugs: ['kiez-score-gesamt'], cascadeVariants: variants });
		const entry = (await page.getByTestId('legend-kiez-score-gesamt').element()) as HTMLElement;
		const swatch = entry.querySelector('li > span[aria-hidden="true"]') as HTMLElement;
		expect(swatch.style.background).not.toBe('transparent');
	});
});
