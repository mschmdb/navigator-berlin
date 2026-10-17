import { describe, expect, it, afterEach } from 'vitest';
import { SankeyInteractionState } from './sankey-interaction-state.svelte.js';
import type { SankeyPositionedLink } from './sankey-layout.js';

/** Baut einen relativ positionierten Container + ein Zielelement mit
 * bekannter Größe/Position darin -- echte Browser-Layout-Maße statt
 * gemockter `getBoundingClientRect` (Review Triage Log #5). */
function buildContainerWithTarget(
	containerStyle: string,
	targetStyle: string
): { container: HTMLDivElement; target: HTMLDivElement } {
	const container = document.createElement('div');
	container.style.cssText = `position: relative; ${containerStyle}`;
	const target = document.createElement('div');
	target.style.cssText = `position: absolute; ${targetStyle}`;
	container.appendChild(target);
	document.body.appendChild(container);
	return { container, target };
}

const elements: HTMLElement[] = [];

afterEach(() => {
	for (const el of elements) el.remove();
	elements.length = 0;
});

function link(overrides: Partial<SankeyPositionedLink> = {}): SankeyPositionedLink {
	return {
		source: 'partei:2016:SPD',
		target: 'partei:2021:GRÜNE',
		value: 1,
		von: 'SPD',
		nach: 'GRÜNE',
		jahr: 2021,
		width: 10,
		...overrides
	};
}

describe('SankeyInteractionState#onLinkFocus (Fokus-Tooltip-Position)', () => {
	it('positioniert am echten Mittelpunkt des Elements, nicht an dessen Ecke', () => {
		// Container bewusst groß genug, dass das Rand-Clamping (eigener Test
		// unten) hier nicht zuschlägt -- dieser Test prüft NUR die
		// Mittelpunkt-Berechnung.
		const { container, target } = buildContainerWithTarget(
			'width: 600px; height: 400px;',
			'left: 50px; top: 30px; width: 20px; height: 10px;'
		);
		elements.push(container);
		const state = new SankeyInteractionState();
		state.container = container;

		const evt = { target } as unknown as FocusEvent;
		state.onLinkFocus(evt, link());

		// Mitte relativ zum Container: 50+10=60, 30+5=35 -- NICHT die Ecke (50,30).
		expect(state.tooltipPos.x).toBeCloseTo(60, 0);
		expect(state.tooltipPos.y).toBeCloseTo(35, 0);
	});

	it('klemmt die x-Position gegen den rechten Container-Rand (Tooltip max-w-xs)', () => {
		const { container, target } = buildContainerWithTarget(
			'width: 300px; height: 200px;',
			'left: 280px; top: 30px; width: 20px; height: 10px;'
		);
		elements.push(container);
		const state = new SankeyInteractionState();
		state.container = container;

		state.onLinkFocus({ target } as unknown as FocusEvent, link());

		// Rohe Mitte wäre x=290, geklemmt auf container.clientWidth(300) - 260 = 40.
		expect(state.tooltipPos.x).toBeLessThanOrEqual(40);
		expect(state.tooltipPos.x).toBeGreaterThanOrEqual(0);
	});

	it('klemmt die y-Position gegen den unteren Container-Rand', () => {
		const { container, target } = buildContainerWithTarget(
			'width: 300px; height: 200px;',
			'left: 30px; top: 190px; width: 20px; height: 10px;'
		);
		elements.push(container);
		const state = new SankeyInteractionState();
		state.container = container;

		state.onLinkFocus({ target } as unknown as FocusEvent, link());

		// Rohe Mitte wäre y=195, geklemmt auf container.clientHeight(200) - 40 = 160.
		expect(state.tooltipPos.y).toBeLessThanOrEqual(160);
	});
});

describe('SankeyInteractionState#onLinkPointerMove (Rand-Clamping)', () => {
	it('klemmt eine Pointer-Position außerhalb des Containers ebenfalls', () => {
		const { container } = buildContainerWithTarget(
			'width: 300px; height: 200px;',
			'left: 0; top: 0;'
		);
		elements.push(container);
		const state = new SankeyInteractionState();
		state.container = container;
		const rect = container.getBoundingClientRect();

		state.onLinkPointerMove(
			{ clientX: rect.left + 290, clientY: rect.top + 10 } as PointerEvent,
			link()
		);

		expect(state.tooltipPos.x).toBeLessThanOrEqual(40);
	});
});

describe('SankeyInteractionState#toggleSelectedLink (#127 Übergangs-Liste)', () => {
	it('hebt ein angetipptes Band hervor und hebt es beim zweiten Antippen auf', () => {
		const state = new SankeyInteractionState();
		state.toggleSelectedLink('a->b');
		expect(state.selectedLinkKey).toBe('a->b');
		expect(state.hoveredLinkKey).toBe('a->b');
		state.toggleSelectedLink('a->b');
		expect(state.selectedLinkKey).toBeNull();
		expect(state.hoveredLinkKey).toBeNull();
	});

	it('Hover überlagert die Auswahl nur vorübergehend', () => {
		const state = new SankeyInteractionState();
		state.toggleSelectedLink('a->b');
		state.onLinkPointerMove({ clientX: 0, clientY: 0 } as PointerEvent, link());
		expect(state.hoveredLinkKey).not.toBe('a->b');
		state.onLinkLeave();
		expect(state.hoveredLinkKey).toBe('a->b');
	});

	it('reset löscht Auswahl, Hover und Tooltip', () => {
		const state = new SankeyInteractionState();
		state.toggleSelectedLink('a->b');
		state.tooltipVisible = true;
		state.reset();
		expect(state.selectedLinkKey).toBeNull();
		expect(state.hoveredLinkKey).toBeNull();
		expect(state.tooltipVisible).toBe(false);
	});
});
