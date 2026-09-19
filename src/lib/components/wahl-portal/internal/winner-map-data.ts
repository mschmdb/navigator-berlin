/**
 * Story 4 (Winner-Map): reine Join-/Mapping-Logik, MapLibre-frei und ohne
 * Netzwerk-Zugriff. Nimmt Geometrie-FeatureCollections (`lor-bezirksregion`
 * ODER `bezirke`, Bestandsmanifest) und die Winners-API-Rows einer Reihe
 * entgegen und liefert eine angereicherte FeatureCollection + abgeleitete
 * Tabellen-Rows + Takeaway-Satz.
 *
 * Ramp-Konstanten sind hier zentral, damit Expression (winner-map.svelte)
 * und Legende (winner-map-legende.svelte) dieselben Werte referenzieren
 * (Boundary: „Rampen-Konstanten in einem internal/-Modul, geteilt").
 */
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { parteiColor, parteiPattern, type Pattern } from '$lib/data/partei-farben.js';
import { normalizeSlug } from '$lib/data/internal/slug.js';
import { buildKiezSlugs, type KiezNameRef } from '$lib/data/internal/kiez-slug.js';
import { patternImageId } from './partei-pattern-images.js';

/** Eine Winners-Row aus `GET /api/wahl/winners` (Response-Shape der Story-2-API). */
export interface WinnerApiRow {
	readonly jahr: number | null;
	readonly gebiet_slug: string;
	readonly partei: string;
	readonly farbe_hex: string;
	readonly anteil: number;
	readonly is_repeat_election: boolean;
	readonly parent_slug: string | null;
}

export const ANTEIL_OPACITY_RAMP = {
	minAnteil: 0.15,
	minOpacity: 0.4,
	maxAnteil: 0.45,
	maxOpacity: 0.9
} as const;

/** Opacity für Gebiete ohne Winner-Match (I/O-Matrix: neutral, kein Crash). */
export const NEUTRAL_OPACITY = 0.1;

/** Farbe für Gebiete ohne Winner-Match. Bewusst NICHT `parteiColor('Sonstige')`
 * (Boundary: „Sonstige-frei"): Sonstige ist für unbekannte Partei-Labels
 * reserviert, nicht für fehlende Daten. */
export const NEUTRAL_FARBE = '#CCCCCC';

/**
 * Deckungsgleiche Opacity-Rampe zur MapLibre-`interpolate`-Expression
 * (winner-map.svelte). Reine Berechnung für Legende + Tests.
 */
export function opacityForAnteil(anteil: number): number {
	const { minAnteil, minOpacity, maxAnteil, maxOpacity } = ANTEIL_OPACITY_RAMP;
	if (anteil <= minAnteil) return minOpacity;
	if (anteil >= maxAnteil) return maxOpacity;
	const t = (anteil - minAnteil) / (maxAnteil - minAnteil);
	return minOpacity + t * (maxOpacity - minOpacity);
}

/** Filtert die Bulk-Winners-Response auf ein einzelnes Jahr (client-seitig, kein Re-Fetch). */
export function filterWinnersByJahr(
	winners: readonly WinnerApiRow[],
	jahr: number
): WinnerApiRow[] {
	return winners.filter((w) => w.jahr === jahr);
}

/** Ob die Winners-Rows eines Jahres eine Wiederholungswahl sind (Caption-Hinweis). */
export function isRepeatElectionYear(winnersForJahr: readonly WinnerApiRow[]): boolean {
	return winnersForJahr.length > 0 && winnersForJahr.some((w) => w.is_repeat_election);
}

function bezCodeToBezirkName(bezirkeFc: FeatureCollection): Map<string, string> {
	const map = new Map<string, string>();
	for (const f of bezirkeFc.features) {
		const props = (f.properties ?? {}) as Record<string, unknown>;
		const schluessel = props.Schluessel_gesamt;
		const name = props.Gemeinde_name;
		if (typeof schluessel === 'string' && typeof name === 'string') {
			map.set(schluessel.slice(-2), name);
		}
	}
	return map;
}

