<script lang="ts">
	import SiteHeader from '$lib/components/atlas/site-header.svelte';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import type { GeocodeSuggestion } from '$lib/data';
	import { provideAddressSelection } from '$lib/state/address-selection.svelte.js';

	let { children } = $props();

	const geocode = async (q: string): Promise<GeocodeSuggestion[]> => geocodeAddress({ q }).run();

	const selection = provideAddressSelection();

	function onSelect(s: GeocodeSuggestion) {
		selection.set(s);
	}
</script>

<SiteHeader {geocode} {onSelect} />

<main id="main">
	{@render children()}
</main>
