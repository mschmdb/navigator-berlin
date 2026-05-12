<script lang="ts">
	import { createUiState } from '$lib/state/ui-context.svelte.js';
	import type { LayerHit, GeocodeSuggestion, LayerMetadata } from '$lib/data';
	import InspectorPanel from './inspector-panel.svelte';

	type Props = {
		open?: boolean;
		address?: GeocodeSuggestion | null;
		hits?: LayerHit[];
		layerMeta?: LayerMetadata[];
	};

	let { open = true, address = null, hits = [], layerMeta = [] }: Props = $props();

	const ui = createUiState();

	$effect(() => {
		ui.inspectorOpen = open;
		ui.selectedAddress = address;
		ui.selectedLayerHits = hits;
	});
</script>

<InspectorPanel {layerMeta} />
