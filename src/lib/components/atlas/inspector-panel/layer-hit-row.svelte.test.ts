import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import LayerHitRow from './layer-hit-row.svelte';
import type { LayerHit } from '$lib/data';

const recentHit: LayerHit = {
	layer: 'mietspiegel-wohnlage',
	value: 'gut',
	source: 'https://fbinter.stadt-berlin.de/wfs',
	updatedAt: '2025-06-01T00:00:00Z',
	license: 'dl-de/zero-2-0'
};

describe('layer-hit-row.svelte', () => {
	it('rendert external-link für wohnlagen-2024 (Mietspiegel-Rechner)', async () => {
		render(LayerHitRow, {
			hit: {
				layer: 'wohnlagen-2024',
				value: { wol_mode: 'mittel', plr_name: 'Karlshorst', count_mittel: 12 },
				source: 'https://gdi.berlin.de/services/wfs/wohnlagenadr2024',
				updatedAt: '2024-06-10T00:00:00Z',
				license: 'dl-de/by-2-0'
			},
			layerName: 'Mietspiegel-Wohnlage 2024'
		});
		const link = (await page.getByTestId('external-link').element()) as HTMLAnchorElement;
		expect(link.href).toBe('https://mietspiegel.berlin.de/');
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toMatch(/noopener/);
		expect(link.textContent).toMatch(/Mietspiegel-Rechner/);
	});

	it('rendert keinen external-link für Layer ohne LAYER_EXTERNAL_LINK-Eintrag', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		await expect.element(page.getByTestId('external-link')).not.toBeInTheDocument();
	});

	it('versteckt external-link bei no-coverage', async () => {
		render(LayerHitRow, {
			hit: {
				layer: 'wohnlagen-2024',
				value: null,
				reason: 'no-coverage',
				source: 'https://gdi.berlin.de/services/wfs/wohnlagenadr2024',
				updatedAt: '2024-06-10T00:00:00Z',
				license: 'dl-de/by-2-0'
			},
			layerName: 'Mietspiegel-Wohnlage 2024'
		});
		await expect.element(page.getByTestId('external-link')).not.toBeInTheDocument();
	});

	it('rendert with-value State default', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.getAttribute('data-state')).toBe('with-value');
		expect(row.getAttribute('aria-label')).toMatch(/Mietspiegel-Wohnlage: gut/);
	});

	it('role="group" gesetzt', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.getAttribute('role')).toBe('group');
	});

	it('No-Coverage-Reason → data-state="no-coverage" + Italic-Text', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, value: null, reason: 'no-coverage' },
			layerName: 'Mietspiegel-Wohnlage'
		});
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.getAttribute('data-state')).toBe('no-coverage');
		await expect.element(page.getByTestId('value-no-coverage')).toBeInTheDocument();
	});

	it('Seasonal-Reason → "Mai–Oktober aktiv"-Hinweis', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'trinkbrunnen', value: null, reason: 'seasonal' },
			layerName: 'Trinkbrunnen'
		});
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.getAttribute('data-state')).toBe('seasonal');
		await expect.element(page.getByTestId('value-seasonal')).toBeInTheDocument();
	});

	it('Outdated (>5 Jahre) → data-state="outdated" + banner-outdated-Pille', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, updatedAt: '2019-01-01T00:00:00Z' },
			layerName: 'Mietspiegel-Wohnlage'
		});
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.getAttribute('data-state')).toBe('outdated');
		await expect.element(page.getByTestId('banner-outdated')).toBeInTheDocument();
	});

	it('Numeric Wert nutzt Mono + tabular-nums im ValueChip', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'laerm-den', value: 65 },
			layerName: 'Lärm Tag/Abend/Nacht'
		});
		const val = (await page.getByTestId('value-chip-value').element()) as HTMLElement;
		expect(val.className).toMatch(/font-mono/);
		expect(val.className).toMatch(/tabular-nums/);
		expect(val.textContent?.trim()).toMatch(/65\s*dB/);
	});

	it('Kategorischer Wert: ValueChip mit Semibold (kein tabular-nums)', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
		expect(chip.className).toMatch(/font-semibold/);
		const val = (await page.getByTestId('value-chip-value').element()) as HTMLElement;
		expect(val.className).not.toMatch(/font-mono/);
		expect(val.className).not.toMatch(/tabular-nums/);
	});

	it('rendert Layer-Explain-Text aus LAYER_EXPLAIN_DE', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const explain = (await page.getByTestId('explain').element()) as HTMLElement;
		expect(explain.textContent).toMatch(/Wohnlagen-Bewertung/);
	});

	it('DataStandBanner ist eingebettet', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		await expect.element(page.getByTestId('data-stand-banner')).toBeInTheDocument();
	});

	it('Inspector-Row enthält KEINEN Mailto-Link (Footer-Page deferred)', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		await expect.element(page.getByTestId('error-feedback-mailto')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('report-error')).not.toBeInTheDocument();
	});

	it('Learn-more-Link nutzt lang-Prefix', async () => {
		render(LayerHitRow, {
			hit: recentHit,
			layerName: 'Mietspiegel-Wohnlage',
			lang: 'en'
		});
		const link = (await page.getByTestId('learn-more').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/en/layer/mietspiegel-wohnlage');
	});

	it('Editorial: legal-Disclaimer für mietspiegel-wohnlage sichtbar', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const d = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(d.getAttribute('data-variant')).toBe('legal');
		expect(d.textContent).toMatch(/rechtliche Aussage/);
	});

	it('Editorial: bodenrichtwerte-Layer zeigt legal-Disclaimer', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'bodenrichtwerte', value: 4500 },
			layerName: 'Bodenrichtwerte'
		});
		const d = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(d.getAttribute('data-variant')).toBe('legal');
	});

	it('Editorial: trinkbrunnen INSEASON zeigt aktiv-Pille, KEINEN seasonal-Disclaimer', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'trinkbrunnen', value: { name: 'Brunnen 1' } },
			layerName: 'Trinkbrunnen'
		});
		await expect.element(page.getByTestId('seasonal-pill-active')).toBeInTheDocument();
		await expect.element(page.getByTestId('editorial-disclaimer')).not.toBeInTheDocument();
	});

	it('Editorial: trinkbrunnen OUTOFSEASON zeigt warning-Pille + seasonal-Disclaimer', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'trinkbrunnen', value: null, reason: 'seasonal' },
			layerName: 'Trinkbrunnen'
		});
		await expect.element(page.getByTestId('seasonal-pill-outofseason')).toBeInTheDocument();
		const d = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(d.getAttribute('data-variant')).toBe('seasonal');
	});

	it('Editorial: Layer ohne Config zeigt KEINEN Disclaimer', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'gebaeudealter', value: 'vor 1949' },
			layerName: 'Gebäudealter'
		});
		await expect.element(page.getByTestId('editorial-disclaimer')).not.toBeInTheDocument();
	});

	it('Editorial: Disclaimer rendert Source-Link wenn primarySourceUrl in Config', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const link = (await page.getByTestId('disclaimer-source-link').element()) as HTMLAnchorElement;
		expect(link.href).toMatch(/^https:\/\//);
	});

	// Story 1.16: Mehr-Toggle + Action-Icons
	describe('Story 1.16 Mehr-Toggle + Action-Icons', () => {
		const wohnlagenHit: LayerHit = {
			layer: 'wohnlagen-2024',
			value: { wol_mode: 'gut', plr_name: 'Mitte' },
			source: 'https://gdi.berlin.de/services/wfs/wl',
			updatedAt: '2024-06-10T00:00:00Z',
			license: 'dl-de/by-2-0'
		};

		it('Mehr-Toggle existiert bei Layer mit long-Text (wohnlagen-2024)', async () => {
			render(LayerHitRow, { hit: wohnlagenHit, layerName: 'Mietspiegel-Wohnlage 2024' });
			await expect.element(page.getByTestId('explain-more')).toBeInTheDocument();
		});

		it('Long-Text initial nicht sichtbar (Default kollabiert)', async () => {
			render(LayerHitRow, { hit: wohnlagenHit, layerName: 'Mietspiegel-Wohnlage 2024' });
			await expect.element(page.getByTestId('explain-long')).not.toBeInTheDocument();
		});

		it('Click Mehr expandiert long-Text + valueScale', async () => {
			render(LayerHitRow, { hit: wohnlagenHit, layerName: 'Mietspiegel-Wohnlage 2024' });
			await page.getByTestId('explain-more').click();
			const long = (await page.getByTestId('explain-long').element()) as HTMLElement;
			expect(long.textContent).toMatch(/Wohnlagen-Einstufung/);
			const scale = (await page.getByTestId('explain-scale').element()) as HTMLElement;
			expect(scale.textContent).toMatch(/einfach.*bestlage/);
		});

		it('Click Weniger (zweiter Click) kollabiert wieder', async () => {
			render(LayerHitRow, { hit: wohnlagenHit, layerName: 'Mietspiegel-Wohnlage 2024' });
			const btn = page.getByTestId('explain-more');
			await btn.click();
			await btn.click();
			await expect.element(page.getByTestId('explain-long')).not.toBeInTheDocument();
		});

		it('aria-expanded reflektiert Toggle-State', async () => {
			render(LayerHitRow, { hit: wohnlagenHit, layerName: 'Mietspiegel-Wohnlage 2024' });
			const btn0 = (await page.getByTestId('explain-more').element()) as HTMLElement;
			expect(btn0.getAttribute('aria-expanded')).toBe('false');
			await page.getByTestId('explain-more').click();
			const btn1 = (await page.getByTestId('explain-more').element()) as HTMLElement;
			expect(btn1.getAttribute('aria-expanded')).toBe('true');
		});

		it('Eye-Icon (off-state) wenn isActive=false und onToggleLayer gesetzt', async () => {
			let called = '';
			render(LayerHitRow, {
				hit: wohnlagenHit,
				layerName: 'Mietspiegel-Wohnlage 2024',
				isActive: false,
				onToggleLayer: (slug: string) => {
					called = slug;
				}
			});
			const btn = (await page.getByTestId('map-toggle').element()) as HTMLElement;
			expect(btn.getAttribute('data-state')).toBe('off');
			expect(btn.getAttribute('aria-pressed')).toBe('false');
			expect(btn.getAttribute('aria-label')).toMatch(/auf Karte zeigen/);
			await page.getByTestId('map-toggle').click();
			expect(called).toBe('wohnlagen-2024');
		});

		it('EyeOff-Icon (on-state) wenn isActive=true', async () => {
			render(LayerHitRow, {
				hit: wohnlagenHit,
				layerName: 'Mietspiegel-Wohnlage 2024',
				isActive: true,
				onToggleLayer: () => {}
			});
			const btn = (await page.getByTestId('map-toggle').element()) as HTMLElement;
			expect(btn.getAttribute('data-state')).toBe('on');
			expect(btn.getAttribute('aria-pressed')).toBe('true');
			expect(btn.getAttribute('aria-label')).toMatch(/von Karte entfernen/);
		});

		it('Kein Map-Toggle-Icon wenn onToggleLayer nicht übergeben', async () => {
			render(LayerHitRow, { hit: wohnlagenHit, layerName: 'Mietspiegel-Wohnlage 2024' });
			await expect.element(page.getByTestId('map-toggle')).not.toBeInTheDocument();
		});

		it('Map-Toggle Touch-Target ≥ 32px', async () => {
			render(LayerHitRow, {
				hit: wohnlagenHit,
				layerName: 'Mietspiegel-Wohnlage 2024',
				onToggleLayer: () => {}
			});
			const btn = (await page.getByTestId('map-toggle').element()) as HTMLElement;
			// h-8 w-8 = 2rem = 32px in default Tailwind
			expect(btn.className).toMatch(/h-8/);
			expect(btn.className).toMatch(/w-8/);
		});

		it('Learn-more aria-label aktualisiert auf "Mehr Details" (AC-7)', async () => {
			render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
			const link = (await page.getByTestId('learn-more').element()) as HTMLElement;
			expect(link.getAttribute('aria-label')).toMatch(/Mehr Details/);
		});
	});

	describe('Story 1.18: Value-Chips + Layout', () => {
		const laermKatHit: LayerHit = {
			layer: 'laerm-2023',
			value: { kategorie: 'mittel', plr_name: 'Teutoburger Platz' },
			source: 'https://gdi.berlin.de/services/wfs/laerm',
			updatedAt: '2024-01-15T00:00:00Z',
			license: 'dl-de/by-2-0'
		};

		it('Severity-Chip rendert für kategorischen Wert', async () => {
			render(LayerHitRow, { hit: laermKatHit, layerName: 'Lärmbelastung 2023' });
			const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
			expect(chip.getAttribute('data-severity')).toBe('warning');
			expect(chip.textContent).toMatch(/mittel/);
		});

		it('Kontext-Subline zeigt Kiez/PLR-Name', async () => {
			render(LayerHitRow, { hit: laermKatHit, layerName: 'Lärmbelastung 2023' });
			const ctx = (await page.getByTestId('row-context').element()) as HTMLElement;
			expect(ctx.textContent).toMatch(/Teutoburger Platz/);
		});

		it('Layer-Name 1× sichtbar (Dedup): keine doppelte "Lärmbelastung"-Erwähnung im Layer-Name', async () => {
			render(LayerHitRow, { hit: laermKatHit, layerName: 'Lärmbelastung 2023' });
			const nameEl = (await page.getByTestId('layer-name').element()) as HTMLElement;
			expect(nameEl.textContent).toBe('Lärmbelastung 2023');
			// Chip-Text enthält "mittel" NICHT die Layer-Bezeichnung
			const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
			expect(chip.textContent).not.toMatch(/Lärmbelastung/);
		});

		it('danger-Severity für hohe Lärmbelastung', async () => {
			render(LayerHitRow, {
				hit: { ...laermKatHit, value: { kategorie: 'hoch', plr_name: 'X' } },
				layerName: 'Lärmbelastung 2023'
			});
			const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
			expect(chip.getAttribute('data-severity')).toBe('danger');
		});

		it('success-Severity für niedrige Lärmbelastung', async () => {
			render(LayerHitRow, {
				hit: { ...laermKatHit, value: { kategorie: 'niedrig', plr_name: 'X' } },
				layerName: 'Lärmbelastung 2023'
			});
			const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
			expect(chip.getAttribute('data-severity')).toBe('success');
		});

		it('Bodenrichtwerte numerisch: neutral-Chip mit €/m²-Unit', async () => {
			render(LayerHitRow, {
				hit: {
					layer: 'bodenrichtwerte',
					value: { brw: 5000, nutzung: 'W - Wohngebiet' },
					source: 'https://fbinter.stadt-berlin.de/x',
					updatedAt: '2025-01-01T00:00:00Z',
					license: 'dl-de/zero-2-0'
				},
				layerName: 'Bodenrichtwerte'
			});
			const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
			expect(chip.getAttribute('data-severity')).toBe('neutral');
			expect(chip.textContent).toMatch(/5\.000/);
			expect(chip.textContent).toMatch(/€\/m²/);
			const ctx = (await page.getByTestId('row-context').element()) as HTMLElement;
			expect(ctx.textContent).toMatch(/W - Wohngebiet/);
		});

		it('Stolperstein: KEIN Chip (Editorial), fallback-Text rendert', async () => {
			render(LayerHitRow, {
				hit: {
					layer: 'stolpersteine',
					value: { person: 'Rosa Beispiel', inscription: 'x' },
					source: 'https://overpass-api.de/api',
					updatedAt: '2025-06-01T00:00:00Z',
					license: 'ODbL 1.0'
				},
				layerName: 'Stolpersteine'
			});
			await expect.element(page.getByTestId('value-chip')).not.toBeInTheDocument();
			const val = (await page.getByTestId('value').element()) as HTMLElement;
			expect(val.textContent).toMatch(/Rosa Beispiel/);
		});

		it('aria-label kombiniert Layer-Name + Wert', async () => {
			render(LayerHitRow, { hit: laermKatHit, layerName: 'Lärmbelastung 2023' });
			const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
			expect(row.getAttribute('aria-label')).toMatch(/Lärmbelastung 2023.*mittel/);
		});

		it('DataStandBanner ist im Row vorhanden (10px-Format)', async () => {
			render(LayerHitRow, { hit: laermKatHit, layerName: 'Lärmbelastung 2023' });
			const banner = (await page.getByTestId('data-stand-banner').element()) as HTMLElement;
			expect(banner.className).toMatch(/text-\[10px\]/);
		});
	});

	// Story 1.23: Reason aufdröseln (Geltungsbereich / nicht-anwendbar / Lücke)
	describe('Story 1.23: Reason-Wording', () => {
		it('coverage-out-of-scope → "Datensatz deckt diese Lage nicht ab" + data-state', async () => {
			render(LayerHitRow, {
				hit: {
					...recentHit,
					layer: 'klima-pet-2022',
					value: null,
					reason: 'coverage-out-of-scope'
				},
				layerName: 'Klima PET 2022'
			});
			const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
			expect(row.getAttribute('data-state')).toBe('coverage-out-of-scope');
			const val = (await page
				.getByTestId('value-coverage-out-of-scope')
				.element()) as HTMLElement;
			expect(val.textContent).toMatch(/Datensatz deckt diese Lage nicht ab/);
		});

		it('out-of-concept → "Nicht ausgewiesen für diese Lage" + data-state', async () => {
			render(LayerHitRow, {
				hit: {
					...recentHit,
					layer: 'milieuschutz-erhaltungsmiete',
					value: null,
					reason: 'out-of-concept'
				},
				layerName: 'Milieuschutz Erhaltungsmiete'
			});
			const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
			expect(row.getAttribute('data-state')).toBe('out-of-concept');
			const val = (await page.getByTestId('value-out-of-concept').element()) as HTMLElement;
			expect(val.textContent).toMatch(/Nicht ausgewiesen für diese Lage/);
		});

		it('no-coverage Wording bleibt "Daten nicht vorhanden" (echte Lücke)', async () => {
			render(LayerHitRow, {
				hit: { ...recentHit, value: null, reason: 'no-coverage' },
				layerName: 'Mietspiegel-Wohnlage'
			});
			const val = (await page.getByTestId('value-no-coverage').element()) as HTMLElement;
			expect(val.textContent).toMatch(/Daten nicht vorhanden/);
		});

		it('external-link bei coverage-out-of-scope ausgeblendet', async () => {
			render(LayerHitRow, {
				hit: {
					layer: 'wohnlagen-2024',
					value: null,
					reason: 'coverage-out-of-scope',
					source: 'https://gdi.berlin.de/services/wfs/wohnlagenadr2024',
					updatedAt: '2024-06-10T00:00:00Z',
					license: 'dl-de/by-2-0'
				},
				layerName: 'Mietspiegel-Wohnlage 2024'
			});
			await expect.element(page.getByTestId('external-link')).not.toBeInTheDocument();
		});

		it('external-link bei out-of-concept ausgeblendet', async () => {
			render(LayerHitRow, {
				hit: {
					layer: 'wohnlagen-2024',
					value: null,
					reason: 'out-of-concept',
					source: 'https://gdi.berlin.de/services/wfs/wohnlagenadr2024',
					updatedAt: '2024-06-10T00:00:00Z',
					license: 'dl-de/by-2-0'
				},
				layerName: 'Mietspiegel-Wohnlage 2024'
			});
			await expect.element(page.getByTestId('external-link')).not.toBeInTheDocument();
		});

		it('aria-label kombiniert Layer-Name + Reason-Wording (coverage-out-of-scope)', async () => {
			render(LayerHitRow, {
				hit: {
					...recentHit,
					layer: 'klima-pet-2022',
					value: null,
					reason: 'coverage-out-of-scope'
				},
				layerName: 'Klima PET 2022'
			});
			const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
			expect(row.getAttribute('aria-label')).toMatch(
				/Klima PET 2022.*Datensatz deckt diese Lage nicht ab/
			);
		});
	});

	// Story 1.22: Grünversorgung-Skala harmonisiert (gering/mittel/hoch) + invertierte Severity.
	describe('Story 1.22: Grünversorgung Skala-Harmonisierung', () => {
		const gruenSource = 'https://gdi.berlin.de/services/wfs/ua_umweltgerechtigkeit2023';

		it('Grünversorgung "gut" (raw) → ValueChip "hoch" mit success-Severity', async () => {
			render(LayerHitRow, {
				hit: {
					layer: 'gruenversorgung-2023',
					value: { kategorie: 'gut', plr_name: 'Wilmersdorf' },
					source: gruenSource,
					updatedAt: '2024-01-15T00:00:00Z',
					license: 'dl-de/zero-2-0'
				},
				layerName: 'Grünversorgung 2023'
			});
			const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
			expect(chip.getAttribute('data-severity')).toBe('success');
			expect(chip.textContent).toMatch(/hoch/);
			expect(chip.textContent).not.toMatch(/gut/);
		});

		it('Grünversorgung "schlecht" (raw) → ValueChip "gering" mit warning-Severity', async () => {
			render(LayerHitRow, {
				hit: {
					layer: 'gruenversorgung-2023',
					value: { kategorie: 'schlecht', plr_name: 'Pankow' },
					source: gruenSource,
					updatedAt: '2024-01-15T00:00:00Z',
					license: 'dl-de/zero-2-0'
				},
				layerName: 'Grünversorgung 2023'
			});
			const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
			expect(chip.getAttribute('data-severity')).toBe('warning');
			expect(chip.textContent).toMatch(/gering/);
			expect(chip.textContent).not.toMatch(/schlecht/);
		});

		it('Grünversorgung "mittel" → ValueChip "mittel" mit success-soft-Severity', async () => {
			render(LayerHitRow, {
				hit: {
					layer: 'gruenversorgung-2023',
					value: { kategorie: 'mittel', plr_name: 'Mitte' },
					source: gruenSource,
					updatedAt: '2024-01-15T00:00:00Z',
					license: 'dl-de/zero-2-0'
				},
				layerName: 'Grünversorgung 2023'
			});
			const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
			expect(chip.getAttribute('data-severity')).toBe('success-soft');
			expect(chip.textContent).toMatch(/mittel/);
		});
	});
});
