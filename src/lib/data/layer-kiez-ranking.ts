/**
 * L7: Kiez-Rangliste für Layer-Seiten, ohne DB.
 *
 * Quellen: `layer-aggregates.json` (Kiez-Aggregate) und `region-composites.json`
 * (Kiez-Score gesamt). Die Funktion ist rein und testbar.
 *
 * Wertung:
 * - Kiez-Score gesamt: nur die bestbewerteten Kieze (Anti-Stigma, keine Flop-Liste).
 * - Ausgewählte Layer mit Zahlenwert: höchste und niedrigste Werte, ohne Wertung.
 * - Alle anderen Layer, auch Lärm und Luft: keine Rangliste.
 */

import type { LayerAggregate, LayerAggregatesFile } from './layer-aggregates-types.js';
import { buildKiezSlugs } from './internal/kiez-slug.js';

export const RANKING_SIZE = 5;
/** Unter dieser Zahl Einträge entfällt eine Liste und nur der Gleichstand-Hinweis bleibt. */
export const MIN_LIST_SIZE = 3;

export type RankingVariant = 'score' | 'neutral';
export type RankingUnit = 'score' | 'eur-m2' | 'percent' | 'celsius';

export interface RankingRegion {
	readonly slug: string;
	readonly name: string;
	readonly bezirkName: string;
}

export interface RankingEntry extends RankingRegion {
	readonly value: number;
}

export interface RankingList {
	readonly entries: readonly RankingEntry[];
	/** Gleichstand am Listenende: die Liste endet davor, `count` Kieze teilen `value`. */
	readonly tie: { readonly count: number; readonly value: number } | null;
}

export interface LayerKiezRanking {
	readonly variant: RankingVariant;
	readonly unit: RankingUnit;
	readonly top: RankingList;
	/** `null` bei der Score-Variante (keine Flop-Liste). */
	readonly bottom: RankingList | null;
}

export interface LayerKiezRankingInput {
	readonly layerSlug: string;
	readonly aggregates: LayerAggregatesFile | null;
	readonly composites: { readonly kiez: Readonly<Record<string, number | null>> } | null;
	readonly regions: ReadonlyMap<string, RankingRegion>;
}

export const SCORE_LAYER = 'kiez-score-gesamt';

/** Explizite Einheit je unterstütztem Layer. Unbekannte Slugs haben keine Rangliste. */
const NEUTRAL_LAYER_UNITS: Readonly<Record<string, RankingUnit>> = {
	'zensus-bestandsmiete-2022': 'eur-m2',
	'zensus-altbau-anteil-2022': 'percent',
	gruenanlagen: 'percent',
	spielplaetze: 'percent',
	'denkmal-2024': 'percent',
	'klima-kaltlufteinwirkbereich-2022': 'percent',
	'klima-leitbahnkorridor-2022': 'percent',
	'milieuschutz-erhaltungsmiete': 'percent',
	'milieuschutz-staedtebau': 'percent',
	'klima-pet-2022': 'celsius'
};

