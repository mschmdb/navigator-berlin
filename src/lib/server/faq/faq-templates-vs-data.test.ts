import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllFaqTemplates, type LoadedTemplate } from './load-templates.js';
import { renderTemplate, type MetricContext, type TemplateAggregate } from './template-renderer.js';
import { checkFaqAnswer } from './faq-fact-check.js';
import type { PageType, TemplateLocale } from './template-schema.js';

/**
 * NAV-108: Die echten YAML-Templates gegen belegte Datenstände rendern und
 * prüfen. Fixtures entsprechen den Werten der lokalen DB (15.11.2026).
 */

const av = <T>(value: T, layer: string) => ({ value, layer, sourceUpdatedAt: '2024-01-01' });

const reuterstrasse: TemplateAggregate = {
	laerm: {
		dominantCategory: av('gering', 'laerm-2023'),
		categoryDistribution: av({ gering: 0.8, mittel: 0.2 }, 'laerm-2023')
	},
	luft: { dominantCategory: null, categoryDistribution: null },
	gruen: {
		dominantVersorgung: av('schlecht', 'gruenversorgung-2023'),
		versorgungDistribution: av({ mittel: 0.2, schlecht: 0.8 }, 'gruenversorgung-2023'),
		gruenanlagenCount: av(3, 'gruenanlagen'),
		spielplaetzeCount: av(10, 'spielplaetze')
	},
	klima: { meanPet: av(35.3, 'klima-pet-2022'), shareSehrHeiss: null },
	wohnen: {
		dominantWohnlage: null,
		wohnlageDistribution: null,
		dominantMss: av('mittel', 'mss-gesamtindex-2025'),
		mssDistribution: null
	},
	oepnv: {
		stopsPerKm2: av(23.91928932517214, 'oepnv-composite'),
		uBahnCount: av(2, 'ubahn-stationen'),
		sBahnCount: av(0, 'sbahn-stationen'),
		tramCount: av(0, 'tram-haltestellen'),
		busCount: av(32, 'bus-haltestellen')
	},
	bildung: { kitasPerKm2: null, schulenPerKm2: null },
	heritage: { denkmalPerKm2: null, stolpersteinePerKm2: null }
};

const neukoelln: TemplateAggregate = {
	...reuterstrasse,
	gruen: {
		dominantVersorgung: av('gut', 'gruenversorgung-2023'),
		versorgungDistribution: av(
			{ gut: 0.5217391304347826, mittel: 0.15217391304347827, schlecht: 0.32608695652173914 },
			'gruenversorgung-2023'
		),
		gruenanlagenCount: av(117, 'gruenanlagen'),
		spielplaetzeCount: av(200, 'spielplaetze')
	},
	oepnv: {
		stopsPerKm2: av(11.9, 'oepnv-composite'),
		uBahnCount: av(16, 'ubahn-stationen'),
		sBahnCount: av(2, 'sbahn-stationen'),
		tramCount: av(0, 'tram-haltestellen'),
		busCount: av(515, 'bus-haltestellen')
	}
};

const metric = (
	value: number,
	rang: number,
	quartil: number,
	total: number,
	cmp: number,
	kind: 'bezirk' | 'berlin'
): MetricContext => ({
	value,
	rang,
	quartil,
	total,
	compareValue: cmp,
	compareKind: kind
});

let templates: LoadedTemplate[];
beforeAll(async () => {
	templates = await loadAllFaqTemplates();
});

function renderAllFor(
	pageType: PageType,
	name: string,
	aggregate: TemplateAggregate,
	metrics: ReadonlyMap<string, MetricContext>,
	locale: TemplateLocale
) {
	const out: { id: string; answer: string; templateText: string }[] = [];
	for (const { locale: l, file } of templates) {
		if (l !== locale) continue;
		for (const t of file.templates) {
			const r = renderTemplate(t, { pageType, slug: 'x', name, locale, aggregate, metrics });
			if (r) out.push({ id: t.id, answer: r.answer, templateText: t.answer });
		}
	}
	return out;
}

const kiezMetrics = new Map([
	['mobilitaet', metric(30.4, 2, 1, 4, 25, 'bezirk')],
	['gruenHitze', metric(26, 4, 4, 4, 40, 'bezirk')],
	['ruheLuft', metric(48, 3, 3, 4, 60, 'bezirk')],
	['wohnschutz', metric(90, 1, 1, 4, 50, 'bezirk')]
]);
const kiezField = new Map([
	['mobilitaet', [40, 30.4, 20, 10]],
	['gruenHitze', [60, 50, 40, 26]],
	['ruheLuft', [70, 60, 48, 10]],
	['wohnschutz', [90, 50, 40, 10]]
]);
const bezirkMetrics = new Map([
	['mobilitaet', metric(22, 2, 2, 4, 22.3, 'berlin')],
	['gruenHitze', metric(55, 3, 3, 4, 60, 'berlin')]
]);
const bezirkField = new Map([
	['mobilitaet', [30, 22, 20, 10]],
	['gruenHitze', [70, 60, 55, 50]]
]);

