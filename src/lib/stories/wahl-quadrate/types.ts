/**
 * Datenbasis für „Berlin in Quadraten“ (gh-176, gh-187): Zweitstimmen je
 * Bezirk und Wahl, erzeugt von `scripts/build-stories-wahl.ts`, Ausgabe
 * `static/data/stories-wahl.json`.
 *
 * Kleine Parteien bleiben einzeln. Die Seite fasst sie erst beim Zeichnen zu
 * Grau zusammen, weil das Handbuch die Schwelle einstellbar macht.
 *
 * Reiner Typvertrag, den auch die Pipeline importiert. Schlüssel, Reihenfolge,
 * Wahltypen und Jahre stehen in `parteien.ts`.
 */
import type { NamedParty, WahlTyp } from './parteien';

export type { WahlTyp };

export type WahlSlug =
	| 'agh11'
	| 'agh16'
	| 'agh21'
	| 'agh23'
	| 'agh26'
	| 'btw13'
	| 'btw17'
	| 'btw21'
	| 'btw25';

/** Kurzname aus dem Partei-Seed der Wahl-Pipeline, z. B. `SPD`, `GRÜNE`, `Sonstige`. */
export type ParteiKurzname = string;

export interface ParteiErgebnis {
	kurzname: ParteiKurzname;
	stimmen: number;
	/** Anteil an den gültigen Zweitstimmen, 0 bis 1. */
	anteil: number;
}

export interface WahlZahlen {
	wahlberechtigte: number;
	waehlende: number;
	/** Gültige Zweitstimmen. */
	gueltig: number;
	/** Wählende / Wahlberechtigte, 0 bis 1. */
	wahlbeteiligung: number;
	/** Alle Parteien nach Stimmen absteigend, Summe der Stimmen = `gueltig`. */
	parteien: ParteiErgebnis[];
}

export interface WahlMeta {
	slug: WahlSlug;
	typ: WahlTyp;
	jahr: number;
	/** Wiederholungswahl, z. B. AGH 2023. */
	wiederholung: boolean;
	vorlaeufig: boolean;
	quelle: string;
	lizenz: string;
}

export interface BezirkWahlen {
	/** Zweistellige Bezirksnummer, `01` Mitte bis `12` Reinickendorf. */
	nr: string;
	slug: string;
	name: string;
	wahlen: Record<WahlSlug, WahlZahlen>;
}

export interface StoriesWahlData {
	schemaVersion: 1;
	generatedAt: string;
	stimmtyp: 'zweitstimme';
	wahlen: WahlMeta[];
	bezirke: BezirkWahlen[];
	/** Berlin gesamt als Summe der Bezirke, für die Fußnote der Gesamtansicht. */
	berlin: Record<WahlSlug, WahlZahlen>;
}

/**
 * Eingabe des Treemap-Kerns (`derive` in `grau.ts`) für eine Wahl in einem Gebiet.
 * `raw` ohne Sonstige und Freie Wähler. Erzeugt von `toElectionShares`.
 */
export interface ElectionShares {
	raw: Partial<Record<NamedParty, number>>;
	sonst: number;
	fw: number;
}
