import { describe, expect, it } from 'vitest';
import { ZUSATZ_TAB_SCHWELLE, zusatzParteiTabs } from './zusatz-partei-tabs.js';

describe('zusatzParteiTabs (#179)', () => {
	it('AGH 2011: PIRATEN mit 8,9 % bekommt einen Zusatz-Tab, Basis-Parteien nicht', () => {
		const rows = [
			{ partei: 'SPD', anteil: 0.283 },
			{ partei: 'CDU', anteil: 0.233 },
			{ partei: 'GRÜNE', anteil: 0.176 },
			{ partei: 'PIRATEN', anteil: 0.089 },
			{ partei: 'Sonstige', anteil: 0.08 }
		];
		expect(zusatzParteiTabs(rows)).toEqual(['PIRATEN']);
	});

	it('AGH 2026: keine weitere Partei über der Schwelle, keine Zusatz-Tabs', () => {
		const rows = [
			{ partei: 'CDU', anteil: 0.28 },
			{ partei: 'PIRATEN', anteil: 0.004 },
			{ partei: 'Tierschutzpartei', anteil: 0.02 }
		];
		expect(zusatzParteiTabs(rows)).toEqual([]);
	});

	it('Schwelle 5 % gilt inklusive', () => {
		expect(ZUSATZ_TAB_SCHWELLE).toBe(0.05);
		expect(zusatzParteiTabs([{ partei: 'PIRATEN', anteil: 0.05 }])).toEqual(['PIRATEN']);
		expect(zusatzParteiTabs([{ partei: 'PIRATEN', anteil: 0.0499 }])).toEqual([]);
	});

	it('Sonstige und Parteien ohne Farb-Token bekommen nie einen Tab', () => {
		const rows = [
			{ partei: 'Sonstige', anteil: 0.12 },
			{ partei: 'Die PARTEI', anteil: 0.06 }
		];
		expect(zusatzParteiTabs(rows)).toEqual([]);
	});

	it('mehrere Zusatz-Parteien in Anteils-Reihenfolge', () => {
		const rows = [
			{ partei: 'Tierschutzpartei', anteil: 0.06 },
			{ partei: 'PIRATEN', anteil: 0.09 }
		];
		expect(zusatzParteiTabs(rows)).toEqual(['PIRATEN', 'Tierschutzpartei']);
	});
});
