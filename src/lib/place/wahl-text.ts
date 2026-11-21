/**
 * Erzählsätze des Kapitels „Wahlen“: wer vorn lag, wie es am Vergleichsort aussah und was sich
 * seit der ersten Wahl der Reihe am stärksten verschoben hat. Die Fakten (`wahlFacts`) sind
 * sprachfrei, die Sätze (`wahlSentences`) kommen aus Vorlagen mit Artikel und Verbform.
 */
import { m } from '#lib/paraglide/messages.js';
import type { Locale } from '#lib/paraglide/runtime.js';
import { formatPercent } from '#lib/i18n/format.js';
import type { WahlArt, WahlPunkt } from './wahl-types';

/** Kleinere Verschiebungen erzählen wir nicht, sie liegen im Rauschen der Rundung. */
const MIN_SHIFT = 2;
const OTHERS = 'Sonstige';

export interface PartyName {
	readonly name: string;
	readonly pronoun: string;
	readonly plural: boolean;
}

type Article = 'f' | 'n' | 'pl';
const PARTIES: Readonly<Record<string, { de: string; en: string; article: Article }>> = {
	CDU: { de: 'CDU', en: 'the CDU', article: 'f' },
	SPD: { de: 'SPD', en: 'the SPD', article: 'f' },
	GRÜNE: { de: 'Grünen', en: 'the Greens', article: 'pl' },
	'Die Linke': { de: 'Linke', en: 'Die Linke', article: 'f' },
	AfD: { de: 'AfD', en: 'the AfD', article: 'f' },
	FDP: { de: 'FDP', en: 'the FDP', article: 'f' },
	BSW: { de: 'BSW', en: 'the BSW', article: 'n' },
	PIRATEN: { de: 'Piraten', en: 'the Pirate Party', article: 'pl' }
};

/** Parteiname mit Artikel und passendem Pronomen, etwa „die Grünen“ (Plural) oder „das BSW“. */
export function partyName(raw: string, locale: Locale): PartyName {
	const known = PARTIES[raw];
	if (!known) return { name: raw, pronoun: locale === 'en' ? 'it' : 'sie', plural: false };
	const plural = known.article === 'pl';
	if (locale === 'en') {
		// „the Pirate Party“ ist im Englischen Singular, „the Greens“ Plural.
		const enPlural = raw === 'GRÜNE';
		return { name: known.en, pronoun: enPlural ? 'they' : 'it', plural: enPlural };
	}
	const article = known.article === 'n' ? 'das' : 'die';
	return { name: `${article} ${known.de}`, pronoun: known.article === 'n' ? 'es' : 'sie', plural };
}

export interface Share {
	readonly partei: string;
	readonly anteil: number;
}

export interface WahlFacts {
	readonly jahr: number;
	readonly firstJahr: number;
	/** Stärkste Partei, bei Gleichstand (gerundet) alle gleichauf. */
	readonly leaders: readonly Share[];
	/** Am Vergleichsort im selben Jahr; leer ohne Daten. */
	readonly refLeaders: readonly Share[];
	/** Anteil der eigenen stärksten Partei am Vergleichsort. */
	readonly refShare: number | null;
	readonly gain: { partei: string; diff: number } | null;
	readonly loss: { partei: string; diff: number } | null;
}

function leadersOf(points: readonly WahlPunkt[], jahr: number): Share[] {
	const rows = points
		.filter((p) => p.jahr === jahr && p.partei !== OTHERS)
		.sort((a, b) => b.anteil - a.anteil);
	if (rows.length === 0) return [];
	const top = Math.round(rows[0].anteil);
	return rows
		.filter((r) => Math.round(r.anteil) === top)
		.map((r) => ({ partei: r.partei, anteil: r.anteil }));
}

export function wahlFacts(own: readonly WahlPunkt[], ref: readonly WahlPunkt[]): WahlFacts | null {
	const years = own.filter((p) => p.partei !== OTHERS).map((p) => p.jahr);
	if (years.length === 0) return null;
	const jahr = Math.max(...years);
	const firstJahr = Math.min(...years);
	const leaders = leadersOf(own, jahr);
	const refShare =
		leaders.length === 1
			? (ref.find((p) => p.jahr === jahr && p.partei === leaders[0].partei)?.anteil ?? null)
			: null;

	let gain: WahlFacts['gain'] = null;
	let loss: WahlFacts['loss'] = null;
	if (firstJahr < jahr) {
		for (const now of own.filter((p) => p.jahr === jahr && p.partei !== OTHERS)) {
			const then = own.find((p) => p.jahr === firstJahr && p.partei === now.partei);
			if (!then) continue;
			const diff = Math.round(now.anteil - then.anteil);
			if (diff >= MIN_SHIFT && diff > (gain?.diff ?? 0)) gain = { partei: now.partei, diff };
			if (diff <= -MIN_SHIFT && diff < (loss?.diff ?? 0)) loss = { partei: now.partei, diff };
		}
	}
	return { jahr, firstJahr, leaders, refLeaders: leadersOf(ref, jahr), refShare, gain, loss };
}

