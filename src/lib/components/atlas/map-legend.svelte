<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import type { LayerMetadata } from '$lib/data';
	import { getLegendSpec } from './internal/layer-style-builder.js';
	import { getLayerDisplayName } from './internal/layer-palette-filter.js';
	import { getLayerExplainEntry } from './inspector-panel/internal/layer-explain.js';
	import { shortenLicense } from './inspector-panel/internal/source-shortener.js';

	type Props = {
		activeLayerSlugs: readonly string[];
		manifestLayers?: readonly LayerMetadata[];
		lang?: string;
	};

	let { activeLayerSlugs, manifestLayers = [], lang = 'de' }: Props = $props();

	const metaBySlug = $derived(new Map(manifestLayers.map((l) => [l.slug, l] as const)));

	const entries = $derived(
		activeLayerSlugs.map((slug) => ({
			slug,
			name: getLayerDisplayName(slug),
			spec: getLegendSpec(slug),
			explain: getLayerExplainEntry(slug),
			meta: metaBySlug.get(slug)
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

				<details data-testid={`legend-details-${entry.slug}`} class="group mt-1">
					<summary
						data-testid={`legend-summary-${entry.slug}`}
						class="flex cursor-pointer list-none items-center gap-1 text-[11px] text-ink-muted hover:text-ink [&::-webkit-details-marker]:hidden"
					>
						<span
							aria-hidden="true"
							class="font-mono text-[10px] transition-transform group-open:rotate-180"
						>
							▾
						</span>
						<span class="group-open:hidden">Mehr erklären</span>
						<span class="hidden group-open:inline">Weniger</span>
					</summary>

					<div
						data-testid={`legend-expand-${entry.slug}`}
						class="mt-1.5 flex flex-col gap-1.5"
					>
						{#if entry.explain.long}
							<p class="font-serif text-xs leading-snug text-ink-muted">
								{entry.explain.long}
							</p>
						{/if}
						{#if entry.explain.valueScaleExplain}
							<p
								data-testid={`legend-scale-${entry.slug}`}
								class="font-mono text-[10px] text-ink-subtle"
							>
								{entry.explain.valueScaleExplain}
							</p>
						{/if}
						{#if entry.meta}
							<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
								<a
									data-testid={`legend-source-link-${entry.slug}`}
									href={entry.meta.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="text-accent underline underline-offset-2 hover:text-accent-strong"
								>
									Quelle
								</a>
								<span
									data-testid={`legend-license-${entry.slug}`}
									class="font-mono text-ink-subtle"
									title={entry.meta.license}
								>
									{shortenLicense(entry.meta.license)}
								</span>
							</div>
						{/if}
						<a
							data-testid={`legend-more-link-${entry.slug}`}
							href={resolve(`/${lang}/layer/${entry.slug}` as Pathname)}
							class="self-start text-[11px] font-medium text-accent underline-offset-2 hover:underline"
						>
							Mehr erfahren →
						</a>
					</div>
				</details>
			</section>
		{/each}
	</aside>
{/if}
