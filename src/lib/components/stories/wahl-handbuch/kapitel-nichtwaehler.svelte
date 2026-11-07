<!-- Kapitel 4 (#190): Nichtwähler mitzählen, startet eingeschaltet (Runde 20c). -->
<script lang="ts">
	import { Schalter } from '$lib/components/stories/quadrate';
	import { m } from '$lib/paraglide/messages.js';
	import type { HandbuchBezirk } from '$lib/stories/wahl-quadrate/handbuch-daten';
	import Karte from './karte.svelte';

	interface Props {
		readonly bezirk: HandbuchBezirk;
	}

	let { bezirk }: Props = $props();
	let mitzaehlen = $state(true);
</script>

<div class="hb-ctls">
	<Schalter
		label={m.bq_hb_nonvoters_label()}
		text={m.bq_hb_nonvoters_text()}
		bind:pressed={mitzaehlen}
		help={m.bq_hb_nonvoters_help()}
	/>
</div>
<div class="hb-stage">
	<Karte
		name={bezirk.name}
		typ="agh"
		jahr={2026}
		ergebnis={bezirk.wahlen.agh26}
		nonVoters={mitzaehlen}
	/>
</div>
