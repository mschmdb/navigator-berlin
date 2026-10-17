/**
 * #90 (/daten): Eine Kurzbeschreibung, die nur den Link-Text wiederholt
 * („Apotheke / Apotheke“, „S-Bahn-Stationen / S-Bahn-Station“), fliegt raus.
 * Als Dopplung gilt nur dasselbe Wort, höchstens in Einzahl oder Mehrzahl.
 * Jede inhaltliche Ergänzung („Post- oder Paketstelle“) bleibt sichtbar.
 */
const MAX_INFLECTION = 3;

function normalize(text: string): string {
	return text
		.toLocaleLowerCase('de')
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/[^\p{L}\p{N}]/gu, '');
}

export function isRedundantDescription(name: string, description: string): boolean {
	const b = normalize(description);
	if (b.length === 0) return true;
	const a = normalize(name);
	const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
	return longer.startsWith(shorter) && longer.length - shorter.length <= MAX_INFLECTION;
}
