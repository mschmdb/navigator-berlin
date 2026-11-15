/**
 * Themen statt Score: Die Seite ordnet sich nach den Fragen der Leute („Wie laut ist es da?“).
 * Jedes Kapitel zeigt gemessene Werte in echten Einheiten. Score-Punkte erscheinen nur in
 * Karte, Einstiegszeile und Überblick am Ende.
 */

export const METRICS = [
	'laermDb',
	'luftHoch',
	'gruenanlagen',
	'gruenSchlecht',
	'pet',
	'bestandsmiete',
	'altbau',
	'milieuschutz',
	'haltestellenKm2',
	'haltestelle400m',
	'bahnhoefe',
	'lebensmittel10k',
	'apotheken',
	'kitas',
	'schulen',
	'kulturorte',
	'dichte',
	'kieztaten'
] as const;
export type MetricId = (typeof METRICS)[number];
export type MetricValues = Readonly<Record<MetricId, number | null>>;

/** Kategorien als Text (überwiegende Klasse), etwa Lärmklasse oder soziale Lage. */
export const LABELS = ['laermKlasse', 'mss', 'gruenversorgung'] as const;
export type LabelId = (typeof LABELS)[number];
export type LabelValues = Readonly<Record<LabelId, string | null>>;

export interface MetricSpec {
	readonly label: string;
	readonly unit: string;
	readonly digits: number;
	/** Ein Satz, was gemessen wird, für Erstbesucher. */
	readonly what: string;
	readonly source: string;
	/** Vergleichswörter: „lauter“ / „leiser“. Bei Kriminalität bewusst ohne Wertung. */
	readonly higher: string;
	readonly lower: string;
	/** Großer Nullstapel bekommt einen eigenen Block, siehe StripChart. */
	readonly zeroName?: string;
	readonly zeroMedianLabel?: string;
	/** Auf Bezirksebene nicht vorhanden. */
	readonly kiezOnly?: boolean;
	/**
	 * Lesehilfe nur, wo die Richtung für fast alle gilt (leiser, grüner, kühler, näher).
	 * Ohne Wertung bleiben Miete, Altbau, Milieuschutz, Dichte, soziale Lage, Kriminalität und Zählwerte.
	 */
	readonly better?: 'higher' | 'lower';
}

