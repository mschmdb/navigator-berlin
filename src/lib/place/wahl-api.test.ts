import { describe, expect, it } from 'vitest';
import { seriesUrl, pointsFromSeries, WAHL_STIMMTYP } from './wahl-api';

describe('seriesUrl', () => {
	it('builds the existing /api/wahl/series query for a Kiez', () => {
		expect(seriesUrl('agh', 'kiez', 'rixdorf')).toBe(
			'/api/wahl/series?typ=agh&stimmtyp=zweitstimme&ebene=kiez&gebiet=rixdorf'
		);
	});
	it('uses the single vote for the BVV', () => {
		expect(WAHL_STIMMTYP.bvv).toBe('einstimme');
		expect(seriesUrl('bvv', 'bezirk', 'mitte')).toContain('stimmtyp=einstimme');
	});
});

describe('pointsFromSeries', () => {
	it('maps API points to percent shares, like the server series (repeat elections included)', () => {
		expect(
			pointsFromSeries({
				points: [
					{
						jahr: 2021,
						partei: 'SPD',
						farbe_hex: '#e3000f',
						anteil: 0.215,
						is_repeat_election: false
					},
					{
						jahr: 2023,
						partei: 'SPD',
						farbe_hex: '#e3000f',
						anteil: 0.18,
						is_repeat_election: true
					}
				]
			})
		).toEqual([
			{ jahr: 2021, partei: 'SPD', farbe: '#e3000f', anteil: 21.5 },
			{ jahr: 2023, partei: 'SPD', farbe: '#e3000f', anteil: 18 }
		]);
	});
	it('returns an empty list for unexpected payloads', () => {
		expect(pointsFromSeries(null)).toEqual([]);
		expect(pointsFromSeries({ points: 'x' })).toEqual([]);
	});
});
