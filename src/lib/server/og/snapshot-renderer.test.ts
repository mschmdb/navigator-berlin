/**
 * Pure-Function-Tests für den HTML-Template-Builder. Der eigentliche Playwright-Render
 * läuft im Snapshot-Skript end-to-end (zu langsam für Unit-Tests, ist Smoke-Coverage
 * in `scripts/og/__tests__/snapshot-smoke.test.ts` falls Chromium installed).
 */

import { describe, it, expect } from 'vitest';
import { _buildSnapshotHtmlForTest, _resolveDefaultMapStylePath } from './snapshot-renderer.js';

describe('_buildSnapshotHtmlForTest', () => {
	it('inlines map-style JSON, highlight-GeoJSON and bbox', () => {
		const html = _buildSnapshotHtmlForTest({
			mapStylePath: '/dummy',
			mapStyleJson: '{"version":8,"layers":[]}',
			highlightGeoJsonPath: '/dummy',
			highlightGeoJson: '{"type":"FeatureCollection","features":[]}',
			highlightFeatureFilter: { property: 'BZR_NAME', value: 'Karlshorst Süd' },
			bbox: [13.4, 52.5, 13.5, 52.6]
		});
		expect(html).toContain('maplibregl.Map');
		expect(html).toContain('"version":8');
		expect(html).toContain('"FeatureCollection"');
		expect(html).toContain('"BZR_NAME"');
		expect(html).toContain('Karlshorst');
		expect(html).toContain('[13.4,52.5,13.5,52.6]');
	});

	it('emits viewport-css with OG dimensions', () => {
		const html = _buildSnapshotHtmlForTest({
			mapStylePath: '/dummy',
			mapStyleJson: '{}',
			highlightGeoJson: null,
			bbox: [13, 52, 13.5, 52.5]
		});
		expect(html).toContain('width: 1200px');
		expect(html).toContain('height: 630px');
	});

	it('emits empty highlight-block when no GeoJSON provided', () => {
		const html = _buildSnapshotHtmlForTest({
			mapStylePath: '/dummy',
			mapStyleJson: '{}',
			highlightGeoJson: null
		});
		expect(html).toContain('const highlightFc = null');
	});

	it('emits attributionControl:false (Story 1.31 pattern, custom attribution)', () => {
		const html = _buildSnapshotHtmlForTest({
			mapStylePath: '/dummy',
			mapStyleJson: '{}',
			highlightGeoJson: null
		});
		expect(html).toContain('attributionControl: false');
	});
});

describe('_resolveDefaultMapStylePath', () => {
	it('points to static/map-style.json under repo root', () => {
		expect(_resolveDefaultMapStylePath('/repo')).toBe('/repo/static/map-style.json');
	});
});
