/**
 * Kiez-Finder-Datenlader: holt die Metrik-Quellen und normalisiert sie auf
 * 0..1 je Planungsraum (Spec _user-input/spec-kiez-finder-2026-08-22.md).
 *
 * Alles läuft über die bestehenden Manifest-/Layer-Caches; der teure Teil
 * (Geometrien, Label-Punkte, Distanzen) passiert einmal beim Öffnen des
 * Panels, danach ist jeder Slider-Move nur noch eine Paint-Expression.
 */

import type { FeatureCollection, Point, Position } from 'geojson';
import { loadManifest } from '$lib/data/manifest.js';
import { fetchLayer } from '$lib/data/internal/layer-fetch.js';
import { walkingDistanceM, walkingTimeMin } from '$lib/utils/oepnv-walking.js';
import { featureLabelPoints } from './feature-label-points.js';
import {
	buildFinderCollection,
	rankNormalize,
	sbahnFit,
	type FinderMetricInput,
	type FinderMetricKey
} from './kiez-finder-engine.js';

const SCORE_SLUG_TO_METRIC: readonly (readonly [string, FinderMetricKey])[] = [
	['kiez-score-ruhe-luft', 'm_ruhe_luft'],
	['kiez-score-gruen-hitze', 'm_gruen_hitze'],
	['kiez-score-mobilitaet', 'm_mobilitaet'],
	['kiez-score-versorgung', 'm_versorgung'],
	['kiez-score-wohnschutz', 'm_wohnschutz'],
	['kiez-score-kultur', 'm_kultur']
];

/** Kiez-Score-Layer (value 0..100 je plr_id) → Metrik 0..1. */
export function buildScoreMetric(fc: FeatureCollection): Map<string, number> {
	const out = new Map<string, number>();
	for (const feature of fc.features) {
		const props = (feature.properties ?? {}) as Record<string, unknown>;
		const plrId = props.plr_id;
		const value = props.value;
		if (typeof plrId === 'string' && typeof value === 'number') {
			out.set(plrId, Math.min(1, Math.max(0, value / 100)));
		}
	}
	return out;
}

/** Fußweg-Fit zur nächsten S-Bahn-Station je Planungsraum (Label-Punkt). */
export function buildSbahnMetric(
	plrFc: FeatureCollection,
	stations: FeatureCollection
): Map<string, number> {
	const stationCoords: Position[] = [];
	for (const feature of stations.features) {
		if (feature.geometry?.type === 'Point') {
			stationCoords.push((feature.geometry as Point).coordinates);
		}
	}
	const out = new Map<string, number>();
	if (stationCoords.length === 0) return out;
	for (const point of featureLabelPoints(plrFc).features) {
		const plrId = point.properties?.PLR_ID;
		if (typeof plrId !== 'string') continue;
		const [lng, lat] = point.geometry.coordinates;
		let minM = Infinity;
		for (const [sLng, sLat] of stationCoords) {
			const d = walkingDistanceM(lat, lng, sLat, sLng);
			if (d < minM) minM = d;
		}
		out.set(plrId, sbahnFit(walkingTimeMin(minM)));
	}
	return out;
}

export interface KiezShareRow {
	readonly bzrId: string;
	readonly partei: string;
	readonly anteil: number;
}

/**
 * Wahl-Anteile (je Bezirksregion) → Metrik je Planungsraum: Anteil der
 * gewählten Partei, normalisiert über das stadtweite Maximum, BZR auf ihre
 * PLR gespiegelt (plrId beginnt mit bzrId).
 */
export function buildParteiMetric(
	shares: readonly KiezShareRow[],
	plrIds: readonly string[],
	partei: string
): Map<string, number> {
	const byBzr = new Map<string, number>();
	let max = 0;
	for (const row of shares) {
		if (row.partei !== partei) continue;
		byBzr.set(row.bzrId, row.anteil);
		if (row.anteil > max) max = row.anteil;
	}
	const out = new Map<string, number>();
	if (max <= 0) return out;
	for (const plrId of plrIds) {
		const share = byBzr.get(plrId.slice(0, 6));
		if (share !== undefined) out.set(plrId, share / max);
	}
	return out;
}

export interface FinderBaseData {
	readonly plrFc: FeatureCollection;
	readonly plrIds: readonly string[];
	readonly metrics: FinderMetricInput;
}

interface EinwohnerRecord {
	readonly plrId?: unknown;
	readonly dichtePro_km2?: unknown;
}

/**
 * Lädt alle statischen Metriken (Scores, Dichte, S-Bahn) und die Basis-
 * Geometrie. Die Partei-Metrik kommt separat dazu (buildParteiMetric), weil
 * sie beim Chip-Wechsel neu gebaut wird.
 */
export async function loadFinderBaseData(fetchFn: typeof fetch = fetch): Promise<FinderBaseData> {
	const manifest = await loadManifest(fetchFn);
	const filenameFor = (slug: string): string | null =>
		manifest.layers.find((l) => l.slug === slug)?.filename ?? null;

	const plrFilename = filenameFor('lor-planungsraum');
	if (!plrFilename) throw new Error('lor-planungsraum fehlt im Manifest');
	const plrFc = await fetchLayer(plrFilename, fetchFn);

	const metrics: Record<string, ReadonlyMap<string, number>> = {};
	for (const [slug, metricKey] of SCORE_SLUG_TO_METRIC) {
		const filename = filenameFor(slug);
		if (!filename) continue;
		metrics[metricKey] = buildScoreMetric(await fetchLayer(filename, fetchFn));
	}

	const sbahnFilename = filenameFor('sbahn-stationen');
	if (sbahnFilename) {
		metrics.m_sbahn = buildSbahnMetric(plrFc, await fetchLayer(sbahnFilename, fetchFn));
	}

	try {
		const res = await fetchFn('/data/einwohner-lor.json', { cache: 'no-cache' });
		if (res.ok) {
			const payload = (await res.json()) as { records?: EinwohnerRecord[] };
			const dichte = new Map<string, number>();
			for (const record of payload.records ?? []) {
				if (typeof record.plrId === 'string' && typeof record.dichtePro_km2 === 'number') {
					dichte.set(record.plrId, record.dichtePro_km2);
				}
			}
			metrics.m_dichte = rankNormalize(dichte);
		}
	} catch {
		// Dichte-Kriterium bleibt neutral, der Finder funktioniert weiter.
	}

	const plrIds = plrFc.features
		.map((f) => (f.properties as Record<string, unknown> | null)?.PLR_ID)
		.filter((id): id is string => typeof id === 'string');

	return { plrFc, plrIds, metrics: metrics as FinderMetricInput };
}

export { buildFinderCollection };
