<script lang="ts" module>
	import type { Pattern } from '$lib/data/partei-farben.js';

	/** CSS-Approximation der MapLibre-Fill-Patterns für die Legenden-Vorschau. */
	export function patternPreviewStyle(pattern: Pattern, hex: string): string {
		switch (pattern) {
			case 'stripes':
				return `background-image: repeating-linear-gradient(0deg, ${hex} 0 2px, transparent 2px 4px);`;
			case 'diagonal':
				return `background-image: repeating-linear-gradient(45deg, ${hex} 0 2px, transparent 2px 4px);`;
			case 'dots':
				return `background-image: radial-gradient(${hex} 30%, transparent 30%); background-size: 6px 6px;`;
			case 'solid':
				return `background-color: ${hex};`;
		}
	}
</script>

<script lang="ts">
	import { parteiColor, parteiPattern } from '$lib/data/partei-farben.js';
	import { ANTEIL_OPACITY_RAMP, formatAnteilPct } from './internal/winner-map-data.js';

	type Props = {
		/** Vorkommende Partei-Kurznamen (Anzeige-Reihenfolge liegt beim Aufrufer). */
		parteien: readonly string[];
		patternsEnabled: boolean;
		onTogglePatterns: () => void;
	};

	let { parteien, patternsEnabled, onTogglePatterns }: Props = $props();


</script>

<div data-testid="winner-map-legende" class="flex flex-col gap-3 border border-rule bg-bg p-3">
	<div class="flex items-center justify-between gap-3">
		<span class="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
			Stärkste Partei
		</span>
		<button
			type="button"
			data-testid="winner-map-muster-toggle"
			aria-pressed={patternsEnabled}
			onclick={onTogglePatterns}
			class="rounded border border-ink px-2.5 py-1 font-mono text-xs transition-colors"
			class:bg-ink={patternsEnabled}
			class:text-bg={patternsEnabled}
			class:bg-bg={!patternsEnabled}
			class:text-ink={!patternsEnabled}
		>
			Muster anzeigen
		</button>
	</div>

	{#if parteien.length === 0}
		<p data-testid="winner-map-legende-empty" class="font-mono text-xs text-ink-subtle">
			Keine Partei-Daten für die aktuelle Auswahl.
		</p>
	{:else}
		<ul class="flex flex-wrap gap-2" data-testid="winner-map-legende-list">
			{#each parteien as partei (partei)}
				{@const hex = parteiColor(partei)}
				<li class="flex items-center gap-1.5">
					<span
						data-testid={`winner-map-swatch-${partei}`}
						aria-hidden="true"
						class="inline-block h-3.5 w-3.5 rounded-sm border border-rule-strong"
						style={patternsEnabled ? patternPreviewStyle(parteiPattern(partei), hex) : `background-color: ${hex};`}
					></span>
					<span class="font-mono text-xs text-ink">{partei}</span>
				</li>
			{/each}
		</ul>
	{/if}

	<p data-testid="winner-map-legende-rampe" class="font-mono text-[10px] text-ink-subtle">
		Sättigung nach Anteil: {formatAnteilPct(ANTEIL_OPACITY_RAMP.minAnteil, 0)} = niedrige Deckkraft, ab {formatAnteilPct(ANTEIL_OPACITY_RAMP.maxAnteil, 0)} volle Deckkraft.
	</p>
</div>
