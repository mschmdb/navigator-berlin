<script lang="ts">
	import SiteHeader from '$lib/components/atlas/site-header.svelte';
	import BookmarkDialog from '$lib/components/atlas/bookmark-dialog.svelte';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import { provideAddressSelection } from '$lib/state/address-selection.svelte.js';
	import { getUiState, setComparisonAddress } from '$lib/state/ui-context.svelte.js';
	import { isBookmarked, bookmarkToSuggestion } from '$lib/state/bookmark-store.js';
	import type { Bookmark } from '$lib/state/bookmark-schema.js';

	let { children } = $props();

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
	onOpenLayerPalette={openLayerPalette}
	bookmarkCount={ui.bookmarks.length}
	{currentAddressBookmarked}
	onOpenBookmarks={openBookmarks}
/>

<main id="main">
	{@render children()}
</main>

<BookmarkDialog
	showCompareAction={inComparePickMode}
	onCompareSelect={handleCompareSelect}
/>
