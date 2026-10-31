export interface PlrKennzahlInput {
	plrId: string;
	kiezSlug: string | null;
	bezirkSlug: string | null;
	einwohner: number | null;
	flaecheM2: number | null;
	laermDb: number | null;
	laermCount: number | null;
	/** Prozent 0-100 wie im Layer `zensus-altbau-anteil-2022`. */
	altbauAnteil: number | null;
	wohnungen: number | null;
	bioklima: string | null;
	gruen: string | null;
	clubs: number;
	gehweiteEinwohner: number | null;
	gehweiteMitHaltestelle: number | null;
}

export interface Kennzahlen {
	bewohner: number | null;
	bewohnerProKm2: number | null;
	laermDb: number | null;
	/** Anteil 0-1. */
	altbauAnteil: number | null;
	/** 0 (gering) bis 1 (hoch). */
	hitze: number | null;
	/** 0 (schlecht) bis 1 (gut). */
	gruen: number | null;
	clubs: number;
	/** Anteil 0-1. */
	haltestelle400mAnteil: number | null;
}

export interface KiezKennzahlen extends Kennzahlen {
	slug: string;
	bezirkSlug: string;
}

export interface BezirkKennzahlen extends Kennzahlen {
	slug: string;
}

export interface KennzahlenResult {
	kieze: KiezKennzahlen[];
	bezirke: BezirkKennzahlen[];
	/** Planungsraeume ohne Kiez- oder Bezirk-Zuordnung, nicht gezaehlt. */
	ohneKiez: number;
}

export const HITZE_SCORE = { hoch: 1, mittel: 0.5, gering: 0 } as const;
export const GRUEN_SCORE = { gut: 1, mittel: 0.5, schlecht: 0 } as const;

export interface WeightedValue {
	value: number | null;
	weight: number | null;
}

export function weightedMean(items: readonly WeightedValue[]): number | null {
	let sum = 0;
	let weight = 0;
	for (const { value, weight: w } of items) {
		if (value === null || w === null || !(w > 0)) continue;
		sum += value * w;
		weight += w;
	}
	return weight > 0 ? sum / weight : null;
}

export function ordinalScore(
	kategorie: string | null,
	scores: Readonly<Record<string, number>>
): number | null {
	if (kategorie === null || !Object.hasOwn(scores, kategorie)) return null;
	return scores[kategorie];
}

function round(value: number | null, digits: number): number | null {
	if (value === null) return null;
	const f = 10 ** digits;
	return Math.round(value * f) / f;
}

function sumOf(values: readonly (number | null)[]): number | null {
	let sum = 0;
	let seen = false;
	for (const v of values) {
		if (v === null) continue;
		sum += v;
		seen = true;
	}
	return seen ? sum : null;
}

export function aggregateKennzahlen(plrs: readonly PlrKennzahlInput[]): Kennzahlen {
	const bewohner = sumOf(plrs.map((p) => p.einwohner));

	const dichteBasis = plrs.filter((p) => p.einwohner !== null && p.flaecheM2 !== null);
	const flaeche = dichteBasis.reduce((s, p) => s + (p.flaecheM2 ?? 0), 0);
	const dichteEinwohner = dichteBasis.reduce((s, p) => s + (p.einwohner ?? 0), 0);
	const bewohnerProKm2 = flaeche > 0 ? dichteEinwohner / (flaeche / 1_000_000) : null;

	const laerm = weightedMean(plrs.map((p) => ({ value: p.laermDb, weight: p.laermCount })));
	const altbau = weightedMean(plrs.map((p) => ({ value: p.altbauAnteil, weight: p.wohnungen })));
	const hitze = weightedMean(
		plrs.map((p) => ({ value: ordinalScore(p.bioklima, HITZE_SCORE), weight: p.flaecheM2 }))
	);
	const gruen = weightedMean(
		plrs.map((p) => ({ value: ordinalScore(p.gruen, GRUEN_SCORE), weight: p.flaecheM2 }))
	);

	const gitterEinwohner = sumOf(plrs.map((p) => p.gehweiteEinwohner));
	const mitHaltestelle = sumOf(plrs.map((p) => p.gehweiteMitHaltestelle));
	const haltestelle =
		gitterEinwohner !== null && gitterEinwohner > 0 && mitHaltestelle !== null
			? mitHaltestelle / gitterEinwohner
			: null;

	return {
		bewohner,
		bewohnerProKm2: round(bewohnerProKm2, 0),
		laermDb: round(laerm, 1),
		altbauAnteil: round(altbau === null ? null : altbau / 100, 4),
		hitze: round(hitze, 4),
		gruen: round(gruen, 4),
		clubs: plrs.reduce((s, p) => s + p.clubs, 0),
		haltestelle400mAnteil: round(haltestelle, 4)
	};
}

function groupBy<T>(items: readonly T[], keyOf: (item: T) => string): Map<string, T[]> {
	const map = new Map<string, T[]>();
	for (const item of items) {
		const k = keyOf(item);
		const list = map.get(k);
		if (list) list.push(item);
		else map.set(k, [item]);
	}
	return map;
}

const bySlug = (a: { slug: string }, b: { slug: string }): number =>
	a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;

export function buildKennzahlen(plrs: readonly PlrKennzahlInput[]): KennzahlenResult {
	const zugeordnet = plrs.filter((p) => p.kiezSlug && p.bezirkSlug);
	const ohneKiez = plrs.length - zugeordnet.length;

	const kiezBezirk = new Map<string, string>();
	for (const p of zugeordnet) {
		const known = kiezBezirk.get(p.kiezSlug!);
		if (known !== undefined && known !== p.bezirkSlug) {
			throw new Error(`Kiez "${p.kiezSlug}" liegt in zwei Bezirken: ${known}, ${p.bezirkSlug}`);
		}
		kiezBezirk.set(p.kiezSlug!, p.bezirkSlug!);
	}

	const kieze = [...groupBy(zugeordnet, (p) => p.kiezSlug!)]
		.map(([slug, list]) => ({
			slug,
			bezirkSlug: kiezBezirk.get(slug)!,
			...aggregateKennzahlen(list)
		}))
		.sort(bySlug);
	const bezirke = [...groupBy(zugeordnet, (p) => p.bezirkSlug!)]
		.map(([slug, list]) => ({ slug, ...aggregateKennzahlen(list) }))
		.sort(bySlug);
	return { kieze, bezirke, ohneKiez };
}
