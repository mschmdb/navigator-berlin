import { describe, it, expect } from 'vitest';
import { rankSimilarKieze, type KiezShareInput } from './similar-kieze.js';

const ROWS: KiezShareInput[] = [
	{ kiezSlug: 'mitte-zentrum', parteiKurzname: 'SPD', anteil: 0.3 },
	{ kiezSlug: 'mitte-zentrum', parteiKurzname: 'GRÜNE', anteil: 0.4 },
	{ kiezSlug: 'mitte-zentrum', parteiKurzname: 'CDU', anteil: 0.3 },
	{ kiezSlug: 'prenzlauer-berg', parteiKurzname: 'SPD', anteil: 0.3 },
	{ kiezSlug: 'prenzlauer-berg', parteiKurzname: 'GRÜNE', anteil: 0.4 },
	{ kiezSlug: 'prenzlauer-berg', parteiKurzname: 'CDU', anteil: 0.3 },
	{ kiezSlug: 'marzahn-mitte', parteiKurzname: 'SPD', anteil: 0.2 },
	{ kiezSlug: 'marzahn-mitte', parteiKurzname: 'AfD', anteil: 0.5 },
	{ kiezSlug: 'marzahn-mitte', parteiKurzname: 'CDU', anteil: 0.3 }
];

describe('rankSimilarKieze', () => {
	it('rankt den identischen Vektor am höchsten (Score 100)', () => {
		const { results, hint } = rankSimilarKieze('mitte-zentrum', ROWS, 5);
		expect(hint).toBeNull();
		expect(results[0]).toEqual({ kiezSlug: 'prenzlauer-berg', score: 100 });
		expect(results.at(-1)?.kiezSlug).toBe('marzahn-mitte');
		expect(results.at(-1)!.score).toBeLessThan(100);
	});

	it('schließt das Ziel-Kiez selbst aus dem Ranking aus', () => {
		const { results } = rankSimilarKieze('mitte-zentrum', ROWS, 5);
		expect(results.some((r) => r.kiezSlug === 'mitte-zentrum')).toBe(false);
	});

	it('begrenzt auf topN', () => {
		const { results } = rankSimilarKieze('mitte-zentrum', ROWS, 1);
		expect(results).toHaveLength(1);
	});

	it('sortiert Score-Gleichstände deterministisch alphabetisch', () => {
		const rows: KiezShareInput[] = [
			{ kiezSlug: 'ziel', parteiKurzname: 'SPD', anteil: 0.5 },
			{ kiezSlug: 'ziel', parteiKurzname: 'CDU', anteil: 0.5 },
			{ kiezSlug: 'zwilling-b', parteiKurzname: 'SPD', anteil: 0.5 },
			{ kiezSlug: 'zwilling-b', parteiKurzname: 'CDU', anteil: 0.5 },
			{ kiezSlug: 'zwilling-a', parteiKurzname: 'SPD', anteil: 0.5 },
			{ kiezSlug: 'zwilling-a', parteiKurzname: 'CDU', anteil: 0.5 }
		];
		const { results } = rankSimilarKieze('ziel', rows, 5);
		expect(results.map((r) => r.kiezSlug)).toEqual(['zwilling-a', 'zwilling-b']);
	});

	it('liefert leere Liste + Hinweis für unbekanntes Kiez', () => {
		expect(rankSimilarKieze('nicht-vorhanden', ROWS, 5)).toEqual({
			results: [],
			hint: 'no_data_for_kiez'
		});
	});

	it('liefert leere Liste + Hinweis ohne Daten', () => {
		expect(rankSimilarKieze('mitte-zentrum', [], 5)).toEqual({
			results: [],
			hint: 'no_data_for_kiez'
		});
	});
});
