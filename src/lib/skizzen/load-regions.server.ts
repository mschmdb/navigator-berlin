import { readRegionDisplayNames, regionDisplayName } from '$lib/data/region-display-names.js';
import { buildKeyFigures } from '$lib/data/region-key-figures.js';
import type { LayerAggregatesFile } from '$lib/data/layer-aggregates-types.js';
import { readLayerAggregatesFile } from '$lib/server/profile/meta-sources.js';
import { FIGURES, type DimValues, type FigureValues, type RegionSnapshot } from './types';

type ScoreRow = Readonly<Record<keyof DimValues, number | null>> & { readonly slug: string };

function figuresFor(
	file: LayerAggregatesFile | null,
	region: { kind: 'kiez' | 'bezirk'; slug: string; bezirkSlug?: string | null },
	pick: 'value' | 'berlin' = 'value'
): FigureValues {
	const byId = new Map(buildKeyFigures(file, region).map((f) => [f.id, f[pick]]));
	return Object.fromEntries(FIGURES.map((id) => [id, byId.get(id) ?? null])) as FigureValues;
}

function dimsOf(row: ScoreRow): DimValues {
	return {
		composite: row.composite,
		ruheLuft: row.ruheLuft,
		gruenHitze: row.gruenHitze,
		mobilitaet: row.mobilitaet,
		versorgung: row.versorgung,
		wohnschutz: row.wohnschutz,
		kultur: row.kultur,
		kriminalitaet: row.kriminalitaet
	};
}

/** Berlin-Gesamtwerte der Rohwerte (Layer-Aggregat über ganz Berlin, kein Median der Kieze). */
export async function readBerlinFigures(): Promise<FigureValues> {
	const file = await readLayerAggregatesFile();
	return figuresFor(file, { kind: 'bezirk', slug: '' }, 'berlin');
}

/** Alle 143 Kieze mit Score-Dimensionen und Rohwerten. Leer ohne DB. */
export async function loadKiezRegions(): Promise<RegionSnapshot[]> {
	if (!process.env.DATABASE_URL) return [];
	const [{ getDb }, { kiezScore }, names, file] = await Promise.all([
		import('$lib/server/db/index.js'),
		import('$lib/server/db/schema/index.js'),
		readRegionDisplayNames(),
		readLayerAggregatesFile()
	]);
	const rows = await getDb().select().from(kiezScore);
	return rows.map((row) => ({
		slug: row.slug,
		name: regionDisplayName(names, 'kiez', row.slug),
		parentSlug: row.bezirkSlug,
		parentName: regionDisplayName(names, 'bezirk', row.bezirkSlug),
		dims: dimsOf(row),
		figures: figuresFor(file, { kind: 'kiez', slug: row.slug, bezirkSlug: row.bezirkSlug })
	}));
}

/** Alle 12 Bezirke. Leer ohne DB. */
export async function loadBezirkRegions(): Promise<RegionSnapshot[]> {
	if (!process.env.DATABASE_URL) return [];
	const [{ getDb }, { bezirkScore }, names, file] = await Promise.all([
		import('$lib/server/db/index.js'),
		import('$lib/server/db/schema/index.js'),
		readRegionDisplayNames(),
		readLayerAggregatesFile()
	]);
	const rows = await getDb().select().from(bezirkScore);
	return rows.map((row) => ({
		slug: row.slug,
		name: regionDisplayName(names, 'bezirk', row.slug),
		parentSlug: null,
		parentName: null,
		dims: dimsOf(row),
		figures: figuresFor(file, { kind: 'bezirk', slug: row.slug })
	}));
}
