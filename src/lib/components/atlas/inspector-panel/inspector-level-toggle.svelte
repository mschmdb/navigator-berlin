<script lang="ts">
	import type { SpatialLevel } from '$lib/state/inspector-level-context.svelte.js';

	type Props = {
		currentLevel: SpatialLevel;
		kiezAvailable: boolean;
		bezirkAvailable: boolean;
		onSelect: (level: SpatialLevel) => void;
	};

	let { currentLevel, kiezAvailable, bezirkAvailable, onSelect }: Props = $props();

	const LEVELS: readonly SpatialLevel[] = ['address', 'kiez', 'bezirk', 'berlin'];

	const LABELS: Record<SpatialLevel, string> = {
		address: 'Adresse',
		kiez: 'Kiez',
		bezirk: 'Bezirk',
		berlin: 'Berlin'
	};

	function isAvailable(level: SpatialLevel): boolean {
		if (level === 'address' || level === 'berlin') return true;
		if (level === 'kiez') return kiezAvailable;
		return bezirkAvailable;
	}

	function select(level: SpatialLevel): void {
		if (!isAvailable(level)) return;
		onSelect(level);
	}

	let buttons: HTMLButtonElement[] = $state([]);

	function focusableLevels(): SpatialLevel[] {
		return LEVELS.filter((l) => isAvailable(l));
	}

	function onKeydown(event: KeyboardEvent, level: SpatialLevel): void {
		const order = focusableLevels();
		const idx = order.indexOf(level);
		if (idx < 0) return;
		let nextIdx: number | null = null;
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
			nextIdx = (idx + 1) % order.length;
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			nextIdx = (idx - 1 + order.length) % order.length;
		} else if (event.key === 'Home') {
			nextIdx = 0;
		} else if (event.key === 'End') {
			nextIdx = order.length - 1;
		}
		if (nextIdx === null) return;
		event.preventDefault();
		const nextLevel = order[nextIdx];
		const btnIdx = LEVELS.indexOf(nextLevel);
		buttons[btnIdx]?.focus();
		select(nextLevel);
	}
</script>

<div
	role="radiogroup"
	aria-label="Räumliche Ebene"
	data-testid="inspector-level-toggle"
	class="grid w-full grid-cols-4 gap-1"
>
	{#each LEVELS as level, i (level)}
		{@const available = isAvailable(level)}
		{@const checked = currentLevel === level}
		<button
			bind:this={buttons[i]}
			role="radio"
			type="button"
			data-testid={`level-toggle-${level}`}
			aria-checked={checked}
			aria-disabled={!available}
			tabindex={checked ? 0 : -1}
			title={available ? LABELS[level] : `${LABELS[level]} · an dieser Stelle nicht verfügbar`}
			onclick={() => select(level)}
			onkeydown={(e) => onKeydown(e, level)}
			class="rounded border border-ink px-1 py-1 text-center font-mono text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
			class:bg-ink={checked}
			class:text-bg={checked}
			class:bg-bg={!checked}
			class:text-ink={!checked && available}
			class:hover:bg-bg-muted={!checked && available}
			class:opacity-40={!available}
			class:cursor-not-allowed={!available}
			class:text-ink-subtle={!available}
		>
			{LABELS[level]}
		</button>
	{/each}
</div>
