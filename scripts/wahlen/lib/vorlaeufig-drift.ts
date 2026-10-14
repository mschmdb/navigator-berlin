import type { WahlSource } from './sources';

export type WahlVorlaeufigRow = {
	readonly typ: WahlSource['wahl'];
	readonly jahr: number;
	readonly vorlaeufig: boolean;
};

/**
 * Wahlen, deren `vorlaeufig`-Flag in der DB vom Config-Stand in
 * `WAHL_SOURCES` abweicht. Typischer Fall: Endergebnis liegt vor, die Config
 * ist auf final umgestellt, die DB trägt noch den vorläufigen Ingest. Das
 * prebuild-Gate erzwingt dann einen Re-Ingest, ohne dass jemand
 * `WAHL_REFRESH` setzen muss. Rückgabe: sortierte, eindeutige `typ-jahr`-Keys.
 */
export function findVorlaeufigDrift(
	rows: readonly WahlVorlaeufigRow[],
	sources: readonly WahlSource[]
): string[] {
	const expected = new Map(sources.map((s) => [`${s.wahl}-${s.jahr}`, s.vorlaeufig ?? false]));
	const drift = new Set<string>();
	for (const row of rows) {
		const key = `${row.typ}-${row.jahr}`;
		const want = expected.get(key);
		if (want !== undefined && want !== row.vorlaeufig) drift.add(key);
	}
	return [...drift].sort();
}
