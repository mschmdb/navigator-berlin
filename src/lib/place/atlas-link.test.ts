import { describe, expect, it } from 'vitest';
import { atlasQuery } from './atlas-link';

describe('atlasQuery', () => {
	it('opens the chapter layers centred on the place, with its name in the search', () => {
		expect(atlasQuery('laerm-2023', [13.4321, 52.4876], 'Reuterstraße')).toBe(
			'layers=laerm-2023&address=13.4321%2C52.4876&q=Reuterstra%C3%9Fe'
		);
	});
	it('rounds the centroid to four decimals', () => {
		expect(atlasQuery('x', [13.123456, 52.987654], 'A')).toContain('address=13.1235%2C52.9877');
	});
});
