import { describe, expect, it } from 'vitest';
import {
	buildLayerSpecCascade,
	computeCascadeVariants,
	isPolygonSlug,
	type CascadeVariant
} from './layer-style-cascade.js';

describe('layer-style-cascade.isPolygonSlug', () => {
	it('erkennt Choropleth- und Polygon-Profile als polygon', () => {
		expect(isPolygonSlug('laerm-2023')).toBe(true);
		expect(isPolygonSlug('wohnlagen-2024')).toBe(true);
		expect(isPolygonSlug('bodenrichtwerte')).toBe(true);
		expect(isPolygonSlug('klima-pet-2022')).toBe(true);
		expect(isPolygonSlug('klima-kaltlufteinwirkbereich-2022')).toBe(true);
		expect(isPolygonSlug('gruenanlagen')).toBe(true);
		expect(isPolygonSlug('milieuschutz-erhaltungsmiete')).toBe(true);
		expect(isPolygonSlug('umweltgerechtigkeit-2023')).toBe(true);
	});

	it('erkennt Boundary-/Line-/Point-Profile als nicht-polygon', () => {
		expect(isPolygonSlug('bezirke')).toBe(false);
		expect(isPolygonSlug('ortsteile')).toBe(false);
		expect(isPolygonSlug('ubahn-netz')).toBe(false);
		expect(isPolygonSlug('sbahn-netz')).toBe(false);
		expect(isPolygonSlug('radverkehrsnetz-2025')).toBe(false);
		expect(isPolygonSlug('stolpersteine')).toBe(false);
		expect(isPolygonSlug('trinkbrunnen')).toBe(false);
	});

	it('Pin-Icon-Slugs (Story 1.15) sind nicht-polygon', () => {
		expect(isPolygonSlug('kitas-2024')).toBe(false);
		expect(isPolygonSlug('schulen-2024')).toBe(false);
		expect(isPolygonSlug('krankenhaeuser-plan')).toBe(false);
		expect(isPolygonSlug('sportanlagen-2024')).toBe(false);
		expect(isPolygonSlug('ubahn-stationen')).toBe(false);
	});
});

describe('layer-style-cascade.computeCascadeVariants', () => {
	it('liefert leere Map ohne Slugs', () => {
		expect(computeCascadeVariants([]).size).toBe(0);
	});

	it('liefert leere Map wenn nur non-polygon-Slugs aktiv', () => {
		const map = computeCascadeVariants(['bezirke', 'ubahn-netz', 'stolpersteine']);
		expect(map.size).toBe(0);
	});

	it('erster Polygon-Layer = fill', () => {
		const map = computeCascadeVariants(['laerm-2023']);
		expect(map.get('laerm-2023')).toBe<CascadeVariant>('fill');
	});

	it('zweiter Polygon-Layer = outline', () => {
		const map = computeCascadeVariants(['laerm-2023', 'wohnlagen-2024']);
		expect(map.get('laerm-2023')).toBe<CascadeVariant>('fill');
		expect(map.get('wohnlagen-2024')).toBe<CascadeVariant>('outline');
	});

	it('dritter und folgende Polygon-Layer = outline-dash', () => {
		const map = computeCascadeVariants([
			'laerm-2023',
			'wohnlagen-2024',
			'klima-pet-2022',
			'bodenrichtwerte'
		]);
		expect(map.get('laerm-2023')).toBe<CascadeVariant>('fill');
		expect(map.get('wohnlagen-2024')).toBe<CascadeVariant>('outline');
		expect(map.get('klima-pet-2022')).toBe<CascadeVariant>('outline-dash');
		expect(map.get('bodenrichtwerte')).toBe<CascadeVariant>('outline-dash');
	});

	it('non-polygon-Slugs werden uebersprungen, nicht gezaehlt', () => {
		const map = computeCascadeVariants([
			'bezirke',
			'laerm-2023',
			'kitas-2024',
			'wohnlagen-2024',
			'ubahn-netz',
			'klima-pet-2022'
		]);
		expect(map.has('bezirke')).toBe(false);
		expect(map.has('kitas-2024')).toBe(false);
		expect(map.has('ubahn-netz')).toBe(false);
		expect(map.get('laerm-2023')).toBe<CascadeVariant>('fill');
		expect(map.get('wohnlagen-2024')).toBe<CascadeVariant>('outline');
		expect(map.get('klima-pet-2022')).toBe<CascadeVariant>('outline-dash');
	});
});

