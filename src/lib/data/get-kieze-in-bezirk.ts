/**
 * Story 5.9 AC-7 + AC-8: Selector fuer Internal-Linking-Bloecke.
 *
 * - `getKiezeInBezirk(bezirkSlug)`: alle 143 LOR-Bezirksregionen filtern auf
 *   den passenden Bezirk anhand der BEZ-Code-Map (BezirkCode → BezirkSlug).
 *   Sortierung primaer kiez_score.composite desc, sekundaer Name alphabetisch
 *   wenn Score fehlt.
 * - `getSiblingKieze(parentBezirkSlug, currentKiezSlug)`: alle Geschwister
 *   im selben Bezirk ohne den aktuellen, alphabetisch.
 *
 * Beide Funktionen lesen direkt aus den geladenen GeoJSON-FeatureCollections;
 * Postgres-`kiez_score`-Join macht der Aufrufer (Server-Load), damit der Helper
 * Server-Pfad-unabhaengig + im Test fixturable bleibt.
 */

import { normalizeSlug } from './internal/slug.js';

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

export function buildKiezeInBezirk(input: BuildKiezListInput): KiezRef[] {
	const refs: KiezRef[] = [];
	for (const feature of input.lorFeatureCollection.features) {
		const props = feature.properties ?? {};
		const name = readKiezName(props);
		const code = readBezirkCode(props);
		if (!name || !code) continue;
		const parentSlug = input.bezirkCodeToSlug.get(code);
		if (parentSlug !== input.bezirkSlug) continue;
		const slug = normalizeSlug(name);
		refs.push({
			slug,
			name,
			composite: input.scores.get(slug) ?? null
		});
	}
	return sortKieze(refs);
}

function sortKieze(refs: KiezRef[]): KiezRef[] {
	return [...refs].sort((a, b) => {
		const ac = a.composite;
		const bc = b.composite;
		if (ac !== null && bc !== null) return bc - ac;
		if (ac !== null) return -1;
		if (bc !== null) return 1;
		return a.name.localeCompare(b.name, 'de');
	});
}

export function pickTop(refs: readonly KiezRef[], n: number): KiezRef[] {
	return refs.slice(0, n);
}

export interface SiblingKiezeInput {
	readonly kieze: readonly KiezRef[];
	readonly currentSlug: string;
}

export function pickSiblings(input: SiblingKiezeInput, n: number): KiezRef[] {
	const siblings = input.kieze.filter((k) => k.slug !== input.currentSlug);
	return [...siblings]
		.sort((a, b) => a.name.localeCompare(b.name, 'de'))
		.slice(0, n);
}
