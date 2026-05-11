<script lang="ts">
	import SiteHeader from '$lib/components/atlas/site-header.svelte';
	import { geocodeAddress } from '$lib/data/geocode.remote.js';
	import type { GeocodeSuggestion } from '$lib/data';

	let { children } = $props();

	const geocode = async (q: string): Promise<GeocodeSuggestion[]> => geocodeAddress({ q });
</script>

<SiteHeader {geocode} />

<main id="main">
	{@render children()}
</main>
