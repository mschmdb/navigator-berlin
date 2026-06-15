/**
 * scripts/lib/profiles/build.ts (Story 11.6/11.7).
 *
 * Geteilte Input-Erzeugung für KI-Profile. Wird vom Generator
 * (`build-kiez-profiles.ts`) UND vom Fakten-Lint (`lint-profiles.ts`) genutzt,
 * damit der Lint exakt denselben ProfileInput rekonstruiert wie die Generierung.
 */

import { getDb } from '../../../src/lib/server/db/index.js';
import {
	kiezScore,
	bezirkScore,
	kiezStats,
	bezirkStats,
	kiezRank,
	bezirkRank,
	kiezComparison,
	bezirkComparison
} from '../../../src/lib/server/db/schema/index.js';
import { hashInput, type ProfileInput, type ProfileDim } from './input.js';

export const DIMS: readonly { key: string; label: string }[] = [
	{ key: 'ruheLuft', label: 'Ruhe & Luft' },
	{ key: 'gruenHitze', label: 'Grün & Hitze' },
	{ key: 'mobilitaet', label: 'Mobilität' },
	{ key: 'versorgung', label: 'Versorgung' },
	{ key: 'wohnschutz', label: 'Wohnschutz' },
	// Story 13.8: Kultur als eigenständige Dimension (Option C, nicht im Composite). Fließt als
	// Grounding-Input ins Profil ein, damit der Fakten-Lint Kultur-Zahlen kennt.
	{ key: 'kultur', label: 'Kultur' }
	// Story 14.8: Kriminalität (Option C) ist BEWUSST NICHT hier — sie darf nicht in die Prosa
	// lecken (Stigma/Redlining, ADR-019). Der Karten-Layer + Inspector reichen. Dadurch ändert
	// sich der inputHash durch Kriminalität nicht → keine teure Regeneration (anders als 13.8).
];

export function slugToName(slug: string): string {
	return slug
		.split('-')
		.map((p) => (p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p))
		.join(' ');
}

function num(v: { value: number } | null | undefined): number | null {
	return v && typeof v.value === 'number' ? v.value : null;
}
function str(v: { value: unknown } | null | undefined): string | null {
	return v && typeof v.value === 'string' ? v.value : null;
}

interface RankRow {
	metricKey: string;
	rang: number | null;
	quartil: number | null;
	total: number;
}
interface CmpRow {
	metricKey: string;
	bezirkMean?: number | null;
	berlinMedian: number | null;
}

interface AreaRaw {
	slug: string;
	bezirkSlug: string | null;
	score: Record<string, number | null>;
	stats: Record<string, Record<string, { value: unknown } | null>>;
	ranks: Map<string, RankRow>;
	cmps: Map<string, CmpRow>;
}

export function buildInput(pageType: 'kiez' | 'bezirk', area: AreaRaw): ProfileInput {
	const { slug, bezirkSlug, score, stats, ranks, cmps } = area;
	const dims: ProfileDim[] = DIMS.map(({ key, label }) => {
		const r = ranks.get(key);
		const c = cmps.get(key);
		return {
			label,
			score: (score[key] as number | null) ?? null,
			rang: r?.rang ?? null,
			total: r?.total ?? 0,
			bezirkMean: c?.bezirkMean ?? null,
			berlinMedian: c?.berlinMedian ?? null
		};
	});
	const compRank = ranks.get('composite');
	const facts: Record<string, string | number> = {};
	const put = (k: string, v: string | number | null) => {
		if (v !== null && v !== undefined) facts[k] = v;
	};
	put('laermKlasse', str(stats.laerm?.dominantCategory));
	put('gruenversorgung', str(stats.gruen?.dominantVersorgung));
	put('gruenanlagen', num(stats.gruen?.gruenanlagenCount));
	put('spielplaetze', num(stats.gruen?.spielplaetzeCount));
	put('petGrad', num(stats.klima?.meanPet));
	put('oepnvStopsProKm2', num(stats.oepnv?.stopsPerKm2));
	put('uBahnHalte', num(stats.oepnv?.uBahnCount));
	put('sBahnHalte', num(stats.oepnv?.sBahnCount));
	put('tramHalte', num(stats.oepnv?.tramCount));
	put('busHalte', num(stats.oepnv?.busCount));
	put('wohnlage', str(stats.wohnen?.dominantWohnlage));
	put('mss', str(stats.wohnen?.dominantMss));

	return {
		pageType,
		slug,
		name: slugToName(slug),
		bezirk: bezirkSlug ? slugToName(bezirkSlug) : null,
		einwohner: null,
		flaecheHa: null,
		composite: {
			score: (score.composite as number | null) ?? null,
			rang: compRank?.rang ?? null,
			total: compRank?.total ?? 0
		},
		dims,
		facts
	};
}

async function loadAreas(pageType: 'kiez' | 'bezirk'): Promise<AreaRaw[]> {
	const db = getDb();
	const scoreTbl = pageType === 'kiez' ? kiezScore : bezirkScore;
	const statsTbl = pageType === 'kiez' ? kiezStats : bezirkStats;
	const rankTbl = pageType === 'kiez' ? kiezRank : bezirkRank;
	const cmpTbl = pageType === 'kiez' ? kiezComparison : bezirkComparison;

	const [scores, stats, ranks, cmps] = await Promise.all([
		db.select().from(scoreTbl),
		db.select().from(statsTbl),
		db.select().from(rankTbl),
		db.select().from(cmpTbl)
	]);
	const statsBySlug = new Map(stats.map((s: Record<string, unknown>) => [s.slug as string, s]));
	const ranksBySlug = new Map<string, Map<string, RankRow>>();
	for (const r of ranks as (RankRow & { slug: string })[]) {
		const m = ranksBySlug.get(r.slug) ?? new Map();
		m.set(r.metricKey, r);
		ranksBySlug.set(r.slug, m);
	}
	const cmpsBySlug = new Map<string, Map<string, CmpRow>>();
	for (const c of cmps as (CmpRow & { slug: string })[]) {
		const m = cmpsBySlug.get(c.slug) ?? new Map();
		m.set(c.metricKey, c);
		cmpsBySlug.set(c.slug, m);
	}
	return (scores as Record<string, unknown>[]).map((s) => {
		const slug = s.slug as string;
		return {
			slug,
			bezirkSlug: (s.bezirkSlug as string | undefined) ?? null,
			score: s as Record<string, number | null>,
			stats: (statsBySlug.get(slug) ?? {}) as Record<
				string,
				Record<string, { value: unknown } | null>
			>,
			ranks: ranksBySlug.get(slug) ?? new Map(),
			cmps: cmpsBySlug.get(slug) ?? new Map()
		};
	});
}

export interface BuiltInput {
	readonly pageType: 'kiez' | 'bezirk';
	readonly slug: string;
	readonly name: string;
	readonly inputHash: string;
	readonly input: ProfileInput;
}

/** Baut alle ProfileInputs (+ Hash) für die gewünschten Page-Types. */
export async function buildAllInputs(types: readonly ('kiez' | 'bezirk')[]): Promise<BuiltInput[]> {
	const out: BuiltInput[] = [];
	for (const pageType of types) {
		const areas = await loadAreas(pageType);
		for (const area of areas) {
			const input = buildInput(pageType, area);
			out.push({ pageType, slug: area.slug, name: input.name, inputHash: hashInput(input), input });
		}
	}
	return out;
}
