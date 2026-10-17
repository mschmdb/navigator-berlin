/**
 * #107: Legende und Tabellen-Alternative der Stimmbezirkskarte auf der
 * Wahl-Detailseite. Ohne sie war die stärkste Partei nur an der Farbe
 * erkennbar (Leitlinie 6).
 */
export interface StimmbezirkWinner {
	/** Briefwahl-Gruppen-ID, nicht die einzelne Urnen-uwbId. */
	readonly uwbId: string;
	readonly parteiKurzname: string;
	readonly farbeHex: string;
	readonly anteil: number;
}

export interface StimmbezirkZeile {
	readonly gebiet: string;
	readonly partei: string;
	readonly anteil: number;
}

/** Vorkommende Parteien, häufigster Sieger zuerst, Gleichstand alphabetisch. */
export function stimmbezirkParteien(winners: ReadonlyArray<StimmbezirkWinner>): string[] {
	const anzahl = new Map<string, number>();
	for (const w of winners) anzahl.set(w.parteiKurzname, (anzahl.get(w.parteiKurzname) ?? 0) + 1);
	return [...anzahl.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))
		.map(([partei]) => partei);
}

/**
 * Tabellenzeilen je Gruppe. `namen` kommt aus der Geometrie (MEMBERS), bis
 * sie geladen ist, greift `fallbackName`.
 */
export function buildStimmbezirkZeilen(
	winners: ReadonlyArray<StimmbezirkWinner>,
	namen: ReadonlyMap<string, string>,
	fallbackName: (gruppeId: string) => string
): StimmbezirkZeile[] {
	return winners
		.map((w) => ({
			gebiet: namen.get(w.uwbId) ?? fallbackName(w.uwbId),
			partei: w.parteiKurzname,
			anteil: w.anteil
		}))
		.sort((a, b) => a.gebiet.localeCompare(b.gebiet, 'de', { numeric: true }));
}
