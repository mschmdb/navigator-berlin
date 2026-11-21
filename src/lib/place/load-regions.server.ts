import { readRegionDisplayNames, regionDisplayName } from '#lib/data/region-display-names.js';
import { loadTopicData } from './topics.server';
import { LABELS, METRICS, type LabelValues, type MetricValues } from './topics';
import type { DimValues, RegionSnapshot } from './types';

const EMPTY_TOPICS = {
	metrics: Object.fromEntries(METRICS.map((m) => [m, null])) as MetricValues,
	labels: Object.fromEntries(LABELS.map((l) => [l, null])) as LabelValues
};

type ScoreRow = Readonly<Record<keyof DimValues, number | null>> & { readonly slug: string };

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

/** Alle 143 Kieze mit Score-Dimensionen und Rohwerten. Leer ohne DB. */
export async function loadKiezRegions(): Promise<RegionSnapshot[]> {
	if (!process.env.DATABASE_URL) return [];
	const [{ getDb }, { kiezScore }, names, topics] = await Promise.all([
		import('#lib/server/db/index.js'),
		import('#lib/server/db/schema/index.js'),
		readRegionDisplayNames(),
		loadTopicData()
	]);
	const rows = await getDb().select().from(kiezScore);
	return rows.map((row) => ({
		slug: row.slug,
		name: regionDisplayName(names, 'kiez', row.slug),
		parentSlug: row.bezirkSlug,
		parentName: regionDisplayName(names, 'bezirk', row.bezirkSlug),
		dims: dimsOf(row),
		...(topics.kiez.get(row.slug) ?? EMPTY_TOPICS)
	}));
}

/** Alle 12 Bezirke. Leer ohne DB. */
export async function loadBezirkRegions(): Promise<RegionSnapshot[]> {
	if (!process.env.DATABASE_URL) return [];
	const [{ getDb }, { bezirkScore }, names, topics] = await Promise.all([
		import('#lib/server/db/index.js'),
		import('#lib/server/db/schema/index.js'),
		readRegionDisplayNames(),
		loadTopicData()
	]);
	const rows = await getDb().select().from(bezirkScore);
	return rows.map((row) => ({
		slug: row.slug,
		name: regionDisplayName(names, 'bezirk', row.slug),
		parentSlug: null,
		parentName: null,
		dims: dimsOf(row),
		...(topics.bezirk.get(row.slug) ?? EMPTY_TOPICS)
	}));
}
