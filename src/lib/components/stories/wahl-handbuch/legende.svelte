<!-- Legende der Quadratfarben (#190), Grau mit Schwelle. -->
<script lang="ts">
	import { partyName } from '$lib/components/stories/quadrate';
	import { m } from '$lib/paraglide/messages.js';
	import { PARTY_COLORS } from '$lib/stories/wahl-quadrate/farben';
	import { DEFAULT_THRESHOLD } from '$lib/stories/wahl-quadrate/grau';
	import { ORDER } from '$lib/stories/wahl-quadrate/parteien';
	import { percent } from './texte';

	const grey = m.bq_hb_legend_grey({ threshold: percent(Math.round(DEFAULT_THRESHOLD * 100)) });
</script>

<ul class="legend" aria-label={m.bq_hb_legend_label()} data-testid="hb-legende">
	{#each ORDER as key (key)}
		<li>
			<span class="sw" style:background={PARTY_COLORS[key]} aria-hidden="true"></span>
			{key === 'rest' ? grey : partyName(key)}
		</li>
	{/each}
</ul>

<style>
	.legend {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 6px 18px;
		padding: 0;
		margin: 0 0 var(--hb-s3);
		font-size: 15px;
	}
	.sw {
		display: inline-block;
		width: 14px;
		height: 14px;
		margin-right: 6px;
		vertical-align: -2px;
	}
</style>
