import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	AGGREGATION_LEVELS,
	getLayerMethodology,
	getLayerMethodologySpec,
	LAYER_METHODOLOGY_DE,
	type AggregationLevel
} from './layer-methodology.js';
import { LAYER_METHODOLOGY_MESSAGE } from './layer-methodology-messages.js';
import { AUTHORITY_KEYS, AUTHORITY_SUFFIX_OSM_ODBL, resolveAuthority } from './authorities.js';

// i18n Block C2: alle 44 Slugs aus `LAYER_METHODOLOGY_SPECS`, nicht nur die
// (kleinere) Manifest-Teilmenge oben -- die Kiez-Score-Dimensionen
// (`kiez-score-*`) haben keinen eigenen Manifest-Eintrag, aber eine
// Methodik-Spec + EN-Übersetzung.
const ALL_METHODOLOGY_SLUGS = Object.keys(LAYER_METHODOLOGY_DE);

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

// i18n Block C2 (spec-i18n-c2-layer-methodik.md): `getLayerMethodology`
// bekommt einen optionalen Locale-Parameter. Ohne `opts`: DE-Default
// (Nicht-UI-Konsumenten, WebMCP), siehe get-layer-detail.test.ts +
// webmcp-Tests für die DE-unter-EN-Boundary.
describe('getLayerMethodology · Locale-Parameter (i18n Block C2)', () => {
	it('ohne opts: identisch zu explizitem locale="de" (DE-Default)', () => {
		const withoutOpts = getLayerMethodology('laerm-2023');
		const withDe = getLayerMethodology('laerm-2023', { locale: 'de' });
		expect(withoutOpts).toEqual(withDe);
	});

	it('liefert null für unbekannten Slug, auch unter locale="en"', () => {
		expect(getLayerMethodology('does-not-exist-xyz', { locale: 'en' })).toBeNull();
	});

	it('aggregationLevel + relatedLayers bleiben locale-unabhängig (Enum/Slugs, nicht übersetzt)', () => {
		const de = getLayerMethodology('kiez-score-versorgung', { locale: 'de' });
		const en = getLayerMethodology('kiez-score-versorgung', { locale: 'en' });
		expect(en?.aggregationLevel).toBe(de?.aggregationLevel);
		expect(en?.relatedLayers).toEqual(de?.relatedLayers);
	});
});

// Review-Fund-Analogon zu i18n Block C1 (#3/#4): erzwingt Message-Mapping-
// Vollständigkeit für JEDEN Slug + JEDES Feld über alle 44 Specs statt nur
// stichprobenartig. Ein fehlendes Feld-Mapping wirft NICHT mehr (Review-Fund:
// ein Server-Error auf `/en/layer/<slug>` wäre schlimmer als deutscher Rest),
// sondern fällt still auf DE zurück -- dieser Test macht die Lücke trotzdem
// sichtbar, weil `en === de` dann die `.not.toBe(de...)`-Assertion bricht.
describe('EN-Vollständigkeit über alle 44 Methodik-Slugs (i18n Block C2)', () => {
	it.each(ALL_METHODOLOGY_SLUGS)(
		'%s: EN löst auf, ohne zu werfen, und weicht von DE ab',
		(slug) => {
			const de = getLayerMethodology(slug, { locale: 'de' });
			const resolveEn = () => getLayerMethodology(slug, { locale: 'en' });
			expect(resolveEn, `EN-Eintrag ${slug}`).not.toThrow();
			const en = resolveEn();
			expect(en, `EN-Eintrag ${slug}`).not.toBeNull();

			if (de?.calculation) {
				expect(en?.calculation, `${slug}.calculation`).toBeTruthy();
				expect(en?.calculation).not.toBe(de.calculation);
			}
			if (de?.updateFrequency) {
				expect(en?.updateFrequency, `${slug}.updateFrequency`).toBeTruthy();
				expect(en?.updateFrequency).not.toBe(de.updateFrequency);
			}
			if (de?.coverageGaps) {
				expect(en?.coverageGaps, `${slug}.coverageGaps`).toHaveLength(de.coverageGaps.length);
				de.coverageGaps.forEach((deGap, idx) => {
					expect(en?.coverageGaps?.[idx], `${slug}.coverageGaps[${idx}]`).toBeTruthy();
					expect(en?.coverageGaps?.[idx]).not.toBe(deGap);
				});
			}
			if (de?.omissions) {
				expect(en?.omissions, `${slug}.omissions`).toHaveLength(de.omissions.length);
				de.omissions.forEach((deOmission, idx) => {
					expect(en?.omissions?.[idx], `${slug}.omissions[${idx}]`).toBeTruthy();
					expect(en?.omissions?.[idx]).not.toBe(deOmission);
				});
			}
		}
	);
});

