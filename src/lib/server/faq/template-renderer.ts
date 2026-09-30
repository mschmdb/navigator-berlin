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
 * `compareKind` benennt den Vergleichswert, das Label folgt der Template-Locale.
 * Optional, da Layer-Seiten kein Rang.
 */
export type CompareKind = 'bezirk' | 'berlin';

export interface MetricContext {
	readonly value: number | null;
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number;
	readonly compareValue: number | null;
	readonly compareKind: CompareKind;
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
const COMPARE_PHRASES: Record<
	TemplateLocale,
	{
		readonly same: string;
		readonly above: string;
		readonly below: string;
		readonly label: Record<CompareKind, string>;
	}
> = {
	de: {
		same: 'etwa im',
		above: 'über dem',
		below: 'unter dem',
		label: { bezirk: 'Bezirksschnitt', berlin: 'Berlin-Median' }
	},
	en: {
		same: 'about the same as',
		above: 'above',
		below: 'below',
		label: { bezirk: 'the district average', berlin: 'the Berlin median' }
	}
};

const NUMBER_LOCALE: Record<TemplateLocale, string> = { de: 'de-DE', en: 'en-GB' };

/** Der Rang steht mitten im Satz: EN-Label „Rank 12 of 143“ wird zu „rank 12 of 143“. */
function rankInSentence(label: string, locale: TemplateLocale): string {
	return locale === 'en' ? label.replace(/^Rank /, 'rank ') : label;
}

function compareSentence(
	value: number | null,
	compareValue: number | null,
	kind: CompareKind,
	locale: TemplateLocale
): string | null {
	if (value === null || compareValue === null) return null;
	const phrases = COMPARE_PHRASES[locale];
	const delta = value - compareValue;
	const direction = Math.abs(delta) < 1 ? phrases.same : delta > 0 ? phrases.above : phrases.below;
	const label = phrases.label[kind];
	return `${direction} ${label}`;
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
 * Formatiert das `sourceUpdatedAt`-ISO-Datum locale-abhängig als „Monat YYYY".
 * Beispiel: `2023-06-01` → „Juni 2023" (de) / „June 2023" (en).
 */
export function formatSourceStand(iso: string, locale: TemplateLocale = 'de'): string {
	const date = new Date(iso);
	if (isNaN(date.getTime())) return iso;
	return date.toLocaleDateString(NUMBER_LOCALE[locale], { month: 'long', year: 'numeric' });
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
	const locale = ctx.locale;
	const opts = { locale };
	const stand = (iso: string) => formatSourceStand(iso, locale);
	const slots: Record<string, string> = {
		name: ctx.name,
		slug: ctx.slug
	};

	const laerm = ctx.aggregate.laerm.dominantCategory;
	if (laerm) {
		const raw = typeof laerm.value === 'string' ? laerm.value : null;
		slots.laermKategorie = describeLaermCategoryDe(raw, opts);
		slots.laermErklaerung = laermErklaerungDe(raw, opts);
		slots.laermSource = sourceLabel(laerm.layer, opts);
		slots.laermStand = stand(laerm.sourceUpdatedAt);
	}

	const gruen = ctx.aggregate.gruen;
	if (gruen.dominantVersorgung) {
		const raw =
			typeof gruen.dominantVersorgung.value === 'string' ? gruen.dominantVersorgung.value : null;
		slots.gruenKategorie = describeGruenversorgungDe(raw, opts);
		slots.gruenErklaerung = gruenErklaerungDe(raw, opts);
		slots.gruenSource = sourceLabel(gruen.dominantVersorgung.layer, opts);
		slots.gruenStand = stand(gruen.dominantVersorgung.sourceUpdatedAt);
	}
	if (gruen.gruenanlagenCount && typeof gruen.gruenanlagenCount.value === 'number') {
		slots.gruenanlagenCount = gruen.gruenanlagenCount.value.toLocaleString(NUMBER_LOCALE[locale]);
	}
	if (gruen.spielplaetzeCount && typeof gruen.spielplaetzeCount.value === 'number') {
		slots.spielplaetzeCount = gruen.spielplaetzeCount.value.toLocaleString(NUMBER_LOCALE[locale]);
	}

	const oepnv = ctx.aggregate.oepnv.stopsPerKm2;
	if (oepnv && typeof oepnv.value === 'number') {
		slots.oepnvStopsPerKm2 = formatStopsPerKm2(oepnv.value, opts);
		slots.oepnvDichte = describeOepnvDichte(oepnv.value, opts);
		slots.oepnvErklaerung = oepnvErklaerungDe(oepnv.value, opts);
		slots.oepnvSource = sourceLabel(oepnv.layer, opts);
		slots.oepnvStand = stand(oepnv.sourceUpdatedAt);
	}

	const wohnen = ctx.aggregate.wohnen;
	if (wohnen.dominantWohnlage) {
		const raw =
			typeof wohnen.dominantWohnlage.value === 'string' ? wohnen.dominantWohnlage.value : null;
		slots.wohnenWohnlage = describeWohnlageDe(raw, opts);
		slots.wohnenSource = sourceLabel(wohnen.dominantWohnlage.layer, opts);
		slots.wohnenStand = stand(wohnen.dominantWohnlage.sourceUpdatedAt);
	}
	if (wohnen.dominantMss) {
		const raw = typeof wohnen.dominantMss.value === 'string' ? wohnen.dominantMss.value : null;
		slots.wohnenMssBeschreibung = mssBeschreibungDe(raw, opts);
	}

	const klima = ctx.aggregate.klima.meanPet;
	if (klima && typeof klima.value === 'number') {
		slots.klimaPet = formatPet(klima.value, opts);
		slots.klimaKategorie = describePetKategorie(klima.value, opts);
		slots.klimaErklaerung = petErklaerungDe(klima.value, opts);
		slots.klimaSource = sourceLabel(klima.layer, opts);
		slots.klimaStand = stand(klima.sourceUpdatedAt);
	}

	// Story 11.3: Rang + Vergleich je Score-Dimension. Slots `<dim>Score`,
	// `<dim>Rang`, `<dim>Vergleich` (z. B. `gruenHitzeRang`).
	if (ctx.metrics) {
		for (const [key, m] of ctx.metrics) {
			if (m.value !== null) slots[`${key}Score`] = Math.round(m.value).toString();
			slots[`${key}Rang`] = rankInSentence(formatRank(m.rang, m.quartil, m.total, opts), locale);
			const vergleich = compareSentence(m.value, m.compareValue, m.compareKind, locale);
			if (vergleich) slots[`${key}Vergleich`] = vergleich;
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
