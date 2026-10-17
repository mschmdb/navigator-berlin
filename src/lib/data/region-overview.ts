import { buildKiezSlugs, type KiezNameRef } from './internal/kiez-slug.js';
import {
	bezirkSlugFromName,
	cleanName,
	type FeatureCollectionLike
} from './region-display-names.js';

/** Form von `static/kiez-scores/region-composites.json`, soweit die Übersichtsseiten sie brauchen. */
export interface CompositesLike {
	readonly kiez?: Readonly<Record<string, unknown>>;
	readonly bezirk?: Readonly<Record<string, unknown>>;
}

export interface OverviewKiez {
	readonly slug: string;
	readonly name: string;
	/** Auf ganze Zahlen gerundeter Kiez-Score, `null` ohne Wert. */
	readonly composite: number | null;
}

export interface OverviewBezirk {
	readonly slug: string;
	readonly name: string;
	readonly einwohner: number | null;
	readonly composite: number | null;
	readonly kieze: readonly OverviewKiez[];
}

interface BuildInput {
	readonly lorFc: FeatureCollectionLike;
	readonly bezirkeFc: FeatureCollectionLike;
	/** `null`, wenn die Composite-Datei fehlt: die Listen bleiben vollständig, ohne Scores. */
	readonly composites: CompositesLike | null;
	/** Einwohner je Bezirk-Slug. */
	readonly einwohner: ReadonlyMap<string, number>;
	/** Fehlende Einwohnerzahlen gelten als Problem (nur `/bezirke` zeigt sie). */
	readonly requireEinwohner?: boolean;
}

export interface RegionOverview {
	readonly bezirke: OverviewBezirk[];
	/** Lesbare Befunde zu Vollständigkeit und Datenqualität; leer, wenn alles passt. */
	readonly problems: string[];
}

const COLLATOR_LOCALE = 'de';

function roundedScore(
	source: Readonly<Record<string, unknown>> | undefined,
	slug: string
): number | null {
	const value = source?.[slug];
	return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;
}

/**
 * Pure: gruppiert alle Kieze nach Bezirk, alphabetisch sortiert (kein Score-Ranking,
 * Anti-Stigma ADR-015). Slugs folgen `buildKiezSlugs`, damit Links und Composite-Keys
 * zu den Routen passen. Kieze ohne bekannten Bezirk entfallen.
 */
export function buildRegionOverview({
	lorFc,
	bezirkeFc,
	composites,
	einwohner,
	requireEinwohner = false
}: BuildInput): RegionOverview {
	const problems: string[] = [];
	const bezCodeToName = new Map<string, string>();
	for (const f of bezirkeFc.features) {
		const props = f.properties ?? {};
		const schluessel = props.Schluessel_gesamt;
		const name = props.Gemeinde_name;
		if (typeof schluessel === 'string' && typeof name === 'string') {
			bezCodeToName.set(schluessel.slice(-2).padStart(2, '0'), cleanName(name));
		}
	}

	const refs: (KiezNameRef & { readonly bezirkSlug: string })[] = [];
	for (const feature of lorFc.features) {
		const props = feature.properties ?? {};
		const name =
			typeof props.BZR_NAME === 'string'
				? props.BZR_NAME
				: typeof props.NAME === 'string'
					? props.NAME
					: null;
		if (!name) continue;
		const bez = typeof props.BEZ === 'string' ? props.BEZ : null;
		const bezirk = bez ? (bezCodeToName.get(bez.padStart(2, '0')) ?? '') : '';
		refs.push({ name: cleanName(name), bezirk, bezirkSlug: bezirkSlugFromName(bezirk) });
	}
	const slugs = buildKiezSlugs(refs);

	const byBezirk = new Map<string, OverviewKiez[]>();
	const seenSlugs = new Set<string>();
	refs.forEach((ref, idx) => {
		const slug = slugs[idx]!;
		if (!ref.bezirk) {
			problems.push(`Kiez "${ref.name}" ohne zuordenbaren Bezirk (BEZ fehlt oder unbekannt).`);
			return;
		}
		if (!slug) {
			problems.push(`Kiez "${ref.name}" ergibt einen leeren Slug.`);
			return;
		}
		if (seenSlugs.has(slug)) {
			problems.push(`Kiez-Slug "${slug}" kommt doppelt vor.`);
			return;
		}
		seenSlugs.add(slug);
		const list = byBezirk.get(ref.bezirkSlug) ?? [];
		list.push({ slug, name: ref.name, composite: roundedScore(composites?.kiez, slug) });
		byBezirk.set(ref.bezirkSlug, list);
	});

	const byName = (a: { name: string }, b: { name: string }): number =>
		a.name.localeCompare(b.name, COLLATOR_LOCALE);

	const bezirke = [...bezCodeToName.values()]
		.map((name): OverviewBezirk => {
			const slug = bezirkSlugFromName(name);
			return {
				slug,
				name,
				einwohner: einwohner.get(slug) ?? null,
				composite: roundedScore(composites?.bezirk, slug),
				kieze: (byBezirk.get(slug) ?? []).sort(byName)
			};
		})
		.sort(byName);

	const kieze = bezirke.flatMap((b) => b.kieze);
	if (composites) {
		const kiezScores = kieze.filter((k) => k.composite !== null).length;
		if (kiezScores < kieze.length) {
			problems.push(`Nur ${kiezScores} von ${kieze.length} Kiez-Scores in den Composites.`);
		}
		const bezirkScores = bezirke.filter((b) => b.composite !== null).length;
		if (bezirkScores < bezirke.length) {
			problems.push(
				`Nur ${bezirkScores} von ${bezirke.length} Kiez-Scores für Bezirke in den Composites.`
			);
		}
	}
	if (requireEinwohner) {
		for (const b of bezirke) {
			if (b.einwohner === null) problems.push(`Einwohnerzahl für Bezirk "${b.slug}" fehlt.`);
		}
	}
	return { bezirke, problems };
}

/** Sprungziel-ID eines Bezirksabschnitts auf `/kieze`; Übersicht und Detailseiten teilen sie. */
export function bezirkAnchorId(bezirkSlug: string): string {
	return `bezirk-${bezirkSlug}`;
}