describe('AUTHORITY_SUFFIX_OSM_ODBL · locale-fähiger Composite-Suffix (i18n Block C2)', () => {
	it('EN-Authority für OSM-Composites nutzt "OpenStreetMap contributors" (Leerzeichen)', () => {
		const stolperEn = getLayerMethodology('stolpersteine', { locale: 'en' });
		expect(stolperEn?.authority).toMatch(/OpenStreetMap contributors \(ODbL 1\.0\)/);
		expect(stolperEn?.authority).not.toMatch(/OpenStreetMap-Contributors/);

		const ubahnEn = getLayerMethodology('ubahn-stationen', { locale: 'en' });
		expect(ubahnEn?.authority).toMatch(/BVG/);
		expect(ubahnEn?.authority).toMatch(/OpenStreetMap contributors \(ODbL 1\.0\)/);
	});

	it('DE bleibt "OpenStreetMap-Contributors" (Bindestrich) -- Parität unverändert', () => {
		const stolperDe = getLayerMethodology('stolpersteine', { locale: 'de' });
		expect(stolperDe?.authority).toMatch(/OpenStreetMap-Contributors \(ODbL 1\.0\)/);
	});

	it('AUTHORITY_SUFFIX_OSM_ODBL deckt beide aktiven Locales ab', () => {
		expect(AUTHORITY_SUFFIX_OSM_ODBL.de).toBeTruthy();
		expect(AUTHORITY_SUFFIX_OSM_ODBL.en).toBeTruthy();
	});
});

// Review-Fund: bisher gab es keinen direkten Beweis, dass jede einzelne
// `layer_methodology_*`-Message-Funktion mit `{locale:'de'}` exakt den
// Spec-String liefert -- die bisherigen Tests prüften nur den End-zu-End-Pfad
// über `getLayerMethodology`. Dieser Test iteriert `LAYER_METHODOLOGY_MESSAGE`
// direkt und vergleicht jede Message (calculation/updateFrequency/jedes
// coverageGaps- und omissions-Element) gegen `LAYER_METHODOLOGY_SPECS`.
describe('DE-Parität: jede Message-Funktion liefert exakt den Spec-String (i18n Block C2)', () => {
	const slugs = Object.keys(
		LAYER_METHODOLOGY_MESSAGE
	) as (keyof typeof LAYER_METHODOLOGY_MESSAGE)[];

	it.each(slugs)('%s: DE-Messages == Spec-Strings', (slug) => {
		const spec = getLayerMethodologySpec(slug);
		expect(spec, `Spec ${slug}`).not.toBeNull();
		const msgs = LAYER_METHODOLOGY_MESSAGE[slug];

		if (msgs.calculation) {
			expect(msgs.calculation(undefined, { locale: 'de' }), `${slug}.calculation`).toBe(
				spec!.calculation
			);
		}
		if (msgs.updateFrequency) {
			expect(msgs.updateFrequency(undefined, { locale: 'de' }), `${slug}.updateFrequency`).toBe(
				spec!.updateFrequency
			);
		}
		msgs.coverageGaps?.forEach((fn, idx) => {
			expect(fn(undefined, { locale: 'de' }), `${slug}.coverageGaps[${idx}]`).toBe(
				spec!.coverageGaps?.[idx]
			);
		});
		msgs.omissions?.forEach((fn, idx) => {
			expect(fn(undefined, { locale: 'de' }), `${slug}.omissions[${idx}]`).toBe(
				spec!.omissions?.[idx]
			);
		});
	});
});

