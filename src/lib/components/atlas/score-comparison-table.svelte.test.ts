import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ScoreComparisonTable from './score-comparison-table.svelte';
import type { ComparisonDimRow } from '$lib/data/comparison-types.js';

const rows: ComparisonDimRow[] = [
	{ label: 'Grün & Hitze', value: 72, bezirkMean: 65, berlinMedian: 58, rang: 12, quartil: 1, total: 143 },
	{ label: 'Versorgung', value: 30, bezirkMean: 55, berlinMedian: 60, rang: 140, quartil: 4, total: 143 }
];

describe('ScoreComparisonTable.svelte (Story 11.4)', () => {
	it('rendert nichts bei leeren rows', async () => {
		render(ScoreComparisonTable, { rows: [] });
		expect(document.querySelector('[data-testid="score-comparison"]')).toBeNull();
	});

	it('rendert nichts wenn alle Werte null sind (kein leerer Block ohne DB)', async () => {
		const empty: ComparisonDimRow[] = [
			{ label: 'Grün & Hitze', value: null, bezirkMean: null, berlinMedian: null, rang: null, quartil: null, total: 0 }
		];
		render(ScoreComparisonTable, { rows: empty, showBezirkColumn: true });
		expect(document.querySelector('[data-testid="score-comparison"]')).toBeNull();
	});

	it('zeigt Bezirk-Spalte wenn showBezirkColumn', async () => {
		render(ScoreComparisonTable, { rows, showBezirkColumn: true, valueLabel: 'Kiez' });
		const section = document.querySelector('[data-testid="score-comparison"]');
		expect(section?.textContent).toMatch(/Bezirk-Ø/);
		expect(section?.textContent).toMatch(/Kiez/);
		expect(section?.textContent).toMatch(/Grün & Hitze/);
	});

	it('zeigt exakten Rang für starke Werte, „unteres Viertel" für Quartil 4 (Anti-Stigma)', async () => {
		render(ScoreComparisonTable, { rows, showBezirkColumn: true });
		const text = document.querySelector('[data-testid="score-comparison"]')?.textContent ?? '';
		expect(text).toMatch(/Platz 12 von 143/);
		expect(text).toMatch(/unteres Viertel/);
		expect(text).not.toMatch(/Platz 140 von 143/);
	});

	it('ohne Bezirk-Spalte (Bezirks-Seite)', async () => {
		render(ScoreComparisonTable, { rows, showBezirkColumn: false, valueLabel: 'Bezirk' });
		const section = document.querySelector('[data-testid="score-comparison"]');
		expect(section?.textContent).not.toMatch(/Bezirk-Ø/);
	});
});
