<script lang="ts">
	import SiteHeader from '$lib/components/atlas/site-header.svelte';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import { provideAddressSelection } from '$lib/state/address-selection.svelte.js';
	import { getUiState } from '$lib/state/ui-context.svelte.js';

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
</script>

<SiteHeader
	{geocode}
	{onSelect}
	activeLayerCount={ui.activeLayerSlugs.length}
	onOpenLayerPalette={openLayerPalette}
/>

<main id="main">
	{@render children()}
</main>
