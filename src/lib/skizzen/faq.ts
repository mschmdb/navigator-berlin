import {
	CHAPTERS,
	formatMetric,
	formatMetricValue,
	metricLead,
	type ChapterId,
	type LabelValues,
	type MetricId,
	type MetricValues
} from './topics';

export interface FaqItemWithChapter {
	readonly question: string;
	readonly answer: string;
	readonly chapter: { readonly id: string; readonly title: string } | null;
}

interface Place {
	readonly name: string;
	readonly metrics: MetricValues;
	readonly labels: LabelValues;
}

/**
 * FAQ aus denselben Werten wie die Kapitel: Eine Antwort kann der Seite nicht widersprechen.
 * Die Live-FAQ kommt heute als fertige Prosa aus der DB (faq_qna) und driftet (Tram, „gering“).
 */
export function buildChapterFaq(
	own: Place,
	all: readonly MetricValues[],
	unitPlural: string
): FaqItemWithChapter[] {
	const n = own.name;
	const lead = (m: MetricId) =>
		metricLead(
			m,
			n,
			own.metrics[m],
			all.map((a) => a[m]),
			unitPlural
		);
	const v = (m: MetricId) => formatMetric(m, own.metrics[m]);
	const has = (m: MetricId) => own.metrics[m] !== null;
	const label = (l: keyof LabelValues) => (own.labels[l] ? `„${own.labels[l]}“` : null);

	const items: { chapter: ChapterId; main: MetricId; question: string; answer: string }[] = [
		{
			chapter: 'laerm',
			main: 'laermDb',
			question: `Wie laut ist es in ${n}?`,
			answer: [
				lead('laermDb'),
				label('laermKlasse')
					? `Die häufigste Klasse der Lärmkarte ist ${label('laermKlasse')}.`
					: '',
				'Quelle: Umweltatlas Berlin, Strategische Lärmkarte 2022.'
			].join(' ')
		},
		{
			chapter: 'gruen',
			main: 'gruenanlagen',
			question: `Wie grün ist ${n}?`,
			answer: [
				lead('gruenanlagen'),
				has('gruenSchlecht')
					? `Laut Senat sind ${v('gruenSchlecht')} schlecht mit Grün in Wohnungsnähe versorgt${label('gruenversorgung') ? `, die häufigste Einstufung ist ${label('gruenversorgung')}` : ''}.`
					: '',
				'Quelle: Grünanlagenbestand Berlin und Umweltatlas, Grünversorgung 2023.'
			].join(' ')
		},
		{
			chapter: 'gruen',
			main: 'pet',
			question: `Wie heiß wird es in ${n} im Sommer?`,
			answer: `${lead('pet')} Gemeint ist die gefühlte Temperatur an einem heißen Sommertag um 14 Uhr. Quelle: Umweltatlas Berlin, Klimamodell 2022.`
		},
		{
			chapter: 'wohnen',
			main: 'bestandsmiete',
			question: `Was kostet Wohnen in ${n}?`,
			answer: [
				lead('bestandsmiete'),
				has('altbau') ? `Altbau: ${v('altbau')}.` : '',
				has('milieuschutz') ? `Milieuschutz: ${v('milieuschutz')}.` : '',
				'Quelle: Zensus 2022 und Geoportal Berlin.'
			].join(' ')
		},
		{
			chapter: 'unterwegs',
			main: 'haltestellenKm2',
			question: `Wie gut ist ${n} an Bus und Bahn angebunden?`,
			answer: [
				lead('haltestellenKm2'),
				has('haltestelle400m')
					? `${v('haltestelle400m')} haben höchstens 400 Meter bis zur nächsten Haltestelle.`
					: '',
				has('bahnhoefe')
					? `Im Gebiet liegen ${formatMetricValue('bahnhoefe', own.metrics.bahnhoefe)} U- und S-Bahnhöfe.`
					: '',
				'Quelle: OpenStreetMap und Zensus 2022.'
			].join(' ')
		},
		{
			chapter: 'versorgung',
			main: 'lebensmittel10k',
			question: `Wie gut ist die Nahversorgung in ${n}?`,
			answer: [
				lead('lebensmittel10k'),
				has('apotheken') && has('kitas')
					? `Im Gebiet liegen ${formatMetricValue('apotheken', own.metrics.apotheken)} Apotheken und ${formatMetricValue('kitas', own.metrics.kitas)} Kitas.`
					: '',
				'Quelle: OpenStreetMap und Senatsverwaltung für Bildung.'
			].join(' ')
		},
		{
			chapter: 'menschen',
			main: 'dichte',
			question: `Wie dicht ist ${n} besiedelt?`,
			answer: [
				lead('dichte'),
				label('mss')
					? `Im Monitoring Soziale Stadtentwicklung 2025 ist die häufigste Stufe ${label('mss')}.`
					: '',
				'Quelle: Amt für Statistik Berlin-Brandenburg.'
			].join(' ')
		}
	];
	return items
		.filter((i) => has(i.main))
		.map((i) => {
			const c = CHAPTERS.find((x) => x.id === i.chapter);
			return {
				question: i.question,
				answer: i.answer.replace(/\s+/g, ' ').trim(),
				chapter: c ? { id: c.id, title: c.title } : null
			};
		});
}
