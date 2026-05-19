/**
 * Slug-Format: `{jahr}-{typ}-{stimmtyp}` z.B. `2025-btw-zweitstimme`.
 * BVV nur als `{jahr}-bvv` (einstimme implizit).
 */
export type WahlSlug = {
	jahr: number;
	typ: 'btw' | 'agh' | 'bvv';
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
};

export function parseWahlSlug(slug: string): WahlSlug | null {
	const m = slug.match(/^(\d{4})-(btw|agh|bvv)(?:-(erststimme|zweitstimme|einstimme))?$/);
	if (!m) return null;
	const jahr = Number.parseInt(m[1], 10);
	const typ = m[2] as 'btw' | 'agh' | 'bvv';
	const stimmtyp = (m[3] ?? (typ === 'bvv' ? 'einstimme' : 'zweitstimme')) as
		| 'erststimme'
		| 'zweitstimme'
		| 'einstimme';
	if (typ === 'bvv' && stimmtyp !== 'einstimme') return null;
	if (typ !== 'bvv' && stimmtyp === 'einstimme') return null;
	return { jahr, typ, stimmtyp };
}

export function buildWahlSlug(s: WahlSlug): string {
	if (s.typ === 'bvv') return `${s.jahr}-bvv`;
	return `${s.jahr}-${s.typ}-${s.stimmtyp}`;
}
