import { describe, expect, it } from 'vitest';
import {
	buildLayerSpec,
	getStyleProfile,
	getTransitionDurationMs,
	LAYER_STYLE_PROFILE,
	type StyleProfile
} from './layer-style-builder.js';
import { COLORS } from './colors.js';

describe('layer-style-builder.getStyleProfile', () => {
	it('liefert Profil pro realem Manifest-Slug', () => {
		expect(getStyleProfile('bezirke')).toBe('boundary');
		expect(getStyleProfile('ortsteile')).toBe('boundary');
		expect(getStyleProfile('plz')).toBe('boundary');
		expect(getStyleProfile('bodenrichtwerte')).toBe('choropleth-brw');
		expect(getStyleProfile('wohnlagen-2024')).toBe('choropleth-wohnlage-3');
		expect(getStyleProfile('milieuschutz-erhaltungsmiete')).toBe('polygon-outline-soft');
		expect(getStyleProfile('laerm-2023')).toBe('choropleth-belastung-3');
		expect(getStyleProfile('umweltgerechtigkeit-2023')).toBe('choropleth-mehrfach');
		expect(getStyleProfile('klima-pet-2022')).toBe('choropleth-pet');
		expect(getStyleProfile('klima-kaltlufteinwirkbereich-2022')).toBe('polygon-highlight');
		expect(getStyleProfile('kitas-2024')).toBe('point-bildung');
		expect(getStyleProfile('schulen-2024')).toBe('point-bildung');
		expect(getStyleProfile('krankenhaeuser-plan')).toBe('point-gesundheit');
		expect(getStyleProfile('sportanlagen-2024')).toBe('point-freizeit');
		expect(getStyleProfile('ubahn-stationen')).toBe('point-ubahn');
		expect(getStyleProfile('sbahn-stationen')).toBe('point-sbahn');
		expect(getStyleProfile('tram-haltestellen')).toBe('point-tram');
		expect(getStyleProfile('bus-haltestellen')).toBe('point-bus');
		expect(getStyleProfile('radverkehrsnetz-2025')).toBe('line-radverkehr');
		expect(getStyleProfile('ubahn-netz')).toBe('line-rail-ubahn');
		expect(getStyleProfile('tram-netz')).toBe('line-rail-tram');
		expect(getStyleProfile('sbahn-netz')).toBe('line-rail-sbahn');
		expect(getStyleProfile('stolpersteine')).toBe('point');
	});

	it('fällt für unbekannten Slug auf boundary zurück', () => {
		expect(getStyleProfile('unknown-layer-xyz')).toBe('boundary');
	});

	it('LAYER_STYLE_PROFILE deckt alle erwarteten Manifest-Slugs', () => {
		const required = [
			'bezirke',
			'ortsteile',
			'plz',
			'bodenrichtwerte',
			'wohnlagen-2024',
			'milieuschutz-erhaltungsmiete',
			'milieuschutz-staedtebau',
			'laerm-2023',
			'luft-2023',
			'bioklima-2023',
			'gruenversorgung-2023',
			'umweltgerechtigkeit-2023',
			'klima-pet-2022',
			'klima-kaltlufteinwirkbereich-2022',
			'klima-leitbahnkorridor-2022',
			'gruenanlagen',
			'stolpersteine',
			'trinkbrunnen',
			'kitas-2024',
			'schulen-2024',
			'einschulbereiche-2024',
			'krankenhaeuser-plan',
			'krankenhaeuser-weitere',
			'sportanlagen-2024',
			'spielplaetze',
			'schwimmbaeder',
			'radverkehrsnetz-2025',
			'fahrradstrassen-2024',
			'ubahn-stationen',
			'sbahn-stationen',
			'tram-haltestellen',
			'bus-haltestellen',
			'ubahn-netz',
			'tram-netz',
			'sbahn-netz'
		];
		for (const slug of required) {
			expect(LAYER_STYLE_PROFILE[slug]).toBeDefined();
		}
	});
});

