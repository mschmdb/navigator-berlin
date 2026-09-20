/**
 * Story 9 Review-Fund #21 (Datei-Zeilenlimit `winner-map.svelte`, Boundary
 * <500 Zeilen): reine Text-/Spalten-Ableitungen ausgelagert, kein Zustand,
 * kein DOM-Zugriff. `buildFigureLabel`/`buildAnsichtAnnouncement` decken
 * Review-Fund #6 (figure/canvas-aria-label bleibt im Partei-Modus „Karte der
 * stärksten Partei…", kein Live-Announcement beim Tab-Wechsel).
 */
import type { TableColumn } from '$lib/components/atlas/data-table-alternative.svelte';
import { formatAnteilPct, type WinnerTableRow } from './winner-map-data.js';

export interface FigureLabelInput {
	readonly ebeneLabel: string;
	readonly jahr: number | null;
	readonly repeatElection: boolean;
	/** `null` = Gewinner-Tab. */
	readonly aktivePartei: string | null;
}

/** figure-/canvas-aria-label: nennt im Partei-Modus die Partei statt der
 * Sieger-Formulierung (Review-Fund #6). */
export function buildFigureLabel(input: FigureLabelInput): string {
	const { ebeneLabel, jahr, repeatElection, aktivePartei } = input;
	const jahrSuffix = jahr !== null ? `, ${jahr}` : '';
	const wiederholungSuffix = repeatElection ? ' (Wiederholungswahl)' : '';
	const basis = aktivePartei
		? `Karte: Anteil ${aktivePartei} je Gebiet, Ebene ${ebeneLabel}`
		: `Karte der stärksten Partei je Gebiet, Ebene ${ebeneLabel}`;
	return `${basis}${jahrSuffix}${wiederholungSuffix}`;
}

/** Text einer `role="status"`-Zeile, die einen Tab-Wechsel (Ansichts-
 * Wechsel) für Screenreader ansagt (Review-Fund #6). */
export function buildAnsichtAnnouncement(aktivePartei: string | null): string {
	return aktivePartei ? `Ansicht: Anteil ${aktivePartei}` : 'Ansicht: Stärkste Partei';
}

/** Tabellen-Spalten der Sieger-Tabelle (Gewinner-Tab); partei-spezifische
 * Caption kommt vom Aufrufer über die `caption`-Prop, nicht über die Spalten. */
export function buildWinnerTableColumns(): TableColumn<WinnerTableRow>[] {
	return [
		{ key: 'gebiet', label: 'Gebiet', sortable: true, accessor: (r) => r.gebiet },
		{ key: 'partei', label: 'Partei', sortable: true, accessor: (r) => r.partei },
		{
			key: 'anteil',
			label: 'Anteil',
			sortable: true,
			accessor: (r) => r.anteil,
			format: (v) => formatAnteilPct(Number(v))
		}
	];
}
