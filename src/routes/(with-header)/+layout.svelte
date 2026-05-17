<script lang="ts">
	import { page } from '$app/state';
	import SiteHeader from '$lib/components/atlas/site-header.svelte';
	import BookmarkDialog from '$lib/components/atlas/bookmark-dialog.svelte';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import { provideAddressSelection } from '$lib/state/address-selection.svelte.js';
	import {
		getUiState,
		setComparisonAddress,
		openPalette,
		openBookmarksDialog
	} from '$lib/state/ui-context.svelte.js';
	import { isBookmarked, bookmarkToSuggestion } from '$lib/state/bookmark-store.js';
	import type { Bookmark } from '$lib/state/bookmark-schema.js';

	let { children } = $props();

	/**
	 * GH-Issue #8: Atlas-Aktionen (Such-Bar, Layer-Palette, Bookmark) sind
	 * nur im Karten-Kontext (`/explore`) sinnvoll. Auf allen anderen Routen
	 * (Hero-Landing, /methodik, /lizenzen, /updates, /bezirk, /kiez,
	 * /layer/[slug], /wo-lebt-es-sich-gut) zeigt der Header statt Such-Bar
	 * einen Atlas-CTA, und Layer/Bookmark-Trigger werden ausgeblendet.
	 */
	const offAtlas = $derived(!page.url.pathname.startsWith('/explore'));
	const atlasCtaHref = $derived(offAtlas ? '/explore' : undefined);

	const geocode = async (q: string): Promise<GeocodeSuggestion[]> => geocodeAddress({ q }).run();

	const selection = provideAddressSelection();
	const ui = getUiState();

	function onSelect(s: GeocodeSuggestion) {
		selection.set(s);
	}

	function openLayerPalette(): void {
		openPalette(ui);
	}

	function openBookmarks(): void {
		openBookmarksDialog(ui);
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
	onOpenLayerPalette={offAtlas ? undefined : openLayerPalette}
	bookmarkCount={ui.bookmarks.length}
	{currentAddressBookmarked}
	onOpenBookmarks={offAtlas ? undefined : openBookmarks}
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
