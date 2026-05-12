import type { Bundle, LayerHit, LayerMetadata } from '$lib/data';

export type SectionKey = 'boundaries' | 'wohn' | 'umwelt' | 'memorial' | 'klima';

export interface InspectorSection {
	key: SectionKey;
	label: string;
	hits: LayerHit[];
}

export const SECTION_ORDER: readonly SectionKey[] = [
	'boundaries',
	'wohn',
	'umwelt',
	'memorial',
	'klima'
];

export const SECTION_LABELS: Record<SectionKey, string> = {
	boundaries: 'Boundaries',
	wohn: 'Wohn-Daten',
	umwelt: 'Umwelt',
	memorial: 'Memorial',
	klima: 'Klima'
};

const BUNDLE_TO_SECTION: Record<Bundle, SectionKey> = {
	'A: Boundaries': 'boundaries',
	'B: Wohn-Daten': 'wohn',
	'C: Umwelt': 'umwelt',
	'D: Memorial': 'memorial'
};

const BOUNDARY_ORDER = [
	'bezirke',
	'ortsteile',
	'lor-prognoseraum',
	'lor-bezirksregion',
	'lor-planungsraum',
	'plz'
];

function bundleFor(slug: string, metaBySlug: Map<string, LayerMetadata>): Bundle | null {
	const meta = metaBySlug.get(slug);
	return meta?.bundleGroup ?? null;
}

function compareBoundaries(a: LayerHit, b: LayerHit): number {
	const ai = BOUNDARY_ORDER.indexOf(a.layer);
	const bi = BOUNDARY_ORDER.indexOf(b.layer);
	if (ai === -1 && bi === -1) return a.layer.localeCompare(b.layer);
	if (ai === -1) return 1;
	if (bi === -1) return -1;
	return ai - bi;
}

export function groupHitsBySection(
	hits: readonly LayerHit[],
	layerMeta: readonly LayerMetadata[]
): InspectorSection[] {
	const metaBySlug = new Map(layerMeta.map((m) => [m.slug, m]));
	const buckets: Record<SectionKey, LayerHit[]> = {
		boundaries: [],
		wohn: [],
		umwelt: [],
		memorial: [],
		klima: []
	};
	for (const hit of hits) {
		const bundle = bundleFor(hit.layer, metaBySlug);
		if (!bundle) continue;
		const section = BUNDLE_TO_SECTION[bundle];
		buckets[section].push(hit);
	}
	buckets.boundaries.sort(compareBoundaries);
	return SECTION_ORDER.map((key) => ({
		key,
		label: SECTION_LABELS[key],
		hits: buckets[key]
	}));
}

export function layerNameFor(slug: string, metaBySlug: Map<string, LayerMetadata>): string {
	const meta = metaBySlug.get(slug);
	if (meta) return meta.slug;
	return slug;
}
