import { describe, expect, it } from 'vitest';
import {
	AGGREGATION_LEVELS,
	getLayerMethodology,
	getLayerMethodologySpec,
	LAYER_METHODOLOGY_DE,
	type AggregationLevel
} from './layer-methodology.js';
import { AUTHORITY_KEYS, resolveAuthority } from './authorities.js';

const MANIFEST_SLUGS = [
	'bezirke',
	'bioklima-2023',
	'bodenrichtwerte',
	'bus-haltestellen',
	'einschulbereiche-2024',
	'fahrradstrassen-2024',
	'gruenanlagen',
	'gruenversorgung-2023',
	'kitas-2024',
	'klima-kaltlufteinwirkbereich-2022',
	'klima-leitbahnkorridor-2022',
	'klima-pet-2022',
	'krankenhaeuser-plan',
	'krankenhaeuser-weitere',
	'laerm-2023',
	'luft-2023',
	'milieuschutz-erhaltungsmiete',
	'milieuschutz-staedtebau',
	'ortsteile',
	'plz',
	'radverkehrsnetz-2025',
	'sbahn-netz',
	'sbahn-stationen',
	'schulen-2024',
	'schwimmbaeder',
	'spielplaetze',
	'sportanlagen-2024',
	'stolpersteine',
	'tram-haltestellen',
	'tram-netz',
	'trinkbrunnen',
	'ubahn-netz',
	'ubahn-stationen',
	'umweltgerechtigkeit-2023',
	'wohnlagen-2024'
] as const;

describe('LayerMethodology · Coverage über Manifest', () => {
	it('hat einen Eintrag für jeden Manifest-Slug', () => {
		const missing = MANIFEST_SLUGS.filter((slug) => !LAYER_METHODOLOGY_DE[slug]);
		expect(missing).toEqual([]);
	});

	it('jeder Eintrag hat aggregationLevel + authority + calculation', () => {
		for (const slug of MANIFEST_SLUGS) {
			const m = LAYER_METHODOLOGY_DE[slug];
			expect(m, `Slug ${slug}`).toBeDefined();
			expect(m.aggregationLevel, `aggregationLevel ${slug}`).toBeDefined();
			expect(AGGREGATION_LEVELS).toContain(m.aggregationLevel as AggregationLevel);
			expect(m.authority, `authority ${slug}`).toBeTruthy();
			expect(m.calculation, `calculation ${slug}`).toBeTruthy();
			expect(m.calculation!.length).toBeGreaterThan(20);
		}
	});

	it('updateFrequency vorhanden für jeden Eintrag', () => {
		for (const slug of MANIFEST_SLUGS) {
			const m = LAYER_METHODOLOGY_DE[slug];
			expect(m.updateFrequency, `updateFrequency ${slug}`).toBeTruthy();
		}
	});
});

describe('getLayerMethodology', () => {
	it('liefert Eintrag für bekannten Slug', () => {
		const m = getLayerMethodology('laerm-2023');
		expect(m).not.toBeNull();
		expect(m?.aggregationLevel).toBe('lor-planungsraum');
	});

	it('liefert null für unbekannten Slug', () => {
		expect(getLayerMethodology('does-not-exist-xyz')).toBeNull();
	});

	it('relatedLayers verweisen nur auf bekannte Manifest-Slugs', () => {
		const valid = new Set<string>(MANIFEST_SLUGS);
		for (const slug of MANIFEST_SLUGS) {
			const m = LAYER_METHODOLOGY_DE[slug];
			if (!m.relatedLayers) continue;
			for (const rel of m.relatedLayers) {
				expect(valid.has(rel), `${slug} → relatedLayer ${rel} unbekannt`).toBe(true);
			}
		}
	});

	it('coverageGaps + omissions sind String-Arrays falls vorhanden', () => {
		for (const slug of MANIFEST_SLUGS) {
			const m = LAYER_METHODOLOGY_DE[slug];
			if (m.coverageGaps) {
				expect(Array.isArray(m.coverageGaps)).toBe(true);
				expect(m.coverageGaps.every((g) => typeof g === 'string' && g.length > 0)).toBe(true);
			}
			if (m.omissions) {
				expect(Array.isArray(m.omissions)).toBe(true);
				expect(m.omissions.every((g) => typeof g === 'string' && g.length > 0)).toBe(true);
			}
		}
	});

	it('AGGREGATION_LEVELS enthält die 7 erwarteten Werte', () => {
		expect(new Set(AGGREGATION_LEVELS)).toEqual(
			new Set([
				'address',
				'lor-planungsraum',
				'lor-bezirksregion',
				'lor-prognoseraum',
				'bezirk',
				'block',
				'point-osm'
			])
		);
	});
});

describe('Stolperstein-Methodik · Würde-Prinzip', () => {
	it('Stolperstein-omissions verweisen auf externe Primärquellen statt Bewertung', () => {
		const m = getLayerMethodology('stolpersteine');
		expect(m).not.toBeNull();
		expect(m?.omissions?.some((o) => /Biograf|Bewertung|Wertung|Wohn-Score/i.test(o))).toBe(true);
	});
});

describe('Mietspiegel/Bodenrichtwerte-Methodik · keine Wertung', () => {
	it('bodenrichtwerte-omissions thematisieren Mietpreis-Abgrenzung', () => {
		const m = getLayerMethodology('bodenrichtwerte');
		expect(m?.omissions?.some((o) => /Miete|Mietpreis|Marktpreis/i.test(o))).toBe(true);
	});

	it('wohnlagen-2024-omissions verweisen auf Mietspiegel-Rechner', () => {
		const m = getLayerMethodology('wohnlagen-2024');
		expect(m?.omissions?.some((o) => /Mietspiegel|Mietpreis|€\/m²/.test(o))).toBe(true);
	});
});

describe('Authority-Zentralisierung (Story 2.5a)', () => {
	it('jeder Methodology-Spec referenziert einen gültigen AuthorityKey', () => {
		for (const slug of MANIFEST_SLUGS) {
			const spec = getLayerMethodologySpec(slug);
			expect(spec, `Spec ${slug}`).not.toBeNull();
			expect(AUTHORITY_KEYS, `${slug} authorityKey`).toContain(spec!.authorityKey);
		}
	});

	it('resolved authority-String entspricht der zentralen Authority-Map', () => {
		const m = getLayerMethodology('laerm-2023');
		const spec = getLayerMethodologySpec('laerm-2023');
		expect(spec).not.toBeNull();
		expect(m?.authority).toBe(resolveAuthority(spec!.authorityKey, 'de'));
	});

	it('OSM-Composites enthalten ODbL-Lizenz-Suffix im resolved authority-String', () => {
		const stolper = getLayerMethodology('stolpersteine');
		expect(stolper?.authority).toMatch(/OpenStreetMap-Contributors \(ODbL 1\.0\)/);

		const ubahn = getLayerMethodology('ubahn-stationen');
		expect(ubahn?.authority).toMatch(/BVG/);
		expect(ubahn?.authority).toMatch(/OpenStreetMap-Contributors \(ODbL 1\.0\)/);
	});

	it('Specs ohne Suffix bekommen genau den Authority-Klartext ohne Anhang', () => {
		const m = getLayerMethodology('bezirke');
		const spec = getLayerMethodologySpec('bezirke');
		expect(spec?.authoritySuffix).toBeUndefined();
		expect(m?.authority).toBe(resolveAuthority(spec!.authorityKey, 'de'));
	});

	it('getLayerMethodologySpec liefert null für unbekannten Slug', () => {
		expect(getLayerMethodologySpec('does-not-exist-xyz')).toBeNull();
	});
});
