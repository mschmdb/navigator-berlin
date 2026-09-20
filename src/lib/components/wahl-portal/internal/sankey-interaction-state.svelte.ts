/**
 * Story 11 (Sankey-Rework): reaktive Hülle um die reine Interaktions-Logik
 * (`sankey-interaction.ts`) -- hält Tooltip-Sichtbarkeit/-Position/-Inhalt
 * und den Hover-Dimm-Schlüssel als Runes-State. Ausgelagert aus
 * `sankey-wahljahre.svelte` (Datei-Zeilenlimit, Boundary „Interaktion nach
 * internal/ auslagern").
 */
import type { SankeyPositionedLink, SankeyPositionedNode } from './sankey-d3.svelte.js';
import { linkKey, tooltipContentForLink, tooltipContentForNode } from './sankey-interaction.js';
import type { SankeyTooltipContent } from './sankey-tooltip.svelte';

/** Tooltip ist `max-w-xs` (320px); 260 lässt Luft für den 12px-Pointer-Offset
 * und dafür, dass die Box selten exakt 320px breit ausfällt (kürzerer
 * Inhalt) -- verhindert trotzdem, dass sie rechts aus dem Container ragt
 * (Review Triage Log #5). */
const TOOLTIP_RIGHT_MARGIN = 260;
/** Grobe Mindesthöhe von Titel + Detail-Zeile -- verhindert, dass der
 * Tooltip unten aus dem Container ragt. */
const TOOLTIP_BOTTOM_MARGIN = 40;

export class SankeyInteractionState {
	/** `bind:this` auf den relativ positionierten Wrapper um das `<svg>`. */
	container: HTMLElement | undefined = $state();
	tooltipVisible = $state(false);
	tooltipPos = $state<{ x: number; y: number }>({ x: 0, y: 0 });
	tooltipContent = $state<SankeyTooltipContent | null>(null);
	hoveredLinkKey = $state<string | null>(null);

	#relativePos(clientX: number, clientY: number): { x: number; y: number } {
		const rect = this.container?.getBoundingClientRect();
		if (!rect) return { x: clientX, y: clientY };
		return this.#clampPos({ x: clientX - rect.left, y: clientY - rect.top });
	}

	#elementCenterPos(el: Element): { x: number; y: number } {
		const elRect = el.getBoundingClientRect();
		// Echte Mitte des Elements, NICHT dessen linke obere Ecke (Review
		// Triage Log #5) -- sonst ragt der Fokus-Tooltip bei größeren
		// Knoten/Bändern systematisch nach links/oben versetzt aus der Grafik.
		return this.#relativePos(elRect.left + elRect.width / 2, elRect.top + elRect.height / 2);
	}

	/** Rand-Clamping (Review Triage Log #5): eine Stelle für Pointer- UND
	 * Fokus-Position, damit der Tooltip nie rechts/unten aus dem Container
	 * ragt. Ohne Container (noch nicht gemountet) unverändert durchreichen. */
	#clampPos(pos: { x: number; y: number }): { x: number; y: number } {
		const container = this.container;
		if (!container) return pos;
		const maxX = Math.max(0, container.clientWidth - TOOLTIP_RIGHT_MARGIN);
		const maxY = Math.max(0, container.clientHeight - TOOLTIP_BOTTOM_MARGIN);
		return { x: Math.max(0, Math.min(pos.x, maxX)), y: Math.min(pos.y, maxY) };
	}

	onLinkPointerMove(evt: PointerEvent, link: SankeyPositionedLink): void {
		this.hoveredLinkKey = linkKey(link);
		this.tooltipContent = tooltipContentForLink(link);
		this.tooltipPos = this.#relativePos(evt.clientX, evt.clientY);
		this.tooltipVisible = true;
	}

	onLinkFocus(evt: FocusEvent, link: SankeyPositionedLink): void {
		this.hoveredLinkKey = linkKey(link);
		this.tooltipContent = tooltipContentForLink(link);
		this.tooltipPos = this.#elementCenterPos(evt.target as Element);
		this.tooltipVisible = true;
	}

	onLinkLeave(): void {
		this.hoveredLinkKey = null;
		this.tooltipVisible = false;
	}

	onNodePointerMove(
		evt: PointerEvent,
		node: SankeyPositionedNode,
		gebieteMitDatenByJahr: ReadonlyMap<number, number>
	): void {
		this.tooltipContent = tooltipContentForNode(node, gebieteMitDatenByJahr);
		this.tooltipPos = this.#relativePos(evt.clientX, evt.clientY);
		this.tooltipVisible = true;
	}

	onNodeFocus(
		evt: FocusEvent,
		node: SankeyPositionedNode,
		gebieteMitDatenByJahr: ReadonlyMap<number, number>
	): void {
		this.tooltipContent = tooltipContentForNode(node, gebieteMitDatenByJahr);
		this.tooltipPos = this.#elementCenterPos(evt.target as Element);
		this.tooltipVisible = true;
	}

	onNodeLeave(): void {
		this.tooltipVisible = false;
	}
}
