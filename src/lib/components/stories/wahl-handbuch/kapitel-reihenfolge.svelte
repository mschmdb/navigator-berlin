<!-- Kapitel 3 (#190): feste Plätze oder nach Größe, 2016 neben 2026. -->
<script lang="ts">
	import type { HandbuchBezirk } from '$lib/stories/wahl-quadrate/handbuch-daten';
	import type { OrderMode } from '$lib/stories/wahl-quadrate/layout';
	import Karte from './karte.svelte';
	import Reihenfolge from './reihenfolge.svelte';

	interface Props {
		readonly bezirk: HandbuchBezirk;
	}

	let { bezirk }: Props = $props();
	let order = $state<OrderMode>('fixed');
</script>

<div class="hb-ctls">
	<Reihenfolge bind:value={order} />
</div>
<div class="hb-stage pair">
	<Karte name={bezirk.name} typ="agh" jahr={2016} ergebnis={bezirk.wahlen.agh16} {order} />
	<Karte name={bezirk.name} typ="agh" jahr={2026} ergebnis={bezirk.wahlen.agh26} {order} />
</div>

<style>
	.pair :global(.hb-card) {
		width: min(100%, 300px);
	}
	@media (max-width: 640px) {
		.pair {
			flex-direction: column;
		}
		.pair :global(.hb-card) {
			width: 100%;
		}
	}
</style>
