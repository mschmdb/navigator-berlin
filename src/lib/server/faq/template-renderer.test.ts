import { describe, it, expect } from 'vitest';
import { renderTemplate, type TemplateContext } from './template-renderer.js';
import type { FaqTemplate } from './template-schema.js';
import { describeLaermCategoryDe, laermErklaerungDe } from '$lib/data/faq-helpers/laerm.js';
import { describeGruenversorgungDe, gruenErklaerungDe } from '$lib/data/faq-helpers/gruen.js';
import {
	describeOepnvDichte,
	formatStopsPerKm2,
	oepnvErklaerungDe
} from '$lib/data/faq-helpers/oepnv.js';
import { describeWohnlageDe, mssBeschreibungDe } from '$lib/data/faq-helpers/wohnen.js';
import { describePetKategorie, formatPet, petErklaerungDe } from '$lib/data/faq-helpers/klima.js';
import { sourceLabel } from '$lib/data/source-label.js';

/**
 * Story 2.5b T3.4 + AC-8: Pure-Function-Tests für den Slot-Renderer.
 */

const ctx = (overrides: Partial<TemplateContext> = {}): TemplateContext => ({
	pageType: 'bezirk',
	slug: 'mitte',
	name: 'Mitte',
	locale: 'de',
	aggregate: {
		laerm: {
			dominantCategory: { value: 'hoch', layer: 'laerm-2023', sourceUpdatedAt: '2023-06-01' },
			categoryDistribution: null
		},
		gruen: {
			dominantVersorgung: null,
			versorgungDistribution: null,
			gruenanlagenCount: { value: 42, layer: 'gruenanlagen', sourceUpdatedAt: '2024-04-01' },
			spielplaetzeCount: null
		},
		klima: {
			meanPet: { value: 42.5, layer: 'stadtklima-2015', sourceUpdatedAt: '2015-09-01' },
			shareSehrHeiss: null
		},
		oepnv: {
			stopsPerKm2: { value: 18.4, layer: 'oepnv-composite', sourceUpdatedAt: '2024-09-01' },
			uBahnCount: null,
			sBahnCount: null,
			tramCount: null,
			busCount: null
		},
		wohnen: {
			dominantWohnlage: {
				value: 'mittel',
				layer: 'mietspiegel-2024',
				sourceUpdatedAt: '2024-05-01'
			},
			wohnlageDistribution: null,
			dominantMss: { value: 'mittel', layer: 'mss-2021', sourceUpdatedAt: '2021-12-01' },
			mssDistribution: null
		},
		luft: { dominantCategory: null, categoryDistribution: null },
		bildung: { kitasPerKm2: null, schulenPerKm2: null },
		heritage: { denkmalPerKm2: null, stolpersteinePerKm2: null }
	},
	...overrides
});

const laermDominantTemplate: FaqTemplate = {
	id: 'laerm-dominant-bezirk',
	applicableTo: ['bezirk'],
	requires: ['laerm.dominantCategory'],
	question: 'Wie ist die Lärmlage in {name}?',
	answer:
		'Die dominante Lärm-Kategorie in {name} ist {laermKategorie}. {laermErklaerung} Quelle: {laermSource}, Stand {laermStand}.'
};

