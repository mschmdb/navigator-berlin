/**
 * #90 (/daten): Eine Kurzbeschreibung, die nur den Link-Text wiederholt
 * („Apotheke / Apotheke“, „S-Bahn-Stationen / S-Bahn-Station“), fliegt raus.
 * Als Dopplung gilt eine kurze Beschreibung (höchstens vier Wörter), deren
 * Anfang zum größten Teil mit dem Namen übereinstimmt.
 */
const MAX_WORDS = 4;
const MIN_SHARED_PREFIX = 0.6;

function normalize(text: string): string {
	return text.toLocaleLowerCase('de').replace(/[^\p{L}\p{N}]/gu, '');
}

function sharedPrefixLength(a: string, b: string): number {
	let i = 0;
	while (i < a.length && i < b.length && a[i] === b[i]) i++;
	return i;
}

export function isRedundantDescription(name: string, description: string): boolean {
	const desc = description.trim();
	if (desc.length === 0) return true;
	if (desc.split(/\s+/).length > MAX_WORDS) return false;
	const a = normalize(name);
	const b = normalize(desc);
	const shorter = Math.min(a.length, b.length);
	if (shorter === 0) return false;
	return sharedPrefixLength(a, b) / shorter >= MIN_SHARED_PREFIX;
}
