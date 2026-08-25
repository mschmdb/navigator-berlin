<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Layers, Bookmark, BookmarkCheck, Search, Map as MapIcon, Menu } from '@lucide/svelte';
	import AddressSearch from './address-search.svelte';
	import AddressSearchOverlay from './address-search-overlay.svelte';
	import MobileMetaDrawer from './mobile-meta-drawer.svelte';
	import { PixelLogo } from '$lib/components/ui';
	import { SlidersHorizontal } from '@lucide/svelte';
	import { featureFlags } from '$lib/data/feature-flags.js';
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
		/**
		 * Story 2.11: Wenn gesetzt, ersetzt das Atlas-CTA-Button die Such-Sektion
		 * und zeigt auf den Atlas-Einstieg (typisch `/explore`). Layer- und
		 * Bookmark-Trigger werden ohnehin nicht gerendert wenn die zugehörigen
		 * Callbacks fehlen, sodass die Landing-Header-Variante kompakt bleibt.
		 */
		atlasCtaHref?: string;
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
		searchCollapsed = false,
		atlasCtaHref
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

	let drawerOpen = $state(false);
	function openDrawer(): void {
		drawerOpen = true;
	}
	function closeDrawer(): void {
		drawerOpen = false;
	}
</script>

{#snippet finderTrigger()}
	<!-- Finder als Icon-Control rechts (25.08.): neben dem Logo wurde der
	     Button öfter geklickt als der Atlas-Einstieg, die erste Scan-Position
	     hatte ihn zum Primär-CTA gemacht. -->
	{#if featureFlags.kiezFinder}
		<a
			href="/explore?finder=1"
			data-testid="header-finder-link"
			aria-label="Kiez-Finder öffnen"
			title="Kiez-Finder"
			class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-rule text-ink hover:border-accent hover:text-accent"
		>
			<SlidersHorizontal size={18} aria-hidden="true" />
		</a>
	{/if}
{/snippet}

<header
	data-testid="site-header"
	style="min-height: var(--header-height, 72px)"
	class="sticky top-0 z-30 border-b border-rule bg-bg/95 py-1 print:hidden"
>
	<!-- Volle Breite (25.08.): der frühere max-w-[1440px]-Container ließ die
	     Header-Inhalte auf großen Screens mittig schweben, während die Karte
	     vollflächig läuft. Logo links außen, Controls rechts außen. -->
	<div class="flex w-full items-center gap-4 px-4">
		<a href="/" aria-label="navigator.berlin" class="flex shrink-0 items-center gap-2">
			<PixelLogo size={64} title="navigator.berlin" />
			<span class="hidden font-sans text-base font-light tracking-wide text-ink sm:inline">
				navigator.berlin
			</span>
		</a>
		{#if atlasCtaHref}
			<!-- Kein Finder auf der Landing (25.08.): er konkurrierte mit dem
			     Atlas-CTA, der Home-Teaser übernimmt den Finder-Einstieg. -->
			<div class="min-w-0 flex-1"></div>
			<a
				href={atlasCtaHref}
				data-testid="header-atlas-cta"
				class="inline-flex h-10 shrink-0 items-center gap-2 rounded-sm border border-accent bg-accent px-3 font-mono text-xs tracking-wider text-bg uppercase hover:border-ink hover:bg-ink"
			>
				<MapIcon size={16} aria-hidden="true" />
				Atlas öffnen
			</a>
		{:else if searchCollapsed}
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
			<!-- Mobile (<sm): Search collapsed to Lupe-Icon (Bug-Fix 2026-05-17, Mobile-Header
			     hatte für AddressSearch zu wenig Platz neben Layer-/Bookmark-Triggern). -->
			<div class="min-w-0 flex-1 sm:hidden"></div>
			<button
				type="button"
				data-testid="header-search-trigger-mobile"
				onclick={openOverlay}
				aria-label="Adress-Suche öffnen"
				aria-haspopup="dialog"
				class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-rule text-ink hover:bg-bg sm:hidden"
			>
				<Search size={18} aria-hidden="true" />
			</button>
			<!-- Desktop (sm+): full Search-Input. Breite gedeckelt + zentriert
			     (25.08.): auf großen Screens streckte flex-1 das Feld über die
			     ganze Mitte, der Header wirkte linkslastig. -->
			<div class="hidden min-w-0 flex-1 sm:flex sm:justify-center">
				<div class="w-full max-w-xl">
					<AddressSearch variant="header" {geocode} {onSelect} />
				</div>
			</div>
		{/if}
		{#if !atlasCtaHref}
			{@render finderTrigger()}
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
						class="font-mono text-xs text-ink-muted tabular-nums"
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
						class="font-mono text-xs text-ink-muted tabular-nums"
					>
						{bookmarkCount}
					</span>
				{/if}
			</button>
		{/if}
		{#if langSwitcher}
			<div class="hidden shrink-0 sm:block">{@render langSwitcher()}</div>
		{/if}
		<!-- Mobile-Hamburger: Drawer mit Meta-Links + LangSwitcher -->
		<button
			type="button"
			data-testid="header-menu-trigger"
			onclick={openDrawer}
			aria-label="Menü öffnen"
			aria-haspopup="dialog"
			aria-expanded={drawerOpen}
			class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-rule text-ink hover:bg-bg sm:hidden"
		>
			<Menu size={18} aria-hidden="true" />
		</button>
	</div>
</header>

<AddressSearchOverlay
	open={overlayOpen}
	{geocode}
	onSelect={handleOverlaySelect}
	onClose={closeOverlay}
/>

<MobileMetaDrawer open={drawerOpen} onClose={closeDrawer} {langSwitcher} />
