import type { FaqTemplate, PageType, TemplateLocale } from './template-schema.js';
import type {
	AggregateValue,
	BildungAggregat,
	GruenAggregat,
	HeritageAggregat,
	KlimaAggregat,
	LaermAggregat,
	LuftAggregat,
	OepnvAggregat,
	WohnenAggregat
} from '$lib/server/db/schema/aggregate-types.js';
import { describeLaermCategoryDe, laermErklaerungDe } from '$lib/data/faq-helpers/laerm.js';
import { describeGruenversorgungDe, gruenErklaerungDe } from '$lib/data/faq-helpers/gruen.js';
import {
	describeOepnvDichte,
	formatStopsPerKm2,
	oepnvErklaerungDe
} from '$lib/data/faq-helpers/oepnv.js';
import { describeWohnlageDe, mssBeschreibungDe } from '$lib/data/faq-helpers/wohnen.js';
import { describePetKategorie, formatPet, petErklaerungDe } from '$lib/data/faq-helpers/klima.js';
import { formatRank } from '$lib/data/rank-format.js';
import { sourceLabel } from '$lib/data/source-label.js';

/**
 * Story 2.5b T3: Pure-Function-Slot-Renderer.
 *
 * Input: validiertes Template + Context (Page-Type, Slug, Name, Aggregat).
 * Output: gerendertes `{question, answer}`-Paar oder `null` wenn:
 *  - Template ist für `pageType` nicht aktiv (`applicableTo`), oder
 *  - mindestens ein `requires`-Pfad liefert kein `AggregateValue`.
 *
 * Wichtig: KEIN LLM-Output, KEINE Live-Daten. Alle Werte stammen aus dem
 * Aggregat-JSONB. Slots werden deterministisch ersetzt.
 */

export interface TemplateAggregate {
	readonly laerm: LaermAggregat;
	readonly luft: LuftAggregat;
	readonly gruen: GruenAggregat;
	readonly klima: KlimaAggregat;
	readonly wohnen: WohnenAggregat;
	readonly oepnv: OepnvAggregat;
	readonly bildung: BildungAggregat;
	readonly heritage: HeritageAggregat;
}

/**
 * Rang + Vergleich pro Score-Dimension (Story 11.3). `value` = Wert dieser Fläche,
 * `compareValue` = Bezirksschnitt (Kiez) bzw. Berliner Median (Bezirk),
 * `compareLabel` die passende Beschriftung. Optional, da Layer-Seiten kein Rang.
 */
export interface MetricContext {
	readonly value: number | null;
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number;
	readonly compareValue: number | null;
	readonly compareLabel: string;
}

export interface TemplateContext {
	readonly pageType: PageType;
	readonly slug: string;
	readonly name: string;
	readonly locale: TemplateLocale;
	readonly aggregate: TemplateAggregate;
	/** Story 11.3: Rang/Vergleich je Score-Dimension (ruheLuft, gruenHitze, …). */
	readonly metrics?: ReadonlyMap<string, MetricContext>;
}

/** Neutrale, nicht-wertende Richtungsphrase für den Vergleich (Story 11.3). */
function compareDirection(value: number | null, compareValue: number | null): string | null {
	if (value === null || compareValue === null) return null;
	const delta = value - compareValue;
	if (Math.abs(delta) < 1) return 'etwa im';
	return delta > 0 ? 'über dem' : 'unter dem';
}

export interface RenderedFaq {
	readonly question: string;
	readonly answer: string;
}

/**
 * Liefert den Aggregat-Wert für einen Dot-Pfad oder `null`.
 * Pfad-Form: `cluster.feld`, z.B. `laerm.dominantCategory`.
 *
 * Akzeptiert Pfade die exakt auf einen `AggregateValue<T>`-Eintrag zeigen.
 * Kürzere Pfade (`laerm`) liefern den Cluster, werden aber als „nicht vorhanden"
 * behandelt da Templates konkrete Feld-Werte brauchen.
 */
export function resolveAggregatePath(
	aggregate: TemplateAggregate,
	path: string
): AggregateValue<unknown> | null {
	const [cluster, field] = path.split('.');
	if (!cluster || !field) return null;
	const clusterData = (aggregate as unknown as Record<string, Record<string, unknown>>)[cluster];
	if (!clusterData) return null;
	const fieldValue = clusterData[field];
	if (!fieldValue) return null;
	// Plausibility-Check: AggregateValue hat `value` + `layer` + `sourceUpdatedAt`.
	if (
		typeof fieldValue === 'object' &&
		fieldValue !== null &&
		'value' in (fieldValue as object) &&
		'layer' in (fieldValue as object)
	) {
		return fieldValue as AggregateValue<unknown>;
	}
	return null;
}

/**
 * Formatiert das `sourceUpdatedAt`-ISO-Datum als deutsches „Monat YYYY".
 * Beispiel: `2023-06-01` → „Juni 2023".
 */
export function formatSourceStand(iso: string): string {
	const date = new Date(iso);
	if (isNaN(date.getTime())) return iso;
	return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
}

