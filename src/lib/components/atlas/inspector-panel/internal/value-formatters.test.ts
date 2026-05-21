import { describe, expect, it } from 'vitest';
import { formatLayerValue } from './value-formatters.js';

describe('formatLayerValue', () => {
	it('null → "Daten nicht vorhanden"', () => {
		expect(formatLayerValue('bezirke', null)).toEqual({
			text: 'Daten nicht vorhanden',
			isNumeric: false
		});
	});

	it('undefined → Fallback', () => {
		expect(formatLayerValue('bezirke', undefined)).toEqual({
			text: 'Daten nicht vorhanden',
			isNumeric: false
		});
	});

	it('Mietspiegel-Wohnlage als String', () => {
		expect(formatLayerValue('mietspiegel-wohnlage', 'gut')).toEqual({
			text: 'gut',
			isNumeric: false
		});
	});

	it('Bodenrichtwerte numeric primitive → "€/m²" mit Tausender-Trennung', () => {
		expect(formatLayerValue('bodenrichtwerte', 4200)).toEqual({
			text: '4.200 €/m²',
			isNumeric: true
		});
	});

	it('Bodenrichtwerte Props-Objekt → brw + nutzung', () => {
		expect(
			formatLayerValue('bodenrichtwerte', { brw: 1500, nutzung: 'W - Wohngebiet', gfz: 1.2 })
		).toEqual({
			text: '1.500 €/m² · W - Wohngebiet',
			isNumeric: true
		});
	});

	it('Bodenrichtwerte Props ohne brw → Fallback', () => {
		expect(formatLayerValue('bodenrichtwerte', { nutzung: 'foo' })).toEqual({
			text: 'Daten nicht vorhanden',
			isNumeric: false
		});
	});

	it('Bezirke Props-Objekt → Gemeinde_name', () => {
		expect(
			formatLayerValue('bezirke', { Gemeinde_name: 'Pankow', Land_name: 'Berlin' })
		).toEqual({
			text: 'Pankow',
			isNumeric: false
		});
	});

	it('Ortsteile Props-Objekt → OTEIL + BEZIRK', () => {
		expect(
			formatLayerValue('ortsteile', { OTEIL: 'Friedrichshain', BEZIRK: 'Friedrichshain-Kreuzberg' })
		).toEqual({
			text: 'Friedrichshain · Friedrichshain-Kreuzberg',
			isNumeric: false
		});
	});

	it('PLZ Props-Objekt → plz-String', () => {
		expect(formatLayerValue('plz', { plz: '10115' })).toEqual({
			text: '10115',
			isNumeric: false
		});
	});

	it('LOR-Bezirksregion Props-Objekt → Name + ID', () => {
		expect(
			formatLayerValue('lor-bezirksregion', { BZR_NAME: 'MV Nord', BZR_ID: '126011' })
		).toEqual({
			text: 'MV Nord (126011)',
			isNumeric: false
		});
	});

	it('Strassenlaerm-2022 → gruppe_txt', () => {
		expect(formatLayerValue('strassenlaerm-2022', { gruppe_txt: 'U-Bahn' })).toEqual({
			text: 'Schienenverkehr: U-Bahn',
			isNumeric: false
		});
	});

	it('Lärm-Den → dB-Suffix', () => {
		expect(formatLayerValue('laerm-den', 65)).toEqual({
			text: '65 dB',
			isNumeric: true
		});
	});

	it('Lärm-Night → dB-Suffix', () => {
		expect(formatLayerValue('laerm-night', 50)).toEqual({
			text: '50 dB',
			isNumeric: true
		});
	});

	it('Solarpotenzial → "kWh/m²"', () => {
		expect(formatLayerValue('solarpotenzial', 900)).toEqual({
			text: '900 kWh/m²',
			isNumeric: true
		});
	});

	it('Stolpersteine mit person-Property → "Für {person}"', () => {
		expect(formatLayerValue('stolpersteine', { person: 'Anna Müller' })).toEqual({
			text: 'Für Anna Müller',
			isNumeric: false
		});
	});

	it('Stolpersteine ohne person → "Gedenkstein in der Nähe"', () => {
		expect(formatLayerValue('stolpersteine', { other: 'x' })).toEqual({
			text: 'Gedenkstein in der Nähe',
			isNumeric: false
		});
	});

	it('Bezirke → String', () => {
		expect(formatLayerValue('bezirke', 'Pankow')).toEqual({
			text: 'Pankow',
			isNumeric: false
		});
	});

	it('Trinkbrunnen → fixer Text', () => {
		expect(formatLayerValue('trinkbrunnen', { ok: true })).toEqual({
			text: 'Trinkbrunnen vor Ort',
			isNumeric: false
		});
	});

	it('kiez-score-gesamt → Gesamt-Label + Stufe + Wert', () => {
		expect(formatLayerValue('kiez-score-gesamt', { plr_id: '04501148', value: 52.4 })).toEqual({
			text: 'Gesamt: hoch (52/100)',
			isNumeric: false
		});
	});

	it('Unbekannter slug + number → isNumeric=true', () => {
		expect(formatLayerValue('unknown-slug', 42)).toEqual({
			text: '42',
			isNumeric: true
		});
	});

	it('Unbekannter slug + string → isNumeric=false', () => {
		expect(formatLayerValue('unknown-slug', 'foo')).toEqual({
			text: 'foo',
			isNumeric: false
		});
	});

	it('Empty object {} → Fallback', () => {
		expect(formatLayerValue('bezirke', {})).toEqual({
			text: 'Daten nicht vorhanden',
			isNumeric: false
		});
	});

	// Story 1.22: Grünversorgung-Skala harmonisiert auf gering/mittel/hoch.
	describe('Grünversorgung Skala-Harmonisierung (Story 1.22)', () => {
		it('schlecht → "Grünversorgung: gering"', () => {
			expect(
				formatLayerValue('gruenversorgung-2023', { kategorie: 'schlecht', plr_name: 'Pankow' })
			).toEqual({ text: 'Grünversorgung: gering · Pankow', isNumeric: false });
		});
		it('gut → "Grünversorgung: hoch"', () => {
			expect(
				formatLayerValue('gruenversorgung-2023', { kategorie: 'gut', plr_name: 'Wilmersdorf' })
			).toEqual({ text: 'Grünversorgung: hoch · Wilmersdorf', isNumeric: false });
		});
		it('mittel → "Grünversorgung: mittel" (unverändert)', () => {
			expect(formatLayerValue('gruenversorgung-2023', { kategorie: 'mittel' })).toEqual({
				text: 'Grünversorgung: mittel',
				isNumeric: false
			});
		});
		it('sehr gut → "Grünversorgung: sehr hoch"', () => {
			expect(formatLayerValue('gruenversorgung-2023', { kategorie: 'sehr gut' })).toEqual({
				text: 'Grünversorgung: sehr hoch',
				isNumeric: false
			});
		});
	});

	// Story 1.30: MSS-Gesamtindex 2025 — Status × Dynamik aus LOR-Aggregat.
	describe('MSS-Gesamtindex 2025 (Story 1.30)', () => {
		it('gültiger Hit → "Status {si_v}, Dynamik {di_v} · {plr_name}"', () => {
			expect(
				formatLayerValue('mss-gesamtindex-2025', {
					plr_id: '01100101',
					plr_name: 'Stülerstraße',
					si_v: 'mittel',
					di_v: 'stabil',
					sdi_v: 'Status mittel , Dynamik stabil',
					sdi_n: 23,
					kom: 'gültig',
					ew: 3580
				})
			).toEqual({ text: 'Status mittel, Dynamik stabil · Stülerstraße', isNumeric: false });
		});

		it('sehr niedrig + negativ → vollständig formatiert', () => {
			expect(
				formatLayerValue('mss-gesamtindex-2025', {
					plr_name: 'Beispiel',
					si_v: 'sehr niedrig',
					di_v: 'negativ',
					kom: 'gültig'
				})
			).toEqual({
				text: 'Status sehr niedrig, Dynamik negativ · Beispiel',
				isNumeric: false
			});
		});

		it('kom=ungültig (EW unter 300) → Aggregat-nicht-aussagekräftig', () => {
			expect(
				formatLayerValue('mss-gesamtindex-2025', {
					plr_name: 'Pankower Tor',
					si_v: 'Planungsraum ohne Zuordnung',
					di_v: 'Planungsraum ohne Zuordnung',
					kom: 'ungültig (EW unter 300)'
				})
			).toEqual({
				text: 'Aggregat nicht aussagekräftig · Pankower Tor (ungültig (EW unter 300))',
				isNumeric: false
			});
		});

		it('kom=ungültig (Ausreißer) → Aggregat-nicht-aussagekräftig', () => {
			expect(
				formatLayerValue('mss-gesamtindex-2025', {
					plr_name: 'Beispiel',
					si_v: 'Planungsraum ohne Zuordnung',
					di_v: 'Planungsraum ohne Zuordnung',
					kom: 'ungültig (Ausreißer)'
				})
			).toEqual({
				text: 'Aggregat nicht aussagekräftig · Beispiel (ungültig (Ausreißer))',
				isNumeric: false
			});
		});

		it('fehlende Status-/Dynamik-Felder → Fallback', () => {
			expect(formatLayerValue('mss-gesamtindex-2025', { plr_name: 'X' })).toEqual({
				text: 'Daten nicht vorhanden',
				isNumeric: false
			});
		});

		it('ohne plr_name → Status + Dynamik bleiben', () => {
			expect(
				formatLayerValue('mss-gesamtindex-2025', { si_v: 'hoch', di_v: 'positiv', kom: 'gültig' })
			).toEqual({ text: 'Status hoch, Dynamik positiv', isNumeric: false });
		});
	});
});
