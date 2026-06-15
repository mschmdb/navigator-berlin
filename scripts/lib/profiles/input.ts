import { createHash } from 'node:crypto';

/**
 * Grounding-Input für KI-Profile (Story 11.6). Wird sowohl an das Modell gegeben
 * als auch (via inputHash) im Frontmatter gespeichert, damit der Fakten-Lint
 * (11.7) gegen exakt dieselbe Datenbasis prüfen kann.
 */
export interface ProfileDim {
	readonly label: string;
	readonly score: number | null;
	readonly rang: number | null;
	readonly total: number;
	readonly bezirkMean: number | null;
	readonly berlinMedian: number | null;
}

export interface ProfileInput {
	readonly pageType: 'kiez' | 'bezirk';
	readonly slug: string;
	readonly name: string;
	readonly bezirk: string | null;
	readonly einwohner: number | null;
	readonly flaecheHa: number | null;
	readonly composite: {
		readonly score: number | null;
		readonly rang: number | null;
		readonly total: number;
	};
	readonly dims: readonly ProfileDim[];
	/** Flache, lesbare Fakten (Cluster-Werte + Counts) als zusätzlicher Anker. */
	readonly facts: Readonly<Record<string, string | number>>;
}

/** Deterministischer Kurz-Hash über den Input (16 hex chars). */
export function hashInput(input: ProfileInput): string {
	return createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 16);
}

/**
 * Alle im Input vorkommenden Roh-Zahlen als Set. Grundlage für den Fakten-Lint
 * (11.7): jede Zahl im Prosa-Text muss hier vorkommen (exakt oder als Rundung).
 * Bewusst NICHT vorab gerundet, damit der Lint die ganzzahlige Rundung des
 * Rohwerts korrekt prüfen kann (z. B. Prosa "rund 34" für petGrad 34,45).
 */
export function collectNumbers(input: ProfileInput): number[] {
	const out: number[] = [];
	const visit = (v: unknown): void => {
		if (typeof v === 'number' && Number.isFinite(v)) out.push(v);
		else if (typeof v === 'string') {
			// Ziffern in Strings (z. B. LOR-Namen wie "West 1 Tegel") sind zitierbar.
			for (const m of v.matchAll(/\d+(?:[.,]\d+)?/g)) {
				const n = Number(m[0].replace(',', '.'));
				if (Number.isFinite(n)) out.push(n);
			}
		} else if (Array.isArray(v)) v.forEach(visit);
		else if (v && typeof v === 'object') Object.values(v).forEach(visit);
	};
	visit(input);
	return [...new Set(out)];
}
