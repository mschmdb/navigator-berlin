<script lang="ts">
	/**
	 * #127: Sankey-Grafik auf LayerChart. `Chart` misst die echte
	 * Containerbreite, `Sankey` rechnet das d3-Layout in echten Pixeln; Bänder,
	 * Knoten und Beschriftung rendern wir selbst, damit Tastatur je Band,
	 * `aria`-Struktur, Tooltip und Hover-Highlight erhalten bleiben. Kein
	 * viewBox-Skalieren mehr: Labels behalten auf jeder Breite ihre Größe.
	 *
	 * LayerChart typisiert die `links` im Sankey-Snippet als `SankeyNode[]`;
	 * zur Laufzeit sind es d3-sankey-Links mit unserem `original`, daher der
	 * Cast auf `SankeyLaidOutLink`.
	 */
	import { Chart, Svg, Sankey, Link } from 'layerchart/svg';
	import { m } from '$lib/paraglide/messages.js';
	import { parteiColor } from '$lib/data/partei-farben.js';
	import { parteiDisplayName } from './winner-map-data.js';
	import type { SankeyGraph } from './sankey-graph.js';
	import {
		SANKEY_NODE_PADDING,
		SANKEY_NODE_WIDTH,
		SANKEY_YEAR_LABEL_SPACE,
		buildSankeyInput,
		minColumnGap,
		nodeLabelAnchor,
		sankeyChartHeight,
		sankeyLabelMargin,
		sankeyLinkSort,
		sankeyNodeAlign,
		sankeyNodeId,
		sankeyNodeSort,
		showNodeLabel,
		toPositionedLinks,
		toPositionedNodes,
		type SankeyLaidOutLink
	} from './sankey-layout.js';
	import { columnXByJahrFromNodes, isLinkDimmed, linkKey } from './sankey-interaction.js';
	import type { SankeyInteractionState } from './sankey-interaction-state.svelte.js';
	import SankeyTooltip from './sankey-tooltip.svelte';

	type Props = {
		graph: SankeyGraph;
		interaction: SankeyInteractionState;
		figureLabel: string;
	};
	let { graph, interaction, figureLabel }: Props = $props();

	let containerWidth = $state(0);
	const input = $derived(buildSankeyInput(graph));
	const labelMargin = $derived(sankeyLabelMargin(containerWidth));
	const height = $derived(sankeyChartHeight(containerWidth));
	const columnCount = $derived(graph.spalten.length);
</script>

<div
	class="relative"
	data-testid="sankey-wahljahre-chart"
	style:height="{height}px"
	bind:clientWidth={containerWidth}
	bind:this={interaction.container}
