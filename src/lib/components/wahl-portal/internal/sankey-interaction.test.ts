import { describe, expect, it } from 'vitest';
import {
	columnXByJahrFromNodes,
	isLinkDimmed,
	linkKey,
	tooltipContentForLink,
	tooltipContentForNode
} from './sankey-interaction.js';
import type { SankeyPositionedLink, SankeyPositionedNode } from './sankey-d3.svelte.js';

function link(overrides: Partial<SankeyPositionedLink>): SankeyPositionedLink {
	return {
		source: 'partei:2016:SPD',
		target: 'partei:2023:GRÜNE',
		value: 3,
		von: 'SPD',
		nach: 'GRÜNE',
		jahr: 2023,
		width: 10,
		path: 'M0,0',
		...overrides
	};
}

function node(overrides: Partial<SankeyPositionedNode>): SankeyPositionedNode {
	return {
		id: 'partei:2016:SPD',
		column: 0,
		label: 'SPD',
		farbe: '#A50C1A',
		anzahl: 3,
		jahr: 2016,
		partei: 'SPD',
		x0: 0,
		x1: 16,
		y0: 0,
		y1: 30,
		...overrides
	};
}

describe('linkKey', () => {
	it('ist eindeutig je (source, target)', () => {
		const a = link({ source: 'x', target: 'y' });
		const b = link({ source: 'x', target: 'z' });
		expect(linkKey(a)).not.toBe(linkKey(b));
		expect(linkKey(a)).toBe(linkKey({ ...a }));
	});
});

describe('tooltipContentForLink', () => {
	it('I/O-Matrix Hover Band: Partei-Übergang nennt Von/Nach/Jahr/Anzahl', () => {
		const l = link({ von: 'SPD', nach: 'GRÜNE', jahr: 2023, value: 3 });
		const content = tooltipContentForLink(l);
		expect(content.title).toBe('SPD → GRÜNE');
		expect(content.detail).toBe('2023: 3 Gebiete');
	});
});

describe('columnXByJahrFromNodes', () => {
	it('bildet den Mittelpunkt je Jahr aus dem ersten Knoten dieses Jahres', () => {
		const map = columnXByJahrFromNodes([
			{ jahr: 2016, x0: 0, x1: 16 },
			{ jahr: 2016, x0: 0, x1: 16 },
			{ jahr: 2023, x0: 160, x1: 176 }
		]);
		expect(map.get(2016)).toBe(8);
		expect(map.get(2023)).toBe(168);
	});

	it('leere Eingabe ergibt eine leere Map', () => {
		expect(columnXByJahrFromNodes([])).toEqual(new Map());
	});
});

describe('isLinkDimmed', () => {
	it('gehovertes Band selbst ist nicht gedimmt', () => {
		const l = link({ source: 'x', target: 'y' });
		expect(isLinkDimmed(l, linkKey(l))).toBe(false);
	});

	it('ein anderes Band ist gedimmt, wenn irgendein Band gehovert ist', () => {
		const a = link({ source: 'x', target: 'y' });
		const b = link({ source: 'x', target: 'z' });
		expect(isLinkDimmed(a, linkKey(b))).toBe(true);
	});

	it('kein Band ist gedimmt, wenn nichts gehovert ist (hoveredKey null)', () => {
		const l = link({ source: 'x', target: 'y' });
		expect(isLinkDimmed(l, null)).toBe(false);
	});
});

describe('tooltipContentForNode', () => {
	it('Partei-Knoten: „stärkste Kraft in N von M Gebieten" (Dominanz-Jahr-Erklärung)', () => {
		const n = node({ label: 'CDU', partei: 'CDU', anzahl: 120, jahr: 2023 });
		const content = tooltipContentForNode(n, new Map([[2023, 143]]));
		expect(content.title).toBe('CDU');
		expect(content.detail).toBe('stärkste Kraft in 120 von 143 Gebieten');
	});
});