/**
 * Sammelt alle Slot-Substitutionen für ein Template. Pure Function — alle
 * Slots werden deterministisch aus dem Context abgeleitet.
 *
 * Slot-Namen (DE-Phase-1):
 * - `{name}`, `{slug}`
 * - Lärm: `{laermKategorie}`, `{laermErklaerung}`, `{laermSource}`, `{laermStand}`
 * - Grün: `{gruenKategorie}`, `{gruenErklaerung}`, `{gruenanlagenCount}`,
 *   `{spielplaetzeCount}`, `{gruenSource}`, `{gruenStand}`
 * - ÖPNV: `{oepnvStopsPerKm2}`, `{oepnvDichte}`, `{oepnvErklaerung}`,
 *   `{oepnvSource}`, `{oepnvStand}`
 * - Wohnen: `{wohnenWohnlage}`, `{wohnenMssBeschreibung}`, `{wohnenSource}`,
 *   `{wohnenStand}`
 * - Klima: `{klimaPet}`, `{klimaKategorie}`, `{klimaErklaerung}`,
 *   `{klimaSource}`, `{klimaStand}`
 */
function buildSlotMap(ctx: TemplateContext): Record<string, string> {
	const slots: Record<string, string> = {
		name: ctx.name,
		slug: ctx.slug
	};

	const laerm = ctx.aggregate.laerm.dominantCategory;
	if (laerm) {
		const raw = typeof laerm.value === 'string' ? laerm.value : null;
		slots.laermKategorie = describeLaermCategoryDe(raw);
		slots.laermErklaerung = laermErklaerungDe(raw);
		slots.laermSource = sourceLabel(laerm.layer);
		slots.laermStand = formatSourceStand(laerm.sourceUpdatedAt);
	}

	const gruen = ctx.aggregate.gruen;
	if (gruen.dominantVersorgung) {
		const raw =
			typeof gruen.dominantVersorgung.value === 'string' ? gruen.dominantVersorgung.value : null;
		slots.gruenKategorie = describeGruenversorgungDe(raw);
		slots.gruenErklaerung = gruenErklaerungDe(raw);
		slots.gruenSource = sourceLabel(gruen.dominantVersorgung.layer);
		slots.gruenStand = formatSourceStand(gruen.dominantVersorgung.sourceUpdatedAt);
	}
	if (gruen.gruenanlagenCount && typeof gruen.gruenanlagenCount.value === 'number') {
		slots.gruenanlagenCount = gruen.gruenanlagenCount.value.toLocaleString('de-DE');
	}
	if (gruen.spielplaetzeCount && typeof gruen.spielplaetzeCount.value === 'number') {
		slots.spielplaetzeCount = gruen.spielplaetzeCount.value.toLocaleString('de-DE');
	}

	const oepnv = ctx.aggregate.oepnv.stopsPerKm2;
	if (oepnv && typeof oepnv.value === 'number') {
		slots.oepnvStopsPerKm2 = formatStopsPerKm2(oepnv.value);
		slots.oepnvDichte = describeOepnvDichte(oepnv.value);
		slots.oepnvErklaerung = oepnvErklaerungDe(oepnv.value);
		slots.oepnvSource = sourceLabel(oepnv.layer);
		slots.oepnvStand = formatSourceStand(oepnv.sourceUpdatedAt);
	}

	const wohnen = ctx.aggregate.wohnen;
	if (wohnen.dominantWohnlage) {
		const raw =
			typeof wohnen.dominantWohnlage.value === 'string' ? wohnen.dominantWohnlage.value : null;
		slots.wohnenWohnlage = describeWohnlageDe(raw);
		slots.wohnenSource = sourceLabel(wohnen.dominantWohnlage.layer);
		slots.wohnenStand = formatSourceStand(wohnen.dominantWohnlage.sourceUpdatedAt);
	}
	if (wohnen.dominantMss) {
		const raw = typeof wohnen.dominantMss.value === 'string' ? wohnen.dominantMss.value : null;
		slots.wohnenMssBeschreibung = mssBeschreibungDe(raw);
	}

	const klima = ctx.aggregate.klima.meanPet;
	if (klima && typeof klima.value === 'number') {
		slots.klimaPet = formatPet(klima.value);
		slots.klimaKategorie = describePetKategorie(klima.value);
		slots.klimaErklaerung = petErklaerungDe(klima.value);
		slots.klimaSource = sourceLabel(klima.layer);
		slots.klimaStand = formatSourceStand(klima.sourceUpdatedAt);
	}

	// Story 11.3: Rang + Vergleich je Score-Dimension. Slots `<dim>Score`,
	// `<dim>Rang`, `<dim>Vergleich` (z. B. `gruenHitzeRang`).
	if (ctx.metrics) {
		for (const [key, m] of ctx.metrics) {
			if (m.value !== null) slots[`${key}Score`] = Math.round(m.value).toString();
			slots[`${key}Rang`] = formatRank(m.rang, m.quartil, m.total);
			const dir = compareDirection(m.value, m.compareValue);
			if (dir) slots[`${key}Vergleich`] = `${dir} ${m.compareLabel}`;
		}
	}

	return slots;
}

/**
 * Substituiert `{slot}`-Platzhalter im Text. Unbekannte Slots werden NICHT
 * ersetzt (graceful, statt zu werfen).
 */
function substitute(text: string, slots: Record<string, string>): string {
	return text.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, key: string) => {
		const value = slots[key];
		return value !== undefined ? value : match;
	});
}

export function renderTemplate(
	template: FaqTemplate,
	context: TemplateContext
): RenderedFaq | null {
	if (!template.applicableTo.includes(context.pageType)) return null;
	// requires-Check: jeder Pfad muss einen Aggregat-Wert liefern.
	for (const path of template.requires) {
		const resolved = resolveAggregatePath(context.aggregate, path);
		if (!resolved) return null;
	}
	const slots = buildSlotMap(context);
	return {
		question: substitute(template.question, slots),
		answer: substitute(template.answer, slots)
	};
}
