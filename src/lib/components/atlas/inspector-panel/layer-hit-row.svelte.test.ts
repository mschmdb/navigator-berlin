import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import LayerHitRow from './layer-hit-row.svelte';
import type { LayerHit } from '$lib/data';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const recentHit: LayerHit = {
	layer: 'mietspiegel-wohnlage',
	value: 'gut',
	source: 'https://fbinter.stadt-berlin.de/wfs',
	updatedAt: '2025-06-01T00:00:00Z',
	license: 'dl-de/zero-2-0'
};

describe('layer-hit-row.svelte', () => {
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

	it('Outdated (>5 Jahre) → data-state="outdated" (Pille in den Sektions-Quellen, GH-88)', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, updatedAt: '2019-01-01T00:00:00Z' },
			layerName: 'Mietspiegel-Wohnlage'
		});
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.getAttribute('data-state')).toBe('outdated');
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

	it('Kategorischer Wert: kompakter ValueChip (kein tabular-nums)', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
		expect(chip.className).toMatch(/font-medium/);
		const val = (await page.getByTestId('value-chip-value').element()) as HTMLElement;
		expect(val.className).not.toMatch(/font-mono/);
		expect(val.className).not.toMatch(/tabular-nums/);
	});

	it('Inspector-Row enthält KEINEN Mailto-Link (Footer-Page deferred)', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		await expect.element(page.getByTestId('error-feedback-mailto')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('report-error')).not.toBeInTheDocument();
	});

	it('Titel-Link nutzt lang-Prefix', async () => {
		render(LayerHitRow, {
			hit: recentHit,
			layerName: 'Mietspiegel-Wohnlage',
			lang: 'en'
		});
		const link = (await page.getByTestId('layer-name').element()).querySelector(
			'a'
		) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/en/layer/mietspiegel-wohnlage');
	});

	// i18n Block B3a Task 3: DE hat KEINEN URL-Präfix (Boundary), vormals
	// `/de/layer/...` (301-Umweg-Bug).
	it('Titel-Link hat bei lang: "de" keinen /de/-Präfix', async () => {
		render(LayerHitRow, {
			hit: recentHit,
			layerName: 'Mietspiegel-Wohnlage',
			lang: 'de'
		});
		const link = (await page.getByTestId('layer-name').element()).querySelector(
			'a'
		) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/layer/mietspiegel-wohnlage');
	});

	it('Editorial: trinkbrunnen INSEASON zeigt aktiv-Pille, KEINEN seasonal-Disclaimer', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'trinkbrunnen', value: { name: 'Brunnen 1' } },
			layerName: 'Trinkbrunnen'
		});
		await expect.element(page.getByTestId('seasonal-pill-active')).toBeInTheDocument();
		await expect.element(page.getByTestId('editorial-disclaimer')).not.toBeInTheDocument();
	});

	// Story 1.16: Mehr-Toggle + Action-Icons
	describe('Story 1.16 Action-Icons', () => {
		const wohnlagenHit: LayerHit = {
			layer: 'wohnlagen-2024',
			value: { wol_mode: 'gut', plr_name: 'Mitte' },
			source: 'https://gdi.berlin.de/services/wfs/wl',
			updatedAt: '2024-06-10T00:00:00Z',
			license: 'dl-de/by-2-0'
		};

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

		it('Map-Toggle Touch-Target über --target-min (24 px)', async () => {
			render(LayerHitRow, {
				hit: wohnlagenHit,
				layerName: 'Mietspiegel-Wohnlage 2024',
				onToggleLayer: () => {}
			});
			const btn = (await page.getByTestId('map-toggle').element()) as HTMLElement;
			expect(btn.className).toMatch(/size-\(--target-min\)/);
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

		it('Severity-Chip rendert für kategorischen Wert (mittel = neutral, GH-88)', async () => {
			render(LayerHitRow, { hit: laermKatHit, layerName: 'Lärmbelastung 2023' });
			const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
			expect(chip.getAttribute('data-severity')).toBe('neutral');
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
			const val = (await page.getByTestId('value-coverage-out-of-scope').element()) as HTMLElement;
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

		it('Grünversorgung "mittel" → ValueChip "mittel" mit neutral-Severity (GH-88)', async () => {
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
			expect(chip.getAttribute('data-severity')).toBe('neutral');
			expect(chip.textContent).toMatch(/mittel/);
		});
	});

	// i18n Block B3b
	describe('i18n (lang="en")', () => {
		it('no-coverage/out-of-concept/seasonal-Texte englisch', async () => {
			render(LayerHitRow, {
				hit: { ...recentHit, reason: 'no-coverage', value: null },
				layerName: 'Test-Layer',
				lang: 'en'
			});
			await expect
				.element(page.getByTestId('value-no-coverage'))
				.toHaveTextContent('No data available');
		});

		it('Titel-Link zeigt /en/layer/... und Map-Toggle-Label englisch', async () => {
			let toggled: string | null = null;
			render(LayerHitRow, {
				hit: recentHit,
				layerName: 'Test-Layer',
				lang: 'en',
				onToggleLayer: (slug: string) => (toggled = slug)
			});
			const link = (await page.getByTestId('layer-name').element()).querySelector(
				'a'
			) as HTMLAnchorElement;
			expect(link.getAttribute('href')).toBe('/en/layer/mietspiegel-wohnlage');
			const toggle = (await page.getByTestId('map-toggle').element()) as HTMLButtonElement;
			expect(toggle.getAttribute('aria-label')).toBe('Show Test-Layer on map');
			toggle.click();
			expect(toggled).toBe('mietspiegel-wohnlage');
		});

		it('rendert englisch über den Default-Pfad (getLocale())', async () => {
			overwriteGetLocale(() => 'en');
			render(LayerHitRow, { hit: recentHit, layerName: 'Test-Layer' });
			const link = (await page.getByTestId('layer-name').element()).querySelector(
				'a'
			) as HTMLAnchorElement;
			expect(link.getAttribute('href')).toBe('/en/layer/mietspiegel-wohnlage');
		});

		it('Mauer-Sektoren-Detail zeigt englische Labels', async () => {
			render(LayerHitRow, {
				hit: {
					layer: 'mauer-sektoren',
					value: 'x',
					source: 'https://osm.org',
					updatedAt: '2025-01-01T00:00:00Z',
					license: 'ODbL 1.0'
				},
				layerName: 'Berliner Mauer',
				lang: 'en'
			});
			await expect
				.element(page.getByTestId('mauer-sektoren-detail'))
				.toHaveTextContent('Berlin Wall Memorial');
			await expect.element(page.getByTestId('mauer-footer')).toHaveTextContent('As of');
		});

		it('ValueChip Severity-Beschreibung englisch (aria-label)', async () => {
			render(LayerHitRow, {
				hit: {
					layer: 'gruenversorgung-2023',
					value: { kategorie: 'mittel', plr_name: 'Mitte' },
					source: 'https://gdi.berlin.de/wfs',
					updatedAt: '2024-01-15T00:00:00Z',
					license: 'dl-de/zero-2-0'
				},
				layerName: 'Grünversorgung 2023',
				lang: 'en'
			});
			const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
			// GH-88: „mittel" ist neutral.
			expect(chip.getAttribute('aria-label')).toMatch(/neutral rating/);
		});
	});
});
