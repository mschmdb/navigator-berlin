/** GH-88: Node-seitige Guards (Formatter, Stufenfarben, Dateigröße). */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getValueSeverity } from './value-severity-mapping.js';
import { formatPercentValue, formatWithUnit } from '$lib/i18n/format.js';
import { getLayerHitDisplay } from './layer-hit-display.js';
import { formatDistance } from './format-distance.js';

describe('GH-88 AC5: ein Zahlformat', () => {
	it('formatPercentValue: Prozentwert mit Komma und Leerzeichen', () => {
		expect(formatPercentValue(53.1, { locale: 'de' })).toBe('53,1 %');
		expect(formatPercentValue(50, { locale: 'de' })).toBe('50 %');
		expect(formatPercentValue(66.666, { locale: 'de' })).toBe('66,7 %');
		expect(formatPercentValue(53.1, { locale: 'en' })).toBe('53.1%');
	});

	it('formatWithUnit: Zahl, Leerzeichen, Einheit', () => {
		expect(formatWithUnit(57.4, 'dB', { locale: 'de' })).toBe('57,4 dB');
		expect(formatWithUnit(60000, '€/m²', { locale: 'de', maximumFractionDigits: 0 })).toBe(
			'60.000 €/m²'
		);
		expect(formatWithUnit(57.4, 'dB', { locale: 'en' })).toBe('57.4 dB');
	});
});

describe('GH-88 AC5: Datensatz-Werte über den Formatter', () => {
	it('Lärm-dB als Rohzahl: „57,4 dB" (DE), „57.4 dB" (EN)', () => {
		const de = getLayerHitDisplay('laerm-den', 57.4, { locale: 'de' });
		expect(`${de.chip?.value} ${de.chip?.unit}`).toBe('57,4 dB');
		const en = getLayerHitDisplay('laerm-den', '57.4', { locale: 'en' });
		expect(`${en.chip?.value} ${en.chip?.unit}`).toBe('57.4 dB');
	});

	it('Bodenrichtwert als Rohzahl: „60.000 €/m²"', () => {
		const d = getLayerHitDisplay('bodenrichtwerte', 60000, { locale: 'de' });
		expect(`${d.chip?.value} ${d.chip?.unit}`).toBe('60.000 €/m²');
	});

	it('Distanz: „293 m"', () => {
		expect(formatDistance(293, { locale: 'de' })).toBe('293 m');
	});
});

describe('GH-88 AC1: keine Boxen in den Spezial-Datensätzen', () => {
	const files = [
		'nearest-stops-card.svelte',
		'klima-section.svelte',
		'demografie-block.svelte',
		'layer-card.svelte',
		'layer-hit-row.svelte',
		'klima-pet-card.svelte'
	];
	for (const f of files) {
		it(f, () => {
			const src = readFileSync(`src/lib/components/atlas/inspector-panel/${f}`, 'utf8');
			expect(src).not.toMatch(/rounded(-sm)? border border-rule bg-bg-elevated/);
		});
	}
});

describe('GH-88 AC6: Stufenfarben einheitlich', () => {
	it('mittel ist neutral, gut bleibt grün, hohe Belastung bleibt rot', () => {
		expect(getValueSeverity('luft-2023', { kategorie: 'mittel' })).toBe('neutral');
		expect(getValueSeverity('gruenversorgung-2023', { kategorie: 'mittel' })).toBe('neutral');
		expect(getValueSeverity('luft-2023', { kategorie: 'gering' })).toBe('success');
		expect(getValueSeverity('luft-2023', { kategorie: 'hoch' })).toBe('danger');
	});
});

describe('GH-88 AC7: inspector-panel.svelte unter 500 Zeilen', () => {
	it('Zeilenzahl', () => {
		const src = readFileSync('src/lib/components/atlas/inspector-panel.svelte', 'utf8');
		expect(src.split('\n').length).toBeLessThan(500);
	});
});
