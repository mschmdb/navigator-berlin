<script lang="ts">
	import { X } from '@lucide/svelte';
	import type { LayerMetadata } from '$lib/data';
	import { getUiState } from '$lib/state/ui-context.svelte.js';
	import LayerHitRow from './inspector-panel/layer-hit-row.svelte';
	import PermalinkButton from './inspector-panel/permalink-button.svelte';
	import KlimaSection from './inspector-panel/klima-section.svelte';
	import { groupHitsBySection } from './inspector-panel/internal/sections.js';
	import { getLayerDisplayName } from './internal/layer-palette-filter.js';

	type Props = {
		layerMeta?: readonly LayerMetadata[];
		lang?: string;
		variant?: 'panel' | 'sheet';
		mountId?: string;
	};

	let {
		layerMeta = [],
		lang = 'de',
		variant = 'panel',
		mountId = crypto.randomUUID()
	}: Props = $props();

	const ui = getUiState();

	const sections = $derived(groupHitsBySection(ui.selectedLayerHits, layerMeta));

	function close(): void {
		ui.inspectorOpen = false;
	}

	async function copyPermalink(): Promise<void> {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			await navigator.clipboard.writeText(window.location.href);
		}
	}

	const addressName = $derived(ui.selectedAddress?.displayName ?? '');
</script>

{#if ui.inspectorOpen && ui.selectedAddress}
	<section
		aria-live="polite"
		aria-atomic="false"
		aria-label={`Layer-Daten für ${addressName}`}
		data-testid="inspector-panel"
		data-mount-id={mountId}
		data-variant={variant}
		class="flex h-full flex-col overflow-auto bg-bg-elevated text-ink"
	>
		<header
			class="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-rule bg-bg-elevated px-6 pb-4 pt-5"
		>
			<div>
				<p class="font-mono text-xs uppercase tracking-wide text-ink-subtle">Adresse</p>
				<h2 class="font-serif text-xl leading-tight text-ink" data-testid="inspector-address">
					{addressName}
				</h2>
			</div>
			<button
				type="button"
				onclick={close}
				data-testid="inspector-close"
				aria-label="Inspektor schließen"
				class="rounded-sm p-1 text-ink-muted hover:text-ink"
			>
				<X size={18} aria-hidden="true" />
			</button>
		</header>

		<div class="flex-1 space-y-6 px-6 py-4">
			{#each sections as section (section.key)}
				<section data-testid={`section-${section.key}`} data-section={section.key}>
					<h3 class="font-serif text-lg text-ink">{section.label}</h3>
					<div class="mt-2 divide-y divide-rule">
						{#if section.key === 'klima'}
							<KlimaSection station={ui.nearestStation} series={ui.climateSeries} />
						{:else if section.hits.length === 0}
							<p
								class="py-3 font-serif italic text-ink-subtle"
								data-testid={`section-${section.key}-empty`}
							>
								Keine Layer in dieser Sektion.
							</p>
						{:else}
							{#each section.hits as hit (hit.layer)}
								<LayerHitRow
									{hit}
									layerName={getLayerDisplayName(hit.layer)}
									{lang}
									lat={ui.selectedAddress?.lat}
									lng={ui.selectedAddress?.lng}
								/>
							{/each}
						{/if}
					</div>
				</section>
			{/each}
		</div>

		<footer class="border-t border-rule px-6 py-3">
			<PermalinkButton onCopy={copyPermalink} />
		</footer>
	</section>
{/if}
