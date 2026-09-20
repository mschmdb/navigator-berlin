/**
 * Story 9 (Partei-Tabs): partei-spezifische Editorial-Texte für Legende,
 * Takeaway und Tabellen-Caption -- eigenes Modul statt Erweiterung von
 * `winner-map-data.ts` (Datei-Zeilenlimit) UND damit die Sieger-Texte
 * (`buildTakeawaySentence` etc.) unverändert bleiben (Boundary: kein
 * "Stärkste Partei"-Framing im Partei-Modus, `lint:wahl`-konform).
 */
import type { AnteilSpanne } from './winner-map-expressions.js';
import { formatAnteilPct } from './winner-map-data.js';

export interface ParteiViewTexts {
	readonly legendeTitel: string;
	readonly legendeRampeText: string;
	readonly tableCaption: string;
	readonly takeaway: string;
}

export interface ParteiViewTextsInput {
	readonly partei: string;
	readonly jahr: number | null;
	/** Ob für das gewählte JAHR Rows dieser Partei existieren (I/O-Matrix
	 * „Partei ohne Daten", z. B. BSW 2016 bei einer Reihe mit BSW-Daten erst
	 * ab 2023, Review-Fund #5) -- NICHT ob die Reihe irgendwann Daten hat. */
	readonly hasData: boolean;
	readonly totalGebiete: number;
	/** Partei-relative Anteils-Spanne, reihen-weit (alle Jahre × Gebiete,
	 * Review-Fund #3): macht Jahre in der Zeit-Animation vergleichbar, bleibt
	 * auch ohne Jahres-Daten unverändert. */
	readonly spanne: AnteilSpanne;
}

export function parteiLegendeTitel(partei: string): string {
	return `Anteil ${partei}`;
}

/** Review-Fund #4: nennt die Bezugsgröße der Rampe explizit (reihen-weite
 * Spanne, nicht die des aktuell angezeigten Jahres) -- ohne den Satz liest
 * sich die Legende, als wäre die Spanne jahresbezogen. */
export function parteiLegendeRampeText(spanne: AnteilSpanne): string {
	return `Deckkraft nach Anteil: ${formatAnteilPct(spanne.min)} = niedrige Deckkraft, ab ${formatAnteilPct(spanne.max)} volle Deckkraft. Skala relativ zur Anteils-Spanne der gewählten Partei über die Reihe.`;
}

export function parteiTableCaption(partei: string, jahr: number | null): string {
	return `Anteil ${partei} je Gebiet${jahr !== null ? `, ${jahr}` : ''}`;
}

/** Review-Fund #5: geteilter Hinweis für Takeaway UND Legende -- ohne Daten
 * fürs gewählte Jahr darf die Legende nie eine erfundene Rampe (z. B. „0,0 %
 * bis 100,0 %" aus der Default-Spanne) zeigen. */
export function parteiKeineDatenHinweis(partei: string): string {
	return `Für ${partei} liegen in dieser Wahl-Reihe keine Daten vor.`;
}

export function parteiTakeawaySentence(
	partei: string,
	hasData: boolean,
	totalGebiete: number,
	spanne: AnteilSpanne
): string {
	if (!hasData) return parteiKeineDatenHinweis(partei);
	// Review-Fund #3: „über alle Wahlen der Reihe" macht explizit, dass die
	// Spanne reihen-weit gilt, nicht nur für das aktuell angezeigte Jahr.
	return `${partei}: Anteil zwischen ${formatAnteilPct(spanne.min)} und ${formatAnteilPct(spanne.max)} über alle Wahlen der Reihe (${totalGebiete} Gebiete).`;
}

/** Bündelt die vier Text-Bausteine, damit der Aufrufer (winner-map.svelte)
 * nur EINE `$derived`-Stelle statt vier braucht. */
export function buildParteiViewTexts(input: ParteiViewTextsInput): ParteiViewTexts {
	return {
		legendeTitel: parteiLegendeTitel(input.partei),
		legendeRampeText: input.hasData
			? parteiLegendeRampeText(input.spanne)
			: parteiKeineDatenHinweis(input.partei),
		tableCaption: parteiTableCaption(input.partei, input.jahr),
		takeaway: parteiTakeawaySentence(input.partei, input.hasData, input.totalGebiete, input.spanne)
	};
}
