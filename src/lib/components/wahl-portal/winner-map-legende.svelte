<script lang="ts" module>
	import type { Pattern } from '$lib/data/partei-farben.js';

	/** CSS-Approximation der MapLibre-Fill-Patterns für die Legenden-Vorschau. */
	export function patternPreviewStyle(pattern: Pattern, hex: string): string {
		switch (pattern) {
			case 'stripes':
				return `background-image: repeating-linear-gradient(0deg, ${hex} 0 2px, transparent 2px 4px);`;
			case 'diagonal':
				return `background-image: repeating-linear-gradient(45deg, ${hex} 0 2px, transparent 2px 4px);`;
			case 'diagonal-reverse':
				// Review-Fund #16: Gegenrichtung zu 'diagonal' (135° statt 45°),
				// derselbe CSS-Zwilling-Ansatz wie die anderen Muster.
				return `background-image: repeating-linear-gradient(135deg, ${hex} 0 2px, transparent 2px 4px);`;
			case 'dots':
				return `background-image: radial-gradient(${hex} 30%, transparent 30%); background-size: 6px 6px;`;
			case 'solid':
				// Review-Fund #15: der Legenden-Swatch blieb eine Vollfläche (kein
				// Zwilling zur segmentierten Textur aus `partei-pattern-images.ts`)
				// -- ein feines, inverses Punktraster macht die Textur auch hier sichtbar.
				return `background-color: ${hex}; background-image: radial-gradient(circle at 30% 30%, transparent 35%, ${hex} 36%); background-size: 6px 6px;`;
		}
	}
</script>

<script lang="ts">
	import { parteiColor, parteiPattern } from '$lib/data/partei-farben.js';
	import { m } from '$lib/paraglide/messages.js';
	import {
		ANTEIL_OPACITY_RAMP,
		formatAnteilPct,
		parteiDisplayName
	} from './internal/winner-map-data.js';

	type Props = {
		/** Vorkommende Partei-Kurznamen (Anzeige-Reihenfolge liegt beim Aufrufer). */
		parteien: readonly string[];
		patternsEnabled: boolean;
		onTogglePatterns: () => void;
		/** Story 9 (Partei-Modus): Titel/Rampen-Hinweis ersetzen die
		 * Sieger-Texte, wenn gesetzt (kein "Stärkste Partei"-Framing). */
		titel?: string;
		rampeText?: string;
	};

	let {
		parteien,
		patternsEnabled,
		onTogglePatterns,
		titel = m.wahl_portal_legende_titel_default(),
		rampeText
	}: Props = $props();

	const defaultRampeText = $derived(
		m.wahl_portal_legende_saettigung_rampe_text({
			min: formatAnteilPct(ANTEIL_OPACITY_RAMP.minAnteil, 0),
			max: formatAnteilPct(ANTEIL_OPACITY_RAMP.maxAnteil, 0)
		})
	);
</script>

<div data-testid="winner-map-legende" class="flex flex-col gap-3 border border-rule bg-bg p-3">
	<div class="flex items-center justify-between gap-3">
		<span class="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
			{titel}
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
			{m.wahl_portal_muster_anzeigen()}
		</button>
	</div>

	{#if parteien.length === 0}
		<p data-testid="winner-map-legende-empty" class="font-mono text-xs text-ink-subtle">
			{m.wahl_portal_legende_keine_partei_daten()}
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
						style={patternsEnabled
							? patternPreviewStyle(parteiPattern(partei), hex)
							: `background-color: ${hex};`}
					></span>
					<span class="font-mono text-xs text-ink">{parteiDisplayName(partei)}</span>
				</li>
			{/each}
		</ul>
	{/if}

	<p data-testid="winner-map-legende-rampe" class="font-mono text-[10px] text-ink-subtle">
		{rampeText ?? defaultRampeText}
	</p>
</div>
