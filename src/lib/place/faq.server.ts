/**
 * FAQ der Kiez- und Bezirksseiten beim Prerender (NAV-105): Aggregat und Ränge aus der DB,
 * Antworten aus `loadPlaceFaq` (dieselben Templates wie `faq_qna`), danach die Faktenprüfung.
 * Antworten mit Befund fallen weg und landen als Warnung im Build-Log.
 */
import { getDb } from '#lib/server/db/index.js';
import {
	bezirkComparison,
	bezirkRank,
	bezirkStats,
	kiezComparison,
	kiezRank,
	kiezStats
} from '#lib/server/db/schema/index.js';
import { checkFaqAnswer } from '#lib/server/faq/faq-fact-check.js';
import { buildMetricContexts, loadPlaceFaq } from '#lib/server/faq/place-faq.js';
import type { MetricContext, TemplateAggregate } from '#lib/server/faq/template-renderer.js';
import type { TemplateLocale } from '#lib/server/faq/template-schema.js';
import { toPageFaq, type PageFaqItem } from './faq-items';

type Level = 'kiez' | 'bezirk';

interface LevelFacts {
	readonly aggregates: Map<string, TemplateAggregate>;
	readonly metrics: Map<string, Map<string, MetricContext>>;
	/** Alle Werte je Score-Dimension im Feld (Wettkampf-Rang in der Prüfung). */
	readonly field: Map<string, number[]>;
}

const cache = new Map<Level, Promise<LevelFacts>>();

async function loadLevel(level: Level): Promise<LevelFacts> {
	const db = getDb();
	const stats = level === 'kiez' ? kiezStats : bezirkStats;
	const [rows, ranks, cmps] = await Promise.all([
		db
			.select({
				slug: stats.slug,
				laerm: stats.laerm,
				luft: stats.luft,
				gruen: stats.gruen,
				klima: stats.klima,
				wohnen: stats.wohnen,
				oepnv: stats.oepnv,
				bildung: stats.bildung,
				heritage: stats.heritage
			})
			.from(stats),
		db.select().from(level === 'kiez' ? kiezRank : bezirkRank),
		level === 'kiez'
			? db
					.select()
					.from(kiezComparison)
					.then((cs) =>
						cs.map((c) => ({
							slug: c.slug,
							metricKey: c.metricKey,
							value: c.kiezValue,
							compareValue: c.bezirkMean
						}))
					)
			: db
					.select()
					.from(bezirkComparison)
					.then((cs) =>
						cs.map((c) => ({
							slug: c.slug,
							metricKey: c.metricKey,
							value: c.bezirkValue,
							compareValue: c.berlinMedian
						}))
					)
	]);
	const metrics = buildMetricContexts(ranks, cmps, level === 'kiez' ? 'bezirk' : 'berlin');
	const field = new Map<string, number[]>();
	for (const m of metrics.values()) {
		for (const [key, c] of m) {
			if (c.value === null || c.rang === null) continue;
			if (!field.has(key)) field.set(key, []);
			field.get(key)?.push(c.value);
		}
	}
	const aggregates = new Map(rows.map(({ slug, ...agg }) => [slug, agg as TemplateAggregate]));
	return { aggregates, metrics, field };
}

function facts(level: Level): Promise<LevelFacts> {
	let hit = cache.get(level);
	if (!hit) {
		hit = loadLevel(level).catch((err) => {
			cache.delete(level);
			throw err;
		});
		cache.set(level, hit);
	}
	return hit;
}

/** Geprüfte FAQ eines Orts; ohne DB oder Aggregat leer. */
export async function loadPageFaq(
	level: Level,
	slug: string,
	name: string,
	locale: TemplateLocale
): Promise<PageFaqItem[]> {
	if (!process.env.DATABASE_URL) return [];
	try {
		const f = await facts(level);
		const aggregate = f.aggregates.get(slug);
		if (!aggregate) return [];
		const metrics = f.metrics.get(slug);
		const rendered = await loadPlaceFaq({
			pageType: level,
			slug,
			name,
			locale,
			aggregate,
			metrics
		});
		const { items, dropped } = toPageFaq(rendered, (item) =>
			checkFaqAnswer(
				{
					pageType: level,
					slug,
					locale,
					templateId: item.templateId,
					answer: item.answer,
					templateText: item.templateText
				},
				{ name, aggregate, metrics, field: f.field }
			)
		);
		for (const d of dropped) {
			process.stderr.write(
				`[place-faq] WARN: ${level}/${slug} ${locale} ${d.templateId} verworfen: ${d.findings.join('; ')}\n`
			);
		}
		return items;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[place-faq] WARN: ${level}/${slug} FAQ unavailable (${msg})\n`);
		return [];
	}
}
