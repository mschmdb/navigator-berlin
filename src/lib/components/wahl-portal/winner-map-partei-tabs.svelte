<script lang="ts">
	/**
	 * Story 9 (Partei-Tabs): karten-lokales Radiogroup „Gewinner" + je ein Tab
	 * pro `FINDER_PARTIES`-Partei (Direktive Matze: 7 Parteien, nicht „jede
	 * Partei aus partei-farben.ts"). Kein URL-Zustand (Boundary: Tabs sind
	 * karten-lokal, kein Umbau der Portal-Steuerleiste), Muster
	 * `trends-kapitel.svelte` Partei-Chips (`nextRadioIndex`-Tastatursteuerung).
	 */
	import { FINDER_PARTIES } from '$lib/components/atlas/internal/kiez-finder-engine.js';
	import { parteiColor } from '$lib/data/partei-farben.js';
	import { nextRadioIndex } from './internal/radiogroup-keyboard.js';

	type Props = {
		/** `null` = Gewinner-Tab (Bestand). */
		aktivePartei: string | null;
		onSelect: (partei: string | null) => void;
	};
	let { aktivePartei, onSelect }: Props = $props();

	const VALUES: readonly (string | null)[] = [null, ...FINDER_PARTIES];
	let buttons: HTMLButtonElement[] = $state([]);

	function testId(value: string | null): string {
		return `winner-map-partei-tab-${value ?? 'gewinner'}`;
	}

	function label(value: string | null): string {
		return value ?? 'Gewinner';
	}

	function onKeydown(event: KeyboardEvent, index: number): void {
		const next = nextRadioIndex(event.key, index, VALUES.length);
		if (next === null) return;
		event.preventDefault();
		buttons[next]?.focus();
		onSelect(VALUES[next]);
	}
</script>

<div
	role="radiogroup"
	aria-label="Kartenansicht"
	data-testid="winner-map-partei-tabs"
	class="flex flex-wrap gap-1"
>
	{#each VALUES as value, i (value ?? 'gewinner')}
		{@const checked = aktivePartei === value}
		<button
			bind:this={buttons[i]}
			role="radio"
			type="button"
			data-testid={testId(value)}
			aria-checked={checked}
			tabindex={checked ? 0 : -1}
			onclick={() => onSelect(value)}
			onkeydown={(e) => onKeydown(e, i)}
			class="rounded border px-2.5 py-1 font-mono text-xs transition-colors"
			style={value ? `border-color: ${parteiColor(value)};` : undefined}
			class:bg-ink={checked}
			class:text-bg={checked}
			class:bg-bg={!checked}
			class:text-ink={!checked}
			class:hover:bg-bg-muted={!checked}
		>
			{label(value)}
		</button>
	{/each}
</div>
