import { describe, expect, it } from 'vitest';
import { isInSeason, type Seasonality } from './seasonality.js';

const SUMMER: Seasonality = { from: '05-01', to: '10-31' };

describe('isInSeason (May–October-Range)', () => {
	it('01.05. → in Season (inklusive Start)', () => {
		expect(isInSeason(SUMMER, new Date('2026-05-01T12:00:00Z'))).toBe(true);
	});

	it('31.10. → in Season (inklusive Ende)', () => {
		expect(isInSeason(SUMMER, new Date('2026-10-31T12:00:00Z'))).toBe(true);
	});

	it('30.04. → außerhalb Saison', () => {
		expect(isInSeason(SUMMER, new Date('2026-04-30T12:00:00Z'))).toBe(false);
	});

	it('01.11. → außerhalb Saison', () => {
		expect(isInSeason(SUMMER, new Date('2026-11-01T12:00:00Z'))).toBe(false);
	});

	it('15.07. → in Season (mitten drin)', () => {
		expect(isInSeason(SUMMER, new Date('2026-07-15T00:00:00Z'))).toBe(true);
	});

	it('15.01. → außerhalb Saison (Winter)', () => {
		expect(isInSeason(SUMMER, new Date('2026-01-15T00:00:00Z'))).toBe(false);
	});

	it('15.12. → außerhalb Saison (Spät-Winter)', () => {
		expect(isInSeason(SUMMER, new Date('2026-12-15T00:00:00Z'))).toBe(false);
	});

	it('Wrap-around-Range (10-15 bis 03-15) — November', () => {
		const winter: Seasonality = { from: '10-15', to: '03-15' };
		expect(isInSeason(winter, new Date('2026-11-15T00:00:00Z'))).toBe(true);
	});

	it('Wrap-around-Range — Februar', () => {
		const winter: Seasonality = { from: '10-15', to: '03-15' };
		expect(isInSeason(winter, new Date('2026-02-15T00:00:00Z'))).toBe(true);
	});

	it('Wrap-around-Range — Juli (außerhalb)', () => {
		const winter: Seasonality = { from: '10-15', to: '03-15' };
		expect(isInSeason(winter, new Date('2026-07-15T00:00:00Z'))).toBe(false);
	});

	it('Now-Default verwendet aktuelle Zeit', () => {
		const result = isInSeason(SUMMER);
		expect(typeof result).toBe('boolean');
	});
});
