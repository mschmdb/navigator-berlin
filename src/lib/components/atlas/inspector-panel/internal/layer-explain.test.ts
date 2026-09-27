import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	LAYER_EXPLAIN_DE,
	LAYER_EXPLAIN_MESSAGE,
	explainLayer,
	getLayerExplain,
	getLayerExplainEntry,
	getLayerExternalLink,
	type LayerExplain
} from './layer-explain.js';

const MANIFEST_PATH = fileURLToPath(
	new URL('../../../../../../static/layers/MANIFEST.json', import.meta.url)
);

interface ManifestSlim {
	layers: { slug: string }[];
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as ManifestSlim;
const manifestSlugs = manifest.layers.map((l) => l.slug);

const MAX_SHORT_LENGTH = 80;
const MAX_LONG_LENGTH = 400;

describe('LAYER_EXPLAIN_DE coverage-guard', () => {
	it('hat Entry für JEDEN Manifest-Slug', () => {
		const missing = manifestSlugs.filter((slug) => !(slug in LAYER_EXPLAIN_DE));
		expect(missing, `Manifest-Slugs ohne LAYER_EXPLAIN_DE-Entry: ${missing.join(', ')}`).toEqual(
			[]
		);
	});

	it('short ≤ 80 Zeichen pro Manifest-Slug', () => {
		const tooLong = manifestSlugs
			.filter((s) => s in LAYER_EXPLAIN_DE)
			.map((slug) => {
				const e = LAYER_EXPLAIN_DE[slug];
				return { slug, len: e.short.length };
			})
			.filter((x) => x.len > MAX_SHORT_LENGTH);
		expect(tooLong, `Slugs mit short > 80 Zeichen: ${JSON.stringify(tooLong)}`).toEqual([]);
	});

	it('long ≤ 400 Zeichen pro Manifest-Slug', () => {
		const tooLong = manifestSlugs
			.filter((s) => s in LAYER_EXPLAIN_DE)
			.map((slug) => {
				const e = LAYER_EXPLAIN_DE[slug];
				return { slug, len: e.long.length };
			})
			.filter((x) => x.len > MAX_LONG_LENGTH);
		expect(tooLong, `Slugs mit long > 400 Zeichen: ${JSON.stringify(tooLong)}`).toEqual([]);
	});

	it('long ist immer länger oder gleich short (Progressive-Disclosure-Invariant)', () => {
		const violations = manifestSlugs
			.filter((s) => s in LAYER_EXPLAIN_DE)
			.filter((slug) => {
				const e = LAYER_EXPLAIN_DE[slug];
				return e.long.length < e.short.length;
			});
		expect(violations, `Slugs mit long < short: ${violations.join(', ')}`).toEqual([]);
	});
});

describe('getLayerExplain(slug, kind)', () => {
	it('liefert short-Text für bekannten Slug', () => {
		const slug = manifestSlugs[0];
		expect(getLayerExplain(slug, 'short')).toBe(LAYER_EXPLAIN_DE[slug].short);
	});

	it('liefert long-Text für bekannten Slug', () => {
		const slug = manifestSlugs[0];
		expect(getLayerExplain(slug, 'long')).toBe(LAYER_EXPLAIN_DE[slug].long);
	});

	it('leerer String für unbekannten Slug', () => {
		expect(getLayerExplain('does-not-exist-xyz', 'short')).toBe('');
		expect(getLayerExplain('does-not-exist-xyz', 'long')).toBe('');
	});
});

describe('explainLayer (Legacy-Helper, Back-Compat)', () => {
	it('liefert short-Text für bekannten Slug (Drop-In-Replacement)', () => {
		const slug = manifestSlugs[0];
		expect(explainLayer(slug)).toBe(LAYER_EXPLAIN_DE[slug].short);
	});

	it('liefert leeren String für unbekannten Slug', () => {
		expect(explainLayer('unknown-xyz')).toBe('');
	});
});

describe('LayerExplain optional fields', () => {
	it('mindestens 1 Manifest-Layer hat unit (Wohnlagen oder Bodenrichtwerte)', () => {
		const withUnit = manifestSlugs.filter((s) => LAYER_EXPLAIN_DE[s]?.unit !== undefined);
		expect(withUnit.length).toBeGreaterThan(0);
	});

	it('mindestens 1 Manifest-Layer hat valueScaleExplain (z.B. Wohnlage 1-5)', () => {
		const withScale = manifestSlugs.filter(
			(s) => LAYER_EXPLAIN_DE[s]?.valueScaleExplain !== undefined
		);
		expect(withScale.length).toBeGreaterThan(0);
	});
});

describe('getLayerExternalLink (Legacy von Story 1.10d)', () => {
	it('liefert Mietspiegel-Link für wohnlagen-2024', () => {
		const link = getLayerExternalLink('wohnlagen-2024');
		expect(link?.href).toBe('https://mietspiegel.berlin.de/');
		expect(link?.label).toMatch(/Mietspiegel/);
	});

	it('null für Layer ohne External-Link', () => {
		expect(getLayerExternalLink('bezirke')).toBeNull();
	});
});

describe('Type-Shape', () => {
	it('Eintrag exposed short + long als string', () => {
		const e: LayerExplain = LAYER_EXPLAIN_DE[manifestSlugs[0]];
		expect(typeof e.short).toBe('string');
		expect(typeof e.long).toBe('string');
	});
});

describe('i18n Block C1: Locale-Parameter (opts.locale)', () => {
	it('ohne opts liefert DE (Boundary: geteilte Accessoren ohne Locale → DE)', () => {
		const slug = manifestSlugs[0];
		expect(getLayerExplain(slug, 'short')).toBe(LAYER_EXPLAIN_DE[slug].short);
		expect(getLayerExplainEntry(slug).short).toBe(LAYER_EXPLAIN_DE[slug].short);
	});

	it('{ locale: "de" } liefert denselben Text wie ohne opts', () => {
		const slug = manifestSlugs[0];
		expect(getLayerExplain(slug, 'short', { locale: 'de' })).toBe(getLayerExplain(slug, 'short'));
	});

	it('{ locale: "en" } liefert einen übersetzten long-Text für alle 78 Slugs (Key-Parität)', () => {
		// `short` darf bei Ein-Wort-Slugs identisch zu DE sein (z.B. „Museum“),
		// `long` ist immer ein Prosa-Satz und muss sich unterscheiden.
		const missing = Object.keys(LAYER_EXPLAIN_DE).filter((slug) => {
			const de = getLayerExplainEntry(slug);
			const en = getLayerExplainEntry(slug, { locale: 'en' });
			return en.long === de.long || en.short === '' || en.long === '';
		});
		expect(missing, `Slugs ohne EN-Übersetzung: ${missing.join(', ')}`).toEqual([]);
	});

	it('{ locale: "en" } valueScaleExplain/unit sind übersetzt, wo vorhanden', () => {
		const slug = 'einwohner-dichte-2024';
		const en = getLayerExplainEntry(slug, { locale: 'en' });
		expect(en.unit).toBe('residents/km²');
		expect(en.valueScaleExplain).toMatch(/no quality judgement/);
	});

	it('explainLayer mit opts liefert EN-Kurztext', () => {
		expect(explainLayer('bezirke', { locale: 'en' })).toBe(
			'Administrative Bezirk of Berlin (12 in total)'
		);
	});

	it('unbekannter Slug bleibt leer, auch mit opts', () => {
		expect(getLayerExplain('does-not-exist-xyz', 'short', { locale: 'en' })).toBe('');
		expect(getLayerExplainEntry('does-not-exist-xyz', { locale: 'en' })).toEqual({
			short: '',
			long: ''
		});
	});

	it('getLayerExternalLink liefert EN-Label mit opts, DE-Label ohne opts', () => {
		const de = getLayerExternalLink('wohnlagen-2024');
		const en = getLayerExternalLink('wohnlagen-2024', { locale: 'en' });
		expect(de?.label).toBe('Mietpreise im Berliner Mietspiegel-Rechner nachschlagen');
		expect(en?.label).toMatch(/rent index calculator/);
		expect(en?.href).toBe(de?.href);
	});
});

// Review-Fund (i18n Block C1): die bisherigen Tests bewiesen Key-Paritaet nur
// indirekt ueber Content-Differenz (`long` DE !== EN). Das laesst eine
// fehlende `LAYER_EXPLAIN_MESSAGE`-Zuordnung durch den stillen
// `LAYER_EXPLAIN_DE`-Fallback unbemerkt, wenn zufaellig DE- und EN-Text
// identisch waeren. Diese Suite prueft die Struktur direkt.
describe('i18n Block C1: LAYER_EXPLAIN_MESSAGE Struktur-Paritaet', () => {
	it('jeder LAYER_EXPLAIN_DE-Key hat einen LAYER_EXPLAIN_MESSAGE-Eintrag (kein stiller Fallback)', () => {
		const missing = Object.keys(LAYER_EXPLAIN_DE).filter(
			(slug) => !(slug in LAYER_EXPLAIN_MESSAGE)
		);
		expect(
			missing,
			`Slugs ohne Message-Mapping (fallen still auf DE zurueck): ${missing.join(', ')}`
		).toEqual([]);
	});

	it('getLayerExplainEntry(slug) deep-equals LAYER_EXPLAIN_DE[slug] fuer ALLE Slugs (inkl. unit/valueScaleExplain)', () => {
		for (const slug of Object.keys(LAYER_EXPLAIN_DE)) {
			expect(getLayerExplainEntry(slug), `Slug: ${slug}`).toEqual(LAYER_EXPLAIN_DE[slug]);
		}
	});

	// Sprachneutrale Einheiten (Symbole/SI-Einheiten) bleiben in DE und EN
	// identisch -- nur `EW/km²` (Einwohner-Dichte) hat eine echte EN-Uebersetzung
	// ("residents/km²").
	const LANGUAGE_NEUTRAL_UNITS = new Set(['€/m²', '°C', 'dB', 'kWh/m²']);

	it('unter EN liefert jeder Slug nicht-leeren Text (der sich von DE unterscheidet), unit/valueScaleExplain-Praesenz matcht DE 1:1', () => {
		for (const slug of Object.keys(LAYER_EXPLAIN_DE)) {
			const de = LAYER_EXPLAIN_DE[slug];
			const en = getLayerExplainEntry(slug, { locale: 'en' });
			expect(en.short, `${slug}.short ist leer`).not.toBe('');
			expect(en.long, `${slug}.long ist leer`).not.toBe('');
			// Einzelne Kurztexte duerfen als Lehnwort mit DE identisch sein (z.B.
			// „Museum“) -- der Eintrag als Ganzes muss sich trotzdem unterscheiden.
			expect(
				en.short !== de.short || en.long !== de.long,
				`${slug}: EN-Text identisch zu DE`
			).toBe(true);
			expect(Boolean(en.unit), `${slug}: unit-Praesenz weicht von DE ab`).toBe(Boolean(de.unit));
			expect(Boolean(en.valueScaleExplain), `${slug}: valueScaleExplain-Praesenz weicht von DE ab`).toBe(
				Boolean(de.valueScaleExplain)
			);
			if (de.unit && !LANGUAGE_NEUTRAL_UNITS.has(de.unit)) {
				expect(en.unit, `${slug}.unit identisch zu DE`).not.toBe(de.unit);
			}
			if (de.valueScaleExplain) {
				expect(en.valueScaleExplain, `${slug}.valueScaleExplain ist leer`).not.toBe('');
				expect(en.valueScaleExplain, `${slug}.valueScaleExplain identisch zu DE`).not.toBe(
					de.valueScaleExplain
				);
			}
		}
	});
});