function finite(n: number | null | undefined): number | null {
	return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function neutralValue(aggregate: LayerAggregate): number | null {
	switch (aggregate.type) {
		case 'weighted-mean':
			return finite(aggregate.mean);
		case 'numeric-median':
			return finite(aggregate.median);
		case 'area-share':
		case 'coverage-share':
			return finite(aggregate.share);
		default:
			return null;
	}
}

function byValueDesc(a: RankingEntry, b: RankingEntry): number {
	return b.value - a.value || a.name.localeCompare(b.name, 'de');
}

function byValueAsc(a: RankingEntry, b: RankingEntry): number {
	return a.value - b.value || a.name.localeCompare(b.name, 'de');
}

/**
 * Schneidet auf `RANKING_SIZE`. Liegt zwischen Platz 5 und 6 ein Gleichstand, endet die Liste
 * vor der Gleichstandsgruppe. Bleiben weniger als `MIN_LIST_SIZE` Einträge, entfällt die Liste.
 */
function cutList(sorted: readonly RankingEntry[]): RankingList {
	const atCut =
		sorted.length > RANKING_SIZE && sorted[RANKING_SIZE - 1].value === sorted[RANKING_SIZE].value;
	if (!atCut) return { entries: sorted.slice(0, RANKING_SIZE), tie: null };
	const value = sorted[RANKING_SIZE - 1].value;
	const count = sorted.filter((e) => e.value === value).length;
	const entries = sorted.slice(
		0,
		sorted.findIndex((e) => e.value === value)
	);
	return { entries: entries.length < MIN_LIST_SIZE ? [] : entries, tie: { count, value } };
}

function collect(
	values: Readonly<Record<string, number | null>>,
	regions: ReadonlyMap<string, RankingRegion>
): RankingEntry[] {
	const entries: RankingEntry[] = [];
	for (const [slug, value] of Object.entries(values)) {
		const region = regions.get(slug);
		const v = finite(value);
		if (region && v !== null) entries.push({ ...region, value: v });
	}
	return entries;
}

function scoreRanking(input: LayerKiezRankingInput): LayerKiezRanking | null {
	if (!input.composites) return null;
	// Sortierung nach Rohwert, gerundet wird nur für die Anzeige.
	const entries = collect(input.composites.kiez, input.regions)
		.sort(byValueDesc)
		.slice(0, RANKING_SIZE)
		.map((e) => ({ ...e, value: Math.round(e.value) }));
	if (entries.length === 0) return null;
	return { variant: 'score', unit: 'score', top: { entries, tie: null }, bottom: null };
}

function neutralRanking(input: LayerKiezRankingInput): LayerKiezRanking | null {
	const unit = NEUTRAL_LAYER_UNITS[input.layerSlug];
	const entry = input.aggregates?.aggregates[input.layerSlug];
	if (!unit || !entry) return null;
	const values = Object.fromEntries(
		Object.entries(entry.kiez).map(([slug, a]) => [slug, neutralValue(a)])
	);
	const desc = collect(values, input.regions).sort(byValueDesc);
	if (desc.length === 0 || desc[0].value === desc[desc.length - 1].value) return null;
	const top = cutList(desc);
	const shown = new Set(top.entries.map((e) => e.slug));
	const bottom = cutList(desc.filter((e) => !shown.has(e.slug)).sort(byValueAsc));
	return { variant: 'neutral', unit, top, bottom };
}

/** `null`, wenn der Layer keine Kiez-Rangliste hat. */
export function buildLayerKiezRanking(input: LayerKiezRankingInput): LayerKiezRanking | null {
	if (input.layerSlug === SCORE_LAYER) return scoreRanking(input);
	return neutralRanking(input);
}

export interface RankingLorCollection {
	readonly features: readonly { readonly properties?: Record<string, unknown> | null }[];
}

/**
 * Slug -> Kiez-Name und Bezirk für alle LOR-Bezirksregionen. Die Slugs entstehen über
 * `buildKiezSlugs` (Dubletten-Fallback `name-bezirk`), identisch zu Routen und Aggregaten.
 */
export function buildRankingRegions(
	lor: RankingLorCollection,
	bezirkCodeToName: ReadonlyMap<string, string>
): Map<string, RankingRegion> {
	const refs = lor.features.flatMap((feature) => {
		const props = feature.properties ?? {};
		const name =
			typeof props.BZR_NAME === 'string' ? props.BZR_NAME.replace(/\s+/g, ' ').trim() : null;
		const bez = props.BEZ;
		const code =
			typeof bez === 'string' ? bez : typeof bez === 'number' ? String(bez).padStart(2, '0') : null;
		if (!name || !code) return [];
		return [{ name, bezirk: bezirkCodeToName.get(code) ?? '' }];
	});
	const slugs = buildKiezSlugs(refs);
	const regions = new Map<string, RankingRegion>();
	refs.forEach((ref, i) => {
		regions.set(slugs[i], { slug: slugs[i], name: ref.name, bezirkName: ref.bezirk });
	});
	return regions;
}
