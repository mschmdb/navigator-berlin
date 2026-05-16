/**
 * Spatial-Helpers für Aggregat-Pipeline (Story 2.0 T4.2).
 *
 * Wrapper um vorhandene @turf-Funktionen. KEIN neuer Geo-Code (MUST-Rule #3 + #5).
 */

import bboxFn from '@turf/bbox';
import centerFn from '@turf/center';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type {
	Feature,
	FeatureCollection,
	Polygon,
	MultiPolygon,
	Position
} from 'geojson';

type PolygonFeature = Feature<Polygon | MultiPolygon>;
type AnyFeature = Feature;

/**
 * Liefert Centroid eines Polygon-Features als [lon, lat].
 */
export function centroid(feature: AnyFeature): Position {
	const c = centerFn(feature);
	return c.geometry.coordinates as Position;
}

/**
 * Liefert die Bounding-Box eines Features (für cheap early-exit-Tests).
 */
export function bbox(feature: AnyFeature): [number, number, number, number] {
	return bboxFn(feature) as [number, number, number, number];
}

/**
 * True, wenn Punkt (lon, lat) im Polygon liegt (Punkt-in-Polygon-Test via @turf).
 */
export function pointInPolygon(point: Position, polygon: PolygonFeature): boolean {
	return booleanPointInPolygon(point, polygon);
}

/**
 * Filtert eine Feature-Collection von Punkten/Centroiden auf das Polygon.
 * Nicht-Point-Geometries werden über ihren Centroid gegen das Polygon geprüft.
 */
export function pointsInPolygon(
	features: ReadonlyArray<AnyFeature>,
	polygon: PolygonFeature
): AnyFeature[] {
	return features.filter((f) => {
		if (!f.geometry) return false;
		const pt = f.geometry.type === 'Point' ? (f.geometry.coordinates as Position) : centroid(f);
		return pointInPolygon(pt, polygon);
	});
}

/**
 * Berechnet das (ungewichtete) arithmetische Mittel einer numerischen Property
 * über eine Liste von Features. Ignoriert Features ohne gültige Zahl.
 */
export function featureMean(
	features: ReadonlyArray<AnyFeature>,
	prop: string
): number | null {
	let sum = 0;
	let count = 0;
	for (const f of features) {
		const raw = f.properties?.[prop];
		if (raw === null || raw === undefined || raw === '') continue;
		const num = typeof raw === 'number' ? raw : Number(raw);
		if (Number.isFinite(num)) {
			sum += num;
			count++;
		}
	}
	return count > 0 ? sum / count : null;
}

/**
 * Anteil der Features, deren numerische Property einen Schwellwert überschreitet.
 * Liefert Wert in [0, 1] oder null wenn keine Features.
 */
export function shareAbove(
	features: ReadonlyArray<AnyFeature>,
	prop: string,
	threshold: number
): number | null {
	let above = 0;
	let total = 0;
	for (const f of features) {
		const raw = f.properties?.[prop];
		if (raw === null || raw === undefined || raw === '') continue;
		const num = typeof raw === 'number' ? raw : Number(raw);
		if (Number.isFinite(num)) {
			total++;
			if (num > threshold) above++;
		}
	}
	return total > 0 ? above / total : null;
}

/**
 * Häufigste String-Property-Ausprägung über Features (dominante Kategorie).
 * Liefert null wenn alle Werte leer.
 */
export function dominantCategory(
	features: ReadonlyArray<AnyFeature>,
	prop: string
): string | null {
	const counts = new Map<string, number>();
	for (const f of features) {
		const v = f.properties?.[prop];
		if (typeof v !== 'string' || v.length === 0) continue;
		counts.set(v, (counts.get(v) ?? 0) + 1);
	}
	let best: { key: string; n: number } | null = null;
	for (const [key, n] of counts) {
		if (!best || n > best.n) best = { key, n };
	}
	return best ? best.key : null;
}

/**
 * Verteilung der String-Property-Ausprägungen als normalisierte Map (Summe = 1).
 */
export function categoryDistribution(
	features: ReadonlyArray<AnyFeature>,
	prop: string
): Record<string, number> {
	const counts = new Map<string, number>();
	let total = 0;
	for (const f of features) {
		const v = f.properties?.[prop];
		if (typeof v !== 'string' || v.length === 0) continue;
		counts.set(v, (counts.get(v) ?? 0) + 1);
		total++;
	}
	const out: Record<string, number> = {};
	if (total === 0) return out;
	for (const [key, n] of counts) {
		out[key] = n / total;
	}
	return out;
}

/**
 * Punkt-/Centroid-Count pro Quadratkilometer.
 * `areaSquareMeters` muss vom Caller geliefert werden (z.B. aus Manifest oder
 * @turf/area). Liefert null bei area<=0.
 */
export function countPerKm2(count: number, areaSquareMeters: number): number | null {
	if (!Number.isFinite(areaSquareMeters) || areaSquareMeters <= 0) return null;
	const km2 = areaSquareMeters / 1_000_000;
	return count / km2;
}

/**
 * Wrapper: zählt wie viele Features (Points oder Centroide nicht-Point-Features)
 * im Ziel-Polygon liegen.
 */
export function countFeaturesInPolygon(
	features: ReadonlyArray<AnyFeature>,
	polygon: PolygonFeature
): number {
	return pointsInPolygon(features, polygon).length;
}

/**
 * Hilfs-Wrapper: lädt nur die Features aus einer FeatureCollection-JSON.
 */
export function featuresOf<T extends AnyFeature>(fc: FeatureCollection | undefined): T[] {
	return ((fc?.features as T[] | undefined) ?? []).filter((f) => Boolean(f.geometry));
}
