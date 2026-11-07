import { ORDER, type NamedParty, type PartyKey } from './parteien';
import type { ElectionShares } from './types';

/** Parteien unter dieser Schwelle fallen ins Grau. Im Handbuch einstellbar. */
export const DEFAULT_THRESHOLD = 0.05;
/** Ab diesem Anteil nennt die Caption eine Partei im Grau beim Namen. */
export const MIN_NAMED = 0.005;

export type GreyKey = NamedParty | 'fw' | 'tier';
export type GreyNames = Record<GreyKey, string>;
export type Lang = 'de' | 'en';

export interface SmallParty {
	key: GreyKey;
	share: number;
}

export interface Derived {
	/** Anteil pro Block. Parteien im Grau stehen auf 0, ihr Anteil steckt in `rest`. */
	disp: Record<PartyKey, number>;
	/** Im Grau genannte Parteien, absteigend. */
	small: SmallParty[];
	/** Die drei größten farbigen Parteien. */
	top: { key: NamedParty; share: number }[];
}

export function derive(e: ElectionShares, thr: number = DEFAULT_THRESHOLD): Derived {
	const disp = Object.fromEntries(ORDER.map((k) => [k, 0])) as Record<PartyKey, number>;
	const small: SmallParty[] = [];
	const tier = e.tier ?? 0;
	let rest = e.sonst + e.fw + tier;
	for (const k of ORDER) {
		if (k === 'rest') continue;
		const v = e.raw[k] ?? 0;
		if (v > 0 && v >= thr) disp[k] = v;
		else {
			rest += v;
			if (v >= MIN_NAMED) small.push({ key: k, share: v });
		}
	}
	if (e.fw >= MIN_NAMED) small.push({ key: 'fw', share: e.fw });
	if (tier >= MIN_NAMED) small.push({ key: 'tier', share: tier });
	small.sort((p, q) => q.share - p.share);
	disp.rest = rest;
	const top = ORDER.filter((k): k is NamedParty => k !== 'rest' && disp[k] > 0)
		.map((key) => ({ key, share: disp[key] }))
		.sort((p, q) => q.share - p.share)
		.slice(0, 3);
	return { disp, small, top };
}

export function sharesOf(d: Derived): number[] {
	return ORDER.map((k) => d.disp[k]);
}

export function greyCaption(d: Derived): { percent: number; parties: SmallParty[] } {
	return { percent: Math.round(d.disp.rest * 100), parties: d.small };
}

const PCT: Record<Lang, string> = { de: ' %', en: '%' };

export function formatShare(v: number, lang: Lang): string {
	const s = (v * 100).toFixed(1);
	return (lang === 'de' ? s.replace('.', ',') : s) + PCT[lang];
}

const GREY_TEXT: Record<Lang, { grey: string; and: string; others: string }> = {
	de: { grey: 'Grau', and: ' und ', others: 'weitere kleine Parteien' },
	en: { grey: 'Grey', and: ' and ', others: 'other small parties' }
};

/** „Grau 13 %: FDP 4,6 %, BSW 3,1 % und weitere kleine Parteien.“ */
export function formatGreyLine(d: Derived, names: GreyNames, lang: Lang): string {
	const { percent, parties } = greyCaption(d);
	const t = GREY_TEXT[lang];
	const named = parties.map((p) => `${names[p.key]} ${formatShare(p.share, lang)}`).join(', ');
	return `${t.grey} ${percent}${PCT[lang]}: ${named ? named + t.and : ''}${t.others}.`;
}
