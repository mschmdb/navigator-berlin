import type { Bundle } from '$lib/data';

export interface LayerBundleLookup {
	readonly slug: string;
	readonly bundleGroup: Bundle;
}

const BUNDLE_RANK: Record<Bundle, number> = {
	'A: Boundaries': 0,
	'B: Wohn-Daten': 1,
	'C: Umwelt': 2,
	'D: Memorial': 3,
	'E: Soziale Infrastruktur': 4,
	'F: Mobilität': 5,
	'G: Kiez-Score': 6
};

const UNKNOWN_RANK = 99;

export function sortSlugsByBundleStable(
	slugs: readonly string[],
	layers: readonly LayerBundleLookup[]
): string[] {
	const rankBySlug = new Map<string, number>(
		layers.map((l) => [l.slug, BUNDLE_RANK[l.bundleGroup] ?? UNKNOWN_RANK] as const)
	);
	const indexed = slugs.map((slug, index) => ({
		slug,
		index,
		rank: rankBySlug.get(slug) ?? UNKNOWN_RANK
	}));
	indexed.sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.index - b.index));
	return indexed.map((entry) => entry.slug);
}
