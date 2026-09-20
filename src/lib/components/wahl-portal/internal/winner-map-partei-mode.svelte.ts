/**
 * Story 9 (Partei-Tabs): bündelt den karten-lokalen Partei-Tab-Zustand +
 * die davon abgeleitete Anteils-Spanne/Editorial-Texte in einer eigenen
 * Klasse (Datei-Zeilenlimit `winner-map.svelte`, Muster
 * `WinnerMapController`/`AddressHighlight`). Kein URL-Zustand (Boundary:
 * Tabs sind karten-lokal), keine eigenen Netzwerk-Zugriffe -- Rows kommen
 * vom Aufrufer (bereits geladene Loader-Responses).
 */
import { parteiAnteilSpanne, type AnteilSpanne } from './winner-map-expressions.js';
import { buildParteiViewTexts, type ParteiViewTexts } from './winner-map-partei-text.js';
import { filterWinnersByJahr, type WinnerApiRow } from './winner-map-data.js';

/**
 * Review-Fund #7: ob eine geladene Winners-Response zur aktuell aktiven
 * Partei passt -- verhindert, dass eine noch nicht aktualisierte (alte)
 * Response kurz unter einem neu gewählten Partei-Tab als dessen Daten
 * interpretiert wird (Sieger-Farben/-Spanne blitzen unter dem Partei-Tab
 * auf, bis die passende Response eintrifft). `null` (Gewinner-Tab) passt
 * immer -- Gewinner-Responses sind nie partei-gefiltert. Eine leere Response
 * gilt ebenfalls als passend (gültiger „keine Daten"-Zustand für die
 * Partei, Response trägt kein Partei-Echo-Feld, Boundary).
 */
export function rowsMatchAktivePartei(
	rows: readonly WinnerApiRow[],
	aktivePartei: string | null
): boolean {
	if (aktivePartei === null) return true;
	if (rows.length === 0) return true;
	return rows[0].partei === aktivePartei;
}

export class ParteiModeState {
	aktivePartei = $state<string | null>(null);

	select(partei: string | null): void {
		this.aktivePartei = partei;
	}

	/** Partei-relative Anteils-Spanne über die übergebenen Rows, `null` im
	 * Gewinner-Tab (Bestands-Rampe gilt dann unverändert). */
	ramp(rows: readonly WinnerApiRow[]): AnteilSpanne | null {
		return this.aktivePartei ? parteiAnteilSpanne(rows) : null;
	}

	/** Legende/Takeaway/Tabellen-Caption für den Partei-Modus, `null` im
	 * Gewinner-Tab (Aufrufer fällt dann auf die Bestands-Texte zurück).
	 * `hasData` bezieht sich auf das GEWÄHLTE Jahr (Review-Fund #5: eine
	 * Partei mit Reihen- aber ohne Jahres-Daten, z. B. BSW 2016, muss den
	 * Keine-Daten-Hinweis zeigen) -- die Rampe bleibt reihen-weit (Review-
	 * Fund #3), sie liest weiterhin ALLE `rows`. */
	texts(
		rows: readonly WinnerApiRow[],
		jahr: number | null,
		totalGebiete: number
	): ParteiViewTexts | null {
		if (!this.aktivePartei) return null;
		const rowsForJahr = jahr !== null ? filterWinnersByJahr(rows, jahr) : rows;
		return buildParteiViewTexts({
			partei: this.aktivePartei,
			jahr,
			hasData: rowsForJahr.length > 0,
			totalGebiete,
			spanne: this.ramp(rows) ?? { min: 0, max: 1 }
		});
	}
}
