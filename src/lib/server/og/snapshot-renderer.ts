/**
 * Karten-Snapshot-Renderer via Headless Playwright + MapLibre (Story 2.6 AC-1,
 * Variante A per User-Decision).
 *
 * Lädt eine eingebettete HTML-Page mit MapLibre, dem produktiven `map-style.json`
 * und einem Boundary-Highlight für den Bezirks-/Kiez-Polygon. Wartet auf das
 * MapLibre-Event `idle` (alle Tiles + Sources sind geladen, kein Repaint pending),
 * dann screenshot 1200×630.
 *
 * IDE-Hinweis: Playwright wird lazy importiert, damit Vitest/Browser-Tests nicht
 * den Headless-Browser starten.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Bbox4 } from './og-pipeline.js';

export const SNAPSHOT_WIDTH = 1200;
export const SNAPSHOT_HEIGHT = 630;

export interface SnapshotInput {
	readonly mapStylePath: string; // absolute path to map-style.json
	readonly highlightGeoJsonPath?: string; // absolute path to GeoJSON file with polygon to highlight
	readonly highlightFeatureFilter?: { readonly property: string; readonly value: string };
	readonly bbox?: Bbox4;
	readonly padding?: number;
}

interface InternalSnapshotInput extends SnapshotInput {
	readonly mapStyleJson: string;
	readonly highlightGeoJson: string | null;
}

async function readPayloads(input: SnapshotInput): Promise<InternalSnapshotInput> {
	const mapStyleJson = await readFile(input.mapStylePath, 'utf8');
	const highlightGeoJson = input.highlightGeoJsonPath
		? await readFile(input.highlightGeoJsonPath, 'utf8')
		: null;
	return { ...input, mapStyleJson, highlightGeoJson };
}

function buildSnapshotHtml(input: InternalSnapshotInput): string {
	const styleStr = input.mapStyleJson;
	const highlightStr = input.highlightGeoJson ?? 'null';
	const filterProp = input.highlightFeatureFilter?.property ?? '';
	const filterValue = input.highlightFeatureFilter?.value ?? '';
	const bbox = input.bbox ?? null;
	const padding = input.padding ?? 40;
	return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<title>og snapshot</title>
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
<style>
  html, body, #map { margin: 0; padding: 0; width: ${SNAPSHOT_WIDTH}px; height: ${SNAPSHOT_HEIGHT}px; background: #ECEAE0; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script>
(async () => {
  const style = ${styleStr};
  const highlightFc = ${highlightStr};
  const filterProp = ${JSON.stringify(filterProp)};
  const filterValue = ${JSON.stringify(filterValue)};
  const bbox = ${bbox ? JSON.stringify(bbox) : 'null'};
  const padding = ${padding};

  let highlightFeature = null;
  if (highlightFc && filterProp) {
    highlightFeature = highlightFc.features.find((f) => f.properties && f.properties[filterProp] === filterValue) ?? null;
  } else if (highlightFc) {
    highlightFeature = highlightFc.features[0] ?? null;
  }

  const map = new maplibregl.Map({
    container: 'map',
    style,
    interactive: false,
    attributionControl: false,
    pixelRatio: 2
  });

  map.once('load', () => {
    if (highlightFeature) {
      map.addSource('og-highlight', { type: 'geojson', data: highlightFeature });
      map.addLayer({
        id: 'og-highlight-fill',
        source: 'og-highlight',
        type: 'fill',
        paint: { 'fill-color': '#2A3F7C', 'fill-opacity': 0.18 }
      });
      map.addLayer({
        id: 'og-highlight-line',
        source: 'og-highlight',
        type: 'line',
        paint: { 'line-color': '#2A3F7C', 'line-width': 3 }
      });
    }
    if (bbox) {
      map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding, animate: false, duration: 0 });
    }
    map.once('idle', () => {
      window.__OG_READY__ = true;
    });
  });
})();
</script>
</body></html>`;
}

export interface RenderSnapshotResult {
	readonly png: Buffer;
}

/**
 * Lazy-importiert Playwright und rendert einen Snapshot. Wirft, falls Chromium
 * nicht installiert (Hinweis im Fehlertext: `pnpm exec playwright install chromium`).
 */
export async function renderMapSnapshotPng(input: SnapshotInput): Promise<RenderSnapshotResult> {
	const payloads = await readPayloads(input);
	const html = buildSnapshotHtml(payloads);
	const { chromium } = await import('playwright');
	const browser = await chromium.launch({ headless: true });
	try {
		const context = await browser.newContext({
			viewport: { width: SNAPSHOT_WIDTH, height: SNAPSHOT_HEIGHT },
			deviceScaleFactor: 1
		});
		const page = await context.newPage();
		await page.setContent(html, { waitUntil: 'load' });
		await page.waitForFunction(() => Boolean((window as unknown as { __OG_READY__?: boolean }).__OG_READY__), undefined, {
			timeout: 25000
		});
		const buffer = await page.screenshot({ type: 'png', fullPage: false });
		return { png: buffer };
	} finally {
		await browser.close();
	}
}

export function _buildSnapshotHtmlForTest(input: SnapshotInput & { mapStyleJson: string; highlightGeoJson: string | null }): string {
	const internal: InternalSnapshotInput = {
		...input,
		mapStyleJson: input.mapStyleJson,
		highlightGeoJson: input.highlightGeoJson
	};
	return buildSnapshotHtml(internal);
}

export function _resolveDefaultMapStylePath(repoRoot: string): string {
	return path.join(repoRoot, 'static', 'map-style.json');
}
