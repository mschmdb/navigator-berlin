<!--
	Miniatur von „Berlin in Quadraten“ für die Übersicht und den Startseiten-Teaser: ein
	Quadrat ohne Zahlen, dasselbe Motiv wie die OG-Karte. Dekorativ, der Titel-Link trägt
	den Namen.
-->
<script lang="ts">
	import { colorsInOrder } from '$lib/stories/wahl-quadrate/farben';
	import { layout, SIDE } from '$lib/stories/wahl-quadrate/layout';

	interface Props {
		readonly shares: readonly number[];
		readonly size?: number;
	}

	let { shares, size = 112 }: Props = $props();

	const colors = colorsInOrder();
	const blocks = $derived(layout(shares));
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 {SIDE} {SIDE}"
	aria-hidden="true"
	focusable="false"
	shape-rendering="crispEdges"
>
	<g data-testid="bq-vorschau-quadrat">
		{#each blocks as r, k (k)}
			{#if r.w > 0 && r.h > 0}
				<rect x={r.x} y={r.y} width={r.w} height={r.h} fill={colors[k]} />
			{/if}
		{/each}
	</g>
</svg>
