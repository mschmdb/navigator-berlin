import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime';
import type { Bundle, LayerMetadata } from '$lib/data/types.js';
import { composeDescription, DESCRIPTION_MAX } from './profile-meta.js';
import { buildPageTitle } from './page-title.js';

export type LayerBenefit = 'address-kiez' | 'address' | 'map';

export interface LayerMetaInput {
	readonly layerName: string;
	/** Kurztext der Layer-Erklärung; leer oder fehlend: der Layer-Name übernimmt. */
	readonly lead?: string;
	readonly bundle: Bundle;
	readonly authority?: string;
	/** ISO-Zeitpunkt des Datenstands (`sourceUpdatedAt`), nicht das Abrufdatum. */
	readonly sourceUpdatedAt?: string;
	readonly benefit: LayerBenefit;
	readonly locale: Locale;
}

export interface LayerMeta {
	readonly title: string;
	readonly description: string;
}

const OWN_DOMAIN = /navigator\.berlin/i;
const SENTENCE_END = /[.!?…]$/;
const ELLIPSIS = '…';

/** Lokalisiertes Themenlabel ohne Buchstaben-Präfix. */
export function themeLabel(bundle: Bundle, locale: Locale): string {
	const opts = { locale };
	switch (bundle) {
		case 'A: Boundaries':
			return m.layer_meta_theme_a(undefined, opts);
		case 'B: Wohn-Daten':
			return m.layer_meta_theme_b(undefined, opts);
		case 'C: Umwelt':
			return m.layer_meta_theme_c(undefined, opts);
		case 'D: Memorial':
			return m.layer_meta_theme_d(undefined, opts);
		case 'E: Soziale Infrastruktur':
			return m.layer_meta_theme_e(undefined, opts);
		case 'F: Mobilität':
			return m.layer_meta_theme_f(undefined, opts);
		case 'G: Kiez-Score':
			return m.layer_meta_theme_g(undefined, opts);
		case 'H: Wahldaten':
			return m.layer_meta_theme_h(undefined, opts);
		case 'I: Demografie':
			return m.layer_meta_theme_i(undefined, opts);
		case 'J: Kultur':
			return m.layer_meta_theme_j(undefined, opts);
	}
}

/**
 * Der Inspector wertet nur Flächen-Layer je Adresse aus (ohne Grenz-Gruppe A).
 * „und Kiez" gilt nur, wenn für den Layer Kiez-Aggregate existieren
 * (`static/layer-aggregates`). Alle anderen Layer erhalten die neutrale Variante.
 */
export function layerBenefit(
	meta: Pick<LayerMetadata, 'geometryType' | 'inspectorRelevant' | 'bundleGroup'>,
	hasKiezAggregate: boolean
): LayerBenefit {
	const isArea = meta.geometryType === 'Polygon' || meta.geometryType === 'MultiPolygon';
	if (!isArea || meta.inspectorRelevant === false || meta.bundleGroup === 'A: Boundaries') {
		return 'map';
	}
	return hasKiezAggregate ? 'address-kiez' : 'address';
}

function benefitSentence(input: LayerMetaInput): string {
	const opts = { locale: input.locale };
	if (input.benefit === 'address-kiez') return m.layer_meta_desc_benefit_address(undefined, opts);
	if (input.benefit === 'address') return m.layer_meta_desc_benefit_address_only(undefined, opts);
	return m.layer_meta_desc_benefit_map(undefined, opts);
}

function cutAtWord(text: string, max: number): string {
	if (text.length <= max) return text;
	const room = max - ELLIPSIS.length;
	const head = text.slice(0, room + 1);
	const space = head.lastIndexOf(' ');
	const cut = space > 0 ? head.slice(0, space) : text.slice(0, room);
	return `${cut.replace(/[\s,;:.]+$/, '')}${ELLIPSIS}`;
}

function leadSentence(input: LayerMetaInput, benefit: string): string {
	const text = (input.lead?.trim() || input.layerName).trim();
	const sentence = SENTENCE_END.test(text) ? text : `${text}.`;
	const room = DESCRIPTION_MAX - benefit.length - 1;
	return cutAtWord(sentence, room);
}

/** Jahr des Datenstands in der Zeitzone Berlin, `null` bei ungültigem Datum. */
function yearInBerlin(iso: string | undefined): string | null {
	if (!iso) return null;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return null;
	return new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone: 'Europe/Berlin' }).format(
		date
	);
}

function usableAuthority(authority: string | undefined): string | null {
	const trimmed = authority?.trim();
	if (!trimmed || OWN_DOMAIN.test(trimmed)) return null;
	return trimmed;
}

function originSentences(input: LayerMetaInput, lead: string): string[] {
	const opts = { locale: input.locale };
	const theme = themeLabel(input.bundle, input.locale);
	const year = yearInBerlin(input.sourceUpdatedAt);
	const yearInLead = year !== null && new RegExp(`\\b${year}\\b`).test(lead);
	const stand = year && !yearInLead ? m.layer_meta_desc_stand({ year }, opts) : '';
	const authority = usableAuthority(input.authority);
	const variants: string[] = [];
	if (authority) {
		variants.push(m.layer_meta_desc_origin_authority({ theme, authority, stand }, opts));
		if (stand) {
			variants.push(m.layer_meta_desc_origin_authority({ theme, authority, stand: '' }, opts));
		}
	}
	variants.push(m.layer_meta_desc_origin_plain({ theme, stand }, opts));
	if (stand) variants.push(m.layer_meta_desc_origin_plain({ theme, stand: '' }, opts));
	return variants;
}

function buildDescription(input: LayerMetaInput): string {
	const benefit = benefitSentence(input);
	const lead = leadSentence(input, benefit);
	const candidates = originSentences(input, lead).map((origin) =>
		composeDescription([lead, origin, benefit])
	);
	candidates.push(composeDescription([lead, benefit]));
	// Erste Variante, die den Nutzensatz noch behält.
	return candidates.find((c) => c.endsWith(benefit)) ?? candidates[candidates.length - 1];
}

export function buildLayerMeta(input: LayerMetaInput): LayerMeta {
	return { title: buildPageTitle(input.layerName), description: buildDescription(input) };
}
