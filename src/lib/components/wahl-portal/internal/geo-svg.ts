/**
 * Story 9 (Small Multiples): reines GeoJSON→SVG-Projektions-Modul, kein
 * `d3-geo`/keine neue Dependency (Boundary), Muster `sankey-layout.ts`
 * (Eigenbau-Geometrie statt Library). Bounds → Web-Mercator-y → SVG-`d`-Pfad,
 * mit gemeinsamem `viewBox` für alle Mini-Karten derselben Projektion (Design
 * Notes: „gemeinsamer Ausschnitt").
 */
import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from 'geojson';

export interface Bounds {
	readonly minLng: number;
	readonly minLat: number;
	readonly maxLng: number;
	readonly maxLat: number;
}

/** Bounding-Box über alle Features/Ringe/Punkte einer FeatureCollection.
 * Leere Collection liefert eine degenerierte 0-Box (kein Crash). */
export function computeBounds(fc: FeatureCollection): Bounds {
	let minLng = Infinity;
	let minLat = Infinity;
	let maxLng = -Infinity;
	let maxLat = -Infinity;
	for (const feature of fc.features) {
		const geom = feature.geometry;
		if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) continue;
		const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
		for (const rings of polygons) {
			for (const ring of rings) {
				for (const [lng, lat] of ring) {
					if (lng < minLng) minLng = lng;
					if (lng > maxLng) maxLng = lng;
					if (lat < minLat) minLat = lat;
					if (lat > maxLat) maxLat = lat;
				}
			}
		}
	}
	if (!Number.isFinite(minLng)) return { minLng: 0, minLat: 0, maxLng: 0, maxLat: 0 };
	return { minLng, minLat, maxLng, maxLat };
}

export interface Projection {
	readonly width: number;
	readonly height: number;
	project(lng: number, lat: number): readonly [number, number];
}

export interface ProjectionOptions {
	readonly width?: number;
	readonly height?: number;
	readonly padding?: number;
}

const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 200;
const DEFAULT_PADDING = 4;
/** Verhindert Division durch 0 bei einer punktförmigen/linienförmigen Bounding-Box. */
const MIN_SPAN = 1e-9;

/** Grad → Radiant, dieselbe Einheit wie `mercatorY` -- x UND y müssen im
 * selben Winkel-Maß stehen, sonst kollabiert eine Achse (Live-Bug-Report
 * 20.09.: `lngSpan` blieb in Grad, `ySpan` war bereits in „Mercator-
 * Radiant", ein Faktor ~57 Unterschied ließ jede Mini-Karte auf einen
 * horizontalen Strich zusammenschrumpfen). */
function mercatorX(lngDeg: number): number {
	return (lngDeg * Math.PI) / 180;
}

function mercatorY(latDeg: number): number {
	const rad = (latDeg * Math.PI) / 180;
	return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

/**
 * Baut eine Web-Mercator-Projektion für die übergebenen Bounds: gleiche
 * Skala für x/y (winkeltreu, kein Verzerren), zentriert mit Padding in einer
 * `width`×`height`-viewBox. Alle Mini-Karten derselben Story nutzen dieselbe
 * Bounds → dieselbe Projektion → identischer Kartenausschnitt.
 *
 * Liefert `null`, wenn BEIDE Achsen keine Ausdehnung haben (oder nicht-finit
 * sind) -- eine leere/polygonlose FeatureCollection liefert von
 * `computeBounds` eine degenerierte 0-Box; ohne diesen Guard klemmte die
 * Spanne auf `MIN_SPAN` und der Scale-Faktor explodierte auf ~1e11 (EC-11).
 * Der Aufrufer zeigt in diesem Fall den Leer-Zustand statt einer sinnlosen
 * Projektion.
 */
export function buildProjection(bounds: Bounds, options: ProjectionOptions = {}): Projection | null {
	const width = options.width ?? DEFAULT_WIDTH;
	const height = options.height ?? DEFAULT_HEIGHT;
	const padding = options.padding ?? DEFAULT_PADDING;

	const x0 = mercatorX(bounds.minLng);
	const x1 = mercatorX(bounds.maxLng);
	const y0 = mercatorY(bounds.minLat);
	const y1 = mercatorY(bounds.maxLat);
	const rawLngSpan = x1 - x0;
	const rawYSpan = y1 - y0;
	if (
		!Number.isFinite(rawLngSpan) ||
		!Number.isFinite(rawYSpan) ||
		(Math.abs(rawLngSpan) < MIN_SPAN && Math.abs(rawYSpan) < MIN_SPAN)
	) {
		return null;
	}
	const lngSpan = Math.max(rawLngSpan, MIN_SPAN);
	const ySpan = Math.max(rawYSpan, MIN_SPAN);

	const availableW = Math.max(width - padding * 2, MIN_SPAN);
	const availableH = Math.max(height - padding * 2, MIN_SPAN);
	// EIN gemeinsamer scale für x UND y (winkeltreu) -- getrennte Skalen pro
	// Achse würden das Seitenverhältnis der echten Fläche verzerren.
	const scale = Math.min(availableW / lngSpan, availableH / ySpan);

	const usedW = lngSpan * scale;
	const usedH = ySpan * scale;
	const offsetX = padding + (availableW - usedW) / 2;
	const offsetY = padding + (availableH - usedH) / 2;

	return {
		width,
		height,
		project(lng: number, lat: number): readonly [number, number] {
			const x = offsetX + (mercatorX(lng) - x0) * scale;
			// Norden oben: y1 (maxLat) muss auf den kleinsten y-Bildschirmwert fallen.
			const y = offsetY + (y1 - mercatorY(lat)) * scale;
			return [x, y];
		}
	};
}

function ringToPath(ring: readonly (readonly number[])[], projection: Projection): string {
	const points = ring.map(([lng, lat]) => {
		const [x, y] = projection.project(lng, lat);
		return `${x.toFixed(2)},${y.toFixed(2)}`;
	});
	return `M${points.join('L')}Z`;
}

/** SVG-`d`-Attribut für ein Polygon/MultiPolygon-Feature, ein Teilpfad pro
 * Ring (inkl. Löcher). Deterministisch (feste Nachkommastellen). */
export function pathD(feature: Feature<Geometry>, projection: Projection): string {
	const geom = feature.geometry as Polygon | MultiPolygon;
	if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) return '';
	const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
	const parts: string[] = [];
	for (const rings of polygons) {
		for (const ring of rings) {
			parts.push(ringToPath(ring, projection));
		}
	}
	return parts.join(' ');
}
