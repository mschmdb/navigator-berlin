import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime';
import { formatPercent } from '$lib/i18n/format.js';
import {
	wahlReiheLabel,
	wahlStimmtypLabel,
	wahlWiederholungLabel,
	type WahlStimmtyp,
	type WahlTyp
} from '$lib/data/wahl-labels.js';
import { composeDescription } from './profile-meta.js';
import { BRAND, firstFitting, PAGE_TITLE_MAX } from './page-title.js';

export interface WahlMetaInput {
	readonly typ: WahlTyp;
	readonly jahr: number;
	readonly stimmtyp: WahlStimmtyp;
	readonly isRepeatElection: boolean;
	/** Die Detailseite zeigt eine Stimmbezirkskarte (`geoSlug` gesetzt). */
	readonly hasStimmbezirke: boolean;
	/** Vorläufiges Ergebnis: der Partei-Satz trägt den Zusatz. */
	readonly vorlaeufig: boolean;
	/** Stärkste Partei in Berlin, `null` wenn die Seitendaten fehlen. */
	readonly topParty: { readonly kurzname: string; readonly anteil: number } | null;
	readonly locale: Locale;
}

export interface WahlMeta {
	readonly title: string;
	readonly description: string;
}

const NOT_A_PARTY = 'Sonstige';

/**
 * Wiederholungswahlen in der DB (AGH, BVV 2023) deckten ganz Berlin ab. Die
 * Bundestags-Wiederholung 2024 betraf nur einen Teil der Wahlbezirke; die DB
 * hat dafür kein Abdeckungsfeld. Dort entfällt der Berlin-Partei-Satz.
 */
function coversAllOfBerlin(input: WahlMetaInput): boolean {
	return !(input.isRepeatElection && input.typ === 'btw');
}

function headParts(input: WahlMetaInput): string[] {
	const opts = { locale: input.locale };
	const parts = [`${wahlReiheLabel(input.typ, opts)} ${input.jahr}`];
	if (input.typ !== 'bvv') parts.push(wahlStimmtypLabel(input.stimmtyp, opts));
	return parts;
}

function descriptionLabel(input: WahlMetaInput): string {
	const parts = headParts(input);
	if (input.isRepeatElection) parts.push(wahlWiederholungLabel({ locale: input.locale }));
	return parts.join(', ');
}

function buildTitle(input: WahlMetaInput): string {
	const head = headParts(input).join(' · ');
	const full = input.isRepeatElection
		? `${head} · ${wahlWiederholungLabel({ locale: input.locale })}`
		: head;
	const withBrand = (core: string) => `${core} | ${BRAND}`;
	// Weglassreihenfolge bei Überlänge: Marke, dann Wiederholungshinweis.
	const candidates = [withBrand(full), full];
	if (full !== head) candidates.push(withBrand(head), head);
	return firstFitting(candidates, PAGE_TITLE_MAX);
}

function buildDescription(input: WahlMetaInput): string {
	const opts = { locale: input.locale };
	const label = descriptionLabel(input);
	const ebenen = input.hasStimmbezirke
		? m.wahl_meta_desc_ebenen_stimmbezirk({ label }, opts)
		: m.wahl_meta_desc_ebenen_bezirk({ label }, opts);
	const top = input.topParty;
	const topSentence =
		top && top.kurzname !== NOT_A_PARTY && coversAllOfBerlin(input)
			? (input.vorlaeufig ? m.wahl_meta_desc_top_party_vorlaeufig : m.wahl_meta_desc_top_party)(
					{ partei: top.kurzname, anteil: formatPercent(top.anteil, opts) },
					opts
				)
			: null;
	return composeDescription([ebenen, topSentence, m.wahl_meta_desc_tabellen(undefined, opts)]);
}

export function buildWahlMeta(input: WahlMetaInput): WahlMeta {
	return { title: buildTitle(input), description: buildDescription(input) };
}
