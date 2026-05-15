<script lang="ts">
	import { createUiState } from '$lib/state/ui-context.svelte.js';
	import type { GeocodeSuggestion, LayerHit, LayerMetadata } from '$lib/data';
	import ComparePanel from './compare-panel.svelte';

	type Props = {
		compareMode?: boolean;
		selectedAddress?: GeocodeSuggestion | null;
		comparisonAddress?: GeocodeSuggestion | null;
		selectedLayerHits?: LayerHit[];
		comparisonLayerHits?: LayerHit[];
		comparisonLoading?: boolean;
		layerMeta?: LayerMetadata[];
		geocode?: (q: string) => Promise<GeocodeSuggestion[]>;
		onOpenBookmarkPicker?: () => void;
	};

	let {
		compareMode = true,
		selectedAddress = null,
		comparisonAddress = null,
		selectedLayerHits = [],
		comparisonLayerHits = [],
		comparisonLoading = false,
		layerMeta = [],
		geocode,
		onOpenBookmarkPicker
	}: Props = $props();

	const ui = createUiState();

	$effect(() => {
		ui.compareMode = compareMode;
		ui.selectedAddress = selectedAddress;
		ui.comparisonAddress = comparisonAddress;
		ui.selectedLayerHits = selectedLayerHits;
		ui.comparisonLayerHits = comparisonLayerHits;
		ui.comparisonLoading = comparisonLoading;
	});
</script>

<ComparePanel {layerMeta} {geocode} {onOpenBookmarkPicker} />
