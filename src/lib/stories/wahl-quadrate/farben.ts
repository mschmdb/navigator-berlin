/**
 * Blockfarben der Quadrate nach `runde-20-ux/regeln.md`: CDU Anthrazit, Piraten
 * Orange, übrige aus den Skizzendaten. Bewusst getrennt von `partei-farben.ts`:
 * Dort stehen abgedunkelte UI-Farben für Text auf Beige, hier Flächen, auf denen
 * die Zahl in Papier oder Tinte steht (`textOn`).
 */
import { ORDER, type PartyKey } from './parteien';

export const PARTY_COLORS: Readonly<Record<PartyKey, string>> = {
	afd: '#009ee0',
	bsw: '#722282',
	cdu: '#3b3936',
	fdp: '#ffef00',
	gruene: '#1aa037',
	linke: '#be3075',
	piraten: '#ff820a',
	spd: '#e3000f',
	rest: '#8d887d'
};

/** Farben je Block in `ORDER`, Eingabe für `fillsFor` und `squareElements`. */
export function colorsInOrder(): string[] {
	return ORDER.map((k) => PARTY_COLORS[k]);
}
