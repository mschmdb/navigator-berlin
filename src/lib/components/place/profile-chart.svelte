<script lang="ts">
	import { Chart, Circle, Line, Svg, Text } from 'layerchart';
	import ChartAxis from './chart-axis.svelte';
	import { scaleLinear } from 'd3-scale';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { dimLabel, signedPoints } from '$lib/place/labels';
	import type { Dim, DimValues } from '$lib/place/types';
	import { chartMotion } from './motion.svelte';

	interface Props {
		dims: readonly Dim[];
		own: DimValues;
		ownLabel: string;
		refValues: DimValues;
		refLabel: string;
	}
	let { dims, own, ownLabel, refValues, refLabel }: Props = $props();

	const ROW = 44;
	const rows = $derived(
		dims.map((dim) => ({
			dim,
			label: dimLabel(dim, { locale: getLocale() }),
			own: own[dim],
			ref: refValues[dim]
		}))
	);
	const motion = $derived(chartMotion(450));
	const isContext = (d: Dim) => d === 'kriminalitaet';
</script>

<!-- Legende als HTML: Form statt nur Farbe (gefüllt = dieser Ort, Ring = Bezugspunkt) -->
<div class="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-dense-label text-ink-muted">
	<span class="inline-flex items-center gap-1.5"
		><span class="size-3 rounded-full bg-accent"></span>{ownLabel}</span
	>
	<span class="inline-flex items-center gap-1.5"
		><span class="size-3 rounded-full border-2 border-ink bg-bg"></span>{refLabel}</span
	>
</div>
<div style:height="{rows.length * ROW + 36}px">
	<Chart
		data={rows}
		x="own"
		xScale={scaleLinear()}
		xDomain={[0, 100]}
		padding={{ top: 4, right: 44, bottom: 28, left: 132 }}
	>
		{#snippet children({ context })}
			<Svg>
				<ChartAxis
					ticks={[0, 25, 50, 75, 100]}
					x={(v) => context.xScale(v)}
					format={(v) => String(v)}
					unit={m.place_profile_points()}
					top={0}
					bottom={rows.length * ROW}
					width={context.width}
				/>
				{#each rows as r, i (r.dim)}
					{@const cy = i * ROW + ROW / 2}
					{#if i > 0 && isContext(r.dim)}
						<line
							x1={-132}
							x2={context.width + 44}
							y1={cy - ROW / 2}
							y2={cy - ROW / 2}
							class="stroke-[var(--rule-strong)]"
							stroke-dasharray="2 3"
						/>
					{/if}
					<text
						x={-132}
						y={cy}
						dominant-baseline="middle"
						class="fill-[var(--ink)] text-[12px] {r.dim === 'composite' ? 'font-semibold' : ''}"
						>{r.label}</text
					>
					{#if r.own !== null && r.ref !== null}
						<Line
							x1={context.xScale(r.own)}
							x2={context.xScale(r.ref)}
							y1={cy}
							y2={cy}
							{motion}
							class="rv stroke-[var(--rule-strong)]"
							strokeWidth={3}
						/>
					{/if}
					{#if r.ref !== null}
						<Circle
							cx={context.xScale(r.ref)}
							{cy}
							r={6}
							{motion}
							class="rv fill-[var(--bg)] stroke-[var(--ink)]"
							strokeWidth={2}
						/>
					{/if}
					{#if r.own !== null}
						<Circle
							cx={context.xScale(r.own)}
							{cy}
							r={r.dim === 'composite' ? 8 : 7}
							class="rv {isContext(r.dim)
								? 'fill-[var(--severity-neutral)]'
								: 'fill-[var(--accent)]'}"
						/>
					{/if}
					{#if r.own !== null && r.ref !== null}
						<Text
							x={context.width + 40}
							y={cy}
							value={signedPoints(r.own - r.ref)}
							textAnchor="end"
							verticalAnchor="middle"
							class="fill-[var(--ink-muted)] text-[12px] tabular-nums"
						/>
					{/if}
				{/each}
			</Svg>
		{/snippet}
	</Chart>
</div>
