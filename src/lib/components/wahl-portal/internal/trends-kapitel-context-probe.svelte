<script lang="ts">
	import TrendsKapitel from '../trends-kapitel.svelte';
	import {
		createWahlPortalState,
		applyWahlList,
		type WahlPortalListEntry
	} from '$lib/state/wahl-portal-context.svelte.js';
	import type { WahlPortalReihe } from '$lib/utils/wahl-portal-url-state.js';
	import type { TrendsMapControllerOptions } from './trends-kapitel-maplibre.svelte.js';

	type Props = {
		reihe?: WahlPortalReihe;
		wahlen?: WahlPortalListEntry[];
		fetchFn?: typeof fetch;
		mapFactory?: TrendsMapControllerOptions['mapFactory'];
	};

	let { reihe = 'agh', wahlen = [], fetchFn, mapFactory }: Props = $props();

	// svelte-ignore state_referenced_locally
	const portal = createWahlPortalState({ reihe, ebene: 'kiez', jahr: null });
	// svelte-ignore state_referenced_locally
	applyWahlList(portal, wahlen);
</script>

<TrendsKapitel {fetchFn} {mapFactory} />
