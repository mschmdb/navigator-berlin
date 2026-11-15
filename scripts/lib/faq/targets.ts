/**
 * scripts/lib/faq/targets.ts (NAV-108): Lädt die FAQ-Ziele (Bezirke, Kieze,
 * Layer) samt Aggregat und Score-Kontext. Geteilt von `render-faq.ts` und
 * `check-faq.ts`, damit Generator und Prüfung dieselben Daten sehen.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getDb } from '../../../src/lib/server/db/index.js';
import {
	bezirkStats,
	kiezStats,
	kiezRank,
	bezirkRank,
	kiezComparison,
	bezirkComparison
} from '../../../src/lib/server/db/schema/index.js';
import type {
	MetricContext,
	TemplateAggregate
} from '../../../src/lib/server/faq/template-renderer.js';
import type {
	BildungAggregat,
	GruenAggregat,
	HeritageAggregat,
	KlimaAggregat,
	LaermAggregat,
	LuftAggregat,
	OepnvAggregat,
	WohnenAggregat
} from '../../../src/lib/server/db/schema/aggregate-types.js';
import {
	readRegionDisplayNames,
	regionDisplayName,
	type RegionDisplayNames
} from '../../../src/lib/data/region-display-names.js';
import type { PageType, TemplateLocale } from '../../../src/lib/server/faq/template-schema.js';
import { buildLayerTargetsFromManifest } from '../../../src/lib/server/og/og-pipeline.js';
import { buildMetricContexts } from '../../../src/lib/server/faq/place-faq.js';
import { getLayerDisplayName } from '../../../src/lib/components/atlas/internal/layer-palette-filter.js';

const REPO_ROOT = process.cwd();
const MANIFEST_PATH = join(REPO_ROOT, 'static/layers/MANIFEST.json');

interface ManifestLayer {
	readonly slug: string;
	readonly bundleGroup: string;
	readonly license: string;
	readonly sourceUpdatedAt?: string;
	readonly sourceUrl: string;
	readonly filename: string;
}
interface Manifest {
	readonly layers: readonly ManifestLayer[];
}

export interface RenderTarget {
	readonly pageType: PageType;
	readonly slug: string;
	readonly name: string;
	/** Locale-spezifische Namen (Layer). Fehlt die Locale, gilt `name`. */
	readonly localizedName?: Readonly<Partial<Record<TemplateLocale, string>>>;
	readonly aggregate: TemplateAggregate;
	readonly metrics?: ReadonlyMap<string, MetricContext>;
}

/** Rang + Vergleich je Score-Dimension pro Kiez (Story 11.3, Gleichstand NAV-108). */
export async function loadKiezMetrics(): Promise<Map<string, Map<string, MetricContext>>> {
	const db = getDb();
	const [ranks, cmps] = await Promise.all([
		db.select().from(kiezRank),
		db.select().from(kiezComparison)
	]);
	return buildMetricContexts(
		ranks,
		cmps.map((c) => ({
			slug: c.slug,
			metricKey: c.metricKey,
			value: c.kiezValue,
			compareValue: c.bezirkMean
		})),
		'bezirk'
	);
}

/** Rang + Vergleich je Score-Dimension pro Bezirk (Story 11.3, Gleichstand NAV-108). */
export async function loadBezirkMetrics(): Promise<Map<string, Map<string, MetricContext>>> {
	const db = getDb();
	const [ranks, cmps] = await Promise.all([
		db.select().from(bezirkRank),
		db.select().from(bezirkComparison)
	]);
	return buildMetricContexts(
		ranks,
		cmps.map((c) => ({
			slug: c.slug,
			metricKey: c.metricKey,
			value: c.bezirkValue,
			compareValue: c.berlinMedian
		})),
		'berlin'
	);
}

const EMPTY_AGGREGATE: TemplateAggregate = {
	laerm: { dominantCategory: null, categoryDistribution: null } as LaermAggregat,
	luft: { dominantCategory: null, categoryDistribution: null } as LuftAggregat,
	gruen: {
		dominantVersorgung: null,
		gruenanlagenCount: null,
		spielplaetzeCount: null
	} as unknown as GruenAggregat,
	klima: { meanPet: null, hotDays: null } as unknown as KlimaAggregat,
	wohnen: { dominantWohnlage: null, dominantMss: null } as unknown as WohnenAggregat,
	oepnv: { stopsPerKm2: null } as unknown as OepnvAggregat,
	bildung: {} as BildungAggregat,
	heritage: {} as HeritageAggregat
};

