/**
 * Rechenkern für `scripts/build-stories-wahl.ts` (gh-187): Zweitstimmen der
 * Wahlbezirke je Bezirk und für Berlin gesamt aufsummieren. Pure, ohne Netz.
 */
import type {
	BezirkWahlen,
	ParteiErgebnis,
	StoriesWahlData,
	WahlMeta,
	WahlSlug,
	WahlZahlen
} from '../../../src/lib/stories/wahl-quadrate/types.js';
import { BERLIN_BEZIRK_BY_CODE } from '../../wahlen/lib/bezirk-codes.js';

/** Die Felder einer transformierten Wahlbezirks-Zeile, die der Kern braucht. */
export interface ZweitstimmenRow {
	bezirkCode: string;
	wahlberechtigte: number;
	waehlende: number;
	gueltig: number;
	votes: readonly { parteiKurzname: string; stimmen: number }[];
}

interface Summe {
	wahlberechtigte: number;
	waehlende: number;
	gueltig: number;
	stimmen: Map<string, number>;
}

const emptySumme = (): Summe => ({
	wahlberechtigte: 0,
	waehlende: 0,
	gueltig: 0,
	stimmen: new Map()
});

function toZahlen(s: Summe): WahlZahlen {
	const parteien: ParteiErgebnis[] = [...s.stimmen.entries()]
		.map(([kurzname, stimmen]) => ({
			kurzname,
			stimmen,
			anteil: s.gueltig > 0 ? stimmen / s.gueltig : 0
		}))
		.sort((a, b) => b.stimmen - a.stimmen || a.kurzname.localeCompare(b.kurzname));
	return {
		wahlberechtigte: s.wahlberechtigte,
		waehlende: s.waehlende,
		gueltig: s.gueltig,
		wahlbeteiligung: s.wahlberechtigte > 0 ? s.waehlende / s.wahlberechtigte : 0,
		parteien
	};
}

function assertPartySum(s: Summe, label: string): void {
	let total = 0;
	for (const v of s.stimmen.values()) total += v;
	if (total !== s.gueltig) {
		throw new Error(`${label}: Parteistimmen ${total} ergeben nicht die Gültigen ${s.gueltig}`);
	}
}

export function sumByBezirk(
	rows: readonly ZweitstimmenRow[],
	label = 'Wahl'
): Map<string, WahlZahlen> {
	const sums = new Map<string, Summe>();
	for (const r of rows) {
		const code = r.bezirkCode.padStart(2, '0');
		if (!BERLIN_BEZIRK_BY_CODE.has(code)) throw new Error(`Unbekannter Bezirkscode ${code}`);
		const s = sums.get(code) ?? emptySumme();
		s.wahlberechtigte += r.wahlberechtigte;
		s.waehlende += r.waehlende;
		s.gueltig += r.gueltig;
		for (const v of r.votes)
			s.stimmen.set(v.parteiKurzname, (s.stimmen.get(v.parteiKurzname) ?? 0) + v.stimmen);
		sums.set(code, s);
	}
	const result = new Map<string, WahlZahlen>();
	for (const code of [...sums.keys()].sort()) {
		const s = sums.get(code) as Summe;
		assertPartySum(s, `${label}, Bezirk ${code}`);
		result.set(code, toZahlen(s));
	}
	return result;
}

export function sumBerlin(bezirke: readonly WahlZahlen[]): WahlZahlen {
	const s = emptySumme();
	for (const b of bezirke) {
		s.wahlberechtigte += b.wahlberechtigte;
		s.waehlende += b.waehlende;
		s.gueltig += b.gueltig;
		for (const p of b.parteien)
			s.stimmen.set(p.kurzname, (s.stimmen.get(p.kurzname) ?? 0) + p.stimmen);
	}
	return toZahlen(s);
}

export interface WahlInput {
	meta: WahlMeta;
	rows: readonly ZweitstimmenRow[];
}

export function buildStoriesWahl(input: {
	generatedAt: string;
	wahlen: readonly WahlInput[];
}): StoriesWahlData {
	const codes = [...BERLIN_BEZIRK_BY_CODE.keys()].sort();
	const perWahl = input.wahlen.map(({ meta, rows }) => {
		const bezirke = sumByBezirk(rows, meta.slug);
		const missing = codes.filter((c) => !bezirke.has(c));
		if (missing.length > 0) {
			throw new Error(`${meta.slug}: keine Daten für Bezirk ${missing.join(', ')}`);
		}
		return { slug: meta.slug, bezirke };
	});

	const bezirke: BezirkWahlen[] = codes.map((nr) => {
		const info = BERLIN_BEZIRK_BY_CODE.get(nr) as { slug: string; name: string };
		const wahlen = Object.fromEntries(
			perWahl.map((w) => [w.slug, w.bezirke.get(nr) as WahlZahlen])
		) as Record<WahlSlug, WahlZahlen>;
		return { nr, slug: info.slug, name: info.name, wahlen };
	});

	const berlin = Object.fromEntries(
		perWahl.map((w) => [w.slug, sumBerlin([...w.bezirke.values()])])
	) as Record<WahlSlug, WahlZahlen>;

	return {
		schemaVersion: 1,
		generatedAt: input.generatedAt,
		stimmtyp: 'zweitstimme',
		wahlen: input.wahlen.map((w) => w.meta),
		bezirke,
		berlin
	};
}
