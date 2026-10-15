import type { LayerAggregate, LayerAggregatesFile } from './layer-aggregates-types.js';

export const KEY_FIGURE_LAYERS = [
	'zensus-bestandsmiete-2022',
	'zensus-altbau-anteil-2022',
	'laerm-2023',
	'gruenanlagen',
	'klima-pet-2022',
	'milieuschutz-erhaltungsmiete'
] as const;

export type KeyFigureLayer = (typeof KEY_FIGURE_LAYERS)[number];
export type KeyFigureId = 'bestandsmiete' | 'altbau' | 'laerm' | 'gruen' | 'hitze' | 'milieuschutz';
export type KeyFigureUnit = 'eur-m2' | 'percent' | 'celsius' | 'level';

export interface KeyFigure {
	readonly id: KeyFigureId;
	readonly layer: KeyFigureLayer;
	readonly unit: KeyFigureUnit;
	/** `null` = keine Angabe. */
	readonly value: number | null;
	readonly berlin: number | null;
	/** Nur Einheit `level` (Lärm): überwiegende Stufe, `null` = keine Angabe. */
	readonly level: string | null;
	readonly berlinLevel: string | null;
}

export interface KeyFigureRegion {
	readonly kind: 'kiez' | 'bezirk';
	readonly slug: string;
	/** Bezirks-Slug für den Dubletten-Fallback `name-bezirk` (nur Kiez). */
	readonly bezirkSlug?: string | null;
}

interface Spec {
	readonly id: KeyFigureId;
	readonly layer: KeyFigureLayer;
	readonly unit: KeyFigureUnit;
	readonly read: (aggregate: LayerAggregate) => number | null;
	readonly readLevel?: (aggregate: LayerAggregate) => string | null;
}

function finite(n: number | null): number | null {
	return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

/** Überwiegende Stufe; leere Klassen (unter Coverage-Schwelle) oder fehlendes `dominant` = keine Angabe. */
function dominantLevel(a: LayerAggregate): string | null {
	if (a.type !== 'ordinal-distribution') return null;
	if (a.classes.length === 0 || !a.dominant) return null;
	return a.dominant.toLowerCase().trim();
}

const SPECS: readonly Spec[] = [
	{
		id: 'bestandsmiete',
		layer: 'zensus-bestandsmiete-2022',
		unit: 'eur-m2',
		read: (a) => (a.type === 'weighted-mean' ? finite(a.mean) : null)
	},
	{
		id: 'altbau',
		layer: 'zensus-altbau-anteil-2022',
		unit: 'percent',
		read: (a) => (a.type === 'weighted-mean' ? finite(a.mean) : null)
	},
	{
		id: 'laerm',
		layer: 'laerm-2023',
		unit: 'level',
		read: () => null,
		readLevel: dominantLevel
	},
	{
		id: 'gruen',
		layer: 'gruenanlagen',
		unit: 'percent',
		read: (a) => (a.type === 'area-share' ? finite(a.share) : null)
	},
	{
		id: 'hitze',
		layer: 'klima-pet-2022',
		unit: 'celsius',
		read: (a) => (a.type === 'numeric-median' ? finite(a.median) : null)
	},
	{
		id: 'milieuschutz',
		layer: 'milieuschutz-erhaltungsmiete',
		unit: 'percent',
		read: (a) => (a.type === 'coverage-share' ? finite(a.share) : null)
	}
];

function lookup(
	records: Record<string, LayerAggregate>,
	region: KeyFigureRegion
): LayerAggregate | undefined {
	if (Object.hasOwn(records, region.slug)) return records[region.slug];
	if (region.kind === 'kiez' && region.bezirkSlug) {
		const key = `${region.slug}-${region.bezirkSlug}`;
		if (Object.hasOwn(records, key)) return records[key];
	}
	return undefined;
}

/** Baut die sechs Kennzahl-Kacheln aus den Layer-Aggregaten (DB-frei, ohne Wertung). */
export function buildKeyFigures(
	file: LayerAggregatesFile | null,
	region: KeyFigureRegion
): KeyFigure[] {
	return SPECS.map((spec) => {
		const base = { id: spec.id, layer: spec.layer, unit: spec.unit };
		const entry = file?.aggregates?.[spec.layer];
		if (!entry) return { ...base, value: null, berlin: null, level: null, berlinLevel: null };
		const own = lookup((region.kind === 'kiez' ? entry.kiez : entry.bezirk) ?? {}, region);
		const level = spec.readLevel;
		return {
			...base,
			value: own ? spec.read(own) : null,
			berlin: entry.berlin ? spec.read(entry.berlin) : null,
			level: own && level ? level(own) : null,
			berlinLevel: entry.berlin && level ? level(entry.berlin) : null
		};
	});
}
