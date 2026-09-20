/**
 * Story 9 (Small Multiples): reine Daten-Transform-Schicht für das Kapitel
 * „Stärkste und schwächste Gebiete" -- MapLibre-frei, kein Netzwerk-Zugriff.
 * Nimmt die (bereits per Loader geladenen) Partei-Anteils-Rows EINER Partei
 * für das jüngste Jahr der Reihe entgegen + die vorab projizierten
 * Kiez-Pfade (`geo-svg.ts`, gemeinsamer Ausschnitt über alle Minis) und
 * liefert Zellen + Extrem-Kieze + eine Tabellen-Row.
 */
import { parteiColor } from '$lib/data/partei-farben.js';
import { parteiOpacityForAnteil, type AnteilSpanne } from './winner-map-expressions.js';
import { NEUTRAL_FARBE, NEUTRAL_OPACITY, type WinnerApiRow } from './winner-map-data.js';

export interface KiezPathCell {
	readonly slug: string;
	readonly name: string;
	readonly path: string;
}

export interface MiniMapCell extends KiezPathCell {
	readonly anteil: number | null;
	readonly farbe: string;
	readonly opacity: number;
	readonly isStaerkste: boolean;
	readonly isSchwaechste: boolean;
}

export interface ExtremKiez {
	readonly slug: string;
	readonly name: string;
	readonly anteil: number;
}

export interface PartyMiniMap {
	readonly partei: string;
	readonly farbe: string;
	readonly hasData: boolean;
	readonly cells: readonly MiniMapCell[];
	readonly staerkste: ExtremKiez | null;
	readonly schwaechste: ExtremKiez | null;
}

export interface SmallMultiplesTableRow {
	readonly partei: string;
	readonly staerksterKiez: string;
	readonly staerksterAnteil: number | null;
	readonly schwaechsterKiez: string;
	readonly schwaechsterAnteil: number | null;
}

const KEIN_KIEZ_LABEL = 'Keine Daten';

/**
 * Extrem-Ermittlung mit deterministischem Gleichstand: bei gleichem Anteil
 * gewinnt der alphabetisch erste Name (`localeCompare('de')`), für stärksten
 * UND schwächsten Kiez gleichermaßen (I/O-Matrix „Extrem-Tie").
 */
export function computeExtremes(
	entries: readonly { readonly slug: string; readonly name: string; readonly anteil: number }[]
): { readonly staerkste: ExtremKiez | null; readonly schwaechste: ExtremKiez | null } {
	if (entries.length === 0) return { staerkste: null, schwaechste: null };
	let staerkste = entries[0];
	let schwaechste = entries[0];
	for (const entry of entries.slice(1)) {
		if (
			entry.anteil > staerkste.anteil ||
			(entry.anteil === staerkste.anteil && entry.name.localeCompare(staerkste.name, 'de') < 0)
		) {
			staerkste = entry;
		}
		if (
			entry.anteil < schwaechste.anteil ||
			(entry.anteil === schwaechste.anteil && entry.name.localeCompare(schwaechste.name, 'de') < 0)
		) {
			schwaechste = entry;
		}
	}
	return {
		staerkste: { slug: staerkste.slug, name: staerkste.name, anteil: staerkste.anteil },
		schwaechste: { slug: schwaechste.slug, name: schwaechste.name, anteil: schwaechste.anteil }
	};
}

/**
 * Baut die Mini-Karten-Daten EINER Partei für ein Jahr: `rowsForJahr` sind
 * bereits auf `partei` + das gewählte Jahr gefiltert (Aufrufer-Vertrag,
 * Muster `filterWinnersByJahr`). Ohne Rows (Partei ohne Daten in diesem
 * Jahr, z. B. BSW vor 2023): neutraler Zustand statt leerer Karte
 * (I/O-Matrix), `hasData: false`.
 *
 * `spanne` ist die REIHEN-weite Anteils-Spanne der Partei (alle Jahre ×
 * Gebiete, Review-Fund #3) -- der Aufrufer berechnet sie aus ALLEN geladenen
 * Rows der Partei, nicht nur denen des angezeigten Jahres. Das hält die
 * Opacity-Skala deckungsgleich mit der Winner-Map-Rampe (dieselbe Partei,
 * dieselbe Reihe) UND macht die Minis über Jahre hinweg vergleichbar.
 */
export function buildPartyMiniMap(
	partei: string,
	geometryCells: readonly KiezPathCell[],
	rowsForJahr: readonly WinnerApiRow[],
	spanne: AnteilSpanne
): PartyMiniMap {
	const farbe = parteiColor(partei);
	if (rowsForJahr.length === 0) {
		return {
			partei,
			farbe,
			hasData: false,
			cells: geometryCells.map((c) => ({
				...c,
				anteil: null,
				farbe: NEUTRAL_FARBE,
				opacity: NEUTRAL_OPACITY,
				isStaerkste: false,
				isSchwaechste: false
			})),
			staerkste: null,
			schwaechste: null
		};
	}

	const anteilBySlug = new Map(rowsForJahr.map((r) => [r.gebiet_slug, r.anteil] as const));
	const { min, max } = spanne;
	const { staerkste, schwaechste } = computeExtremes(
		geometryCells
			.filter((c) => anteilBySlug.has(c.slug))
			.map((c) => ({ slug: c.slug, name: c.name, anteil: anteilBySlug.get(c.slug) as number }))
	);

	const cells: MiniMapCell[] = geometryCells.map((c) => {
		const anteil = anteilBySlug.get(c.slug) ?? null;
		return {
			...c,
			anteil,
			farbe: anteil === null ? NEUTRAL_FARBE : farbe,
			opacity: anteil === null ? NEUTRAL_OPACITY : parteiOpacityForAnteil(anteil, min, max),
			isStaerkste: staerkste?.slug === c.slug,
			isSchwaechste: schwaechste?.slug === c.slug
		};
	});

	return { partei, farbe, hasData: true, cells, staerkste, schwaechste };
}

export function buildSmallMultiplesTableRow(mini: PartyMiniMap): SmallMultiplesTableRow {
	return {
		partei: mini.partei,
		staerksterKiez: mini.staerkste?.name ?? KEIN_KIEZ_LABEL,
		staerksterAnteil: mini.staerkste?.anteil ?? null,
		schwaechsterKiez: mini.schwaechste?.name ?? KEIN_KIEZ_LABEL,
		schwaechsterAnteil: mini.schwaechste?.anteil ?? null
	};
}
