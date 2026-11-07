/**
 * Texte für Plakat, Social- und OG-Bild von „Berlin in Quadraten“ (#192). Eigene Tabelle wie
 * `GREY_TEXT` in `grau.ts`, weil die Bilder auf dem Server ohne Seitenkontext entstehen.
 */
import type { Lang } from './grau';
import type { WahlTyp } from './parteien';

export interface BildTexte {
	title: string;
	subtitle: string;
	typ: Record<WahlTyp, string>;
	typLine: (typ: string, first: number, last: number) => string;
	reading: string;
	greyHead: (pct: number) => string;
	greyCaption: (typ: string) => string;
	columns: readonly [string, string, string];
	andOthers: string;
	others: string;
	sources: string;
	secondVotes: string;
	ogCaption: (typ: string, jahr: number) => string;
	pdfLink: (typ: string) => string;
}

export const TEXTE: Readonly<Record<Lang, BildTexte>> = {
	de: {
		title: 'Berlin in Quadraten',
		subtitle: 'Alle Bezirke, alle Wahlen',
		typ: { agh: 'Abgeordnetenhaus', btw: 'Bundestag' },
		typLine: (typ, first, last) => `${typ}, Zweitstimmen ${first} bis ${last}`,
		reading:
			'Jedes Quadrat ist eine Wahl in einem Bezirk. Jeder Block ist eine Partei, seine Fläche ist ihr Anteil an den Zweitstimmen.',
		greyHead: (pct) =>
			pct > 0
				? `Grau fasst alle Parteien unter ${pct} % und die Sonstigen zusammen.`
				: 'Bei 0 % steht Grau nur für die Sonstigen.',
		greyCaption: (typ) => `${typ}: Grau in ganz Berlin`,
		columns: ['Wahl', 'Grau', 'Darin'],
		andOthers: ' und Sonstige',
		others: 'Sonstige',
		sources: 'Quellen',
		secondVotes: 'Zweitstimmen',
		ogCaption: (typ, jahr) => `${typ} ${jahr}, alle 12 Bezirke`,
		pdfLink: (typ) => `Plakat als PDF: ${typ}`
	},
	en: {
		title: 'Berlin in Squares',
		subtitle: 'All districts, all elections',
		typ: { agh: 'House of Representatives', btw: 'Bundestag' },
		typLine: (typ, first, last) => `${typ}, second votes ${first} to ${last}`,
		reading:
			'Each square is one election in one district. Each block is one party, its area is the party’s share of the second votes.',
		greyHead: (pct) =>
			pct > 0
				? `Grey combines all parties below ${pct}% and the others.`
				: 'At 0%, grey only stands for the others.',
		greyCaption: (typ) => `${typ}: grey across Berlin`,
		columns: ['Election', 'Grey', 'Includes'],
		andOthers: ' and others',
		others: 'Others',
		sources: 'Sources',
		secondVotes: 'second votes',
		ogCaption: (typ, jahr) => `${typ} ${jahr}, all 12 districts`,
		pdfLink: (typ) => `Poster as PDF: ${typ}`
	}
};
