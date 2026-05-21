/**
 * Einwohner-LOR-Join (Story 10.0). Reine Funktionen, kein I/O.
 * Quelle: Amt für Statistik Berlin-Brandenburg, EWR_L21_202412E_Matrix.csv (CC BY 4.0).
 */

export interface EinwohnerRow {
	/** RAUMID, 8-stellig, = plr_id Join-Key. */
	lorId: string;
	/** Gesamt-Einwohner (Spalte E_E). */
	gesamt: number;
	/** Alle E_E*-Altersspalten, Key = Spaltenname in Großschreibung. */
	ages: Readonly<Record<string, number>>;
}

export interface LorEinwohnerRecord {
	plrId: string;
	gesamt: number;
	kinder0bis6: number;
	kinder6bis12: number;
	senioren65plus: number;
	dichtePro_km2: number | null;
	/** Junge (0-18) je 100 Erwerbsfähige (18-65). null bei fehlender Erwerbsbevölkerung. */
	jugendquotient: number | null;
	/** Senioren (65+) je 100 Erwerbsfähige (18-65). */
	altenquotient: number | null;
	/** Anteil Erwerbsfähige (18-65) an Gesamt in Prozent. */
	erwerbsanteil: number | null;
}

export interface LorAreaFeature {
	plrId: string;
	areaM2: number | null;
}

// 0 bis unter 6: E_EU1 (unter 1) + E_E1U6 (1 bis unter 6).
const KINDER_0_6_KEYS = ['E_EU1', 'E_E1U6'] as const;
// 6 bis unter 12: Einzeljahr-Spalten, da die Quelle nur E_E6U15 vorgruppiert.
const KINDER_6_12_KEYS = ['E_E06_07', 'E_E07_08', 'E_E08_10', 'E_E10_12'] as const;
// 65+: E_E65U80 (65 bis unter 80) + E_E80U110 (80 bis 110).
const SENIOREN_65_KEYS = ['E_E65U80', 'E_E80U110'] as const;

function sumKeys(ages: Readonly<Record<string, number>>, keys: readonly string[]): number {
	return keys.reduce((acc, k) => acc + (Number.isFinite(ages[k]) ? ages[k] : 0), 0);
}

export function bucketAltersjahre(ages: Readonly<Record<string, number>>): {
	kinder0bis6: number;
	kinder6bis12: number;
	senioren65plus: number;
} {
	return {
		kinder0bis6: sumKeys(ages, KINDER_0_6_KEYS),
		kinder6bis12: sumKeys(ages, KINDER_6_12_KEYS),
		senioren65plus: sumKeys(ages, SENIOREN_65_KEYS)
	};
}

// Demografie-Altersgruppen (CSV-Vorgruppierungen).
const U18_KEYS = ['E_EU1', 'E_E1U6', 'E_E6U15', 'E_E15U18'] as const;
const ERW_KEYS = ['E_E18U25', 'E_E25U55', 'E_E55U65'] as const;
const ALT_KEYS = ['E_E65U80', 'E_E80U110'] as const;

function round1(n: number): number {
	return Math.round(n * 10) / 10;
}

export function computeQuotienten(
	ages: Readonly<Record<string, number>>,
	gesamt: number
): { jugendquotient: number | null; altenquotient: number | null; erwerbsanteil: number | null } {
	const u18 = sumKeys(ages, U18_KEYS);
	const erw = sumKeys(ages, ERW_KEYS);
	const alt = sumKeys(ages, ALT_KEYS);
	return {
		jugendquotient: erw > 0 ? round1((u18 / erw) * 100) : null,
		altenquotient: erw > 0 ? round1((alt / erw) * 100) : null,
		erwerbsanteil: gesamt > 0 ? round1((erw / gesamt) * 100) : null
	};
}

export function computeDichte(gesamt: number, areaM2: number | null): number | null {
	if (areaM2 === null || !Number.isFinite(areaM2) || areaM2 <= 0) return null;
	if (!Number.isFinite(gesamt) || gesamt < 0) return null;
	return gesamt / (areaM2 / 1_000_000);
}

export function joinEinwohnerToLor(
	rows: readonly EinwohnerRow[],
	lorFeatures: readonly LorAreaFeature[]
): LorEinwohnerRecord[] {
	const areaByPlr = new Map(lorFeatures.map((f) => [f.plrId, f.areaM2]));
	return rows
		.map((r) => {
			const buckets = bucketAltersjahre(r.ages);
			const quotienten = computeQuotienten(r.ages, r.gesamt);
			const area = areaByPlr.has(r.lorId) ? (areaByPlr.get(r.lorId) ?? null) : null;
			return {
				plrId: r.lorId,
				gesamt: r.gesamt,
				...buckets,
				dichtePro_km2: computeDichte(r.gesamt, area),
				...quotienten
			};
		})
		.sort((a, b) => a.plrId.localeCompare(b.plrId));
}
