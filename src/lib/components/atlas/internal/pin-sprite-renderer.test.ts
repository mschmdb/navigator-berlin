import { SCORE_DOT_BASE_PX } from './dimension-ramps.js';
import { describe, expect, it } from 'vitest';
import { buildPinSvg, buildScoreDotSvg, pinImageId } from './pin-sprite-renderer.js';
import { PIN_ICON_MAP } from './pin-icon-mapping.js';
import { COLORS } from './colors.js';

describe('pin-sprite-renderer.buildPinSvg', () => {
	it('liefert valides SVG-Markup mit viewBox', () => {
		const spec = PIN_ICON_MAP['stolpersteine'];
		const svg = buildPinSvg(spec, COLORS[spec.colorToken]);
		expect(svg.startsWith('<svg')).toBe(true);
		expect(svg).toContain('viewBox="0 0 28 28"');
		expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
	});

	it('embedded den Layer-Color als Stroke und Outline', () => {
		const spec = PIN_ICON_MAP['trinkbrunnen'];
		const hex = COLORS[spec.colorToken];
		expect(hex).toBe('#1565C0');
		const svg = buildPinSvg(spec, hex);
		// Color erscheint mindestens 2x (circle-stroke + icon-stroke).
		const matches = svg.match(/#1565C0/gi);
		expect(matches?.length).toBeGreaterThanOrEqual(2);
	});

	it('hat einen weißen Hintergrund-Kreis (Token --bg-elevated #F5F3EA)', () => {
		const spec = PIN_ICON_MAP['kitas-2024'];
		const svg = buildPinSvg(spec, COLORS[spec.colorToken]);
		expect(svg.toLowerCase()).toContain('#f5f3ea');
		expect(svg).toContain('<circle');
	});

	it('embedded alle svgNodes der Spec als SVG-Elemente', () => {
		const spec = PIN_ICON_MAP['schulen-2024'];
		const svg = buildPinSvg(spec, COLORS[spec.colorToken]);
		// schulen-2024 hat 6 SVG-Nodes (5 paths + 1 circle).
		for (const node of spec.svgNodes) {
			if (node.tag === 'path') {
				const d = node.attrs.d as string;
				expect(svg).toContain(`d="${d}"`);
			}
		}
	});

	it('escaped Color-Hex nicht und verwendet keine Color-Names', () => {
		const spec = PIN_ICON_MAP['sportanlagen-2024'];
		const svg = buildPinSvg(spec, '#E65100');
		expect(svg).toContain('#E65100');
		expect(svg).not.toContain('currentColor');
	});

	it('verwendet stroke-linecap und stroke-linejoin round (Lucide-Default)', () => {
		const spec = PIN_ICON_MAP['bus-haltestellen'];
		const svg = buildPinSvg(spec, COLORS[spec.colorToken]);
		expect(svg).toContain('stroke-linecap="round"');
		expect(svg).toContain('stroke-linejoin="round"');
	});

	it('setzt fill="none" auf die Icon-Group damit nur die Outlines sichtbar sind', () => {
		const spec = PIN_ICON_MAP['waves' in PIN_ICON_MAP ? 'waves' : 'schwimmbaeder'];
		const svg = buildPinSvg(spec, COLORS[spec.colorToken]);
		expect(svg).toContain('fill="none"');
	});

	it('rendert für jeden bekannten Pin-Slug ohne Exception', () => {
		for (const slug of Object.keys(PIN_ICON_MAP)) {
			const spec = PIN_ICON_MAP[slug];
			const svg = buildPinSvg(spec, COLORS[spec.colorToken]);
			expect(svg).toContain('<svg');
			expect(svg.length).toBeGreaterThan(100);
		}
	});

	it('serialisiert circle/rect Nodes mit allen Attributen', () => {
		const spec = PIN_ICON_MAP['tram-haltestellen'];
		const svg = buildPinSvg(spec, COLORS[spec.colorToken]);
		// tram-front hat ein <rect> als erstes Node.
		expect(svg).toContain('width="16"');
		expect(svg).toContain('height="16"');
		expect(svg).toContain('rx="2"');
	});
});

describe('pin-sprite-renderer.pinImageId', () => {
	it('baut stable IDs pro Slug', () => {
		expect(pinImageId('stolpersteine')).toBe('navigator-pin-stolpersteine');
		expect(pinImageId('ubahn-stationen')).toBe('navigator-pin-ubahn-stationen');
	});
});

describe('buildScoreDotSvg (Punktsymbole der Sekundär-Dimension)', () => {
	it('zeichnet einen gefüllten Kreis in Dimensionsfarbe mit hellem Rand', () => {
		const svg = buildScoreDotSvg('#005381');
		expect(svg).toContain('<circle');
		expect(svg).toContain('fill="#005381"');
		expect(svg).toContain('stroke="#ECEAE0"');
	});

	it('nutzt die geteilte Basisgröße, damit icon-size-Faktoren stimmen', () => {
		const svg = buildScoreDotSvg('#005381');
		expect(svg).toContain(`width="${SCORE_DOT_BASE_PX}"`);
		expect(svg).toContain(`height="${SCORE_DOT_BASE_PX}"`);
	});
});
