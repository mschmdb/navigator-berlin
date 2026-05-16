import { describe, expect, it } from 'vitest';
import { licenseToSchemaOrgUrl } from './license-url.js';

describe('licenseToSchemaOrgUrl', () => {
	it('mappt dl-de/zero-2-0 auf govdata-zero-URL', () => {
		expect(licenseToSchemaOrgUrl('dl-de/zero-2-0')).toBe(
			'https://www.govdata.de/dl-de/zero-2-0'
		);
	});

	it('mappt dl-de/by-2-0 auf govdata-by-URL', () => {
		expect(licenseToSchemaOrgUrl('dl-de/by-2-0')).toBe(
			'https://www.govdata.de/dl-de/by-2-0'
		);
	});

	it('mappt CC BY 4.0 auf creativecommons.org', () => {
		expect(licenseToSchemaOrgUrl('CC BY 4.0')).toBe(
			'https://creativecommons.org/licenses/by/4.0/'
		);
	});

	it('mappt ODbL 1.0 auf opendatacommons.org', () => {
		expect(licenseToSchemaOrgUrl('ODbL 1.0')).toBe(
			'https://opendatacommons.org/licenses/odbl/1-0/'
		);
	});

	it('mappt Geodatenzugangsgesetz auf gesetze.berlin.de', () => {
		expect(licenseToSchemaOrgUrl('Geodatenzugangsgesetz')).toBe(
			'https://gesetze.berlin.de/perma?j=GeoZG_BE'
		);
	});

	it('wirft Error für unbekannte License', () => {
		expect(() =>
			// @ts-expect-error - test mit nicht-License-Wert
			licenseToSchemaOrgUrl('GPL-3.0')
		).toThrow(/Unmapped license/);
	});
});
