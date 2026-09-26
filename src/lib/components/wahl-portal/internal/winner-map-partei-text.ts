/**
 * Story 9 (Partei-Tabs): partei-spezifische Editorial-Texte für Legende,
 * Takeaway und Tabellen-Caption -- eigenes Modul statt Erweiterung von
 * `winner-map-data.ts` (Datei-Zeilenlimit) UND damit die Sieger-Texte
 * (`buildTakeawaySentence` etc.) unverändert bleiben (Boundary: kein
 * "Stärkste Partei"-Framing im Partei-Modus, `lint:wahl`-konform).
 */
import { m } from '$lib/paraglide/messages.js';
import type { LocaleFormatOptions } from '$lib/i18n/format.js';
import type { AnteilSpanne } from './winner-map-expressions.js';
import { formatAnteilPct } from './winner-map-data.js';

export interface ParteiViewTexts {
	readonly legendeTitel: string;
	readonly legendeRampeText: string;
	readonly tableCaption: string;
	readonly takeaway: string;
}

export interface ParteiViewTextsInput extends LocaleFormatOptions {
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

export function parteiLegendeTitel(partei: string, opts?: LocaleFormatOptions): string {
	return m.wahl_portal_partei_legende_titel({ partei }, { locale: opts?.locale });
}

/** Review-Fund #4: nennt die Bezugsgröße der Rampe explizit (reihen-weite
 * Spanne, nicht die des aktuell angezeigten Jahres) -- ohne den Satz liest
 * sich die Legende, als wäre die Spanne jahresbezogen. */
export function parteiLegendeRampeText(spanne: AnteilSpanne, opts?: LocaleFormatOptions): string {
	return m.wahl_portal_partei_legende_rampe_text(
		{
			min: formatAnteilPct(spanne.min, 1, opts),
			max: formatAnteilPct(spanne.max, 1, opts)
		},
		{ locale: opts?.locale }
	);
}

export function parteiTableCaption(
	partei: string,
	jahr: number | null,
	opts?: LocaleFormatOptions
): string {
	const options = { locale: opts?.locale };
	return jahr !== null
		? m.wahl_portal_partei_table_caption_jahr({ partei, jahr }, options)
		: m.wahl_portal_partei_table_caption({ partei }, options);
}

/** Review-Fund #5: geteilter Hinweis für Takeaway UND Legende -- ohne Daten
 * fürs gewählte Jahr darf die Legende nie eine erfundene Rampe (z. B. „0,0 %
 * bis 100,0 %" aus der Default-Spanne) zeigen. */
export function parteiKeineDatenHinweis(partei: string, opts?: LocaleFormatOptions): string {
	return m.wahl_portal_partei_keine_daten({ partei }, { locale: opts?.locale });
}

export function parteiTakeawaySentence(
	partei: string,
	hasData: boolean,
	totalGebiete: number,
	spanne: AnteilSpanne,
	opts?: LocaleFormatOptions
): string {
	if (!hasData) return parteiKeineDatenHinweis(partei, opts);
	// Review-Fund #3: „über alle Wahlen der Reihe" macht explizit, dass die
	// Spanne reihen-weit gilt, nicht nur für das aktuell angezeigte Jahr.
	return m.wahl_portal_partei_takeaway(
		{
			partei,
			min: formatAnteilPct(spanne.min, 1, opts),
			max: formatAnteilPct(spanne.max, 1, opts),
			total: totalGebiete
		},
		{ locale: opts?.locale }
	);
}

/** Bündelt die vier Text-Bausteine, damit der Aufrufer (winner-map.svelte)
 * nur EINE `$derived`-Stelle statt vier braucht. */
export function buildParteiViewTexts(input: ParteiViewTextsInput): ParteiViewTexts {
	const opts = { locale: input.locale };
	return {
		legendeTitel: parteiLegendeTitel(input.partei, opts),
		legendeRampeText: input.hasData
			? parteiLegendeRampeText(input.spanne, opts)
			: parteiKeineDatenHinweis(input.partei, opts),
		tableCaption: parteiTableCaption(input.partei, input.jahr, opts),
		takeaway: parteiTakeawaySentence(
			input.partei,
			input.hasData,
			input.totalGebiete,
			input.spanne,
			opts
		)
	};
}
