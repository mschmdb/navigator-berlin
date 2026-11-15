import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllFaqTemplates, type LoadedTemplate } from './load-templates.js';
import { buildMetricContexts, renderPlaceFaq } from './place-faq.js';
import type { TemplateAggregate } from './template-renderer.js';

/** NAV-108: Eine FAQ-Quelle für alte und neue Kiez- und Bezirksseiten. */

const av = <T>(value: T, layer: string) => ({ value, layer, sourceUpdatedAt: '2024-01-01' });

const aggregate: TemplateAggregate = {
	laerm: {
		dominantCategory: av('gering', 'laerm-2023'),
		categoryDistribution: av({ gering: 1 }, 'laerm-2023')
	},
	luft: { dominantCategory: null, categoryDistribution: null },
	gruen: {
		dominantVersorgung: av('gut', 'gruenversorgung-2023'),
		versorgungDistribution: av({ gut: 1 }, 'gruenversorgung-2023'),
		gruenanlagenCount: av(4, 'gruenanlagen'),
		spielplaetzeCount: null
	},
	klima: { meanPet: av(33, 'klima-pet-2022'), shareSehrHeiss: null },
	wohnen: {
		dominantWohnlage: null,
		wohnlageDistribution: null,
		dominantMss: null,
		mssDistribution: null
	},
	oepnv: {
		stopsPerKm2: av(4, 'oepnv-composite'),
		uBahnCount: av(0, 'ubahn-stationen'),
		sBahnCount: av(0, 'sbahn-stationen'),
		tramCount: av(0, 'tram-haltestellen'),
		busCount: av(6, 'bus-haltestellen')
	},
	bildung: { kitasPerKm2: null, schulenPerKm2: null },
	heritage: { denkmalPerKm2: null, stolpersteinePerKm2: null }
};

let templates: LoadedTemplate[];
beforeAll(async () => {
	templates = await loadAllFaqTemplates();
});

describe('renderPlaceFaq', () => {
	it('liefert die Kiez-FAQ in redaktioneller Reihenfolge, nur eine Sprache', () => {
		const items = renderPlaceFaq(templates, {
			pageType: 'kiez',
			slug: 'x',
			name: 'Testkiez',
			locale: 'de',
			aggregate
		});
		const ids = items.map((i) => i.templateId);
		expect(ids[0]).toBe('laerm-dominant-kiez');
		expect(ids).toContain('oepnv-dichte-kiez');
		expect(ids).not.toContain('oepnv-dichte-bezirk');
		expect(items.every((i, n) => n === 0 || items[n - 1].sortOrder < i.sortOrder)).toBe(true);
		expect(items.find((i) => i.templateId === 'oepnv-dichte-kiez')?.answer).toContain(
			'Im Kiez liegen 6 Bushaltestellen, aber kein U-Bahnhof'
		);
	});

	it('ohne Score-Metriken fehlt die reine Score-Frage, die übrigen bleiben', () => {
		const items = renderPlaceFaq(templates, {
			pageType: 'kiez',
			slug: 'x',
			name: 'K',
			locale: 'en',
			aggregate
		});
		expect(items.map((i) => i.templateId)).not.toContain('wohnen-wohnschutz-einordnung');
		expect(items.length).toBeGreaterThan(3);
	});
});

describe('buildMetricContexts', () => {
	it('baut Rang, Vergleich und Gleichstand je Gebiet und Dimension', () => {
		const ranks = [
			{ slug: 'a', metricKey: 'mobilitaet', rang: 1, quartil: 1, total: 3 },
			{ slug: 'b', metricKey: 'mobilitaet', rang: 2, quartil: 2, total: 3 },
			{ slug: 'c', metricKey: 'mobilitaet', rang: 2, quartil: 2, total: 3 },
			{ slug: 'a', metricKey: 'composite', rang: 1, quartil: 1, total: 3 }
		];
		const values = [
			{ slug: 'a', metricKey: 'mobilitaet', value: 50, compareValue: 40 },
			{ slug: 'b', metricKey: 'mobilitaet', value: 30, compareValue: 40 },
			{ slug: 'c', metricKey: 'mobilitaet', value: 30, compareValue: 40 }
		];
		const out = buildMetricContexts(ranks, values, 'bezirk');
		expect(out.get('a')?.get('mobilitaet')).toEqual({
			value: 50,
			rang: 1,
			quartil: 1,
			total: 3,
			compareValue: 40,
			compareKind: 'bezirk',
			geteiltMit: 0
		});
		expect(out.get('b')?.get('mobilitaet')?.geteiltMit).toBe(1);
		expect(out.get('a')?.has('composite')).toBe(false);
	});
});
