<script lang="ts">
	import WechselKapitel from '../wechsel-kapitel.svelte';
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
	};

	let { reihe = 'agh', wahlen = [], fetchFn }: Props = $props();

	// svelte-ignore state_referenced_locally
	const portal = createWahlPortalState({ reihe, ebene: 'kiez', jahr: null });
	// svelte-ignore state_referenced_locally
	applyWahlList(portal, wahlen);
</script>

<WechselKapitel {fetchFn} />