describe('renderTemplate', () => {
	it('substituiert {name} mit dem Page-Namen', () => {
		const result = renderTemplate(laermDominantTemplate, ctx());
		expect(result).not.toBeNull();
		expect(result?.question).toContain('Mitte');
	});

	it('substituiert Lärm-Slots (Kategorie + Erklärung + Quelle + Stand)', () => {
		const result = renderTemplate(laermDominantTemplate, ctx());
		expect(result?.answer).toContain('laut'); // hoch → laut
		expect(result?.answer).toContain('Hauptverkehrsstraßen');
		expect(result?.answer).toContain('Lärmbelastung 2023'); // lesbarer Quellen-Name statt slug (11.3-Fix)
		expect(result?.answer).not.toContain('laerm-2023');
		expect(result?.answer).toContain('Juni 2023');
	});

	it('liefert null wenn requires-Feld null ist', () => {
		const result = renderTemplate(laermDominantTemplate, {
			...ctx(),
			aggregate: {
				...ctx().aggregate,
				laerm: { dominantCategory: null, categoryDistribution: null }
			}
		});
		expect(result).toBeNull();
	});

	it('skippt Template wenn pageType nicht in applicableTo', () => {
		const result = renderTemplate(laermDominantTemplate, ctx({ pageType: 'kiez' }));
		expect(result).toBeNull();
	});

	it('rendert deterministisch (zweimal selbe Eingabe = selbe Ausgabe)', () => {
		const a = renderTemplate(laermDominantTemplate, ctx());
		const b = renderTemplate(laermDominantTemplate, ctx());
		expect(a).toEqual(b);
	});

	it('substituiert Grün-Slots (Anzahl)', () => {
		const tpl: FaqTemplate = {
			id: 'gruen-count',
			applicableTo: ['bezirk'],
			requires: ['gruen.gruenanlagenCount'],
			question: 'Wie viele Grünanlagen liegen in {name}?',
			answer: 'In {name} liegen {gruenanlagenCount} öffentliche Grünanlagen.'
		};
		const result = renderTemplate(tpl, ctx());
		expect(result?.answer).toContain('42');
	});

	it('substituiert ÖPNV-Slots (formatierte Dichte + Erklärung)', () => {
		const tpl: FaqTemplate = {
			id: 'oepnv-dichte',
			applicableTo: ['bezirk'],
			requires: ['oepnv.stopsPerKm2'],
			question: 'Wie dicht ist das ÖPNV-Netz in {name}?',
			answer:
				'In {name} liegen {oepnvStopsPerKm2} Halte pro km². Das Netz gilt damit als {oepnvDichte}.'
		};
		const result = renderTemplate(tpl, ctx());
		expect(result?.answer).toContain('18,4');
		expect(result?.answer).toContain('dicht');
	});

	it('substituiert Klima-Slots (PET-Wert + Kategorie)', () => {
		const tpl: FaqTemplate = {
			id: 'klima-pet',
			applicableTo: ['bezirk'],
			requires: ['klima.meanPet'],
			question: 'Wie heiß wird {name} im Sommer?',
			answer: 'Die mittlere PET in {name} liegt bei {klimaPet} °C. {klimaErklaerung}'
		};
		const result = renderTemplate(tpl, ctx());
		expect(result?.answer).toContain('42,5');
		expect(result?.answer).toContain('Hitzetagen');
	});

	it('substituiert Wohnen-Slots (Wohnlage + MSS-Beschreibung)', () => {
		const tpl: FaqTemplate = {
			id: 'wohnen-lage',
			applicableTo: ['bezirk'],
			requires: ['wohnen.dominantWohnlage'],
			question: 'Welche Wohnlage dominiert in {name}?',
			answer: 'In {name} dominiert die {wohnenWohnlage}. {wohnenMssBeschreibung}'
		};
		const result = renderTemplate(tpl, ctx());
		expect(result?.answer).toContain('mittlere Wohnlage');
	});

	it('verbleibt unverändert wenn ein unbekannter Slot vorkommt', () => {
		const tpl: FaqTemplate = {
			id: 'oddslot',
			applicableTo: ['bezirk'],
			requires: [],
			question: '{name}?',
			answer: 'Hallo {unbekannterSlot}.'
		};
		const result = renderTemplate(tpl, ctx());
		// Renderer wirft NICHT, lässt unbekannte Slots stehen (gracefuller Fallback).
		expect(result?.answer).toBe('Hallo {unbekannterSlot}.');
	});
});

