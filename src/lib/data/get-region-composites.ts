/**
 * Story 14.10: Composite-Scores pro Bezirksregion (143) + Bezirk (12) als statisches JSON
 * (`scripts/aggregate-scores.ts`). Erlaubt dem Client-Inspector, neben den Profil-Links den
 * BR-/Bezirks-Score zu zeigen, ohne die DB (kiez_score/bezirk_score) client-seitig zu brauchen.
 */

export interface RegionComposites {
	readonly schemaVersion: number;
	readonly generatedAt: string;
	/** Composite je Bezirksregion-Slug (ggf. disambiguiert `name-bezirk`). */
	readonly kiez: Record<string, number | null>;
	/** Composite je Bezirk-Slug. */
	readonly bezirk: Record<string, number | null>;
}

const URL_PATH = '/kiez-scores/region-composites.json';
let cache: RegionComposites | null = null;

export async function loadRegionComposites(
	fetchFn: typeof fetch = fetch
): Promise<RegionComposites | null> {
	if (cache) return cache;
	try {
		const res = await fetchFn(URL_PATH);
		if (!res.ok) return null;
		cache = (await res.json()) as RegionComposites;
		return cache;
	} catch {
		return null;
	}
}

/**
 * Composite für die Bezirksregion (`kiez`) oder den Bezirk. Spiegelt die Slug-Disambiguation
 * der Layer-Aggregate (`name` → Fallback `name-bezirk`), damit doppelte BR-Namen (z.B. Heerstraße)
 * korrekt auflösen.
 */
export function regionComposite(
	data: RegionComposites | null,
	scope: 'kiez' | 'bezirk',
	kiezSlug: string | null,
	bezirkSlug: string | null
): number | null {
	if (!data) return null;
	if (scope === 'bezirk') {
		return bezirkSlug ? (data.bezirk[bezirkSlug] ?? null) : null;
	}
	if (!kiezSlug) return null;
	const direct = data.kiez[kiezSlug];
	if (typeof direct === 'number' || direct === null) {
		if (kiezSlug in data.kiez) return direct;
	}
	const disambiguated = bezirkSlug ? data.kiez[`${kiezSlug}-${bezirkSlug}`] : undefined;
	return disambiguated ?? null;
}
