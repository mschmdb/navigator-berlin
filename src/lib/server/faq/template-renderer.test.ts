import { describe, it, expect } from 'vitest';
import { renderTemplate, type TemplateContext } from './template-renderer.js';
import type { FaqTemplate } from './template-schema.js';

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
			dominantWohnlage: { value: 'mittel', layer: 'mietspiegel-2024', sourceUpdatedAt: '2024-05-01' },
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
		expect(result?.answer).toContain('laerm-2023');
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