describe.each(['de', 'en'] as const)('FAQ-Templates gegen Daten (%s)', (locale) => {
	it('Kiez Reuterstraße: keine Antwort widerspricht den Daten', () => {
		const rows = renderAllFor('kiez', 'Reuterstraße', reuterstrasse, kiezMetrics, locale);
		const findings = rows.flatMap((r) =>
			checkFaqAnswer(
				{
					pageType: 'kiez',
					slug: 'reuterstrasse',
					locale,
					templateId: r.id,
					answer: r.answer,
					templateText: r.templateText
				},
				{ name: 'Reuterstraße', aggregate: reuterstrasse, metrics: kiezMetrics, field: kiezField }
			).map((f) => `${r.id}: ${f.message}`)
		);
		expect(findings).toEqual([]);
	});

	it('Bezirk Neukölln: keine Antwort widerspricht den Daten', () => {
		const rows = renderAllFor('bezirk', 'Neukölln', neukoelln, bezirkMetrics, locale);
		const findings = rows.flatMap((r) =>
			checkFaqAnswer(
				{
					pageType: 'bezirk',
					slug: 'neukoelln',
					locale,
					templateId: r.id,
					answer: r.answer,
					templateText: r.templateText
				},
				{ name: 'Neukölln', aggregate: neukoelln, metrics: bezirkMetrics, field: bezirkField }
			).map((f) => `${r.id}: ${f.message}`)
		);
		expect(findings).toEqual([]);
	});
});

describe('FAQ-Templates: belegte Fehler aus NAV-108', () => {
	const answer = (
		pageType: PageType,
		name: string,
		agg: TemplateAggregate,
		m: ReadonlyMap<string, MetricContext>,
		locale: TemplateLocale,
		id: string
	) => renderAllFor(pageType, name, agg, m, locale).find((r) => r.id === id)?.answer ?? '';

	it('ÖPNV Reuterstraße nennt die Verkehrsmittel aus den Daten', () => {
		const de = answer(
			'kiez',
			'Reuterstraße',
			reuterstrasse,
			kiezMetrics,
			'de',
			'oepnv-dichte-kiez'
		);
		expect(de).not.toMatch(/Tram-/);
		expect(de).toContain('2 U-Bahnhöfe und 32 Bushalte');
		expect(de).toContain('keine Tramhaltestelle');
		const en = answer(
			'kiez',
			'Reuterstraße',
			reuterstrasse,
			kiezMetrics,
			'en',
			'oepnv-dichte-kiez'
		);
		expect(en).toContain('2 U-Bahn stations and 32 bus stops');
	});

	it('Grün Reuterstraße nennt die Senats-Klasse „schlecht“', () => {
		const de = answer(
			'kiez',
			'Reuterstraße',
			reuterstrasse,
			kiezMetrics,
			'de',
			'gruen-versorgung-kiez'
		);
		expect(de).toContain('überwiegend als „schlecht“');
		expect(de).toContain('„schlecht“ 80 %, „mittel“ 20 %');
		expect(de).not.toMatch(/\bgering\b/);
	});

	it('Grün Neukölln trennt Senats-Klasse und Grün-und-Hitze-Score', () => {
		const de = answer(
			'bezirk',
			'Neukölln',
			neukoelln,
			bezirkMetrics,
			'de',
			'gruen-versorgung-bezirk'
		);
		expect(de).toContain('„gut“ 52 %, „schlecht“ 33 %, „mittel“ 15 %');
		expect(de).toContain('eigene Messgröße');
		const en = answer(
			'bezirk',
			'Neukölln',
			neukoelln,
			bezirkMetrics,
			'en',
			'gruen-versorgung-bezirk'
		);
		expect(en).toContain('“good” 52%, “poor” 33%, “medium” 15%');
		expect(en).toContain('separate measure');
	});

	it('MSS-Text folgt der Richtung des Status-Index', () => {
		const hoch = {
			...neukoelln,
			wohnen: { ...neukoelln.wohnen, dominantMss: av('hoch', 'mss-gesamtindex-2025') }
		};
		for (const locale of ['de', 'en'] as const) {
			const text = answer('bezirk', 'Neukölln', hoch, bezirkMetrics, locale, 'wohnen-mss-bezirk');
			expect(
				checkFaqAnswer(
					{
						pageType: 'bezirk',
						slug: 'neukoelln',
						locale,
						templateId: 'wohnen-mss-bezirk',
						answer: text,
						templateText: ''
					},
					{ name: 'Neukölln', aggregate: hoch }
				)
			).toEqual([]);
		}
	});
});
