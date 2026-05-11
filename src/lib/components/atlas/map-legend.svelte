<script lang="ts">
	export type LegendScale = 'sequential' | 'divergent';

	export interface LegendItem {
		slug: string;
		name: string;
		valueRange: { min: number; max: number };
		scale: LegendScale;
	}

	type Props = {
		activeLayers: LegendItem[];
	};

	let { activeLayers }: Props = $props();

	const SEQUENTIAL_GRADIENT = 'linear-gradient(to right, #ECEAE0, #2A3F7C)';
	const DIVERGENT_GRADIENT = 'linear-gradient(to right, #9E5520, #ECEAE0, #2A3F7C)';

	function gradientFor(scale: LegendScale): string {
		return scale === 'divergent' ? DIVERGENT_GRADIENT : SEQUENTIAL_GRADIENT;
	}
</script>

{#if activeLayers.length > 0}
	<aside
		data-testid="map-legend"
		aria-label="Karten-Legende"
		class="absolute bottom-3 right-3 flex max-w-xs flex-col gap-2 border border-rule bg-bg/90 p-3 text-sm text-ink backdrop-blur-sm"
	>
		{#each activeLayers as layer (layer.slug)}
			<div class="flex flex-col gap-1">
				<p class="font-medium">{layer.name}</p>
				<div
					data-testid="legend-gradient-{layer.slug}"
					style="background:{gradientFor(layer.scale)};height:8px;width:100%"
					aria-hidden="true"
				></div>
				<div class="flex justify-between text-xs text-ink-muted">
					<span>{layer.valueRange.min}</span>
					<span>{layer.valueRange.max}</span>
				</div>
			</div>
		{/each}
	</aside>
{/if}
