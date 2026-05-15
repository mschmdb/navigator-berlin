<script lang="ts">
	import type { LayerMetadata } from '$lib/data';
	import {
		formatYearMonth,
		shortenLicense
	} from '$lib/components/atlas/inspector-panel/internal/source-shortener.js';
	import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';

	type Props = { layers: readonly LayerMetadata[] };
	let { layers }: Props = $props();

	const sortedLayers = $derived(
		[...layers].sort((a, b) =>
			getLayerDisplayName(a.slug).localeCompare(getLayerDisplayName(b.slug), 'de')
		)
	);
</script>

<div class="overflow-auto border border-rule">
	<table data-testid="methodik-daten-table" class="w-full border-collapse text-sm">
		<caption class="px-3 py-2 text-left font-serif text-base text-ink">
			Daten-Stand-Tabelle aller aktiven Layer
		</caption>
		<thead class="bg-bg">
			<tr>
				<th
					scope="col"
					class="border-b border-rule px-3 py-2 text-left font-sans font-medium"
				>
					Layer
				</th>
				<th
					scope="col"
					class="border-b border-rule px-3 py-2 text-left font-sans font-medium"
				>
					Bundle
				</th>
				<th
					scope="col"
					class="border-b border-rule px-3 py-2 text-left font-sans font-medium"
				>
					Stand
				</th>
				<th
					scope="col"
					class="border-b border-rule px-3 py-2 text-left font-sans font-medium"
				>
					Lizenz
				</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedLayers as layer (layer.slug)}
				<tr data-slug={layer.slug} class="border-b border-rule/60">
					<td class="px-3 py-2">
						<a
							href={`/layer/${layer.slug}`}
							class="text-accent underline underline-offset-2 hover:text-accent-strong"
						>
							{getLayerDisplayName(layer.slug)}
						</a>
					</td>
					<td class="px-3 py-2 font-mono text-xs text-ink-muted">{layer.bundleGroup}</td>
					<td class="px-3 py-2 font-mono text-xs text-ink">
						{formatYearMonth(layer.sourceUpdatedAt ?? layer.fetchedAt)}
					</td>
					<td class="px-3 py-2 font-mono text-xs text-ink">
						{shortenLicense(layer.license)}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
