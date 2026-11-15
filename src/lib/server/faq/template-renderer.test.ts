import { describe, it, expect } from 'vitest';
import { renderTemplate, type TemplateContext } from './template-renderer.js';
import type { FaqTemplate } from './template-schema.js';

/**
 * Story 2.5b T3.4 + AC-8, NAV-108: Pure-Function-Tests für den Slot-Renderer.
 */

const ctx = (overrides: Partial<TemplateContext> = {}): TemplateContext => ({
	pageType: 'bezirk',
	slug: 'mitte',
	name: 'Mitte',
	locale: 'de',
	aggregate: {
		laerm: {
			dominantCategory: { value: 'hoch', layer: 'laerm-2023', sourceUpdatedAt: '2023-06-01' },
			categoryDistribution: {
				value: { hoch: 0.75, mittel: 0.25 },
				layer: 'laerm-2023',
				sourceUpdatedAt: '2023-06-01'
			}
		},
		gruen: {
			dominantVersorgung: {
				value: 'gut',
				layer: 'gruenversorgung-2023',
				sourceUpdatedAt: '2024-01-01'
			},
			versorgungDistribution: {
				value: { gut: 1 },
				layer: 'gruenversorgung-2023',
				sourceUpdatedAt: '2024-01-01'
			},
			gruenanlagenCount: { value: 42, layer: 'gruenanlagen', sourceUpdatedAt: '2024-04-01' },
			spielplaetzeCount: null
		},
		klima: {
			meanPet: { value: 42.5, layer: 'stadtklima-2015', sourceUpdatedAt: '2015-09-01' },
			shareSehrHeiss: null
		},
		oepnv: {
			stopsPerKm2: { value: 18.4, layer: 'oepnv-composite', sourceUpdatedAt: '2024-09-01' },
			uBahnCount: { value: 3, layer: 'ubahn-stationen', sourceUpdatedAt: '2024-09-01' },
			sBahnCount: { value: 0, layer: 'sbahn-stationen', sourceUpdatedAt: '2024-09-01' },
			tramCount: { value: 0, layer: 'tram-haltestellen', sourceUpdatedAt: '2024-09-01' },
			busCount: { value: 40, layer: 'bus-haltestellen', sourceUpdatedAt: '2024-09-01' }
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

const laermTemplate: FaqTemplate = {
	id: 'laerm-dominant-bezirk',
	applicableTo: ['bezirk'],
	requires: ['laerm.categoryDistribution'],
	question: 'Wie laut ist es im Bezirk {name}?',
	answer: '{laermSatz} Quelle: {laermSource}, Stand {laermStand}.'
};

describe('renderTemplate', () => {
	it('substituiert {name} in der Frage, die Antwort nennt den Ort ohne Namen', () => {
		const result = renderTemplate(laermTemplate, ctx());
		expect(result?.question).toBe('Wie laut ist es im Bezirk Mitte?');
		expect(result?.answer).toBe(
			'Eher laut. Drei Viertel der Teilgebiete liegen in der Lärmklasse hoch, ein Viertel in der Klasse mittel. Quelle: Lärmbelastung 2023, Stand Juni 2023.'
		);
	});

	it('liefert null wenn requires-Feld null ist', () => {
		const base = ctx();
		const result = renderTemplate(laermTemplate, {
			...base,
			aggregate: {
				...base.aggregate,
				laerm: { dominantCategory: null, categoryDistribution: null }
			}
		});
		expect(result).toBeNull();
	});

	it('skippt Template wenn pageType nicht in applicableTo', () => {
		expect(renderTemplate(laermTemplate, ctx({ pageType: 'kiez' }))).toBeNull();
	});

	it('rendert deterministisch', () => {
		expect(renderTemplate(laermTemplate, ctx())).toEqual(renderTemplate(laermTemplate, ctx()));
	});

	it('Grün: Senats-Urteil für den ganzen Bezirk', () => {
		const tpl: FaqTemplate = { ...laermTemplate, id: 'g', requires: [], answer: '{gruenSatz}' };
		expect(renderTemplate(tpl, ctx())?.answer).toBe(
			'Laut Senat gut. Der ganze Bezirk gilt als gut mit Grün versorgt.'
		);
	});

	it('ÖPNV: Urteil, Dichte und Verkehrsmittel', () => {
		const tpl: FaqTemplate = {
			...laermTemplate,
			id: 'o',
			requires: ['oepnv.stopsPerKm2'],
			answer:
				'{oepnvUrteil} Auf einen Quadratkilometer kommen {oepnvStopsPerKm2} Haltestellen. {oepnvModi}'
		};
		expect(renderTemplate(tpl, ctx())?.answer).toBe(
			'Das Haltestellennetz ist hier dicht, typisch für gemischte Innenstadtlagen. Auf einen Quadratkilometer kommen 18,4 Haltestellen. Im Bezirk liegen 3 U-Bahnhöfe und 40 Bushaltestellen, aber kein S-Bahnhof und keine Tramhaltestelle.'
		);
	});

	it('Klima: gefühlte Temperatur mit Urteil', () => {
		const tpl: FaqTemplate = {
			...laermTemplate,
			id: 'k',
			requires: ['klima.meanPet'],
			answer: '{klimaSatz}'
		};
		expect(renderTemplate(tpl, ctx())?.answer).toBe(
			'An heißen Tagen wird es hier heiß: Die gefühlte Temperatur liegt im Schnitt bei 42,5 Grad. Schatten und Trinkwasser werden dann wichtig.'
		);
		expect(renderTemplate(tpl, ctx({ locale: 'en' }))?.answer).toContain('averages 42.5 degrees');
	});

	it('Ortswörter je Seitentyp und Sprache', () => {
		const tpl: FaqTemplate = {
			...laermTemplate,
			id: 'w',
			applicableTo: ['bezirk', 'kiez'],
			requires: [],
			answer: '{OrtDer}|{ortIm}'
		};
		expect(renderTemplate(tpl, ctx())?.answer).toBe('Der Bezirk|im Bezirk');
		expect(renderTemplate(tpl, ctx({ pageType: 'kiez', locale: 'en' }))?.answer).toBe(
			'The Kiez|in the Kiez'
		);
	});

	it('Grün-Anzahl mit en-GB-Tausendertrenner', () => {
		const base = ctx();
		const tpl: FaqTemplate = {
			...laermTemplate,
			id: 'c',
			requires: [],
			answer: '{gruenanlagenCount}'
		};
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

	it('lässt unbekannte Slots stehen (die Faktenprüfung meldet sie)', () => {
		const tpl: FaqTemplate = {
			...laermTemplate,
			id: 'x',
			requires: [],
			answer: 'Hallo {unbekannterSlot}.'
		};
		expect(renderTemplate(tpl, ctx())?.answer).toBe('Hallo {unbekannterSlot}.');
	});

	it('requiresScore: ohne Score keine Antwort', () => {
		const tpl: FaqTemplate = {
			...laermTemplate,
			id: 'ws',
			requires: [],
			requiresScore: ['wohnschutz'],
			answer: '{OrtDer} kommt auf {wohnschutzScore} von 100 Punkten, {wohnschutzLage}.'
		};
		expect(renderTemplate(tpl, ctx())).toBeNull();
		const withScore = renderTemplate(tpl, {
			...ctx(),
			metrics: new Map([
				[
					'wohnschutz',
					{ value: 18, rang: 2, quartil: 1, total: 12, compareValue: 10, compareKind: 'berlin' }
				]
			])
		});
		expect(withScore?.answer).toBe(
			'Der Bezirk kommt auf 18 von 100 Punkten, Platz 2 von 12 Bezirken.'
		);
	});
});

describe('renderTemplate ohne Score-Metriken (#100)', () => {
	const merged: FaqTemplate = {
		id: 'laerm-dominant-bezirk',
		applicableTo: ['bezirk'],
		requires: ['laerm.categoryDistribution'],
		question: 'Wie laut ist es im Bezirk {name}?',
		answer:
			'{laermSatz} Im Ruhe-und-Luft-Score kommt der Bezirk auf {ruheLuftScore} von 100 Punkten, {ruheLuftLage}. Das ist {ruheLuftVergleich}. Quelle: {laermSource}, Stand {laermStand}.'
	};

	it('lässt die Score-Sätze weg, wenn Metriken fehlen, der Rest bleibt', () => {
		const result = renderTemplate(merged, ctx());
		expect(result?.answer).not.toMatch(/\{[a-zA-Z]+\}/);
		expect(result?.answer).toContain('Eher laut.');
		expect(result?.answer).toContain('Quelle: Lärmbelastung 2023');
		expect(result?.answer).not.toContain('Ruhe-und-Luft-Score');
		expect(result?.answer).not.toContain('Das ist');
	});

	it('behält den Score-Satz, wenn nur der Vergleich fehlt', () => {
		const result = renderTemplate(merged, {
			...ctx(),
			metrics: new Map([
				[
					'ruheLuft',
					{ value: 72, rang: 2, quartil: 1, total: 12, compareValue: null, compareKind: 'berlin' }
				]
			])
		});
		expect(result?.answer).not.toMatch(/\{[a-zA-Z]+\}/);
		expect(result?.answer).toContain(
			'kommt der Bezirk auf 72 von 100 Punkten, Platz 2 von 12 Bezirken.'
		);
		expect(result?.answer).not.toContain('Das ist');
	});

	it('lässt bei Namen mit Abkürzungspunkt keinen Satzrest stehen', () => {
		const tpl = { ...merged, answer: 'In {name} ist es laut. ' + merged.answer };
		const result = renderTemplate(tpl, ctx({ name: 'St. Beispiel' }));
		expect(result?.answer).toContain('In St. Beispiel ist es laut.');
		expect(result?.answer).not.toContain('Score');
	});
});
