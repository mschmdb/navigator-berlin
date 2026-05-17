<script lang="ts">
	import { onMount } from 'svelte';
	import { X, Search, Clock } from '@lucide/svelte';
	import type { LayerMetadata } from '$lib/data';
	import {
		getUiState,
		toggleLayer,
		clearLayers,
		openPalette
	} from '$lib/state/ui-context.svelte.js';
	import BottomSheet from './inspector-panel/bottom-sheet.svelte';
	import {
		filterLayers,
		groupLayersByBundle,
		getLayerDisplayName
	} from './internal/layer-palette-filter.js';
	import { getLayerExplain } from './inspector-panel/internal/layer-explain.js';
	import { shouldHandleSlash } from './internal/palette-shortcut.js';
	import { classifyViewportWidth, type Breakpoint } from '$lib/utils/use-viewport.svelte.js';

	type Props = {
		layers?: readonly LayerMetadata[];
		initialBreakpoint?: Breakpoint;
		/** Skip auto window-sync (testing only) */
		forceBreakpoint?: boolean;
	};

	let {
		layers = [],
		initialBreakpoint = 'desktop',
		forceBreakpoint = false
	}: Props = $props();

	const ui = getUiState();

	let searchInput: HTMLInputElement | null = $state(null);
	let searchQuery = $state('');
	let windowBreakpoint = $state<Breakpoint | null>(null);
	const breakpoint = $derived(windowBreakpoint ?? initialBreakpoint);

	const isMobile = $derived(breakpoint === 'mobile');

	function syncBreakpoint(): void {
		if (typeof window === 'undefined') return;
		windowBreakpoint = classifyViewportWidth(window.innerWidth);
	}

	onMount(() => {
		if (!forceBreakpoint) syncBreakpoint();
		if (!forceBreakpoint) window.addEventListener('resize', syncBreakpoint);
		function onKeyDown(e: KeyboardEvent): void {
			if (e.key === 'Escape' && ui.paletteOpen) {
				ui.paletteOpen = false;
				return;
			}
			if (shouldHandleSlash(e)) {
				e.preventDefault();
				if (ui.paletteOpen) {
					ui.paletteOpen = false;
				} else {
					openPalette(ui);
					queueMicrotask(() => searchInput?.focus());
				}
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => {
			if (!forceBreakpoint) window.removeEventListener('resize', syncBreakpoint);
			window.removeEventListener('keydown', onKeyDown);
		};
	});

	const filtered = $derived(filterLayers(layers, searchQuery));
	const groups = $derived(groupLayersByBundle(filtered));
	const activeCount = $derived(ui.activeLayerSlugs.length);
	const hasQuery = $derived(searchQuery.trim().length > 0);
	const showEmptyState = $derived(!hasQuery);

	const FREQUENT_SLUGS = [
		'kiez-score-ruhe-luft',
		'kiez-score-gruen',
		'laerm-2023',
		'gruenanlagen',
		'bodenrichtwerte'
	] as const;

	const frequentLayers = $derived.by(() => {
		const bySlug = new Map(layers.map((l) => [l.slug, l] as const));
		return FREQUENT_SLUGS.map((slug) => bySlug.get(slug)).filter(
			(l): l is LayerMetadata => Boolean(l)
		);
	});

	const recentLayers = $derived.by(() => {
		const bySlug = new Map(layers.map((l) => [l.slug, l] as const));
		return ui.recentLayerSlugs
			.map((slug) => bySlug.get(slug))
			.filter((l): l is LayerMetadata => Boolean(l));
	});

	function onToggle(slug: string): void {
		toggleLayer(ui, slug);
	}

	function close(): void {
		ui.paletteOpen = false;
	}

	function onClearAll(): void {
		clearLayers(ui);
	}

	let prevOpen = $state(false);
	$effect(() => {
		const open = ui.paletteOpen;
		if (open === prevOpen) return;
		prevOpen = open;
		if (open) {
			queueMicrotask(() => searchInput?.focus());
		} else {
			searchQuery = '';
		}
	});
</script>

{#snippet paletteBody()}
	<header class="flex items-start justify-between gap-3 border-b border-rule px-4 pb-3 pt-2">
		<div>
			<h2 class="font-serif text-xl text-ink">Layer auswählen</h2>
			<p class="text-xs text-ink-subtle">
				{activeCount} aktiv · {layers.length} verfügbar
			</p>
		</div>
		<button
			type="button"
			data-testid="palette-close"
			onclick={close}
			aria-label="Layer-Palette schließen"
			class="rounded-sm p-1 text-ink-muted hover:text-ink"
		>
			<X size={18} aria-hidden="true" />
		</button>
	</header>

	<div class="border-b border-rule px-4 py-3">
		<label class="flex items-center gap-2 rounded-md border border-rule bg-bg-elevated px-3 py-2">
			<Search size={16} aria-hidden="true" class="text-ink-subtle" />
			<input
				bind:this={searchInput}
				bind:value={searchQuery}
				data-testid="palette-search"
				type="search"
				placeholder="Layer durchsuchen…"
				aria-label="Layer durchsuchen"
				class="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
			/>
		</label>
	</div>

	<div class="flex-1 overflow-y-auto px-4 py-3">
		{#if showEmptyState && frequentLayers.length > 0}
			<section data-testid="palette-frequent" class="mb-4">
				<h3 class="mb-2 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-ink-muted">
					<Clock size={14} aria-hidden="true" /> Meistgenutzt
				</h3>
				<ul class="space-y-1.5">
					{#each frequentLayers as layer (layer.slug)}
						{@const isOn = ui.activeLayerSlugs.includes(layer.slug)}
						<li>
							<button
								type="button"
								data-testid={`palette-frequent-${layer.slug}`}
								data-state={isOn ? 'on' : 'off'}
								aria-pressed={isOn}
								onclick={() => onToggle(layer.slug)}
								class={[
									'flex w-full min-h-[44px] items-start justify-between gap-2 rounded-sm border border-rule px-3 py-2 text-left text-sm hover:bg-bg',
									isOn && 'bg-accent-soft'
								]
									.filter(Boolean)
									.join(' ')}
							>
								<span class="font-medium text-ink">{getLayerDisplayName(layer.slug)}</span>
								<span class="font-mono text-xs text-ink-subtle">{layer.bundleGroup[0]}</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
		{#if isMobile && recentLayers.length > 0 && !searchQuery}
			<section data-testid="palette-recent" class="mb-4">
				<h3 class="mb-2 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-ink-muted">
					<Clock size={14} aria-hidden="true" /> Zuletzt verwendet
				</h3>
				<ul class="space-y-1.5">
					{#each recentLayers as layer (layer.slug)}
						{@const isOn = ui.activeLayerSlugs.includes(layer.slug)}
						{@const subline = getLayerExplain(layer.slug, 'short')}
						<li>
							<button
								type="button"
								data-testid={`palette-toggle-${layer.slug}`}
								data-state={isOn ? 'on' : 'off'}
								aria-pressed={isOn}
								onclick={() => onToggle(layer.slug)}
								class={[
									'flex w-full min-h-[44px] items-start justify-between gap-2 rounded-sm border border-rule px-3 py-2 text-left text-sm hover:bg-bg',
									isOn && 'bg-accent-soft'
								]
									.filter(Boolean)
									.join(' ')}
							>
								<span class="flex min-w-0 flex-1 flex-col">
									<span class="font-medium text-ink">{getLayerDisplayName(layer.slug)}</span>
									{#if subline}
										<span
											data-testid={`palette-subline-${layer.slug}`}
											class="font-serif text-xs italic leading-snug text-ink-subtle"
										>
											{subline}
										</span>
									{/if}
								</span>
								<span class="font-mono text-xs text-ink-subtle">{layer.bundleGroup[0]}</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if groups.length === 0 && hasQuery}
			<p data-testid="palette-empty" class="py-6 text-center font-serif italic text-ink-subtle">
				Kein Layer matched „{searchQuery}".
			</p>
		{:else if groups.length > 0}
			{#each groups as group (group.bundle)}
				<section
					data-testid={`palette-group-${group.bundle[0]}`}
					data-bundle={group.bundle}
					class="mb-4"
				>
					<h3 class="mb-2 font-sans text-sm font-medium uppercase tracking-wide text-ink-muted">
						{group.label}
					</h3>
					<ul class="space-y-1.5">
						{#each group.layers as layer (layer.slug)}
							{@const isOn = ui.activeLayerSlugs.includes(layer.slug)}
							{@const subline = getLayerExplain(layer.slug, 'short')}
							<li>
								<button
									type="button"
									data-testid={`palette-toggle-${layer.slug}`}
									data-state={isOn ? 'on' : 'off'}
									aria-pressed={isOn}
									onclick={() => onToggle(layer.slug)}
									class={[
										'flex w-full min-h-[44px] items-start justify-between gap-2 rounded-sm border border-rule px-3 py-2 text-left text-sm hover:bg-bg',
										isOn && 'bg-accent-soft'
									]
										.filter(Boolean)
										.join(' ')}
								>
									<span class="flex min-w-0 flex-1 flex-col">
										<span class="font-medium text-ink">{getLayerDisplayName(layer.slug)}</span>
										{#if subline}
											<span
												data-testid={`palette-subline-${layer.slug}`}
												class="font-serif text-xs italic leading-snug text-ink-subtle"
											>
												{subline}
											</span>
										{/if}
									</span>
									<span class="font-mono text-xs text-ink-subtle">{group.bundle[0]}</span>
								</button>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		{/if}
	</div>

	<footer class="flex items-center justify-between gap-3 border-t border-rule px-4 py-3">
		<button
			type="button"
			data-testid="palette-clear"
			onclick={onClearAll}
			disabled={activeCount === 0}
			class="font-mono text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-40"
		>
			Alle deaktivieren
		</button>
		<span data-testid="palette-active-count" class="font-mono text-xs text-ink-subtle">
			{activeCount}
		</span>
	</footer>
{/snippet}

{#if isMobile}
	<BottomSheet
		open={ui.paletteOpen}
		snapVh={70}
		onSnap={() => {}}
		onClose={close}
		ariaLabel="Layer-Palette"
	>
		<div data-testid="layer-palette" data-variant="sheet" class="flex h-full flex-col">
			{@render paletteBody()}
		</div>
	</BottomSheet>
{:else if ui.paletteOpen}
	<div
		role="dialog"
		aria-modal="true"
		aria-label="Layer-Palette"
		data-testid="layer-palette"
		data-variant="dialog"
		tabindex="-1"
		class="fixed left-1/2 top-1/2 z-50 flex max-h-[80vh] w-[600px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-md border border-rule-strong bg-bg-elevated text-ink"
	>
		{@render paletteBody()}
	</div>
{/if}
