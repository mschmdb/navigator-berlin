/**
 * Zentrale, locale-abhaengige Labels fuer Wahl-Typ, Stimmtyp, Reihe, Ebene
 * und Quellen-Anzeige (i18n Block B). Ersetzt die zuvor 3-4x duplizierten
 * `TYP_LABELS`/`STIMMTYP_LABELS`/`REIHE_LABELS`/`EBENE_LABELS`-Objekte in
 * `[slug]/+page.server.ts`, `alle-wahlen-block.svelte`,
 * `wahl-portal-url-state.ts` und den Kapitel-Komponenten mit
 * "Datenstand: ... source_name"-Zeilen. `scripts/generate-og-images.ts`
 * bleibt bewusst unangetastet (OG-Skript bleibt DE, Boundary Spec i18n
 * Block B).
 *
 * Auswertung immer beim Aufruf (`getLocale()` bzw. explizites `{ locale }`),
 * nie als Modul-Konstante (Boundary Spec i18n Block B: "keine Texte als
 * Modul-Konstanten, sondern Auswertung beim Aufruf").
 *
 * `wahlTypLabel` liefert das volle Institutions+"-wahl"/"election"-Label
 * (Seitentitel, H1, Breadcrumb der Detailseite) inkl. Glossar-Klammer-Gloss
 * fuer Abgeordnetenhaus/BVV (Matze-Entscheidung 26.09., Glossar Variante A).
 * `wahlReiheLabel` liefert das kurze Institutions-Label ohne "-wahl"-Suffix
 * (Reihen-Leiste-Tabs, Gruppen-Ueberschriften in `alle-wahlen-block.svelte`).
 */
import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime';

export type WahlTyp = 'btw' | 'agh' | 'bvv';
export type WahlStimmtyp = 'erststimme' | 'zweitstimme' | 'einstimme';
export type WahlEbene = 'stimmbezirk' | 'kiez' | 'bezirk' | 'berlin';

export interface WahlLabelOptions {
	readonly locale?: Locale;
}

function toOptions(o?: WahlLabelOptions): { locale: Locale } | undefined {
	return o?.locale ? { locale: o.locale } : undefined;
}

/** Volles Label inkl. „-wahl"/„election"-Suffix, fuer Seitentitel/H1/Breadcrumb. */
export function wahlTypLabel(typ: WahlTyp, o?: WahlLabelOptions): string {
	const options = toOptions(o);
	if (typ === 'btw') return m.wahl_label_typ_btw(undefined, options);
	if (typ === 'agh') return m.wahl_label_typ_agh(undefined, options);
	return m.wahl_label_typ_bvv(undefined, options);
}

/** Kurzes Institutions-Label ohne "-wahl"-Suffix, fuer Tabs/Reihen-Leiste. */
export function wahlReiheLabel(typ: WahlTyp, o?: WahlLabelOptions): string {
	const options = toOptions(o);
	if (typ === 'btw') return m.wahl_label_reihe_btw(undefined, options);
	if (typ === 'agh') return m.wahl_label_reihe_agh(undefined, options);
	return m.wahl_label_reihe_bvv(undefined, options);
}

export function wahlStimmtypLabel(stimmtyp: WahlStimmtyp, o?: WahlLabelOptions): string {
	const options = toOptions(o);
	if (stimmtyp === 'erststimme') return m.wahl_label_stimmtyp_erststimme(undefined, options);
	if (stimmtyp === 'zweitstimme') return m.wahl_label_stimmtyp_zweitstimme(undefined, options);
	return m.wahl_label_stimmtyp_einstimme(undefined, options);
}

export function wahlEbeneLabel(ebene: WahlEbene, o?: WahlLabelOptions): string {
	const options = toOptions(o);
	if (ebene === 'stimmbezirk') return m.wahl_label_ebene_stimmbezirk(undefined, options);
	if (ebene === 'kiez') return m.wahl_label_ebene_kiez(undefined, options);
	if (ebene === 'bezirk') return m.wahl_label_ebene_bezirk(undefined, options);
	// i18n Block B3b: Inspector-Wahlsektion zeigt die Berlin-weite Ebene
	// zusaetzlich zu den drei Bestands-Ebenen (Block B kannte nur Detailseiten-
	// Ebenen ohne "Berlin gesamt").
	return m.wahl_label_ebene_berlin(undefined, options);
}

export function wahlWiederholungLabel(o?: WahlLabelOptions): string {
	return m.wahl_label_wiederholungswahl(undefined, toOptions(o));
}

export function wahlVorlaeufigLabel(o?: WahlLabelOptions): string {
	return m.wahl_label_vorlaeufig(undefined, toOptions(o));
}

/**
 * Anzeige-Label fuer eine Quelle. Nimmt den API-Feld-Wert (`source_name`,
 * bleibt als Datenschluessel unuebersetzt, Boundary) entgegen und mappt ihn
 * locale-abhaengig auf ein Anzeige-Label. `null`/`undefined`/unbekannter
 * Wert faellt auf die "unbekannte Quelle"-Message zurueck.
 */
export function sourceDisplayLabel(
	sourceName: string | null | undefined,
	o?: WahlLabelOptions
): string {
	const options = toOptions(o);
	switch (sourceName) {
		case 'Bundeswahlleiterin':
			return m.wahl_label_source_bundeswahlleiterin(undefined, options);
		case 'Landeswahlleiterin Berlin':
			return m.wahl_label_source_landeswahlleiterin(undefined, options);
		case 'Amt für Statistik Berlin-Brandenburg':
			return m.wahl_label_source_amt_fuer_statistik(undefined, options);
		default:
			// Review-Fund: nur `null`/`undefined`/leer fallen auf die "unbekannte
			// Quelle"-Message zurueck. Ein echter, nur nicht in der Glossar-Liste
			// gefuehrter Quellenname (z. B. eine neue Behoerde) wird UNVERAENDERT
			// angezeigt statt faelschlich als "unbekannt" zu gelten.
			if (!sourceName) return m.wahl_label_source_unbekannt(undefined, options);
			return sourceName;
	}
}

/** Bekannte Schreibvarianten desselben Lizenz-Codes in den Wahl-DB-Rows
 * (Datenqualitaets-Altlast, nicht Teil dieses Specs). */
const DL_DE_BY_CODES = new Set(['dl-de/by-2-0', 'dl-de/by-2.0']);

/**
 * Anzeige-Label fuer einen Lizenz-Code. Nimmt den API-Feld-Wert (`license`,
 * bleibt als Datenschluessel unuebersetzt) entgegen und mappt ihn
 * locale-abhaengig auf einen ausgeschriebenen Lizenz-Namen. Ein unbekannter
 * Code wird UNVERAENDERT durchgereicht (kein Datenverlust bei einer neuen
 * Lizenz, die diese Liste noch nicht kennt).
 */
export function licenseDisplayLabel(license: string, o?: WahlLabelOptions): string {
	const options = toOptions(o);
	if (DL_DE_BY_CODES.has(license)) {
		return m.wahl_label_license_dl_de_by(undefined, options);
	}
	return license;
}
