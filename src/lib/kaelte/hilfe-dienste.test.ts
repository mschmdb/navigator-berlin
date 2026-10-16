import { describe, expect, it } from 'vitest';
import { HILFE_DIENSTE, HILFE_STAND, NOTRUF } from './hilfe-dienste.js';

describe('HILFE_DIENSTE', () => {
	it('enthält genau die vier zweitbelegten Dienste', () => {
		expect(HILFE_DIENSTE.map((d) => d.id)).toEqual([
			'kaeltehilfetelefon',
			'kaeltebus',
			'waermebus',
			'karuna'
		]);
	});

	it('übernimmt die nicht zweitbelegte Sub-Nummer nicht', () => {
		const all = JSON.stringify(HILFE_DIENSTE);
		expect(all).not.toContain('86605080');
	});

	it('hat zur sichtbaren Nummer passende tel-Links', () => {
		for (const d of HILFE_DIENSTE) {
			const digits = d.phoneDisplay.replace(/\D/g, '').replace(/^0/, '');
			expect(d.phoneTel).toBe(`+49${digits}`);
		}
	});

	it('nennt zu jedem Dienst mindestens eine Quelle', () => {
		for (const d of HILFE_DIENSTE) expect(d.quellen.length).toBeGreaterThan(0);
	});

	it('hat gültige Zeitfenster', () => {
		for (const d of HILFE_DIENSTE) {
			expect(d.startHour).toBeGreaterThanOrEqual(0);
			expect(d.startHour).toBeLessThan(24);
			expect(d.endHour).toBeGreaterThan(0);
			expect(d.endHour).toBeLessThanOrEqual(24);
		}
	});

	it('hat ein Stand-Datum im ISO-Format', () => {
		expect(HILFE_STAND).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('Notruf ist 112', () => {
		expect(NOTRUF.phoneTel).toBe('112');
	});

	it('enthält keine em-dashes', () => {
		expect(JSON.stringify(HILFE_DIENSTE).includes('—')).toBe(false);
	});
});
