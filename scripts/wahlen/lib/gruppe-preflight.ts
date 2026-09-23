import type { GruppeMapping } from './gruppe-mapper.js';

/**
 * Preflight-Checks für Briefwahl-Gruppen (Story 17), pure/DB-frei. Der
 * Kiez-Build (`build-wahl-kiez-aggregat.ts`) ruft diese Funktionen VOR dem
 * Schreiben von `wahl_stimmbezirk_gruppe` auf und bricht bei jedem
 * nicht-leeren Ergebnis hart ab (Boundary "kein stilles Weglassen" -- Build
 * bricht ab, wenn ein Briefwahl-Stimmbezirk keiner Gruppe zugeordnet ist
 * oder eine Urne ohne Gruppe bleibt).
 */

// Kein `findGruppenSpanningMultipleBezirke` (Review-Fund, entfernt): die
// I/O-Matrix-Zeile "Gruppen über Bezirksgrenzen" prüfte bisher Mitglieds-
// Urnen einer Gruppe auf einheitlichen `bezirkCode` -- strukturell aber
// wirkungslos, weil sowohl die Gruppen-ID (`gruppeIdFromGeo`) als auch
// `GruppeMapping.bezirkCode` (`buildGruppeMappings`) aus DERSELBEN
// `feature.properties.BEZ` gebaut werden: zwei Urnen mit identischer
// Gruppen-ID haben denselben `BEZ`-Wert per Konstruktion, nie durch einen
// Datenfehler widerlegbar. Die Invariante bleibt wahr, aber der Check kann
// nie feuern -- kein Test hätte je rot werden können.

/**
 * Urnen-uwbIds aus der DB (`stimmbezirk`, Urne-Rows), die in der Geometrie
 * keine auflösbare Gruppen-Zuordnung haben (leere/fehlende BWB, unbekanntes
 * Schema, oder Urne fehlt komplett in der Geometrie). Jeder Eintrag ist ein
 * Build-Abbruch-Kandidat ("Urne ohne Gruppe").
 */
export function findUrnenOhneGruppe(
	dbUrneUwbIds: readonly string[],
	mappings: readonly GruppeMapping[]
): string[] {
	const mapped = new Set(mappings.map((m) => m.dbUwbId));
	return dbUrneUwbIds.filter((id) => !mapped.has(id));
}

/**
 * Briefwahl-Stimmbezirk-uwbIds aus der DB, die von KEINER aus der Geometrie
 * abgeleiteten Gruppen-ID getroffen werden ("Verwaister Briefwahlbezirk",
 * I/O-Matrix). Build-Abbruch-Kandidat mit der uwbId in der Fehlermeldung.
 */
export function findVerwaisteBriefwahlbezirke(
	dbBriefUwbIds: readonly string[],
	mappings: readonly GruppeMapping[]
): string[] {
	const gruppenIds = new Set(mappings.map((m) => m.gruppeId));
	return dbBriefUwbIds.filter((id) => !gruppenIds.has(id));
}

/**
 * Geometrie-Urnen (aus `mappings`), die keine DB-`stimmbezirk`-Row haben
 * (Geometrie-Generation und DB-Ingest weichen für diese uwbId voneinander
 * ab). Kein Build-Abbruch-Kandidat für sich -- der Aufrufer filtert diese
 * Mappings vor der weiteren Verarbeitung heraus (Kiez-Split/`wahl_stimm-
 * bezirk_gruppe` sollen nur DB-bekannte Urnen enthalten) und loggt die
 * Anzahl. Über alle 18 Wahlen mit Geometrie empirisch verifiziert: kommt
 * aktuell nirgends vor (0/18), bleibt aber als Log-Signal für künftige
 * Geometrie-Generationen erhalten.
 */
export function findGeometrieUrnenOhneDb(
	mappings: readonly GruppeMapping[],
	dbUrneUwbIds: readonly string[]
): string[] {
	const known = new Set(dbUrneUwbIds);
	return mappings.filter((m) => !known.has(m.dbUwbId)).map((m) => m.dbUwbId);
}

