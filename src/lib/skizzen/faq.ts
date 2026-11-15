import { m } from '$lib/paraglide/messages.js';
import { msgOpts, type LocaleOpts } from './locale';
import {
	CHAPTERS,
	chapterText,
	formatMetric,
	formatMetricValue,
	labelValueText,
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
	unitPlural: string,
	opts?: LocaleOpts
): FaqItemWithChapter[] {
	const o = msgOpts(opts);
	const n = own.name;
	const lead = (id: MetricId) =>
		metricLead(
			id,
			n,
			own.metrics[id],
			all.map((a) => a[id]),
			unitPlural,
			null,
			opts
		);
	const v = (id: MetricId) => formatMetric(id, own.metrics[id], opts);
	const count = (id: MetricId) => formatMetricValue(id, own.metrics[id], opts);
	const has = (id: MetricId) => own.metrics[id] !== null;
	const label = (l: keyof LabelValues) => {
		const value = own.labels[l];
		return value ? m.skizze_quoted({ value: labelValueText(value, opts) }, o) : null;
	};
	const laermClass = label('laermKlasse');
	const gruenRating = label('gruenversorgung');
	const mss = label('mss');

	const items: { chapter: ChapterId; main: MetricId; question: string; answer: string }[] = [
		{
			chapter: 'laerm',
			main: 'laermDb',
			question: m.skizze_faq_laerm_q({ name: n }, o),
			answer: [
				lead('laermDb'),
				laermClass ? m.skizze_faq_laerm_class({ value: laermClass }, o) : '',
				m.skizze_faq_laerm_source({}, o)
			].join(' ')
		},
		{
			chapter: 'gruen',
			main: 'gruenanlagen',
			question: m.skizze_faq_gruen_q({ name: n }, o),
			answer: [
				lead('gruenanlagen'),
				has('gruenSchlecht')
					? gruenRating
						? m.skizze_faq_gruen_bad_rating({ value: v('gruenSchlecht'), rating: gruenRating }, o)
						: m.skizze_faq_gruen_bad({ value: v('gruenSchlecht') }, o)
					: '',
				m.skizze_faq_gruen_source({}, o)
			].join(' ')
		},
		{
			chapter: 'gruen',
			main: 'pet',
			question: m.skizze_faq_pet_q({ name: n }, o),
			answer: m.skizze_faq_pet_answer({ lead: lead('pet') }, o)
		},
		{
			chapter: 'wohnen',
			main: 'bestandsmiete',
			question: m.skizze_faq_wohnen_q({ name: n }, o),
			answer: [
				lead('bestandsmiete'),
				has('altbau') ? m.skizze_faq_wohnen_altbau({ value: v('altbau') }, o) : '',
				has('milieuschutz') ? m.skizze_faq_wohnen_milieu({ value: v('milieuschutz') }, o) : '',
				m.skizze_faq_wohnen_source({}, o)
			].join(' ')
		},
		{
			chapter: 'unterwegs',
			main: 'haltestellenKm2',
			question: m.skizze_faq_oepnv_q({ name: n }, o),
			answer: [
				lead('haltestellenKm2'),
				has('haltestelle400m') ? m.skizze_faq_oepnv_400({ value: v('haltestelle400m') }, o) : '',
				has('bahnhoefe') ? m.skizze_faq_oepnv_stations({ count: count('bahnhoefe') }, o) : '',
				m.skizze_faq_oepnv_source({}, o)
			].join(' ')
		},
		{
			chapter: 'versorgung',
			main: 'lebensmittel10k',
			question: m.skizze_faq_versorgung_q({ name: n }, o),
			answer: [
				lead('lebensmittel10k'),
				has('apotheken') && has('kitas')
					? m.skizze_faq_versorgung_counts(
							{ pharmacies: count('apotheken'), kitas: count('kitas') },
							o
						)
					: '',
				m.skizze_faq_versorgung_source({}, o)
			].join(' ')
		},
		{
			chapter: 'menschen',
			main: 'dichte',
			question: m.skizze_faq_dichte_q({ name: n }, o),
			answer: [
				lead('dichte'),
				mss ? m.skizze_faq_dichte_mss({ value: mss }, o) : '',
				m.skizze_faq_dichte_source({}, o)
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
				chapter: c ? { id: c.id, title: chapterText(c.id, opts).title } : null
			};
		});
}