function rowToAggregate(row: {
	laerm: LaermAggregat;
	luft: LuftAggregat;
	gruen: GruenAggregat;
	klima: KlimaAggregat;
	wohnen: WohnenAggregat;
	oepnv: OepnvAggregat;
	bildung: BildungAggregat;
	heritage: HeritageAggregat;
}): TemplateAggregate {
	return {
		laerm: row.laerm,
		luft: row.luft,
		gruen: row.gruen,
		klima: row.klima,
		wohnen: row.wohnen,
		oepnv: row.oepnv,
		bildung: row.bildung,
		heritage: row.heritage
	};
}

async function readManifest(): Promise<Manifest> {
	const raw = await readFile(MANIFEST_PATH, 'utf-8');
	return JSON.parse(raw) as Manifest;
}

export async function loadBezirkTargets(
	names: RegionDisplayNames,
	metricsBySlug: Map<string, Map<string, MetricContext>>
): Promise<RenderTarget[]> {
	const rows = await getDb()
		.select({
			slug: bezirkStats.slug,
			laerm: bezirkStats.laerm,
			luft: bezirkStats.luft,
			gruen: bezirkStats.gruen,
			klima: bezirkStats.klima,
			wohnen: bezirkStats.wohnen,
			oepnv: bezirkStats.oepnv,
			bildung: bezirkStats.bildung,
			heritage: bezirkStats.heritage
		})
		.from(bezirkStats);
	return rows.map((row) => ({
		pageType: 'bezirk' as const,
		slug: row.slug,
		name: regionDisplayName(names, 'bezirk', row.slug),
		aggregate: rowToAggregate(row),
		metrics: metricsBySlug.get(row.slug)
	}));
}

export async function loadKiezTargets(
	names: RegionDisplayNames,
	metricsBySlug: Map<string, Map<string, MetricContext>>
): Promise<RenderTarget[]> {
	const rows = await getDb()
		.select({
			slug: kiezStats.slug,
			laerm: kiezStats.laerm,
			luft: kiezStats.luft,
			gruen: kiezStats.gruen,
			klima: kiezStats.klima,
			wohnen: kiezStats.wohnen,
			oepnv: kiezStats.oepnv,
			bildung: kiezStats.bildung,
			heritage: kiezStats.heritage
		})
		.from(kiezStats);
	return rows.map((row) => ({
		pageType: 'kiez' as const,
		slug: row.slug,
		name: regionDisplayName(names, 'kiez', row.slug),
		aggregate: rowToAggregate(row),
		metrics: metricsBySlug.get(row.slug)
	}));
}

export async function loadLayerTargets(): Promise<RenderTarget[]> {
	const manifest = await readManifest();
	const layerTargets = buildLayerTargetsFromManifest(manifest.layers);
	return layerTargets.map((t) => {
		const en = getLayerDisplayName(t.slug, { locale: 'en' });
		return {
			pageType: 'layer' as const,
			slug: t.slug,
			name: t.label,
			// getLayerDisplayName liefert für unbekannte Slugs den Roh-Slug.
			localizedName: { en: en !== t.slug ? en : t.label },
			aggregate: EMPTY_AGGREGATE
		};
	});
}

/** Alle Werte je Score-Dimension im Feld der Ziele (für den Wettkampf-Rang der Prüfung). */
export function scoreField(targets: readonly RenderTarget[]): Map<string, number[]> {
	const field = new Map<string, number[]>();
	for (const t of targets) {
		for (const [key, m] of t.metrics ?? []) {
			if (m.value === null || m.rang === null) continue;
			if (!field.has(key)) field.set(key, []);
			field.get(key)!.push(m.value);
		}
	}
	return field;
}

export interface FaqTargets {
	readonly bezirks: RenderTarget[];
	readonly kieze: RenderTarget[];
	readonly layers: RenderTarget[];
}

export async function loadAllTargets(): Promise<FaqTargets> {
	const [kiezMetrics, bezirkMetrics, names] = await Promise.all([
		loadKiezMetrics(),
		loadBezirkMetrics(),
		readRegionDisplayNames()
	]);
	const [bezirks, kieze, layers] = await Promise.all([
		loadBezirkTargets(names, bezirkMetrics),
		loadKiezTargets(names, kiezMetrics),
		loadLayerTargets()
	]);
	return { bezirks, kieze, layers };
}
