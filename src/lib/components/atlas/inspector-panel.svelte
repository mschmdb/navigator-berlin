<script lang="ts">
	import { X } from '@lucide/svelte';
	import type { LayerMetadata } from '$lib/data';
	import { getUiState, toggleLayer } from '$lib/state/ui-context.svelte.js';
	import LayerHitRow from './inspector-panel/layer-hit-row.svelte';
	import PermalinkButton from './inspector-panel/permalink-button.svelte';
	import KlimaSection from './inspector-panel/klima-section.svelte';
	import NearestStopsCard from './inspector-panel/nearest-stops-card.svelte';
	import { groupHitsBySection } from './inspector-panel/internal/sections.js';
	import { getLayerDisplayName } from './internal/layer-palette-filter.js';
	import { scrollToLayerHitRow } from './inspector-panel/internal/scroll-to-layer-row.js';
	import { findAllNearestStops } from './inspector-panel/internal/nearest-oepnv-stop.js';

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

	const EMPTY_SECTIONS_KEY = 'nav.inspector.showEmptySections';
	let showEmptySections = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;
		try {
			showEmptySections = window.localStorage.getItem(EMPTY_SECTIONS_KEY) === '1';
		} catch {
			showEmptySections = false;
		}
	});

	function toggleEmptySections(): void {
		showEmptySections = !showEmptySections;
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.setItem(EMPTY_SECTIONS_KEY, showEmptySections ? '1' : '0');
		} catch {
			// localStorage may be unavailable (private mode); state stays in-memory.
		}
	}

	function close(): void {
		ui.inspectorOpen = false;
	}

	async function copyPermalink(): Promise<void> {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			await navigator.clipboard.writeText(window.location.href);
		}
	}

	const addressName = $derived(ui.selectedAddress?.displayName ?? '');

	let panelEl: HTMLElement | undefined = $state();

	$effect(() => {
		const target = ui.scrollToLayerSlug;
		if (!target || !panelEl) return;
		const reduced =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		queueMicrotask(() => {
			scrollToLayerHitRow(panelEl ?? null, target, { reducedMotion: reduced ?? false });
			ui.scrollToLayerSlug = null;
		});
	});

	const nearestAddressPoint = $derived(
		ui.selectedAddress
			? { lat: ui.selectedAddress.lat, lng: ui.selectedAddress.lng }
			: null
	);

	const hasNearestStops = $derived.by(() => {
		if (!nearestAddressPoint || !ui.oepnvStopIndex) return false;
		const result = findAllNearestStops(nearestAddressPoint, ui.oepnvStopIndex);
		return !!(result.ubahn || result.sbahn || result.tram || result.bus);
	});

	function shouldRenderSection(sectionKey: string, hitCount: number): boolean {
		if (sectionKey === 'klima') return true;
		if (sectionKey === 'mobilitaet' && hasNearestStops) return true;
		if (hitCount > 0) return true;
		return showEmptySections;
	}
</script>

{#if ui.inspectorOpen && ui.selectedAddress}
	<section
		bind:this={panelEl}
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

		<div class="flex-1 space-y-4 px-6 py-4">
			{#each sections as section (section.key)}
				{#if shouldRenderSection(section.key, section.hits.length)}
					<section data-testid={`section-${section.key}`} data-section={section.key}>
						<h3
							class="font-mono text-xs uppercase tracking-wide text-ink-muted border-t border-rule pt-4 flex items-baseline gap-2"
							data-testid={`section-header-${section.key}`}
						>
							<span>{section.label}</span>
							{#if section.hits.length > 0}
								<span class="text-ink-subtle" data-testid={`section-count-${section.key}`}
									>({section.hits.length})</span
								>
							{/if}
						</h3>
						<div class="mt-2 space-y-3">
							{#if section.key === 'mobilitaet'}
								<NearestStopsCard
									address={nearestAddressPoint}
									index={ui.oepnvStopIndex}
								/>
							{/if}
							{#if section.key === 'klima'}
								<KlimaSection station={ui.nearestStation} series={ui.climateSeries} />
							{:else if section.hits.length === 0 && section.key !== 'mobilitaet'}
								<p
									class="py-2 font-mono text-xs text-ink-subtle"
									data-testid={`section-${section.key}-empty`}
								>
									{section.label} · keine Daten an dieser Adresse
								</p>
							{:else if section.hits.length > 0}
								<div class="divide-y divide-rule">
									{#each section.hits as hit (hit.layer)}
										<LayerHitRow
											{hit}
											layerName={getLayerDisplayName(hit.layer)}
											{lang}
											lat={ui.selectedAddress?.lat}
											lng={ui.selectedAddress?.lng}
											isActive={ui.activeLayerSlugs.includes(hit.layer)}
											onToggleLayer={(slug: string) => toggleLayer(ui, slug)}
										/>
									{/each}
								</div>
							{/if}
						</div>
					</section>
				{/if}
			{/each}
		</div>

		<footer class="border-t border-rule px-6 py-3 flex items-center justify-between gap-3">
			<button
				type="button"
				data-testid="toggle-empty-sections"
				aria-pressed={showEmptySections}
				onclick={toggleEmptySections}
				class="text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline"
			>
				{showEmptySections ? 'Leere Sektionen ausblenden' : 'Leere Sektionen einblenden'}
			</button>
			<PermalinkButton onCopy={copyPermalink} />
		</footer>
	</section>
{/if}
