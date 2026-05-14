<script lang="ts">
	import { createUiState } from '$lib/state/ui-context.svelte.js';
	import type {
		LayerHit,
		GeocodeSuggestion,
		LayerMetadata,
		ClimateStation,
		ClimateData,
		OepnvStopIndex
	} from '$lib/data';
	import InspectorPanel from './inspector-panel.svelte';

	type Props = {
		open?: boolean;
		address?: GeocodeSuggestion | null;
		hits?: LayerHit[];
		layerMeta?: LayerMetadata[];
		nearestStation?: ClimateStation | null;
		climateSeries?: ClimateData | null;
		oepnvStopIndex?: OepnvStopIndex | null;
	};

	let {
		open = true,
		address = null,
		hits = [],
		layerMeta = [],
		nearestStation = null,
		climateSeries = null,
		oepnvStopIndex = null
	}: Props = $props();

	const ui = createUiState();

	$effect(() => {
		ui.inspectorOpen = open;
		ui.selectedAddress = address;
		ui.selectedLayerHits = hits;
		ui.nearestStation = nearestStation;
		ui.climateSeries = climateSeries;
		ui.oepnvStopIndex = oepnvStopIndex;
	});
</script>

<InspectorPanel {layerMeta} />
