/**
 * Lesehilfe im Satz: Die wertende Phrase („besser versorgt als in 90 % der Kieze“) bekommt
 * die Tönung, sonst nichts. Von der Fundstelle bis zum Ende des Satzteils (Komma oder Punkt
 * gefolgt von Leerzeichen oder Satzende; „16,4“ zählt nicht als Komma).
 */
export function splitForTint(
	text: string,
	phrase: string
): { before: string; tinted: string; after: string } | null {
	const start = text.indexOf(phrase);
	if (start < 0 || phrase.length === 0) return null;
	const rest = text.slice(start);
	const end = rest.search(/[,.](?=\s|$)/);
	const stop = end < 0 ? text.length : start + end;
	return { before: text.slice(0, start), tinted: text.slice(start, stop), after: text.slice(stop) };
}