/**
 * Kiez-Slug-Brücke: Index-aligned zu `kiezFc.features`. Reuse `buildKiezSlugs`
 * (Story 8.2b) über BZR_NAME + Bezirk-Name (aus `bezirke.geojson` via BEZ-Code),
 * damit die disambiguierten Slugs identisch zu `resolve-spatial-level.ts` und
 * dem DB-seitigen `kiez_slug` sind (Muster resolve-spatial-level.ts:139-152).
 */
export function buildKiezSlugsForFeatures(
	kiezFc: FeatureCollection,
	bezirkeFc: FeatureCollection
): string[] {
	const bezMap = bezCodeToBezirkName(bezirkeFc);
	const refs: KiezNameRef[] = kiezFc.features.map((f) => {
		const props = (f.properties ?? {}) as Record<string, unknown>;
		const name = typeof props.BZR_NAME === 'string' ? props.BZR_NAME : '';
		const bezCode = typeof props.BEZ === 'string' ? props.BEZ : '';
		const bezirk = bezMap.get(bezCode) ?? '';
		return { name, bezirk };
	});
	return buildKiezSlugs(refs);
}

/** Bezirk-Slug-Brücke: Index-aligned zu `bezirkeFc.features` (bare `normalizeSlug`). */
export function bezirkSlugsForFeatures(bezirkeFc: FeatureCollection): string[] {
	return bezirkeFc.features.map((f) => {
		const props = (f.properties ?? {}) as Record<string, unknown>;
		const name = typeof props.Gemeinde_name === 'string' ? props.Gemeinde_name : '';
		return normalizeSlug(name);
	});
}

/**
 * Anzeige-Namen der Kiez-Features, index-aligned zu `buildKiezSlugsForFeatures`.
 * Duplikat-Namen (z. B. zweimal „Heerstraße") bekommen den Bezirk in Klammern,
 * damit Tabelle und Tooltip unterscheidbar bleiben.
 */
export function kiezNamesForFeatures(
	kiezFc: FeatureCollection,
	bezirkeFc: FeatureCollection
): string[] {
	const bezMap = bezCodeToBezirkName(bezirkeFc);
	const raw = kiezFc.features.map((f) => {
		const props = (f.properties ?? {}) as Record<string, unknown>;
		return typeof props.BZR_NAME === 'string' ? props.BZR_NAME : '';
	});
	const counts = new Map<string, number>();
	for (const name of raw) counts.set(name, (counts.get(name) ?? 0) + 1);
	return raw.map((name, i) => {
		if ((counts.get(name) ?? 0) <= 1) return name;
		const props = (kiezFc.features[i].properties ?? {}) as Record<string, unknown>;
		const bezCode = typeof props.BEZ === 'string' ? props.BEZ : '';
		const bezirk = bezMap.get(bezCode);
		return bezirk ? `${name} (${bezirk})` : name;
	});
}

/** Anzeige-Namen der Bezirk-Features, index-aligned zu `bezirkSlugsForFeatures`. */
export function bezirkNamesForFeatures(bezirkeFc: FeatureCollection): string[] {
	return bezirkeFc.features.map((f) => {
		const props = (f.properties ?? {}) as Record<string, unknown>;
		return typeof props.Gemeinde_name === 'string' ? props.Gemeinde_name : '';
	});
}

export interface WinnerFeatureProperties {
	readonly gebiet_slug: string;
	readonly gebiet_name: string;
	readonly partei: string | null;
	readonly farbe: string;
	readonly pattern: Pattern;
	readonly pattern_image_id: string | null;
	readonly anteil: number;
	readonly has_winner: 0 | 1;
}

export type WinnerFeatureCollection = FeatureCollection<Geometry, WinnerFeatureProperties>;

/**
 * Joint Geometrie-Features mit Winners-Rows über die (index-aligned) Slug-
 * Brücke. Nicht-gematchte Gebiete bleiben neutral (has_winner 0, Sonstige-frei).
 * Unbekannte Partei-Labels fallen über `parteiColor`/`parteiPattern` auf
 * „Sonstige" zurück (Boundary: Label selbst bleibt der echte Kurzname).
 */
