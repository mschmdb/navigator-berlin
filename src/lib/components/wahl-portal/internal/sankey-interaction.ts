/**
 * Story 11 (Sankey-Rework): reine Interaktions-Logik für Hover/Fokus am
 * Sankey -- Tooltip-Text je Element-Art (I/O-Matrix „Hover Band"/
 * Knoten-Tooltip) und der Dimm-Vergleich für das Hover-Highlight (aktives
 * Band volle Deckkraft, übrige gedimmt). Kein DOM-/Svelte-Zugriff, voll
 * unit-testbar; die reaktive Hover-/Fokus-Ablage (`$state`) bleibt in
 * `sankey-wahljahre.svelte` (Muster: dünne reaktive Hülle um reine Logik).
 */
import type { SankeyPositionedLink, SankeyPositionedNode } from './sankey-d3.svelte.js';
import type { SankeyTooltipContent } from './sankey-tooltip.svelte';

/** Eindeutiger Schlüssel eines Bandes für den Hover-Dimm-Vergleich. */
export function linkKey(link: Pick<SankeyPositionedLink, 'source' | 'target'>): string {
	return `${link.source}->${link.target}`;
}

/**
 * Tooltip-Text für ein Band: Von → Nach mit Jahr + Anzahl Gebiete
 * (I/O-Matrix „Hover Band").
 */
export function tooltipContentForLink(link: SankeyPositionedLink): SankeyTooltipContent {
	return { title: `${link.von} → ${link.nach}`, detail: `${link.jahr}: ${link.value} Gebiete` };
}

/**
 * Tooltip-Text für einen Partei-Knoten. Beantwortet die „Wo sind die
 * anderen Parteien?"-Frage direkt (Dominanz-Jahr-Boundary): „stärkste Kraft
 * in N von M Gebieten", M = alle Gebiete mit Daten in diesem Jahr
 * (`SankeyGraph#gebieteMitDatenByJahr`).
 */
export function tooltipContentForNode(
	node: SankeyPositionedNode,
	gebieteMitDatenByJahr: ReadonlyMap<number, number>
): SankeyTooltipContent {
	const total = gebieteMitDatenByJahr.get(node.jahr) ?? node.anzahl;
	return { title: node.label, detail: `stärkste Kraft in ${node.anzahl} von ${total} Gebieten` };
}

/** Hover-Highlight (nur Bänder dimmen, Knoten bleiben immer voll sichtbar,
 * Boundary „aktives Band volle Deckkraft, übrige gedimmt"). */
export function isLinkDimmed(
	link: Pick<SankeyPositionedLink, 'source' | 'target'>,
	hoveredKey: string | null
): boolean {
	return hoveredKey !== null && hoveredKey !== linkKey(link);
}

/** Spalten-Mittelpunkt je Jahr aus den bereits positionierten Partei-Knoten
 * -- die Jahres-Beschriftung unter der Grafik braucht keine eigene
 * Spalten-Geometrie. Plain `.ts`-Modul statt `.svelte`-Template (Muster
 * `wechsel-map-data.ts#buildNameBySlugMap`: `svelte/prefer-svelte-reactivity`
 * gilt nur für reaktiven Komponenten-State, nicht für diesen rein
 * abgeleiteten `Map`-Lookup). */
export function columnXByJahrFromNodes(
	nodes: readonly Pick<SankeyPositionedNode, 'jahr' | 'x0' | 'x1'>[]
): Map<number, number> {
	const map = new Map<number, number>();
	for (const n of nodes) {
		if (!map.has(n.jahr)) map.set(n.jahr, (n.x0 + n.x1) / 2);
	}
	return map;
}
