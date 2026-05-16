<script lang="ts">
	import { page } from '$app/state';
	import SiteHeader from '$lib/components/atlas/site-header.svelte';
	import BookmarkDialog from '$lib/components/atlas/bookmark-dialog.svelte';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import { provideAddressSelection } from '$lib/state/address-selection.svelte.js';
	import { getUiState, setComparisonAddress } from '$lib/state/ui-context.svelte.js';
	import { isBookmarked, bookmarkToSuggestion } from '$lib/state/bookmark-store.js';
	import type { Bookmark } from '$lib/state/bookmark-schema.js';

	let { children } = $props();

	/**
	 * Story 2.11: Auf der Hero-Landing („/") zeigt der Header den Atlas-CTA
	 * statt der Adress-Such-Bar. Atlas + Bookmark + Layer-Palette sind dort
	 * irrelevant, weil der User noch nicht im Karten-Kontext steckt.
	 */
	const onLanding = $derived(page.url.pathname === '/');
	const atlasCtaHref = $derived(onLanding ? '/explore' : undefined);

	const geocode = async (q: string): Promise<GeocodeSuggestion[]> => geocodeAddress({ q }).run();

	const selection = provideAddressSelection();
	const ui = getUiState();

	function onSelect(s: GeocodeSuggestion) {
		selection.set(s);
	}

	function openLayerPalette(): void {
		ui.paletteOpen = true;
	}

	function openBookmarks(): void {
		ui.bookmarksDialogOpen = true;
	}

	const currentAddressBookmarked = $derived(
		ui.selectedAddress
			? isBookmarked(
					{ schemaVersion: 1, bookmarks: ui.bookmarks },
					ui.selectedAddress.lat,
					ui.selectedAddress.lng
				)
			: false
	);

	const inComparePickMode = $derived(ui.compareMode && !ui.comparisonAddress);

	function handleCompareSelect(bookmark: Bookmark): void {
		setComparisonAddress(ui, bookmarkToSuggestion(bookmark));
	}
</script>

<SiteHeader
	{geocode}
	{onSelect}
	activeLayerCount={ui.activeLayerSlugs.length}
	onOpenLayerPalette={onLanding ? undefined : openLayerPalette}
	bookmarkCount={ui.bookmarks.length}
	{currentAddressBookmarked}
	onOpenBookmarks={onLanding ? undefined : openBookmarks}
	searchCollapsed={ui.inspectorOpen || ui.compareMode}
	{atlasCtaHref}
/>

<main id="main">
	{@render children()}
</main>

<BookmarkDialog
	showCompareAction={inComparePickMode}
	onCompareSelect={handleCompareSelect}
/>
