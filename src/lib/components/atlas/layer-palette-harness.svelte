<script lang="ts">
	import { untrack } from 'svelte';
	import { createUiState } from '$lib/state/ui-context.svelte.js';
	import type { Breakpoint } from '$lib/utils/use-viewport.svelte.js';
	import type { LayerMetadata } from '$lib/data';
	import LayerPalette from './layer-palette.svelte';

	type Props = {
		open?: boolean;
		layers?: LayerMetadata[];
		breakpoint?: Breakpoint;
		initialActive?: string[];
		initialRecent?: string[];
	};

	let {
		open = true,
		layers = [],
		breakpoint = 'desktop',
		initialActive = [],
		initialRecent = []
	}: Props = $props();

	const ui = createUiState();

	untrack(() => {
		ui.paletteOpen = open;
		ui.activeLayerSlugs = [...initialActive];
		ui.recentLayerSlugs = [...initialRecent];
	});
</script>

<LayerPalette {layers} initialBreakpoint={breakpoint} forceBreakpoint />
<pre data-testid="ui-dump">{JSON.stringify({
		paletteOpen: ui.paletteOpen,
		activeLayerSlugs: ui.activeLayerSlugs,
		recentLayerSlugs: ui.recentLayerSlugs
	})}</pre>
