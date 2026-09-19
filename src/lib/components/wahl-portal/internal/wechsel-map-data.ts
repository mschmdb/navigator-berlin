/**
 * Story 7 (Wechsel-Kapitel): Join-Logik für die Wechsel-Häufigkeits-Karte
 * (eigene, kleine Karte -- Muster `joinWinnersToFeatures`, aber Farbe nach
 * Wechsel-ANZAHL statt Partei). MapLibre-frei, kein Netzwerk-Zugriff.
 */
import type { Feature, FeatureCollection, Geometry } from 'geojson';

/**
 * Struktureller-Indigo-Rampe (Bestandsmuster, keine Partei-Farbe für
 * Nicht-Partei-Metriken, ux-blueprint.md Z. 30). 0 Wechsel = neutral.
 *
 * Kontrast (WCAG 1.4.11, ≥3:1 zwischen benachbarten Bedeutungsflächen)
 * NACHGERECHNET auf die tatsächlich gerenderte, alpha-geblendete Darstellung
 * (Karten-Deckkraft `WECHSEL_FILL_OPACITY` = 0.9 über dem hellen
 * Basemap-Grund `#EDEAE0`, `wechselContrastRatio`/`blendOverBasemap`-Helper
 * unten, geklammert in `wechsel-map-data.test.ts`): Neutral↔Stufe-1 ≈3,6:1,
 * Stufe-1↔Stufe-2+ ≈3,2:1. Die vorherige Rampe (0,75 Deckkraft) erreichte nur
 * ≈1,5:1 zwischen Neutral und Stufe-1.
 */
export const WECHSEL_NEUTRAL_FARBE = '#F5F3EE';
export const WECHSEL_FARBE_STUFE_1 = '#7568C0';
export const WECHSEL_FARBE_STUFE_2_PLUS = '#221650';

/** Deckkraft der Wechsel-Häufigkeits-Karte -- Legenden-Swatches rendern mit
 * derselben CSS-`opacity`, damit die Legende die Karten-Optik 1:1 zeigt. */
export const WECHSEL_FILL_OPACITY = 0.9;

/** Heller Basemap-Grund (`/map-style.json`-Landfläche), Blend-Referenz für
 * den Kontrast-Nachweis der alpha-transparenten Fill-Layer. */
const BASEMAP_HINTERGRUND = '#EDEAE0';

function hexToRgb(hex: string): readonly [number, number, number] {
	const clean = hex.replace('#', '');
	return [
		parseInt(clean.slice(0, 2), 16),
		parseInt(clean.slice(2, 4), 16),
		parseInt(clean.slice(4, 6), 16)
	];
}

/** Alpha-Blend einer Vordergrundfarbe über den Basemap-Grund -- die
 * tatsächlich sichtbare Farbe bei `fill-opacity < 1`. */
export function blendOverBasemap(hex: string, opacity: number): readonly [number, number, number] {
	const fg = hexToRgb(hex);
	const bg = hexToRgb(BASEMAP_HINTERGRUND);
	return [0, 1, 2].map((i) => opacity * fg[i] + (1 - opacity) * bg[i]) as unknown as readonly [
		number,
		number,
		number
	];
}

function srgbChannelToLinear(c: number): number {
	const normalized = c / 255;
	return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/** WCAG-relative Luminanz (0..1). */
export function relativeLuminance(rgb: readonly [number, number, number]): number {
	const [r, g, b] = rgb.map(srgbChannelToLinear);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG-Kontrastverhältnis zwischen zwei Farben (1..21). */
export function contrastRatio(
	a: readonly [number, number, number],
	b: readonly [number, number, number]
): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
	return (lighter + 0.05) / (darker + 0.05);
}

/** Farb-Stufe nach Wechsel-Häufigkeit: 0 neutral / 1 / 2+ (Task-Vorgabe). */
export function farbeForWechselCount(count: number): string {
	if (count <= 0) return WECHSEL_NEUTRAL_FARBE;
	if (count === 1) return WECHSEL_FARBE_STUFE_1;
	return WECHSEL_FARBE_STUFE_2_PLUS;
}

export interface WechselFeatureProperties {
	readonly gebiet_slug: string;
	readonly gebiet_name: string;
	readonly wechsel_count: number;
	readonly farbe: string;
}

export type WechselFeatureCollection = FeatureCollection<Geometry, WechselFeatureProperties>;

/**
 * Joint Geometrie-Features mit der Wechsel-Häufigkeit je Gebiet
 * (index-aligned `slugs`/`names`, Muster `joinWinnersToFeatures`).
 */
export function buildWechselFeatureCollection(
	fc: FeatureCollection,
	slugs: readonly string[],
	names: readonly string[],
	countByGebiet: ReadonlyMap<string, number>
): WechselFeatureCollection {
	const features: Feature<Geometry, WechselFeatureProperties>[] = fc.features.map((f, i) => {
		const slug = slugs[i] ?? '';
		const name = names[i] ?? '';
		const count = countByGebiet.get(slug) ?? 0;
		return {
			type: 'Feature',
			geometry: f.geometry,
			properties: {
				gebiet_slug: slug,
				gebiet_name: name,
				wechsel_count: count,
				farbe: farbeForWechselCount(count)
			}
		};
	});
	return { type: 'FeatureCollection', features };
}

/** Name-Lookup je Gebiet-Slug (index-aligned `slugs`/`names`) für die
 * Wechsel-Liste (Wechsel-Entries tragen nur den Slug). Plain `Map` bewusst
 * in einem `.ts`-Modul statt im `.svelte`-Template (`svelte/prefer-svelte-
 * reactivity` gilt nur für reaktiven Komponenten-State, nicht für diesen
 * rein abgeleiteten Lookup). */
export function buildNameBySlugMap(
	slugs: readonly string[],
	names: readonly string[]
): Map<string, string> {
	const map = new Map<string, string>();
	slugs.forEach((slug, i) => map.set(slug, names[i] ?? slug));
	return map;
}

export interface WechselTableRow {
	readonly gebiet: string;
	readonly anzahl: number;
}

/** Tabellen-Rows für die Karten-Alternative (nur Gebiete mit ≥1 Wechsel). */
export function buildWechselTableRows(fc: WechselFeatureCollection): WechselTableRow[] {
	return fc.features
		.filter((f) => f.properties.wechsel_count > 0)
		.map((f) => ({ gebiet: f.properties.gebiet_name, anzahl: f.properties.wechsel_count }))
		.sort((a, b) => b.anzahl - a.anzahl || a.gebiet.localeCompare(b.gebiet, 'de'));
}