describe('layer-style-cascade.buildLayerSpecCascade', () => {
	const sourceId = 'src';

	it('fill-Variant returns unveraenderte Specs', () => {
		const specs = buildLayerSpecCascade('laerm-2023', sourceId, 'fill');
		expect(specs).toHaveLength(1);
		expect(specs[0]?.type).toBe('fill');
		expect(specs[0]?.paint?.['fill-color']).toBeDefined();
	});

	it('outline-Variant macht aus fill-Spec eine line-Spec ohne dash', () => {
		const specs = buildLayerSpecCascade('laerm-2023', sourceId, 'outline');
		expect(specs).toHaveLength(1);
		const spec = specs[0]!;
		expect(spec.type).toBe('line');
		expect(spec.paint?.['line-color']).toBeDefined();
		expect(spec.paint?.['line-width']).toBe(2);
		expect(spec.paint).not.toHaveProperty('fill-color');
		expect(spec.paint).not.toHaveProperty('line-dasharray');
	});

	it('outline-dash-Variant macht line-Spec mit dasharray [4,4]', () => {
		const specs = buildLayerSpecCascade('wohnlagen-2024', sourceId, 'outline-dash');
		expect(specs).toHaveLength(1);
		const spec = specs[0]!;
		expect(spec.type).toBe('line');
		expect(spec.paint?.['line-dasharray']).toEqual([4, 4]);
	});

	it('uebernimmt fill-color-Expression als line-color (z.B. match-Expression)', () => {
		const specs = buildLayerSpecCascade('laerm-2023', sourceId, 'outline');
		const expr = specs[0]?.paint?.['line-color'];
		expect(Array.isArray(expr)).toBe(true);
		expect((expr as unknown[])[0]).toBe('match');
	});

	it('non-polygon-Slug bleibt unveraendert auch bei outline-Variant', () => {
		const baseLine = buildLayerSpecCascade('ubahn-netz', sourceId, 'fill');
		const outlineVariant = buildLayerSpecCascade('ubahn-netz', sourceId, 'outline');
		expect(outlineVariant).toEqual(baseLine);
	});

	it('Pin-Icon-Slug bleibt unveraendert auch bei outline-dash-Variant', () => {
		const fill = buildLayerSpecCascade('kitas-2024', sourceId, 'fill');
		const dashed = buildLayerSpecCascade('kitas-2024', sourceId, 'outline-dash');
		expect(dashed).toEqual(fill);
		expect(dashed[0]?.type).toBe('symbol');
	});

	it('id und source bleiben gleich ueber alle Variants', () => {
		const fill = buildLayerSpecCascade('laerm-2023', sourceId, 'fill');
		const outline = buildLayerSpecCascade('laerm-2023', sourceId, 'outline');
		const dash = buildLayerSpecCascade('laerm-2023', sourceId, 'outline-dash');
		expect(outline[0]?.id).toBe(fill[0]?.id);
		expect(dash[0]?.id).toBe(fill[0]?.id);
		expect(outline[0]?.source).toBe(sourceId);
	});
});

describe('Kontur-Varianten · Multi-Layer-Kartenfarben', () => {
	it('behält die daten-getriebene Farb-Expression in der Kontur (eigene Dimension-Hue)', () => {
		const [line] = buildLayerSpecCascade('kiez-score-ruhe-luft', 'src', 'outline');
		expect(line.type).toBe('line');
		const color = line.paint?.['line-color'] as unknown[];
		expect(color[0]).toBe('step');
		expect(JSON.stringify(color)).toContain('#003D69');
	});

	it('zeichnet die gestrichelte Kontur breiter, damit der Dash-Verlust nicht blind macht', () => {
		const [solid] = buildLayerSpecCascade('kiez-score-ruhe-luft', 'src', 'outline');
		const [dashed] = buildLayerSpecCascade('kiez-score-ruhe-luft', 'src', 'outline-dash');
		expect(dashed.paint?.['line-dasharray']).toEqual([4, 4]);
		expect(dashed.paint?.['line-width'] as number).toBeGreaterThan(
			solid.paint?.['line-width'] as number
		);
	});
});
