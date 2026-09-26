/**
 * Story 6 (Ergebnis-Panel): reine Ableitung der Panel-Rows aus einer bereits
 * geladenen Series-Response (`/api/wahl/series`, ein Response pro Reihe --
 * alle Jahre × Parteien). Kein Network, kein Svelte-Import (testbar ohne
 * Component-Mount, Muster `winner-map-data.ts`).
 *
 * Deltas werden client-seitig aus den Jahres-Punkten berechnet: „vorherige
 * Wahl" ist das nächstkleinere Jahr, das in den Punkten tatsächlich
 * vorkommt (nicht zwingend `jahr - 1`, Wahlen finden nicht jährlich statt).
 */
import { m } from '$lib/paraglide/messages.js';
import { formatPercentagePointsDelta, type LocaleFormatOptions } from '$lib/i18n/format.js';
import { formatAnteilPct } from './winner-map-data.js';

/** Ein Punkt aus der Series-API-Response (`points[]`), identisch für
 * kiez/bezirk/berlin. */
export interface ErgebnisSeriesPoint {
	readonly jahr: number;
	readonly partei: string;
	readonly farbe_hex: string;
	readonly anteil: number;
	readonly stimmen: number;
	readonly is_repeat_election: boolean;
	readonly parent_slug: string | null;
	/** Vorläufiges Ergebnis (Matze-Entscheidung 23.09., 1B); optional, Default `false`. */
	readonly vorlaeufig?: boolean;
	readonly source_updated_at?: string | null;
}

export interface ErgebnisPanelRow {
	readonly rang: number;
	readonly partei: string;
	readonly farbeHex: string;
	readonly anteil: number;
	readonly anteilLabel: string;
	/** `null`: keine Vorjahres-Row für diese Partei (erste Wahl der Reihe
	 * ODER Partei neu in der Reihe) -- kein erfundener 0-Vergleich. */
	readonly deltaPp: number | null;
	/** `±x,x Pp.` mit echtem Plus/Minus (kein U+00B1), de-DE-Komma. */
	readonly deltaLabel: string | null;
}

export interface ErgebnisPanelData {
	readonly jahr: number;
	/** Jahr, gegen das die Deltas gerechnet sind; `null` = erste Wahl der Reihe. */
	readonly vorjahr: number | null;
	readonly rows: readonly ErgebnisPanelRow[];
	/** Vorläufiges Ergebnis für DIESES Jahr (Matze-Entscheidung 23.09., 1B). */
	readonly vorlaeufig: boolean;
	readonly sourceUpdatedAt: string | null;
}

const SONSTIGE = 'Sonstige';

/**
 * `±x,x Pp.` (de) / `±x.x pp` (en) mit echtem Plus/Minus (U+2212, kein
 * U+00B1). Story 8 (Trends): auch für `slope×100` (Pp./Jahr) in der Trend-
 * Karten-Tabelle und deren Takeaway (`trends-map-data.ts`) wiederverwendet
 * (Boundary Code-Map: „Bestands-Helfer", keine zweite Formatierung).
 * Delegiert an `formatPercentagePointsDelta` ($lib/i18n/format.ts, i18n
 * Block B) -- DE-Ausgabe bleibt byte-identisch zur vorherigen manuellen
 * `.toFixed(1).replace('.', ',')`-Variante.
 */
export function formatDeltaLabel(deltaPp: number, opts?: LocaleFormatOptions): string {
	return formatPercentagePointsDelta(deltaPp, { locale: opts?.locale });
}

/**
 * Rundungsstabile Pp-Differenz zweier Anteile (0..1 -> Prozentpunkte, eine
 * Dezimalstelle). Direkte Subtraktion in Fließkomma-Anteilen würde sonst
 * Artefakte wie `10.199999999999998` ins Label tragen.
 */
function deltaPpBetween(current: number, previous: number): number {
	return Math.round((current - previous) * 1000) / 10;
}

/**
 * Baut die Panel-Rows des aktiven Jahres aus der vollen Reihen-Zeitreihe.
 * Sortierung: Anteil absteigend, Gleichstand alphabetisch (de), Sonstige
 * immer ans Ende (Haus-Regel, unabhängig vom Anteil).
 */
export function buildErgebnisPanelRows(
	points: readonly ErgebnisSeriesPoint[],
	jahr: number,
	opts?: LocaleFormatOptions
): ErgebnisPanelData {
	const jahre = Array.from(new Set(points.map((p) => p.jahr))).sort((a, b) => a - b);
	const idx = jahre.indexOf(jahr);
	const vorjahr = idx > 0 ? jahre[idx - 1] : null;

	const currentPoints = points.filter((p) => p.jahr === jahr);
	const previousByPartei = new Map(
		vorjahr !== null
			? points.filter((p) => p.jahr === vorjahr).map((p) => [p.partei, p.anteil] as const)
			: []
	);

	const sorted = [...currentPoints].sort((a, b) => {
		const aSonstige = a.partei === SONSTIGE;
		const bSonstige = b.partei === SONSTIGE;
		if (aSonstige !== bSonstige) return aSonstige ? 1 : -1;
		if (b.anteil !== a.anteil) return b.anteil - a.anteil;
		return a.partei.localeCompare(b.partei, 'de');
	});

	const rows: ErgebnisPanelRow[] = sorted.map((p, i) => {
		const prevAnteil = previousByPartei.get(p.partei);
		const deltaPp = prevAnteil !== undefined ? deltaPpBetween(p.anteil, prevAnteil) : null;
		return {
			rang: i + 1,
			partei: p.partei,
			farbeHex: p.farbe_hex,
			anteil: p.anteil,
			anteilLabel: formatAnteilPct(p.anteil, 1, opts),
			deltaPp,
			deltaLabel: deltaPp !== null ? formatDeltaLabel(deltaPp, opts) : null
		};
	});

	return {
		jahr,
		vorjahr,
		rows,
		vorlaeufig: currentPoints[0]?.vorlaeufig ?? false,
		sourceUpdatedAt: currentPoints[0]?.source_updated_at ?? null
	};
}

/** Text für das Vorjahres-Label neben den Delta-Badges (Wiederholungswahl-
 * Kontext, z. B. „vs. 2021"); `null` = erste Wahl der Reihe, keine Anzeige. */
export function vorjahrLabel(vorjahr: number | null, opts?: LocaleFormatOptions): string | null {
	return vorjahr !== null
		? m.wahl_portal_vorjahr_label({ jahr: vorjahr }, { locale: opts?.locale })
		: null;
}