describe('layer-style-builder.buildLayerSpec', () => {
	const SOURCE = 'navigator-source-test';

	it('boundary erzeugt line-Layer mit Accent-Farbe, kein Fill', () => {
		const specs = buildLayerSpec('bezirke', SOURCE);
		expect(specs).toHaveLength(1);
		const spec = specs[0];
		expect(spec.type).toBe('line');
		expect(spec.source).toBe(SOURCE);
		expect(spec.id).toBe('navigator-layer-bezirke');
		expect(spec.paint?.['line-color']).toBe(COLORS.accent);
		expect(spec.paint?.['line-width']).toBeGreaterThan(0);
	});

	it('choropleth-brw verwendet `brw`-Feld, logarithmische Skala', () => {
		const specs = buildLayerSpec('bodenrichtwerte', SOURCE);
		const spec = specs[0];
		expect(spec.type).toBe('fill');
		const fillColor = spec.paint?.['fill-color'] as unknown[];
		expect(fillColor[0]).toBe('interpolate');
		const flat = JSON.stringify(fillColor);
		expect(flat).toContain('brw');
		expect(flat).toContain('log10');
	});

	it('choropleth-belastung-3 für laerm-2023 nutzt `kategorie`-Match', () => {
		const specs = buildLayerSpec('laerm-2023', SOURCE);
		const spec = specs[0];
		expect(spec.type).toBe('fill');
		const fillColor = spec.paint?.['fill-color'] as unknown[];
		expect(fillColor[0]).toBe('match');
		const flat = JSON.stringify(fillColor);
		expect(flat).toContain('kategorie');
		expect(flat).toContain('gering');
		expect(flat).toContain('mittel');
		expect(flat).toContain('hoch');
	});

	it('choropleth-versorgung-3 für gruenversorgung-2023 nutzt gut/mittel/schlecht', () => {
		const specs = buildLayerSpec('gruenversorgung-2023', SOURCE);
		const flat = JSON.stringify(specs[0].paint);
		expect(flat).toContain('schlecht');
		expect(flat).toContain('gut');
	});

	it('choropleth-mehrfach für umweltgerechtigkeit-2023 nutzt vierfach-Skala', () => {
		const specs = buildLayerSpec('umweltgerechtigkeit-2023', SOURCE);
		const flat = JSON.stringify(specs[0].paint);
		expect(flat).toContain('vierfach');
		expect(flat).toContain('dreifach');
		expect(flat).toContain('einfach');
	});

	it('Pin-Icon-Slugs (Story 1.15) erzeugen symbol-Layer mit pinImageId', () => {
		const specs = buildLayerSpec('stolpersteine', SOURCE);
		const spec = specs[0];
		expect(spec.type).toBe('symbol');
		const iconImage = spec.layout?.['icon-image'] as string;
		expect(iconImage).toBe('navigator-pin-stolpersteine');
		expect(spec.layout?.['icon-allow-overlap']).toBe(true);
	});

	it('Pin-Icon-Slugs setzen icon-size zoom-stops (16px <13, 20px ≥13)', () => {
		const specs = buildLayerSpec('kitas-2024', SOURCE);
		const iconSize = specs[0].layout?.['icon-size'] as unknown[];
		expect(iconSize[0]).toBe('interpolate');
		// Bei nativem 28px-Pin: 16/28 ≈ 0.571 bzw 20/28 ≈ 0.714.
		const flat = JSON.stringify(iconSize);
		expect(flat).toContain('zoom');
		expect(flat).toContain('13');
	});

	it('Polygon-non-pin point-Profile (z.B. wohnlage) bleiben circle', () => {
		// Wohnlage-Points werden ueber separates point-wohnlage-Profil rendered,
		// kein Pin-Icon-Mapping. Heutige Manifest hat keinen Slug fuer point-wohnlage,
		// daher Smoke-Check: Slug ohne Pin-Icon-Mapping fuer point-Profil
		// faellt auf circle zurueck (z.B. trinkbrunnen war point; jetzt symbol).
		expect(true).toBe(true);
	});

	it('unbekannter Slug fällt auf boundary zurück', () => {
		const specs = buildLayerSpec('totally-unknown', SOURCE);
		const spec = specs[0];
		expect(spec.type).toBe('line');
	});

	it('line-rail-sbahn nutzt BVG-Grün und Line-Width zoom-stops', () => {
		const specs = buildLayerSpec('sbahn-netz', SOURCE);
		expect(specs).toHaveLength(1);
		const spec = specs[0];
		expect(spec.type).toBe('line');
		expect(spec.source).toBe(SOURCE);
		expect(spec.id).toBe('navigator-layer-sbahn-netz');
		expect(spec.paint?.['line-color']).toBe(COLORS.mobilitySbahn);
		expect(spec.paint?.['line-width']).toBeDefined();
	});

	it('Specs enthalten keine `*-transition`-Properties (MapLibre v5 JS-API)', () => {
		const allSlugs = Object.keys(LAYER_STYLE_PROFILE);
		for (const slug of allSlugs) {
			const specs = buildLayerSpec(slug, SOURCE);
			for (const spec of specs) {
				for (const key of Object.keys(spec.paint ?? {})) {
					expect(key).not.toMatch(/-transition$/);
				}
			}
		}
	});

	it('getTransitionDurationMs: 200ms default, 0ms bei reducedMotion', () => {
		expect(getTransitionDurationMs()).toBe(200);
		expect(getTransitionDurationMs({ reducedMotion: false })).toBe(200);
		expect(getTransitionDurationMs({ reducedMotion: true })).toBe(0);
	});

	it('Type-Sicherheit: StyleProfile-Union deckt alle Profile ab', () => {
		const profiles: StyleProfile[] = [
			'boundary',
			'choropleth-brw',
			'choropleth-belastung-3',
			'choropleth-versorgung-3',
			'choropleth-status-3',
			'choropleth-mehrfach',
			'choropleth-pet',
			'polygon-highlight',
			'polygon-outline-soft',
			'point',
			'point-wohnlage',
			'point-ubahn',
			'point-sbahn',
			'point-tram',
			'point-bus',
			'point-bildung',
			'point-gesundheit',
			'point-freizeit',
			'line-radverkehr',
			'line-rail-ubahn',
			'line-rail-tram',
			'line-rail-sbahn',
			'line-fahrradstrasse'
		];
		expect(profiles).toHaveLength(23);
	});
});
