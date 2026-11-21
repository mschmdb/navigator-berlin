<script lang="ts">
	import WinnerMap from '../winner-map.svelte';
	import {
		createWahlPortalState,
		applyWahlList,
		type WahlPortalListEntry
	} from '#lib/state/wahl-portal-context.svelte.js';
	import type { WahlPortalReihe, WahlPortalEbene } from '#lib/utils/wahl-portal-url-state.js';
	import type { GeocodeSuggestion } from '#lib/data/index.ts';
	import type { ComponentProps } from 'svelte';

	type Props = {
		reihe?: WahlPortalReihe;
		ebene?: WahlPortalEbene;
		jahr?: number | null;
		wahlen?: WahlPortalListEntry[];
		fetchFn?: typeof fetch;
		geocodeFn?: (q: string) => Promise<GeocodeSuggestion[]>;
		mapFactory?: ComponentProps<typeof WinnerMap>['mapFactory'];
	};

	let {
		reihe = 'agh',
		ebene = 'kiez',
		jahr = null,
		wahlen = [],
		fetchFn,
		geocodeFn,
		mapFactory
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	const portal = createWahlPortalState({ reihe, ebene, jahr });
	// svelte-ignore state_referenced_locally
	applyWahlList(portal, wahlen);
</script>

<WinnerMap {fetchFn} {geocodeFn} {mapFactory} />
