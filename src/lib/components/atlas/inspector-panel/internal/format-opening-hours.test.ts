import { describe, expect, it } from 'vitest';
import { formatOpeningHours, formatOpeningHoursDe } from './format-opening-hours.js';

describe('formatOpeningHours', () => {
	it('übersetzt Wochentag-Kürzel', () => {
		expect(formatOpeningHours('We-Mo 11:00-18:00')).toBe('Mi-Mo 11:00-18:00');
		expect(formatOpeningHours('Mo-Su 10:00-18:00')).toBe('Mo-So 10:00-18:00');
		expect(formatOpeningHours('Tu-Th 09:00-17:00')).toBe('Di-Do 09:00-17:00');
	});

	it('übersetzt Monatskürzel und "off"', () => {
		expect(
			formatOpeningHours(
				'Apr-Sep Mo-Su 10:00-20:00; Oct-Mar Mo-Su 10:00-19:00; Dec 24-26 off; Dec 31 10:00-16:00'
			)
		).toBe(
			'Apr-Sep Mo-So 10:00-20:00; Okt-Mär Mo-So 10:00-19:00; Dez 24-26 geschlossen; Dez 31 10:00-16:00'
		);
	});

	it('übersetzt Feiertags-/Schulferien-Kürzel', () => {
		expect(formatOpeningHours('PH off')).toBe('Feiertags geschlossen');
		expect(formatOpeningHours('SH Mo-Fr 10:00-14:00')).toBe('Schulferien Mo-Fr 10:00-14:00');
	});

	it('lässt reine Zeiten und leere Werte unverändert', () => {
		expect(formatOpeningHours('10:00-19:00')).toBe('10:00-19:00');
		expect(formatOpeningHours('')).toBe('');
	});

	it('fasst Tokens nicht mitten im Wort an (Wortgrenzen)', () => {
		// "Moffice" darf nicht zu "Mgeschlossenice" werden
		expect(formatOpeningHours('Moffice')).toBe('Moffice');
	});
});

describe('formatOpeningHoursDe (deprecated Alias)', () => {
	it('ist derselbe Funktionsverweis wie formatOpeningHours (Review-Fund: Name war irreführend)', () => {
		expect(formatOpeningHoursDe).toBe(formatOpeningHours);
	});
});
