/** Daten für Plakat, Social- und OG-Bild: Quadrate je Bezirk und Wahl, Grau berlinweit, Quellen. */
import { sourceName } from '$lib/data/wahl-source-name';
import { DEFAULT_THRESHOLD, derive, formatShare, sharesOf, type Lang } from './grau';
import { toElectionShares } from './eingabe';
import { shareTexts } from './labels';
import { greyNames } from '$lib/components/stories/quadrate/namen';
import { JAHRE, wahlSlug, type WahlTyp } from './parteien';
import type { SquareSpec } from './anordnung';
import type { BezirkWahlen, StoriesWahlData, WahlSlug } from './types';
import { TEXTE } from './texte';

export interface Wahl {
	slug: WahlSlug;
	jahr: number;
}

export function wahlenOf(typ: WahlTyp): Wahl[] {
	return JAHRE[typ].map((jahr) => ({ slug: wahlSlug(typ, jahr)!, jahr }));
}

/** Bezirke alphabetisch, wie die Gesamtansicht sie zeigt. */
export function bezirkeAlphabetisch(data: StoriesWahlData): BezirkWahlen[] {
	return [...data.bezirke].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

export function squareSpec(
	b: BezirkWahlen,
	w: Wahl,
	typ: WahlTyp,
	lang: Lang,
	opts: { thr?: number; numbers?: boolean } = {}
): SquareSpec {
	const shares = sharesOf(
		derive(toElectionShares(b.wahlen[w.slug]), opts.thr ?? DEFAULT_THRESHOLD)
	);
	return {
		shares,
		texts: opts.numbers === false ? null : shareTexts(shares, lang),
		title: `${b.name}, ${TEXTE[lang].typ[typ]} ${w.jahr}`
	};
}

export interface GreyRow {
	slug: WahlSlug;
	jahr: number;
	/** Grau berlinweit, ganze Prozent. */
	percent: number;
	/** „FDP 1,8 %, … und Sonstige“, genannt ab 1 % wie in der Skizze. */
	parts: string;
}

export function greyRows(
	data: StoriesWahlData,
	typ: WahlTyp,
	lang: Lang,
	thr = DEFAULT_THRESHOLD
): GreyRow[] {
	const t = TEXTE[lang];
	const names = greyNames(lang);
	return wahlenOf(typ).map(({ slug, jahr }) => {
		const d = derive(toElectionShares(data.berlin[slug]), thr);
		const big = d.small.filter((p) => p.share >= 0.01);
		const named = big.map((p) => `${names[p.key]} ${formatShare(p.share, lang)}`);
		return {
			slug,
			jahr,
			percent: Math.round(d.disp.rest * 100),
			parts: named.length ? named.join(', ') + t.andOthers : t.others
		};
	});
}

/** „Quellen: Amt für Statistik Berlin-Brandenburg, Landeswahlleiterin Berlin (dl-de/by-2.0).“ */
export function sourceLine(data: StoriesWahlData, typ: WahlTyp, lang: Lang): string {
	const wahlen = data.wahlen.filter((w) => w.typ === typ);
	const names = [...new Set(wahlen.map((w) => sourceName(w.quelle)))];
	const lic = [...new Set(wahlen.map((w) => w.lizenz))];
	return `${TEXTE[lang].sources}: ${names.join(', ')} (${lic.join(', ')}).`;
}
