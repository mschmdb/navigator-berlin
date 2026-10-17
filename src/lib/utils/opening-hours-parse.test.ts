import { describe, expect, it } from 'vitest';
import { isParsableOpeningHours } from './opening-hours-parse.js';

describe('isParsableOpeningHours', () => {
	it('akzeptiert gültige Syntax inklusive PH und unknown', () => {
		expect(isParsableOpeningHours('Mo-Fr 10:00-18:00; PH off')).toBe(true);
		expect(isParsableOpeningHours('Oct-Mar Tu-Sa 10:00-18:00; Apr-Sep unknown')).toBe(true);
	});

	it('lehnt Freitext und leere Werte ab', () => {
		expect(isParsableOpeningHours('nach dem Gottesdienst')).toBe(false);
		expect(isParsableOpeningHours('')).toBe(false);
		expect(isParsableOpeningHours('   ')).toBe(false);
	});

	it('lehnt Werte mit Parser-Warnungen ab', () => {
		expect(isParsableOpeningHours('Mo PH 10:00-18:00')).toBe(false);
	});
});
