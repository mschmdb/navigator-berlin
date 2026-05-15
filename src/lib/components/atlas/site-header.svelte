<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Layers, Bookmark, BookmarkCheck, Search } from '@lucide/svelte';
	import AddressSearch from './address-search.svelte';
	import AddressSearchOverlay from './address-search-overlay.svelte';
	import { AnimatedLogo } from '$lib/components/ui';
	import type { GeocodeSuggestion } from '$lib/data';

	type Props = {
		geocode: (q: string) => Promise<GeocodeSuggestion[]>;
		onSelect?: (suggestion: GeocodeSuggestion) => void;
		langSwitcher?: Snippet;
		activeLayerCount?: number;
		onOpenLayerPalette?: () => void;
		bookmarkCount?: number;
		currentAddressBookmarked?: boolean;
		onOpenBookmarks?: () => void;
		/** Story 1.31 AC-2: Such-Bar kollabiert zum Icon-Button im Inspector-Mode. */
		searchCollapsed?: boolean;
	};

	let {
		geocode,
		onSelect,
		langSwitcher,
		activeLayerCount = 0,
		onOpenLayerPalette,
		bookmarkCount = 0,
		currentAddressBookmarked = false,
		onOpenBookmarks,
		searchCollapsed = false
	}: Props = $props();

	let overlayOpen = $state(false);
	function openOverlay(): void {
		overlayOpen = true;
	}
	function closeOverlay(): void {
		overlayOpen = false;
	}
	function handleOverlaySelect(s: GeocodeSuggestion): void {
		onSelect?.(s);
		overlayOpen = false;
	}
</script>

<header
	data-testid="site-header"
	style="min-height: var(--header-height, 56px)"
	class="sticky top-0 z-30 border-b border-rule bg-bg/95 py-2 print:hidden"
>
	<div class="mx-auto flex max-w-[1440px] items-center gap-4 px-4">
		<a href="/" aria-label="navigator.berlin Startseite" class="flex shrink-0 items-center gap-2">
			<AnimatedLogo variant="one-shot" size={32} title="navigator.berlin" />
			<span class="font-sans text-base font-light tracking-wide text-ink">navigator.berlin</span>
		</a>
		{#if searchCollapsed}
			<div class="min-w-0 flex-1"></div>
			<button
				type="button"
				data-testid="header-search-trigger"
				onclick={openOverlay}
				aria-label="Adress-Suche öffnen"
				aria-haspopup="dialog"
				class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-rule text-ink hover:bg-bg"
			>
				<Search size={18} aria-hidden="true" />
			</button>
		{:else}
			<div class="min-w-0 flex-1">
				<AddressSearch variant="header" {geocode} {onSelect} />
			</div>
		{/if}
		{#if onOpenLayerPalette}
			<button
				type="button"
				data-testid="header-layer-trigger"
				onclick={onOpenLayerPalette}
				aria-label={activeLayerCount > 0
					? `${activeLayerCount} aktive Layer · Palette öffnen`
					: 'Layer-Palette öffnen'}
				aria-haspopup="dialog"
				class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-sm border border-rule px-2 text-ink hover:bg-bg"
			>
				<Layers size={18} aria-hidden="true" />
				{#if activeLayerCount > 0}
					<span
						data-testid="header-layer-badge"
						aria-hidden="true"
						class="font-mono text-xs tabular-nums text-ink-muted"
					>
						{activeLayerCount}
					</span>
				{/if}
			</button>
		{/if}
		{#if onOpenBookmarks}
			<button
				type="button"
				data-testid="header-bookmark-trigger"
				data-bookmarked={currentAddressBookmarked ? 'true' : 'false'}
				onclick={onOpenBookmarks}
				aria-label={bookmarkCount > 0
					? `${bookmarkCount} gespeicherte Adressen anzeigen`
					: 'Bookmark-Verwaltung öffnen'}
				aria-haspopup="dialog"
				class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-sm border border-rule px-2 text-ink hover:bg-bg"
			>
				{#if currentAddressBookmarked}
					<BookmarkCheck size={18} aria-hidden="true" />
				{:else}
					<Bookmark size={18} aria-hidden="true" />
				{/if}
				{#if bookmarkCount > 0}
					<span
						data-testid="header-bookmark-badge"
						aria-hidden="true"
						class="font-mono text-xs tabular-nums text-ink-muted"
					>
						{bookmarkCount}
					</span>
				{/if}
			</button>
		{/if}
		{#if langSwitcher}
			<div class="shrink-0">{@render langSwitcher()}</div>
		{/if}
	</div>
</header>

<AddressSearchOverlay
	open={overlayOpen}
	{geocode}
	onSelect={handleOverlaySelect}
	onClose={closeOverlay}
/>
