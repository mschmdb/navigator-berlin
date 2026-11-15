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
	it('meldet Tram, wenn der Kiez keine Tram-Halte hat (Reuterstraße, alter Text)', () => {
		const answer =
			'Das entspricht dem Niveau innerstädtischer Bezirke, mit Tram- und Bus-Halten in kurzem Fußweg-Abstand.';
		expect(kinds(answer)).toContain('modus');
	});

	it('meldet „U- oder S-Bahn“, wenn es keine S-Bahn gibt', () => {
		expect(kinds('Das Netz hat guten Anschluss an U- oder S-Bahn.')).toContain('modus');
	});

	it('akzeptiert verneinte Verkehrsmittel ohne Halte', () => {
		const answer =
			'Im Kiez liegen 2 U-Bahnhöfe und 32 Bushaltestellen, aber kein S-Bahnhof und keine Tramhaltestelle.';
		expect(kinds(answer)).toEqual([]);
	});

	it('meldet eine Verneinung, wenn es doch Halte gibt', () => {
		expect(kinds('Im Kiez liegt kein U-Bahnhof.')).toContain('modus');
	});

	it('meldet eine falsche Anzahl, auch als Zahlwort', () => {
		expect(kinds('Im Kiez liegen 3 U-Bahnhöfe.')).toContain('modus');
		expect(kinds('Im Kiez liegt ein U-Bahnhof.')).toContain('modus');
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
				'The Kiez has 2 U-Bahn stations and 32 bus stops, but no S-Bahn station and no tram stop.',
				{ locale: 'en' }
			)
		).toEqual([]);
	});
});

describe('checkFaqAnswer: Grünversorgung', () => {
	const gruen = { templateId: 'gruen-versorgung-kiez' };
	const ok =
		'Laut Senat überwiegend schlecht. Vier Fünftel der Teilgebiete gelten als schlecht mit Grün versorgt, ein Fünftel als mittel.';

	it('meldet die Umbenennung „gering“ statt der Senats-Klasse „schlecht“', () => {
		expect(kinds('Die Grünversorgung im Kiez liegt in der Kategorie gering.', gruen)).toContain(
			'klasse'
		);
	});

	it('akzeptiert Urteil und Anteile aus den Daten', () => {
		expect(kinds(ok, gruen)).toEqual([]);
	});

	it('meldet ein falsches Urteil', () => {
		expect(kinds(ok.replace('überwiegend schlecht', 'überwiegend gut'), gruen)).toContain('klasse');
		expect(kinds(ok.replace('überwiegend schlecht', 'schlecht'), gruen)).toContain('klasse');
		expect(kinds(ok.replace('überwiegend schlecht', 'gemischt'), gruen)).toContain('klasse');
	});

	it('meldet einen falschen Anteil', () => {
		expect(kinds(ok.replace('Vier Fünftel', 'Drei Fünftel'), gruen)).toContain('klasse');
	});

	it('meldet eine fehlende Klasse', () => {
		expect(
			kinds(
				'Laut Senat überwiegend schlecht. Vier Fünftel der Teilgebiete gelten als schlecht mit Grün versorgt.',
				gruen
			)
		).toContain('klasse');
	});

	it('prüft EN', () => {
		const en = { ...gruen, locale: 'en' as const };
		expect(kinds('provision near homes is in the category low.', en)).toContain('klasse');
		expect(
			kinds(
				'Mostly poor, according to the Senate. Four fifths of the subareas are rated as poorly served with green space, one fifth as moderately served.',
				en
			)
		).toEqual([]);
		expect(
			kinds(
				'Mostly poor, according to the Senate. Three fifths of the subareas are rated as poorly served with green space, one fifth as moderately served.',
				en
			)
		).toContain('klasse');
	});
});

