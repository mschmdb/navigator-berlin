/**
 * Story 5.9 AC-7 + AC-8: Selector fuer Internal-Linking-Bloecke.
 *
 * - `getKiezeInBezirk(bezirkSlug)`: alle 143 LOR-Bezirksregionen filtern auf
 *   den passenden Bezirk anhand der BEZ-Code-Map (BezirkCode → BezirkSlug).
 *   Sortierung primaer kiez_score.composite desc, sekundaer Name alphabetisch
 *   wenn Score fehlt.
 *
 * Die Funktionen lesen direkt aus den geladenen GeoJSON-FeatureCollections;
 * Postgres-`kiez_score`-Join macht der Aufrufer (Server-Load), damit der Helper
 * Server-Pfad-unabhaengig + im Test fixturable bleibt.
 */

import { buildKiezSlugs } from './internal/kiez-slug.js';

export interface KiezRef {
	readonly slug: string;
	readonly name: string;
	/** Composite-Score 0-100 wenn kiez_score-Row vorhanden, sonst null. */
	readonly composite: number | null;
}

export interface BezirkCodeToSlug {
	readonly map: ReadonlyMap<string, string>;
}

interface GeoJsonFeature {
	properties?: Record<string, unknown> | null;
	geometry?: { type: string; coordinates?: unknown } | null;
}

interface GeoJsonFeatureCollection {
	features: readonly GeoJsonFeature[];
}

function readKiezName(props: Record<string, unknown>): string | null {
	const candidates = ['BZR_NAME', 'NAME', 'name'] as const;
	for (const key of candidates) {
		const v = props[key];
		if (typeof v === 'string' && v.length > 0) return v;
	}
	return null;
}

function readBezirkCode(props: Record<string, unknown>): string | null {
	const v = props.BEZ;
	if (typeof v === 'string' && v.length > 0) return v;
	if (typeof v === 'number') return String(v).padStart(2, '0');
	return null;
}

export interface BuildKiezListInput {
	readonly lorFeatureCollection: GeoJsonFeatureCollection;
	readonly bezirkCodeToSlug: ReadonlyMap<string, string>;
	readonly scores: ReadonlyMap<string, number>;
	readonly bezirkSlug: string;
}

export interface KiezWithGeometry {
	readonly ref: KiezRef;
	readonly geometry: GeoJsonFeature['geometry'];
}

/** Kieze des Bezirks inklusive LOR-Geometrie (unsortiert, in Feature-Reihenfolge). */
export function buildKiezeWithGeometry(input: BuildKiezListInput): KiezWithGeometry[] {
	// Slugs Berlin-weit disambiguieren (alle Features), erst danach nach Bezirk filtern.
	const candidates: { name: string; bezirk: string; geometry: GeoJsonFeature['geometry'] }[] = [];
	for (const feature of input.lorFeatureCollection.features) {
		const props = feature.properties ?? {};
		const name = readKiezName(props);
		const code = readBezirkCode(props);
		if (!name || !code) continue;
		const parentSlug = input.bezirkCodeToSlug.get(code);
		candidates.push({ name, bezirk: parentSlug ?? '', geometry: feature.geometry });
	}
	const slugs = buildKiezSlugs(candidates);
	const out: KiezWithGeometry[] = [];
	candidates.forEach((c, i) => {
		if (c.bezirk !== input.bezirkSlug) return;
		out.push({
			ref: { slug: slugs[i], name: c.name, composite: input.scores.get(slugs[i]) ?? null },
			geometry: c.geometry
		});
	});
	return out;
}

export function buildKiezeInBezirk(input: BuildKiezListInput): KiezRef[] {
	return sortKieze(buildKiezeWithGeometry(input).map((k) => k.ref));
}

export function sortKieze(refs: KiezRef[]): KiezRef[] {
	return [...refs].sort((a, b) => {
		const ac = a.composite;
		const bc = b.composite;
		if (ac !== null && bc !== null) return bc - ac;
		if (ac !== null) return -1;
		if (bc !== null) return 1;
		return a.name.localeCompare(b.name, 'de');
	});
}
