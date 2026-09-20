<script lang="ts">
	/**
	 * Story 10 (Steuerungs-Klarheit): einzig globaler Zustand der Portal-Seite
	 * ist die Wahl-Reihe -- sie gilt für alle Kapitel und bleibt deshalb
	 * dauerhaft sichtbar (sticky unter dem Header). Jahr/Ebene sind
	 * Karten-lokale Controls und leben in `karten-steuerung.svelte`.
	 *
	 * Aufgespalten aus `portal-steuerleiste.svelte` (Story 3): Testids
	 * (`steuerleiste-reihe*`) und Tastatursteuerung bleiben unverändert, damit
	 * die bestehenden E2E-Stellen stabil bleiben.
	 */
	import {
		REIHE_VALUES,
		REIHE_LABELS,
		type WahlPortalReihe
	} from '$lib/utils/wahl-portal-url-state.js';
	import { nextRadioIndex } from './internal/radiogroup-keyboard.js';

	type Props = {
		reihe: WahlPortalReihe;
		/** DB-los / API leer (AC I/O-Matrix): Reihe-Toggle gesperrt. */
		disabled?: boolean;
		onReiheChange: (reihe: WahlPortalReihe) => void;
	};

	let { reihe, disabled = false, onReiheChange }: Props = $props();

	let reiheButtons: HTMLButtonElement[] = $state([]);

	function onReiheKeydown(event: KeyboardEvent, index: number): void {
		if (disabled) return;
		const next = nextRadioIndex(event.key, index, REIHE_VALUES.length);
		if (next === null) return;
		event.preventDefault();
		reiheButtons[next]?.focus();
		onReiheChange(REIHE_VALUES[next]);
	}
</script>

<!-- Review Triage Log #1: ab ~383px Viewport brach die Chip-Zeile um und legte
     sich über die Kapitel-Nav. Muster von `kapitel-nav.svelte` übernommen:
     horizontal scrollen statt umbrechen. `h-10` bleibt fest, daran hängt die
     Offset-Arithmetik (2.5rem/5.5rem) der Kapitel-Nav und -Sections. -->
<div
	data-testid="reihen-leiste"
	class="sticky top-[var(--header-height,72px)] z-30 flex h-10 items-center gap-3 overflow-x-auto border-b border-rule bg-bg px-4"
>
	<span
		id="steuerleiste-reihe-label"
		class="shrink-0 font-mono text-[10px] tracking-wide whitespace-nowrap text-ink-muted uppercase"
	>
		Wahl-Reihe
	</span>
	<div
		role="radiogroup"
		aria-labelledby="steuerleiste-reihe-label"
		data-testid="steuerleiste-reihe"
		class="flex flex-nowrap gap-1"
	>
		{#each REIHE_VALUES as value, i (value)}
			{@const checked = reihe === value}
			<button
				bind:this={reiheButtons[i]}
				role="radio"
				type="button"
				data-testid={`steuerleiste-reihe-${value}`}
				aria-checked={checked}
				aria-disabled={disabled}
				tabindex={checked ? 0 : -1}
				onclick={() => !disabled && onReiheChange(value)}
				onkeydown={(e) => onReiheKeydown(e, i)}
				class="shrink-0 rounded border border-ink px-2.5 py-1 font-mono text-xs transition-colors"
				class:bg-ink={checked}
				class:text-bg={checked}
				class:bg-bg={!checked}
				class:text-ink={!checked}
				class:hover:bg-bg-muted={!checked && !disabled}
				class:opacity-40={disabled}
				class:cursor-not-allowed={disabled}
			>
				{REIHE_LABELS[value]}
			</button>
		{/each}
	</div>
</div>
