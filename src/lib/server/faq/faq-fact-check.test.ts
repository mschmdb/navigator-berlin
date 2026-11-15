import { describe, it, expect } from 'vitest';
import { checkFaqAnswer, type FaqCheckFacts, type FaqCheckSubject } from './faq-fact-check.js';
import type { MetricContext, TemplateAggregate } from './template-renderer.js';

/** NAV-108: Prüft gerenderte FAQ-Antworten gegen die Quelldaten. */

const av = <T>(value: T, layer = 'x') => ({ value, layer, sourceUpdatedAt: '2024-01-01' });

const aggregate = (over: Partial<TemplateAggregate> = {}): TemplateAggregate => ({
	laerm: { dominantCategory: av('gering'), categoryDistribution: av({ gering: 0.8, mittel: 0.2 }) },
	luft: { dominantCategory: null, categoryDistribution: null },
	gruen: {
		dominantVersorgung: av('schlecht'),
		versorgungDistribution: av({ schlecht: 0.8, mittel: 0.2 }),
		gruenanlagenCount: av(3),
		spielplaetzeCount: av(10)
	},
	klima: { meanPet: av(35.3), shareSehrHeiss: null },
	wohnen: {
		dominantWohnlage: null,
		wohnlageDistribution: null,
		dominantMss: av('hoch'),
		mssDistribution: null
	},
	oepnv: {
		stopsPerKm2: av(23.91928932517214),
		uBahnCount: av(2),
		sBahnCount: av(0),
		tramCount: av(0),
		busCount: av(32)
	},
	bildung: { kitasPerKm2: null, schulenPerKm2: null },
	heritage: { denkmalPerKm2: null, stolpersteinePerKm2: null },
	...over
});

const metric = (over: Partial<MetricContext> = {}): MetricContext => ({
	value: 30.2,
	rang: 2,
	quartil: 1,
	total: 4,
	compareValue: 25,
	compareKind: 'bezirk',
	...over
});

const facts = (over: Partial<FaqCheckFacts> = {}): FaqCheckFacts => ({
	name: 'Reuterstraße',
	aggregate: aggregate(),
	metrics: new Map([['mobilitaet', metric()]]),
	field: new Map([['mobilitaet', [40, 30.2, 20, 10]]]),
	...over
});

const subject = (answer: string, over: Partial<FaqCheckSubject> = {}): FaqCheckSubject => ({
	pageType: 'kiez',
	slug: 'reuterstrasse',
	locale: 'de',
	templateId: 'oepnv-dichte-kiez',
	answer,
	templateText: '',
	...over
});

const kinds = (answer: string, s: Partial<FaqCheckSubject> = {}, f?: Partial<FaqCheckFacts>) =>
	checkFaqAnswer(subject(answer, s), facts(f)).map((x) => x.kind);

describe('checkFaqAnswer: Verkehrsmittel', () => {
	it('meldet Tram, wenn der Kiez keine Tram-Halte hat (Reuterstraße)', () => {
		const answer =
			'Im Kiez Reuterstraße liegen 23,9 Halte pro Quadratkilometer. Das entspricht dem Niveau innerstädtischer Bezirke, mit Tram- und Bus-Halten in kurzem Fußweg-Abstand.';
		expect(kinds(answer)).toContain('modus');
	});

	it('meldet „U- oder S-Bahn“, wenn es keine S-Bahn gibt', () => {
		expect(kinds('Das Netz hat guten Anschluss an U- oder S-Bahn.')).toContain('modus');
	});

	it('akzeptiert verneinte Verkehrsmittel ohne Halte', () => {
		const answer =
			'Der Datensatz zählt hier 2 U-Bahnhöfe und 32 Bushalte. Es gibt keinen S-Bahnhof und keine Tramhaltestelle.';
		expect(kinds(answer)).toEqual([]);
	});

	it('meldet eine Verneinung, wenn es doch Halte gibt', () => {
		expect(kinds('Es gibt keinen U-Bahnhof.')).toContain('modus');
	});

	it('meldet eine falsche Anzahl', () => {
		expect(kinds('Der Datensatz zählt hier 3 U-Bahnhöfe.')).toContain('modus');
	});

	it('ignoriert die Quellenangabe „BVG + S-Bahn“', () => {
		expect(kinds('Quelle: ÖPNV-Haltestellen (BVG + S-Bahn), Stand Mai 2026.')).toEqual([]);
	});

	it('prüft auch EN', () => {
		expect(
			kinds('with tram and bus stops within short walking distance.', { locale: 'en' })
		).toContain('modus');
		expect(
			kinds(
				'The dataset counts 2 U-Bahn stations and 32 bus stops. There is no S-Bahn station and no tram stop.',
				{
					locale: 'en'
				}
			)
		).toEqual([]);
	});
});

