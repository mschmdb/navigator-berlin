<script lang="ts">
	import ErgebnisPanel from '../ergebnis-panel.svelte';
	import {
		createWahlPortalState,
		applyWahlList,
		setJahr,
		type WahlPortalListEntry
	} from '$lib/state/wahl-portal-context.svelte.js';
	import type { WahlPortalReihe, WahlPortalEbene } from '$lib/utils/wahl-portal-url-state.js';

	type Props = {
		reihe?: WahlPortalReihe;
		ebene?: WahlPortalEbene;
		jahr?: number | null;
		wahlen?: WahlPortalListEntry[];
		fetchFn?: typeof fetch;
		highlightedSlug?: string | null;
		highlightedName?: string | null;
		anzeigeEbene?: WahlPortalEbene;
	};

	let {
		reihe = 'agh',
		ebene = 'kiez',
		jahr = null,
		wahlen = [],
		fetchFn,
		highlightedSlug = null,
		highlightedName = null,
		anzeigeEbene = 'kiez'
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	const portal = createWahlPortalState({ reihe, ebene, jahr });
	// svelte-ignore state_referenced_locally
	applyWahlList(portal, wahlen);

	// Re-appliziert einen geänderten `jahr`-Prop nach dem ersten Mount (Test-
	// Helper für „Jahr-Wechsel"-Szenarien, Muster: Steuerleiste ruft `setJahr`).
	// `jahr` MUSS vor dem frühen Return gelesen werden, sonst trackt der Effect
	// beim ersten (früh verlassenen) Lauf keine Abhängigkeit auf `jahr` und
	// feuert bei einem späteren Prop-Wechsel nie wieder (Svelte-5-Fallstrick).
	let firstRun = true;
	$effect(() => {
		const j = jahr;
		if (firstRun) {
			firstRun = false;
			return;
		}
		if (j !== null) setJahr(portal, j);
	});
</script>

<ErgebnisPanel {fetchFn} {highlightedSlug} {highlightedName} {anzeigeEbene} />
