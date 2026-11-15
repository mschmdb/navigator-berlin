<script lang="ts">
	export type LegendKind = 'own' | 'ring' | 'highlight' | 'other' | 'dashed' | 'value' | 'neutral';
	export interface LegendItem {
		readonly kind: LegendKind;
		readonly label: string;
	}
	let { items }: { items: readonly LegendItem[] } = $props();
</script>

<!-- Legende in HTML: Form und Linienart tragen die Bedeutung, nicht nur die Farbe -->
<ul class="mb-3 flex flex-wrap gap-x-5 gap-y-1.5 text-dense-label text-ink-muted">
	{#each items as it (it.kind + it.label)}
		<li class="inline-flex items-center gap-1.5">
			{#if it.kind === 'own'}
				<span class="size-3 rounded-full bg-accent"></span>
			{:else if it.kind === 'neutral'}
				<span class="size-3 rounded-full bg-severity-neutral"></span>
			{:else if it.kind === 'ring'}
				<span class="size-3 rounded-full border-2 border-ink"></span>
			{:else if it.kind === 'highlight'}
				<span class="size-2 rounded-full bg-ink"></span>
			{:else if it.kind === 'other'}
				<span class="size-2 rounded-full bg-rule-strong opacity-50"></span>
			{:else if it.kind === 'dashed'}
				<span class="h-3.5 border-l-2 border-dashed border-ink"></span>
			{:else}
				<span class="h-3.5 border-l-[3px] border-accent"></span>
			{/if}
			{it.label}
		</li>
	{/each}
</ul>
