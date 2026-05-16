import { describe, it, expect } from 'vitest';
import type { Feature, Polygon } from 'geojson';
import {
	buildLorHierarchy,
	bezirkSlugFromBezCode,
	type PlanungsraumLike,
	type BezirksregionLike,
	type BezirkLike
} from './lor-hierarchy.js';

function plr(plrId: string, areaM2: number): PlanungsraumLike {
	return { plrId, bez: plrId.slice(0, 2), areaM2 };
}

const polygon: Polygon = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] };

function brFeature(bzrId: string, areaM2: number): BezirksregionLike {
	const bez = bzrId.slice(0, 2);
	return {
		bzrId,
		bez,
		areaM2,
		feature: { type: 'Feature', properties: { BZR_ID: bzrId, BEZ: bez }, geometry: polygon } as Feature
	};
}

function bezFeature(name: string, bezCode: string): BezirkLike {
	return { name, bezCode };
}

describe('lor-hierarchy / buildLorHierarchy (Story 2.9a)', () => {
	it('groups planungsraeume into bezirksregionen by PLR_ID prefix', () => {
		const plrs: PlanungsraumLike[] = [
			plr('01100101', 100),
			plr('01100102', 200),
			plr('01100201', 50)
		];
		const brs: BezirksregionLike[] = [brFeature('011001', 300), brFeature('011002', 50)];
		const bzs: BezirkLike[] = [bezFeature('Mitte', '01')];
		const h = buildLorHierarchy(plrs, brs, bzs);
		expect(h.bezirksregionen).toHaveLength(2);
		const br011001 = h.bezirksregionen.find((r) => r.bzrId === '011001');
		expect(br011001?.planungsraeume.map((p) => p.plrId).sort()).toEqual(['01100101', '01100102']);
		const br011002 = h.bezirksregionen.find((r) => r.bzrId === '011002');
		expect(br011002?.planungsraeume).toHaveLength(1);
	});

	it('attaches bezirk-slug to bezirksregionen via BEZ code', () => {
		const plrs: PlanungsraumLike[] = [plr('01100101', 100)];
		const brs: BezirksregionLike[] = [brFeature('011001', 100)];
		const bzs: BezirkLike[] = [bezFeature('Mitte', '01'), bezFeature('Friedrichshain-Kreuzberg', '02')];
		const h = buildLorHierarchy(plrs, brs, bzs);
		expect(h.bezirksregionen[0]!.bezirkSlug).toBe('mitte');
	});

	it('groups planungsraeume to bezirke directly via BEZ code', () => {
		const plrs: PlanungsraumLike[] = [
			plr('01100101', 100),
			plr('01100102', 200),
			plr('02100101', 300),
			plr('02100102', 400)
		];
		const brs: BezirksregionLike[] = [
			brFeature('011001', 300),
			brFeature('021001', 700)
		];
		const bzs: BezirkLike[] = [bezFeature('Mitte', '01'), bezFeature('Friedrichshain-Kreuzberg', '02')];
		const h = buildLorHierarchy(plrs, brs, bzs);
		const mitte = h.bezirke.find((b) => b.slug === 'mitte');
		expect(mitte?.planungsraeume.map((p) => p.plrId).sort()).toEqual(['01100101', '01100102']);
		const fk = h.bezirke.find((b) => b.slug === 'friedrichshain-kreuzberg');
		expect(fk?.planungsraeume.map((p) => p.plrId).sort()).toEqual(['02100101', '02100102']);
	});

	it('throws if a planungsraum references unknown bezirk code', () => {
		const plrs: PlanungsraumLike[] = [plr('99100101', 100)];
		const brs: BezirksregionLike[] = [brFeature('991001', 100)];
		const bzs: BezirkLike[] = [bezFeature('Mitte', '01')];
		expect(() => buildLorHierarchy(plrs, brs, bzs)).toThrow(/unknown bezirk/i);
	});

	it('throws if a planungsraum references unknown bezirksregion id', () => {
		const plrs: PlanungsraumLike[] = [plr('01199901', 100)];
		const brs: BezirksregionLike[] = [];
		const bzs: BezirkLike[] = [bezFeature('Mitte', '01')];
		expect(() => buildLorHierarchy(plrs, brs, bzs)).toThrow(/unknown bezirksregion/i);
	});

	it('resolves duplicate BR-name slugs via bezirk suffix (Heerstraße in Spandau + Charlottenburg)', () => {
		const plrs: PlanungsraumLike[] = [plr('05100101', 100), plr('04100101', 200)];
		const brs: BezirksregionLike[] = [
			{ ...brFeature('051001', 100), name: 'Heerstraße' },
			{ ...brFeature('041001', 200), name: 'Heerstraße' }
		];
		const bzs: BezirkLike[] = [
			bezFeature('Spandau', '05'),
			bezFeature('Charlottenburg-Wilmersdorf', '04')
		];
		const h = buildLorHierarchy(plrs, brs, bzs);
		const slugs = h.bezirksregionen.map((r) => r.slug).sort();
		expect(slugs).toEqual(['heerstrasse-charlottenburg-wilmersdorf', 'heerstrasse-spandau']);
	});

	it('keeps single occurrences of BR-name without suffix', () => {
		const brs: BezirksregionLike[] = [{ ...brFeature('011001', 100), name: 'Brunnenstraße Nord' }];
		const plrs: PlanungsraumLike[] = [plr('01100101', 100)];
		const bzs: BezirkLike[] = [bezFeature('Mitte', '01')];
		const h = buildLorHierarchy(plrs, brs, bzs);
		expect(h.bezirksregionen[0]!.slug).toBe('brunnenstrasse-nord');
	});
});

describe('bezirkSlugFromBezCode', () => {
	it('returns null for unknown code', () => {
		const bzs: BezirkLike[] = [bezFeature('Mitte', '01')];
		expect(bezirkSlugFromBezCode(bzs, '99')).toBeNull();
	});
	it('returns normalized slug for known code', () => {
		const bzs: BezirkLike[] = [bezFeature('Friedrichshain-Kreuzberg', '02')];
		expect(bezirkSlugFromBezCode(bzs, '02')).toBe('friedrichshain-kreuzberg');
	});
});
