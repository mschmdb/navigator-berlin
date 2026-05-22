import { describe, expect, it } from 'vitest';
import { buildPinSvg, createPinMarkerElement } from './map-markers.js';

describe('buildPinSvg', () => {
	it('enthält die Farbe als fill', () => {
		const svg = buildPinSvg({ color: '#2A3F7C' });
		expect(svg).toContain('#2A3F7C');
		expect(svg).toMatch(/^<svg/);
		expect(svg).toContain('viewBox');
	});

	it('rendert weißes Label-Text-Element wenn label gesetzt', () => {
		const svg = buildPinSvg({ color: '#9E5520', label: 'B' });
		expect(svg).toContain('<text');
		expect(svg).toContain('>B<');
	});

	it('rendert weißen Innen-Kreis wenn kein label', () => {
		const svg = buildPinSvg({ color: '#2A3F7C' });
		expect(svg).toContain('<circle');
		expect(svg).not.toContain('<text');
	});

	it('escaped Label-Inhalt', () => {
		const svg = buildPinSvg({ color: '#000', label: '<b>' });
		expect(svg).not.toContain('<b>');
		expect(svg).toContain('&lt;b&gt;');
	});
});

describe('createPinMarkerElement', () => {
	it('erzeugt DIV mit pin-marker class', () => {
		const el = createPinMarkerElement({ color: '#2A3F7C' });
		expect(el.tagName).toBe('DIV');
		expect(el.className).toContain('pin-marker');
	});

	it('ist aria-hidden und klickt durch (pointer-events none)', () => {
		const el = createPinMarkerElement({ color: '#2A3F7C' });
		expect(el.getAttribute('aria-hidden')).toBe('true');
		expect(el.style.pointerEvents).toBe('none');
	});

	it('enthält ein SVG mit der Farbe', () => {
		const el = createPinMarkerElement({ color: '#9E5520', label: 'B' });
		const svg = el.querySelector('svg');
		expect(svg).not.toBeNull();
		expect(el.innerHTML).toContain('#9E5520');
		expect(el.innerHTML).toContain('>B<');
	});
});
