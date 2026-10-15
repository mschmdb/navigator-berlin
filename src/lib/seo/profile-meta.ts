import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime';
import { firstFitting, PAGE_TITLE_MAX } from './page-title.js';
import { formatCount, formatDate, formatDecimal } from '$lib/i18n/format.js';

const BRAND = 'navigator.berlin';
export const DESCRIPTION_MAX = 160;

export interface ProfileMetaInput {
	readonly name: string;
	readonly einwohner: number;
	readonly flaecheHa: number;
	/** ISO-Datum des Einwohner-Stichtags, `null` wenn unbekannt. */
	readonly stichtag: string | null;
	readonly score: number | null;
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number;
	readonly locale: Locale;
}

export interface KiezMetaInput extends ProfileMetaInput {
	readonly bezirk: string;
}

export interface ProfileMeta {
	readonly title: string;
	readonly description: string;
}

/** „Stand Ende 2024" bei 31.12., sonst „Stand <Datum>". */
export function formatStichtag(iso: string | null, locale: Locale): string | null {
	if (!iso) return null;
	const opts = { locale };
	if (/^\d{4}-12-31$/.test(iso)) {
		return m.meta_stand_end_of_year({ year: iso.slice(0, 4) }, opts);
	}
	return m.meta_stand_date({ date: formatDate(iso, opts) }, opts);
}

export function formatKm2(flaecheHa: number, locale: Locale): string {
	return formatDecimal(flaecheHa / 100, {
		locale,
		maximumFractionDigits: 1,
		minimumFractionDigits: 1
	});
}

function titleFacts(input: ProfileMetaInput, withFlaeche: boolean): string[] {
	const opts = { locale: input.locale };
	const facts: string[] = [];
	if (input.einwohner > 0) {
		facts.push(m.profile_lead_einwohner({ count: formatCount(input.einwohner, opts) }, opts));
	}
	if (withFlaeche && input.flaecheHa > 0)
		facts.push(`${formatKm2(input.flaecheHa, input.locale)} km²`);
	return facts;
}

function composeTitle(head: string, facts: readonly string[], brand: boolean): string {
	const body = facts.length > 0 ? `${head}: ${facts.join(', ')}` : head;
	return brand ? `${body} | ${BRAND}` : body;
}

function descriptionFactSentence(input: ProfileMetaInput): string | null {
	const opts = { locale: input.locale };
	const hasEinwohner = input.einwohner > 0;
	const hasFlaeche = input.flaecheHa > 0;
	if (!hasEinwohner && !hasFlaeche) return null;
	const einwohner = formatCount(input.einwohner, opts);
	const km2 = formatKm2(input.flaecheHa, input.locale);
	const stichtag = formatStichtag(input.stichtag, input.locale);
	const stand = stichtag ? ` (${stichtag})` : '';
	if (hasEinwohner && hasFlaeche) {
		return m.meta_desc_facts_both({ name: input.name, einwohner, km2, stand }, opts);
	}
	if (hasEinwohner)
		return m.meta_desc_facts_einwohner({ name: input.name, einwohner, stand }, opts);
	return m.meta_desc_facts_flaeche({ name: input.name, km2 }, opts);
}

function descriptionScoreSentence(input: ProfileMetaInput, label: string): string | null {
	if (input.score === null) return null;
	const opts = { locale: input.locale };
	const score = String(Math.round(input.score));
	// Ohne Quartil fehlt die Grundlage für die Anti-Stigma-Regel (ADR-015): Rang weglassen.
	if (input.rang === null || input.quartil === null || input.total <= 0) {
		return m.meta_desc_score_no_rank({ label, score }, opts);
	}
	const rank =
		input.quartil === 4
			? m.rank_format_bottom_quartile(undefined, opts)
			: m.meta_rank_placed({ rang: input.rang, total: input.total }, opts);
	return m.meta_desc_score({ label, score, rank }, opts);
}

/** Sätze in Prioritätsreihenfolge; ein Satz, der die Grenze sprengt, entfällt samt Rest. */
export function composeDescription(sentences: readonly (string | null)[]): string {
	const present = sentences.filter((s): s is string => s !== null);
	let result = present[0] ?? '';
	for (const sentence of present.slice(1)) {
		const next = `${result} ${sentence}`;
		if (next.length > DESCRIPTION_MAX) break;
		result = next;
	}
	return result;
}

export function buildBezirkMeta(input: ProfileMetaInput): ProfileMeta {
	const opts = { locale: input.locale };
	const allFacts = titleFacts(input, true);
	const einwohnerOnly = titleFacts(input, false);
	// Weglassreihenfolge bei Überlänge: Marke, Fläche, Einwohner. Der Name bleibt immer vollständig.
	const candidates: string[] = [];
	for (const facts of [allFacts, einwohnerOnly, []]) {
		candidates.push(composeTitle(input.name, facts, true), composeTitle(input.name, facts, false));
	}
	const title = firstFitting(candidates, PAGE_TITLE_MAX);
	const description = composeDescription([
		descriptionFactSentence(input),
		descriptionScoreSentence(input, m.meta_score_label_bezirk(undefined, opts)),
		m.meta_desc_cta_bezirk(undefined, opts)
	]);
	return { title, description };
}

export function buildKiezMeta(input: KiezMetaInput): ProfileMeta {
	const opts = { locale: input.locale };
	const label = m.meta_score_label_kiez(undefined, opts);
	const baseFacts = titleFacts(input, false);
	const scoreFact =
		input.score === null
			? null
			: m.meta_title_score({ label, score: String(Math.round(input.score)) }, opts);
	const withBezirk = input.bezirk.length > 0 ? `${input.name} (${input.bezirk})` : input.name;

	// Weglassreihenfolge bei Überlänge: Marke, Score, Einwohner, Bezirk. Name und Bezirk
	// sind die wichtigsten Suchbegriffe, deshalb fallen zuerst die Fakten, dann der Bezirk.
	const heads = withBezirk === input.name ? [input.name] : [withBezirk, input.name];
	const withScore = scoreFact === null ? [] : [[...baseFacts, scoreFact]];
	const factSets = [...withScore, baseFacts, []];
	const candidates: string[] = [];
	for (const head of heads) {
		for (const facts of factSets) {
			candidates.push(composeTitle(head, facts, true), composeTitle(head, facts, false));
		}
	}
	const title = firstFitting(candidates, PAGE_TITLE_MAX);

	const description = composeDescription([
		descriptionFactSentence(input),
		descriptionScoreSentence(input, label),
		m.meta_desc_cta_kiez(undefined, opts)
	]);
	return { title, description };
}