export const METRIC_SPECS: Readonly<Record<MetricId, MetricSpec>> = {
	laermDb: {
		label: 'Verkehrslärm',
		unit: 'dB',
		digits: 1,
		what: 'Mittlerer Lärmpegel über Tag, Abend und Nacht (L_DEN), Strategische Lärmkarte 2022',
		source: 'Umweltatlas Berlin',
		higher: 'lauter',
		lower: 'leiser',
		better: 'lower'
	},
	luftHoch: {
		label: 'Hohe Luftbelastung',
		unit: '% der Teilgebiete',
		digits: 0,
		what: 'Anteil der Planungsräume (Teilgebiete) mit hoher Luftbelastung, Umweltgerechtigkeitsatlas 2023',
		source: 'Umweltatlas Berlin',
		higher: 'mehr belastet',
		lower: 'weniger belastet',
		zeroName: 'ohne hohe Luftbelastung',
		zeroMedianLabel: 'Median der Kieze mit hoher Luftbelastung',
		better: 'lower'
	},
	gruenanlagen: {
		label: 'Parks und Grünanlagen',
		unit: '% der Fläche',
		digits: 1,
		what: 'Anteil öffentlicher Parks und Grünanlagen an der Fläche',
		source: 'Grünanlagenbestand Berlin',
		higher: 'grüner',
		lower: 'weniger grün',
		better: 'higher'
	},
	gruenSchlecht: {
		label: 'Wenig Grün in Wohnungsnähe',
		unit: '% der Teilgebiete',
		digits: 0,
		what: 'Anteil der Planungsräume (Teilgebiete), die laut Senat schlecht mit wohnungsnahem Grün versorgt sind',
		source: 'Umweltatlas Berlin, Grünversorgung 2023',
		higher: 'schlechter versorgt',
		lower: 'besser versorgt',
		zeroName: 'ohne schlecht versorgte Teilgebiete',
		zeroMedianLabel: 'Median der Kieze mit schlecht versorgten Teilgebieten',
		better: 'lower'
	},
	pet: {
		label: 'Gefühlte Temperatur am Nachmittag',
		unit: '°C',
		digits: 1,
		what: 'So warm fühlt es sich an einem heißen Sommertag um 14 Uhr an, Mittel im Gebiet',
		source: 'Umweltatlas Berlin, Klimamodell 2022',
		higher: 'heißer',
		lower: 'kühler',
		better: 'lower'
	},
	bestandsmiete: {
		label: 'Miete in laufenden Verträgen',
		unit: '€/m²',
		digits: 2,
		what: 'Nettokaltmiete je Quadratmeter in bestehenden Mietverträgen, Zensus 2022',
		source: 'Zensus 2022',
		higher: 'teurer',
		lower: 'günstiger'
	},
	altbau: {
		label: 'Altbau',
		unit: '% der Wohnungen',
		digits: 0,
		what: 'Anteil der Wohnungen in Häusern, die vor 1949 gebaut wurden',
		source: 'Zensus 2022',
		higher: 'mehr Altbau',
		lower: 'weniger Altbau'
	},
	milieuschutz: {
		label: 'Milieuschutz',
		unit: '% der Fläche',
		digits: 0,
		what: 'Anteil der Fläche in Milieuschutzgebieten, wo Umbau und Umwandlung in Eigentum genehmigt werden müssen',
		source: 'Geoportal Berlin',
		higher: 'mehr geschützt',
		lower: 'weniger geschützt',
		zeroName: 'ohne Milieuschutz',
		zeroMedianLabel: 'Median der Kieze mit Milieuschutz'
	},
	haltestellenKm2: {
		label: 'Haltestellen',
		unit: 'je km²',
		digits: 1,
		what: 'Haltestellen von U-Bahn, S-Bahn, Tram und Bus je Quadratkilometer',
		source: 'OpenStreetMap',
		higher: 'dichter angebunden',
		lower: 'weniger dicht angebunden',
		better: 'higher'
	},
	haltestelle400m: {
		label: 'Haltestelle in 400 m',
		unit: '% der Menschen',
		digits: 0,
		what: 'Anteil der Menschen, die höchstens 400 Meter bis zur nächsten Haltestelle haben',
		source: 'Zensus 2022 und OpenStreetMap',
		higher: 'näher dran',
		lower: 'weiter weg',
		better: 'higher'
	},
	bahnhoefe: {
		label: 'U- und S-Bahnhöfe',
		unit: 'im Gebiet',
		digits: 0,
		what: 'U- und S-Bahnhöfe innerhalb der Grenzen, die Zahl hängt auch von der Größe des Gebiets ab',
		source: 'OpenStreetMap',
		higher: 'mehr',
		lower: 'weniger'
	},
	lebensmittel10k: {
		label: 'Lebensmittelgeschäfte',
		unit: 'je 10.000 Menschen',
		digits: 1,
		what: 'Supermärkte, Discounter und andere Lebensmittelgeschäfte je 10.000 Einwohnerinnen und Einwohner',
		source: 'OpenStreetMap',
		higher: 'besser versorgt',
		lower: 'schlechter versorgt',
		better: 'higher'
	},
	apotheken: {
		label: 'Apotheken',
		unit: 'im Gebiet',
		digits: 0,
		what: 'Apotheken innerhalb der Grenzen, die Zahl hängt auch von der Größe des Gebiets ab',
		source: 'OpenStreetMap',
		higher: 'mehr',
		lower: 'weniger'
	},
	kitas: {
		label: 'Kitas',
		unit: 'im Gebiet',
		digits: 0,
		what: 'Kitas innerhalb der Grenzen, die Zahl hängt auch von der Größe des Gebiets ab',
		source: 'Senatsverwaltung für Bildung, 2024',
		higher: 'mehr',
		lower: 'weniger'
	},
	schulen: {
		label: 'Schulen',
		unit: 'im Gebiet',
		digits: 0,
		what: 'Schulen innerhalb der Grenzen, die Zahl hängt auch von der Größe des Gebiets ab',
		source: 'Senatsverwaltung für Bildung, 2024',
		higher: 'mehr',
		lower: 'weniger'
	},
	kulturorte: {
		label: 'Kulturorte',
		unit: 'im Gebiet',
		digits: 0,
		what: 'Museen, Theater, Kinos, Bibliotheken, Galerien, Clubs und soziokulturelle Zentren im Gebiet',
		source: 'OpenStreetMap',
		higher: 'mehr',
		lower: 'weniger'
	},
	dichte: {
		label: 'Einwohnerdichte',
		unit: 'Menschen je km²',
		digits: 0,
		what: 'Einwohnerinnen und Einwohner je Quadratkilometer, Stand Ende 2024',
		source: 'Amt für Statistik Berlin-Brandenburg',
		higher: 'dichter besiedelt',
		lower: 'weniger dicht besiedelt'
	},
	kieztaten: {
		label: 'Erfasste Kieztaten',
		unit: 'je 100.000 Menschen',
		digits: 0,
		what: 'Von der Polizei erfasste Kieztaten je 100.000 Einwohner, Mittel 2023 bis 2025. Wo viele Menschen unterwegs sind, aber wenige wohnen, fällt die Zahl hoch aus',
		source: 'Kriminalitätsatlas der Polizei Berlin',
		higher: 'mehr erfasste Fälle',
		lower: 'weniger erfasste Fälle'
	}
};

