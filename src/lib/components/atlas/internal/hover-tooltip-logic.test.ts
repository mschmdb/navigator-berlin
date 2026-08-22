import { describe, expect, it } from 'vitest';
import {
	buildHoverTooltipContent,
	buildMultiHoverContent,
	slugFromLayerId,
	type HoveredFeature
} from './hover-tooltip-logic.js';

describe('buildHoverTooltipContent', () => {
	it('liefert layerName + valueText + shortExplain für laerm-2023', () => {
		const c = buildHoverTooltipContent('laerm-2023', {
			kategorie: 'hoch',
			plr_name: 'Kreuzberg-Nord'
		});
		expect(c.slug).toBe('laerm-2023');
		expect(c.layerName).toMatch(/Lärm/);
		expect(c.valueText).toMatch(/hoch/);
		expect(c.shortExplain).toMatch(/Lärmbelastung/);
		expect(c.hint).toMatch(/Klick/);
	});

	it('fallback für unbekannten Slug', () => {
		const c = buildHoverTooltipContent('unknown-xyz', 'foo');
		expect(c.layerName).toBe('unknown-xyz');
		expect(c.shortExplain).toBe('');
	});

	it('valueText nutzt formatLayerValue für klima-pet-2022', () => {
		const c = buildHoverTooltipContent('klima-pet-2022', { pet14h: 38.5 });
		expect(c.valueText).toMatch(/38,5 °C|38.5 °C/);
	});
});

describe('slugFromLayerId', () => {
	it('extrahiert Slug aus prefix', () => {
		expect(slugFromLayerId('navigator-layer-laerm-2023')).toBe('laerm-2023');
	});

	it('null für unbekannten prefix', () => {
		expect(slugFromLayerId('maplibre-attribution')).toBeNull();
	});
});

describe('buildMultiHoverContent (Multi-Layer-Tooltip)', () => {
	const polygonFeature = (slug: string, value: number): HoveredFeature => ({
		layer: { id: `navigator-layer-${slug}` },
		properties: { value }
	});

	it('liefert null ohne Features', () => {
		expect(buildMultiHoverContent([])).toBeNull();
	});

	it('zeigt bei einem Polygon-Layer eine Zeile mit Erklärung', () => {
		const content = buildMultiHoverContent([polygonFeature('kiez-score-ruhe-luft', 62)]);
		expect(content?.kind).toBe('polygon');
		expect(content?.rows).toHaveLength(1);
		expect(content?.rows[0].layerName).toContain('Ruhe & Luft');
		expect(content?.rows[0].shortExplain).not.toBe('');
	});

	it('streicht in Mehrzeilen-Ansicht den redundanten Dimensions-Präfix aus dem Wert', () => {
		const content = buildMultiHoverContent([
			polygonFeature('kiez-score-versorgung', 86),
			polygonFeature('kiez-score-mobilitaet', 39)
		]);
		// Spaltenlabel nennt die Dimension schon; "Versorgung: sehr hoch (86/100)"
		// würde als "sehr hoch (86/100)" einzeilig bleiben statt hässlich umzubrechen.
		expect(content?.rows[0].valueText).toBe('sehr hoch (86/100)');
		expect(content?.rows[1].valueText).toBe('mittel (39/100)');
	});

	it('behält den vollen Wert-Text in der Einzel-Ansicht', () => {
		const content = buildMultiHoverContent([polygonFeature('kiez-score-versorgung', 86)]);
		expect(content?.rows[0].valueText).toContain('Versorgung:');
	});

	it('zeigt bei zwei Choroplethen beide Werte, oberster zuerst', () => {
		const content = buildMultiHoverContent([
			polygonFeature('kiez-score-ruhe-luft', 62),
			polygonFeature('kiez-score-versorgung', 34)
		]);
		expect(content?.rows.map((r) => r.slug)).toEqual([
			'kiez-score-ruhe-luft',
			'kiez-score-versorgung'
		]);
		expect(content?.rows[0].valueText).not.toBe('');
		expect(content?.rows[1].valueText).not.toBe('');
		// Bei mehreren Zeilen bleibt der Tooltip schlank: keine Erklärtexte.
		expect(content?.rows.every((r) => r.shortExplain === '')).toBe(true);
	});

	it('dedupliziert mehrere Features desselben Layers auf das oberste', () => {
		const content = buildMultiHoverContent([
			polygonFeature('kiez-score-ruhe-luft', 62),
			polygonFeature('kiez-score-ruhe-luft', 10)
		]);
		expect(content?.rows).toHaveLength(1);
		expect(content?.rows[0].valueText).toContain('62');
	});

	it('filtert POIs unter dem Choroplethen aus den Zeilen (Station unter Score-Fläche)', () => {
		const content = buildMultiHoverContent([
			polygonFeature('kiez-score-ruhe-luft', 62),
			{ layer: { id: 'navigator-layer-ubahn-stationen' }, properties: { name: 'Boddinstraße' } },
			polygonFeature('kiez-score-versorgung', 34)
		]);
		expect(content?.kind).toBe('polygon');
		expect(content?.rows.map((r) => r.slug)).toEqual([
			'kiez-score-ruhe-luft',
			'kiez-score-versorgung'
		]);
	});

	it('behält die Erklärung, wenn nach dem POI-Filter nur ein Choropleth übrig ist', () => {
		const content = buildMultiHoverContent([
			polygonFeature('kiez-score-ruhe-luft', 62),
			{ layer: { id: 'navigator-layer-ubahn-stationen' }, properties: { name: 'Boddinstraße' } }
		]);
		expect(content?.rows).toHaveLength(1);
		expect(content?.rows[0].shortExplain).not.toBe('');
	});

	it('POI gewinnt: liegt ein Pin oben, bleibt der POI-Tooltip allein', () => {
		const content = buildMultiHoverContent([
			{ layer: { id: 'navigator-layer-ubahn-stationen' }, properties: { name: 'Boddinstraße' } },
			polygonFeature('kiez-score-ruhe-luft', 62)
		]);
		expect(content?.kind).toBe('poi');
		expect(content?.rows).toHaveLength(1);
		expect(content?.rows[0].slug).toBe('ubahn-stationen');
	});

	it('ignoriert Features ohne navigator-Layer-Prefix', () => {
		expect(
			buildMultiHoverContent([{ layer: { id: 'basemap-water' }, properties: null }])
		).toBeNull();
	});
});
