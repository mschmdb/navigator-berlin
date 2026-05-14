import { describe, expect, it } from 'vitest';
import { getLayerHitDisplay } from './layer-hit-display.js';

describe('getLayerHitDisplay()', () => {
	describe('Umweltgerechtigkeit Mehrfachbelastung-Labels', () => {
		it('zweifach → "2× belastet"', () => {
			const d = getLayerHitDisplay('umweltgerechtigkeit-2023', {
				kategorie: 'zweifach',
				laerm: 'hoch',
				luft: 'hoch'
			});
			expect(d.chip?.value).toBe('2× belastet');
		});
		it('einfach → "1× belastet"', () => {
			const d = getLayerHitDisplay('umweltgerechtigkeit-2023', { kategorie: 'einfach' });
			expect(d.chip?.value).toBe('1× belastet');
		});
		it('dreifach → "3× belastet"', () => {
			const d = getLayerHitDisplay('umweltgerechtigkeit-2023', { kategorie: 'dreifach' });
			expect(d.chip?.value).toBe('3× belastet');
		});
		it('keine → "keine Belastung"', () => {
			const d = getLayerHitDisplay('umweltgerechtigkeit-2023', { kategorie: 'keine' });
			expect(d.chip?.value).toBe('keine Belastung');
		});
	});

	describe('Umweltatlas-Kategorien (Lärm/Luft/Grün/Bio)', () => {
		it('laerm-2023 kategorisch: chip=kategorie + context=PLR', () => {
			const d = getLayerHitDisplay('laerm-2023', {
				kategorie: 'mittel',
				plr_name: 'Teutoburger Platz'
			});
			expect(d.chip?.value).toBe('mittel');
			expect(d.chip?.numeric).toBe(false);
			expect(d.context).toBe('Teutoburger Platz');
		});

		it('luft-2023 kategorisch: chip + context', () => {
			const d = getLayerHitDisplay('luft-2023', { kategorie: 'hoch', plr_name: 'Mitte' });
			expect(d.chip?.value).toBe('hoch');
			expect(d.context).toBe('Mitte');
		});

		it('gruenversorgung-2023 kategorisch: chip + context', () => {
			const d = getLayerHitDisplay('gruenversorgung-2023', {
				kategorie: 'schlecht',
				plr_name: 'Pankow'
			});
			expect(d.chip?.value).toBe('schlecht');
			expect(d.context).toBe('Pankow');
		});
	});

	describe('Numerische Werte', () => {
		it('laerm-den: chip=value + unit=dB + numeric=true', () => {
			const d = getLayerHitDisplay('laerm-den', 65);
			expect(d.chip?.value).toBe('65');
			expect(d.chip?.unit).toBe('dB');
			expect(d.chip?.numeric).toBe(true);
			expect(d.context).toBeNull();
		});

		it('bodenrichtwerte: chip=Betrag-formatted €/m² + context=Nutzung', () => {
			const d = getLayerHitDisplay('bodenrichtwerte', { brw: 5000, nutzung: 'W - Wohngebiet' });
			expect(d.chip?.value).toBe('5.000');
			expect(d.chip?.unit).toBe('€/m²');
			expect(d.chip?.numeric).toBe(true);
			expect(d.context).toBe('W - Wohngebiet');
		});

		it('klima-pet-2022: chip=value °C + numeric', () => {
			const d = getLayerHitDisplay('klima-pet-2022', { pet14h: 36.5 });
			expect(d.chip?.value).toMatch(/^36(,5)?/);
			expect(d.chip?.unit).toBe('°C');
			expect(d.chip?.numeric).toBe(true);
		});
	});

	describe('Wohnlage', () => {
		it('wohnlagen-2024 mode + context=PLR', () => {
			const d = getLayerHitDisplay('wohnlagen-2024', {
				wol_mode: 'gut',
				plr_name: 'Karlshorst',
				count_gut: 12,
				count_total: 14
			});
			expect(d.chip?.value).toBe('gut');
			expect(d.context).toBe('Karlshorst');
		});

		it('mietspiegel-wohnlage einfach-string: chip=einfach', () => {
			const d = getLayerHitDisplay('mietspiegel-wohnlage', 'einfach');
			expect(d.chip?.value).toBe('einfach');
		});
	});

	describe('POIs (Kita / Schule / Krankenhaus / Sportanlage / Schwimmbad)', () => {
		it('kitas-2024: fallbackText=Name + context=Adresse', () => {
			const d = getLayerHitDisplay('kitas-2024', {
				e_name: 'Sonnenkita',
				e_strasse: 'Marktstr',
				e_hnr: '10'
			});
			expect(d.chip).toBeNull();
			expect(d.fallbackText).toBe('Sonnenkita');
			expect(d.context).toBe('Marktstr 10');
		});

		it('schulen-2024: fallbackText=Name + context=Schulart', () => {
			const d = getLayerHitDisplay('schulen-2024', {
				schulname: 'Heinrich-Heine-Schule',
				schulart: 'Gymnasium'
			});
			expect(d.fallbackText).toBe('Heinrich-Heine-Schule');
			expect(d.context).toBe('Gymnasium');
		});
	});

	describe('Boundaries (Bezirk/Ortsteil/PLZ)', () => {
		it('bezirke: chip=name', () => {
			const d = getLayerHitDisplay('bezirke', 'Pankow');
			expect(d.chip?.value).toBe('Pankow');
		});

		it('ortsteile: chip=name + context=Bezirk', () => {
			const d = getLayerHitDisplay('ortsteile', {
				OTEIL: 'Prenzlauer Berg',
				BEZIRK: 'Pankow'
			});
			expect(d.chip?.value).toBe('Prenzlauer Berg');
			expect(d.context).toBe('Pankow');
		});

		it('plz: chip=plz', () => {
			const d = getLayerHitDisplay('plz', '10405');
			expect(d.chip?.value).toBe('10405');
		});
	});

	describe('Stolpersteine (Editorial)', () => {
		it('stolpersteine: fallbackText=Für Person, chip=null', () => {
			const d = getLayerHitDisplay('stolpersteine', { person: 'Rosa Beispiel' });
			expect(d.chip).toBeNull();
			expect(d.fallbackText).toMatch(/Rosa Beispiel/);
		});
	});

	describe('Trinkbrunnen', () => {
		it('trinkbrunnen aktiv: chip=Brunnen vor Ort', () => {
			const d = getLayerHitDisplay('trinkbrunnen', { name: 'Brunnen 12' });
			expect(d.chip?.value).toMatch(/Trinkbrunnen|Brunnen/);
		});
	});

	describe('Empty/Null', () => {
		it('null value: chip + fallbackText = null', () => {
			const d = getLayerHitDisplay('laerm-2023', null);
			expect(d.chip).toBeNull();
			expect(d.fallbackText).toBeNull();
		});

		it('empty-object: chip + fallbackText = null', () => {
			const d = getLayerHitDisplay('laerm-2023', {});
			expect(d.chip).toBeNull();
		});
	});
});
