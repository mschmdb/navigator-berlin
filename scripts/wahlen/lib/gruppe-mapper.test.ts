import { describe, it, expect } from 'vitest';
import { buildGruppeMappings } from './gruppe-mapper.js';
import type { FeatureCollection, Polygon } from 'geojson';

function polyFeature(properties: Record<string, unknown>) {
	return {
		type: 'Feature' as const,
		geometry: {
			type: 'Polygon' as const,
			coordinates: [
				[
					[13.4, 52.5],
					[13.5, 52.5],
					[13.5, 52.55],
					[13.4, 52.55],
					[13.4, 52.5]
				]
			]
		},
		properties
	};
}

describe('buildGruppeMappings', () => {
	it('baut dbUwbId + gruppeId für AGH26 (Spec-Beispiel Gruppe 7P)', () => {
		const geoFc: FeatureCollection<Polygon, Record<string, unknown>> = {
			type: 'FeatureCollection',
			features: [
				polyFeature({ BEZ: '09', UWB3: '726', BWB3: '7P' }),
				polyFeature({ BEZ: '09', UWB3: '727', BWB3: '7P' })
			]
		};
		const result = buildGruppeMappings(geoFc, 'agh26');
		expect(result.unresolvedFeatureCount).toBe(0);
		expect(result.mappings).toEqual([
			{ dbUwbId: '09W726', gruppeId: '09B7P', bezirkCode: '09' },
			{ dbUwbId: '09W727', gruppeId: '09B7P', bezirkCode: '09' }
		]);
	});

	it('baut dbUwbId + gruppeId für BTW25', () => {
		const geoFc: FeatureCollection<Polygon, Record<string, unknown>> = {
			type: 'FeatureCollection',
			features: [polyFeature({ BWK: '74', BEZ: '01', UWB3: '101', BWB3: '1C' })]
		};
		const result = buildGruppeMappings(geoFc, 'btw25');
		expect(result.mappings).toEqual([
			{ dbUwbId: '074-01-101-0', gruppeId: '074-01-1C-5', bezirkCode: '01' }
		]);
	});

	it('zählt Features ohne auflösbare dbUwbId/gruppeId statt sie still wegzulassen', () => {
		const geoFc: FeatureCollection<Polygon, Record<string, unknown>> = {
			type: 'FeatureCollection',
			features: [
				polyFeature({ BEZ: '09', UWB3: '726', BWB3: '7P' }),
				// leere BWB3: Urne ohne Gruppe (Preflight-Edge-Case)
				polyFeature({ BEZ: '09', UWB3: '900' })
			]
		};
		const result = buildGruppeMappings(geoFc, 'agh26');
		expect(result.mappings).toHaveLength(1);
		expect(result.unresolvedFeatureCount).toBe(1);
	});

	it('dedupliziert Features mit identischer dbUwbId', () => {
		const geoFc: FeatureCollection<Polygon, Record<string, unknown>> = {
			type: 'FeatureCollection',
			features: [
				polyFeature({ BEZ: '09', UWB3: '726', BWB3: '7P' }),
				polyFeature({ BEZ: '09', UWB3: '726', BWB3: '7P' })
			]
		};
		const result = buildGruppeMappings(geoFc, 'agh26');
		expect(result.mappings).toHaveLength(1);
	});

	it('wirft bei widersprüchlicher Gruppen-Zuordnung derselben Urne (Review-Fund: lief vorher still über den Dedup-Pfad)', () => {
		const geoFc: FeatureCollection<Polygon, Record<string, unknown>> = {
			type: 'FeatureCollection',
			features: [
				polyFeature({ BEZ: '09', UWB3: '726', BWB3: '7P' }),
				// dieselbe dbUwbId (09W726), aber eine ANDERE Gruppe (9Z statt 7P).
				polyFeature({ BEZ: '09', UWB3: '726', BWB3: '9Z' })
			]
		};
		expect(() => buildGruppeMappings(geoFc, 'agh26')).toThrow(/widersprüchlich/);
	});

	it('unbekannter wahlSlug: alle Features unresolved, keine Mappings', () => {
		const geoFc: FeatureCollection<Polygon, Record<string, unknown>> = {
			type: 'FeatureCollection',
			features: [polyFeature({ BEZ: '01', UWB3: '100', BWB3: '1A' })]
		};
		const result = buildGruppeMappings(geoFc, 'agh11');
		expect(result.mappings).toHaveLength(0);
		expect(result.unresolvedFeatureCount).toBe(1);
	});
});
