import { describe, it, expect } from 'vitest';
import { licenseToUrl } from './license-url.js';

describe('licenseToUrl', () => {
	it('mappt dl-de/zero-2-0', () => {
		expect(licenseToUrl('dl-de/zero-2-0')).toBe('https://www.govdata.de/dl-de/zero-2-0');
	});

	it('mappt dl-de/by-2-0', () => {
		expect(licenseToUrl('dl-de/by-2-0')).toBe('https://www.govdata.de/dl-de/by-2-0');
	});

	it('mappt CC BY 4.0', () => {
		expect(licenseToUrl('CC BY 4.0')).toBe('https://creativecommons.org/licenses/by/4.0/');
	});

	it('mappt ODbL 1.0', () => {
		expect(licenseToUrl('ODbL 1.0')).toBe('https://opendatacommons.org/licenses/odbl/1-0/');
	});

	it('mappt Geodatenzugangsgesetz', () => {
		expect(licenseToUrl('Geodatenzugangsgesetz')).toBe(
			'https://www.gesetze-im-internet.de/geozg/'
		);
	});
});
