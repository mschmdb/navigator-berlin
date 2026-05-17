/**
 * URL-safe slug aus title_de. Deterministisch, ASCII-only, max 60 Zeichen.
 *
 * Story 5.8 AC-6: Unicode-Transliteration-Tabelle ist Lock — keine
 * library-based-transliteration (avoid drift). Custom-Map für DE-Umlaute,
 * Rest wird gestripped.
 */

const TRANSLIT: Readonly<Record<string, string>> = {
	ä: 'ae',
	ö: 'oe',
	ü: 'ue',
	ß: 'ss',
	Ä: 'ae',
	Ö: 'oe',
	Ü: 'ue'
};

const MAX_LEN = 60;

export function slugify(input: string): string {
	const transliterated = Array.from(input)
		.map((ch) => TRANSLIT[ch] ?? ch)
		.join('');

	const ascii = transliterated
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, '-') // alles Nicht-[a-z0-9-] (auch Whitespace, Sonderzeichen, Non-ASCII) → ein Bindestrich
		.replace(/-+/g, '-') // mehrfache - kollabieren
		.replace(/^-+|-+$/g, ''); // Leading/Trailing trim

	return ascii.slice(0, MAX_LEN).replace(/-+$/, '');
}