describe('renderTemplate EN (Block C3)', () => {
	const en = (overrides: Partial<TemplateContext> = {}) => ctx({ locale: 'en', ...overrides });

	it('Lärm-Slots englisch, Stand „June 2023"', () => {
		const result = renderTemplate(laermDominantTemplate, en());
		expect(result?.answer).toContain('June 2023');
		expect(result?.answer).not.toContain('Juni');
		expect(result?.answer).not.toContain('Hauptverkehrsstraßen');
		expect(result?.answer).not.toContain('Lärmbelastung 2023');
		expect(result?.answer).not.toMatch(/\blaut\b/);
	});

	it('Grün-Anzahl mit en-GB-Tausendertrenner', () => {
		const tpl: FaqTemplate = {
			id: 'gruen-count',
			applicableTo: ['bezirk'],
			requires: ['gruen.gruenanlagenCount'],
			question: 'q {name}?',
			answer: '{gruenanlagenCount}'
		};
		const base = ctx();
		const result = renderTemplate(tpl, {
			...base,
			locale: 'en',
			aggregate: {
				...base.aggregate,
				gruen: {
					...base.aggregate.gruen,
					gruenanlagenCount: { value: 1234, layer: 'gruenanlagen', sourceUpdatedAt: '2024-04-01' }
				}
			}
		});
		expect(result?.answer).toBe('1,234');
	});

	it('jeder Aggregat-Slot folgt den EN-Helpern', () => {
		const slotNames = [
			'laermKategorie',
			'laermErklaerung',
			'laermSource',
			'laermStand',
			'gruenKategorie',
			'gruenErklaerung',
			'gruenSource',
			'gruenStand',
			'gruenanlagenCount',
			'spielplaetzeCount',
			'oepnvStopsPerKm2',
			'oepnvDichte',
			'oepnvErklaerung',
			'oepnvSource',
			'oepnvStand',
			'wohnenWohnlage',
			'wohnenMssBeschreibung',
			'wohnenSource',
			'wohnenStand',
			'klimaPet',
			'klimaKategorie',
			'klimaErklaerung',
			'klimaSource',
			'klimaStand'
		] as const;
		const tpl: FaqTemplate = {
			id: 'all-slots',
			applicableTo: ['bezirk'],
			requires: [],
			question: 'q {name}?',
			answer: slotNames.map((n) => `{${n}}`).join('|')
		};
		const base = ctx();
		const aggregate = {
			...base.aggregate,
			gruen: {
				dominantVersorgung: {
					value: 'mittel',
					layer: 'gruenversorgung-2023',
					sourceUpdatedAt: '2024-01-01'
				},
				versorgungDistribution: null,
				gruenanlagenCount: { value: 1234, layer: 'gruenanlagen', sourceUpdatedAt: '2024-04-01' },
				spielplaetzeCount: { value: 5678, layer: 'spielplaetze', sourceUpdatedAt: '2024-04-01' }
			}
		} as unknown as TemplateContext['aggregate'];
		const render = (locale: 'de' | 'en') =>
			renderTemplate(tpl, { ...base, aggregate, locale })?.answer.split('|') ?? [];
		const en = render('en');
		const de = render('de');
		const o = { locale: 'en' } as const;
		const expected: Record<(typeof slotNames)[number], string> = {
			laermKategorie: describeLaermCategoryDe('hoch', o),
			laermErklaerung: laermErklaerungDe('hoch', o),
			laermSource: sourceLabel('laerm-2023', o),
			laermStand: 'June 2023',
			gruenKategorie: describeGruenversorgungDe('mittel', o),
			gruenErklaerung: gruenErklaerungDe('mittel', o),
			gruenSource: sourceLabel('gruenversorgung-2023', o),
			gruenStand: 'January 2024',
			gruenanlagenCount: '1,234',
			spielplaetzeCount: '5,678',
			oepnvStopsPerKm2: formatStopsPerKm2(18.4, o),
			oepnvDichte: describeOepnvDichte(18.4, o),
			oepnvErklaerung: oepnvErklaerungDe(18.4, o),
			oepnvSource: sourceLabel('oepnv-composite', o),
			oepnvStand: 'September 2024',
			wohnenWohnlage: describeWohnlageDe('mittel', o),
			wohnenMssBeschreibung: mssBeschreibungDe('mittel', o),
			wohnenSource: sourceLabel('mietspiegel-2024', o),
			wohnenStand: 'May 2024',
			klimaPet: formatPet(42.5, o),
			klimaKategorie: describePetKategorie(42.5, o),
			klimaErklaerung: petErklaerungDe(42.5, o),
			klimaSource: sourceLabel('stadtklima-2015', o),
			klimaStand: 'September 2015'
		};
		slotNames.forEach((name, i) => {
			expect(en[i], name).toBe(expected[name]);
		});
		// Locale-abhängige Text-Slots dürfen nicht der DE-Ausgabe entsprechen.
		const localized = [
			'laermKategorie',
			'laermErklaerung',
			'gruenKategorie',
			'gruenErklaerung',
			'oepnvErklaerung',
			'wohnenWohnlage',
			'wohnenMssBeschreibung',
			'klimaKategorie',
			'klimaErklaerung'
		] as const;
		for (const name of localized) {
			const idx = slotNames.indexOf(name);
			expect(en[idx], name).not.toBe(de[idx]);
		}
	});
});