export type ChapterId =
	| 'laerm'
	| 'gruen'
	| 'wohnen'
	| 'unterwegs'
	| 'versorgung'
	| 'menschen'
	| 'wahlen'
	| 'nachbarn';

export interface ChapterSpec {
	readonly id: ChapterId;
	/** Kurzname in der Sprungleiste. */
	readonly short: string;
	readonly title: string;
	/** Hauptgrafik: eine oder zwei Verteilungen. */
	readonly main: readonly MetricId[];
	/** Nebenwerte als kurze Tabelle. */
	readonly side: readonly MetricId[];
	readonly labels?: readonly LabelId[];
	/** Layer für „Auf der Karte“. */
	readonly mapLayers?: string;
	/** FAQ-Cluster, die zu diesem Kapitel gehören. */
	readonly faq?: readonly string[];
	/** Ohne Rang und Wertung (Kriminalität). */
	readonly neutral?: boolean;
}

export const CHAPTERS: readonly ChapterSpec[] = [
	{
		id: 'laerm',
		short: 'Lärm',
		title: 'Lärm und Luft',
		main: ['laermDb'],
		side: ['luftHoch'],
		labels: ['laermKlasse'],
		mapLayers: 'laerm-2023',
		faq: ['laerm']
	},
	{
		id: 'gruen',
		short: 'Grün',
		title: 'Grün und Hitze',
		main: ['gruenanlagen', 'pet'],
		side: ['gruenSchlecht'],
		labels: ['gruenversorgung'],
		mapLayers: 'gruenanlagen,klima-pet-2022',
		faq: ['gruen', 'klima']
	},
	{
		id: 'wohnen',
		short: 'Wohnen',
		title: 'Wohnen und Miete',
		main: ['bestandsmiete'],
		side: ['altbau', 'milieuschutz'],
		mapLayers: 'zensus-bestandsmiete-2022',
		faq: ['wohnen']
	},
	{
		id: 'unterwegs',
		short: 'Unterwegs',
		title: 'Unterwegs',
		main: ['haltestellenKm2'],
		side: ['haltestelle400m', 'bahnhoefe'],
		mapLayers: 'ubahn-stationen,sbahn-stationen,tram-haltestellen,bus-haltestellen',
		faq: ['oepnv']
	},
	{
		id: 'versorgung',
		short: 'Einkaufen',
		title: 'Einkaufen, Kitas, Kultur',
		main: ['lebensmittel10k'],
		side: ['apotheken', 'kitas', 'schulen', 'kulturorte'],
		mapLayers: 'nahversorgung-lebensmittel,nahversorgung-apotheke'
	},
	{
		id: 'menschen',
		short: 'Menschen',
		title: 'Menschen',
		main: ['dichte'],
		side: ['kieztaten'],
		labels: ['mss'],
		mapLayers: 'einwohner-dichte-2024',
		neutral: true
	}
];

export const LABEL_SPECS: Readonly<Record<LabelId, { label: string; what: string }>> = {
	laermKlasse: {
		label: 'Häufigste Lärmklasse',
		what: 'Häufigste Klasse der Lärmkarte unter den Teilgebieten'
	},
	gruenversorgung: {
		label: 'Grünversorgung laut Senat',
		what: 'Häufigste Einstufung der Teilgebiete, wie gut die Menschen mit Grün in Wohnungsnähe versorgt sind'
	},
	mss: {
		label: 'Soziale Lage',
		what: 'Häufigste Stufe der Teilgebiete im Monitoring Soziale Stadtentwicklung 2025 des Senats'
	}
};

const nf = (digits: number) =>
	new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function formatMetric(id: MetricId, value: number | null): string {
	if (value === null) return 'keine Angabe';
	const spec = METRIC_SPECS[id];
	return `${nf(spec.digits).format(value)}\u00a0${spec.unit}`;
}

/** Nur die Zahl, für Achsen. */
export function formatMetricNumber(id: MetricId, value: number): string {
	return nf(Math.min(METRIC_SPECS[id].digits, 1)).format(value);
}

/**
 * Zwei Sätze je Kapitel: Wert und Lage unter allen Orten, dann der Vergleich.
 * „Verkehrslärm in Reuterstraße: 46,2 dB. Das ist leiser als in 80 % der Berliner Kieze.“
 */
