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
import { describeLaermCategoryDe } from '$lib/data/faq-helpers/laerm.js';
import { formatStopsPerKm2 } from '$lib/data/faq-helpers/oepnv.js';
import { describeWohnlageDe, mssBeschreibungDe } from '$lib/data/faq-helpers/wohnen.js';
import { sourceLabel } from '$lib/data/source-label.js';
import {
	REGION_WORDS,
	klimaSatz,
	oepnvModiSatz,
	oepnvUrteil,
	rangLage,
	vergleich,
	type CompareKind,
	type Region
} from './fact-phrases.js';
import { gruenSatz, laermSatz } from './share-phrases.js';

export type { CompareKind } from './fact-phrases.js';

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
export interface MetricContext {
	readonly value: number | null;
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number;
	readonly compareValue: number | null;
	readonly compareKind: CompareKind;
	/** Wie viele andere Gebiete denselben Wettkampf-Rang haben (NAV-108). */
	readonly geteiltMit?: number;
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

const NUMBER_LOCALE: Record<TemplateLocale, string> = { de: 'de-DE', en: 'en-GB' };

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

export const SCORE_DIMS = [
	'ruheLuft',
	'gruenHitze',
	'mobilitaet',
	'versorgung',
	'wohnschutz'
] as const;

/**
 * Sammelt alle Slot-Substitutionen für ein Template. Pure Function: alle
 * Slots folgen deterministisch aus dem Context.
 *
 * Slots (NAV-108, menschliche Fassung):
 * - Ort: `{name}`, `{ortDer}`/`{OrtDer}` („der Kiez“), `{ortIm}`/`{OrtIm}` („im Kiez“)
 * - Lärm: `{laermSatz}` (Urteil + Verteilung), `{laermKategorie}`, `{laermSource}`, `{laermStand}`
 * - Grün: `{gruenSatz}` (Senats-Urteil + Verteilung), `{gruenanlagenCount}`,
 *   `{gruenSource}`, `{gruenStand}`
 * - ÖPNV: `{oepnvUrteil}`, `{oepnvStopsPerKm2}`, `{oepnvModi}`, `{oepnvSource}`, `{oepnvStand}`
 * - Wohnen: `{wohnenWohnlage}`, `{wohnenMssBeschreibung}`, `{wohnenSource}`, `{wohnenStand}`
 * - Klima: `{klimaSatz}`, `{klimaSource}`, `{klimaStand}`
 * - Scores: `{<dim>Score}`, `{<dim>Lage}` („Platz 55 von 143 Kiezen“), `{<dim>Vergleich}`,
 *   `{<dim>Aktiv}` (leer; markiert Erklärsätze, die nur mit Score Sinn ergeben)
 */
function buildSlotMap(ctx: TemplateContext): Record<string, string> {
	const locale = ctx.locale;
	const opts = { locale };
	const region: Region = ctx.pageType === 'bezirk' ? 'bezirk' : 'kiez';
	const words = REGION_WORDS[locale][region];
	const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
	const stand = (iso: string) => formatSourceStand(iso, locale);
	const slots: Record<string, string> = {
		name: ctx.name,
		slug: ctx.slug,
		ortDer: words.der,
		OrtDer: cap(words.der),
		ortIm: words.im,
		OrtIm: cap(words.im)
	};

	const laerm = ctx.aggregate.laerm;
	if (laerm.dominantCategory) {
		const raw =
			typeof laerm.dominantCategory.value === 'string' ? laerm.dominantCategory.value : null;
		slots.laermKategorie = describeLaermCategoryDe(raw, opts);
		slots.laermSource = sourceLabel(laerm.dominantCategory.layer, opts);
		slots.laermStand = stand(laerm.dominantCategory.sourceUpdatedAt);
	}
	const laermDist = laerm.categoryDistribution?.value;
	if (laermDist && Object.keys(laermDist).length > 0) {
		slots.laermSatz = laermSatz(laermDist, region, locale);
	}

	const gruen = ctx.aggregate.gruen;
	const versorgung = gruen.versorgungDistribution;
	if (versorgung && Object.keys(versorgung.value).length > 0) {
		slots.gruenSatz = gruenSatz(versorgung.value, region, locale);
		slots.gruenSource = sourceLabel(versorgung.layer, opts);
		slots.gruenStand = stand(versorgung.sourceUpdatedAt);
	}
	if (gruen.gruenanlagenCount && typeof gruen.gruenanlagenCount.value === 'number') {
		slots.gruenanlagenCount = gruen.gruenanlagenCount.value.toLocaleString(NUMBER_LOCALE[locale]);
		slots.gruenanlagenSource = sourceLabel(gruen.gruenanlagenCount.layer, opts);
		slots.gruenanlagenStand = stand(gruen.gruenanlagenCount.sourceUpdatedAt);
	}

	const oepnv = ctx.aggregate.oepnv;
	if (oepnv.stopsPerKm2 && typeof oepnv.stopsPerKm2.value === 'number') {
		slots.oepnvStopsPerKm2 = formatStopsPerKm2(oepnv.stopsPerKm2.value, opts);
		slots.oepnvUrteil = oepnvUrteil(oepnv.stopsPerKm2.value, locale);
		slots.oepnvSource = sourceLabel(oepnv.stopsPerKm2.layer, opts);
		slots.oepnvStand = stand(oepnv.stopsPerKm2.sourceUpdatedAt);
	}
	// NAV-108: Verkehrsmittel nur aus den Zähldaten, nie aus festen Sätzen.
	const count = (entry: AggregateValue<number> | null | undefined) =>
		entry && typeof entry.value === 'number' ? entry.value : null;
	slots.oepnvModi = oepnvModiSatz(
		{
			uBahnCount: count(oepnv.uBahnCount),
			sBahnCount: count(oepnv.sBahnCount),
			tramCount: count(oepnv.tramCount),
			busCount: count(oepnv.busCount)
		},
		region,
		locale
	);

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
		slots.wohnenMssSource = sourceLabel(wohnen.dominantMss.layer, opts);
		slots.wohnenMssStand = stand(wohnen.dominantMss.sourceUpdatedAt);
	}