/**
 * Gruppen-IDs aus der Geometrie (`mappings`, nach Filterung auf DB-Urnen),
 * für die KEINE DB-Briefwahl-Row existiert -- die Geometrie erwartet einen
 * Briefwahlbezirk, den die Wahl nie ausgezählt hat. Build-Abbruch-Kandidat:
 * ohne DB-Briefwahl-Row hat die Gruppe keine eigene `ergebnis`-Row unter
 * ihrer Gruppen-ID, der Kiez-Split verteilt für diese Gruppe niemals
 * Briefwahl (`briefMap` bliebe `undefined`, `computeKiezStimmenMitBriefwahl`
 * überspringt die Verteilung still) -- über alle 18 Wahlen mit Geometrie
 * empirisch verifiziert: kommt aktuell nirgends vor (0/18), ein Treffer ist
 * also ein Daten-/Geometrie-Fehler, kein legitimer Fall.
 */
export function findGruppenOhneDbBriefwahl(
	mappings: readonly GruppeMapping[],
	dbBriefUwbIds: readonly string[]
): string[] {
	const known = new Set(dbBriefUwbIds);
	const gruppenIds = new Set(mappings.map((m) => m.gruppeId));
	return [...gruppenIds].filter((id) => !known.has(id));
}

export type GruppenSummenCheckResult = {
	/** Summe der ergebnis-Stimmen, die über die Gruppen-Zuordnung erreichbar
	 * sind (jede Urne via `mappings`, jeder Briefwahl-Stimmbezirk über sich
	 * selbst, `dbBriefUwbIds`). */
	readonly gruppenSumme: number;
	/** Amtliche Berlin-Summe der Wahl (Parameter, siehe unten). */
	readonly berlinSumme: number;
	readonly matches: boolean;
};

/**
 * Summen-Check (I/O-Matrix "Summen-Check", Boundary "Always" -- Summe aller
 * Gruppen einer Wahl = amtliche Berlin-Summe, keine Stimme geht verloren).
 *
 * `berlinSumme` kommt vom Aufrufer als unabhängig ermittelter Wert (SUM über
 * `wahl_aggregat_berlin`, gebaut von `buildAggregates` -- unverändert,
 * Never-Boundary "Keine Änderung an Berlin-/Bezirks-Aggregaten"), NICHT aus
 * denselben `ergebnisRows`, die auch `gruppenSumme` bilden (Review-Fund: ein
 * Bug in der `ergebnis`-Ladung selbst -- z. B. ein zu enger `WHERE`-Filter,
 * der Rows verliert, bevor sie hier ankommen -- wäre gegen eine aus densel-
 * ben Rows abgeleitete Referenz unsichtbar gewesen). Zwei unabhängige
 * Quellen für dieselbe Zahl sind der Sinn dieses Gates.
 *
 * Eine Abweichung bedeutet entweder eine `ergebnis`-Row, deren `uwbId`
 * weder als Urne (`mappings`) noch als Briefwahl-Stimmbezirk
 * (`dbBriefUwbIds`) über die Gruppen-Zuordnung erreichbar ist (ein Fall,
 * den die Orphan-Checks oben nicht abdecken, weil die nur
 * `stimmbezirk`-Coverage prüfen, nicht `ergebnis`-Coverage direkt), oder
 * eine Diskrepanz zwischen `ergebnis` und `wahl_aggregat_berlin` selbst.
 */
export function checkGruppenSummeGegenBerlin(
	ergebnisRows: readonly { uwbId: string; stimmen: number }[],
	mappings: readonly GruppeMapping[],
	dbBriefUwbIds: readonly string[],
	berlinSumme: number
): GruppenSummenCheckResult {
	const reachable = new Set<string>([...mappings.map((m) => m.dbUwbId), ...dbBriefUwbIds]);
	let gruppenSumme = 0;
	for (const row of ergebnisRows) {
		if (reachable.has(row.uwbId)) gruppenSumme += row.stimmen;
	}
	return { gruppenSumme, berlinSumme, matches: gruppenSumme === berlinSumme };
}