export interface WahlTextContext {
	readonly wahl: WahlArt;
	readonly name: string;
	readonly ref: string;
	readonly locale: Locale;
}

const WAHL_NAMES = {
	btw: m.place_wahl_name_btw,
	agh: m.place_wahl_name_agh,
	bvv: m.place_wahl_name_bvv
} as const;

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Zwei bis drei Sätze für den Einstieg ins Kapitel; leer ohne Daten. */
export function wahlSentences(facts: WahlFacts | null, ctx: WahlTextContext): string[] {
	if (!facts || facts.leaders.length === 0) return [];
	const o = { locale: ctx.locale };
	const pct = (v: number) => formatPercent(v / 100, { decimals: 0, locale: ctx.locale });
	const party = (raw: string) => partyName(raw, ctx.locale);
	const list = (shares: readonly Share[]) =>
		new Intl.ListFormat(ctx.locale, { type: 'conjunction' }).format(
			shares.map((s) => party(s.partei).name)
		);
	const wahl = WAHL_NAMES[ctx.wahl]({}, o);
	const out: string[] = [];

	const [lead] = facts.leaders;
	const own = party(lead.partei);
	if (facts.leaders.length > 1) {
		out.push(
			m.place_wahl_lead_tie(
				{
					wahl,
					jahr: facts.jahr,
					name: ctx.name,
					parteien: list(facts.leaders),
					pct: pct(lead.anteil)
				},
				o
			)
		);
	} else {
		const args = {
			wahl,
			jahr: facts.jahr,
			name: ctx.name,
			partei: own.name,
			pct: pct(lead.anteil)
		};
		out.push(own.plural ? m.place_wahl_lead_pl(args, o) : m.place_wahl_lead(args, o));
	}

	const refTop = facts.refLeaders[0];
	if (refTop) {
		const refTie = facts.refLeaders.length > 1;
		const refParty = party(refTop.partei);
		const refPct = pct(refTop.anteil);
		if (facts.refShare !== null && !refTie && refTop.partei === lead.partei) {
			const args = { ref: ctx.ref, pron: own.pronoun, pct: refPct };
			out.push(own.plural ? m.place_wahl_ref_same_pl(args, o) : m.place_wahl_ref_same(args, o));
		} else if (facts.refShare !== null) {
			const shareArgs = { ref: ctx.ref, pron: own.pronoun, pct: pct(facts.refShare) };
			const share = own.plural
				? m.place_wahl_ref_share_pl(shareArgs, o)
				: m.place_wahl_ref_share(shareArgs, o);
			const thenArgs = { partei: refParty.name, pct: refPct };
			const then = refTie
				? m.place_wahl_ref_then_tie({ parteien: list(facts.refLeaders), pct: refPct }, o)
				: refParty.plural
					? m.place_wahl_ref_then_leader_pl(thenArgs, o)
					: m.place_wahl_ref_then_leader(thenArgs, o);
			out.push(`${share}, ${then}.`);
		} else if (refTie) {
			out.push(
				m.place_wahl_ref_tie({ ref: ctx.ref, parteien: list(facts.refLeaders), pct: refPct }, o)
			);
		} else {
			const args = { ref: ctx.ref, partei: refParty.name, pct: refPct };
			out.push(
				refParty.plural ? m.place_wahl_ref_leader_pl(args, o) : m.place_wahl_ref_leader(args, o)
			);
		}
	}

	const { gain, loss } = facts;
	if (gain) {
		const g = party(gain.partei);
		const args = { jahr: facts.firstJahr, partei: g.name, n: gain.diff };
		let sentence: string = g.plural ? m.place_wahl_gain_pl(args, o) : m.place_wahl_gain(args, o);
		if (loss) {
			const l = party(loss.partei);
			const lossArgs = { partei: l.name, n: -loss.diff };
			sentence += `, ${l.plural ? m.place_wahl_loss_after_pl(lossArgs, o) : m.place_wahl_loss_after(lossArgs, o)}`;
		}
		out.push(`${sentence}.`);
	} else if (loss) {
		const l = party(loss.partei);
		const args = { jahr: facts.firstJahr, partei: l.name, n: -loss.diff };
		out.push(`${l.plural ? m.place_wahl_loss_pl(args, o) : m.place_wahl_loss(args, o)}.`);
	}
	return out.map(capitalize);
}
