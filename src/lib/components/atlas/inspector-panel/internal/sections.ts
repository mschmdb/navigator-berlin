import type { Bundle, LayerHit, LayerMetadata } from '$lib/data';

export type SectionKey = 'boundaries' | 'wohn' | 'umwelt' | 'sozial' | 'mobilitaet' | 'klima';

export interface InspectorSection {
	key: SectionKey;
	label: string;
	hits: LayerHit[];
}

// Logische Reihenfolge für „wo lebe ich gut": Umwelt + Wohnen oben (entscheidungsrelevant),
// administrative Gebiets-Infos (Lage) ganz unten.
export const SECTION_ORDER: readonly SectionKey[] = [
	'umwelt',
	'wohn',
	'sozial',
	'mobilitaet',
	'klima',
	'boundaries'
];

export const SECTION_LABELS: Record<SectionKey, string> = {
	boundaries: 'Lage & Verwaltung',
	wohn: 'Wohnen',
	umwelt: 'Umwelt',
	sozial: 'Soziale Infrastruktur',
	mobilitaet: 'Mobilität',
	klima: 'Klima'
};

const BUNDLE_TO_SECTION: Record<Bundle, SectionKey> = {
	'A: Boundaries': 'boundaries',
	'B: Wohn-Daten': 'wohn',
	'C: Umwelt': 'umwelt',
	// ADR-015 (Story 9.6): Erinnerungs-Orte raus aus dem Frontend. denkmal-2024 +
	// stolpersteine sind inspectorRelevant:false, erreichen groupHitsBySection nie.
	// No-Op-Map auf 'boundaries' damit Record<Bundle> exhaustive bleibt.
	'D: Memorial': 'boundaries',
	'E: Soziale Infrastruktur': 'sozial',
	'F: Mobilität': 'mobilitaet',
	// Kiez-Score-Layer rendern als eigene Top-Sektion über `kiez-score-section.svelte`.
	// Sie liefern keine LayerHits in den Inspector-Sections, fallen daher auf 'boundaries'
	// als No-Op-Mapping zurück und werden zusätzlich via `inspectorRelevant: false` aus
	// `getLayersAtPoint` ausgeschlossen.
	'G: Kiez-Score': 'boundaries',
	// Wahldaten rendern in eigener Inspector-Sektion (Story 6.3). No-Op-Map auf 'boundaries'
	// damit getLayersAtPoint sie nicht in andere Sections wirft. Layer haben
	// inspectorRelevant=true für direkten Wahlbezirks-Lookup ausserhalb von getLayersAtPoint.
	'H: Wahldaten': 'boundaries',
	// Einwohnerdichte-Layer ist inspectorRelevant:false (Map-only). Demografie rendert
	// als eigener Inspector-Block (Story 10.5) aus static/data, nicht via LayerHits.
	// No-Op-Map auf 'boundaries' damit Record<Bundle> exhaustive bleibt.
	'I: Demografie': 'boundaries',
	// Kultur-Layer (Epic 13) sind in Story 13.0 inspectorRelevant:false (Map + Score-Input,
	// kein Inspector-Hit). No-Op-Map auf 'boundaries' damit Record<Bundle> exhaustive bleibt.
	'J: Kultur': 'boundaries'
};

const BOUNDARY_ORDER = ['bezirke', 'ortsteile', 'plz', 'einschulbereiche-2024'];

// Per-Slug-Section-Override: Einschulbereiche sind administrative Grenzen (Schul-Einzugsgebiet),
// gehören zu „Lage & Verwaltung", nicht zur sozialen Infrastruktur (POIs).
const SLUG_SECTION_OVERRIDE: Record<string, SectionKey> = {
	'einschulbereiche-2024': 'boundaries'
};

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
		sozial: [],
		mobilitaet: [],
		klima: []
	};
	for (const hit of hits) {
		const bundle = bundleFor(hit.layer, metaBySlug);
		if (!bundle) continue;
		const section = SLUG_SECTION_OVERRIDE[hit.layer] ?? BUNDLE_TO_SECTION[bundle];
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