export function joinWinnersToFeatures(
	fc: FeatureCollection,
	slugs: readonly string[],
	names: readonly string[],
	winnersForJahr: readonly WinnerApiRow[]
): WinnerFeatureCollection {
	const winnerBySlug = new Map(winnersForJahr.map((w) => [w.gebiet_slug, w] as const));
	const features: Feature<Geometry, WinnerFeatureProperties>[] = fc.features.map((f, i) => {
		const slug = slugs[i] ?? '';
		const name = names[i] ?? '';
		const winner = winnerBySlug.get(slug);
		const props: WinnerFeatureProperties = winner
			? {
					gebiet_slug: slug,
					gebiet_name: name,
					partei: winner.partei,
					farbe: parteiColor(winner.partei),
					pattern: parteiPattern(winner.partei),
					pattern_image_id: patternImageId(winner.partei),
					anteil: winner.anteil,
					has_winner: 1
				}
			: {
					gebiet_slug: slug,
					gebiet_name: name,
					partei: null,
					farbe: NEUTRAL_FARBE,
					pattern: 'solid',
					pattern_image_id: null,
					anteil: 0,
					has_winner: 0
				};
		return { type: 'Feature', geometry: f.geometry, properties: props };
	});
	return { type: 'FeatureCollection', features };
}

export interface WinnerTableRow {
	readonly gebiet: string;
	readonly partei: string;
	readonly anteil: number;
}

/** Tabellen-Rows für `DataTableAlternative`, nur gematchte Gebiete (I/O-Matrix). */
export function buildTableRows(fc: WinnerFeatureCollection): WinnerTableRow[] {
	const rows: WinnerTableRow[] = [];
	for (const f of fc.features) {
		const p = f.properties;
		if (p.has_winner !== 1 || p.partei === null) continue;
		rows.push({ gebiet: p.gebiet_name, partei: p.partei, anteil: p.anteil });
	}
	return rows;
}

const EMPTY_TAKEAWAY = 'Für dieses Jahr liegen keine Gebiets-Ergebnisse vor.';

/**
 * Deskriptiver Kapitel-Satz aus den abgeleiteten Rows (CAP-8-Vorgriff).
 * `lint:wahl`-konform: keine Wertungs- oder Dominanz-Sprache, nur Anteils-Fakten.
 */
export function buildTakeawaySentence(
	rows: readonly WinnerTableRow[],
	totalGebiete: number
): string {
	if (rows.length === 0) return EMPTY_TAKEAWAY;
	const counts = new Map<string, number>();
	for (const r of rows) counts.set(r.partei, (counts.get(r.partei) ?? 0) + 1);
	let topPartei = rows[0].partei;
	let topCount = 0;
	for (const [partei, count] of counts) {
		// Gleichstand alphabetisch aufloesen (konsistent zur Analytik), sonst
		// hinge der genannte Name an der Row-Reihenfolge.
		if (count > topCount || (count === topCount && partei.localeCompare(topPartei, 'de') < 0)) {
			topCount = count;
			topPartei = partei;
		}
	}
	return `Stärkste Kraft in ${topCount} von ${totalGebiete} Gebieten: ${topPartei}`;
}

/**
 * Berechnungs-Transparenz-Satz für die Ebenen-Aggregation (Human-Ergänzung
 * 19.09.: Kiez-Werte sind ein abgeleitetes Aggregat aus Stimmbezirken, kein
 * amtlicher Originalwert wie die Bezirks-Summen -- muss direkt an der Karte
 * stehen, nicht nur in der Methodik-Doku verlinkt).
 */
export function aggregationHinweisText(ebene: 'kiez' | 'bezirk'): string {
	return ebene === 'kiez'
		? 'Kiez-Werte: Stimmbezirke der Wahl, per Flächen-Zuordnung auf die 143 Berliner Kieze aggregiert.'
		: 'Bezirks-Werte: amtliche Bezirks-Summen.';
}

/** Geteilte Prozent-Formatierung (Tooltip, Tabelle, Legende). */
export function formatAnteilPct(anteil: number, decimals: 0 | 1 = 1): string {
	const pct = anteil * 100;
	if (decimals === 0) return `${Math.round(pct)} %`;
	return `${pct.toFixed(1).replace('.', ',')} %`;
}