>
	{#if containerWidth > 0}
		<Chart
			data={input}
			flatData={[]}
			padding={{ left: labelMargin, right: labelMargin, top: 0, bottom: SANKEY_YEAR_LABEL_SPACE }}
		>
			{#snippet children({ context })}
				<Svg role="group" aria-label={figureLabel} data-testid="sankey-wahljahre-svg">
					<Sankey
						nodes={(d) => d.nodes}
						links={(d) => d.links}
						nodeId={sankeyNodeId}
						nodeAlign={sankeyNodeAlign}
						nodeWidth={SANKEY_NODE_WIDTH}
						nodePadding={SANKEY_NODE_PADDING}
						nodeSort={sankeyNodeSort}
						linkSort={sankeyLinkSort}
					>
						{#snippet children({ nodes, links })}
							{@const parteiNodes = toPositionedNodes(nodes)}
							{@const bandByKey = new Map(
								toPositionedLinks(links as unknown as readonly SankeyLaidOutLink[]).map((b) => [
									linkKey(b),
									b
								])
							)}
							{@const columnGap = minColumnGap(parteiNodes)}
							{@const columnXByJahr = columnXByJahrFromNodes(parteiNodes)}
							{#each links as raw (raw.original ? linkKey(raw.original) : raw.index)}
								{@const band = raw.original ? bandByKey.get(linkKey(raw.original)) : undefined}
								{#if band}
									{@const isHovered = linkKey(band) === interaction.hoveredLinkKey}
									{@const dimmed = isLinkDimmed(band, interaction.hoveredLinkKey)}
									<!-- Kein <title>-Kind: der native Browser-Tooltip legt sich sonst über
									     den eigenen sankey-tooltip. role="img" statt "button": keine
									     Aktion, nur Info (WCAG 4.1.2); Escape schließt den Tooltip ohne
									     Fokus-Verlust (WCAG 1.4.13). -->
									<Link
										sankey
										data={raw}
										fill="none"
										stroke={parteiColor(band.von)}
										strokeWidth={Math.max(band.width, 1)}
										strokeOpacity={isHovered ? 0.85 : dimmed ? 0.15 : 0.5}
										class="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus motion-safe:transition-opacity motion-safe:duration-150"
										tabindex={0}
										role="img"
										aria-label={(band.value === 1
											? m.wahl_portal_sankey_band_aria_label_singular
											: m.wahl_portal_sankey_band_aria_label_plural)({
											von: parteiDisplayName(band.von),
											nach: parteiDisplayName(band.nach),
											value: band.value
										})}
										data-testid="sankey-band"
										data-von={band.von}
										data-nach={band.nach}
										data-anzahl={band.value}
										onpointermove={(e: PointerEvent) => interaction.onLinkPointerMove(e, band)}
										onpointerleave={() => interaction.onLinkLeave()}
										onpointercancel={() => interaction.onLinkLeave()}
										onfocus={(e: FocusEvent) => interaction.onLinkFocus(e, band)}
										onblur={() => interaction.onLinkLeave()}
										onkeydown={(e: KeyboardEvent) => {
											if (e.key === 'Escape') interaction.onLinkLeave();
										}}
									/>
								{/if}
							{/each}
							{#each parteiNodes as node (node.id)}
								<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
								<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
								<rect
									x={node.x0}
									y={node.y0}
									width={node.x1 - node.x0}
									height={Math.max(node.y1 - node.y0, 1)}
									fill={node.farbe}
									tabindex="0"
									role="img"
									class="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
									aria-label={(node.anzahl === 1
										? m.wahl_portal_sankey_node_aria_label_singular
										: m.wahl_portal_sankey_node_aria_label_plural)({
										partei: parteiDisplayName(node.partei),
										jahr: node.jahr,
										anzahl: node.anzahl
									})}
									data-testid="sankey-node"
									data-jahr={node.jahr}
									data-partei={node.partei}
									data-anzahl={node.anzahl}
									onpointermove={(e) =>
										interaction.onNodePointerMove(e, node, graph.gebieteMitDatenByJahr)}
									onpointerleave={() => interaction.onNodeLeave()}
									onpointercancel={() => interaction.onNodeLeave()}
									onfocus={(e) => interaction.onNodeFocus(e, node, graph.gebieteMitDatenByJahr)}
									onblur={() => interaction.onNodeLeave()}
									onkeydown={(e) => {
										if (e.key === 'Escape') interaction.onNodeLeave();
									}}
								/>
								{#if showNodeLabel( { height: node.y1 - node.y0, column: node.column, columnCount, columnGap } )}
									<text
										x={node.column === 0 ? node.x0 - 6 : node.x1 + 6}
										y={(node.y0 + node.y1) / 2}
										text-anchor={nodeLabelAnchor(node.column)}
										dominant-baseline="middle"
										class="fill-ink text-dense-meta"
										data-testid="sankey-node-label"
									>
										{parteiDisplayName(node.label)}
									</text>
								{/if}
							{/each}
							{#each graph.spalten as spalte (spalte.jahr)}
								<text
									x={columnXByJahr.get(spalte.jahr) ?? 0}
									y={context.height + 18}
									text-anchor="middle"
									class="fill-ink text-dense-meta tabular-nums"
									data-testid="sankey-column-label"
								>
									{spalte.jahr}{spalte.istWiederholung
										? ` ${m.wahl_portal_wiederholung_kuerzel()}`
										: ''}
								</text>
							{/each}
						{/snippet}
					</Sankey>
				</Svg>
			{/snippet}
		</Chart>
	{/if}
	<SankeyTooltip
		visible={interaction.tooltipVisible}
		pos={interaction.tooltipPos}
		content={interaction.tooltipContent}
	/>
</div>
