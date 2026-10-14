import {
	buildKiezeWithGeometry,
	sortKieze,
	type BuildKiezListInput,
	type KiezRef
} from './get-kieze-in-bezirk.js';
import {
	buildRegionOutline,
	type OutlineRegion,
	type RegionOutline
} from '$lib/seo/region-outline-svg.js';

export interface KiezRankInfo {
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number;
}

/** Kiez für Liste und Karte der Bezirksseite: Score plus Berlin-Rang (leer ohne DB). */
export interface KiezListEntry extends KiezRef, KiezRankInfo {}

export interface BezirkKiezeView {
	readonly kieze: readonly KiezListEntry[];
	readonly outline: RegionOutline | null;
}

export interface BezirkKiezeViewInput extends BuildKiezListInput {
	readonly ranks: ReadonlyMap<string, KiezRankInfo>;
}

function isPolygonal(g: { type: string } | null | undefined): g is OutlineRegion['geometry'] {
	return g?.type === 'Polygon' || g?.type === 'MultiPolygon';
}

export function buildBezirkKiezeView(input: BezirkKiezeViewInput): BezirkKiezeView {
	const withGeometry = buildKiezeWithGeometry(input);
	const kieze = sortKieze(withGeometry.map((k) => k.ref)).map((ref): KiezListEntry => {
		const rank = input.ranks.get(ref.slug);
		return {
			...ref,
			rang: rank?.rang ?? null,
			quartil: rank?.quartil ?? null,
			total: rank?.total ?? 0
		};
	});
	const regions: OutlineRegion[] = [];
	for (const { ref, geometry } of withGeometry) {
		if (isPolygonal(geometry)) regions.push({ id: ref.slug, geometry });
	}
	return { kieze, outline: buildRegionOutline(regions) };
}