describe('checkFaqAnswer: Klassen und Zahlen', () => {
	it('meldet ein falsches ÖPNV-Urteil (11,9 ist „mittel“)', () => {
		const f = { aggregate: aggregate({ oepnv: { ...aggregate().oepnv, stopsPerKm2: av(11.9) } }) };
		expect(
			kinds('Das Haltestellennetz ist hier dicht, typisch für gemischte Innenstadtlagen.', {}, f)
		).toContain('klasse');
		expect(
			kinds('Das Haltestellennetz ist hier mittel dicht, im Berliner Mittelfeld.', {}, f)
		).toEqual([]);
	});

	it('meldet eine falsche Lärm-Klasse und ein falsches Lärm-Urteil', () => {
		const laerm = { templateId: 'laerm-dominant-kiez' };
		const ok =
			'Eher ruhig. Vier Fünftel der Teilgebiete liegen in der Lärmklasse gering, ein Fünftel in der Klasse mittel.';
		expect(kinds(ok, laerm)).toEqual([]);
		expect(kinds(ok.replace('Lärmklasse gering', 'Lärmklasse hoch'), laerm)).toContain('klasse');
		expect(kinds(ok.replace('Eher ruhig', 'Eher laut'), laerm)).toContain('klasse');
	});

	it('meldet eine Zahl, die in keinem Datenwert vorkommt', () => {
		expect(kinds('Im Kiez liegen 19,4 Dinge.')).toContain('zahl');
	});

	it('meldet eine falsche PET und ein falsches PET-Urteil', () => {
		const k = { templateId: 'klima-pet-kiez' };
		expect(kinds('Die gefühlte Temperatur liegt im Schnitt bei 36,1 Grad.', k)).toContain('zahl');
		expect(
			kinds(
				'An heißen Tagen wird es hier sehr heiß: Die gefühlte Temperatur liegt im Schnitt bei 35,3 Grad.',
				k
			)
		).toContain('klasse');
		expect(
			kinds(
				'An heißen Tagen wird es hier warm, aber nicht extrem: Die gefühlte Temperatur liegt im Schnitt bei 35,3 Grad.',
				k
			)
		).toEqual([]);
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
	const score = (lage: string, cmp = 'mehr als im Schnitt der Kieze im Bezirk', value = '30') =>
		`Im Mobilitäts-Score von navigator.berlin kommt der Kiez auf ${value} von 100 Punkten, ${lage}. Das ist ${cmp}.`;

	it('akzeptiert Score, Wettkampf-Rang und Vergleich', () => {
		expect(kinds(score('Platz 2 von 4 Kiezen'))).toEqual([]);
	});

	it('meldet einen Rang, der nicht dem Wettkampf-Rang im Feld entspricht', () => {
		expect(kinds(score('Platz 3 von 4 Kiezen'))).toContain('rang');
	});

	it('meldet einen falschen Score', () => {
		expect(kinds(score('Platz 2 von 4 Kiezen', undefined, '31'))).toContain('score');
	});

	it('meldet eine falsche Vergleichsrichtung oder ein falsches Vergleichsziel', () => {
		expect(
			kinds(score('Platz 2 von 4 Kiezen', 'weniger als im Schnitt der Kieze im Bezirk'))
		).toContain('vergleich');
		expect(
			kinds(score('Platz 2 von 4 Kiezen', 'mehr als beim mittleren Berliner Bezirk'))
		).toContain('vergleich');
	});

	it('verlangt „unteres Viertel“ im vierten Quartil', () => {
		const f = {
			metrics: new Map([['mobilitaet', metric({ value: 10, rang: 4, quartil: 4 })]]),
			field: new Map([['mobilitaet', [40, 30, 20, 10]]])
		};
		const below = 'weniger als im Schnitt der Kieze im Bezirk';
		expect(kinds(score('Platz 4 von 4 Kiezen', below, '10'), {}, f)).toContain('rang');
		expect(kinds(score('im unteren Viertel der 4 Kieze', below, '10'), {}, f)).toEqual([]);
	});

	it('verlangt „geteilter Platz“ bei Gleichstand, und nur dann', () => {
		const f = {
			metrics: new Map([['mobilitaet', metric({ value: 30, rang: 2, geteiltMit: 1 })]]),
			field: new Map([['mobilitaet', [40, 30, 30, 10]]])
		};
		expect(kinds(score('geteilter Platz 2 von 4 Kiezen'), {}, f)).toEqual([]);
		expect(kinds(score('Platz 2 von 4 Kiezen'), {}, f)).toContain('rang');
		expect(kinds(score('geteilter Platz 2 von 4 Kiezen'))).toContain('rang');
	});

	it('prüft EN', () => {
		const en = (lage: string) =>
			`In the navigator.berlin Mobility score, the Kiez gets 30 of 100 points, ${lage}. That is more than the average of the Kieze in its Bezirk.`;
		expect(kinds(en('rank 2 of 4 Kieze'), { locale: 'en' })).toEqual([]);
		expect(kinds(en('rank 3 of 4 Kieze'), { locale: 'en' })).toContain('rang');
	});
});

describe('checkFaqAnswer: Zahl gehört zur richtigen Kennzahl', () => {
	it('meldet eine Dichte, die nur zufällig einem anderen Wert gleicht', () => {
		expect(kinds('Auf einen Quadratkilometer kommen 32 Haltestellen.')).toContain('zahl');
		expect(kinds('There are 32.0 stops per square kilometre.', { locale: 'en' })).toContain('zahl');
		expect(kinds('Auf einen Quadratkilometer kommen 23,9 Haltestellen.')).toEqual([]);
	});

	it('meldet eine PET aus einem fremden Feld', () => {
		expect(kinds('Die gefühlte Temperatur liegt im Schnitt bei 32 Grad.')).toContain('zahl');
		expect(kinds('the perceived temperature averages 35.3 degrees.', { locale: 'en' })).toEqual([]);
	});

	it('meldet eine Grünanlagen-Zahl aus einem fremden Feld', () => {
		expect(kinds('Der Senat zählt im Bezirk 10 öffentliche Grünanlagen.')).toContain('zahl');
		expect(
			kinds('The Senate counts 3 public green spaces in the Bezirk.', { locale: 'en' })
		).toEqual([]);
	});
});
