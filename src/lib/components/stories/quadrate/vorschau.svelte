<!--
	Miniatur von „Berlin in Quadraten“ für die Übersicht und den Startseiten-Teaser: die zwölf
	Bezirke als Quadrate ohne Zahlen, auf Papier mit Rahmen wie die Komposition von „Punkt,
	Linie, Kiez“. Dekorativ, der Titel-Link trägt den Namen.
-->
<script lang="ts">
	import { colorsInOrder } from '$lib/stories/wahl-quadrate/farben';
	import { layout, SIDE } from '$lib/stories/wahl-quadrate/layout';
	import { STORY_INK, STORY_PAPER } from '$lib/stories/tokens';

	interface Props {
		readonly shares: readonly (readonly number[])[];
		readonly size?: number;
	}

	let { shares, size = 112 }: Props = $props();

	const COLS = 4;
	const ROWS = 3;
	const colors = colorsInOrder();
	const pad = $derived(size * 0.08);
	const gap = $derived(size * 0.05);
	const sq = $derived((size - 2 * pad - (COLS - 1) * gap) / COLS);
	const top = $derived((size - ROWS * sq - (ROWS - 1) * gap) / 2);
	const blocks = $derived(shares.map((s) => layout(s)));
</script>

<svg width={size} height={size} viewBox="0 0 {size} {size}" aria-hidden="true" focusable="false">
	<rect x="0.5" y="0.5" width={size - 1} height={size - 1} fill={STORY_PAPER} stroke={STORY_INK} />
	{#each blocks as bs, i (i)}
		<g
			data-testid="bq-vorschau-quadrat"
			transform="translate({pad + (i % COLS) * (sq + gap)} {top +
				Math.floor(i / COLS) * (sq + gap)}) scale({sq / SIDE})"
		>
			{#each bs as r, k (k)}
				{#if r.w > 0 && r.h > 0}
					<rect x={r.x} y={r.y} width={r.w} height={r.h} fill={colors[k]} />
				{/if}
			{/each}
		</g>
	{/each}
</svg>