describe('checkFaqAnswer: Grünversorgung', () => {
	const gruen = { templateId: 'gruen-versorgung-kiez' };

	it('meldet die Umbenennung „gering“ statt der Senats-Klasse „schlecht“', () => {
		expect(
			kinds(
				'Die wohnungsnahe Grünversorgung im Kiez Reuterstraße liegt in der Kategorie gering.',
				gruen
			)
		).toContain('klasse');
	});

	it('akzeptiert Senats-Klasse und Anteile', () => {
		const answer =
			'Der Senat stuft die wohnungsnahe Grünversorgung im Kiez Reuterstraße überwiegend als „schlecht“ ein. Anteile der Planungsräume: „schlecht“ 80 %, „mittel“ 20 %.';
		expect(kinds(answer, gruen)).toEqual([]);
	});

	it('meldet eine falsche überwiegende Klasse', () => {
		expect(kinds('Der Senat stuft sie überwiegend als „gut“ ein.', gruen)).toContain('klasse');
	});

	it('meldet einen falschen Anteil', () => {
		expect(kinds('Anteile der Planungsräume: „schlecht“ 70 %, „mittel“ 20 %.', gruen)).toContain(
			'klasse'
		);
	});

	it('prüft EN-Klassen', () => {
		const en = { ...gruen, locale: 'en' as const };
		expect(kinds('provision near homes is in the category low.', en)).toContain('klasse');
		expect(
			kinds('The Senate mostly rates it as “poor”. Shares: “poor” 80%, “medium” 20%.', en)
		).toEqual([]);
	});
});

describe('checkFaqAnswer: Klassen und Zahlen', () => {
	it('meldet eine falsche ÖPNV-Dichteklasse (11,9 ist „mittel“)', () => {
		const f = { aggregate: aggregate({ oepnv: { ...aggregate().oepnv, stopsPerKm2: av(11.9) } }) };
		expect(
			kinds(
				'Im Bezirk liegen 11,9 Haltestellen pro Quadratkilometer. Das Netz gilt damit als dicht.',
				{},
				f
			)
		).toContain('klasse');
	});

	it('meldet eine falsche Lärm-Klasse', () => {
		expect(
			kinds('Der Kiez liegt überwiegend in der Lärm-Klasse hoch.', {
				templateId: 'laerm-dominant-kiez'
			})
		).toContain('klasse');
		expect(
			kinds('Der Kiez liegt überwiegend in der Lärm-Klasse gering.', {
				templateId: 'laerm-dominant-kiez'
			})
		).toEqual([]);
	});

	it('meldet eine Zahl, die in keinem Datenwert vorkommt', () => {
		expect(kinds('Im Kiez liegen 19,4 Halte pro Quadratkilometer.')).toContain('zahl');
	});

	it('meldet eine falsche PET', () => {
		expect(
			kinds('Die mittlere PET liegt bei 36,1 Grad Celsius.', { templateId: 'klima-pet-kiez' })
		).toContain('zahl');
	});

	it('meldet einen MSS-Text gegen die Richtung des Status-Index', () => {
		const s = { templateId: 'wohnen-mss-bezirk', pageType: 'bezirk' as const };
		expect(
			kinds(
				'Der Index zeigt überdurchschnittliche sozio-ökonomische Belastung im Berliner Vergleich.',
				s
			)
		).toContain('klasse');
	});

	it('meldet nicht ersetzte Slots', () => {
		expect(kinds('Im Kiez {name} liegen Halte.')).toContain('slot');
	});
});

describe('checkFaqAnswer: Scores und Ränge', () => {
	const score = (rank: string, cmp = 'über dem Bezirksschnitt', value = '30') =>
		`Im Mobilitäts-Score erreicht Reuterstraße ${value} von 100 (${rank}), ${cmp}.`;

	it('akzeptiert Score, Wettkampf-Rang und Vergleich', () => {
		expect(kinds(score('Platz 2 von 4'))).toEqual([]);
	});

	it('meldet einen Rang, der nicht dem Wettkampf-Rang im Feld entspricht', () => {
		expect(kinds(score('Platz 3 von 4'))).toContain('rang');
	});

	it('meldet einen falschen Score', () => {
		expect(kinds(score('Platz 2 von 4', 'über dem Bezirksschnitt', '31'))).toContain('score');
	});

	it('meldet eine falsche Vergleichsrichtung', () => {
		expect(kinds(score('Platz 2 von 4', 'unter dem Bezirksschnitt'))).toContain('vergleich');
	});

	it('verlangt „unteres Viertel“ im vierten Quartil', () => {
		const f = {
			metrics: new Map([['mobilitaet', metric({ value: 10, rang: 4, quartil: 4 })]]),
			field: new Map([['mobilitaet', [40, 30, 20, 10]]])
		};
		expect(kinds(score('Platz 4 von 4', 'unter dem Bezirksschnitt', '10'), {}, f)).toContain(
			'rang'
		);
		expect(kinds(score('unteres Viertel', 'unter dem Bezirksschnitt', '10'), {}, f)).toEqual([]);
	});

	it('teilt Gleichstand den Rang (1224)', () => {
		const f = {
			metrics: new Map([['mobilitaet', metric({ value: 30, rang: 2 })]]),
			field: new Map([['mobilitaet', [40, 30, 30, 10]]])
		};
		expect(kinds(score('Platz 2 von 4'), {}, f)).toEqual([]);
	});

	it('prüft EN', () => {
		const en =
			'Reuterstraße scores 30 out of 100 in the Mobility score (rank 3 of 4), above the district average.';
		expect(kinds(en, { locale: 'en' })).toContain('rang');
	});
});
