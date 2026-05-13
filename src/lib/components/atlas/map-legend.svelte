<script lang="ts">
	import { getLegendSpec } from './internal/layer-style-builder.js';
	import { getLayerDisplayName } from './internal/layer-palette-filter.js';

	type Props = {
		activeLayerSlugs: readonly string[];
	};

	let { activeLayerSlugs }: Props = $props();

	const entries = $derived(
		activeLayerSlugs.map((slug) => ({
			slug,
			name: getLayerDisplayName(slug),
			spec: getLegendSpec(slug)
		}))
	);
</script>

{#if entries.length > 0}
	<aside
		data-testid="map-legend"
		aria-label="Karten-Legende"
		class="pointer-events-auto absolute bottom-3 left-3 z-20 flex max-h-[60vh] max-w-xs flex-col gap-3 overflow-auto border border-rule bg-bg-elevated/95 p-3 text-xs text-ink shadow-lg backdrop-blur-sm"
	>
		{#each entries as entry (entry.slug)}
			<section
				data-testid={`legend-${entry.slug}`}
				class="flex flex-col gap-1.5 border-b border-rule pb-2 last:border-b-0 last:pb-0"
			>
				<p class="font-sans text-sm font-medium text-ink">{entry.name}</p>
				{#if entry.spec.kind === 'gradient'}
					<div
						aria-hidden="true"
						class="h-2 w-full rounded-sm"
						style={`background: linear-gradient(to right, ${entry.spec.items
							.map((i) => i.color)
							.join(', ')})`}
					></div>
					<div class="flex justify-between font-mono text-[10px] text-ink-subtle">
						{#if entry.spec.range}
							<span>{entry.spec.range[0]}</span>
							<span>{entry.spec.range[1]}</span>
						{:else}
							<span>{entry.spec.items[0]?.label ?? ''}</span>
							<span>{entry.spec.items.at(-1)?.label ?? ''}</span>
						{/if}
					</div>
				{:else}
					<ul class="flex flex-col gap-1">
						{#each entry.spec.items as item (item.label)}
							<li class="flex items-center gap-2">
								{#if entry.spec.kind === 'line'}
									<span
										aria-hidden="true"
										class="inline-block h-0.5 w-5"
										style={`background:${item.color}`}
									></span>
								{:else if entry.spec.kind === 'point'}
									<span
										aria-hidden="true"
										class="inline-block h-2.5 w-2.5 rounded-full"
										style={`background:${item.color}; border:1px solid var(--color-bg)`}
									></span>
								{:else}
									<span
										aria-hidden="true"
										class="inline-block h-2.5 w-3.5 rounded-sm"
										style={`background:${item.color}; opacity:0.65`}
									></span>
								{/if}
								<span class="text-ink-muted">{item.label}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/each}
	</aside>
{/if}
