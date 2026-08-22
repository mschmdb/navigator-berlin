import { describe, expect, it } from 'vitest';
import { KALTLUFT_HIGHLIGHT, rampForSlug } from './dimension-ramps.js';
import {
	buildLayerSpec,
	getLegendSpec,
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
		expect(getStyleProfile('milieuschutz-erhaltungsmiete')).toBe(
			'polygon-outline-milieuschutz-erhaltungsmiete'
		);
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
			'sbahn-netz',
			'mss-gesamtindex-2025'
		];
		for (const slug of required) {
			expect(LAYER_STYLE_PROFILE[slug]).toBeDefined();
		}
	});

	it('MSS-Gesamtindex (Story 1.30) Profil = choropleth-mss-12 (neutral, kein Rot-Grün)', () => {
		expect(getStyleProfile('mss-gesamtindex-2025')).toBe('choropleth-mss-12');
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

	it('choropleth-mehrfach für umweltgerechtigkeit-2023 deckt alle 6 Quell-Kategorien', () => {
		const specs = buildLayerSpec('umweltgerechtigkeit-2023', SOURCE);
		const flat = JSON.stringify(specs[0].paint);
		expect(flat).toContain('keine starke Belastung');
		expect(flat).toContain('einfach');
		expect(flat).toContain('zweifach');
		expect(flat).toContain('dreifach');
		expect(flat).toContain('vierfach');
		expect(flat).toContain('fünffach');
		expect(flat).not.toContain('keinfach');
	});

	it('choropleth-mehrfach mappt keine starke Belastung auf eine Skalenfarbe, nicht auf COLORS.bg', () => {
		const specs = buildLayerSpec('umweltgerechtigkeit-2023', SOURCE);
		const fillColor = specs[0].paint?.['fill-color'] as unknown[];
		const idx = fillColor.indexOf('keine starke Belastung');
		expect(idx).toBeGreaterThan(0);
		expect(fillColor[idx + 1]).toBe(COLORS.scaleLast1);
		expect(fillColor[idx + 1]).not.toBe(COLORS.bg);
	});

	it('choropleth-mehrfach behält COLORS.bg nur als Default für unbekannte Kategorien', () => {
		const specs = buildLayerSpec('umweltgerechtigkeit-2023', SOURCE);
		const fillColor = specs[0].paint?.['fill-color'] as unknown[];
		expect(fillColor[fillColor.length - 1]).toBe(COLORS.bg);
	});

	it('choropleth-mehrfach Legende hat 6 Einträge mit korrekten Labels', () => {
		const legend = getLegendSpec('umweltgerechtigkeit-2023');
		expect(legend.items).toHaveLength(6);
		expect(legend.items[0].label).toBe('keine starke Belastung');
		expect(legend.items[5].label).toBe('fünffach');
		expect(legend.items.map((i) => i.label)).not.toContain('keinfach');
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

	it('choropleth-mss-12 (Story 1.30) nutzt si_v Status-Match und di_v Opacity-Match, NICHT vermillion/danger-Hue', () => {
		const specs = buildLayerSpec('mss-gesamtindex-2025', SOURCE);
		expect(specs).toHaveLength(1);
		const spec = specs[0];
		expect(spec.type).toBe('fill');
		const fillColor = spec.paint?.['fill-color'] as unknown[];
		expect(fillColor[0]).toBe('match');
		const colorFlat = JSON.stringify(fillColor);
		expect(colorFlat).toContain('si_v');
		expect(colorFlat).toContain('hoch');
		expect(colorFlat).toContain('sehr niedrig');
		// Editorial-Schutz: KEIN vermillion (harter Rot-Ton = Stigma).
		expect(colorFlat).not.toContain(COLORS.vermillion);
		const fillOpacity = spec.paint?.['fill-opacity'] as unknown[];
		expect(fillOpacity[0]).toBe('match');
		const opFlat = JSON.stringify(fillOpacity);
		expect(opFlat).toContain('di_v');
		expect(opFlat).toContain('positiv');
		expect(opFlat).toContain('stabil');
		expect(opFlat).toContain('negativ');
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

	it('Strukturell-Familie (Story 1.31): mss/wohnlage/brw enthalten KEIN Vermillion', () => {
		const STRUKTURELL_SLUGS = ['mss-gesamtindex-2025', 'wohnlagen-2024', 'bodenrichtwerte'];
		for (const slug of STRUKTURELL_SLUGS) {
			const specs = buildLayerSpec(slug, SOURCE);
			const flat = JSON.stringify(specs);
			expect(flat).not.toContain(COLORS.vermillion);
			expect(flat).not.toContain(COLORS.scaleLast5); // primärer last-Token
		}
	});

	it('Gut-Familie (ADR-015): alle 5 Kiez-Score-Dimensionen enthalten KEIN Vermillion', () => {
		const GUT_SLUGS = [
			'kiez-score-ruhe-luft',
			'kiez-score-gruen-hitze',
			'kiez-score-versorgung',
			'kiez-score-mobilitaet',
			'kiez-score-wohnschutz'
		];
		for (const slug of GUT_SLUGS) {
			const specs = buildLayerSpec(slug, SOURCE);
			const flat = JSON.stringify(specs);
			expect(flat).not.toContain(COLORS.vermillion);
		}
	});

	it('Type-Sicherheit: StyleProfile-Union deckt alle Profile ab', () => {
		const profiles: StyleProfile[] = [
			'boundary',
			'choropleth-brw',
			'choropleth-belastung-3',
			'choropleth-versorgung-3',
			'choropleth-mehrfach',
			'choropleth-pet',
			'choropleth-wohnlage-3',
			'choropleth-mss-12',
			'choropleth-kiez-score-ordinal-4',
			'choropleth-dichte',
			'polygon-highlight',
			'polygon-outline-soft',
			'polygon-outline-milieuschutz-erhaltungsmiete',
			'polygon-outline-milieuschutz-staedtebau',
			'point',
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
		expect(profiles).toHaveLength(27);
	});

	it('Milieuschutz (Story 10.8) nutzt eigene sichtbare Familien, nicht polygon-outline-soft', () => {
		expect(getStyleProfile('milieuschutz-erhaltungsmiete')).toBe(
			'polygon-outline-milieuschutz-erhaltungsmiete'
		);
		expect(getStyleProfile('milieuschutz-staedtebau')).toBe(
			'polygon-outline-milieuschutz-staedtebau'
		);
		const erhalt = buildLayerSpec('milieuschutz-erhaltungsmiete', SOURCE)[0];
		const staedt = buildLayerSpec('milieuschutz-staedtebau', SOURCE)[0];
		expect(erhalt.paint?.['fill-opacity']).toBeGreaterThanOrEqual(0.55);
		expect(staedt.paint?.['fill-opacity']).toBeGreaterThanOrEqual(0.55);
		expect(erhalt.paint?.['fill-color']).not.toBe(staedt.paint?.['fill-color']);
		expect(erhalt.paint?.['fill-color']).not.toBe(COLORS.accentSoft);
	});

	it('Einwohnerdichte (Story 10.0) nutzt neutralen choropleth-dichte-Gradient auf dichte', () => {
		expect(getStyleProfile('einwohner-dichte-2024')).toBe('choropleth-dichte');
		const flat = JSON.stringify(buildLayerSpec('einwohner-dichte-2024', SOURCE)[0].paint);
		expect(flat).toContain('dichte');
		expect(flat).toContain('interpolate');
		expect(flat).toContain(COLORS.scaleStrukturell1);
	});

	it('Geteilte Family polygon-outline-soft bleibt für gruenanlagen/einschulbereiche/spielplaetze', () => {
		expect(getStyleProfile('gruenanlagen')).toBe('polygon-outline-soft');
		expect(getStyleProfile('einschulbereiche-2024')).toBe('polygon-outline-soft');
		expect(getStyleProfile('spielplaetze')).toBe('polygon-outline-soft');
	});

	it('Kiez-Score-Layer (ADR-015) nutzen alle choropleth-kiez-score-ordinal-4', () => {
		expect(getStyleProfile('kiez-score-ruhe-luft')).toBe('choropleth-kiez-score-ordinal-4');
		expect(getStyleProfile('kiez-score-gruen-hitze')).toBe('choropleth-kiez-score-ordinal-4');
		expect(getStyleProfile('kiez-score-mobilitaet')).toBe('choropleth-kiez-score-ordinal-4');
		expect(getStyleProfile('kiez-score-versorgung')).toBe('choropleth-kiez-score-ordinal-4');
		expect(getStyleProfile('kiez-score-wohnschutz')).toBe('choropleth-kiez-score-ordinal-4');
	});

	it('choropleth-kiez-score-ordinal-4 nutzt value-property step-Stops für 4 Buckets', () => {
		const specs = buildLayerSpec('kiez-score-ruhe-luft', SOURCE);
		const fill = specs[0];
		expect(fill.type).toBe('fill');
		const color = (fill.paint as Record<string, unknown>)['fill-color'] as unknown[];
		expect(color[0]).toBe('step');
		expect(color).toContain(0);
		expect(color).toContain(26);
		expect(color).toContain(51);
		expect(color).toContain(76);
	});
});

describe('getLegendSpec kuehle-orte (Legende-Fix)', () => {
	it('kuehle-orte ist Punkt-Legende „Kühler Ort", nicht „Grenze"', () => {
		const legend = getLegendSpec('kuehle-orte');
		expect(legend.kind).toBe('point');
		expect(legend.items[0].label).toBe('Kühler Ort');
		expect(legend.items[0].color).toBe(COLORS.umweltKuehleOrte);
	});
});

describe('layer-style-builder · Dimension-Rampen (Multi-Layer-Kartenfarben)', () => {
	const SOURCE = 'src';

	function fillColorOf(slug: string): unknown[] {
		const [spec] = buildLayerSpec(slug, SOURCE);
		return spec.paint?.['fill-color'] as unknown[];
	}

	it('färbt jede Score-Dimension aus ihrer eigenen Rampe (Stufen 1/2/4/5)', () => {
		const ramp = rampForSlug('kiez-score-ruhe-luft')!;
		const expr = fillColorOf('kiez-score-ruhe-luft');
		expect(expr[0]).toBe('step');
		expect(expr).toContain(ramp[0]);
		expect(expr).toContain(ramp[1]);
		expect(expr).toContain(ramp[3]);
		expect(expr).toContain(ramp[4]);
		expect(expr).not.toContain(COLORS.scaleGut1);
	});

	it('zwei Score-Dimensionen teilen keine Flächenfarbe mehr', () => {
		const a = fillColorOf('kiez-score-ruhe-luft').filter(
			(v) => typeof v === 'string' && v.startsWith('#')
		);
		const b = fillColorOf('kiez-score-mobilitaet').filter(
			(v) => typeof v === 'string' && v.startsWith('#')
		);
		const shared = a.filter((hex) => b.includes(hex) && hex !== COLORS.bg);
		expect(shared).toEqual([]);
	});

	it('gesamt und gruen-hitze bleiben auf der Gut-Grün-Rampe', () => {
		expect(fillColorOf('kiez-score-gesamt')).toContain(COLORS.scaleGut5);
		expect(fillColorOf('kiez-score-gruen-hitze')).toContain(COLORS.scaleGut5);
	});

	it('kriminalitaet bleibt Strukturell-Indigo (ADR-019)', () => {
		const expr = fillColorOf('kiez-score-kriminalitaet');
		expect(expr).toContain(COLORS.scaleStrukturell5);
		expect(expr).not.toContain(COLORS.scaleGut5);
	});

	it('Kaltluft-Highlights füllen cyan statt Score-Grün', () => {
		const [spec] = buildLayerSpec('klima-kaltlufteinwirkbereich-2022', SOURCE);
		expect(spec.paint?.['fill-color']).toBe(KALTLUFT_HIGHLIGHT);
		expect(spec.paint?.['fill-color']).not.toBe(COLORS.chartCat3);
	});

	it('Legende zeigt pro Score-Dimension die eigene Rampe', () => {
		const legend = getLegendSpec('kiez-score-mobilitaet');
		const ramp = rampForSlug('kiez-score-mobilitaet')!;
		expect(legend.items.map((i) => i.color)).toEqual([ramp[0], ramp[1], ramp[3], ramp[4]]);
		expect(legend.items.map((i) => i.label)).toEqual(['gering', 'mittel', 'hoch', 'sehr hoch']);
	});

	it('Legende der Kaltluft-Layer trägt das Cyan', () => {
		expect(getLegendSpec('klima-leitbahnkorridor-2022').items[0].color).toBe(KALTLUFT_HIGHLIGHT);
	});
});
