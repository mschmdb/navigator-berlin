import { describe, expect, it } from 'vitest';
import { getValueSeverity } from './value-severity-mapping.js';

describe('getValueSeverity()', () => {
	describe('null/undefined Werte', () => {
		it('null → neutral', () => {
			expect(getValueSeverity('laerm-2023', null)).toBe('neutral');
		});
		it('undefined → neutral', () => {
			expect(getValueSeverity('laerm-2023', undefined)).toBe('neutral');
		});
	});

	describe('unknown slug', () => {
		it('Default-Fallback neutral', () => {
			expect(getValueSeverity('unknown-layer-xyz', 'hoch')).toBe('neutral');
		});
	});

	describe('Lärm dB-Schwellen (WHO/UBA)', () => {
		it('<55 dB → success', () => {
			expect(getValueSeverity('laerm-2023', 50)).toBe('success');
			expect(getValueSeverity('laerm-2023', 30)).toBe('success');
			expect(getValueSeverity('laerm-den', 54.9)).toBe('success');
		});
		it('55-65 dB → warning', () => {
			expect(getValueSeverity('laerm-2023', 55)).toBe('warning');
			expect(getValueSeverity('laerm-2023', 60)).toBe('warning');
			expect(getValueSeverity('laerm-2023', 65)).toBe('warning');
		});
		it('>65 dB → danger', () => {
			expect(getValueSeverity('laerm-2023', 66)).toBe('danger');
			expect(getValueSeverity('laerm-2023', 80)).toBe('danger');
		});
		it('numerischer String konvertiert', () => {
			expect(getValueSeverity('laerm-2023', '50')).toBe('success');
			expect(getValueSeverity('laerm-2023', '70')).toBe('danger');
		});
		it('Umweltatlas-Kategorie via kategorie-Feld', () => {
			expect(getValueSeverity('laerm-2023', { kategorie: 'niedrig' })).toBe('success');
			expect(getValueSeverity('laerm-2023', { kategorie: 'mittel' })).toBe('warning');
			expect(getValueSeverity('laerm-2023', { kategorie: 'hoch' })).toBe('danger');
		});
		it('NaN-String → neutral', () => {
			expect(getValueSeverity('laerm-2023', 'NA')).toBe('neutral');
		});
	});

	describe('Mietspiegel-Wohnlage / wohnlagen-2024', () => {
		it('einfach → neutral', () => {
			expect(getValueSeverity('mietspiegel-wohnlage', 'einfach')).toBe('neutral');
			expect(getValueSeverity('wohnlagen-2024', { wol_mode: 'einfach' })).toBe('neutral');
		});
		it('mittel → success-soft (User-Feedback Story 1.18: weniger Grau-Monotonie)', () => {
			expect(getValueSeverity('mietspiegel-wohnlage', 'mittel')).toBe('success-soft');
			expect(getValueSeverity('wohnlagen-2024', { wol_mode: 'mittel' })).toBe('success-soft');
		});
		it('gut → success-soft', () => {
			expect(getValueSeverity('mietspiegel-wohnlage', 'gut')).toBe('success-soft');
			expect(getValueSeverity('wohnlagen-2024', { wol_mode: 'gut' })).toBe('success-soft');
		});
		it('sehr gut → success', () => {
			expect(getValueSeverity('mietspiegel-wohnlage', 'sehr gut')).toBe('success');
			expect(getValueSeverity('wohnlagen-2024', { wol_mode: 'sehr gut' })).toBe('success');
		});
		it('unbekannt → neutral', () => {
			expect(getValueSeverity('wohnlagen-2024', { wol_mode: 'unbekannt' })).toBe('neutral');
		});
	});

	describe('Luft / Bioklima / Thermische Belastung (Belastungs-Skala)', () => {
		it('niedrig → success', () => {
			expect(getValueSeverity('luft-2023', { kategorie: 'niedrig' })).toBe('success');
			expect(getValueSeverity('bioklima-2023', { kategorie: 'niedrig' })).toBe('success');
		});
		it('mittel → warning', () => {
			expect(getValueSeverity('luft-2023', { kategorie: 'mittel' })).toBe('warning');
		});
		it('hoch / sehr hoch → danger', () => {
			expect(getValueSeverity('luft-2023', { kategorie: 'hoch' })).toBe('danger');
			expect(getValueSeverity('bioklima-2023', { kategorie: 'sehr hoch' })).toBe('danger');
		});
	});

	// Story 1.22: Grünversorgung nutzt invertierte Skala (mehr Grün = besser).
	// Severity inverted: hoch/gut = success, gering/schlecht = warning.
	describe('Grünversorgung (Versorgungs-Skala, invertiert)', () => {
		it('hoch / gut (raw) → success', () => {
			expect(getValueSeverity('gruenversorgung-2023', { kategorie: 'hoch' })).toBe('success');
			expect(getValueSeverity('gruenversorgung-2023', { kategorie: 'gut' })).toBe('success');
			expect(getValueSeverity('gruenversorgung-2023', { kategorie: 'sehr hoch' })).toBe(
				'success'
			);
			expect(getValueSeverity('gruenversorgung-2023', { kategorie: 'sehr gut' })).toBe(
				'success'
			);
		});
		it('mittel → success-soft (User-Pattern Story 1.18: gegen Grau-Monotonie)', () => {
			expect(getValueSeverity('gruenversorgung-2023', { kategorie: 'mittel' })).toBe(
				'success-soft'
			);
		});
		it('gering / schlecht (raw) / niedrig → warning', () => {
			expect(getValueSeverity('gruenversorgung-2023', { kategorie: 'gering' })).toBe('warning');
			expect(getValueSeverity('gruenversorgung-2023', { kategorie: 'schlecht' })).toBe(
				'warning'
			);
			expect(getValueSeverity('gruenversorgung-2023', { kategorie: 'niedrig' })).toBe('warning');
			expect(getValueSeverity('gruenversorgung-2023', { kategorie: 'sehr gering' })).toBe(
				'warning'
			);
		});
	});

	describe('Umweltgerechtigkeit (kumulativ)', () => {
		it('keine Belastung → success', () => {
			expect(getValueSeverity('umweltgerechtigkeit-2023', { kategorie: 'keine' })).toBe(
				'success'
			);
		});
		it('einfach → warning', () => {
			expect(getValueSeverity('umweltgerechtigkeit-2023', { kategorie: 'einfach' })).toBe(
				'warning'
			);
		});
		it('zweifach / dreifach → danger', () => {
			expect(getValueSeverity('umweltgerechtigkeit-2023', { kategorie: 'zweifach' })).toBe(
				'danger'
			);
			expect(getValueSeverity('umweltgerechtigkeit-2023', { kategorie: 'dreifach' })).toBe(
				'danger'
			);
		});
	});

	describe('Klima-PET (gefühlte Temperatur)', () => {
		it('<30°C → success', () => {
			expect(getValueSeverity('klima-pet-2022', { pet14h: 25 })).toBe('success');
		});
		it('30-35°C → warning', () => {
			expect(getValueSeverity('klima-pet-2022', { pet14h: 32 })).toBe('warning');
		});
		it('>35°C → danger', () => {
			expect(getValueSeverity('klima-pet-2022', { pet14h: 36 })).toBe('danger');
			expect(getValueSeverity('klima-pet-2022', { pet14h: 40 })).toBe('danger');
		});
	});

	describe('Bodenrichtwerte (kontext-frei)', () => {
		it('Numerisch → immer neutral (keine Wertung)', () => {
			expect(getValueSeverity('bodenrichtwerte', 4500)).toBe('neutral');
			expect(getValueSeverity('bodenrichtwerte', { brw: 12000 })).toBe('neutral');
		});
	});

	describe('Gebäudealter (kontext-frei)', () => {
		it('alle Jahrgänge → neutral', () => {
			expect(getValueSeverity('gebaeudealter', 'vor 1949')).toBe('neutral');
			expect(getValueSeverity('gebaeudealter', '1990-2010')).toBe('neutral');
		});
	});

	describe('Milieuschutz', () => {
		it('aktiv (Wert vorhanden) → success-soft', () => {
			expect(
				getValueSeverity('milieuschutz-erhaltungsmiete', { gebietsname: 'Klausenerplatz' })
			).toBe('success-soft');
			expect(getValueSeverity('milieuschutz-staedtebau', { gebietsname: 'Mitte' })).toBe(
				'success-soft'
			);
		});
	});

	describe('Trinkbrunnen (Seasonal)', () => {
		it('aktiv (Wert vorhanden) → success', () => {
			expect(getValueSeverity('trinkbrunnen', { name: 'Brunnen 1' })).toBe('success');
		});
	});

	describe('Stolpersteine (Editorial-Würde)', () => {
		it('immer neutral, auch bei Count', () => {
			expect(getValueSeverity('stolpersteine', { person: 'Rosa' })).toBe('neutral');
			expect(getValueSeverity('stolpersteine', 12)).toBe('neutral');
		});
	});

	describe('Boundaries (kontext-frei)', () => {
		it('bezirke / ortsteile / plz → neutral', () => {
			expect(getValueSeverity('bezirke', 'Pankow')).toBe('neutral');
			expect(getValueSeverity('ortsteile', 'Prenzlauer Berg')).toBe('neutral');
			expect(getValueSeverity('plz', '10405')).toBe('neutral');
		});
	});
});
