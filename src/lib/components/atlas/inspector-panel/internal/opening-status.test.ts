import { describe, expect, it } from 'vitest';
import { getOpeningStatus, isOpenNow } from './opening-status.js';

// Mittwoch, 1. Juli 2026, lokale Zeit. Mo-Su-Regeln machen den Wochentag irrelevant.
function at(h: number, m = 0): Date {
	return new Date(2026, 6, 1, h, m, 0);
}

describe('getOpeningStatus', () => {
	it('leerer Wert ist unknown', () => {
		expect(getOpeningStatus('', at(12))).toBe('unknown');
		expect(getOpeningStatus('   ', at(12))).toBe('unknown');
	});

	it('24/7 ist immer offen', () => {
		expect(getOpeningStatus('24/7', at(3))).toBe('open');
		expect(getOpeningStatus('24/7', at(23, 59))).toBe('open');
	});

	it('offen mitten in der Öffnungszeit', () => {
		expect(getOpeningStatus('Mo-Su 10:00-18:00', at(12))).toBe('open');
	});

	it('schließt bald, wenn unter 30 Minuten bis Schluss', () => {
		expect(getOpeningStatus('Mo-Su 10:00-18:00', at(17, 45))).toBe('closing-soon');
	});

	it('geschlossen außerhalb der Öffnungszeit', () => {
		expect(getOpeningStatus('Mo-Su 10:00-18:00', at(20))).toBe('closed');
		expect(getOpeningStatus('Mo-Su 10:00-18:00', at(8))).toBe('closed');
	});

	it('unparsbarer Wert ist unknown, kein falsches offen', () => {
		expect(getOpeningStatus('kaputt ((', at(12))).toBe('unknown');
	});
});

describe('isOpenNow', () => {
	it('open und closing-soon zählen als offen', () => {
		expect(isOpenNow('open')).toBe(true);
		expect(isOpenNow('closing-soon')).toBe(true);
		expect(isOpenNow('closed')).toBe(false);
		expect(isOpenNow('unknown')).toBe(false);
	});
});
