import { describe, expect, it, vi } from 'vitest';
import {
	fitRegionFocus,
	removeRegionFocusOutline,
	REGION_FOCUS_LINE_ID,
	REGION_FOCUS_SOURCE_ID,
	showRegionFocusOutline,
	type RegionFocusMapLike
} from './region-focus-map.js';
import type { RegionFeature } from './region-focus.js';

const FEATURE: RegionFeature = {
	type: 'Feature',
	properties: {},
	geometry: {
		type: 'Polygon',
		coordinates: [
			[
				[13, 52],
				[13.1, 52],
				[13.1, 52.1],
				[13, 52]
			]
		]
	}
};

function fakeMap(): RegionFocusMapLike & { sources: Set<string>; layers: Set<string> } {
	const sources = new Set<string>();
	const layers = new Set<string>();
	return {
		sources,
		layers,
		addSource: vi.fn((id: string) => void sources.add(id)),
		removeSource: vi.fn((id: string) => void sources.delete(id)),
		addLayer: vi.fn((spec: Record<string, unknown>) => void layers.add(String(spec.id))),
		removeLayer: vi.fn((id: string) => void layers.delete(id)),
		getLayer: (id: string) => (layers.has(id) ? {} : undefined),
		getSource: (id: string) => (sources.has(id) ? {} : undefined),
		fitBounds: vi.fn()
	};
}

describe('region-focus-map', () => {
	it('zeichnet die Kontur mit eigenen IDs', () => {
		const map = fakeMap();
		showRegionFocusOutline(map, FEATURE);
		expect(map.sources.has(REGION_FOCUS_SOURCE_ID)).toBe(true);
		expect(map.layers.has(REGION_FOCUS_LINE_ID)).toBe(true);
		expect(REGION_FOCUS_LINE_ID).not.toMatch(/^region-outline-/);
		expect(REGION_FOCUS_SOURCE_ID).not.toMatch(/^region-outline-/);
	});

	it('ersetzt eine vorhandene Kontur statt sie zu verdoppeln', () => {
		const map = fakeMap();
		showRegionFocusOutline(map, FEATURE);
		showRegionFocusOutline(map, FEATURE);
		expect(map.sources.size).toBe(1);
		expect(map.layers.size).toBe(1);
	});

	it('entfernt die Kontur und verträgt ein zweites Entfernen', () => {
		const map = fakeMap();
		showRegionFocusOutline(map, FEATURE);
		removeRegionFocusOutline(map);
		removeRegionFocusOutline(map);
		expect(map.sources.size).toBe(0);
		expect(map.layers.size).toBe(0);
	});

	it('zoomt animiert mit Desktop-Rand', () => {
		const map = fakeMap();
		fitRegionFocus(map, [13, 52, 13.1, 52.1], { mobile: false, reducedMotion: false });
		const [bounds, opts] = (map.fitBounds as ReturnType<typeof vi.fn>).mock.calls[0]!;
		expect(bounds).toEqual([
			[13, 52],
			[13.1, 52.1]
		]);
		expect(opts.animate).toBe(true);
		expect(opts.padding.left).toBeGreaterThan(opts.padding.right);
	});

	it('lässt bei reduced motion die Animation aus und gibt mobil oben Platz', () => {
		const map = fakeMap();
		fitRegionFocus(map, [13, 52, 13.1, 52.1], { mobile: true, reducedMotion: true });
		const [, opts] = (map.fitBounds as ReturnType<typeof vi.fn>).mock.calls[0]!;
		expect(opts.animate).toBe(false);
		expect(opts.padding.top).toBeGreaterThan(opts.padding.bottom);
	});

	it('deckelt das Padding auf 40 % je Achse bei Querformat-Handys', () => {
		const map = fakeMap();
		fitRegionFocus(map, [13, 52, 13.1, 52.1], {
			mobile: true,
			reducedMotion: false,
			container: { width: 667, height: 280 }
		});
		const [, opts] = (map.fitBounds as ReturnType<typeof vi.fn>).mock.calls[0]!;
		expect(opts.padding.top + opts.padding.bottom).toBeLessThanOrEqual(280 * 0.4);
		expect(opts.padding.left + opts.padding.right).toBeLessThanOrEqual(667 * 0.4);
		expect(opts.padding.top).toBeGreaterThan(opts.padding.bottom);
	});

	it('lässt kleines Padding in großen Containern unverändert', () => {
		const map = fakeMap();
		fitRegionFocus(map, [13, 52, 13.1, 52.1], {
			mobile: false,
			reducedMotion: false,
			container: { width: 1280, height: 800 }
		});
		const [, opts] = (map.fitBounds as ReturnType<typeof vi.fn>).mock.calls[0]!;
		expect(opts.padding).toEqual({ top: 48, right: 72, bottom: 48, left: 340 });
	});
});
