<!-- Umschalter „Parteien: Feste Plätze / Nach Größe“ für Kapitel 3 und 5 (#190). -->
<script lang="ts">
	import { Segmente } from '$lib/components/stories/quadrate';
	import { m } from '$lib/paraglide/messages.js';
	import type { OrderMode } from '$lib/stories/wahl-quadrate/layout';

	interface Props {
		value: OrderMode;
	}

	let { value = $bindable() }: Props = $props();
</script>

<Segmente
	label={m.bq_hb_order_label()}
	items={[
		{ value: 'fixed', text: m.bq_hb_order_fixed(), help: m.bq_hb_order_fixed_help() },
		{ value: 'size', text: m.bq_hb_order_size(), help: m.bq_hb_order_size_help() }
	]}
	bind:value
/>
