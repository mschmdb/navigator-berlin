<script lang="ts" module>
	/**
	 * Story 11 (Sankey-Rework): Tooltip-Inhalt ist bereits fertig formatierter
	 * Text -- der Aufrufer (`sankey-wahljahre.svelte` über
	 * `sankey-interaction.ts`) entscheidet, ob es ein Gebiets-Band, ein
	 * Partei-Übergang oder ein Knoten ist (I/O-Matrix: unterschiedliche
	 * Tooltip-Texte je Element). Diese Komponente rendert nur.
	 */
	export interface SankeyTooltipContent {
		readonly title: string;
		readonly detail?: string;
	}
</script>

<script lang="ts">
	/**
	 * Story 11 (Sankey-Rework): Sankey-Hover-Tooltip, Muster
	 * `winner-map-tooltip.svelte` (absolut positioniert über dem Cursor,
	 * `role="tooltip"`, `aria-live="polite"`, 12px-Offset).
	 */
	type Props = {
		visible: boolean;
		pos: { x: number; y: number };
		content: SankeyTooltipContent | null;
	};

	let { visible, pos, content }: Props = $props();
</script>

{#if visible && content}
	<div
		data-testid="sankey-tooltip"
		role="tooltip"
		aria-live="polite"
		class="pointer-events-none absolute z-30 max-w-xs border border-rule bg-bg-elevated/95 px-2.5 py-1.5 text-xs text-ink shadow-lg backdrop-blur-sm"
		style="left: {pos.x + 12}px; top: {pos.y + 12}px;"
	>
		<p class="font-serif text-sm font-semibold text-ink" data-testid="sankey-tooltip-title">
			{content.title}
		</p>
		{#if content.detail}
			<p class="mt-0.5 font-mono text-xs text-ink-subtle" data-testid="sankey-tooltip-detail">
				{content.detail}
			</p>
		{/if}
	</div>
{/if}
