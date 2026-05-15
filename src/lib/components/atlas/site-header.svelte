<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Layers, Bookmark, BookmarkCheck } from '@lucide/svelte';
	import AddressSearch from './address-search.svelte';
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
	};

	let {
		geocode,
		onSelect,
		langSwitcher,
		activeLayerCount = 0,
		onOpenLayerPalette,
		bookmarkCount = 0,
		currentAddressBookmarked = false,
		onOpenBookmarks
	}: Props = $props();
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
		<div class="min-w-0 flex-1">
			<AddressSearch variant="header" {geocode} {onSelect} />
		</div>
		{#if onOpenLayerPalette}
			<button
				type="button"
				data-testid="header-layer-trigger"
				onclick={onOpenLayerPalette}
				aria-label="Layer-Palette öffnen"
				aria-haspopup="dialog"
				class="relative inline-flex h-10 w-10 shrink-0 items-center justify-center border border-rule text-ink hover:bg-bg"
			>
				<Layers size={18} aria-hidden="true" />
				{#if activeLayerCount > 0}
					<span
						data-testid="header-layer-badge"
						aria-hidden="true"
						class="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] text-bg"
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
				aria-label="Bookmark-Verwaltung öffnen"
				aria-haspopup="dialog"
				class="relative inline-flex h-10 w-10 shrink-0 items-center justify-center border border-rule text-ink hover:bg-bg"
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
						class="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] text-bg"
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
