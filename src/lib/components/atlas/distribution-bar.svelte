<!--
	Story 11.5: Mini-Verteilungsbalken + Text. Der Balken ist dekorativ
	(aria-hidden); die Information steht als Text daneben (A11y, kein Farb-only).
-->
<script lang="ts">
	import type { DistSegment } from '$lib/data/steckbrief-extras.js';
	import { distributionText } from '$lib/data/steckbrief-extras.js';

	interface Props {
		readonly segments: readonly DistSegment[];
	}
	const { segments }: Props = $props();

	// Abgestufte Indigo-Töne; rein dekorativ, Reihenfolge = Anteil absteigend.
	const SHADES = ['bg-accent', 'bg-accent/60', 'bg-accent/35', 'bg-rule'];
	const pct = (s: number) => Math.round(s * 100);
</script>

{#if segments.length > 0}
	<span class="mt-1 block">
		<span class="flex h-1.5 w-full max-w-xs overflow-hidden rounded-full" aria-hidden="true">
			{#each segments as seg, i (seg.label)}
				<span class="{SHADES[Math.min(i, SHADES.length - 1)]} block h-full" style="width: {pct(seg.share)}%"
				></span>
			{/each}
		</span>
		<span class="mt-1 block font-mono text-xs text-ink-subtle">{distributionText(segments)}</span>
	</span>
{/if}
