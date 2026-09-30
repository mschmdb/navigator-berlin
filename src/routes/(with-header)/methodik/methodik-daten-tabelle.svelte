<script lang="ts">
	import type { LayerMetadata } from '$lib/data';
	import {
		formatYearMonth,
		shortenLicense
	} from '$lib/components/atlas/inspector-panel/internal/source-shortener.js';
	import {
		bundleLabel,
		getLayerDisplayName
	} from '$lib/components/atlas/internal/layer-palette-filter.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { m } from '$lib/paraglide/messages.js';
	import { baseLocale, getLocale } from '$lib/paraglide/runtime.js';

	type Props = { layers: readonly LayerMetadata[] };
	let { layers }: Props = $props();

	const locale = getLocale();
	// DE zeigt den Manifest-Rohwert ("C: Umwelt"), jede weitere Locale das Bundle-Label.
	const bundleCell = (layer: LayerMetadata): string =>
		locale === baseLocale ? layer.bundleGroup : bundleLabel(layer.bundleGroup, { locale });

	const sortedLayers = $derived(
		[...layers].sort((a, b) =>
			getLayerDisplayName(a.slug, { locale }).localeCompare(
				getLayerDisplayName(b.slug, { locale }),
				locale
			)
		)
	);
</script>

<div class="overflow-auto border border-rule">
	<table data-testid="methodik-daten-table" class="w-full border-collapse text-sm">
		<caption class="px-3 py-2 text-left font-serif text-base text-ink">
			{m.methodik_daten_tabelle_caption()}
		</caption>
		<thead class="bg-bg">
			<tr>
				<th scope="col" class="border-b border-rule px-3 py-2 text-left font-sans font-medium">
					{m.methodik_daten_tabelle_th_layer()}
				</th>
				<th scope="col" class="border-b border-rule px-3 py-2 text-left font-sans font-medium">
					{m.methodik_daten_tabelle_th_bundle()}
				</th>
				<th scope="col" class="border-b border-rule px-3 py-2 text-left font-sans font-medium">
					{m.methodik_daten_tabelle_th_updated()}
				</th>
				<th scope="col" class="border-b border-rule px-3 py-2 text-left font-sans font-medium">
					{m.methodik_daten_tabelle_th_licence()}
				</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedLayers as layer (layer.slug)}
				<tr data-slug={layer.slug} class="border-b border-rule/60">
					<td class="px-3 py-2">
						<a
							href={localizedHref(`/layer/${layer.slug}`)}
							class="hover:text-accent-strong text-accent underline underline-offset-2"
						>
							{getLayerDisplayName(layer.slug, { locale })}
						</a>
					</td>
					<td class="px-3 py-2 font-mono text-xs text-ink-muted">{bundleCell(layer)}</td>
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
