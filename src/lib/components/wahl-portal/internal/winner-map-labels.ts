/**
 * Story 9 Review-Fund #21 (Datei-Zeilenlimit `winner-map.svelte`, Boundary
 * <500 Zeilen): reine Text-/Spalten-Ableitungen ausgelagert, kein Zustand,
 * kein DOM-Zugriff. `buildFigureLabel`/`buildAnsichtAnnouncement` decken
 * Review-Fund #6 (figure/canvas-aria-label bleibt im Partei-Modus „Karte der
 * stärksten Partei…", kein Live-Announcement beim Tab-Wechsel).
 */
import { m } from '$lib/paraglide/messages.js';
import type { LocaleFormatOptions } from '$lib/i18n/format.js';
import { wahlWiederholungLabel } from '$lib/data/wahl-labels.js';
import type { TableColumn } from '$lib/components/atlas/data-table-alternative.svelte';
import { formatAnteilPct, parteiDisplayName, type WinnerTableRow } from './winner-map-data.js';

export interface FigureLabelInput {
	readonly ebeneLabel: string;
	readonly jahr: number | null;
	readonly repeatElection: boolean;
	/** `null` = Gewinner-Tab. */
	readonly aktivePartei: string | null;
}

/** figure-/canvas-aria-label: nennt im Partei-Modus die Partei statt der
 * Sieger-Formulierung (Review-Fund #6). */
export function buildFigureLabel(input: FigureLabelInput, opts?: LocaleFormatOptions): string {
	const { ebeneLabel, jahr, repeatElection, aktivePartei } = input;
	const options = { locale: opts?.locale };
	const jahrSuffix = jahr !== null ? `, ${jahr}` : '';
	const wiederholungSuffix = repeatElection ? ` (${wahlWiederholungLabel(opts)})` : '';
	const basis = aktivePartei
		? m.wahl_portal_figure_label_partei({ partei: aktivePartei, ebene: ebeneLabel }, options)
		: m.wahl_portal_figure_label_sieger({ ebene: ebeneLabel }, options);
	return `${basis}${jahrSuffix}${wiederholungSuffix}`;
}

/** Text einer `role="status"`-Zeile, die einen Tab-Wechsel (Ansichts-
 * Wechsel) für Screenreader ansagt (Review-Fund #6). */
export function buildAnsichtAnnouncement(
	aktivePartei: string | null,
	opts?: LocaleFormatOptions
): string {
	const options = { locale: opts?.locale };
	return aktivePartei
		? m.wahl_portal_ansicht_partei({ partei: aktivePartei }, options)
		: m.wahl_portal_ansicht_sieger(undefined, options);
}

/** Tabellen-Spalten der Sieger-Tabelle (Gewinner-Tab); partei-spezifische
 * Caption kommt vom Aufrufer über die `caption`-Prop, nicht über die Spalten. */
export function buildWinnerTableColumns(opts?: LocaleFormatOptions): TableColumn<WinnerTableRow>[] {
	const options = { locale: opts?.locale };
	return [
		{
			key: 'gebiet',
			label: m.wahl_portal_spalte_gebiet(undefined, options),
			sortable: true,
			accessor: (r) => r.gebiet
		},
		{
			key: 'partei',
			label: m.wahl_portal_spalte_partei(undefined, options),
			sortable: true,
			accessor: (r) => r.partei,
			// Anzeige-Text: `Sonstige` wird in EN als „Other" gezeigt, der
			// Accessor-Wert (Sortierung) bleibt der rohe Datenschlüssel.
			format: (v) => parteiDisplayName(String(v), opts)
		},
		{
			key: 'anteil',
			label: m.wahl_portal_spalte_anteil(undefined, options),
			sortable: true,
			accessor: (r) => r.anteil,
			format: (v) => formatAnteilPct(Number(v), 1, opts)
		}
	];
}
