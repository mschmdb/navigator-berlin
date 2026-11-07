/**
 * Was das Handbuch „Berlin in Quadraten“ (#190) aus `stories-wahl.json` braucht:
 * je Bezirk und Wahl die Eingabe für `derive` und die Wahlbeteiligung. Stimmen und
 * Quellen bleiben auf dem Server, die Anteile sind auf 6 Stellen gerundet. So bleibt
 * die prerenderte Seite klein.
 */
import { toElectionShares } from './eingabe';
import type { WahlTyp } from './parteien';
import type { ElectionShares, StoriesWahlData, WahlSlug } from './types';

export interface HandbuchWahl {
	readonly slug: WahlSlug;
	readonly typ: WahlTyp;
	readonly jahr: number;
}

export interface HandbuchErgebnis {
	readonly e: ElectionShares;
	/** Wählende / Wahlberechtigte, 0 bis 1. */
	readonly turnout: number;
}

export interface HandbuchBezirk {
	readonly nr: string;
	readonly slug: string;
	readonly name: string;
	readonly wahlen: Readonly<Record<WahlSlug, HandbuchErgebnis>>;
}

export interface HandbuchDaten {
	readonly wahlen: readonly HandbuchWahl[];
	readonly bezirke: readonly HandbuchBezirk[];
}

const round = (v: number): number => Math.round(v * 1e6) / 1e6;

function compact(e: ElectionShares): ElectionShares {
	const raw = Object.fromEntries(
		Object.entries(e.raw).map(([k, v]) => [k, round(v ?? 0)])
	) as ElectionShares['raw'];
	return { raw, sonst: round(e.sonst), fw: round(e.fw), tier: round(e.tier ?? 0) };
}

export function toHandbuchDaten(d: StoriesWahlData): HandbuchDaten {
	return {
		wahlen: d.wahlen.map(({ slug, typ, jahr }) => ({ slug, typ, jahr })),
		bezirke: d.bezirke.map((b) => ({
			nr: b.nr,
			slug: b.slug,
			name: b.name,
			wahlen: Object.fromEntries(
				Object.entries(b.wahlen).map(([slug, z]) => [
					slug,
					{ e: compact(toElectionShares(z)), turnout: round(z.wahlbeteiligung) }
				])
			) as Record<WahlSlug, HandbuchErgebnis>
		}))
	};
}
