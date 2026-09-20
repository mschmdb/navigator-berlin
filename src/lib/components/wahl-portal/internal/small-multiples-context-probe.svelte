<script lang="ts">
	import SmallMultiples from '../small-multiples.svelte';
	import {
		createWahlPortalState,
		applyWahlList,
		type WahlPortalListEntry
	} from '$lib/state/wahl-portal-context.svelte.js';
	import type { WahlPortalReihe, WahlPortalEbene } from '$lib/utils/wahl-portal-url-state.js';

	type Props = {
		reihe?: WahlPortalReihe;
		ebene?: WahlPortalEbene;
		jahr?: number | null;
		wahlen?: WahlPortalListEntry[];
		fetchFn?: typeof fetch;
	};

	let { reihe = 'agh', ebene = 'kiez', jahr = null, wahlen = [], fetchFn }: Props = $props();

	// svelte-ignore state_referenced_locally
	const portal = createWahlPortalState({ reihe, ebene, jahr });
	// svelte-ignore state_referenced_locally
	applyWahlList(portal, wahlen);
</script>

<SmallMultiples {fetchFn} />
