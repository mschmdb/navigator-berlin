<script lang="ts">
	import SiteHeader from '$lib/components/atlas/site-header.svelte';
	import BookmarkDialog from '$lib/components/atlas/bookmark-dialog.svelte';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import { provideAddressSelection } from '$lib/state/address-selection.svelte.js';
	import { getUiState } from '$lib/state/ui-context.svelte.js';
	import { isBookmarked } from '$lib/state/bookmark-store.js';

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

<BookmarkDialog />
