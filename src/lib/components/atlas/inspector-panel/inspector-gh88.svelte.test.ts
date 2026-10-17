/**
 * GH-88: Inspector nach Mockup. Ein Test je Akzeptanzkriterium, siehe
 * `docs/process/implementation-artifacts/spec-gh-88-inspector.md`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { KiezScore, LayerHit } from '$lib/data';
import LayerCard from './layer-card.svelte';
import LayerHitRow from './layer-hit-row.svelte';
import ScoreMembershipBadge from './score-membership-badge.svelte';
import KiezScoreSection from './kiez-score-section.svelte';
import SectionSources from './section-sources.svelte';
import KiezScoreRing from '../charts/kiez-score-ring.svelte';
import ValueChip from '../value-chip.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const laermHit: LayerHit = {
	layer: 'laerm-2023',
	value: { plr_id: '01100101', plr_name: 'Stülerstraße', kategorie: 'gering' },
	source: 'https://daten.berlin.de/laerm',
	updatedAt: '2024-06-01T00:00:00.000Z',
	license: 'dl-de/by-2-0'
};

const poiHit: LayerHit = {
	layer: 'stolpersteine',
	value: { name: 'Stolperstein Muster' },
	source: 'https://www.stolpersteine-berlin.de',
	updatedAt: '2024-06-01T00:00:00.000Z',
	license: 'CC BY 4.0'
};

function dim(dimension: KiezScore['dimensions'][number]['dimension'], value: number) {
	return { dimension, value, sources: [], missingData: [], dataStand: null };
}

const score: KiezScore = {
	persona: 'allgemein',
	overall: 67,
	dimensions: [
		dim('ruhe-luft', 75),
		dim('gruen-hitze', 64),
		dim('mobilitaet', 33),
		dim('versorgung', 77),
		dim('wohnschutz', 100),
		dim('kultur', 90),
		dim('kriminalitaet', 100)
	],
	missingDimensions: []
} as KiezScore;

describe('GH-88 AC1: Linien statt Karten', () => {
	it('LayerCard hat keinen Rahmen, keinen Radius, keinen Hintergrund', async () => {
		render(LayerCard, { hit: laermHit, layerName: 'Lärmbelastung 2023' });
		const card = (await page.getByTestId('layer-card').element()) as HTMLElement;
		const classes = card.className.split(/\s+/);
		expect(classes.some((c) => c.startsWith('rounded'))).toBe(false);
		// Nur eine Trennlinie unten, kein umlaufender Rahmen.
		expect(classes).not.toContain('border');
		expect(classes).toContain('border-b');
		expect(classes.some((c) => c.startsWith('bg-'))).toBe(false);
	});

	it('LayerHitRow hat keinen Radius und keine Hover-Fläche', async () => {
		render(LayerHitRow, { hit: poiHit, layerName: 'Stolpersteine' });
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.className).not.toMatch(/\brounded/);
		expect(row.className).not.toMatch(/hover:bg-/);
	});
});

describe('GH-88 AC2: Score-Zugehörigkeit nur über Gruppen', () => {
	it('Kontext-Layer bekommt kein Label', async () => {
		render(ScoreMembershipBadge, { slug: 'umweltgerechtigkeit-2023' });
		expect(document.querySelector('[data-testid^="score-membership-context-"]')).toBeNull();
		expect(document.body.textContent).not.toMatch(/nicht im Score/);
	});

	it('Score-Input zeigt „Im Kiez-Score: …" als Textzeile ohne Box', async () => {
		render(ScoreMembershipBadge, { slug: 'luft-2023' });
		const link = document.querySelector('[data-testid="score-membership-link-luft-2023"]');
		expect(link?.textContent?.trim()).toBe('Im Kiez-Score: Ruhe & Luft');
		expect(link?.className).not.toMatch(/\bbg-/);
		expect(link?.className).toMatch(/text-accent/);
	});

	it('Dimensionsliste in zwei Gruppen: im Score und zusätzlich', async () => {
		render(KiezScoreSection, { score });
		const inScore = (await page.getByTestId('kiez-score-group-score').element()) as HTMLElement;
		const extra = (await page.getByTestId('kiez-score-group-context').element()) as HTMLElement;
		expect(inScore.textContent).toMatch(/Im Kiez-Score/);
		expect(inScore.querySelector('[data-testid="kiez-score-dim-ruhe-luft"]')).not.toBeNull();
		expect(inScore.querySelector('[data-testid="kiez-score-dim-kultur"]')).toBeNull();
		expect(extra.textContent).toMatch(/Zusätzlich, nicht im Score/);
		expect(extra.querySelector('[data-testid="kiez-score-dim-kultur"]')).not.toBeNull();
		expect(extra.querySelector('[data-testid="kiez-score-dim-kriminalitaet"]')).not.toBeNull();
	});
});

describe('GH-88 AC3: Quelle & Details einmal pro Gruppe', () => {
	it('LayerCard ohne Details-Toggle und Mehr-Icon, Titel verlinkt auf die Layer-Seite', async () => {
		render(LayerCard, { hit: laermHit, layerName: 'Lärmbelastung 2023' });
		expect(document.querySelector('[data-testid="card-details-toggle"]')).toBeNull();
		expect(document.querySelector('[data-testid="learn-more"]')).toBeNull();
		const title = document.querySelector('[data-testid="layer-card-title-link"]');
		expect(title?.getAttribute('href')).toBe('/layer/laerm-2023');
	});

	it('LayerHitRow ohne Mehr-Icon und ohne Quellenzeile, Titel verlinkt', async () => {
		render(LayerHitRow, { hit: poiHit, layerName: 'Stolpersteine' });
		expect(document.querySelector('[data-testid="learn-more"]')).toBeNull();
		expect(document.querySelector('[data-testid="data-stand-banner"]')).toBeNull();
		const title = document.querySelector('[data-testid="layer-name"] a');
		expect(title?.getAttribute('href')).toBe('/layer/stolpersteine');
	});

	it('SectionSources listet Stand und Quelle je Datensatz hinter einem Toggle', async () => {
		render(SectionSources, {
			sectionLabel: 'Umwelt',
			hits: [laermHit, poiHit],
			layerNameFor: (slug: string) =>
				slug === 'laerm-2023' ? 'Lärmbelastung 2023' : 'Stolpersteine'
		});
		const toggle = page.getByTestId('section-sources-toggle');
		await expect.element(toggle).toHaveTextContent('Quellen und Details zu Umwelt');
		await toggle.click();
		const items = document.querySelectorAll('[data-testid="section-sources-item"]');
		expect(items.length).toBe(2);
		expect(items[0].querySelector('[data-testid="data-stand-banner"]')).not.toBeNull();
	});
});

describe('GH-88 AC4: Ring-Legende nennt die Reihenfolge', () => {
	it('sichtbare Zeile „Ringe von außen nach innen"', async () => {
		render(KiezScoreRing, { score });
		const legend = (await page.getByTestId('kiez-score-ring-order').element()) as HTMLElement;
		expect(legend.textContent).toMatch(/von außen nach innen/);
	});
});

describe('GH-88 AC5: ein Zahlformat (Komponente)', () => {
	it('ValueChip trennt Wert und Einheit mit Leerzeichen im Text', async () => {
		render(ValueChip, { severity: 'neutral', value: '60.000', unit: '€/m²', layerName: 'Boden' });
		const chip = (await page.getByTestId('value-chip').element()) as HTMLElement;
		expect(chip.textContent?.replace(/\s+/g, ' ').trim()).toContain('60.000 €/m²');
	});
});
