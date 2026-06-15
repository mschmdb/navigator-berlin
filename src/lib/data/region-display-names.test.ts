import { describe, expect, it } from 'vitest';
import { buildRegionDisplayNames } from './region-display-names.js';

const BEZIRKE_FC = {
	features: [
		{ properties: { Schluessel_gesamt: '11000002', Gemeinde_name: 'Friedrichshain-Kreuzberg' } },
		{ properties: { Schluessel_gesamt: '11000001', Gemeinde_name: 'Mitte' } },
		{ properties: { Schluessel_gesamt: '11000005', Gemeinde_name: 'Spandau' } }
	]
};

const LOR_FC = {
	features: [
		{ properties: { BZR_NAME: 'Südliche Luisenstadt', BEZ: '02' } },
		{ properties: { BZR_NAME: 'Heerstraße', BEZ: '05' } },
		{ properties: { BZR_NAME: 'Heerstraße', BEZ: '01' } }
	]
};

describe('buildRegionDisplayNames', () => {
	it('liefert Bezirks-Anzeigenamen mit Umlaut und Bindestrich', () => {
		const { bezirk } = buildRegionDisplayNames({ lorFc: LOR_FC, bezirkeFc: BEZIRKE_FC });
		expect(bezirk.get('friedrichshain-kreuzberg')).toBe('Friedrichshain-Kreuzberg');
		expect(bezirk.get('mitte')).toBe('Mitte');
	});

	it('liefert Kiez-Anzeigenamen mit Umlaut statt slug-Rekonstruktion', () => {
		const { kiez } = buildRegionDisplayNames({ lorFc: LOR_FC, bezirkeFc: BEZIRKE_FC });
		expect(kiez.get('suedliche-luisenstadt')).toBe('Südliche Luisenstadt');
	});

	it('disambiguiert Duplikat-Namen über Bezirk-Suffix (gleiche Slug-Logik wie Profile)', () => {
		const { kiez } = buildRegionDisplayNames({ lorFc: LOR_FC, bezirkeFc: BEZIRKE_FC });
		expect(kiez.get('heerstrasse-spandau')).toBe('Heerstraße');
		expect(kiez.get('heerstrasse-mitte')).toBe('Heerstraße');
	});
});
