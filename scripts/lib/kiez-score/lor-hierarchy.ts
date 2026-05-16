import type { Feature } from 'geojson';
import { normalizeSlug } from '../../../src/lib/data/internal/slug.js';

/**
 * Story 2.9a · LOR-Hierarchie-Mapping.
 *
 * Berliner LOR-Codes sind hierarchisch kodiert:
 * - PLR_ID = 8-stellig (`AABBCCDD`)
 * - BZR_ID = 6-stellig = `AABBCC` (PLR_ID-Prefix)
 * - BEZ = 2-stellig = `AA`
 *
 * Diese reine Property-Hierarchie reicht für ein Mapping ohne Spatial-Containment,
 * was via Story-Notes als bevorzugter Pfad markiert ist. Spatial-Fallback nicht
 * nötig, weil 0 Mismatches im ODIS-Dataset 2021 verifiziert sind.
 */

export interface PlanungsraumLike {
	readonly plrId: string;
	readonly bez: string;
	readonly areaM2: number;
}

export interface BezirksregionLike {
	readonly bzrId: string;
	readonly bez: string;
	readonly areaM2: number;
	readonly feature: Feature;
	readonly name?: string;
}

export interface BezirkLike {
	readonly name: string;
	/** 2-stelliger BEZ-Code, z.B. '01' für Mitte. */
	readonly bezCode: string;
}

export interface BezirksregionNode {
	readonly bzrId: string;
	readonly name: string;
	readonly slug: string;
	readonly bezirkSlug: string;
	readonly areaM2: number;
	readonly planungsraeume: readonly PlanungsraumLike[];
}

export interface BezirkNode {
	readonly slug: string;
	readonly name: string;
	readonly bezCode: string;
	readonly planungsraeume: readonly PlanungsraumLike[];
}

export interface LorHierarchy {
	readonly bezirksregionen: readonly BezirksregionNode[];
	readonly bezirke: readonly BezirkNode[];
}

export function bezirkSlugFromBezCode(bezirke: readonly BezirkLike[], bezCode: string): string | null {
	const match = bezirke.find((b) => b.bezCode === bezCode);
	return match ? normalizeSlug(match.name) : null;
}

export function buildLorHierarchy(
	planungsraeume: readonly PlanungsraumLike[],
	bezirksregionen: readonly BezirksregionLike[],
	bezirke: readonly BezirkLike[]
): LorHierarchy {
	// Bezirk-Slug-Lookup nach BEZ-Code.
	const bezSlugByCode = new Map<string, string>();
	const bezNameByCode = new Map<string, string>();
	for (const b of bezirke) {
		bezSlugByCode.set(b.bezCode, normalizeSlug(b.name));
		bezNameByCode.set(b.bezCode, b.name);
	}

	// BR-Lookup nach 6-stelliger BZR_ID.
	const brByBzrId = new Map<string, BezirksregionLike>();
	for (const br of bezirksregionen) {
		brByBzrId.set(br.bzrId, br);
	}

	// Plr → BR + Bezirk via Prefix-Match.
	const plrsByBr = new Map<string, PlanungsraumLike[]>();
	const plrsByBez = new Map<string, PlanungsraumLike[]>();
	for (const p of planungsraeume) {
		const bezSlug = bezSlugByCode.get(p.bez);
		if (!bezSlug) {
			throw new Error(`planungsraum ${p.plrId} references unknown bezirk code ${p.bez}`);
		}
		const bzrId = p.plrId.slice(0, 6);
		const br = brByBzrId.get(bzrId);
		if (!br) {
			throw new Error(`planungsraum ${p.plrId} references unknown bezirksregion id ${bzrId}`);
		}
		const brBucket = plrsByBr.get(bzrId) ?? [];
		brBucket.push(p);
		plrsByBr.set(bzrId, brBucket);
		const bezBucket = plrsByBez.get(p.bez) ?? [];
		bezBucket.push(p);
		plrsByBez.set(p.bez, bezBucket);
	}

	// BR-Slug + Disambiguation (z.B. 2× „Heerstraße" in Spandau + Charlottenburg-Wilmersdorf).
	const baseSlugCounts = new Map<string, number>();
	for (const br of bezirksregionen) {
		const name = br.name ?? '';
		if (!name) continue;
		const base = normalizeSlug(name);
		baseSlugCounts.set(base, (baseSlugCounts.get(base) ?? 0) + 1);
	}

	const bezirksregionenNodes: BezirksregionNode[] = bezirksregionen.map((br) => {
		const name = br.name ?? '';
		const bezSlug = bezSlugByCode.get(br.bez);
		if (!bezSlug) {
			throw new Error(`bezirksregion ${br.bzrId} references unknown bezirk code ${br.bez}`);
		}
		const baseSlug = normalizeSlug(name);
		const count = baseSlugCounts.get(baseSlug) ?? 0;
		const slug = count > 1 ? `${baseSlug}-${bezSlug}` : baseSlug;
		return {
			bzrId: br.bzrId,
			name,
			slug,
			bezirkSlug: bezSlug,
			areaM2: br.areaM2,
			planungsraeume: plrsByBr.get(br.bzrId) ?? []
		};
	});

	const bezirkeNodes: BezirkNode[] = bezirke.map((b) => ({
		slug: normalizeSlug(b.name),
		name: b.name,
		bezCode: b.bezCode,
		planungsraeume: plrsByBez.get(b.bezCode) ?? []
	}));

	return { bezirksregionen: bezirksregionenNodes, bezirke: bezirkeNodes };
}