export function metricLead(
	id: MetricId,
	name: string,
	own: number | null,
	others: readonly (number | null)[],
	unitPlural: string,
	/** Gewählter Vergleich (nicht Berlin): „1,0 dB leiser als Neukölln gesamt“. */
	ref: { readonly name: string; readonly value: number | null } | null = null
): string {
	if (own === null) return `Für ${name} gibt es dazu keine Angabe.`;
	const spec = METRIC_SPECS[id];
	const xs = others.filter((v): v is number => v !== null);
	const head = `${spec.label} in ${name}: ${formatMetric(id, own)}.`;
	const below = xs.filter((v) => v < own).length;
	const above = xs.filter((v) => v > own).length;
	const pct = (n: number) => Math.round((n / xs.length) * 100);
	const field =
		xs.length === 0 || (below === 0 && above === 0)
			? null
			: below >= above
				? `${spec.higher} als in ${pct(below)} % der Berliner ${unitPlural}`
				: `${spec.lower} als in ${pct(above)} % der Berliner ${unitPlural}`;
	if (ref && ref.value !== null) {
		const diff = own - ref.value;
		const step = 10 ** -spec.digits;
		const cmp =
			Math.abs(diff) < step / 2
				? `genauso viel wie ${ref.name}`
				: `${diffText(id, Math.abs(diff))} ${diff > 0 ? spec.higher : spec.lower} als ${ref.name}`;
		return field ? `${head} Das ist ${cmp}, insgesamt ${field}.` : `${head} Das ist ${cmp}.`;
	}
	return field ? `${head} Das ist ${field}.` : head;
}

/** Abstand mit Einheit; bei Prozentwerten in Prozentpunkten. */
function diffText(id: MetricId, abs: number): string {
	const spec = METRIC_SPECS[id];
	const n = nf(spec.digits).format(abs);
	if (spec.unit.startsWith('%')) return `${n}\u00a0Prozentpunkte`;
	return `${n}\u00a0${spec.unit}`;
}

/**
 * Was einen Ort prägt: die Messwerte, in denen er am weitesten vom Berliner Feld abweicht.
 * „Einwohnerdichte: dichter besiedelt als 95 % der Berliner Kieze“
 */
interface Candidate {
	readonly m: MetricId;
	readonly high: boolean;
	readonly share: number;
}

export function characterPoints(
	own: MetricValues,
	all: readonly MetricValues[],
	unitPlural: string,
	count = 3
): string[] {
	// Zählwerte hängen an der Größe des Gebiets und taugen nicht für „mehr als 92 %“.
	return METRICS.filter((m) => m !== 'kieztaten' && METRIC_SPECS[m].unit !== 'im Gebiet')
		.map((m: MetricId): Candidate | null => {
			const v = own[m];
			const xs = all.map((a) => a[m]).filter((x): x is number => x !== null);
			if (v === null || xs.length < 3) return null;
			const below = xs.filter((x) => x < v).length / xs.length;
			const above = xs.filter((x) => x > v).length / xs.length;
			const high = below >= above;
			return { m, high, share: high ? below : above };
		})
		.filter((c): c is Candidate => c !== null && c.share >= 0.75)
		.sort((a, b) => b.share - a.share)
		.slice(0, count)
		.map((c) => {
			const spec = METRIC_SPECS[c.m];
			return `${spec.label}: ${c.high ? spec.higher : spec.lower} als ${Math.round(c.share * 100)} % der Berliner ${unitPlural}`;
		});
}

/** Nur die Zahl mit den Nachkommastellen der Kennzahl, für Tabellenzellen. */
export function formatMetricValue(id: MetricId, value: number | null): string {
	return value === null ? '–' : nf(METRIC_SPECS[id].digits).format(value);
}

export type HintTone = 'good' | 'bad' | 'neutral';
export interface Hint {
	/** Richtung des Werts selbst, unabhängig von der Wertung. */
	readonly dir: 'higher' | 'lower' | 'same';
	readonly tone: HintTone;
	/** Klartext, etwa „leiser als Berlin-Median“. */
	readonly text: string;
	/** Kurzform für Tabellen, wo die Vergleichsspalte daneben steht: „leiser“. */
	readonly short: string;
}

/** Lesehilfe am Wert: Richtung in Worten, Ton nur bei Kennzahlen mit klarer Richtung. */
export function hintFor(
	id: MetricId,
	own: number | null,
	ref: number | null,
	refLabel: string
): Hint | null {
	if (own === null || ref === null) return null;
	const spec = METRIC_SPECS[id];
	const step = 10 ** -spec.digits;
	if (Math.abs(own - ref) < step / 2) {
		return { dir: 'same', tone: 'neutral', text: `etwa wie ${refLabel}`, short: 'etwa gleich' };
	}
	const dir = own > ref ? 'higher' : 'lower';
	const tone: HintTone = !spec.better ? 'neutral' : spec.better === dir ? 'good' : 'bad';
	const word = dir === 'higher' ? spec.higher : spec.lower;
	return { dir, tone, text: `${word} als ${refLabel}`, short: word };
}
