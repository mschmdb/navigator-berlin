<script lang="ts" module>
	export interface WinnerTooltipData {
		readonly gebietName: string;
		readonly partei: string | null;
		readonly anteil: number;
		readonly hasWinner: boolean;
	}
</script>

<script lang="ts">
	/**
	 * Story 4 (Winner-Map): Navigator-Hover-Tooltip statt nacktem MapLibre-
	 * Klick-Popup (Human-Korrektur 19.09., Muster `map-hover-tooltip.svelte`
	 * -- absolut positioniert über dem Cursor, `role="tooltip"`, kein
	 * HTML-String-Popup). Bewusst ein eigenes schlankes Bauteil statt Reuse
	 * der Atlas-Hover-Komponente: die ist an die generische Multi-Layer-
	 * Registry der Hauptkarte gekoppelt (`buildMultiHoverContent`), die
	 * Winner-Map hat nur einen einzigen Custom-Layer mit eigenen Properties.
	 */
	import { parteiColor } from '$lib/data/partei-farben.js';
	import { formatAnteilPct } from './internal/winner-map-data.js';

	type Props = {
		visible: boolean;
		pos: { x: number; y: number };
		data: WinnerTooltipData | null;
		jahr: number | null;
		repeatElection: boolean;
	};

	let { visible, pos, data, jahr, repeatElection }: Props = $props();


</script>

{#if visible && data}
	<div
		data-testid="winner-map-tooltip"
		role="tooltip"
		aria-live="polite"
		class="pointer-events-none absolute z-30 max-w-xs border border-rule bg-bg-elevated/95 px-2.5 py-1.5 text-xs text-ink shadow-lg backdrop-blur-sm"
		style="left: {pos.x + 12}px; top: {pos.y + 12}px;"
	>
		<p class="font-serif text-sm font-semibold text-ink" data-testid="winner-map-tooltip-gebiet">
			{data.gebietName}
		</p>
		{#if data.hasWinner && data.partei}
			<p class="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-ink">
				<span
					aria-hidden="true"
					class="inline-block h-2.5 w-2.5 rounded-sm border border-rule-strong"
					style="background-color: {parteiColor(data.partei)};"
				></span>
				<span data-testid="winner-map-tooltip-partei">{data.partei}</span>
				<span data-testid="winner-map-tooltip-anteil" class="tabular-nums"
					>{formatAnteilPct(data.anteil)}</span
				>
			</p>
		{:else}
			<p class="mt-0.5 font-mono text-xs text-ink-subtle" data-testid="winner-map-tooltip-empty">
				Keine Daten für dieses Gebiet
			</p>
		{/if}
		{#if jahr !== null}
			<p
				class="mt-1 font-sans text-[10px] tracking-wide text-ink-subtle uppercase"
				data-testid="winner-map-tooltip-jahr"
			>
				{jahr}{repeatElection ? ' · Wiederholungswahl' : ''}
			</p>
		{/if}
	</div>
{/if}
