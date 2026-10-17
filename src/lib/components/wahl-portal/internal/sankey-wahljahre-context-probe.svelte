<script lang="ts">
	import SankeyWahljahre from '../sankey-wahljahre.svelte';
	import {
		createWahlPortalState,
		applyWahlList,
		type WahlPortalListEntry
	} from '$lib/state/wahl-portal-context.svelte.js';
	import type { WahlPortalReihe } from '$lib/utils/wahl-portal-url-state.js';

	type Props = {
		reihe?: WahlPortalReihe;
		wahlen?: WahlPortalListEntry[];
		fetchFn?: typeof fetch;
		showCoverageHinweis?: boolean;
	};

	let { reihe = 'agh', wahlen = [], fetchFn, showCoverageHinweis }: Props = $props();

	// svelte-ignore state_referenced_locally
	const portal = createWahlPortalState({ reihe, ebene: 'kiez', jahr: null });
	// svelte-ignore state_referenced_locally
	applyWahlList(portal, wahlen);
</script>

<SankeyWahljahre {fetchFn} {showCoverageHinweis} />