// Review-Fund: Reverse-Check zwischen `messages/de.json` und dem TS-Mapping.
// Fängt zwei Fehlerklassen ab, die die obigen Tests nicht sehen: (a) einen
// Message-Key, der in `messages/de.json` existiert, aber von KEINEM Mapping-
// Eintrag referenziert wird (toter Key, z.B. nach einem Slug-Rename), und
// (b) ein Mapping-Array (`coverageGaps`/`omissions`), das mehr Einträge hat
// als die Spec -- das würde beim DE-Parity-Test oben nicht auffallen, weil
// dort nur über `spec.coverageGaps`/`spec.omissions` (nicht über die
// Message-Arrays) iteriert wird.
describe('Reverse-Check: messages/de.json <-> LAYER_METHODOLOGY_MESSAGE (i18n Block C2)', () => {
	function loadDeMethodologyKeys(): Set<string> {
		const raw = readFileSync(join(process.cwd(), 'messages', 'de.json'), 'utf-8');
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		return new Set(Object.keys(parsed).filter((k) => k.startsWith('layer_methodology_')));
	}

	function expectedKeysFromSpecs(): Set<string> {
		const keys = new Set<string>();
		for (const slug of Object.keys(LAYER_METHODOLOGY_MESSAGE)) {
			const spec = getLayerMethodologySpec(slug)!;
			const kb = `layer_methodology_${slug.replaceAll('-', '_')}`;
			if (spec.calculation) keys.add(`${kb}_calculation`);
			if (spec.updateFrequency) keys.add(`${kb}_update_frequency`);
			spec.coverageGaps?.forEach((_, idx) => keys.add(`${kb}_coverage_gap_${idx}`));
			spec.omissions?.forEach((_, idx) => keys.add(`${kb}_omission_${idx}`));
		}
		return keys;
	}

	it('jeder layer_methodology_*-Key in messages/de.json ist von einer Spec erwartet (keine Waisen)', () => {
		const jsonKeys = loadDeMethodologyKeys();
		const expected = expectedKeysFromSpecs();
		const orphaned = [...jsonKeys].filter((k) => !expected.has(k)).sort();
		expect(orphaned).toEqual([]);
	});

	it('jeder von einer Spec erwartete Key existiert in messages/de.json (keine Lücken)', () => {
		const jsonKeys = loadDeMethodologyKeys();
		const expected = expectedKeysFromSpecs();
		const missing = [...expected].filter((k) => !jsonKeys.has(k)).sort();
		expect(missing).toEqual([]);
	});

	it('kein Mapping-Array (coverageGaps/omissions) hat mehr Einträge als die Spec', () => {
		for (const slug of Object.keys(LAYER_METHODOLOGY_MESSAGE)) {
			const spec = getLayerMethodologySpec(slug)!;
			const msgs = LAYER_METHODOLOGY_MESSAGE[slug as keyof typeof LAYER_METHODOLOGY_MESSAGE];
			expect(msgs.coverageGaps?.length ?? 0, `${slug}.coverageGaps`).toBeLessThanOrEqual(
				spec.coverageGaps?.length ?? 0
			);
			expect(msgs.omissions?.length ?? 0, `${slug}.omissions`).toBeLessThanOrEqual(
				spec.omissions?.length ?? 0
			);
		}
	});
});

// Review-Fund: `requireMessage` warf früher bei fehlendem Feld-Mapping --
// ein neuer Spec-Slug/ein neues Feld ohne Message-Mapping hätte `/en/layer/
// <slug>` mit einem Server-Error (500) abgeschossen. Der Resolver fällt jetzt
// pro Feld auf den DE-Text zurück (+ Dev-Warnung). Dieser Test simuliert eine
// Lücke direkt am Modul (statt auf einen echten Datenfehler zu warten) und
// beweist, dass der Fallback greift statt zu werfen.
describe('Runtime-Fallback bei fehlendem Feld-Mapping (kein Throw, DE-Fallback + Dev-Warnung)', () => {
	it('coverageGaps ohne EN-Mapping fällt für dieses Feld auf DE zurück, wirft nicht', async () => {
		vi.resetModules();
		vi.doMock('./layer-methodology-messages.js', async () => {
			const actual = await vi.importActual<typeof import('./layer-methodology-messages.js')>(
				'./layer-methodology-messages.js'
			);
			return {
				LAYER_METHODOLOGY_MESSAGE: {
					...actual.LAYER_METHODOLOGY_MESSAGE,
					bodenrichtwerte: {
						...actual.LAYER_METHODOLOGY_MESSAGE.bodenrichtwerte,
						coverageGaps: undefined
					}
				}
			};
		});
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		try {
			const { getLayerMethodology: getLayerMethodologyWithGap } =
				await import('./layer-methodology.js');
			const de = getLayerMethodologyWithGap('bodenrichtwerte', { locale: 'de' });
			expect(() => getLayerMethodologyWithGap('bodenrichtwerte', { locale: 'en' })).not.toThrow();
			const en = getLayerMethodologyWithGap('bodenrichtwerte', { locale: 'en' });
			// coverageGaps fehlt im Mock-Mapping -> Fallback liefert die DE-Texte.
			expect(en?.coverageGaps).toEqual(de?.coverageGaps);
			// calculation/updateFrequency sind im Mock unverändert -> bleiben EN.
			expect(en?.calculation).not.toBe(de?.calculation);
			expect(warnSpy).toHaveBeenCalled();
			expect(warnSpy.mock.calls.some(([msg]) => String(msg).includes('bodenrichtwerte'))).toBe(
				true
			);
		} finally {
			warnSpy.mockRestore();
			vi.doUnmock('./layer-methodology-messages.js');
			vi.resetModules();
		}
	});
});
