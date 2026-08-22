import { describe, expect, it } from 'vitest';
import { SCORE_DOT_SIZES } from './dimension-ramps.js';
import {
	buildLayerSpecCascade,
	isChoroplethSlug,
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

	it('dritter und folgende Choroplethen fallen defensiv auf outline (Limit greift vorher)', () => {
		const map = computeCascadeVariants([
			'laerm-2023',
			'wohnlagen-2024',
			'klima-pet-2022',
			'bodenrichtwerte'
		]);
		expect(map.get('laerm-2023')).toBe<CascadeVariant>('fill');
		expect(map.get('wohnlagen-2024')).toBe<CascadeVariant>('outline');
		expect(map.get('klima-pet-2022')).toBe<CascadeVariant>('outline');
		expect(map.get('bodenrichtwerte')).toBe<CascadeVariant>('outline');
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
		expect(map.get('klima-pet-2022')).toBe<CascadeVariant>('outline');
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

	it('outline-Variant liefert Hit-Fill + line-Spec ohne dash (PET: pmtiles ohne Dots)', () => {
		const specs = buildLayerSpecCascade('klima-pet-2022', sourceId, 'outline');
		expect(specs).toHaveLength(2);
		const [hit, line] = specs;
		expect(hit.type).toBe('fill');
		expect(hit.paint?.['fill-opacity']).toBe(0);
		expect(line.type).toBe('line');
		expect(line.paint?.['line-color']).toBeDefined();
		expect(line.paint?.['line-width']).toBe(2);
		expect(line.paint).not.toHaveProperty('fill-color');
		expect(line.paint).not.toHaveProperty('line-dasharray');
	});

	it('uebernimmt fill-color-Expression als line-color (PET: interpolate-Expression)', () => {
		const specs = buildLayerSpecCascade('klima-pet-2022', sourceId, 'outline');
		const expr = specs[1]?.paint?.['line-color'];
		expect(Array.isArray(expr)).toBe(true);
		expect((expr as unknown[])[0]).toBe('interpolate');
	});

	it('non-polygon-Slug bleibt unveraendert auch bei outline-Variant', () => {
		const baseLine = buildLayerSpecCascade('ubahn-netz', sourceId, 'fill');
		const outlineVariant = buildLayerSpecCascade('ubahn-netz', sourceId, 'outline');
		expect(outlineVariant).toEqual(baseLine);
	});

	it('Pin-Icon-Slug bleibt unveraendert auch bei outline-Variant', () => {
		const fill = buildLayerSpecCascade('kitas-2024', sourceId, 'fill');
		const dashed = buildLayerSpecCascade('kitas-2024', sourceId, 'outline');
		expect(dashed).toEqual(fill);
		expect(dashed[0]?.type).toBe('symbol');
	});

	it('id und source bleiben gleich ueber alle Variants', () => {
		const fill = buildLayerSpecCascade('laerm-2023', sourceId, 'fill');
		const outline = buildLayerSpecCascade('laerm-2023', sourceId, 'outline');
		const dash = buildLayerSpecCascade('laerm-2023', sourceId, 'outline');
		expect(outline[0]?.id).toBe(fill[0]?.id);
		expect(dash[0]?.id).toBe(fill[0]?.id);
		expect(outline[0]?.source).toBe(sourceId);
	});
});

describe('Kontur-Varianten · Multi-Layer-Kartenfarben', () => {
	it('liefert für Score-outline zwei Specs: unsichtbarer Hit-Fill + Punkt-Symbole', () => {
		const specs = buildLayerSpecCascade('kiez-score-ruhe-luft', 'src', 'outline');
		expect(specs).toHaveLength(2);
		const [hit, dots] = specs;
		// Haupt-ID bleibt der Fill: nie ein Typwechsel unter derselben ID, und
		// queryRenderedFeatures trifft die Fläche fürs Tooltip.
		expect(hit.id).toBe('navigator-layer-kiez-score-ruhe-luft');
		expect(hit.type).toBe('fill');
		expect(hit.paint?.['fill-opacity']).toBe(0);
		expect(hit.paint).not.toHaveProperty('fill-outline-color');
		// Sekundäre Dimension als abgestufte Punktsymbole statt Konturnetz:
		// ein Kreis pro Fläche, Größe = Wert-Quartil, Farbe = Dimension.
		expect(dots.id).toBe('navigator-layer-kiez-score-ruhe-luft-outline');
		expect(dots.type).toBe('symbol');
		expect(dots.source).toBe('navigator-source-kiez-score-ruhe-luft-dots');
		expect(dots.layout?.['icon-image']).toBe('navigator-score-dot-kiez-score-ruhe-luft');
		expect(dots.layout?.['icon-allow-overlap']).toBe(true);
	});

	it('staffelt die Punktgröße über die Quartil-Schwellen (klein→groß = besser)', () => {
		const [, dots] = buildLayerSpecCascade('kiez-score-ruhe-luft', 'src', 'outline');
		expect(dots.layout?.['icon-size']).toEqual([
			'step',
			['to-number', ['get', 'value'], -1],
			SCORE_DOT_SIZES[0],
			0,
			SCORE_DOT_SIZES[0],
			26,
			SCORE_DOT_SIZES[1],
			51,
			SCORE_DOT_SIZES[2],
			76,
			SCORE_DOT_SIZES[3]
		]);
	});

	it('PET-Kontur behält die feste Linienbreite (kein Dot-Spec)', () => {
		const [, line] = buildLayerSpecCascade('klima-pet-2022', 'src', 'outline');
		expect(typeof line.paint?.['line-width']).toBe('number');
	});

	it('Nicht-Score-Choroplethen bekommen ebenfalls Quadrat-Symbole (laerm)', () => {
		const [, dots] = buildLayerSpecCascade('laerm-2023', 'src', 'outline');
		expect(dots.type).toBe('symbol');
		expect(dots.layout?.['icon-image']).toBe('navigator-score-dot-laerm-2023');
		expect((dots.layout?.['icon-size'] as unknown[])[0]).toBe('match');
	});
});

describe('isChoroplethSlug · Overlay-Klasse', () => {
	it('Choroplethen: Scores, Umweltatlas, MSS, Wohnlagen, BRW, Dichte, PET', () => {
		for (const slug of [
			'kiez-score-gesamt',
			'laerm-2023',
			'mss-gesamtindex-2025',
			'wohnlagen-2024',
			'bodenrichtwerte',
			'einwohner-dichte-2024',
			'klima-pet-2022'
		]) {
			expect(isChoroplethSlug(slug)).toBe(true);
		}
	});

	it('Overlays sind KEINE Choroplethen: Kaltluft, Milieuschutz, Grünanlagen, Spielplätze', () => {
		for (const slug of [
			'klima-kaltlufteinwirkbereich-2022',
			'klima-leitbahnkorridor-2022',
			'milieuschutz-erhaltungsmiete',
			'milieuschutz-staedtebau',
			'gruenanlagen',
			'spielplaetze',
			'einschulbereiche-2024'
		]) {
			expect(isChoroplethSlug(slug)).toBe(false);
			// aber weiterhin Polygone (Hover, Hit-Testing)
			expect(isPolygonSlug(slug)).toBe(true);
		}
	});

	it('computeCascadeVariants vergibt Rollen nur an Choroplethen', () => {
		const variants = computeCascadeVariants([
			'milieuschutz-erhaltungsmiete',
			'laerm-2023',
			'milieuschutz-staedtebau',
			'kiez-score-wohnschutz'
		]);
		expect(variants.get('laerm-2023')).toBe('fill');
		expect(variants.get('kiez-score-wohnschutz')).toBe('outline');
		expect(variants.has('milieuschutz-erhaltungsmiete')).toBe(false);
		expect(variants.has('milieuschutz-staedtebau')).toBe(false);
	});
});
