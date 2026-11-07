/**
 * Farben und Namen der Parteien für „Berlin in Quadraten“ (#176), nach `regeln.md` der Skizze:
 * CDU Anthrazit, Piraten Orange, die übrigen in den vollen Parteifarben. Die Story nutzt
 * bewusst nicht die abgedunkelten UI-Farben aus `partei-farben.ts`, die Zahlen im Block
 * wählen ihre Textfarbe selbst nach Kontrast (`kontrast.ts`).
 */
import type { GreyNames, Lang } from './grau';
import { ORDER, type PartyKey } from './parteien';

export const PARTY_COLORS: Readonly<Record<PartyKey, string>> = {
	afd: '#009EE0',
	bsw: '#722282',
	cdu: '#3b3936',
	fdp: '#FFEF00',
	gruene: '#1AA037',
	linke: '#BE3075',
	piraten: '#FF820A',
	spd: '#E3000F',
	rest: '#8d887d'
};

/** Farben in der Reihenfolge der Blöcke, Eingabe für `squareSvg`. */
export function colorsInOrder(): string[] {
	return ORDER.map((k) => PARTY_COLORS[k]);
}

export const PARTY_NAMES: Readonly<Record<Lang, GreyNames>> = {
	de: {
		afd: 'AfD',
		bsw: 'BSW',
		cdu: 'CDU',
		fdp: 'FDP',
		gruene: 'Grüne',
		linke: 'Die Linke',
		piraten: 'Piraten',
		spd: 'SPD',
		fw: 'Freie Wähler',
		tier: 'Tierschutzpartei'
	},
	en: {
		afd: 'AfD',
		bsw: 'BSW',
		cdu: 'CDU',
		fdp: 'FDP',
		gruene: 'Greens',
		linke: 'The Left',
		piraten: 'Pirates',
		spd: 'SPD',
		fw: 'Free Voters',
		tier: 'Animal Protection Party'
	}
};

const GREY_LEGEND: Record<Lang, { below: (pct: number) => string; others: string }> = {
	de: { below: (p) => `Grau: alle Parteien unter ${p} %`, others: 'Grau: Sonstige' },
	en: { below: (p) => `Grey: all parties below ${p}%`, others: 'Grey: other parties' }
};

/** Legendentext je Block in `ORDER`, Grau mit der Schwelle aus dem Handbuch. */
export function legendNames(lang: Lang, thr: number): string[] {
	const grey = GREY_LEGEND[lang];
	const pct = Math.round(thr * 100);
	return ORDER.map((k) =>
		k === 'rest' ? (pct > 0 ? grey.below(pct) : grey.others) : PARTY_NAMES[lang][k]
	);
}
