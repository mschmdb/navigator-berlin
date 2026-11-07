<!-- Kapitel 2 (#190): Regler für die Schwelle über einer Karte. -->
<script lang="ts">
	import { Regler } from '$lib/components/stories/quadrate';
	import { m } from '$lib/paraglide/messages.js';
	import type { HandbuchBezirk } from '$lib/stories/wahl-quadrate/handbuch-daten';
	import Karte from './karte.svelte';
	import { percent } from './texte';

	interface Props {
		readonly bezirk: HandbuchBezirk;
	}

	let { bezirk }: Props = $props();
	let schwelle = $state(5);
</script>

<div class="hb-ctls">
	<Regler
		label={m.bq_hb_schwelle_label()}
		min={0}
		max={10}
		value={schwelle}
		format={percent}
		help={m.bq_hb_schwelle_help()}
		oninput={(v) => (schwelle = v)}
	/>
</div>
<div class="hb-stage">
	<Karte
		name={bezirk.name}
		typ="agh"
		jahr={2026}
		ergebnis={bezirk.wahlen.agh26}
		threshold={schwelle / 100}
	/>
</div>
