import type { LoadedTemplate } from './load-templates.js';
import { loadAllFaqTemplates } from './load-templates.js';
import { computeFaqPositions, faqPositionKey } from './faq-positions.js';
import { templateAppliesToTarget } from './layer-faq-clusters.js';
import {
	SCORE_DIMS,
	renderTemplate,
	type CompareKind,
	type MetricContext,
	type TemplateContext
} from './template-renderer.js';
import type { ClusterKey } from './template-schema.js';

/**
 * NAV-108: Eine FAQ-Quelle für die ganze Seite. `render-faq.ts` schreibt damit
 * `faq_qna`; die neuen Kiez- und Bezirksseiten können dieselbe Funktion beim
 * Prerender direkt aus Aggregat und Rängen aufrufen. Keine I/O außer dem
 * zwischengespeicherten Template-Laden in `loadPlaceFaq`.
 */

export interface PlaceFaqItem {
	readonly templateId: string;
	readonly cluster: ClusterKey;
	readonly topic?: string;
	readonly question: string;
	readonly answer: string;
	/** Redaktionelle Position (Cluster-Folge, dann YAML-Position). */
	readonly sortOrder: number;
	/** Roh-Antwort des Templates; die Faktenprüfung braucht sie. */
	readonly templateText: string;
}

/** Alle passenden Templates einer Sprache für ein Gebiet, sortiert. */
export function renderPlaceFaq(
	templates: readonly LoadedTemplate[],
	ctx: TemplateContext
): PlaceFaqItem[] {
	const positions = computeFaqPositions(templates);
	const out: PlaceFaqItem[] = [];
	for (const { cluster, locale, file } of templates) {
		if (locale !== ctx.locale) continue;
		if (!templateAppliesToTarget(ctx, cluster)) continue;
		for (const template of file.templates) {
			const rendered = renderTemplate(template, ctx);
			if (!rendered) continue;
			const sortOrder = positions.get(faqPositionKey(cluster, template.id));
			if (sortOrder === undefined) {
				throw new Error(`Keine FAQ-Position für Template ${cluster}/${template.id}`);
			}
			out.push({
				templateId: template.id,
				cluster,
				topic: template.topic,
				question: rendered.question,
				answer: rendered.answer,
				sortOrder,
				templateText: template.answer
			});
		}
	}
	return out.sort((a, b) => a.sortOrder - b.sortOrder);
}

let cached: Promise<LoadedTemplate[]> | null = null;

/** Wie `renderPlaceFaq`, lädt die Templates beim ersten Aufruf von der Platte. */
export async function loadPlaceFaq(ctx: TemplateContext): Promise<PlaceFaqItem[]> {
	cached ??= loadAllFaqTemplates();
	return renderPlaceFaq(await cached, ctx);
}

export interface RankRowInput {
	readonly slug: string;
	readonly metricKey: string;
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number;
}

export interface ValueRowInput {
	readonly slug: string;
	readonly metricKey: string;
	readonly value: number | null;
	/** Kiez: Schnitt der Kieze im Bezirk. Bezirk: Berliner Median der Bezirke. */
	readonly compareValue: number | null;
}

/**
 * Rang, Vergleich und Gleichstand je Gebiet und Score-Dimension. Reine
 * Funktion über Rang- und Vergleichszeilen (`kiez_rank` + `kiez_comparison`
 * bzw. die Bezirks-Tabellen).
 */
export function buildMetricContexts(
	ranks: readonly RankRowInput[],
	values: readonly ValueRowInput[],
	compareKind: CompareKind
): Map<string, Map<string, MetricContext>> {
	const dims = new Set<string>(SCORE_DIMS);
	const valueBy = new Map(values.map((v) => [`${v.slug}|${v.metricKey}`, v]));
	const tieCount = new Map<string, number>();
	for (const r of ranks) {
		if (r.rang === null) continue;
		const key = `${r.metricKey}|${r.rang}`;
		tieCount.set(key, (tieCount.get(key) ?? 0) + 1);
	}
	const out = new Map<string, Map<string, MetricContext>>();
	for (const r of ranks) {
		if (!dims.has(r.metricKey)) continue;
		const v = valueBy.get(`${r.slug}|${r.metricKey}`);
		const m: MetricContext = {
			value: v?.value ?? null,
			rang: r.rang,
			quartil: r.quartil,
			total: r.total,
			compareValue: v?.compareValue ?? null,
			compareKind,
			geteiltMit: r.rang === null ? 0 : (tieCount.get(`${r.metricKey}|${r.rang}`) ?? 1) - 1
		};
		if (!out.has(r.slug)) out.set(r.slug, new Map());
		out.get(r.slug)!.set(r.metricKey, m);
	}
	return out;
}
