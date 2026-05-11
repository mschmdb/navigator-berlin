const UMLAUT_MAP: Record<string, string> = {
	ä: 'ae',
	ö: 'oe',
	ü: 'ue',
	Ä: 'ae',
	Ö: 'oe',
	Ü: 'ue',
	ß: 'ss'
};

export function normalizeSlug(input: string): string {
	if (!input) return '';
	let s = input.toLowerCase();
	s = s.replace(/[äöüÄÖÜß]/g, (ch) => UMLAUT_MAP[ch] ?? ch);
	s = s.normalize('NFKD').replace(/\p{Diacritic}/gu, '');
	s = s.replace(/[^a-z0-9]+/g, '-');
	s = s.replace(/^-+|-+$/g, '');
	return s;
}
