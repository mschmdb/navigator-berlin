import type { LayerHit, LayerMetadata } from '$lib/data';
import {
	groupHitsBySection,
	SECTION_LABELS,
	SECTION_ORDER,
	type SectionKey
} from '../../inspector-panel/internal/sections.js';

export interface CompareRow {
	slug: string;
	hitA: LayerHit | null;
	hitB: LayerHit | null;
}

export interface CompareSection {
	key: SectionKey;
	label: string;
	rows: CompareRow[];
}

export function mergeCompareSections(
	hitsA: readonly LayerHit[],
	hitsB: readonly LayerHit[],
	layerMeta: readonly LayerMetadata[]
): CompareSection[] {
	const sectionsA = groupHitsBySection(hitsA, layerMeta);
	const sectionsB = groupHitsBySection(hitsB, layerMeta);
	const byKeyA = new Map(sectionsA.map((s) => [s.key, s]));
	const byKeyB = new Map(sectionsB.map((s) => [s.key, s]));

	return SECTION_ORDER.map((key) => {
		const sectionA = byKeyA.get(key);
		const sectionB = byKeyB.get(key);
		const orderedSlugs: string[] = [];
		const seen = new Set<string>();
		for (const list of [sectionA?.hits ?? [], sectionB?.hits ?? []]) {
			for (const h of list) {
				if (seen.has(h.layer)) continue;
				seen.add(h.layer);
				orderedSlugs.push(h.layer);
			}
		}
		const byA = new Map((sectionA?.hits ?? []).map((h) => [h.layer, h]));
		const byB = new Map((sectionB?.hits ?? []).map((h) => [h.layer, h]));
		const rows: CompareRow[] = orderedSlugs.map((slug) => ({
			slug,
			hitA: byA.get(slug) ?? null,
			hitB: byB.get(slug) ?? null
		}));
		return {
			key,
			label: SECTION_LABELS[key],
			rows
		};
	});
}