	const pet = ctx.aggregate.klima.meanPet;
	if (pet && typeof pet.value === 'number') {
		slots.klimaSatz = klimaSatz(pet.value, locale);
		slots.klimaSource = sourceLabel(pet.layer, opts);
		slots.klimaStand = stand(pet.sourceUpdatedAt);
	}

	// Scores: ein Satz nur, wenn Punkte und Rang vorliegen; sonst fällt alles zur Dimension weg.
	for (const [key, m] of ctx.metrics ?? []) {
		const lage = rangLage(m, region, locale);
		if (m.value === null || lage === null) continue;
		slots[`${key}Score`] = Math.round(m.value).toString();
		slots[`${key}Lage`] = lage;
		// Leerer Marker: Erklärsätze zum Score tragen ihn und fallen ohne Score mit weg.
		slots[`${key}Aktiv`] = '';
		const v = vergleich(m.value, m.compareValue, m.compareKind, locale);
		if (v) slots[`${key}Vergleich`] = v;
	}

	return slots;
}

/**
 * Substituiert `{slot}`-Platzhalter im Text. Unbekannte Slots bleiben stehen;
 * die Faktenprüfung meldet sie.
 */
function substitute(text: string, slots: Record<string, string>): string {
	return text.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, key: string) => {
		const value = slots[key];
		return value !== undefined ? value : match;
	});
}

const SCORE_SLOT = new RegExp(
	`\\{((?:${SCORE_DIMS.join('|')})(?:Score|Lage|Vergleich|Aktiv))\\}`,
	'g'
);

/** Slots, die selbst ganze Sätze sind, beenden einen Satz wie ein Punkt. */
const SENTENCE_SLOTS = [
	'laermSatz',
	'gruenSatz',
	'oepnvUrteil',
	'oepnvModi',
	'klimaSatz',
	'wohnenMssBeschreibung'
];
const SENTENCE_BREAK = new RegExp(`(?<=\\.)\\s+|(?<=\\{(?:${SENTENCE_SLOTS.join('|')})\\})\\s+`);

/**
 * #100: Score-Sätze sind ein Zusatz zur Datenantwort. Fehlt ein Score-Slot,
 * fällt der Satz weg, nicht die Antwort. Läuft vor der Substitution, damit
 * Punkte in Namen („St. …“) die Satztrennung nicht stören.
 */
function pruneMissingScoreParts(text: string, slots: Record<string, string>): string {
	return text
		.split(SENTENCE_BREAK)
		.filter((sentence) =>
			[...sentence.matchAll(SCORE_SLOT)].every((m) => slots[m[1]] !== undefined)
		)
		.join(' ');
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
	// requiresScore: Antworten, die nur aus einem Score bestehen, brauchen ihn.
	for (const dim of template.requiresScore ?? []) {
		if (slots[`${dim}Score`] === undefined) return null;
	}
	return {
		question: substitute(template.question, slots),
		// Leere Slots (z. B. `{oepnvModi}` ohne Zähldaten) hinterlassen keine Doppel-Leerzeichen.
		answer: substitute(pruneMissingScoreParts(template.answer, slots), slots)
			.replace(/\s{2,}/g, ' ')
			.trim()
	};
}
