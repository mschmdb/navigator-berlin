import { describe, it, expect } from 'vitest';
import { buildKiezTrendContext } from './context-builder.js';

describe('buildKiezTrendContext', () => {
	it('liefert null bei leeren Punkten', () => {
		expect(buildKiezTrendContext({ kiezName: 'X', wahlTypLabel: 'Bundestagswahlen', stimmtypLabel: 'Zweitstimmen', sparkline: [] })).toBeNull();
	});

	it('liefert null bei nur 1 Jahr', () => {
		const ctx = buildKiezTrendContext({
			kiezName: 'X',
			wahlTypLabel: 'Bundestagswahlen',
			stimmtypLabel: 'Zweitstimmen',
			sparkline: [{ jahr: 2025, parteiKurzname: 'GRÜNE', anteil: 0.3 }]
		});
		expect(ctx).toBeNull();
	});

	it('baut Context mit Jahres-Liste + stärkste Partei pro Jahr', () => {
		const ctx = buildKiezTrendContext({
			kiezName: 'Friedrichshain Nord',
			wahlTypLabel: 'Bundestagswahlen',
			stimmtypLabel: 'Zweitstimmen',
			sparkline: [
				{ jahr: 2013, parteiKurzname: 'SPD', anteil: 0.32 },
				{ jahr: 2013, parteiKurzname: 'GRÜNE', anteil: 0.21 },
				{ jahr: 2017, parteiKurzname: 'GRÜNE', anteil: 0.27 },
				{ jahr: 2017, parteiKurzname: 'SPD', anteil: 0.22 },
				{ jahr: 2021, parteiKurzname: 'GRÜNE', anteil: 0.31 },
				{ jahr: 2025, parteiKurzname: 'GRÜNE', anteil: 0.24 }
			]
		});
		expect(ctx).not.toBeNull();
		expect(ctx!.kiez_name).toBe('Friedrichshain Nord');
		expect(ctx!.sparkline_jahre).toBe('2013, 2017, 2021, 2025');
		expect(ctx!.sparkline_jahre_top_parteien).toBe(
			'SPD (2013), GRÜNE (2017), GRÜNE (2021), GRÜNE (2025)'
		);
	});

	it('sortiert Jahre aufsteigend auch bei Unsortiertem Input', () => {
		const ctx = buildKiezTrendContext({
			kiezName: 'X',
			wahlTypLabel: 'Bundestagswahlen',
			stimmtypLabel: 'Zweitstimmen',
			sparkline: [
				{ jahr: 2025, parteiKurzname: 'A', anteil: 0.4 },
				{ jahr: 2013, parteiKurzname: 'B', anteil: 0.5 }
			]
		});
		expect(ctx!.sparkline_jahre).toBe('2013, 2025');
	});
});
