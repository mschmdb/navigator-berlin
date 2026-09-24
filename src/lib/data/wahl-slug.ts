/**
 * Slug-Format: `{jahr}-{typ}-{stimmtyp}` z.B. `2025-btw-zweitstimme`.
 * BVV nur als `{jahr}-bvv` (einstimme implizit).
 *
 * Story 16 (Detailseiten-Umzug): von `(with-header)/wahl/[slug]/slug-utils.ts`
 * nach `$lib/data` gezogen, damit Sitemap/llms/API-Konsumenten dieselbe
 * Implementierung importieren statt sie zu duplizieren (Code Map: vormals
 * vierfach dupliziert in `wahl-detail-pages.ts`, `wahl-section.svelte`,
 * `api/wahl/list/+server.ts`, `llms/data-collector.ts#collectWahlen`).
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

/**
 * Deterministische Fallback-Liste der 23 `wahl`-Rows für DB-lose Builds.
 * Einzige Quelle für `entries()` in `berlin-wahlen/[slug]/+page.server.ts`
 * (Prerender-Slug-Enumeration) und `berlin-wahlen/+page.server.ts` (Block
 * „Alle Wahlen einzeln“) -- beide brauchten vorher je eine eigene Kopie.
 */
export function buildWahlFallbackList(): readonly WahlSlug[] {
	const fallback: WahlSlug[] = [];
	for (const jahr of [2013, 2017, 2021, 2025]) {
		fallback.push({ jahr, typ: 'btw', stimmtyp: 'erststimme' });
		fallback.push({ jahr, typ: 'btw', stimmtyp: 'zweitstimme' });
	}
	for (const jahr of [2011, 2016, 2021, 2023, 2026]) {
		fallback.push({ jahr, typ: 'agh', stimmtyp: 'erststimme' });
		fallback.push({ jahr, typ: 'agh', stimmtyp: 'zweitstimme' });
		fallback.push({ jahr, typ: 'bvv', stimmtyp: 'einstimme' });
	}
	return fallback;
}
